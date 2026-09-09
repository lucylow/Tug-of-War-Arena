// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {OperatorOwnable} from "./OperatorOwnable.sol";
import {ILeaderboard} from "./interfaces/ILeaderboard.sol";

/**
 * @title Leaderboard
 * @notice On-chain competitive leaderboard with integer ELO scoring and seasons.
 */
contract Leaderboard is OperatorOwnable, ReentrancyGuard, ILeaderboard {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct PlayerRank {
        uint256 score;
        uint256 elo;
        uint256 wins;
        uint256 losses;
        uint256 draws;
        uint256 streak;
        uint256 bestStreak;
        uint256 matchesPlayed;
        uint256 lastActive;
        uint256 season;
    }

    struct Season {
        uint256 id;
        string name;
        uint256 startTime;
        uint256 endTime;
        bool active;
        uint256 prizePool;
        bool prizeClaimed;
    }

    mapping(address => PlayerRank) public rankings;
    mapping(uint256 => Season) public seasons;
    EnumerableSet.AddressSet private rankedPlayers;

    uint256 public currentSeasonId;
    uint256 public nextSeasonId;

    uint256 public constant ELO_K = 32;
    uint256 public constant INITIAL_ELO = 1200;
    uint256 public constant MIN_ELO = 100;

    event MatchRecorded(address indexed winner, address indexed loser, uint256 winnerElo, uint256 loserElo, bool draw);
    event SeasonStarted(uint256 indexed id, string name);
    event SeasonEnded(uint256 indexed id);
    event PrizeClaimed(uint256 indexed seasonId, address indexed player, uint256 amount);
    event SeasonFunded(uint256 indexed seasonId, uint256 amount);

    constructor() OperatorOwnable(msg.sender) {
        _startSeason("Season 1", 30 days);
    }

    function recordMatch(address winner, address loser, bool draw) external onlyOperator {
        require(winner != loser, "Cannot play yourself");
        require(winner != address(0) && loser != address(0), "Invalid address");

        PlayerRank storage w = rankings[winner];
        PlayerRank storage l = rankings[loser];

        if (w.elo == 0) w.elo = INITIAL_ELO;
        if (l.elo == 0) l.elo = INITIAL_ELO;

        w.matchesPlayed++;
        l.matchesPlayed++;
        w.lastActive = block.timestamp;
        l.lastActive = block.timestamp;
        w.season = currentSeasonId;
        l.season = currentSeasonId;

        if (draw) {
            w.draws++;
            l.draws++;
            w.streak = 0;
            l.streak = 0;
            _applyElo(w, l, 50);
        } else {
            w.wins++;
            l.losses++;
            w.streak++;
            if (w.streak > w.bestStreak) w.bestStreak = w.streak;
            l.streak = 0;
            _applyElo(w, l, 100);
        }

        w.score = w.elo + (w.wins * 10) - (w.losses * 5) + (w.streak * 2);
        l.score = l.elo + (l.wins * 10) - (l.losses * 5) + (l.streak * 2);

        rankedPlayers.add(winner);
        rankedPlayers.add(loser);

        emit MatchRecorded(winner, loser, w.elo, l.elo, draw);
    }

    function startSeason(string memory name, uint256 durationDays) external onlyOwner {
        require(durationDays > 0, "Duration required");
        if (currentSeasonId != 0 && seasons[currentSeasonId].active) {
            seasons[currentSeasonId].active = false;
            emit SeasonEnded(currentSeasonId);
        }
        _startSeason(name, durationDays * 1 days);
    }

    function endSeason(uint256 seasonId) external onlyOwner {
        Season storage season = seasons[seasonId];
        require(season.id == seasonId, "Unknown season");
        require(season.active, "Season not active");
        season.active = false;
        emit SeasonEnded(seasonId);
    }

    function fundSeasonPrize(uint256 seasonId) external payable onlyOwner {
        require(seasons[seasonId].id == seasonId, "Unknown season");
        require(msg.value > 0, "No value");
        seasons[seasonId].prizePool += msg.value;
        emit SeasonFunded(seasonId, msg.value);
    }

    function claimSeasonPrize(uint256 seasonId) external nonReentrant {
        Season storage season = seasons[seasonId];
        require(season.id == seasonId, "Unknown season");
        require(!season.active, "Season still active");
        require(!season.prizeClaimed, "Prize already claimed");
        require(season.prizePool > 0, "No prize pool");

        (address[] memory topPlayers, ) = getTopPlayers(3);
        require(topPlayers.length > 0, "No ranked players");

        uint256 prizeAmount = season.prizePool;
        season.prizePool = 0;
        season.prizeClaimed = true;

        uint256[3] memory shares = [uint256(5000), 3000, 2000];
        uint256 paid = 0;
        uint256 limit = topPlayers.length < 3 ? topPlayers.length : 3;

        for (uint256 i = 0; i < limit; ) {
            uint256 amount = (prizeAmount * shares[i]) / 10000;
            paid += amount;
            (bool ok, ) = topPlayers[i].call{value: amount}("");
            require(ok, "Transfer failed");
            emit PrizeClaimed(seasonId, topPlayers[i], amount);
            unchecked {
                ++i;
            }
        }

        uint256 dust = prizeAmount - paid;
        if (dust > 0) {
            (bool ok, ) = owner().call{value: dust}("");
            require(ok, "Dust transfer failed");
        }
    }

    function getPlayerRank(address player)
        external
        view
        returns (
            uint256 score,
            uint256 elo,
            uint256 wins,
            uint256 losses,
            uint256 draws,
            uint256 streak,
            uint256 matchesPlayed
        )
    {
        PlayerRank storage p = rankings[player];
        return (
            p.score,
            p.elo == 0 ? INITIAL_ELO : p.elo,
            p.wins,
            p.losses,
            p.draws,
            p.streak,
            p.matchesPlayed
        );
    }

    function getElo(address player) external view returns (uint256) {
        uint256 elo = rankings[player].elo;
        return elo == 0 ? INITIAL_ELO : elo;
    }

    function getTopPlayers(uint256 count) public view returns (address[] memory, uint256[] memory) {
        uint256 total = rankedPlayers.length();
        uint256 maxCount = count > total ? total : count;

        address[] memory topPlayers = new address[](maxCount);
        uint256[] memory topScores = new uint256[](maxCount);
        if (maxCount == 0) return (topPlayers, topScores);

        address[] memory allPlayers = rankedPlayers.values();
        uint256[] memory allScores = new uint256[](total);

        for (uint256 i = 0; i < total; ) {
            allScores[i] = rankings[allPlayers[i]].score;
            unchecked {
                ++i;
            }
        }

        for (uint256 i = 0; i < total; ) {
            for (uint256 j = i + 1; j < total; ) {
                if (allScores[j] > allScores[i]) {
                    (allScores[i], allScores[j]) = (allScores[j], allScores[i]);
                    (allPlayers[i], allPlayers[j]) = (allPlayers[j], allPlayers[i]);
                }
                unchecked {
                    ++j;
                }
            }
            unchecked {
                ++i;
            }
        }

        for (uint256 i = 0; i < maxCount; ) {
            topPlayers[i] = allPlayers[i];
            topScores[i] = allScores[i];
            unchecked {
                ++i;
            }
        }

        return (topPlayers, topScores);
    }

    function getCurrentSeason() external view returns (Season memory) {
        return seasons[currentSeasonId];
    }

    function getSeason(uint256 seasonId) external view returns (Season memory) {
        return seasons[seasonId];
    }

    function _startSeason(string memory name, uint256 duration) private {
        uint256 seasonId = ++nextSeasonId;
        seasons[seasonId] = Season({
            id: seasonId,
            name: name,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            active: true,
            prizePool: 0,
            prizeClaimed: false
        });
        currentSeasonId = seasonId;
        emit SeasonStarted(seasonId, name);
    }

    function _applyElo(PlayerRank storage a, PlayerRank storage b, uint256 actualA) private {
        uint256 expectedA = _expectedScore(a.elo, b.elo);
        uint256 expectedB = _expectedScore(b.elo, a.elo);
        uint256 actualB = 100 - actualA;

        int256 deltaA = (int256(ELO_K) * (int256(actualA) - int256(expectedA))) / 100;
        int256 deltaB = (int256(ELO_K) * (int256(actualB) - int256(expectedB))) / 100;

        a.elo = _adjustElo(a.elo, deltaA);
        b.elo = _adjustElo(b.elo, deltaB);
    }

    function _expectedScore(uint256 eloA, uint256 eloB) private pure returns (uint256) {
        int256 diff = int256(eloB) - int256(eloA);
        if (diff > 800) diff = 800;
        if (diff < -800) diff = -800;
        int256 expected = 50 - (diff / 8);
        if (expected < 1) expected = 1;
        if (expected > 99) expected = 99;
        return uint256(expected);
    }

    function _adjustElo(uint256 elo, int256 delta) private pure returns (uint256) {
        int256 next = int256(elo) + delta;
        if (next < int256(MIN_ELO)) next = int256(MIN_ELO);
        return uint256(next);
    }
}
