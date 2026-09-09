// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ISoulboundBadges
 * @notice Minimal mint surface so quests can award non-transferable badges.
 */
interface ISoulboundBadges {
    function awardBadge(address to, uint256 badgeId) external;
}
