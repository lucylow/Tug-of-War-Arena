// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";

/**
 * @title SocialStaking
 * @notice Stake FZONE or wearables for governance power and social influence.
 */
contract SocialStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Stake {
        uint256 id;
        address staker;
        uint256 amount;
        uint256 nftTokenId;
        uint256 poolId;
        uint256 stakedAt;
        uint256 lastRewardClaim;
        uint256 governancePower;
        bool active;
        bool isNFT;
    }

    struct StakingPool {
        uint256 id;
        string name;
        uint256 rewardRate;
        uint256 lockDuration;
        uint256 totalStaked;
        uint256 totalPower;
        bool active;
    }

    IERC20 public immutable stakingToken;
    IERC721 public immutable nftContract;

    mapping(uint256 => Stake) public stakes;
    mapping(address => uint256[]) public stakerStakes;
    mapping(uint256 => StakingPool) public stakingPools;

    uint256 public nextStakeId;
    uint256 public nextPoolId;
    uint256 public governancePowerMultiplier = 100;
    uint256 public totalTokenStaked;

    event PoolCreated(uint256 indexed poolId, string name, uint256 rewardRate, uint256 lockDuration);
    event Staked(address indexed staker, uint256 stakeId, uint256 amount, uint256 poolId);
    event Unstaked(address indexed staker, uint256 stakeId);
    event RewardClaimed(address indexed staker, uint256 amount);
    event GovernancePowerUpdated(address indexed staker, uint256 power);

    error InvalidAmount();
    error PoolInactive();
    error NotNftOwner();
    error NotStaker();
    error StakeInactive();
    error StillLocked();
    error UnknownPool();

    constructor(address stakingToken_, address nftContract_, address initialOwner) Ownable(initialOwner) {
        require(stakingToken_ != address(0) && nftContract_ != address(0), "Zero address");
        stakingToken = IERC20(stakingToken_);
        nftContract = IERC721(nftContract_);
    }

    function createPool(string calldata name, uint256 rewardRate, uint256 lockDuration) external onlyOwner returns (uint256 poolId) {
        poolId = nextPoolId++;
        stakingPools[poolId] = StakingPool({
            id: poolId,
            name: name,
            rewardRate: rewardRate,
            lockDuration: lockDuration,
            totalStaked: 0,
            totalPower: 0,
            active: true
        });
        emit PoolCreated(poolId, name, rewardRate, lockDuration);
    }

    function stakeTokens(uint256 amount, uint256 poolId) external nonReentrant {
        if (amount == 0) revert InvalidAmount();
        StakingPool storage pool = stakingPools[poolId];
        if (!pool.active) revert PoolInactive();

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        uint256 power = _calculatePower(amount, 0);
        uint256 stakeId = _openStake(msg.sender, amount, 0, poolId, power, false);

        pool.totalStaked += amount;
        pool.totalPower += power;
        totalTokenStaked += amount;

        emit Staked(msg.sender, stakeId, amount, poolId);
        emit GovernancePowerUpdated(msg.sender, getTotalGovernancePower(msg.sender));
    }

    function stakeNFT(uint256 tokenId, uint256 poolId) external nonReentrant {
        if (nftContract.ownerOf(tokenId) != msg.sender) revert NotNftOwner();
        StakingPool storage pool = stakingPools[poolId];
        if (!pool.active) revert PoolInactive();

        nftContract.transferFrom(msg.sender, address(this), tokenId);

        uint256 power = _calculatePower(0, tokenId);
        uint256 stakeId = _openStake(msg.sender, 0, tokenId, poolId, power, true);

        pool.totalPower += power;

        emit Staked(msg.sender, stakeId, 0, poolId);
        emit GovernancePowerUpdated(msg.sender, getTotalGovernancePower(msg.sender));
    }

    function unstake(uint256 stakeId) external nonReentrant {
        Stake storage stake = stakes[stakeId];
        if (stake.staker != msg.sender) revert NotStaker();
        if (!stake.active) revert StakeInactive();

        StakingPool storage pool = stakingPools[stake.poolId];
        if (block.timestamp < stake.stakedAt + pool.lockDuration) revert StillLocked();

        _claimReward(stakeId);

        if (stake.isNFT) {
            nftContract.transferFrom(address(this), msg.sender, stake.nftTokenId);
        } else {
            pool.totalStaked -= stake.amount;
            totalTokenStaked -= stake.amount;
            stakingToken.safeTransfer(msg.sender, stake.amount);
        }

        if (pool.totalPower >= stake.governancePower) {
            pool.totalPower -= stake.governancePower;
        } else {
            pool.totalPower = 0;
        }

        stake.active = false;
        emit Unstaked(msg.sender, stakeId);
        emit GovernancePowerUpdated(msg.sender, getTotalGovernancePower(msg.sender));
    }

    function claimReward(uint256 stakeId) external nonReentrant {
        Stake storage stake = stakes[stakeId];
        if (stake.staker != msg.sender) revert NotStaker();
        _claimReward(stakeId);
    }

    function getStake(uint256 stakeId) external view returns (Stake memory) {
        return stakes[stakeId];
    }

    function getStakerStakes(address staker) external view returns (uint256[] memory) {
        return stakerStakes[staker];
    }

    function getTotalGovernancePower(address staker) public view returns (uint256 total) {
        uint256[] storage stakeIds = stakerStakes[staker];
        for (uint256 i = 0; i < stakeIds.length; ) {
            if (stakes[stakeIds[i]].active) {
                total += stakes[stakeIds[i]].governancePower;
            }
            unchecked {
                ++i;
            }
        }
    }

    function getPendingReward(uint256 stakeId) external view returns (uint256) {
        return _calculateReward(stakeId);
    }

    function setPoolActive(uint256 poolId, bool active) external onlyOwner {
        if (poolId >= nextPoolId) revert UnknownPool();
        stakingPools[poolId].active = active;
    }

    function setGovernancePowerMultiplier(uint256 multiplier) external onlyOwner {
        require(multiplier > 0, "Multiplier required");
        governancePowerMultiplier = multiplier;
    }

    function _openStake(
        address staker,
        uint256 amount,
        uint256 tokenId,
        uint256 poolId,
        uint256 power,
        bool isNFT
    ) private returns (uint256 stakeId) {
        stakeId = nextStakeId++;
        stakes[stakeId] = Stake({
            id: stakeId,
            staker: staker,
            amount: amount,
            nftTokenId: tokenId,
            poolId: poolId,
            stakedAt: block.timestamp,
            lastRewardClaim: block.timestamp,
            governancePower: power,
            active: true,
            isNFT: isNFT
        });
        stakerStakes[staker].push(stakeId);
    }

    function _calculatePower(uint256 amount, uint256 tokenId) private view returns (uint256) {
        uint256 basePower = amount > 0 ? amount / 1e15 : 1000;
        if (tokenId > 0 || amount == 0) {
            uint256 rarity = tokenId % 6;
            uint256[6] memory multipliers = [uint256(1), 2, 3, 5, 8, 13];
            basePower = basePower * multipliers[rarity];
        }
        return (basePower * governancePowerMultiplier) / 100;
    }

    function _claimReward(uint256 stakeId) private {
        Stake storage stake = stakes[stakeId];
        if (!stake.active) revert StakeInactive();

        uint256 reward = _calculateReward(stakeId);
        if (reward > 0) {
            uint256 surplus = stakingToken.balanceOf(address(this)) - totalTokenStaked;
            require(surplus >= reward, "Insufficient reward reserve");
            stake.lastRewardClaim = block.timestamp;
            stakingToken.safeTransfer(stake.staker, reward);
            emit RewardClaimed(stake.staker, reward);
        }
    }

    function _calculateReward(uint256 stakeId) private view returns (uint256) {
        Stake storage stake = stakes[stakeId];
        if (!stake.active) return 0;

        uint256 timeDelta = block.timestamp - stake.lastRewardClaim;
        uint256 rate = stakingPools[stake.poolId].rewardRate;
        if (rate == 0) {
            rate = stake.isNFT ? 10 : 5;
        }
        return (timeDelta * rate * stake.governancePower) / 10_000;
    }
}
