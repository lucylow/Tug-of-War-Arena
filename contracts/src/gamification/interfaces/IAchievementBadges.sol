// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAchievementBadges {
    function awardBadge(address to, uint256 badgeId) external;
}
