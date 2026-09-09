// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {OperatorOwnable} from "./OperatorOwnable.sol";
import {IMintableNFT} from "./interfaces/IMintableNFT.sol";

interface IVrfCoordinator {
    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 requestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId);
}

/**
 * @title LootBoxVRF
 * @notice VRF-powered loot boxes. Compatible with Chainlink VRF coordinators
 *         that callback `rawFulfillRandomWords`, plus the included mock coordinator.
 */
contract LootBoxVRF is OperatorOwnable, ReentrancyGuard, Pausable {
    struct Box {
        uint256 id;
        address owner;
        bool opened;
        uint256 randomNumber;
        uint256 tokenId;
        uint8 rarity;
        uint256 rewardAmount;
        bool fulfilled;
    }

    struct RarityConfig {
        uint8 rarity;
        uint256 weight;
        uint256 minReward;
        uint256 maxReward;
        bool active;
    }

    IMintableNFT public nftContract;
    IVrfCoordinator public coordinator;

    mapping(uint256 => Box) public boxes;
    mapping(uint256 => uint256) public requestToBox;
    mapping(uint8 => RarityConfig) public rarityConfigs;
    mapping(address => uint256[]) private ownerBoxes;

    uint256 public nextBoxId = 1;
    uint256 public boxPrice;
    uint256 public totalWeight;

    uint64 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 500_000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1;

    event BoxPurchased(uint256 indexed boxId, address indexed buyer, uint256 requestId);
    event BoxOpened(uint256 indexed boxId, uint256 indexed tokenId, uint8 rarity);
    event RarityConfigUpdated(uint8 rarity, uint256 weight);

    constructor(
        address _nftContract,
        uint256 _boxPrice,
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash
    ) OperatorOwnable(msg.sender) {
        require(_vrfCoordinator != address(0), "Coordinator required");
        nftContract = IMintableNFT(_nftContract);
        boxPrice = _boxPrice;
        coordinator = IVrfCoordinator(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;

        rarityConfigs[0] = RarityConfig(0, 5000, 0, 0, true);
        rarityConfigs[1] = RarityConfig(1, 2500, 0, 0, true);
        rarityConfigs[2] = RarityConfig(2, 1500, 0, 0, true);
        rarityConfigs[3] = RarityConfig(3, 700, 0, 0, true);
        rarityConfigs[4] = RarityConfig(4, 250, 0, 0, true);
        rarityConfigs[5] = RarityConfig(5, 50, 0, 0, true);
        _updateTotalWeight();
    }

    function purchaseBox() external payable nonReentrant whenNotPaused returns (uint256) {
        require(msg.value >= boxPrice, "Insufficient payment");

        uint256 boxId = nextBoxId++;
        boxes[boxId] = Box({
            id: boxId,
            owner: msg.sender,
            opened: false,
            randomNumber: 0,
            tokenId: 0,
            rarity: 0,
            rewardAmount: 0,
            fulfilled: false
        });
        ownerBoxes[msg.sender].push(boxId);

        uint256 requestId = coordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        requestToBox[requestId] = boxId;

        emit BoxPurchased(boxId, msg.sender, requestId);
        return boxId;
    }

    function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external {
        require(msg.sender == address(coordinator), "Only coordinator");
        _fulfillRandomWords(requestId, randomWords);
    }

    function getBox(uint256 boxId) external view returns (Box memory) {
        return boxes[boxId];
    }

    function getBoxesByOwner(address owner_) external view returns (uint256[] memory) {
        return ownerBoxes[owner_];
    }

    function getRarityOdds() external view returns (uint8[] memory, uint256[] memory) {
        uint8[] memory rarities = new uint8[](6);
        uint256[] memory weights = new uint256[](6);
        for (uint8 i = 0; i < 6; ) {
            rarities[i] = i;
            weights[i] = rarityConfigs[i].weight;
            unchecked {
                ++i;
            }
        }
        return (rarities, weights);
    }

    function setRarityWeight(uint8 rarity, uint256 weight) external onlyOwner {
        require(rarity <= 5, "Invalid rarity");
        rarityConfigs[rarity].weight = weight;
        _updateTotalWeight();
        emit RarityConfigUpdated(rarity, weight);
    }

    function setBoxPrice(uint256 _boxPrice) external onlyOwner {
        boxPrice = _boxPrice;
    }

    function setNftContract(address nft) external onlyOwner {
        nftContract = IMintableNFT(nft);
    }

    function setPaused(bool paused_) external onlyOwner {
        if (paused_) _pause();
        else _unpause();
    }

    function withdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }

    function _fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) private {
        uint256 boxId = requestToBox[requestId];
        require(boxId != 0, "Unknown request");
        Box storage box = boxes[boxId];
        require(!box.opened, "Already opened");
        require(randomWords.length > 0, "No randomness");

        box.opened = true;
        box.fulfilled = true;
        box.randomNumber = randomWords[0];

        uint8 rarity = _getRarityFromRandom(randomWords[0]);
        box.rarity = rarity;

        if (address(nftContract) != address(0)) {
            box.tokenId = nftContract.mintTo(box.owner, rarity);
        }

        emit BoxOpened(boxId, box.tokenId, rarity);
    }

    function _getRarityFromRandom(uint256 random) private view returns (uint8) {
        uint256 randomWeight = random % totalWeight;
        uint256 cumulative = 0;
        for (uint8 i = 0; i < 6; ) {
            if (rarityConfigs[i].active) {
                cumulative += rarityConfigs[i].weight;
                if (randomWeight < cumulative) return i;
            }
            unchecked {
                ++i;
            }
        }
        return 0;
    }

    function _updateTotalWeight() private {
        uint256 weight = 0;
        for (uint8 i = 0; i < 6; ) {
            if (rarityConfigs[i].active) {
                weight += rarityConfigs[i].weight;
            }
            unchecked {
                ++i;
            }
        }
        require(weight > 0, "No weight");
        totalWeight = weight;
    }
}
