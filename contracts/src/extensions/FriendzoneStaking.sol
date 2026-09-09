// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IFriendzoneNFT} from "../interfaces/IFriendzoneNFT.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";
import {ArrayUtils} from "../utils/ArrayUtils.sol";

/**
 * @title FriendzoneStaking
 * @notice Stake wearables into timed pools to earn FZONE.
 */
contract FriendzoneStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ArrayUtils for uint256[];

    struct StakingPool {
        uint256 id;
        string name;
        uint256 rewardRate;
        uint256 lockDuration;
        uint256 totalStaked;
        bool active;
    }

    struct Stake {
        uint256 tokenId;
        uint256 poolId;
        uint256 stakedAt;
        uint256 unlockAt;
        uint256 lastRewardClaim;
        address staker;
    }

    IFriendzoneNFT public immutable nftContract;
    IERC20 public immutable rewardToken;

    mapping(uint256 => StakingPool) public stakingPools;
    mapping(uint256 => Stake) public stakes;
    mapping(address => uint256[]) private _stakerTokens;
    uint256 public nextPoolId;

    event PoolCreated(uint256 indexed poolId, string name, uint256 rewardRate);
    event PoolStatusUpdated(uint256 indexed poolId, bool active);
    event Staked(uint256 indexed tokenId, address indexed staker, uint256 poolId);
    event Unstaked(uint256 indexed tokenId, address indexed staker);
    event RewardClaimed(address indexed staker, uint256 amount);
    event RewardsFunded(address indexed from, uint256 amount);

    error NotOwner();
    error PoolInactive();
    error AlreadyStaked();
    error NotStaker();
    error StillLocked();
    error ZeroAddress();
    error UnknownPool();

    constructor(address nftContract_, address rewardToken_, address initialOwner) Ownable(initialOwner) {
        if (nftContract_ == address(0) || rewardToken_ == address(0)) revert ZeroAddress();
        nftContract = IFriendzoneNFT(nftContract_);
        rewardToken = IERC20(rewardToken_);
    }

    function createPool(string calldata name, uint256 rewardRate, uint256 lockDuration)
        external
        onlyOwner
        returns (uint256 poolId)
    {
        poolId = nextPoolId;
        unchecked {
            ++nextPoolId;
        }
        stakingPools[poolId] = StakingPool({
            id: poolId,
            name: name,
            rewardRate: rewardRate,
            lockDuration: lockDuration,
            totalStaked: 0,
            active: true
        });
        emit PoolCreated(poolId, name, rewardRate);
    }

    function setPoolActive(uint256 poolId, bool active) external onlyOwner {
        if (poolId >= nextPoolId) revert UnknownPool();
        stakingPools[poolId].active = active;
        emit PoolStatusUpdated(poolId, active);
    }

    function fundRewards(uint256 amount) external {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        emit RewardsFunded(msg.sender, amount);
    }

    function stake(uint256 tokenId, uint256 poolId) external nonReentrant {
        if (nftContract.ownerOf(tokenId) != msg.sender) revert NotOwner();
        StakingPool storage pool = stakingPools[poolId];
        if (!pool.active) revert PoolInactive();
        if (stakes[tokenId].staker != address(0)) revert AlreadyStaked();

        nftContract.transferFrom(msg.sender, address(this), tokenId);

        stakes[tokenId] = Stake({
            tokenId: tokenId,
            poolId: poolId,
            stakedAt: block.timestamp,
            unlockAt: block.timestamp + pool.lockDuration,
            lastRewardClaim: block.timestamp,
            staker: msg.sender
        });

        _stakerTokens[msg.sender].push(tokenId);
        unchecked {
            ++pool.totalStaked;
        }

        emit Staked(tokenId, msg.sender, poolId);
    }

    function unstake(uint256 tokenId) external nonReentrant {
        Stake memory existing = stakes[tokenId];
        if (existing.staker != msg.sender) revert NotStaker();
        if (block.timestamp < existing.unlockAt) revert StillLocked();

        _claimReward(tokenId);

        nftContract.transferFrom(address(this), msg.sender, tokenId);
        delete stakes[tokenId];
        _stakerTokens[msg.sender].removeValue(tokenId);

        if (stakingPools[existing.poolId].totalStaked > 0) {
            unchecked {
                --stakingPools[existing.poolId].totalStaked;
            }
        }
        emit Unstaked(tokenId, msg.sender);
    }

    function claimReward(uint256 tokenId) external nonReentrant {
        if (stakes[tokenId].staker != msg.sender) revert NotStaker();
        _claimReward(tokenId);
    }

    function getStakerTokens(address staker) external view returns (uint256[] memory) {
        return _stakerTokens[staker];
    }

    function getPendingReward(uint256 tokenId) external view returns (uint256) {
        return _calculateReward(tokenId);
    }

    function _claimReward(uint256 tokenId) internal {
        uint256 reward = _calculateReward(tokenId);
        if (reward == 0) return;
        stakes[tokenId].lastRewardClaim = block.timestamp;
        rewardToken.safeTransfer(msg.sender, reward);
        emit RewardClaimed(msg.sender, reward);
    }

    function _calculateReward(uint256 tokenId) internal view returns (uint256) {
        Stake storage existing = stakes[tokenId];
        if (existing.staker == address(0)) return 0;
        return (block.timestamp - existing.lastRewardClaim) * stakingPools[existing.poolId].rewardRate;
    }
}
