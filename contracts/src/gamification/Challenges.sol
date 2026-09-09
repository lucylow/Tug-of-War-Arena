// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {OperatorOwnable} from "./OperatorOwnable.sol";
import {IExperienceSystem} from "./interfaces/IExperienceSystem.sol";
import {IAchievementBadges} from "./interfaces/IAchievementBadges.sol";

/**
 * @title Challenges
 * @notice Daily and weekly challenges that reset by epoch instead of wiping mappings.
 */
contract Challenges is OperatorOwnable {
    using SafeERC20 for IERC20;

    enum ChallengeType {
        Daily,
        Weekly
    }

    enum ChallengeObjective {
        WinMatches,
        PlayMatches,
        EarnXP,
        CollectNFT,
        ReferFriend
    }

    struct Challenge {
        uint256 id;
        string name;
        string description;
        ChallengeType challengeType;
        ChallengeObjective objective;
        uint256 target;
        uint256 rewardXP;
        uint256 rewardTokens;
        uint256 rewardBadgeId;
        bool active;
        uint256 resetInterval;
        uint256 createdAt;
    }

    struct PlayerChallenge {
        uint256 challengeId;
        address player;
        uint256 progress;
        bool accepted;
        bool completed;
        bool claimed;
        uint256 startedAt;
        uint256 completedAt;
        uint256 epoch;
    }

    mapping(uint256 => Challenge) public challenges;
    mapping(address => mapping(uint256 => mapping(uint256 => PlayerChallenge))) public playerChallenges;
    mapping(address => uint256[]) public playerChallengeIds;

    IERC20 public rewardToken;
    IExperienceSystem public xpSystem;
    IAchievementBadges public badges;

    uint256 public nextChallengeId = 1;

    event ChallengeCreated(uint256 indexed id, string name, ChallengeType challengeType);
    event ChallengeProgressed(uint256 indexed id, address indexed player, uint256 progress, uint256 epoch);
    event ChallengeCompleted(uint256 indexed id, address indexed player, uint256 epoch);
    event ChallengeClaimed(uint256 indexed id, address indexed player, uint256 epoch);

    constructor(address _rewardToken, address _xpSystem) OperatorOwnable(msg.sender) {
        rewardToken = IERC20(_rewardToken);
        xpSystem = IExperienceSystem(_xpSystem);
        _createInitialChallenges();
    }

    function setBadges(address _badges) external onlyOwner {
        badges = IAchievementBadges(_badges);
    }

    function createChallenge(
        string memory name,
        string memory description,
        ChallengeType challengeType,
        ChallengeObjective objective,
        uint256 target,
        uint256 rewardXP,
        uint256 rewardTokens,
        uint256 rewardBadgeId,
        uint256 resetInterval
    ) external onlyOwner returns (uint256) {
        return _createChallenge(
            name, description, challengeType, objective, target, rewardXP, rewardTokens, rewardBadgeId, resetInterval
        );
    }

    function acceptChallenge(uint256 challengeId) external {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.id == challengeId, "Unknown challenge");
        require(challenge.active, "Challenge not active");

        uint256 epoch = currentEpoch(challengeId);
        PlayerChallenge storage pc = playerChallenges[msg.sender][challengeId][epoch];
        require(!pc.accepted, "Already accepted");

        pc.challengeId = challengeId;
        pc.player = msg.sender;
        pc.progress = 0;
        pc.accepted = true;
        pc.completed = false;
        pc.claimed = false;
        pc.startedAt = block.timestamp;
        pc.epoch = epoch;

        if (!_hasChallenge(msg.sender, challengeId)) {
            playerChallengeIds[msg.sender].push(challengeId);
        }

        emit ChallengeProgressed(challengeId, msg.sender, 0, epoch);
    }

    function updateChallengeProgress(address player, uint256 challengeId, uint256 increment) external onlyOperator {
        uint256 epoch = currentEpoch(challengeId);
        PlayerChallenge storage pc = playerChallenges[player][challengeId][epoch];
        require(pc.accepted, "Challenge not accepted");
        require(!pc.completed, "Already completed");
        require(increment > 0, "No progress");

        pc.progress += increment;
        emit ChallengeProgressed(challengeId, player, pc.progress, epoch);

        if (pc.progress >= challenges[challengeId].target) {
            pc.completed = true;
            pc.completedAt = block.timestamp;
            emit ChallengeCompleted(challengeId, player, epoch);
        }
    }

    function claimChallenge(uint256 challengeId) external {
        uint256 epoch = currentEpoch(challengeId);
        PlayerChallenge storage pc = playerChallenges[msg.sender][challengeId][epoch];
        require(pc.accepted, "Challenge not accepted");
        require(pc.completed, "Challenge not completed");
        require(!pc.claimed, "Already claimed");

        pc.claimed = true;
        Challenge storage challenge = challenges[challengeId];

        if (challenge.rewardXP > 0 && address(xpSystem) != address(0)) {
            xpSystem.addXP(msg.sender, challenge.rewardXP, "Challenge Complete");
        }
        if (challenge.rewardTokens > 0 && address(rewardToken) != address(0)) {
            rewardToken.safeTransfer(msg.sender, challenge.rewardTokens);
        }
        if (challenge.rewardBadgeId > 0 && address(badges) != address(0)) {
            badges.awardBadge(msg.sender, challenge.rewardBadgeId);
        }

        emit ChallengeClaimed(challengeId, msg.sender, epoch);
    }

    function currentEpoch(uint256 challengeId) public view returns (uint256) {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.resetInterval > 0, "Unknown challenge");
        return (block.timestamp - challenge.createdAt) / challenge.resetInterval;
    }

    function getChallenge(uint256 challengeId) external view returns (Challenge memory) {
        return challenges[challengeId];
    }

    function getPlayerChallenges(address player) external view returns (uint256[] memory) {
        return playerChallengeIds[player];
    }

    function getPlayerChallenge(address player, uint256 challengeId) external view returns (PlayerChallenge memory) {
        return playerChallenges[player][challengeId][currentEpoch(challengeId)];
    }

    function getActiveChallenges() external view returns (uint256[] memory) {
        uint256 total = nextChallengeId - 1;
        uint256[] memory active = new uint256[](total);
        uint256 count = 0;
        for (uint256 i = 1; i <= total; ) {
            if (challenges[i].active) {
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

    function _createInitialChallenges() private {
        _createChallenge("Win 3 Matches", "Win 3 matches today", ChallengeType.Daily, ChallengeObjective.WinMatches, 3, 50, 10 ether, 0, 1 days);
        _createChallenge("Play 5 Matches", "Play 5 matches today", ChallengeType.Daily, ChallengeObjective.PlayMatches, 5, 30, 5 ether, 0, 1 days);
        _createChallenge("Earn 200 XP", "Earn 200 XP today", ChallengeType.Daily, ChallengeObjective.EarnXP, 200, 40, 8 ether, 0, 1 days);
        _createChallenge("Win 15 Matches", "Win 15 matches this week", ChallengeType.Weekly, ChallengeObjective.WinMatches, 15, 200, 50 ether, 0, 7 days);
        _createChallenge("Play 30 Matches", "Play 30 matches this week", ChallengeType.Weekly, ChallengeObjective.PlayMatches, 30, 150, 30 ether, 0, 7 days);
        _createChallenge("Earn 1000 XP", "Earn 1000 XP this week", ChallengeType.Weekly, ChallengeObjective.EarnXP, 1000, 250, 60 ether, 0, 7 days);
    }

    function _createChallenge(
        string memory name,
        string memory description,
        ChallengeType challengeType,
        ChallengeObjective objective,
        uint256 target,
        uint256 rewardXP,
        uint256 rewardTokens,
        uint256 rewardBadgeId,
        uint256 resetInterval
    ) private returns (uint256) {
        require(target > 0 && resetInterval > 0, "Invalid challenge");
        uint256 id = nextChallengeId++;
        challenges[id] = Challenge({
            id: id,
            name: name,
            description: description,
            challengeType: challengeType,
            objective: objective,
            target: target,
            rewardXP: rewardXP,
            rewardTokens: rewardTokens,
            rewardBadgeId: rewardBadgeId,
            active: true,
            resetInterval: resetInterval,
            createdAt: block.timestamp
        });
        emit ChallengeCreated(id, name, challengeType);
        return id;
    }

    function _hasChallenge(address player, uint256 challengeId) private view returns (bool) {
        uint256[] storage ids = playerChallengeIds[player];
        for (uint256 i = 0; i < ids.length; ) {
            if (ids[i] == challengeId) return true;
            unchecked {
                ++i;
            }
        }
        return false;
    }
}
