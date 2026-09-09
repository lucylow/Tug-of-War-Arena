// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IFriendzoneNFT} from "../interfaces/IFriendzoneNFT.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";

/**
 * @title TournamentBracket
 * @notice On-chain Plaza tournament: players lock a wearable and FZONE, operator advances the bracket.
 */
contract TournamentBracket is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum TournamentStatus {
        Registration,
        Active,
        Completed
    }

    struct Tournament {
        uint256 id;
        string name;
        uint256 entryFee;
        uint256 prizePool;
        TournamentStatus status;
        uint256 maxPlayers;
        address[] players;
        mapping(address => uint256) playerTokenId;
        mapping(address => bool) registered;
        mapping(uint256 => address) roundWinner;
        uint256 currentRound;
        address winner;
        uint256 createdAt;
        bool nftsReturned;
    }

    IERC20 public immutable fzoneToken;
    IFriendzoneNFT public nftContract;

    mapping(uint256 => Tournament) private _tournaments;
    uint256 private _nextTournamentId = 1;

    event TournamentCreated(uint256 indexed id, string name, uint256 entryFee, uint256 maxPlayers);
    event PlayerRegistered(uint256 indexed id, address indexed player, uint256 tokenId);
    event TournamentStarted(uint256 indexed id, uint256 playerCount);
    event MatchCompleted(uint256 indexed id, uint256 round, address indexed winner);
    event TournamentWinner(uint256 indexed id, address indexed winner, uint256 prizePool);
    event WearablesReturned(uint256 indexed id);

    error UnknownTournament();
    error RegistrationClosed();
    error TournamentFull();
    error NotTokenOwner();
    error AlreadyRegistered();
    error InvalidStatus();
    error NotEnoughPlayers();
    error NotRegistered();
    error AlreadyReturned();

    constructor(address fzoneToken_, address nftContract_, address initialOwner) Ownable(initialOwner) {
        fzoneToken = IERC20(fzoneToken_);
        nftContract = IFriendzoneNFT(nftContract_);
    }

    function createTournament(string calldata name, uint256 entryFee, uint256 maxPlayers)
        external
        onlyOwner
        returns (uint256 id)
    {
        require(maxPlayers >= 2, "Need at least 2 players");
        id = _nextTournamentId;
        unchecked {
            ++_nextTournamentId;
        }

        Tournament storage tournament = _tournaments[id];
        tournament.id = id;
        tournament.name = name;
        tournament.entryFee = entryFee;
        tournament.maxPlayers = maxPlayers;
        tournament.status = TournamentStatus.Registration;
        tournament.createdAt = block.timestamp;
        emit TournamentCreated(id, name, entryFee, maxPlayers);
    }

    function register(uint256 tournamentId, uint256 tokenId) external nonReentrant {
        Tournament storage tournament = _requireTournament(tournamentId);
        if (tournament.status != TournamentStatus.Registration) revert RegistrationClosed();
        if (tournament.players.length >= tournament.maxPlayers) revert TournamentFull();
        if (tournament.registered[msg.sender]) revert AlreadyRegistered();
        if (nftContract.ownerOf(tokenId) != msg.sender) revert NotTokenOwner();

        if (tournament.entryFee > 0) {
            fzoneToken.safeTransferFrom(msg.sender, address(this), tournament.entryFee);
            tournament.prizePool += tournament.entryFee;
        }

        nftContract.transferFrom(msg.sender, address(this), tokenId);
        tournament.players.push(msg.sender);
        tournament.playerTokenId[msg.sender] = tokenId;
        tournament.registered[msg.sender] = true;
        emit PlayerRegistered(tournamentId, msg.sender, tokenId);
    }

    function startTournament(uint256 tournamentId) external onlyOwner {
        Tournament storage tournament = _requireTournament(tournamentId);
        if (tournament.status != TournamentStatus.Registration) revert InvalidStatus();
        if (tournament.players.length < 2) revert NotEnoughPlayers();
        tournament.status = TournamentStatus.Active;
        tournament.currentRound = 1;
        emit TournamentStarted(tournamentId, tournament.players.length);
    }

    function resolveMatch(uint256 tournamentId, address winner) external onlyOwner {
        Tournament storage tournament = _requireTournament(tournamentId);
        if (tournament.status != TournamentStatus.Active) revert InvalidStatus();
        if (!tournament.registered[winner]) revert NotRegistered();

        tournament.roundWinner[tournament.currentRound] = winner;
        emit MatchCompleted(tournamentId, tournament.currentRound, winner);

        unchecked {
            ++tournament.currentRound;
        }

        if (tournament.currentRound > tournament.players.length / 2) {
            tournament.status = TournamentStatus.Completed;
            tournament.winner = winner;
            if (tournament.prizePool > 0) {
                fzoneToken.safeTransfer(winner, tournament.prizePool);
            }
            emit TournamentWinner(tournamentId, winner, tournament.prizePool);
        }
    }

    function returnWearables(uint256 tournamentId) external nonReentrant {
        Tournament storage tournament = _requireTournament(tournamentId);
        if (tournament.status != TournamentStatus.Completed) revert InvalidStatus();
        if (tournament.nftsReturned) revert AlreadyReturned();
        tournament.nftsReturned = true;

        uint256 length = tournament.players.length;
        for (uint256 i = 0; i < length; ++i) {
            address player = tournament.players[i];
            nftContract.transferFrom(address(this), player, tournament.playerTokenId[player]);
        }
        emit WearablesReturned(tournamentId);
    }

    function getTournament(uint256 tournamentId)
        external
        view
        returns (
            uint256 id,
            string memory name,
            uint256 entryFee,
            uint256 prizePool,
            TournamentStatus status,
            uint256 maxPlayers,
            address[] memory players,
            uint256 currentRound,
            address winner
        )
    {
        Tournament storage tournament = _requireTournament(tournamentId);
        return (
            tournament.id,
            tournament.name,
            tournament.entryFee,
            tournament.prizePool,
            tournament.status,
            tournament.maxPlayers,
            tournament.players,
            tournament.currentRound,
            tournament.winner
        );
    }

    function playerTokenId(uint256 tournamentId, address player) external view returns (uint256) {
        return _tournaments[tournamentId].playerTokenId[player];
    }

    function _requireTournament(uint256 tournamentId) private view returns (Tournament storage tournament) {
        tournament = _tournaments[tournamentId];
        if (tournament.id == 0) revert UnknownTournament();
    }
}
