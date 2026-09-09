// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MathUtils
 * @notice Shared arithmetic helpers for prize splits and rarity rolls.
 */
library MathUtils {
    uint256 internal constant BPS_DENOMINATOR = 10_000;

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }

    /// @notice `bps` is basis points, e.g. 8000 = 80%.
    function pct(uint256 amount, uint256 bps) internal pure returns (uint256) {
        return (amount * bps) / BPS_DENOMINATOR;
    }

    function shareEvenly(uint256 amount, uint256 recipients) internal pure returns (uint256 share, uint256 remainder) {
        require(recipients > 0, "MathUtils: no recipients");
        share = amount / recipients;
        remainder = amount % recipients;
    }

    /**
     * @notice Maps a VRF word onto Friendzone rarity tiers.
     * @dev Common 50 / Uncommon 25 / Rare 15 / Epic 7 / Legendary 2 / Mythic 1.
     */
    function rarityFromRandom(uint256 randomWord) internal pure returns (uint8) {
        uint256 roll = randomWord % 100;
        if (roll < 50) return 0;
        if (roll < 75) return 1;
        if (roll < 90) return 2;
        if (roll < 97) return 3;
        if (roll < 99) return 4;
        return 5;
    }

    function average(uint256 a, uint256 b) internal pure returns (uint256) {
        return (a & b) + (a ^ b) / 2;
    }

    function clamp(uint256 value, uint256 minVal, uint256 maxVal) internal pure returns (uint256) {
        if (value < minVal) return minVal;
        if (value > maxVal) return maxVal;
        return value;
    }

    /**
     * @notice Picks an index from `weights` using `random` as a uniform seed.
     * @dev Reverts if every weight is zero so callers cannot modulo by zero.
     */
    function weightedRandom(uint256[] memory weights, uint256 random) internal pure returns (uint256) {
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < weights.length; ) {
            totalWeight += weights[i];
            unchecked {
                ++i;
            }
        }
        require(totalWeight > 0, "MathUtils: empty weights");
        uint256 randomWeight = random % totalWeight;
        uint256 cumulative = 0;
        for (uint256 i = 0; i < weights.length; ) {
            cumulative += weights[i];
            if (randomWeight < cumulative) return i;
            unchecked {
                ++i;
            }
        }
        return weights.length - 1;
    }
}
