// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";
import {OperatorOwnable} from "../gamification/OperatorOwnable.sol";
import {MathUtils} from "../utils/MathUtils.sol";

/**
 * @title ReputationStaking
 * @notice Stake FZONE to mint XP, levels, trust, and a composite reputation score.
 * @dev Lock duration sets a reward multiplier (1.0x–3.0x). Daily XP accrues from
 *      still-locked principal. `unstake` takes a global stake id, not an array index.
 */
contract ReputationStaking is OperatorOwnable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Reputation {
        uint256 score;
        uint256 trustLevel;
        uint256 xp;
        uint256 level;
        uint256 stakedAmount;
        uint256 lastStakeTime;
        uint256 totalStaked;
        uint256 referrals;
        uint256 contentScore;
        uint256 voteScore;
        bool verified;
        string metadata;
    }

    struct Stake {
        uint256 id;
        address staker;
        uint256 amount;
        uint256 stakedAt;
        uint256 lockDuration;
        bool active;
        uint256 rewardMultiplier;
    }

    IERC20 public immutable stakingToken;

    mapping(address => Reputation) public reputations;
    mapping(uint256 => Stake) public stakes;
    mapping(address => uint256[]) public userStakeIds;
    EnumerableSet.AddressSet private activeUsers;

    uint256 public nextStakeId;
    uint256 public minStake = 10e18;
    uint256 public xpPerDayPerToken = 1;
    uint256 public maxLevel = 100;
    uint256 public verificationThreshold = 1000;

    event Staked(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 multiplier);
    event Unstaked(address indexed user, uint256 indexed stakeId, uint256 amount);
    event XPAdded(address indexed user, uint256 amount, string source);
    event LevelUp(address indexed user, uint256 newLevel);
    event ReputationUpdated(address indexed user, uint256 newScore);
    event Verified(address indexed user);
    event MetadataUpdated(address indexed user, string metadata);

    error AmountBelowMinimum();
    error LockTooShort();
    error StakeInactive();
    error NotStaker();
    error StillLocked();
    error InsufficientReputation();
    error UnknownStake();

    constructor(address stakingToken_, address initialOwner) OperatorOwnable(initialOwner) {
        require(stakingToken_ != address(0), "Zero address");
        stakingToken = IERC20(stakingToken_);
    }

    function stake(uint256 amount, uint256 lockDuration) external nonReentrant returns (uint256 stakeId) {
        if (amount < minStake) revert AmountBelowMinimum();
        if (lockDuration < 7 days) revert LockTooShort();

        _accrueStakeXP(msg.sender);
        uint256 multiplier = _getMultiplier(lockDuration);
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        stakeId = nextStakeId++;
        stakes[stakeId] = Stake({
            id: stakeId,
            staker: msg.sender,
            amount: amount,
            stakedAt: block.timestamp,
            lockDuration: lockDuration,
            active: true,
            rewardMultiplier: multiplier
        });
        userStakeIds[msg.sender].push(stakeId);

        Reputation storage rep = reputations[msg.sender];
        rep.stakedAmount += amount;
        rep.totalStaked += amount;
        rep.lastStakeTime = block.timestamp;
        activeUsers.add(msg.sender);

        uint256 xpBonus = (amount / 1e18) * 10 * multiplier / 100;
        _addXP(msg.sender, xpBonus, "Stake");

        emit Staked(msg.sender, stakeId, amount, multiplier);
    }

    function unstake(uint256 stakeId) external nonReentrant {
        Stake storage stakeInfo = stakes[stakeId];
        if (stakeInfo.staker == address(0)) revert UnknownStake();
        if (stakeInfo.staker != msg.sender) revert NotStaker();
        if (!stakeInfo.active) revert StakeInactive();
        if (block.timestamp < stakeInfo.stakedAt + stakeInfo.lockDuration) revert StillLocked();

        _accrueStakeXP(msg.sender);
        stakeInfo.active = false;

        Reputation storage rep = reputations[msg.sender];
        rep.stakedAmount -= stakeInfo.amount;
        rep.lastStakeTime = block.timestamp;
        _refreshScore(msg.sender);

        stakingToken.safeTransfer(msg.sender, stakeInfo.amount);
        emit Unstaked(msg.sender, stakeId, stakeInfo.amount);

        if (rep.stakedAmount == 0) {
            activeUsers.remove(msg.sender);
        }
    }

    function accrueXP() external {
        _accrueStakeXP(msg.sender);
    }

    function addXP(address user, uint256 amount, string calldata source) external onlyOperator {
        _addXP(user, amount, source);
    }

    function updateSocialContributions(
        address user,
        uint256 referrals,
        uint256 contentScore,
        uint256 voteScore
    ) external onlyOperator {
        Reputation storage rep = reputations[user];
        rep.referrals += referrals;
        rep.contentScore += contentScore;
        rep.voteScore += voteScore;
        _refreshScore(user);
        emit ReputationUpdated(user, rep.score);
    }

    function verifyUser(address user) external onlyOwner {
        if (reputations[user].score < verificationThreshold) revert InsufficientReputation();
        reputations[user].verified = true;
        emit Verified(user);
    }

    function setMetadata(string calldata metadata) external {
        reputations[msg.sender].metadata = metadata;
        emit MetadataUpdated(msg.sender, metadata);
    }

    function setMinStake(uint256 amount) external onlyOwner {
        minStake = amount;
    }

    function setVerificationThreshold(uint256 threshold) external onlyOwner {
        verificationThreshold = threshold;
    }

    function getReputation(address user) external view returns (Reputation memory) {
        return reputations[user];
    }

    function getStakes(address user) external view returns (Stake[] memory list) {
        uint256[] memory ids = userStakeIds[user];
        list = new Stake[](ids.length);
        for (uint256 i = 0; i < ids.length; ) {
            list[i] = stakes[ids[i]];
            unchecked {
                ++i;
            }
        }
    }

    function pendingXP(address user) public view returns (uint256) {
        Reputation storage rep = reputations[user];
        if (rep.stakedAmount == 0 || rep.lastStakeTime == 0) return 0;
        uint256 elapsedDays = (block.timestamp - rep.lastStakeTime) / 1 days;
        return elapsedDays * (rep.stakedAmount / 1e18) * xpPerDayPerToken;
    }

    function getTopUsers(uint256 count) external view returns (address[] memory, uint256[] memory) {
        uint256 total = activeUsers.length();
        uint256 maxCount = count > total ? total : count;

        address[] memory users = activeUsers.values();
        uint256[] memory scores = new uint256[](total);

        for (uint256 i = 0; i < total; ) {
            scores[i] = reputations[users[i]].score;
            unchecked {
                ++i;
            }
        }

        for (uint256 i = 0; i < total; ) {
            for (uint256 j = i + 1; j < total; ) {
                if (scores[j] > scores[i]) {
                    (scores[i], scores[j]) = (scores[j], scores[i]);
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
        uint256[] memory topScores = new uint256[](maxCount);
        for (uint256 i = 0; i < maxCount; ) {
            topUsers[i] = users[i];
            topScores[i] = scores[i];
            unchecked {
                ++i;
            }
        }
        return (topUsers, topScores);
    }

    function _accrueStakeXP(address user) private {
        uint256 pending = pendingXP(user);
        Reputation storage rep = reputations[user];
        if (rep.stakedAmount > 0) {
            rep.lastStakeTime = block.timestamp;
        }
        if (pending > 0) {
            _addXP(user, pending, "StakeTime");
        }
    }

    function _addXP(address user, uint256 amount, string memory source) private {
        if (amount == 0) return;
        Reputation storage rep = reputations[user];
        rep.xp += amount;

        uint256 newLevel = _calculateLevel(rep.xp);
        if (newLevel > rep.level) {
            rep.level = newLevel;
            emit LevelUp(user, newLevel);
        }

        _refreshScore(user);
        emit XPAdded(user, amount, source);
        emit ReputationUpdated(user, rep.score);
    }

    function _refreshScore(address user) private {
        Reputation storage rep = reputations[user];
        rep.trustLevel = _calculateTrustLevel(rep);
        rep.score = _calculateReputationScore(rep);
    }

    function _calculateLevel(uint256 xp) private view returns (uint256) {
        uint256 level = xp / 1000;
        if (level == 0) return 1;
        return MathUtils.min(level, maxLevel);
    }

    function _calculateTrustLevel(Reputation storage rep) private view returns (uint256) {
        uint256 trust = 50 + (rep.xp / 1000) + (rep.stakedAmount / 1e18);
        return trust > 100 ? 100 : trust;
    }

    function _calculateReputationScore(Reputation storage rep) private view returns (uint256) {
        uint256 score = rep.xp / 10;
        score += (rep.stakedAmount / 1e18) * 5;
        score += rep.referrals * 10;
        score += rep.contentScore;
        score += rep.voteScore;
        return score;
    }

    function _getMultiplier(uint256 lockDuration) private pure returns (uint256) {
        if (lockDuration >= 365 days) return 300;
        if (lockDuration >= 180 days) return 200;
        if (lockDuration >= 90 days) return 150;
        if (lockDuration >= 30 days) return 120;
        return 100;
    }
}
