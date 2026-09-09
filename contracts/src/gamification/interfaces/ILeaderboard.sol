// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILeaderboard {
    function getElo(address player) external view returns (uint256);

    function recordMatch(address winner, address loser, bool draw) external;

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
        );
}
