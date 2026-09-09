// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IVRFCoordinator} from "../interfaces/IVRFCoordinator.sol";

/**
 * @title VRFConsumer
 * @notice Chainlink-compatible randomness base with a local fallback for tests.
 * @dev When `vrfCoordinator` is the zero address, fulfillment happens in the
 *      same transaction using `block.prevrandao`. That path is for Hardhat and
 *      hackathon demos only — production must use a real coordinator.
 */
abstract contract VRFConsumer {
    IVRFCoordinator public immutable vrfCoordinator;
    uint64 internal immutable s_subscriptionId;
    bytes32 internal immutable s_keyHash;

    uint32 internal constant CALLBACK_GAS_LIMIT = 500_000;
    uint16 internal constant REQUEST_CONFIRMATIONS = 3;
    uint32 internal constant NUM_WORDS = 2;

    mapping(uint256 => address) public requestToSender;
    uint256 private _localRequestNonce;

    event RandomWordsRequested(uint256 indexed requestId, address indexed sender);
    event RandomWordsFulfilled(uint256 indexed requestId, uint256[] randomWords);

    error OnlyCoordinator();

    constructor(address coordinator, uint64 subscriptionId, bytes32 keyHash) {
        vrfCoordinator = IVRFCoordinator(coordinator);
        s_subscriptionId = subscriptionId;
        s_keyHash = keyHash;
    }

    function _requestRandomWords(uint256 salt) internal returns (uint256 requestId) {
        if (address(vrfCoordinator) == address(0)) {
            unchecked {
                ++_localRequestNonce;
            }
            requestId = uint256(keccak256(abi.encodePacked(salt, block.prevrandao, block.timestamp, _localRequestNonce)));
            requestToSender[requestId] = msg.sender;
            emit RandomWordsRequested(requestId, msg.sender);

            uint256[] memory words = new uint256[](2);
            words[0] = requestId;
            words[1] = uint256(keccak256(abi.encode(requestId, salt)));
            fulfillRandomWords(requestId, words);
            return requestId;
        }

        requestId = vrfCoordinator.requestRandomWords(
            s_keyHash,
            s_subscriptionId,
            REQUEST_CONFIRMATIONS,
            CALLBACK_GAS_LIMIT,
            NUM_WORDS
        );
        requestToSender[requestId] = msg.sender;
        emit RandomWordsRequested(requestId, msg.sender);
    }

    function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external {
        if (msg.sender != address(vrfCoordinator)) revert OnlyCoordinator();
        fulfillRandomWords(requestId, randomWords);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal virtual;
}
