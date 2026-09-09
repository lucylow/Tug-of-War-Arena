// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ISocialReputation} from "../interfaces/ISocialReputation.sol";

/**
 * @title SocialLeaderboard
 * @notice On-chain ranking from reputation, engagement, and social influence.
 */
contract SocialLeaderboard is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct SocialRank {
        address player;
        uint256 reputationScore;
        uint256 engagementScore;
        uint256 influenceScore;
        uint256 totalScore;
        uint256 rank;
    }

    ISocialReputation public reputation;

    mapping(address => SocialRank) public ranks;
    EnumerableSet.AddressSet private _rankedPlayers;

    uint256 public reputationWeight = 50;
    uint256 public engagementWeight = 30;
    uint256 public influenceWeight = 20;
    uint256 public lastUpdate;

    event LeaderboardUpdated(uint256 timestamp);
    event PlayerAdded(address indexed player);
    event PlayerRemoved(address indexed player);
    event WeightsUpdated(uint256 reputationWeight, uint256 engagementWeight, uint256 influenceWeight);

    error WeightsMustSumTo100();

    constructor(address reputation_, address initialOwner) Ownable(initialOwner) {
        require(reputation_ != address(0), "Zero address");
        reputation = ISocialReputation(reputation_);
    }

    function updateLeaderboard() external {
        address[] memory players = _rankedPlayers.values();
        for (uint256 i = 0; i < players.length; ) {
            _updatePlayerRank(players[i]);
            unchecked {
                ++i;
            }
        }
        lastUpdate = block.timestamp;
        emit LeaderboardUpdated(lastUpdate);
    }

    function addPlayer(address player) external {
        require(player != address(0), "Zero address");
        _rankedPlayers.add(player);
        _updatePlayerRank(player);
        emit PlayerAdded(player);
    }

    function getTopPlayers(uint256 count) external view returns (SocialRank[] memory) {
        uint256 total = _rankedPlayers.length();
        uint256 maxCount = count > total ? total : count;

        SocialRank[] memory topRanks = new SocialRank[](maxCount);
        address[] memory allPlayers = _rankedPlayers.values();

        for (uint256 i = 0; i < total; ) {
            for (uint256 j = i + 1; j < total; ) {
                if (ranks[allPlayers[j]].totalScore > ranks[allPlayers[i]].totalScore) {
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
            topRanks[i] = ranks[allPlayers[i]];
            topRanks[i].rank = i + 1;
            unchecked {
                ++i;
            }
        }
        return topRanks;
    }

    function getPlayerRank(address player) external view returns (SocialRank memory) {
        return ranks[player];
    }

    function getPlayerTotalScore(address player) external view returns (uint256) {
        return ranks[player].totalScore;
    }

    function playerCount() external view returns (uint256) {
        return _rankedPlayers.length();
    }

    function setWeights(uint256 reputationW, uint256 engagementW, uint256 influenceW) external onlyOwner {
        if (reputationW + engagementW + influenceW != 100) revert WeightsMustSumTo100();
        reputationWeight = reputationW;
        engagementWeight = engagementW;
        influenceWeight = influenceW;
        emit WeightsUpdated(reputationW, engagementW, influenceW);
    }

    function removePlayer(address player) external onlyOwner {
        _rankedPlayers.remove(player);
        delete ranks[player];
        emit PlayerRemoved(player);
    }

    function setReputation(address reputation_) external onlyOwner {
        require(reputation_ != address(0), "Zero address");
        reputation = ISocialReputation(reputation_);
    }

    function _updatePlayerRank(address player) private {
        SocialRank storage rank = ranks[player];
        rank.player = player;

        ISocialReputation.Reputation memory rep = reputation.getReputation(player);

        uint256 engagementScore = rep.interactions * 2 + rep.trustLevel;
        uint256 influenceScore = rep.followers * 5 + (rep.score / 100);
        uint256 totalScore = (rep.score * reputationWeight) /
            100 +
            (engagementScore * engagementWeight) /
            100 +
            (influenceScore * influenceWeight) /
            100;

        rank.reputationScore = rep.score;
        rank.engagementScore = engagementScore;
        rank.influenceScore = influenceScore;
        rank.totalScore = totalScore;
    }
}
