// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";

/**
 * @title CheckInStreak
 * @notice Daily check-in with escalating streak rewards and milestone bonuses.
 * @dev Rewards are paid from the contract's FZONE balance. A 48h window keeps
 *      the streak alive across time zones; a second check-in on the same UTC
 *      day is rejected.
 */
contract CheckInStreak is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct CheckIn {
        uint256 lastCheckIn;
        uint256 streak;
        uint256 bestStreak;
        uint256 totalCheckIns;
        uint256 rewardsClaimed;
        uint256 lastClaimTime;
    }

    struct Milestone {
        uint256 dayTarget;
        uint256 bonusReward;
        bool active;
    }

    IERC20 public immutable rewardToken;

    mapping(address => CheckIn) public checkIns;
    mapping(address => mapping(uint256 => bool)) public milestoneClaimed;
    mapping(uint256 => Milestone) public milestones;

    uint256 public baseReward = 1e18;
    uint256 public streakBonus = 5;
    uint256 public checkInWindow = 48 hours;
    uint256 public nextMilestoneId;

    event CheckedIn(address indexed user, uint256 streak, uint256 reward);
    event MilestoneReached(address indexed user, uint256 dayTarget, uint256 bonus);
    event MilestoneAdded(uint256 indexed milestoneId, uint256 dayTarget, uint256 bonusReward);
    event MilestoneToggled(uint256 indexed milestoneId, bool active);

    error AlreadyCheckedInToday();

    constructor(address rewardToken_, address initialOwner) Ownable(initialOwner) {
        require(rewardToken_ != address(0), "Zero address");
        rewardToken = IERC20(rewardToken_);
        _initializeMilestones();
    }

    function checkIn() external nonReentrant {
        CheckIn storage record = checkIns[msg.sender];
        uint256 currentDay = block.timestamp / 1 days;

        if (record.lastCheckIn / 1 days == currentDay && record.lastCheckIn != 0) {
            revert AlreadyCheckedInToday();
        }

        bool streakAlive = record.lastCheckIn > 0 && (block.timestamp - record.lastCheckIn) < checkInWindow;
        if (streakAlive) {
            record.streak += 1;
        } else {
            record.streak = 1;
        }

        if (record.streak > record.bestStreak) {
            record.bestStreak = record.streak;
        }

        record.lastCheckIn = block.timestamp;
        record.lastClaimTime = block.timestamp;
        record.totalCheckIns += 1;

        uint256 reward = baseReward + (record.streak * streakBonus * 1e18);
        record.rewardsClaimed += reward;
        rewardToken.safeTransfer(msg.sender, reward);

        _checkMilestones(record);
        emit CheckedIn(msg.sender, record.streak, reward);
    }

    function addMilestone(uint256 dayTarget, uint256 bonusReward) external onlyOwner {
        uint256 id = nextMilestoneId++;
        milestones[id] = Milestone(dayTarget, bonusReward, true);
        emit MilestoneAdded(id, dayTarget, bonusReward);
    }

    function toggleMilestone(uint256 milestoneId) external onlyOwner {
        milestones[milestoneId].active = !milestones[milestoneId].active;
        emit MilestoneToggled(milestoneId, milestones[milestoneId].active);
    }

    function setBaseReward(uint256 amount) external onlyOwner {
        baseReward = amount;
    }

    function setStreakBonus(uint256 amount) external onlyOwner {
        streakBonus = amount;
    }

    function getCheckIn(address user) external view returns (uint256 streak, uint256 bestStreak, uint256 totalCheckIns, uint256 rewardsClaimed) {
        CheckIn storage record = checkIns[user];
        return (record.streak, record.bestStreak, record.totalCheckIns, record.rewardsClaimed);
    }

    function canCheckIn(address user) external view returns (bool) {
        CheckIn storage record = checkIns[user];
        if (record.lastCheckIn == 0) return true;
        return record.lastCheckIn / 1 days != block.timestamp / 1 days;
    }

    function hasMilestone(address user, uint256 milestoneId) external view returns (bool) {
        return milestoneClaimed[user][milestoneId];
    }

    function _initializeMilestones() private {
        milestones[0] = Milestone(7, 10e18, true);
        milestones[1] = Milestone(30, 50e18, true);
        milestones[2] = Milestone(100, 200e18, true);
        nextMilestoneId = 3;
    }

    function _checkMilestones(CheckIn storage record) private {
        for (uint256 i = 0; i < nextMilestoneId; ) {
            Milestone storage milestone = milestones[i];
            if (milestone.active && record.streak >= milestone.dayTarget && !milestoneClaimed[msg.sender][i]) {
                milestoneClaimed[msg.sender][i] = true;
                if (milestone.bonusReward > 0) {
                    rewardToken.safeTransfer(msg.sender, milestone.bonusReward);
                    record.rewardsClaimed += milestone.bonusReward;
                }
                emit MilestoneReached(msg.sender, milestone.dayTarget, milestone.bonusReward);
            }
            unchecked {
                ++i;
            }
        }
    }
}
