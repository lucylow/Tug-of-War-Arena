// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ISocialReputation} from "../interfaces/ISocialReputation.sol";

/**
 * @title DecentralizedChat
 * @notice Lightweight on-chain messaging with block lists and optional reputation gates.
 * @dev Store IPFS hashes or encrypted payloads in `content`, not plaintext at scale.
 */
contract DecentralizedChat is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Message {
        uint256 id;
        address sender;
        address recipient;
        string content;
        uint256 timestamp;
        bool isPublic;
        bool isDeleted;
        uint256 replyTo;
        uint256 threadId;
    }

    struct Thread {
        uint256 id;
        address creator;
        string topic;
        uint256 messageCount;
        uint256 createdAt;
        bool active;
    }

    mapping(uint256 => Message) public messages;
    mapping(uint256 => Thread) public threads;
    mapping(address => uint256[]) public userMessages;
    mapping(uint256 => uint256[]) public threadMessages;
    mapping(address => EnumerableSet.AddressSet) private _blockedUsers;

    ISocialReputation public reputation;

    uint256 public nextMessageId;
    uint256 public nextThreadId = 1;
    uint256 public maxMessageLength = 10000;
    uint256 public minReputationToSend = 0;

    event MessageSent(uint256 indexed messageId, address indexed sender, address indexed recipient, uint256 threadId);
    event ThreadCreated(uint256 indexed threadId, address indexed creator, string topic);
    event UserBlocked(address indexed blocker, address indexed blocked);
    event UserUnblocked(address indexed blocker, address indexed blocked);
    event MessageDeleted(uint256 indexed messageId, address indexed sender);

    error MessageTooLong();
    error SenderBlocked();
    error RecipientBlocked();
    error ReputationTooLow();
    error TopicRequired();
    error NotSender();
    error ThreadInactive();

    constructor(address reputation_, address initialOwner) Ownable(initialOwner) {
        if (reputation_ != address(0)) {
            reputation = ISocialReputation(reputation_);
        }
    }

    function sendMessage(
        address recipient,
        string calldata content,
        bool isPublic,
        uint256 replyTo
    ) external returns (uint256) {
        return _send(recipient, content, isPublic, replyTo, 0);
    }

    function postToThread(uint256 threadId, string calldata content) external returns (uint256) {
        Thread storage thread = threads[threadId];
        if (!thread.active) revert ThreadInactive();
        uint256 messageId = _send(address(0), content, true, 0, threadId);
        thread.messageCount++;
        return messageId;
    }

    function createThread(string calldata topic, string calldata firstMessage) external returns (uint256 threadId) {
        if (bytes(topic).length == 0) revert TopicRequired();

        threadId = nextThreadId++;
        threads[threadId] = Thread({
            id: threadId,
            creator: msg.sender,
            topic: topic,
            messageCount: 0,
            createdAt: block.timestamp,
            active: true
        });

        emit ThreadCreated(threadId, msg.sender, topic);
        _send(address(0), firstMessage, true, 0, threadId);
        threads[threadId].messageCount = 1;
    }

    function blockUser(address user) external {
        require(user != msg.sender, "Cannot block yourself");
        _blockedUsers[msg.sender].add(user);
        emit UserBlocked(msg.sender, user);
    }

    function unblockUser(address user) external {
        _blockedUsers[msg.sender].remove(user);
        emit UserUnblocked(msg.sender, user);
    }

    function deleteMessage(uint256 messageId) external {
        Message storage stored = messages[messageId];
        if (stored.sender != msg.sender) revert NotSender();
        stored.isDeleted = true;
        emit MessageDeleted(messageId, msg.sender);
    }

    function getMessage(uint256 messageId) external view returns (Message memory) {
        return messages[messageId];
    }

    function getThread(uint256 threadId) external view returns (Thread memory) {
        return threads[threadId];
    }

    function getUserMessages(address user) external view returns (uint256[] memory) {
        return userMessages[user];
    }

    function getThreadMessages(uint256 threadId) external view returns (uint256[] memory) {
        return threadMessages[threadId];
    }

    function getConversation(address userA, address userB) external view returns (uint256[] memory) {
        uint256[] storage messagesA = userMessages[userA];
        uint256[] memory result = new uint256[](messagesA.length);
        uint256 count = 0;
        for (uint256 i = 0; i < messagesA.length; ) {
            Message storage stored = messages[messagesA[i]];
            if (!stored.isDeleted && (stored.sender == userB || stored.recipient == userB)) {
                result[count] = messagesA[i];
                unchecked {
                    ++count;
                }
            }
            unchecked {
                ++i;
            }
        }
        uint256[] memory trimmed = new uint256[](count);
        for (uint256 i = 0; i < count; ) {
            trimmed[i] = result[i];
            unchecked {
                ++i;
            }
        }
        return trimmed;
    }

    function isBlocked(address user, address target) external view returns (bool) {
        return _blockedUsers[user].contains(target);
    }

    function setMaxMessageLength(uint256 length) external onlyOwner {
        maxMessageLength = length;
    }

    function setMinReputationToSend(uint256 minScore) external onlyOwner {
        minReputationToSend = minScore;
    }

    function setReputation(address reputation_) external onlyOwner {
        reputation = ISocialReputation(reputation_);
    }

    function _send(
        address recipient,
        string memory content,
        bool isPublic,
        uint256 replyTo,
        uint256 threadId
    ) private returns (uint256 messageId) {
        if (bytes(content).length > maxMessageLength) revert MessageTooLong();
        if (recipient != address(0)) {
            if (_blockedUsers[recipient].contains(msg.sender)) revert SenderBlocked();
            if (_blockedUsers[msg.sender].contains(recipient)) revert RecipientBlocked();
        }
        _requireReputation();

        messageId = nextMessageId++;
        messages[messageId] = Message({
            id: messageId,
            sender: msg.sender,
            recipient: recipient,
            content: content,
            timestamp: block.timestamp,
            isPublic: isPublic,
            isDeleted: false,
            replyTo: replyTo,
            threadId: threadId
        });

        userMessages[msg.sender].push(messageId);
        if (recipient != address(0) && recipient != msg.sender) {
            userMessages[recipient].push(messageId);
        }
        if (threadId != 0) {
            threadMessages[threadId].push(messageId);
        }

        emit MessageSent(messageId, msg.sender, recipient, threadId);
    }

    function _requireReputation() private view {
        if (minReputationToSend == 0 || address(reputation) == address(0)) return;
        if (reputation.getReputation(msg.sender).score < minReputationToSend) revert ReputationTooLow();
    }
}
