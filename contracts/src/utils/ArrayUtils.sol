// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ArrayUtils
 * @notice Small helpers for uint256 lists used by staking and crafting.
 */
library ArrayUtils {
    function contains(uint256[] memory array, uint256 value) internal pure returns (bool) {
        uint256 length = array.length;
        for (uint256 i = 0; i < length; ) {
            if (array[i] == value) return true;
            unchecked {
                ++i;
            }
        }
        return false;
    }

    function indexOf(uint256[] memory array, uint256 value) internal pure returns (uint256 index, bool found) {
        uint256 length = array.length;
        for (uint256 i = 0; i < length; ) {
            if (array[i] == value) return (i, true);
            unchecked {
                ++i;
            }
        }
        return (0, false);
    }

    /// @dev Swap-and-pop. Returns false if `value` is not present.
    function removeValue(uint256[] storage array, uint256 value) internal returns (bool removed) {
        uint256 length = array.length;
        for (uint256 i = 0; i < length; ) {
            if (array[i] == value) {
                uint256 last = length - 1;
                if (i != last) {
                    array[i] = array[last];
                }
                array.pop();
                return true;
            }
            unchecked {
                ++i;
            }
        }
        return false;
    }

    function remove(uint256[] memory array, uint256 value) internal pure returns (uint256[] memory result) {
        (uint256 index, bool found) = indexOf(array, value);
        if (!found) {
            return array;
        }
        result = new uint256[](array.length - 1);
        uint256 cursor;
        for (uint256 i = 0; i < array.length; ) {
            if (i != index) {
                result[cursor] = array[i];
                unchecked {
                    ++cursor;
                }
            }
            unchecked {
                ++i;
            }
        }
    }
}
