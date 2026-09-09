// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IExperienceSystem {
    function addXP(address player, uint256 amount, string calldata source) external;
    function recordMatch(address player, bool won) external;
    function getLevel(address player) external view returns (uint256);
}
