// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IFriendzoneNFT} from "../interfaces/IFriendzoneNFT.sol";
import {VRFConsumer} from "../randomness/VRFConsumer.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";

/**
 * @title FriendzoneLootBox
 * @notice FZONE-priced loot boxes whose rarity is drawn from Chainlink-compatible VRF.
 */
contract FriendzoneLootBox is VRFConsumer, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Box {
        uint256 id;
        address owner;
        bool opened;
        uint256 randomNumber;
        uint256 tokenId;
        uint8 rarity;
    }

    IFriendzoneNFT public immutable nftContract;
    IERC20 public immutable paymentToken;
    uint256 public boxPrice;

    mapping(uint256 => Box) public boxes;
    mapping(uint256 => uint256) public requestToBox;
    mapping(uint8 => uint256) public odds;
    uint256 public nextBoxId = 1;
    uint256 private _pendingBoxId;

    event BoxPurchased(uint256 indexed boxId, address indexed buyer, uint256 requestId);
    event BoxOpened(uint256 indexed boxId, uint256 indexed tokenId, uint8 rarity);
    event BoxPriceUpdated(uint256 price);

    error InsufficientPayment();
    error AlreadyOpened();
    error UnknownBox();
    error ZeroAddress();

    constructor(
        address nftContract_,
        address paymentToken_,
        uint256 boxPrice_,
        address vrfCoordinator,
        uint64 subscriptionId,
        bytes32 keyHash,
        address initialOwner
    ) VRFConsumer(vrfCoordinator, subscriptionId, keyHash) Ownable(initialOwner) {
        if (nftContract_ == address(0) || paymentToken_ == address(0)) revert ZeroAddress();
        nftContract = IFriendzoneNFT(nftContract_);
        paymentToken = IERC20(paymentToken_);
        boxPrice = boxPrice_;

        odds[0] = 500;
        odds[1] = 250;
        odds[2] = 150;
        odds[3] = 70;
        odds[4] = 25;
        odds[5] = 5;
    }

    function setBoxPrice(uint256 price) external onlyOwner {
        boxPrice = price;
        emit BoxPriceUpdated(price);
    }

    function setOdds(uint8 rarity, uint256 weight) external onlyOwner {
        odds[rarity] = weight;
    }

    function withdrawTokens(address to, uint256 amount) external onlyOwner {
        paymentToken.safeTransfer(to, amount);
    }

    function purchaseBox() external nonReentrant returns (uint256 boxId) {
        if (boxPrice == 0) revert InsufficientPayment();
        paymentToken.safeTransferFrom(msg.sender, address(this), boxPrice);

        boxId = nextBoxId;
        unchecked {
            ++nextBoxId;
        }

        boxes[boxId] = Box({
            id: boxId,
            owner: msg.sender,
            opened: false,
            randomNumber: 0,
            tokenId: 0,
            rarity: 0
        });

        _pendingBoxId = boxId;
        uint256 requestId = _requestRandomWords(boxId);
        requestToBox[requestId] = boxId;
        _pendingBoxId = 0;
        emit BoxPurchased(boxId, msg.sender, requestId);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 boxId = requestToBox[requestId];
        if (boxId == 0) boxId = _pendingBoxId;
        if (boxId == 0) revert UnknownBox();
        requestToBox[requestId] = boxId;
        Box storage box = boxes[boxId];
        if (box.owner == address(0)) revert UnknownBox();
        if (box.opened) revert AlreadyOpened();

        uint8 rarity = _getRarityFromRandom(randomWords[0]);
        uint256 tokenId = nftContract.mint(box.owner, rarity);

        box.opened = true;
        box.randomNumber = randomWords[0];
        box.tokenId = tokenId;
        box.rarity = rarity;

        emit BoxOpened(boxId, tokenId, rarity);
    }

    function _getRarityFromRandom(uint256 random) private view returns (uint8) {
        uint256 randomWeight = random % 1000;
        uint256 cumulative = 0;
        for (uint8 i = 0; i < 6; ) {
            cumulative += odds[i];
            if (randomWeight < cumulative) return i;
            unchecked {
                ++i;
            }
        }
        return 0;
    }
}
