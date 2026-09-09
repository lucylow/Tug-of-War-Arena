// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";

/**
 * @title FriendzoneReferrals
 * @notice Invite rewards paid once from accrued balances — never on both bind and claim.
 */
contract FriendzoneReferrals is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable rewardToken;
    mapping(address => address) public referrerOf;
    mapping(address => uint256) public referralCount;
    mapping(address => uint256) public pendingRewards;
    uint256 public rewardAmount = 10 * 10 ** 18;

    event ReferralBound(address indexed referee, address indexed referrer);
    event RewardAccrued(address indexed referrer, uint256 amount);
    event RewardClaimed(address indexed referrer, uint256 amount);
    event RewardAmountUpdated(uint256 amount);

    error SelfReferral();
    error AlreadyReferred();
    error InvalidReferrer();
    error NoRewards();

    constructor(address rewardToken_, address initialOwner) Ownable(initialOwner) {
        rewardToken = IERC20(rewardToken_);
    }

    function setReferrer(address referrer) external {
        if (referrer == address(0) || referrer == msg.sender) revert SelfReferral();
        if (referrerOf[msg.sender] != address(0)) revert AlreadyReferred();
        if (referrerOf[referrer] == msg.sender) revert InvalidReferrer();

        referrerOf[msg.sender] = referrer;
        unchecked {
            ++referralCount[referrer];
        }
        pendingRewards[referrer] += rewardAmount;

        emit ReferralBound(msg.sender, referrer);
        emit RewardAccrued(referrer, rewardAmount);
    }

    function claimRewards() external nonReentrant {
        uint256 amount = pendingRewards[msg.sender];
        if (amount == 0) revert NoRewards();
        pendingRewards[msg.sender] = 0;
        rewardToken.safeTransfer(msg.sender, amount);
        emit RewardClaimed(msg.sender, amount);
    }

    function setRewardAmount(uint256 amount) external onlyOwner {
        rewardAmount = amount;
        emit RewardAmountUpdated(amount);
    }

    function fund(uint256 amount) external {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
    }
}
