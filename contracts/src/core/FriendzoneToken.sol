// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FriendzoneToken
 * @notice FZONE utility token for entry fees, prizes, referrals, and DAO votes.
 */
contract FriendzoneToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;
    uint256 public constant INITIAL_MINT = 100_000_000 * 10 ** 18;

    error ExceedsMaxSupply();

    constructor(address initialOwner) ERC20("Friendzone Token", "FZONE") Ownable(initialOwner) {
        _mint(initialOwner, INITIAL_MINT);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        if (totalSupply() + amount > MAX_SUPPLY) revert ExceedsMaxSupply();
        _mint(to, amount);
    }
}
