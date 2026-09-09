// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OperatorOwnable
 * @notice Ownable access with a game-operator role for backend match/XP writes.
 */
abstract contract OperatorOwnable is Ownable {
    mapping(address => bool) public operators;

    event OperatorUpdated(address indexed account, bool enabled);

    constructor(address initialOwner) Ownable(initialOwner) {}

    modifier onlyOperator() {
        require(msg.sender == owner() || operators[msg.sender], "Not operator");
        _;
    }

    function setOperator(address account, bool enabled) external onlyOwner {
        require(account != address(0), "Zero address");
        operators[account] = enabled;
        emit OperatorUpdated(account, enabled);
    }
}
