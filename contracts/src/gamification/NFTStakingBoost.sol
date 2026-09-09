// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {OperatorOwnable} from "./OperatorOwnable.sol";
import {IRarityProvider} from "./interfaces/IMintableNFT.sol";

/**
 * @title NFTStakingBoost
 * @notice Stake NFTs with rarity-based boost multipliers and lock periods.
 */
contract NFTStakingBoost is OperatorOwnable, ReentrancyGuard, Pausable, IERC721Receiver {
    using SafeERC20 for IERC20;

    struct Stake {
        uint256 tokenId;
        address staker;
        uint256 stakedAt;
        uint256 lastClaim;
        uint256 boostMultiplier;
        uint256 poolId;
        bool active;
    }

    struct StakingPool {
        uint256 id;
        string name;
        uint256 baseRate;
        uint256 lockDuration;
        uint256 totalStaked;
        uint256 totalBoost;
        bool active;
    }

    struct BoostConfig {
        uint8 rarity;
        uint256 multiplier;
        uint256 bonusXP;
    }

    IERC721 public nftContract;
    IERC20 public rewardToken;
    address public rarityOracle;

    mapping(uint256 => Stake) public stakes;
    mapping(address => uint256[]) public stakerTokens;
    mapping(uint256 => StakingPool) public stakingPools;
    mapping(uint8 => BoostConfig) public boostConfigs;

    uint256 public nextPoolId;
    uint256 public totalStaked;
    uint256 public boostMultiplierCap = 500;

    event Staked(address indexed staker, uint256 tokenId, uint256 poolId);
    event Unstaked(address indexed staker, uint256 tokenId);
    event Claimed(address indexed staker, uint256 amount);
    event BoostUpdated(uint256 tokenId, uint256 multiplier);
    event PoolCreated(uint256 indexed poolId, string name);

    constructor(address _nftContract, address _rewardToken) OperatorOwnable(msg.sender) {
        require(_nftContract != address(0) && _rewardToken != address(0), "Invalid deps");
        nftContract = IERC721(_nftContract);
        rewardToken = IERC20(_rewardToken);
        rarityOracle = _nftContract;

        boostConfigs[0] = BoostConfig(0, 100, 0);
        boostConfigs[1] = BoostConfig(1, 120, 5);
        boostConfigs[2] = BoostConfig(2, 150, 10);
        boostConfigs[3] = BoostConfig(3, 200, 20);
        boostConfigs[4] = BoostConfig(4, 300, 50);
        boostConfigs[5] = BoostConfig(5, 500, 100);
    }

    function createPool(string memory name, uint256 baseRate, uint256 lockDuration) external onlyOwner {
        require(baseRate > 0, "Rate required");
        uint256 poolId = nextPoolId++;
        stakingPools[poolId] = StakingPool({
            id: poolId,
            name: name,
            baseRate: baseRate,
            lockDuration: lockDuration,
            totalStaked: 0,
            totalBoost: 0,
            active: true
        });
        emit PoolCreated(poolId, name);
    }

    function setRarityOracle(address oracle) external onlyOwner {
        rarityOracle = oracle;
    }

    function setPaused(bool paused_) external onlyOwner {
        if (paused_) _pause();
        else _unpause();
    }

    function stake(uint256 tokenId, uint256 poolId) external nonReentrant whenNotPaused {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not owner");
        StakingPool storage pool = stakingPools[poolId];
        require(pool.active, "Pool not active");
        require(!stakes[tokenId].active, "Already staked");

        uint8 rarity = _getNFTRarity(tokenId);
        BoostConfig memory boost = boostConfigs[rarity];

        nftContract.safeTransferFrom(msg.sender, address(this), tokenId);

        stakes[tokenId] = Stake({
            tokenId: tokenId,
            staker: msg.sender,
            stakedAt: block.timestamp,
            lastClaim: block.timestamp,
            boostMultiplier: boost.multiplier,
            poolId: poolId,
            active: true
        });

        stakerTokens[msg.sender].push(tokenId);
        pool.totalStaked++;
        pool.totalBoost += boost.multiplier;
        totalStaked++;

        emit Staked(msg.sender, tokenId, poolId);
    }

    function unstake(uint256 tokenId) external nonReentrant {
        Stake storage staked = stakes[tokenId];
        require(staked.staker == msg.sender, "Not staker");
        require(staked.active, "Not active");

        StakingPool storage pool = stakingPools[staked.poolId];
        require(block.timestamp >= staked.stakedAt + pool.lockDuration, "Still locked");

        _claimRewards(tokenId);

        staked.active = false;
        if (pool.totalStaked > 0) pool.totalStaked--;
        if (pool.totalBoost >= staked.boostMultiplier) pool.totalBoost -= staked.boostMultiplier;
        totalStaked--;

        _removeStakerToken(msg.sender, tokenId);
        nftContract.safeTransferFrom(address(this), msg.sender, tokenId);
        emit Unstaked(msg.sender, tokenId);
    }

    function claimRewards(uint256 tokenId) external nonReentrant {
        require(stakes[tokenId].staker == msg.sender, "Not staker");
        _claimRewards(tokenId);
    }

    function claimAllRewards() external nonReentrant {
        uint256[] memory tokens = stakerTokens[msg.sender];
        for (uint256 i = 0; i < tokens.length; ) {
            if (stakes[tokens[i]].active) {
                _claimRewards(tokens[i]);
            }
            unchecked {
                ++i;
            }
        }
    }

    function applyBoost(uint256 tokenId, uint256 additionalBoost) external onlyOperator {
        Stake storage staked = stakes[tokenId];
        require(staked.active, "Not active");
        uint256 newBoost = staked.boostMultiplier + additionalBoost;
        require(newBoost <= boostMultiplierCap, "Boost cap exceeded");
        stakingPools[staked.poolId].totalBoost += additionalBoost;
        staked.boostMultiplier = newBoost;
        emit BoostUpdated(tokenId, newBoost);
    }

    function getStakerTokens(address staker) external view returns (uint256[] memory) {
        return stakerTokens[staker];
    }

    function getPendingReward(uint256 tokenId) external view returns (uint256) {
        return _calculateReward(tokenId);
    }

    function getStake(uint256 tokenId) external view returns (Stake memory) {
        return stakes[tokenId];
    }

    function getBoostMultiplier(uint256 tokenId) external view returns (uint256) {
        return stakes[tokenId].boostMultiplier;
    }

    function onERC721Received(address, address, uint256, bytes calldata) external view returns (bytes4) {
        require(msg.sender == address(nftContract), "Unknown NFT");
        return this.onERC721Received.selector;
    }

    function _claimRewards(uint256 tokenId) private {
        Stake storage staked = stakes[tokenId];
        require(staked.active, "Not active");
        uint256 reward = _calculateReward(tokenId);
        if (reward > 0) {
            staked.lastClaim = block.timestamp;
            rewardToken.safeTransfer(staked.staker, reward);
            emit Claimed(staked.staker, reward);
        }
    }

    function _calculateReward(uint256 tokenId) private view returns (uint256) {
        Stake storage staked = stakes[tokenId];
        if (!staked.active) return 0;
        uint256 timeDelta = block.timestamp - staked.lastClaim;
        uint256 baseReward = timeDelta * stakingPools[staked.poolId].baseRate;
        return (baseReward * staked.boostMultiplier) / 100;
    }

    function _getNFTRarity(uint256 tokenId) private view returns (uint8) {
        if (rarityOracle != address(0)) {
            try IRarityProvider(rarityOracle).rarityOf(tokenId) returns (uint8 rarity) {
                require(rarity <= 5, "Invalid rarity");
                return rarity;
            } catch {
                return uint8(tokenId % 6);
            }
        }
        return uint8(tokenId % 6);
    }

    function _removeStakerToken(address staker, uint256 tokenId) private {
        uint256[] storage tokens = stakerTokens[staker];
        for (uint256 i = 0; i < tokens.length; ) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
            unchecked {
                ++i;
            }
        }
    }
}
