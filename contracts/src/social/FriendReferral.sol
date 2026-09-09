// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";

/**
 * @title FriendReferral
 * @notice Multi-tier invite program. Rewards accrue on bind and are claimed once.
 */
contract FriendReferral is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Referral {
        address referrer;
        uint256 referredAt;
        uint256 tier;
        uint256 totalRewards;
        bool active;
    }

    struct TierConfig {
        uint256 tier;
        uint256 rewardAmount;
        uint256 referralCountRequired;
        uint256 bonusMultiplier;
    }

    IERC20 public immutable rewardToken;

    mapping(address => Referral) public referrals;
    mapping(address => uint256) public referralCount;
    mapping(address => uint256) public referralEarnings;
    mapping(uint256 => TierConfig) public tierConfigs;

    uint256 public baseReward = 10 * 10 ** 18;

    event ReferralUsed(address indexed referee, address indexed referrer, uint256 tier);
    event ReferralRewardClaimed(address indexed referrer, uint256 amount);
    event TierUpgraded(address indexed user, uint256 newTier);

    error SelfReferral();
    error AlreadyReferred();
    error InvalidReferrer();
    error NoRewards();

    constructor(address rewardToken_, address initialOwner) Ownable(initialOwner) {
        require(rewardToken_ != address(0), "Zero address");
        rewardToken = IERC20(rewardToken_);

        tierConfigs[1] = TierConfig(1, 10, 0, 100);
        tierConfigs[2] = TierConfig(2, 15, 5, 120);
        tierConfigs[3] = TierConfig(3, 20, 15, 150);
        tierConfigs[4] = TierConfig(4, 30, 30, 200);
        tierConfigs[5] = TierConfig(5, 50, 50, 300);
    }

    function setReferrer(address referrer) external {
        if (referrer == address(0) || referrer == msg.sender) revert SelfReferral();
        if (referrals[msg.sender].referrer != address(0)) revert AlreadyReferred();
        if (referrals[referrer].referrer == msg.sender) revert InvalidReferrer();

        uint256 tier = _calculateTier(referrer);
        referrals[msg.sender] = Referral({
            referrer: referrer,
            referredAt: block.timestamp,
            tier: tier,
            totalRewards: baseReward,
            active: true
        });

        referralCount[referrer]++;

        uint256 referrerReward = _calculateReferralReward(referrer);
        referralEarnings[referrer] += referrerReward;
        referrals[referrer].totalRewards += referrerReward;
        referralEarnings[msg.sender] += baseReward;

        emit ReferralUsed(msg.sender, referrer, tier);
    }

    function claimRewards() external nonReentrant {
        uint256 amount = referralEarnings[msg.sender];
        if (amount == 0) revert NoRewards();
        referralEarnings[msg.sender] = 0;
        rewardToken.safeTransfer(msg.sender, amount);
        emit ReferralRewardClaimed(msg.sender, amount);
    }

    function upgradeTier(address user) external {
        uint256 newTier = _calculateTier(user);
        if (newTier > referrals[user].tier) {
            referrals[user].tier = newTier;
            emit TierUpgraded(user, newTier);
        }
    }

    function getReferral(address user) external view returns (Referral memory) {
        return referrals[user];
    }

    function getReferralCount(address user) external view returns (uint256) {
        return referralCount[user];
    }

    function getTierConfig(uint256 tier) external view returns (TierConfig memory) {
        return tierConfigs[tier];
    }

    function getPendingRewards(address user) external view returns (uint256) {
        return referralEarnings[user];
    }

    function fund(uint256 amount) external {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    function setBaseReward(uint256 amount) external onlyOwner {
        baseReward = amount;
    }

    function setTierConfig(uint256 tier, uint256 reward, uint256 countRequired, uint256 multiplier) external onlyOwner {
        require(tier >= 1 && tier <= 5, "Invalid tier");
        tierConfigs[tier] = TierConfig({
            tier: tier,
            rewardAmount: reward,
            referralCountRequired: countRequired,
            bonusMultiplier: multiplier
        });
    }

    function _calculateTier(address user) private view returns (uint256) {
        uint256 count = referralCount[user];
        if (count >= tierConfigs[5].referralCountRequired) return 5;
        if (count >= tierConfigs[4].referralCountRequired) return 4;
        if (count >= tierConfigs[3].referralCountRequired) return 3;
        if (count >= tierConfigs[2].referralCountRequired) return 2;
        return 1;
    }

    function _calculateReferralReward(address referrer) private view returns (uint256) {
        uint256 tier = _calculateTier(referrer);
        return (baseReward * tierConfigs[tier].bonusMultiplier) / 100;
    }
}
