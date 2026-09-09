// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IVRFConsumer
 * @notice Callback surface for Chainlink-compatible VRF coordinators.
 */
interface IVRFConsumer {
    function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external;
}
