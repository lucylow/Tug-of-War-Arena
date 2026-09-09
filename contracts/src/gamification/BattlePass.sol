// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {OperatorOwnable} from "./OperatorOwnable.sol";
import {IAchievementBadges} from "./interfaces/IAchievementBadges.sol";

/**
 * @title BattlePass
 * @notice Seasonal battle pass with independent free and premium tracks.
 */
contract BattlePass is OperatorOwnable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Season {
        uint256 id;
        string name;
        uint256 startTime;
        uint256 endTime;
        uint256 maxTier;
        uint256 premiumCost;
        bool active;
    }

    struct TierReward {
        uint256 tier;
        uint256 xpRequired;
        uint256 tokenReward;
        uint256 badgeId;
        string skinId;
    }

    mapping(uint256 => Season) public seasons;
    mapping(uint256 => mapping(address => uint256)) public seasonXp;
    mapping(uint256 => mapping(address => uint256)) public seasonTier;
    mapping(uint256 => mapping(address => bool)) public hasPremium;
    mapping(uint256 => mapping(uint256 => TierReward)) public freeRewards;
    mapping(uint256 => mapping(uint256 => TierReward)) public premiumRewards;
    mapping(uint256 => mapping(address => mapping(uint256 => bool))) public freeClaimed;
    mapping(uint256 => mapping(address => mapping(uint256 => bool))) public premiumClaimed;

    IERC20 public rewardToken;
    IERC20 public paymentToken;
    IAchievementBadges public badges;

    uint256 public nextSeasonId = 1;
    uint256 public xpPerTier = 100;

    event SeasonStarted(uint256 indexed id, string name);
    event PremiumPurchased(uint256 indexed seasonId, address indexed player);
    event TierReached(uint256 indexed seasonId, address indexed player, uint256 tier);
    event RewardClaimed(uint256 indexed seasonId, address indexed player, uint256 tier, bool premium);

    constructor(address _rewardToken, address _paymentToken) OperatorOwnable(msg.sender) {
        require(_rewardToken != address(0) && _paymentToken != address(0), "Invalid tokens");
        rewardToken = IERC20(_rewardToken);
        paymentToken = IERC20(_paymentToken);
    }

    function setBadges(address _badges) external onlyOwner {
        badges = IAchievementBadges(_badges);
    }

    function startSeason(string memory name, uint256 durationDays, uint256 maxTier, uint256 premiumCost)
        external
        onlyOwner
    {
        require(maxTier > 0 && maxTier <= 100, "Invalid max tier");
        require(durationDays > 0, "Duration required");

        uint256 seasonId = nextSeasonId++;
        seasons[seasonId] = Season({
            id: seasonId,
            name: name,
            startTime: block.timestamp,
            endTime: block.timestamp + (durationDays * 1 days),
            maxTier: maxTier,
            premiumCost: premiumCost,
            active: true
        });

        for (uint256 i = 1; i <= maxTier; ) {
            freeRewards[seasonId][i] = TierReward({
                tier: i,
                xpRequired: i * xpPerTier,
                tokenReward: i * 10 ether,
                badgeId: 0,
                skinId: ""
            });
            premiumRewards[seasonId][i] = TierReward({
                tier: i,
                xpRequired: i * xpPerTier,
                tokenReward: i * 25 ether,
                badgeId: 0,
                skinId: ""
            });
            unchecked {
                ++i;
            }
        }

        emit SeasonStarted(seasonId, name);
    }

    function setTierReward(
        uint256 seasonId,
        uint256 tier,
        bool premium,
        uint256 tokenReward,
        uint256 badgeId,
        string calldata skinId
    ) external onlyOwner {
        require(seasons[seasonId].id == seasonId, "Unknown season");
        require(tier >= 1 && tier <= seasons[seasonId].maxTier, "Invalid tier");
        TierReward storage reward = premium ? premiumRewards[seasonId][tier] : freeRewards[seasonId][tier];
        reward.tokenReward = tokenReward;
        reward.badgeId = badgeId;
        reward.skinId = skinId;
    }

    function buyPremium(uint256 seasonId) external nonReentrant {
        Season storage season = seasons[seasonId];
        require(_seasonLive(season), "Season not active");
        require(!hasPremium[seasonId][msg.sender], "Already premium");

        if (season.premiumCost > 0) {
            paymentToken.safeTransferFrom(msg.sender, address(this), season.premiumCost);
        }
        hasPremium[seasonId][msg.sender] = true;
        emit PremiumPurchased(seasonId, msg.sender);
    }

    function addXP(uint256 seasonId, address player, uint256 amount) external onlyOperator {
        Season storage season = seasons[seasonId];
        require(_seasonLive(season), "Season not active");
        require(player != address(0) && amount > 0, "Invalid XP");

        seasonXp[seasonId][player] += amount;
        uint256 newTier = seasonXp[seasonId][player] / xpPerTier;
        if (newTier > season.maxTier) newTier = season.maxTier;

        if (newTier > seasonTier[seasonId][player]) {
            seasonTier[seasonId][player] = newTier;
            emit TierReached(seasonId, player, newTier);
        }
    }

    function claimReward(uint256 seasonId, uint256 tier, bool premium) external nonReentrant {
        Season storage season = seasons[seasonId];
        require(_seasonLive(season), "Season not active");
        require(seasonTier[seasonId][msg.sender] >= tier, "Tier not reached");
        require(tier >= 1 && tier <= season.maxTier, "Invalid tier");

        if (premium) {
            require(hasPremium[seasonId][msg.sender], "Premium required");
            require(!premiumClaimed[seasonId][msg.sender][tier], "Already claimed");
            premiumClaimed[seasonId][msg.sender][tier] = true;
            _payout(premiumRewards[seasonId][tier]);
        } else {
            require(!freeClaimed[seasonId][msg.sender][tier], "Already claimed");
            freeClaimed[seasonId][msg.sender][tier] = true;
            _payout(freeRewards[seasonId][tier]);
        }

        emit RewardClaimed(seasonId, msg.sender, tier, premium);
    }

    function getPlayerProgress(uint256 seasonId, address player)
        external
        view
        returns (uint256 xp, uint256 tier, bool premium)
    {
        return (seasonXp[seasonId][player], seasonTier[seasonId][player], hasPremium[seasonId][player]);
    }

    function getTierReward(uint256 seasonId, uint256 tier, bool premium) external view returns (TierReward memory) {
        return premium ? premiumRewards[seasonId][tier] : freeRewards[seasonId][tier];
    }

    function _payout(TierReward memory reward) private {
        if (reward.tokenReward > 0) {
            rewardToken.safeTransfer(msg.sender, reward.tokenReward);
        }
        if (reward.badgeId > 0 && address(badges) != address(0)) {
            badges.awardBadge(msg.sender, reward.badgeId);
        }
    }

    function _seasonLive(Season storage season) private view returns (bool) {
        return season.active && block.timestamp >= season.startTime && block.timestamp <= season.endTime;
    }
}
