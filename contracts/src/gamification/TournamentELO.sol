// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {OperatorOwnable} from "./OperatorOwnable.sol";
import {ILeaderboard} from "./interfaces/ILeaderboard.sol";

/**
 * @title TournamentELO
 * @notice Single-elimination tournament brackets seeded by on-chain ELO.
 */
contract TournamentELO is OperatorOwnable, ReentrancyGuard {
    enum TournamentStatus {
        Registration,
        Active,
        Completed
    }

    enum BracketType {
        SingleElimination,
        DoubleElimination,
        RoundRobin
    }

    struct Tournament {
        uint256 id;
        string name;
        BracketType bracketType;
        TournamentStatus status;
        uint256 maxPlayers;
        uint256 entryFee;
        uint256 prizePool;
        uint256 currentRound;
        uint256 totalRounds;
        address winner;
        uint256 createdAt;
        uint256 startedAt;
        uint256 endedAt;
        bool prizeClaimed;
    }

    struct Match {
        uint256 id;
        uint256 tournamentId;
        uint256 round;
        address playerA;
        address playerB;
        address winner;
        bool played;
        uint256 playedAt;
        uint256 scoreA;
        uint256 scoreB;
    }

    mapping(uint256 => Tournament) public tournaments;
    mapping(uint256 => address[]) public tournamentPlayers;
    mapping(uint256 => mapping(address => bool)) public registered;
    mapping(uint256 => mapping(address => uint256)) public playerSeed;
    mapping(uint256 => Match) public matches;
    mapping(uint256 => uint256[]) public tournamentMatchIds;
    mapping(uint256 => mapping(uint256 => address[])) private roundWinners;
    mapping(uint256 => mapping(uint256 => uint256)) public matchesInRound;
    mapping(uint256 => mapping(uint256 => uint256)) public completedInRound;

    ILeaderboard public leaderboard;
    uint256 public nextTournamentId = 1;
    uint256 public nextMatchId = 1;
    uint256 public registrationDuration = 7 days;

    event TournamentCreated(uint256 indexed id, string name, BracketType bracketType);
    event PlayerRegistered(uint256 indexed id, address player, uint256 seed);
    event MatchCompleted(uint256 indexed matchId, address winner);
    event TournamentWinner(uint256 indexed id, address winner);
    event PrizeClaimed(uint256 indexed id, address indexed winner, uint256 amount);

    constructor(address _leaderboard) OperatorOwnable(msg.sender) {
        require(_leaderboard != address(0), "Leaderboard required");
        leaderboard = ILeaderboard(_leaderboard);
    }

    function createTournament(string memory name, BracketType bracketType, uint256 maxPlayers, uint256 entryFee)
        external
        onlyOwner
        returns (uint256)
    {
        require(maxPlayers >= 2, "Need players");
        require(bracketType == BracketType.SingleElimination, "Only single elim");

        uint256 id = nextTournamentId++;
        Tournament storage t = tournaments[id];
        t.id = id;
        t.name = name;
        t.bracketType = bracketType;
        t.status = TournamentStatus.Registration;
        t.maxPlayers = maxPlayers;
        t.entryFee = entryFee;
        t.totalRounds = _calculateRounds(maxPlayers);
        t.createdAt = block.timestamp;

        emit TournamentCreated(id, name, bracketType);
        return id;
    }

    function register(uint256 tournamentId) external payable nonReentrant {
        Tournament storage t = tournaments[tournamentId];
        require(t.status == TournamentStatus.Registration, "Registration closed");
        require(tournamentPlayers[tournamentId].length < t.maxPlayers, "Tournament full");
        require(!registered[tournamentId][msg.sender], "Already registered");
        require(msg.value >= t.entryFee, "Insufficient fee");

        uint256 elo = leaderboard.getElo(msg.sender);
        tournamentPlayers[tournamentId].push(msg.sender);
        registered[tournamentId][msg.sender] = true;
        playerSeed[tournamentId][msg.sender] = elo;
        t.prizePool += msg.value;

        emit PlayerRegistered(tournamentId, msg.sender, elo);
    }

    function startTournament(uint256 tournamentId) external onlyOwner {
        Tournament storage t = tournaments[tournamentId];
        require(t.status == TournamentStatus.Registration, "Invalid status");
        require(tournamentPlayers[tournamentId].length >= 2, "Not enough players");

        t.status = TournamentStatus.Active;
        t.startedAt = block.timestamp;
        t.currentRound = 1;
        _generateBracket(tournamentId);
    }

    function reportMatch(uint256 matchId, address winner, uint256 scoreA, uint256 scoreB) external onlyOperator {
        Match storage game = matches[matchId];
        require(game.id == matchId, "Unknown match");
        require(!game.played, "Already played");
        require(winner == game.playerA || winner == game.playerB, "Invalid winner");

        game.played = true;
        game.winner = winner;
        game.playedAt = block.timestamp;
        game.scoreA = scoreA;
        game.scoreB = scoreB;

        emit MatchCompleted(matchId, winner);
        _advanceWinner(game.tournamentId, game.round, winner);
    }

    function claimPrize(uint256 tournamentId) external nonReentrant {
        Tournament storage t = tournaments[tournamentId];
        require(t.status == TournamentStatus.Completed, "Not complete");
        require(!t.prizeClaimed, "Already claimed");
        require(t.winner == msg.sender, "Not winner");
        require(t.prizePool > 0, "No prize");

        uint256 amount = t.prizePool;
        t.prizePool = 0;
        t.prizeClaimed = true;
        (bool ok, ) = t.winner.call{value: amount}("");
        require(ok, "Transfer failed");
        emit PrizeClaimed(tournamentId, t.winner, amount);
    }

    function getTournamentPlayers(uint256 tournamentId) external view returns (address[] memory) {
        return tournamentPlayers[tournamentId];
    }

    function getMatch(uint256 matchId) external view returns (Match memory) {
        return matches[matchId];
    }

    function getTournamentMatches(uint256 tournamentId) external view returns (uint256[] memory) {
        return tournamentMatchIds[tournamentId];
    }

    function _calculateRounds(uint256 players) private pure returns (uint256) {
        uint256 rounds = 0;
        uint256 remaining = players;
        while (remaining > 1) {
            remaining = (remaining + 1) / 2;
            unchecked {
                ++rounds;
            }
        }
        return rounds;
    }

    function _generateBracket(uint256 tournamentId) private {
        address[] memory sortedPlayers = _sortedBySeed(tournamentId);
        uint256 n = sortedPlayers.length;
        uint256 created;
        uint256 i = 0;
        uint256 j = n - 1;

        while (i < j) {
            _createMatch(tournamentId, 1, sortedPlayers[i], sortedPlayers[j]);
            unchecked {
                ++created;
                ++i;
                --j;
            }
        }
        if (i == j) {
            roundWinners[tournamentId][1].push(sortedPlayers[i]);
        }
        matchesInRound[tournamentId][1] = created;
    }

    function _sortedBySeed(uint256 tournamentId) private view returns (address[] memory sorted) {
        address[] storage players = tournamentPlayers[tournamentId];
        uint256 n = players.length;
        sorted = new address[](n);
        for (uint256 i = 0; i < n; ) {
            sorted[i] = players[i];
            unchecked {
                ++i;
            }
        }
        for (uint256 i = 0; i < n; ) {
            for (uint256 j = i + 1; j < n; ) {
                if (playerSeed[tournamentId][sorted[i]] < playerSeed[tournamentId][sorted[j]]) {
                    (sorted[i], sorted[j]) = (sorted[j], sorted[i]);
                }
                unchecked {
                    ++j;
                }
            }
            unchecked {
                ++i;
            }
        }
    }

    function _createMatch(uint256 tournamentId, uint256 round, address playerA, address playerB) private {
        uint256 matchId = nextMatchId++;
        matches[matchId] = Match({
            id: matchId,
            tournamentId: tournamentId,
            round: round,
            playerA: playerA,
            playerB: playerB,
            winner: address(0),
            played: false,
            playedAt: 0,
            scoreA: 0,
            scoreB: 0
        });
        tournamentMatchIds[tournamentId].push(matchId);
    }

    function _advanceWinner(uint256 tournamentId, uint256 round, address winner) private {
        Tournament storage t = tournaments[tournamentId];
        roundWinners[tournamentId][round].push(winner);
        completedInRound[tournamentId][round]++;

        if (completedInRound[tournamentId][round] < matchesInRound[tournamentId][round]) {
            return;
        }

        address[] storage winners = roundWinners[tournamentId][round];
        if (winners.length == 1) {
            _complete(t, winner);
            return;
        }

        uint256 nextRound = round + 1;
        t.currentRound = nextRound;
        uint256 created;
        uint256 i = 0;
        uint256 j = winners.length - 1;
        while (i < j) {
            _createMatch(tournamentId, nextRound, winners[i], winners[j]);
            unchecked {
                ++created;
                ++i;
                --j;
            }
        }
        if (i == j) {
            roundWinners[tournamentId][nextRound].push(winners[i]);
        }
        matchesInRound[tournamentId][nextRound] = created;

        if (created == 0 && roundWinners[tournamentId][nextRound].length == 1) {
            _complete(t, roundWinners[tournamentId][nextRound][0]);
        }
    }

    function _complete(Tournament storage t, address winner) private {
        t.status = TournamentStatus.Completed;
        t.winner = winner;
        t.endedAt = block.timestamp;
        emit TournamentWinner(t.id, winner);
    }
}
