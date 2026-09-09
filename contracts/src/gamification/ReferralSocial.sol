// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {OperatorOwnable} from "./OperatorOwnable.sol";

/**
 * @title ReferralSocial
 * @notice Pull-based referral rewards plus one-time social engagement claims.
 */
contract ReferralSocial is OperatorOwnable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    struct Referral {
        address referrer;
        uint256 referredAt;
        uint256 rewardClaimed;
        bool active;
    }

    struct SocialReward {
        uint256 id;
        string action;
        uint256 rewardAmount;
        uint256 maxClaims;
        uint256 claimed;
        bool active;
    }

    IERC20 public rewardToken;

    mapping(address => Referral) public referrals;
    mapping(address => uint256) public referralCount;
    mapping(address => uint256) public referralEarnings;
    mapping(address => uint256) public pendingRewards;

    mapping(uint256 => SocialReward) public socialRewards;
    mapping(address => mapping(uint256 => bool)) public socialRewardClaimed;

    uint256 public nextRewardId = 1;
    uint256 public referralRewardAmount = 10 ether;
    uint256 public referrerRewardAmount = 5 ether;

    event ReferralUsed(address indexed referee, address indexed referrer);
    event ReferralRewardClaimed(address indexed referrer, uint256 amount);
    event SocialRewardCreated(uint256 indexed id, string action, uint256 amount);
    event SocialRewardClaimed(uint256 indexed id, address indexed player);

    constructor(address _rewardToken) OperatorOwnable(msg.sender) {
        require(_rewardToken != address(0), "Token required");
        rewardToken = IERC20(_rewardToken);
    }

    function setPaused(bool paused_) external onlyOwner {
        if (paused_) _pause();
        else _unpause();
    }

    function setReferralAmounts(uint256 refereeAmount, uint256 referrerAmount) external onlyOwner {
        referralRewardAmount = refereeAmount;
        referrerRewardAmount = referrerAmount;
    }

    function setReferrer(address referrer) external whenNotPaused {
        require(referrer != msg.sender, "Cannot refer yourself");
        require(referrer != address(0), "Invalid referrer");
        require(referrals[msg.sender].referrer == address(0), "Already referred");

        referrals[msg.sender] = Referral({
            referrer: referrer,
            referredAt: block.timestamp,
            rewardClaimed: 0,
            active: true
        });

        referralCount[referrer]++;
        pendingRewards[referrer] += referrerRewardAmount;
        pendingRewards[msg.sender] += referralRewardAmount;

        emit ReferralUsed(msg.sender, referrer);
    }

    function claimReferralRewards() external nonReentrant whenNotPaused {
        uint256 amount = pendingRewards[msg.sender];
        require(amount > 0, "No rewards");

        pendingRewards[msg.sender] = 0;
        referralEarnings[msg.sender] += amount;
        referrals[msg.sender].rewardClaimed += amount;
        rewardToken.safeTransfer(msg.sender, amount);

        emit ReferralRewardClaimed(msg.sender, amount);
    }

    function createSocialReward(string memory action, uint256 rewardAmount, uint256 maxClaims)
        external
        onlyOwner
        returns (uint256)
    {
        require(bytes(action).length > 0, "Action required");
        require(rewardAmount > 0 && maxClaims > 0, "Invalid reward");

        uint256 id = nextRewardId++;
        socialRewards[id] = SocialReward({
            id: id,
            action: action,
            rewardAmount: rewardAmount,
            maxClaims: maxClaims,
            claimed: 0,
            active: true
        });

        emit SocialRewardCreated(id, action, rewardAmount);
        return id;
    }

    function claimSocialReward(uint256 rewardId) external nonReentrant whenNotPaused {
        SocialReward storage reward = socialRewards[rewardId];
        require(reward.active, "Reward not active");
        require(reward.claimed < reward.maxClaims, "Max claims reached");
        require(!socialRewardClaimed[msg.sender][rewardId], "Already claimed");

        socialRewardClaimed[msg.sender][rewardId] = true;
        reward.claimed++;
        rewardToken.safeTransfer(msg.sender, reward.rewardAmount);

        emit SocialRewardClaimed(rewardId, msg.sender);
    }
}
