// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {OperatorOwnable} from "./OperatorOwnable.sol";
import {IExperienceSystem} from "./interfaces/IExperienceSystem.sol";
import {IAchievementBadges} from "./interfaces/IAchievementBadges.sol";

/**
 * @title QuestSystem
 * @notice On-chain quests with daily/weekly/special objectives and claimable rewards.
 */
contract QuestSystem is OperatorOwnable {
    using SafeERC20 for IERC20;

    enum QuestType {
        Daily,
        Weekly,
        Special,
        Achievement
    }

    enum ObjectiveType {
        WinMatches,
        PlayMatches,
        EarnXP,
        CollectNFT,
        ReferFriend,
        ReachLevel,
        DailyLogin
    }

    struct Quest {
        uint256 id;
        string name;
        string description;
        QuestType questType;
        ObjectiveType objectiveType;
        uint256 target;
        uint256 rewardXP;
        uint256 rewardTokens;
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
        bool accepted;
        bool completed;
        bool claimed;
        uint256 startedAt;
        uint256 completedAt;
        uint256 lastClaimed;
    }

    mapping(uint256 => Quest) public quests;
    mapping(address => mapping(uint256 => PlayerQuest)) public playerQuests;
    mapping(address => uint256[]) public playerQuestIds;

    IERC20 public rewardToken;
    IExperienceSystem public xpSystem;
    IAchievementBadges public badges;

    uint256 public nextQuestId = 1;
    uint256 public dailyQuestLimit = 5;
    uint256 public weeklyQuestLimit = 10;

    event QuestCreated(uint256 indexed id, string name, QuestType questType);
    event QuestAccepted(uint256 indexed id, address indexed player);
    event QuestProgressed(uint256 indexed id, address indexed player, uint256 progress);
    event QuestCompleted(uint256 indexed id, address indexed player);
    event QuestClaimed(uint256 indexed id, address indexed player);

    constructor(address _rewardToken, address _xpSystem) OperatorOwnable(msg.sender) {
        require(_rewardToken != address(0) && _xpSystem != address(0), "Invalid deps");
        rewardToken = IERC20(_rewardToken);
        xpSystem = IExperienceSystem(_xpSystem);
    }

    function setBadges(address _badges) external onlyOwner {
        badges = IAchievementBadges(_badges);
    }

    function createQuest(
        string memory name,
        string memory description,
        QuestType questType,
        ObjectiveType objectiveType,
        uint256 target,
        uint256 rewardXP,
        uint256 rewardTokens,
        uint256 rewardBadgeId,
        uint256 durationDays,
        uint256 repeatCooldown
    ) external onlyOwner returns (uint256) {
        require(bytes(name).length > 0, "Name required");
        require(target > 0, "Target required");
        require(durationDays > 0, "Duration required");

        uint256 id = nextQuestId++;
        quests[id] = Quest({
            id: id,
            name: name,
            description: description,
            questType: questType,
            objectiveType: objectiveType,
            target: target,
            rewardXP: rewardXP,
            rewardTokens: rewardTokens,
            rewardBadgeId: rewardBadgeId,
            active: true,
            startTime: block.timestamp,
            endTime: block.timestamp + (durationDays * 1 days),
            repeatCooldown: repeatCooldown
        });

        emit QuestCreated(id, name, questType);
        return id;
    }

    function setQuestActive(uint256 questId, bool active) external onlyOwner {
        require(quests[questId].id == questId, "Unknown quest");
        quests[questId].active = active;
    }

    function acceptQuest(uint256 questId) external {
        Quest storage quest = quests[questId];
        require(quest.id == questId, "Unknown quest");
        require(quest.active, "Quest not active");
        require(block.timestamp >= quest.startTime && block.timestamp <= quest.endTime, "Quest not available");

        PlayerQuest storage pq = playerQuests[msg.sender][questId];
        require(!pq.accepted || pq.claimed, "Already accepted");

        if (pq.claimed) {
            require(quest.repeatCooldown > 0, "Not repeatable");
            require(block.timestamp - pq.lastClaimed >= quest.repeatCooldown, "Cooldown active");
        }

        uint256 activeCount = _getActiveQuestCount(msg.sender);
        if (quest.questType == QuestType.Daily) {
            require(activeCount < dailyQuestLimit, "Daily quest limit reached");
        } else if (quest.questType == QuestType.Weekly) {
            require(activeCount < weeklyQuestLimit, "Weekly quest limit reached");
        }

        bool firstAccept = pq.questId == 0;
        pq.questId = questId;
        pq.player = msg.sender;
        pq.progress = 0;
        pq.accepted = true;
        pq.completed = false;
        pq.claimed = false;
        pq.startedAt = block.timestamp;
        pq.completedAt = 0;

        if (firstAccept) {
            playerQuestIds[msg.sender].push(questId);
        }

        emit QuestAccepted(questId, msg.sender);
    }

    function updateQuestProgress(address player, uint256 questId, uint256 increment) external onlyOperator {
        PlayerQuest storage pq = playerQuests[player][questId];
        require(pq.accepted, "Quest not accepted");
        require(!pq.completed, "Quest already completed");
        require(increment > 0, "No progress");

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
        require(pq.accepted, "Quest not accepted");
        require(pq.completed, "Quest not completed");
        require(!pq.claimed, "Already claimed");

        Quest storage quest = quests[questId];
        pq.claimed = true;
        pq.accepted = false;
        pq.lastClaimed = block.timestamp;

        if (quest.rewardXP > 0) {
            xpSystem.addXP(msg.sender, quest.rewardXP, "Quest Complete");
        }

        if (quest.rewardTokens > 0) {
            rewardToken.safeTransfer(msg.sender, quest.rewardTokens);
        }

        if (quest.rewardBadgeId > 0 && address(badges) != address(0)) {
            badges.awardBadge(msg.sender, quest.rewardBadgeId);
        }

        emit QuestClaimed(questId, msg.sender);
    }

    function getQuest(uint256 questId) external view returns (Quest memory) {
        return quests[questId];
    }

    function getPlayerQuests(address player) external view returns (uint256[] memory) {
        return playerQuestIds[player];
    }

    function getPlayerQuest(address player, uint256 questId) external view returns (PlayerQuest memory) {
        return playerQuests[player][questId];
    }

    function getAvailableQuests(address player) external view returns (uint256[] memory) {
        uint256 total = nextQuestId - 1;
        uint256[] memory available = new uint256[](total);
        uint256 count = 0;
        for (uint256 i = 1; i <= total; ) {
            Quest storage quest = quests[i];
            PlayerQuest storage pq = playerQuests[player][i];
            bool occupied = pq.accepted && !pq.claimed;
            if (
                quest.active &&
                block.timestamp >= quest.startTime &&
                block.timestamp <= quest.endTime &&
                !occupied
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

    function _getActiveQuestCount(address player) private view returns (uint256 count) {
        uint256[] storage questIds = playerQuestIds[player];
        for (uint256 i = 0; i < questIds.length; ) {
            PlayerQuest storage pq = playerQuests[player][questIds[i]];
            if (pq.accepted && !pq.completed) {
                unchecked {
                    ++count;
                }
            }
            unchecked {
                ++i;
            }
        }
    }
}
