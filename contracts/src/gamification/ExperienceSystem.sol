// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {OperatorOwnable} from "./OperatorOwnable.sol";
import {IExperienceSystem} from "./interfaces/IExperienceSystem.sol";

/**
 * @title ExperienceSystem
 * @notice Core progression engine: XP, levels, tiers, and daily streaks.
 *
 * XP sources (defaults):
 * - Match Win: 100 XP
 * - Match Loss: 25 XP
 * - Daily Login: 20 XP + 5 XP per streak day
 */
contract ExperienceSystem is OperatorOwnable, IExperienceSystem {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;

    struct PlayerProgression {
        uint256 xp;
        uint256 level;
        uint256 tier; // 1-5: Bronze, Silver, Gold, Platinum, Diamond
        uint256 lastClaimDay;
        uint256 dailyStreak;
        uint256 totalMatches;
        uint256 totalWins;
        uint256 totalQuestsCompleted;
        uint256 lastActive;
    }

    struct LevelConfig {
        uint256 xpRequired;
        uint256 rewardAmount;
        uint8 tier;
    }

    mapping(address => PlayerProgression) public players;
    mapping(uint256 => LevelConfig) public levelConfigs;
    EnumerableSet.AddressSet private activePlayers;

    IERC20 public rewardToken;
    uint256 public maxLevel = 100;
    uint256 public xpPerWin = 100;
    uint256 public xpPerLoss = 25;
    uint256 public xpPerDailyLogin = 20;

    mapping(uint8 => uint256) public tierMultipliers;

    event XPAdded(address indexed player, uint256 amount, string source);
    event LevelUp(address indexed player, uint256 newLevel, uint8 tier);
    event TierUpgrade(address indexed player, uint8 newTier);
    event DailyLogin(address indexed player, uint256 streak);
    event RewardTokenUpdated(address indexed token);

    constructor(address _rewardToken) OperatorOwnable(msg.sender) {
        require(_rewardToken != address(0), "Token required");
        rewardToken = IERC20(_rewardToken);

        tierMultipliers[1] = 100;
        tierMultipliers[2] = 120;
        tierMultipliers[3] = 150;
        tierMultipliers[4] = 200;
        tierMultipliers[5] = 300;

        for (uint256 i = 1; i <= 100; ) {
            levelConfigs[i] = LevelConfig({
                xpRequired: i * 100,
                rewardAmount: i * 5 ether,
                tier: _getTierForLevel(i)
            });
            unchecked {
                ++i;
            }
        }
    }

    function addXP(address player, uint256 amount, string calldata source) external onlyOperator {
        _ensurePlayer(player);
        uint256 adjusted = _applyMultiplier(player, amount);
        _creditXP(player, adjusted, source);
    }

    function recordMatch(address player, bool won) external onlyOperator {
        _ensurePlayer(player);
        PlayerProgression storage p = players[player];
        uint256 xp = won ? xpPerWin : xpPerLoss;
        p.totalMatches++;
        if (won) p.totalWins++;
        uint256 adjusted = _applyMultiplier(player, xp);
        _creditXP(player, adjusted, won ? "Match Win" : "Match Loss");
    }

    function incrementQuestsCompleted(address player) external onlyOperator {
        _ensurePlayer(player);
        players[player].totalQuestsCompleted++;
    }

    function claimDailyLogin() external {
        _ensurePlayer(msg.sender);
        PlayerProgression storage p = players[msg.sender];
        uint256 today = block.timestamp / 1 days;

        require(p.lastClaimDay != today, "Already claimed today");

        if (p.lastClaimDay == today - 1) {
            p.dailyStreak++;
        } else {
            p.dailyStreak = 1;
        }

        p.lastClaimDay = today;
        uint256 bonus = p.dailyStreak * 5;
        uint256 totalXP = xpPerDailyLogin + bonus;

        emit DailyLogin(msg.sender, p.dailyStreak);
        _creditXP(msg.sender, totalXP, "Daily Login");
    }

    function getPlayerProgression(address player)
        external
        view
        returns (
            uint256 xp,
            uint256 level,
            uint8 tier,
            uint256 dailyStreak,
            uint256 totalMatches,
            uint256 totalWins,
            uint256 xpToNextLevel
        )
    {
        PlayerProgression storage p = players[player];
        uint256 currentLevel = p.level == 0 ? 1 : p.level;
        uint256 nextNeeded = currentLevel >= maxLevel ? 0 : _cumulativeXpToReach(currentLevel + 1);
        return (
            p.xp,
            currentLevel,
            p.tier == 0 ? 1 : uint8(p.tier),
            p.dailyStreak,
            p.totalMatches,
            p.totalWins,
            nextNeeded > p.xp ? nextNeeded - p.xp : 0
        );
    }

    function getLevel(address player) external view returns (uint256) {
        uint256 level = players[player].level;
        return level == 0 ? 1 : level;
    }

    function getTitleForLevel(uint256 level) external pure returns (string memory) {
        uint8 tier = _getTierForLevel(level);
        string[5] memory titles = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
        return titles[tier - 1];
    }

    function getTopPlayers(uint256 count) external view returns (address[] memory, uint256[] memory) {
        uint256 total = activePlayers.length();
        uint256 maxCount = count > total ? total : count;

        address[] memory topPlayers = new address[](maxCount);
        uint256[] memory topXP = new uint256[](maxCount);

        address[] memory allPlayers = activePlayers.values();
        uint256[] memory allXP = new uint256[](total);

        for (uint256 i = 0; i < total; ) {
            allXP[i] = players[allPlayers[i]].xp;
            unchecked {
                ++i;
            }
        }

        for (uint256 i = 0; i < total; ) {
            for (uint256 j = i + 1; j < total; ) {
                if (allXP[j] > allXP[i]) {
                    (allXP[i], allXP[j]) = (allXP[j], allXP[i]);
                    (allPlayers[i], allPlayers[j]) = (allPlayers[j], allPlayers[i]);
                }
                unchecked {
                    ++j;
                }
            }
            unchecked {
                ++i;
            }
        }

        for (uint256 i = 0; i < maxCount; ) {
            topPlayers[i] = allPlayers[i];
            topXP[i] = allXP[i];
            unchecked {
                ++i;
            }
        }

        return (topPlayers, topXP);
    }

    function setXpPerWin(uint256 _xp) external onlyOwner {
        xpPerWin = _xp;
    }

    function setXpPerLoss(uint256 _xp) external onlyOwner {
        xpPerLoss = _xp;
    }

    function setXpPerDailyLogin(uint256 _xp) external onlyOwner {
        xpPerDailyLogin = _xp;
    }

    function setTierMultiplier(uint8 tier, uint256 multiplier) external onlyOwner {
        require(tier >= 1 && tier <= 5, "Invalid tier");
        require(multiplier >= 100, "Multiplier below 1x");
        tierMultipliers[tier] = multiplier;
    }

    function setLevelConfig(uint256 level, uint256 xpRequired, uint256 rewardAmount) external onlyOwner {
        require(level >= 1 && level <= maxLevel, "Level exceeds max");
        require(xpRequired > 0, "XP required");
        levelConfigs[level].xpRequired = xpRequired;
        levelConfigs[level].rewardAmount = rewardAmount;
    }

    function setRewardToken(address token) external onlyOwner {
        require(token != address(0), "Token required");
        rewardToken = IERC20(token);
        emit RewardTokenUpdated(token);
    }

    function _ensurePlayer(address player) private {
        require(player != address(0), "Zero player");
        PlayerProgression storage p = players[player];
        if (p.level == 0) {
            p.level = 1;
            p.tier = 1;
        }
    }

    function _applyMultiplier(address player, uint256 amount) private view returns (uint256) {
        uint8 tier = uint8(players[player].tier);
        if (tier == 0) tier = 1;
        return (amount * tierMultipliers[tier]) / 100;
    }

    function _creditXP(address player, uint256 amount, string memory source) private {
        PlayerProgression storage p = players[player];
        p.xp += amount;
        p.lastActive = block.timestamp;
        activePlayers.add(player);
        emit XPAdded(player, amount, source);
        _checkLevelUp(player);
    }

    function _checkLevelUp(address player) private {
        PlayerProgression storage p = players[player];
        uint256 newLevel = _calculateLevel(p.xp);

        while (newLevel > p.level && p.level < maxLevel) {
            p.level++;
            LevelConfig memory config = levelConfigs[p.level];

            if (config.rewardAmount > 0) {
                rewardToken.safeTransfer(player, config.rewardAmount);
            }

            uint8 nextTier = _getTierForLevel(p.level);
            if (nextTier > p.tier) {
                p.tier = nextTier;
                emit TierUpgrade(player, nextTier);
            }

            emit LevelUp(player, p.level, uint8(p.tier));
        }
    }

    function _calculateLevel(uint256 xp) private view returns (uint256) {
        uint256 level = 1;
        uint256 cumulativeXp = 0;
        for (uint256 i = 1; i < maxLevel; ) {
            cumulativeXp += levelConfigs[i].xpRequired;
            if (xp < cumulativeXp) {
                return level;
            }
            unchecked {
                ++level;
                ++i;
            }
        }
        return maxLevel;
    }

    function _cumulativeXpToReach(uint256 level) private view returns (uint256) {
        if (level <= 1) return 0;
        uint256 last = level - 1;
        if (last > maxLevel) last = maxLevel;
        uint256 total = 0;
        for (uint256 i = 1; i <= last; ) {
            total += levelConfigs[i].xpRequired;
            unchecked {
                ++i;
            }
        }
        return total;
    }

    function _getTierForLevel(uint256 level) private pure returns (uint8) {
        if (level >= 80) return 5;
        if (level >= 60) return 4;
        if (level >= 40) return 3;
        if (level >= 20) return 2;
        return 1;
    }
}
