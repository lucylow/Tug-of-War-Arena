// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title FriendzoneLeaderboard
 * @notice Operator-updated on-chain rankings for Plaza seasons.
 */
contract FriendzoneLeaderboard is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct PlayerScore {
        uint256 score;
        uint256 wins;
        uint256 losses;
        uint256 lastUpdated;
    }

    mapping(address => PlayerScore) public scores;
    EnumerableSet.AddressSet private _players;
    mapping(address => bool) public reporters;

    event ScoreUpdated(address indexed player, uint256 newScore);
    event ReporterUpdated(address indexed account, bool allowed);

    error NotReporter();

    modifier onlyReporter() {
        if (!reporters[msg.sender] && msg.sender != owner()) revert NotReporter();
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        reporters[initialOwner] = true;
    }

    function setReporter(address account, bool allowed) external onlyOwner {
        reporters[account] = allowed;
        emit ReporterUpdated(account, allowed);
    }

    function updateScore(address player, uint256 wins, uint256 losses) public onlyReporter {
        PlayerScore storage score = scores[player];
        score.wins += wins;
        score.losses += losses;
        uint256 winPts = score.wins * 10;
        uint256 lossPts = score.losses * 5;
        score.score = winPts > lossPts ? winPts - lossPts : 0;
        score.lastUpdated = block.timestamp;

        if (score.score > 0) {
            _players.add(player);
        } else {
            _players.remove(player);
        }

        emit ScoreUpdated(player, score.score);
    }

    function recordMatch(address winner, address loser) external onlyReporter {
        updateScore(winner, 1, 0);
        updateScore(loser, 0, 1);
    }

    function getTopPlayers(uint256 count) external view returns (address[] memory topPlayers, uint256[] memory topScores) {
        uint256 total = _players.length();
        uint256 maxCount = count > total ? total : count;
        topPlayers = new address[](maxCount);
        topScores = new uint256[](maxCount);
        if (maxCount == 0) return (topPlayers, topScores);

        address[] memory allPlayers = _players.values();
        uint256[] memory allScores = new uint256[](total);
        for (uint256 i = 0; i < total; ) {
            allScores[i] = scores[allPlayers[i]].score;
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
    }

    function getPlayerScore(address player) external view returns (PlayerScore memory) {
        return scores[player];
    }

    function playerCount() external view returns (uint256) {
        return _players.length();
    }
}
