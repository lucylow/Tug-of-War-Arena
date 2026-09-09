// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IVRFCoordinator} from "../interfaces/IVRFCoordinator.sol";

/**
 * @notice Minimal VRF v2.5 request shape used on Polygon Amoy.
 * @dev Extra-args selector `0x92fd1338` matches Chainlink VRFV2PlusClient.
 */
library VRFV2PlusClient {
    struct ExtraArgsV1 {
        bool nativePayment;
    }

    struct RandomWordsRequest {
        bytes32 keyHash;
        uint256 subId;
        uint16 requestConfirmations;
        uint32 callbackGasLimit;
        uint32 numWords;
        bytes extraArgs;
    }

    function extraArgsToBytes(ExtraArgsV1 memory extraArgs) internal pure returns (bytes memory) {
        return abi.encodeWithSelector(bytes4(hex"92fd1338"), extraArgs.nativePayment);
    }
}

interface IVRFCoordinatorV2Plus {
    function requestRandomWords(VRFV2PlusClient.RandomWordsRequest calldata req) external returns (uint256 requestId);
}

/**
 * @title ChainlinkV2PlusAdapter
 * @notice Adapts the arena's VRF v2 request surface onto Polygon Amoy VRF v2.5.
 */
contract ChainlinkV2PlusAdapter is IVRFCoordinator {
    IVRFCoordinatorV2Plus public immutable coordinatorV2Plus;

    constructor(address coordinator) {
        coordinatorV2Plus = IVRFCoordinatorV2Plus(coordinator);
    }

    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 requestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId) {
        VRFV2PlusClient.RandomWordsRequest memory req = VRFV2PlusClient.RandomWordsRequest({
            keyHash: keyHash,
            subId: subId,
            requestConfirmations: requestConfirmations,
            callbackGasLimit: callbackGasLimit,
            numWords: numWords,
            extraArgs: VRFV2PlusClient.extraArgsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: false}))
        });
        requestId = coordinatorV2Plus.requestRandomWords(req);
    }
}
