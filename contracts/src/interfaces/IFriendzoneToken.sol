// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IFriendzoneToken
 * @notice Minimal ERC-20 surface used by arena, referrals, and governance.
 */
interface IFriendzoneToken {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
}
