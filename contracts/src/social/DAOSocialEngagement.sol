// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";
import {OperatorOwnable} from "../gamification/OperatorOwnable.sol";

/**
 * @title DAOSocialEngagement
 * @notice Gamified DAO participation: votes, proposals, comments, and streaks.
 */
contract DAOSocialEngagement is OperatorOwnable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    enum EngagementType {
        Vote,
        Proposal,
        Comment,
        Attend,
        Create,
        Moderate
    }

    struct Engagement {
        uint256 id;
        address member;
        EngagementType engagementType;
        uint256 weight;
        uint256 timestamp;
        string metadata;
    }

    struct MemberStats {
        uint256 totalEngagement;
        uint256 engagementScore;
        uint256 votingPower;
        uint256 lastActive;
        uint256 streak;
        uint256 bestStreak;
    }

    IERC20 public immutable rewardToken;

    mapping(address => MemberStats) public memberStats;
    mapping(address => uint256[]) public memberEngagements;
    mapping(uint256 => Engagement) public engagements;
    mapping(EngagementType => uint256) public engagementWeights;

    EnumerableSet.AddressSet private _members;

    uint256 public nextEngagementId;
    uint256 public engagementMultiplier = 1;

    event EngagementRecorded(address indexed member, EngagementType engagementType, uint256 weight);
    event RewardClaimed(address indexed member, uint256 amount);

    error NoRewards();

    constructor(address rewardToken_, address initialOwner) OperatorOwnable(initialOwner) {
        require(rewardToken_ != address(0), "Zero address");
        rewardToken = IERC20(rewardToken_);

        engagementWeights[EngagementType.Vote] = 10;
        engagementWeights[EngagementType.Proposal] = 25;
        engagementWeights[EngagementType.Comment] = 5;
        engagementWeights[EngagementType.Attend] = 15;
        engagementWeights[EngagementType.Create] = 20;
        engagementWeights[EngagementType.Moderate] = 30;
    }

    function recordEngagement(
        address member,
        EngagementType engagementType,
        string calldata metadata
    ) external onlyOperator {
        require(member != address(0), "Zero address");
        uint256 weight = engagementWeights[engagementType] * engagementMultiplier;

        uint256 id = nextEngagementId++;
        engagements[id] = Engagement({
            id: id,
            member: member,
            engagementType: engagementType,
            weight: weight,
            timestamp: block.timestamp,
            metadata: metadata
        });

        memberEngagements[member].push(id);
        _members.add(member);

        MemberStats storage stats = memberStats[member];
        uint256 previous = stats.lastActive;
        stats.totalEngagement += weight;
        stats.engagementScore += weight;
        stats.votingPower = stats.totalEngagement / 100;

        if (previous == 0) {
            stats.streak = 1;
            stats.bestStreak = 1;
        } else if (block.timestamp <= previous + 2 days) {
            if (block.timestamp >= previous + 1 days) {
                stats.streak++;
                if (stats.streak > stats.bestStreak) {
                    stats.bestStreak = stats.streak;
                }
            }
        } else {
            stats.streak = 1;
        }

        stats.lastActive = block.timestamp;
        emit EngagementRecorded(member, engagementType, weight);
    }

    function claimRewards() external nonReentrant {
        uint256 reward = _calculateReward(msg.sender);
        if (reward == 0) revert NoRewards();

        memberStats[msg.sender].engagementScore = 0;
        rewardToken.safeTransfer(msg.sender, reward);
        emit RewardClaimed(msg.sender, reward);
    }

    function getMemberStats(address member) external view returns (MemberStats memory) {
        return memberStats[member];
    }

    function getEngagements(address member) external view returns (uint256[] memory) {
        return memberEngagements[member];
    }

    function getEngagement(uint256 id) external view returns (Engagement memory) {
        return engagements[id];
    }

    function getPendingRewards(address member) external view returns (uint256) {
        return _calculateReward(member);
    }

    function getTopMembers(uint256 count) external view returns (address[] memory, uint256[] memory) {
        uint256 total = _members.length();
        uint256 maxCount = count > total ? total : count;
        address[] memory users = _members.values();

        for (uint256 i = 0; i < total; ) {
            for (uint256 j = i + 1; j < total; ) {
                if (memberStats[users[j]].totalEngagement > memberStats[users[i]].totalEngagement) {
                    (users[i], users[j]) = (users[j], users[i]);
                }
                unchecked {
                    ++j;
                }
            }
            unchecked {
                ++i;
            }
        }

        address[] memory topUsers = new address[](maxCount);
        uint256[] memory scores = new uint256[](maxCount);
        for (uint256 i = 0; i < maxCount; ) {
            topUsers[i] = users[i];
            scores[i] = memberStats[users[i]].totalEngagement;
            unchecked {
                ++i;
            }
        }
        return (topUsers, scores);
    }

    function setEngagementWeight(EngagementType engagementType, uint256 weight) external onlyOwner {
        engagementWeights[engagementType] = weight;
    }

    function setEngagementMultiplier(uint256 multiplier) external onlyOwner {
        require(multiplier > 0, "Multiplier required");
        engagementMultiplier = multiplier;
    }

    function _calculateReward(address member) private view returns (uint256) {
        return (memberStats[member].engagementScore * 1e18) / 10;
    }
}
