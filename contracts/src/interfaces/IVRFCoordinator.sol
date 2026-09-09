// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IVRFCoordinator
 * @notice Chainlink VRF v2 request surface. Polygon Amoy v2.5 can be wrapped
 *         by `ChainlinkV2PlusAdapter` without changing arena logic.
 */
interface IVRFCoordinator {
    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 requestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId);
}
