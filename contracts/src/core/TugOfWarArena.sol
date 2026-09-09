// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IFriendzoneNFT} from "../interfaces/IFriendzoneNFT.sol";
import {VRFConsumer} from "../randomness/VRFConsumer.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";
import {MathUtils} from "../utils/MathUtils.sol";

/**
 * @title TugOfWarArena
 * @notice On-chain match staking, settlement, and wearable rewards for Tug of War Arena.
 * @dev High-frequency pulls stay off-chain (mobile + game server). This contract
 *      records the lobby, collects FZONE entry fees, and lets the match operator
 *      settle the Sun/Moon result that the authoritative server already computed.
 *
 *      Win threshold (44) and default duration (30s) match `lib/game-rules.ts`.
 */
contract TugOfWarArena is Ownable, ReentrancyGuard, VRFConsumer {
    using SafeERC20 for IERC20;

    enum MatchStatus {
        Waiting,
        Active,
        Finished
    }

    enum Team {
        Sun,
        Moon
    }

    struct Player {
        address wallet;
        string displayName;
        Team team;
        uint256 power;
        bool isReady;
    }

    struct Match {
        uint256 id;
        address[] players;
        mapping(address => Player) playerData;
        mapping(Team => uint256) teamPower;
        uint256 startTime;
        uint256 endTime;
        MatchStatus status;
        Team winner;
        uint256 prizePool;
        bool prizeClaimed;
        uint256 randomSeed;
        uint256 vrfRequestId;
    }

    IERC20 public immutable fzoneToken;
    IFriendzoneNFT public friendzoneNFT;

    address public matchOperator;
    uint256 public entryFee = 10 * 10 ** 18;
    uint256 public maxPlayers = 8;
    uint256 public minPlayersToStart = 2;
    uint256 public autoStartPlayers = 4;
    uint256 public matchDuration = 30;
    uint256 public winThreshold = 44;
    uint256 public winnerShareBps = 8_000;
    uint256 public maxPullDelta = 20;

    uint256 private _nextMatchId = 1;
    mapping(uint256 => Match) private _matches;
    mapping(address => uint256) public playerElo;
    mapping(uint256 => uint256) public requestToMatchId;
    uint256 private _pendingMatchId;

    event MatchCreated(uint256 indexed matchId, address indexed host, string displayName);
    event PlayerJoined(uint256 indexed matchId, address indexed player, Team team, string displayName);
    event PlayerLeft(uint256 indexed matchId, address indexed player);
    event MatchStarted(uint256 indexed matchId, uint256 startTime);
    event PowerUpdated(uint256 indexed matchId, address indexed player, uint256 delta, uint256 playerPower);
    event MatchFinished(uint256 indexed matchId, Team winner, uint256 prizePool, uint256 sunPower, uint256 moonPower);
    event PrizeDistributed(uint256 indexed matchId, address indexed winner, uint256 amount);
    event NFTAwarded(address indexed to, uint256 indexed tokenId, uint8 rarity, uint256 indexed matchId);
    event MatchOperatorUpdated(address indexed operator);
    event ArenaConfigUpdated(uint256 entryFee, uint256 matchDuration, uint256 winThreshold);

    error InvalidMatch();
    error InvalidName();
    error AlreadyInMatch();
    error NotInMatch();
    error MatchNotWaiting();
    error MatchNotActive();
    error MatchFull();
    error NotAuthorized();
    error NotEnoughPlayers();
    error InvalidDelta();
    error AlreadyFinished();
    error TransferFailed();
    error UnknownVrfRequest();

    modifier onlyOperator() {
        if (msg.sender != matchOperator && msg.sender != owner()) revert NotAuthorized();
        _;
    }

    constructor(
        address fzoneToken_,
        address friendzoneNFT_,
        address vrfCoordinator,
        uint64 subscriptionId,
        bytes32 keyHash,
        address initialOwner
    ) Ownable(initialOwner) VRFConsumer(vrfCoordinator, subscriptionId, keyHash) {
        fzoneToken = IERC20(fzoneToken_);
        friendzoneNFT = IFriendzoneNFT(friendzoneNFT_);
        matchOperator = initialOwner;
    }

    function createMatch(string calldata displayName) external nonReentrant returns (uint256 matchId) {
        _validateName(displayName);
        fzoneToken.safeTransferFrom(msg.sender, address(this), entryFee);

        matchId = _nextMatchId;
        unchecked {
            ++_nextMatchId;
        }

        Match storage game = _matches[matchId];
        game.id = matchId;
        game.status = MatchStatus.Waiting;
        game.prizePool = entryFee;

        _addPlayer(game, msg.sender, displayName);
        emit MatchCreated(matchId, msg.sender, displayName);
    }

    function joinMatch(uint256 matchId, string calldata displayName) external nonReentrant {
        _validateName(displayName);
        Match storage game = _requireWaiting(matchId);
        if (game.players.length >= maxPlayers) revert MatchFull();
        if (game.playerData[msg.sender].wallet != address(0)) revert AlreadyInMatch();

        fzoneToken.safeTransferFrom(msg.sender, address(this), entryFee);
        game.prizePool += entryFee;
        _addPlayer(game, msg.sender, displayName);

        if (game.players.length >= autoStartPlayers) {
            _startMatch(game);
        }
    }

    function leaveMatch(uint256 matchId) external nonReentrant {
        Match storage game = _requireWaiting(matchId);
        if (game.playerData[msg.sender].wallet == address(0)) revert NotInMatch();

        _removePlayer(game, msg.sender);
        game.prizePool -= entryFee;
        fzoneToken.safeTransfer(msg.sender, entryFee);
        emit PlayerLeft(matchId, msg.sender);
    }

    function startMatch(uint256 matchId) external {
        Match storage game = _requireWaiting(matchId);
        if (game.players.length < minPlayersToStart) revert NotEnoughPlayers();
        if (msg.sender != game.players[0] && msg.sender != matchOperator && msg.sender != owner()) {
            revert NotAuthorized();
        }
        _startMatch(game);
    }

    /**
     * @notice Operator-relayed pull checkpoint. Clients do not submit this directly;
     *         the game server rate-limits taps and forwards legal deltas.
     */
    function updatePower(uint256 matchId, address player, uint256 delta) external onlyOperator {
        Match storage game = _requireActive(matchId);
        Player storage profile = game.playerData[player];
        if (profile.wallet == address(0)) revert NotInMatch();
        if (delta == 0 || delta > maxPullDelta) revert InvalidDelta();

        profile.power += delta;
        game.teamPower[profile.team] += delta;
        emit PowerUpdated(matchId, player, delta, profile.power);

        uint256 sunPower = game.teamPower[Team.Sun];
        uint256 moonPower = game.teamPower[Team.Moon];
        if (sunPower >= moonPower + winThreshold) {
            _finishMatch(game, Team.Sun);
        } else if (moonPower >= sunPower + winThreshold) {
            _finishMatch(game, Team.Moon);
        }
    }

    /**
     * @notice Authoritative settlement used when the timer expires or the server
     *         already knows the winner. Powers must match the recorded winner.
     */
    function settleMatch(uint256 matchId, uint256 sunPower, uint256 moonPower) external onlyOperator {
        Match storage game = _requireActive(matchId);
        game.teamPower[Team.Sun] = sunPower;
        game.teamPower[Team.Moon] = moonPower;

        Team winner;
        if (sunPower >= moonPower + winThreshold) {
            winner = Team.Sun;
        } else if (moonPower >= sunPower + winThreshold) {
            winner = Team.Moon;
        } else if (sunPower == moonPower) {
            winner = uint256(keccak256(abi.encode(matchId, sunPower, moonPower, block.prevrandao))) % 2 == 0
                ? Team.Sun
                : Team.Moon;
        } else {
            winner = sunPower > moonPower ? Team.Sun : Team.Moon;
        }
        _finishMatch(game, winner);
    }

    function getMatch(uint256 matchId)
        external
        view
        returns (
            uint256 id,
            address[] memory players,
            uint256 startTime,
            uint256 endTime,
            MatchStatus status,
            Team winner,
            uint256 prizePool,
            uint256 sunPower,
            uint256 moonPower
        )
    {
        Match storage game = _matches[matchId];
        if (game.id == 0) revert InvalidMatch();
        return (
            game.id,
            game.players,
            game.startTime,
            game.endTime,
            game.status,
            game.winner,
            game.prizePool,
            game.teamPower[Team.Sun],
            game.teamPower[Team.Moon]
        );
    }

    function getPlayerInMatch(uint256 matchId, address player) external view returns (Player memory) {
        if (_matches[matchId].id == 0) revert InvalidMatch();
        return _matches[matchId].playerData[player];
    }

    function nextMatchId() external view returns (uint256) {
        return _nextMatchId;
    }

    function getMatchVrfRequestId(uint256 matchId) external view returns (uint256) {
        if (_matches[matchId].id == 0) revert InvalidMatch();
        return _matches[matchId].vrfRequestId;
    }

    function setMatchOperator(address operator) external onlyOwner {
        matchOperator = operator;
        emit MatchOperatorUpdated(operator);
    }

    function setFriendzoneNFT(address nft) external onlyOwner {
        friendzoneNFT = IFriendzoneNFT(nft);
    }

    function setEntryFee(uint256 newFee) external onlyOwner {
        entryFee = newFee;
        emit ArenaConfigUpdated(entryFee, matchDuration, winThreshold);
    }

    function setMatchDuration(uint256 newDuration) external onlyOwner {
        matchDuration = newDuration;
        emit ArenaConfigUpdated(entryFee, matchDuration, winThreshold);
    }

    function setWinThreshold(uint256 newThreshold) external onlyOwner {
        winThreshold = newThreshold;
        emit ArenaConfigUpdated(entryFee, matchDuration, winThreshold);
    }

    function setWinnerShareBps(uint256 newBps) external onlyOwner {
        require(newBps <= MathUtils.BPS_DENOMINATOR, "Invalid bps");
        winnerShareBps = newBps;
    }

    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 matchId = requestToMatchId[requestId];
        if (matchId == 0) matchId = _pendingMatchId;
        if (matchId == 0) revert UnknownVrfRequest();
        requestToMatchId[requestId] = matchId;

        Match storage game = _matches[matchId];
        game.randomSeed = randomWords[0];
        uint8 rarity = MathUtils.rarityFromRandom(randomWords[0]);
        emit RandomWordsFulfilled(requestId, randomWords);

        uint256 winnersCount = _countWinners(game, game.winner);
        if (winnersCount == 0) return;

        uint256 word = randomWords.length > 1 ? randomWords[1] : randomWords[0];
        uint256 pick = word % winnersCount;
        address recipient = _winnerAt(game, game.winner, pick);

        try friendzoneNFT.mintRandom(recipient, rarity) returns (uint256 tokenId) {
            emit NFTAwarded(recipient, tokenId, rarity, matchId);
        } catch {
            emit NFTAwarded(recipient, 0, rarity, matchId);
        }
    }

    function _addPlayer(Match storage game, address wallet, string calldata displayName) private {
        Team team = _assignTeam(game);
        game.players.push(wallet);
        game.playerData[wallet] = Player({
            wallet: wallet,
            displayName: displayName,
            team: team,
            power: 0,
            isReady: false
        });
        emit PlayerJoined(game.id, wallet, team, displayName);
    }

    function _removePlayer(Match storage game, address wallet) private {
        uint256 length = game.players.length;
        for (uint256 i = 0; i < length; ++i) {
            if (game.players[i] == wallet) {
                game.players[i] = game.players[length - 1];
                game.players.pop();
                delete game.playerData[wallet];
                return;
            }
        }
        revert NotInMatch();
    }

    function _assignTeam(Match storage game) private view returns (Team) {
        uint256 sunCount;
        uint256 moonCount;
        uint256 length = game.players.length;
        for (uint256 i = 0; i < length; ++i) {
            if (game.playerData[game.players[i]].team == Team.Sun) {
                unchecked {
                    ++sunCount;
                }
            } else {
                unchecked {
                    ++moonCount;
                }
            }
        }
        return sunCount <= moonCount ? Team.Sun : Team.Moon;
    }

    function _startMatch(Match storage game) private {
        game.status = MatchStatus.Active;
        game.startTime = block.timestamp;
        emit MatchStarted(game.id, game.startTime);
    }

    function _finishMatch(Match storage game, Team winner) private {
        if (game.status == MatchStatus.Finished) revert AlreadyFinished();
        game.status = MatchStatus.Finished;
        game.winner = winner;
        game.endTime = block.timestamp;
        game.prizeClaimed = true;

        uint256 prizeAmount = MathUtils.pct(game.prizePool, winnerShareBps);
        _distributePrize(game, winner, prizeAmount);
        _updatePlayerElo(game, winner);

        _pendingMatchId = game.id;
        uint256 requestId = _requestRandomWords(game.id);
        game.vrfRequestId = requestId;
        requestToMatchId[requestId] = game.id;
        _pendingMatchId = 0;

        emit MatchFinished(game.id, winner, prizeAmount, game.teamPower[Team.Sun], game.teamPower[Team.Moon]);
    }

    function _distributePrize(Match storage game, Team winner, uint256 amount) private {
        uint256 winnersCount = _countWinners(game, winner);
        if (winnersCount == 0 || amount == 0) return;

        (uint256 share, uint256 remainder) = MathUtils.shareEvenly(amount, winnersCount);
        bool remainderPaid;
        uint256 length = game.players.length;
        for (uint256 i = 0; i < length; ++i) {
            address player = game.players[i];
            if (game.playerData[player].team != winner) continue;
            uint256 payout = share;
            if (!remainderPaid && remainder > 0) {
                payout += remainder;
                remainderPaid = true;
            }
            fzoneToken.safeTransfer(player, payout);
            emit PrizeDistributed(game.id, player, payout);
        }
    }

    function _updatePlayerElo(Match storage game, Team winner) private {
        uint256 length = game.players.length;
        for (uint256 i = 0; i < length; ++i) {
            address player = game.players[i];
            if (game.playerData[player].team == winner) {
                playerElo[player] += 10;
            } else if (playerElo[player] >= 5) {
                playerElo[player] -= 5;
            } else {
                playerElo[player] = 0;
            }
        }
    }

    function _countWinners(Match storage game, Team winner) private view returns (uint256 count) {
        uint256 length = game.players.length;
        for (uint256 i = 0; i < length; ++i) {
            if (game.playerData[game.players[i]].team == winner) {
                unchecked {
                    ++count;
                }
            }
        }
    }

    function _winnerAt(Match storage game, Team winner, uint256 index) private view returns (address) {
        uint256 cursor;
        uint256 length = game.players.length;
        for (uint256 i = 0; i < length; ++i) {
            address player = game.players[i];
            if (game.playerData[player].team != winner) continue;
            if (cursor == index) return player;
            unchecked {
                ++cursor;
            }
        }
        return game.players[0];
    }

    function _requireWaiting(uint256 matchId) private view returns (Match storage game) {
        game = _matches[matchId];
        if (game.id == 0) revert InvalidMatch();
        if (game.status != MatchStatus.Waiting) revert MatchNotWaiting();
    }

    function _requireActive(uint256 matchId) private view returns (Match storage game) {
        game = _matches[matchId];
        if (game.id == 0) revert InvalidMatch();
        if (game.status != MatchStatus.Active) revert MatchNotActive();
    }

    function _validateName(string calldata displayName) private pure {
        bytes memory raw = bytes(displayName);
        if (raw.length < 2 || raw.length > 20) revert InvalidName();
    }
}
