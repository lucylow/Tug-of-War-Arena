// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {OperatorOwnable} from "../gamification/OperatorOwnable.sol";
import {ISocialReputation} from "../interfaces/ISocialReputation.sol";
import {ISoulboundBadges} from "../interfaces/ISoulboundBadges.sol";

/**
 * @title SocialQuests
 * @notice Social action quests that pay reputation and optional soulbound badges.
 */
contract SocialQuests is OperatorOwnable {
    enum QuestType {
        Social,
        Content,
        Governance,
        Community,
        Daily,
        Weekly
    }

    struct SocialQuest {
        uint256 id;
        string name;
        string description;
        QuestType questType;
        string action;
        uint256 target;
        uint256 rewardReputation;
        uint256 rewardBadgeId;
        bool active;
        uint256 startTime;
        uint256 endTime;
        uint256 repeatCooldown;
    }

    struct PlayerQuest {
        uint256 questId;
        address player;
        uint256 progress;
        bool completed;
        bool claimed;
        uint256 startedAt;
        uint256 completedAt;
        uint256 lastClaimed;
    }

    mapping(uint256 => SocialQuest) public quests;
    mapping(address => mapping(uint256 => PlayerQuest)) public playerQuests;
    mapping(address => uint256[]) public playerQuestIds;

    ISocialReputation public reputation;
    ISoulboundBadges public badges;

    uint256 public nextQuestId = 1;
    uint256 public dailyQuestLimit = 5;
    uint256 public weeklyQuestLimit = 10;

    event QuestCreated(uint256 indexed id, string name, QuestType questType);
    event QuestAccepted(uint256 indexed id, address indexed player);
    event QuestProgressed(uint256 indexed id, address indexed player, uint256 progress);
    event QuestCompleted(uint256 indexed id, address indexed player);
    event QuestClaimed(uint256 indexed id, address indexed player);

    error QuestInactive();
    error QuestUnavailable();
    error AlreadyActive();
    error CooldownActive();
    error QuestNotAccepted();
    error QuestNotCompleted();
    error AlreadyCompleted();
    error AlreadyClaimed();

    constructor(address reputation_, address initialOwner) OperatorOwnable(initialOwner) {
        require(reputation_ != address(0), "Zero address");
        reputation = ISocialReputation(reputation_);
    }

    function createQuest(
        string calldata name,
        string calldata description,
        QuestType questType,
        string calldata action,
        uint256 target,
        uint256 rewardReputation,
        uint256 rewardBadgeId,
        uint256 durationDays,
        uint256 repeatCooldown
    ) external onlyOwner returns (uint256 id) {
        id = nextQuestId++;
        quests[id] = SocialQuest({
            id: id,
            name: name,
            description: description,
            questType: questType,
            action: action,
            target: target,
            rewardReputation: rewardReputation,
            rewardBadgeId: rewardBadgeId,
            active: true,
            startTime: block.timestamp,
            endTime: block.timestamp + (durationDays * 1 days),
            repeatCooldown: repeatCooldown
        });
        emit QuestCreated(id, name, questType);
    }

    function acceptQuest(uint256 questId) external {
        SocialQuest storage quest = quests[questId];
        if (!quest.active) revert QuestInactive();
        if (block.timestamp < quest.startTime || block.timestamp > quest.endTime) revert QuestUnavailable();

        PlayerQuest storage pq = playerQuests[msg.sender][questId];
        if (pq.questId != 0 && !pq.claimed) revert AlreadyActive();
        if (pq.claimed && quest.repeatCooldown > 0 && block.timestamp - pq.lastClaimed < quest.repeatCooldown) {
            revert CooldownActive();
        }

        if (pq.questId == 0) {
            playerQuestIds[msg.sender].push(questId);
        }

        pq.questId = questId;
        pq.player = msg.sender;
        pq.progress = 0;
        pq.completed = false;
        pq.claimed = false;
        pq.startedAt = block.timestamp;
        pq.completedAt = 0;

        emit QuestAccepted(questId, msg.sender);
    }

    function updateProgress(address player, uint256 questId, uint256 increment) external onlyOperator {
        PlayerQuest storage pq = playerQuests[player][questId];
        if (pq.questId == 0) revert QuestNotAccepted();
        if (pq.completed) revert AlreadyCompleted();

        pq.progress += increment;
        emit QuestProgressed(questId, player, pq.progress);

        if (pq.progress >= quests[questId].target) {
            pq.completed = true;
            pq.completedAt = block.timestamp;
            emit QuestCompleted(questId, player);
        }
    }

    function claimQuest(uint256 questId) external {
        PlayerQuest storage pq = playerQuests[msg.sender][questId];
        if (pq.questId == 0) revert QuestNotAccepted();
        if (!pq.completed) revert QuestNotCompleted();
        if (pq.claimed) revert AlreadyClaimed();

        SocialQuest storage quest = quests[questId];
        pq.claimed = true;
        pq.lastClaimed = block.timestamp;

        if (quest.rewardReputation > 0) {
            reputation.updateReputation(msg.sender, quest.action, true, quest.rewardReputation);
        }

        if (quest.rewardBadgeId > 0 && address(badges) != address(0)) {
            badges.awardBadge(msg.sender, quest.rewardBadgeId);
        }

        emit QuestClaimed(questId, msg.sender);
    }

    function getQuest(uint256 questId) external view returns (SocialQuest memory) {
        return quests[questId];
    }

    function getPlayerQuests(address player) external view returns (uint256[] memory) {
        return playerQuestIds[player];
    }

    function getPlayerQuest(address player, uint256 questId) external view returns (PlayerQuest memory) {
        return playerQuests[player][questId];
    }

    function getAvailableQuests(address player) external view returns (uint256[] memory) {
        uint256[] memory available = new uint256[](nextQuestId);
        uint256 count = 0;
        for (uint256 i = 1; i < nextQuestId; ) {
            SocialQuest storage quest = quests[i];
            PlayerQuest storage pq = playerQuests[player][i];
            bool inProgress = pq.questId != 0 && !pq.claimed;
            if (
                quest.active &&
                block.timestamp >= quest.startTime &&
                block.timestamp <= quest.endTime &&
                !inProgress
            ) {
                available[count] = i;
                unchecked {
                    ++count;
                }
            }
            unchecked {
                ++i;
            }
        }
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; ) {
            result[i] = available[i];
            unchecked {
                ++i;
            }
        }
        return result;
    }

    function setBadges(address badges_) external onlyOwner {
        badges = ISoulboundBadges(badges_);
    }

    function setReputation(address reputation_) external onlyOwner {
        require(reputation_ != address(0), "Zero address");
        reputation = ISocialReputation(reputation_);
    }

    function setQuestActive(uint256 questId, bool active) external onlyOwner {
        quests[questId].active = active;
    }

    function setDailyQuestLimit(uint256 limit) external onlyOwner {
        dailyQuestLimit = limit;
    }

    function setWeeklyQuestLimit(uint256 limit) external onlyOwner {
        weeklyQuestLimit = limit;
    }
}
