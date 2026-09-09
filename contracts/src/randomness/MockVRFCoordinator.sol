// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IVRFCoordinator} from "../interfaces/IVRFCoordinator.sol";
import {IVRFConsumer} from "../interfaces/IVRFConsumer.sol";

/**
 * @title MockVRFCoordinator
 * @notice Local stand-in for Chainlink VRF used by Hardhat tests and demo deploys.
 */
contract MockVRFCoordinator is IVRFCoordinator {
    uint256 public nextRequestId = 1;
    mapping(uint256 => address) public consumers;

    event RandomWordsRequested(uint256 indexed requestId, address indexed consumer);

    error UnknownRequest();

    function requestRandomWords(
        bytes32,
        uint64,
        uint16,
        uint32,
        uint32
    ) external override returns (uint256 requestId) {
        requestId = nextRequestId;
        unchecked {
            ++nextRequestId;
        }
        consumers[requestId] = msg.sender;
        emit RandomWordsRequested(requestId, msg.sender);
    }

    function fulfill(uint256 requestId, uint256[] calldata randomWords) external {
        address consumer = consumers[requestId];
        if (consumer == address(0)) revert UnknownRequest();
        IVRFConsumer(consumer).rawFulfillRandomWords(requestId, randomWords);
    }

    function fulfillWithSeed(uint256 requestId, uint256 seed) external {
        address consumer = consumers[requestId];
        if (consumer == address(0)) revert UnknownRequest();
        uint256[] memory words = new uint256[](2);
        words[0] = seed;
        words[1] = uint256(keccak256(abi.encode(seed, requestId)));
        IVRFConsumer(consumer).rawFulfillRandomWords(requestId, words);
    }
}
