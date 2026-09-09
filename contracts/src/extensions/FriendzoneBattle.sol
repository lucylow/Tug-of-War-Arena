// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IFriendzoneNFT} from "../interfaces/IFriendzoneNFT.sol";
import {VRFConsumer} from "../randomness/VRFConsumer.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";

/**
 * @title FriendzoneBattle
 * @notice Lock two wearables and resolve the winner with Chainlink-compatible VRF.
 */
contract FriendzoneBattle is VRFConsumer, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Battle {
        uint256 id;
        address challenger;
        address opponent;
        uint256 challengerTokenId;
        uint256 opponentTokenId;
        uint256 startTime;
        bool resolved;
        uint256 winnerTokenId;
        uint256 randomNumber;
    }

    IFriendzoneNFT public immutable nftContract;
    IERC20 public immutable entryToken;
    uint256 public entryFee;

    mapping(uint256 => Battle) public battles;
    mapping(uint256 => uint256) public requestToBattle;
    uint256 public battleCounter = 1;
    uint256 private _pendingBattleId;

    event BattleCreated(uint256 indexed battleId, address challenger, uint256 tokenId);
    event BattleAccepted(uint256 indexed battleId, address opponent, uint256 tokenId);
    event BattleResolved(uint256 indexed battleId, uint256 winnerTokenId, address winner);
    event EntryFeeUpdated(uint256 fee);

    error NotOwner();
    error AlreadyAccepted();
    error UnknownBattle();
    error AlreadyResolved();
    error ZeroPower();
    error ZeroAddress();

    constructor(
        address nftContract_,
        address entryToken_,
        uint256 entryFee_,
        address vrfCoordinator,
        uint64 subscriptionId,
        bytes32 keyHash,
        address initialOwner
    ) VRFConsumer(vrfCoordinator, subscriptionId, keyHash) Ownable(initialOwner) {
        if (nftContract_ == address(0) || entryToken_ == address(0)) revert ZeroAddress();
        nftContract = IFriendzoneNFT(nftContract_);
        entryToken = IERC20(entryToken_);
        entryFee = entryFee_;
    }

    function setEntryFee(uint256 fee) external onlyOwner {
        entryFee = fee;
        emit EntryFeeUpdated(fee);
    }

    function createBattle(uint256 tokenId) external nonReentrant returns (uint256 battleId) {
        if (nftContract.ownerOf(tokenId) != msg.sender) revert NotOwner();
        entryToken.safeTransferFrom(msg.sender, address(this), entryFee);
        nftContract.transferFrom(msg.sender, address(this), tokenId);

        battleId = battleCounter;
        unchecked {
            ++battleCounter;
        }

        battles[battleId] = Battle({
            id: battleId,
            challenger: msg.sender,
            opponent: address(0),
            challengerTokenId: tokenId,
            opponentTokenId: 0,
            startTime: block.timestamp,
            resolved: false,
            winnerTokenId: 0,
            randomNumber: 0
        });

        emit BattleCreated(battleId, msg.sender, tokenId);
    }

    function acceptBattle(uint256 battleId, uint256 tokenId) external nonReentrant {
        Battle storage battle = battles[battleId];
        if (battle.challenger == address(0)) revert UnknownBattle();
        if (battle.opponent != address(0)) revert AlreadyAccepted();
        if (nftContract.ownerOf(tokenId) != msg.sender) revert NotOwner();

        entryToken.safeTransferFrom(msg.sender, address(this), entryFee);
        nftContract.transferFrom(msg.sender, address(this), tokenId);

        battle.opponent = msg.sender;
        battle.opponentTokenId = tokenId;
        emit BattleAccepted(battleId, msg.sender, tokenId);

        _pendingBattleId = battleId;
        uint256 requestId = _requestRandomWords(battleId);
        requestToBattle[requestId] = battleId;
        _pendingBattleId = 0;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 battleId = requestToBattle[requestId];
        if (battleId == 0) battleId = _pendingBattleId;
        if (battleId == 0) revert UnknownBattle();
        requestToBattle[requestId] = battleId;
        Battle storage battle = battles[battleId];
        if (battle.resolved) revert AlreadyResolved();

        uint256 challengerPower = nftContract.getPowerBonus(battle.challengerTokenId);
        uint256 opponentPower = nftContract.getPowerBonus(battle.opponentTokenId);
        uint256 totalPower = challengerPower + opponentPower;
        if (totalPower == 0) revert ZeroPower();

        uint256 roll = randomWords[0] % totalPower;
        uint256 winnerTokenId = roll < challengerPower ? battle.challengerTokenId : battle.opponentTokenId;
        address winner = winnerTokenId == battle.challengerTokenId ? battle.challenger : battle.opponent;

        battle.resolved = true;
        battle.randomNumber = randomWords[0];
        battle.winnerTokenId = winnerTokenId;

        nftContract.transferFrom(address(this), battle.challenger, battle.challengerTokenId);
        nftContract.transferFrom(address(this), battle.opponent, battle.opponentTokenId);
        entryToken.safeTransfer(winner, entryFee * 2);

        emit BattleResolved(battleId, winnerTokenId, winner);
    }
}
