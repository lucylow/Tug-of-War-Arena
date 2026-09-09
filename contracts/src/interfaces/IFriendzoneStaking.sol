// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IFriendzoneStaking
 * @notice Stake Friendzone wearables into reward pools.
 */
interface IFriendzoneStaking {
    function stake(uint256 tokenId, uint256 poolId) external;
    function unstake(uint256 tokenId) external;
    function claimReward(uint256 tokenId) external;
    function getPendingReward(uint256 tokenId) external view returns (uint256);
    function getStakerTokens(address staker) external view returns (uint256[] memory);
}
