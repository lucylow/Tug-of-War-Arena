// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ISocialReputation
 * @notice Composable reputation surface used by tipping, quests, chat, and the leaderboard.
 */
interface ISocialReputation {
    struct Reputation {
        uint256 score;
        uint256 trustLevel;
        uint256 interactions;
        uint256 positiveFeedback;
        uint256 negativeFeedback;
        uint256 lastActive;
        uint256 followers;
        uint256 following;
        bool isVerified;
        string metadata;
    }

    function getReputation(address user) external view returns (Reputation memory);

    function updateReputation(
        address user,
        string calldata action,
        bool positive,
        uint256 amount
    ) external returns (uint256);

    function recordInteraction(
        address to,
        string calldata action,
        uint256 amount,
        bool positive,
        string calldata data
    ) external;

    function recordInteractionFor(
        address from,
        address to,
        string calldata action,
        uint256 amount,
        bool positive,
        string calldata data
    ) external;
}
