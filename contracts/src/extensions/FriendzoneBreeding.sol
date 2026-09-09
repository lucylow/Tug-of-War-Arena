// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IFriendzoneNFT} from "../interfaces/IFriendzoneNFT.sol";
import {VRFConsumer} from "../randomness/VRFConsumer.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";
import {MathUtils} from "../utils/MathUtils.sol";

/**
 * @title FriendzoneBreeding
 * @notice Combine two wearables into a child whose rarity follows the parents plus VRF jitter.
 */
contract FriendzoneBreeding is VRFConsumer, Ownable, ReentrancyGuard {
    struct Breeding {
        uint256 id;
        address owner;
        uint256 parent1TokenId;
        uint256 parent2TokenId;
        uint256 childTokenId;
        bool resolved;
        uint256 randomSeed;
    }

    IFriendzoneNFT public immutable nftContract;
    uint256 public breedingCost;

    mapping(uint256 => Breeding) public breedings;
    mapping(uint256 => uint256) public requestToBreeding;
    uint256 public breedingCounter = 1;
    uint256 private _pendingBreedingId;

    event BreedingInitiated(uint256 indexed breedingId, uint256 parent1, uint256 parent2);
    event BreedingComplete(uint256 indexed breedingId, uint256 childTokenId);
    event BreedingCostUpdated(uint256 cost);

    error InsufficientFee();
    error NotOwner();
    error SameParent();
    error AlreadyResolved();
    error UnknownBreeding();
    error ZeroAddress();

    constructor(
        address nftContract_,
        uint256 breedingCost_,
        address vrfCoordinator,
        uint64 subscriptionId,
        bytes32 keyHash,
        address initialOwner
    ) VRFConsumer(vrfCoordinator, subscriptionId, keyHash) Ownable(initialOwner) {
        if (nftContract_ == address(0)) revert ZeroAddress();
        nftContract = IFriendzoneNFT(nftContract_);
        breedingCost = breedingCost_;
    }

    function setBreedingCost(uint256 cost) external onlyOwner {
        breedingCost = cost;
        emit BreedingCostUpdated(cost);
    }

    function initiateBreeding(uint256 parent1, uint256 parent2) external payable nonReentrant returns (uint256 breedingId) {
        if (msg.value < breedingCost) revert InsufficientFee();
        if (parent1 == parent2) revert SameParent();
        if (nftContract.ownerOf(parent1) != msg.sender) revert NotOwner();
        if (nftContract.ownerOf(parent2) != msg.sender) revert NotOwner();

        nftContract.transferFrom(msg.sender, address(this), parent1);
        nftContract.transferFrom(msg.sender, address(this), parent2);

        breedingId = breedingCounter;
        unchecked {
            ++breedingCounter;
        }

        breedings[breedingId] = Breeding({
            id: breedingId,
            owner: msg.sender,
            parent1TokenId: parent1,
            parent2TokenId: parent2,
            childTokenId: 0,
            resolved: false,
            randomSeed: 0
        });

        emit BreedingInitiated(breedingId, parent1, parent2);

        _pendingBreedingId = breedingId;
        uint256 requestId = _requestRandomWords(breedingId);
        requestToBreeding[requestId] = breedingId;
        _pendingBreedingId = 0;
    }

    function withdraw(address payable to) external onlyOwner {
        to.transfer(address(this).balance);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 breedingId = requestToBreeding[requestId];
        if (breedingId == 0) breedingId = _pendingBreedingId;
        if (breedingId == 0) revert UnknownBreeding();
        requestToBreeding[requestId] = breedingId;
        Breeding storage breeding = breedings[breedingId];
        if (breeding.owner == address(0)) revert UnknownBreeding();
        if (breeding.resolved) revert AlreadyResolved();

        uint8 childRarity = _getChildRarity(breeding.parent1TokenId, breeding.parent2TokenId, randomWords[0]);
        uint256 childTokenId = nftContract.mint(breeding.owner, childRarity);

        breeding.resolved = true;
        breeding.randomSeed = randomWords[0];
        breeding.childTokenId = childTokenId;

        nftContract.transferFrom(address(this), breeding.owner, breeding.parent1TokenId);
        nftContract.transferFrom(address(this), breeding.owner, breeding.parent2TokenId);

        emit BreedingComplete(breedingId, childTokenId);
    }

    function _getChildRarity(uint256 parent1, uint256 parent2, uint256 random) private view returns (uint8) {
        uint8 rarity1 = nftContract.getRarity(parent1);
        uint8 rarity2 = nftContract.getRarity(parent2);
        uint8 baseRarity = uint8(MathUtils.average(rarity1, rarity2));
        uint8 variation = uint8(random % 3);
        if (variation == 0 && baseRarity > 0) return baseRarity - 1;
        if (variation == 2 && baseRarity < 5) return baseRarity + 1;
        return baseRarity;
    }
}
