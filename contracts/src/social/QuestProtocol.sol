// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";
import {OperatorOwnable} from "../gamification/OperatorOwnable.sol";
import {ISoulboundBadges} from "../interfaces/ISoulboundBadges.sol";

/**
 * @title QuestProtocol
 * @notice On-chain quests with operator-attested proof-of-completion.
 * @dev Storage mappings stay out of the public Quest struct so `getQuest`
 *      can return memory. Token rewards pay from the contract balance;
 *      optional soulbound badges mint through `ISoulboundBadges`.
 */
contract QuestProtocol is OperatorOwnable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    enum QuestType {
        Social,
        OnChain,
        Community,
        Skill,
        Daily
    }

    enum QuestStatus {
        Active,
        Completed,
        Expired
    }

    struct Quest {
        uint256 id;
        string name;
        string description;
        QuestType questType;
        string actionType;
        uint256 target;
        uint256 rewardTokens;
        uint256 rewardBadgeId;
        bool repeatable;
        uint256 cooldown;
        QuestStatus status;
        uint256 startTime;
        uint256 endTime;
    }

    struct PlayerQuest {
        uint256 questId;
        uint256 progress;
        bool completed;
        bool claimed;
        uint256 completedAt;
        uint256 lastCompleted;
    }

    IERC20 public immutable rewardToken;
    ISoulboundBadges public badges;

    mapping(uint256 => Quest) public quests;
    mapping(address => mapping(uint256 => PlayerQuest)) public playerQuests;
    mapping(uint256 => mapping(address => bool)) public completed;
    mapping(uint256 => EnumerableSet.AddressSet) private completers;

    uint256 public nextQuestId;

    event QuestCreated(uint256 indexed id, string name, QuestType questType);
    event QuestProgressed(uint256 indexed id, address indexed player, uint256 progress);
    event QuestCompleted(uint256 indexed id, address indexed player);
    event RewardClaimed(uint256 indexed id, address indexed player, uint256 amount);
    event BadgesUpdated(address indexed badges);

    error QuestNotActive();
    error QuestUnavailable();
    error AlreadyCompleted();
    error CooldownActive();
    error QuestNotCompleted();
    error AlreadyClaimed();

    constructor(address rewardToken_, address initialOwner) OperatorOwnable(initialOwner) {
        require(rewardToken_ != address(0), "Zero address");
        rewardToken = IERC20(rewardToken_);
    }

    function setBadges(address badges_) external onlyOwner {
        badges = ISoulboundBadges(badges_);
        emit BadgesUpdated(badges_);
    }

    function createQuest(
        string calldata name,
        string calldata description,
        QuestType questType,
        string calldata actionType,
        uint256 target,
        uint256 rewardTokens,
        uint256 rewardBadgeId,
        bool repeatable,
        uint256 cooldown,
        uint256 durationDays
    ) external onlyOwner returns (uint256 id) {
        require(bytes(name).length > 0 && target > 0, "Invalid quest");

        id = nextQuestId++;
        quests[id] = Quest({
            id: id,
            name: name,
            description: description,
            questType: questType,
            actionType: actionType,
            target: target,
            rewardTokens: rewardTokens,
            rewardBadgeId: rewardBadgeId,
            repeatable: repeatable,
            cooldown: cooldown,
            status: QuestStatus.Active,
            startTime: block.timestamp,
            endTime: durationDays == 0 ? type(uint256).max : block.timestamp + (durationDays * 1 days)
        });

        emit QuestCreated(id, name, questType);
    }

    function progressQuest(uint256 questId, address player, uint256 increment) external onlyOperator {
        Quest storage quest = quests[questId];
        if (quest.status != QuestStatus.Active) revert QuestNotActive();
        if (block.timestamp < quest.startTime || block.timestamp > quest.endTime) revert QuestUnavailable();

        PlayerQuest storage pq = playerQuests[player][questId];
        if (!quest.repeatable && (completed[questId][player] || pq.completed)) revert AlreadyCompleted();
        if (quest.repeatable && pq.lastCompleted != 0 && block.timestamp - pq.lastCompleted < quest.cooldown) {
            revert CooldownActive();
        }

        pq.questId = questId;
        pq.progress += increment;
        emit QuestProgressed(questId, player, pq.progress);

        if (pq.progress >= quest.target && !pq.completed) {
            _completeQuest(questId, player);
        }
    }

    function claimReward(uint256 questId) external nonReentrant {
        Quest storage quest = quests[questId];
        PlayerQuest storage pq = playerQuests[msg.sender][questId];
        if (!pq.completed && !completed[questId][msg.sender]) revert QuestNotCompleted();
        if (pq.claimed) revert AlreadyClaimed();

        pq.claimed = true;

        if (quest.repeatable) {
            completed[questId][msg.sender] = false;
            pq.completed = false;
            pq.progress = 0;
            pq.claimed = false;
            pq.lastCompleted = block.timestamp;
            completers[questId].remove(msg.sender);
        }

        if (quest.rewardTokens > 0) {
            rewardToken.safeTransfer(msg.sender, quest.rewardTokens);
        }
        if (quest.rewardBadgeId != 0 && address(badges) != address(0) && !quest.repeatable) {
            badges.awardBadge(msg.sender, quest.rewardBadgeId);
        }

        emit RewardClaimed(questId, msg.sender, quest.rewardTokens);
    }

    function expireQuest(uint256 questId) external onlyOwner {
        quests[questId].status = QuestStatus.Expired;
    }

    function getQuest(uint256 questId) external view returns (Quest memory) {
        return quests[questId];
    }

    function getPlayerQuest(address player, uint256 questId) external view returns (PlayerQuest memory) {
        return playerQuests[player][questId];
    }

    function getCompleters(uint256 questId) external view returns (address[] memory) {
        return completers[questId].values();
    }

    function getCompletionCount(uint256 questId) external view returns (uint256) {
        return completers[questId].length();
    }

    function getActiveQuests() external view returns (uint256[] memory) {
        uint256 total = nextQuestId;
        uint256[] memory active = new uint256[](total);
        uint256 count = 0;
        for (uint256 i = 0; i < total; ) {
            if (quests[i].status == QuestStatus.Active && block.timestamp <= quests[i].endTime) {
                active[count] = i;
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
            result[i] = active[i];
            unchecked {
                ++i;
            }
        }
        return result;
    }

    function isCompleted(uint256 questId, address player) external view returns (bool) {
        return completed[questId][player] || playerQuests[player][questId].completed;
    }

    function _completeQuest(uint256 questId, address player) private {
        completed[questId][player] = true;
        completers[questId].add(player);

        PlayerQuest storage pq = playerQuests[player][questId];
        pq.completed = true;
        pq.claimed = false;
        pq.completedAt = block.timestamp;
        emit QuestCompleted(questId, player);
    }
}
