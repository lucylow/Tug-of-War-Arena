// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IFriendzoneNFT} from "../interfaces/IFriendzoneNFT.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";

/**
 * @title FriendzoneCrafting
 * @notice Burn ingredient wearables that meet a recipe's rarity list and mint the result.
 */
contract FriendzoneCrafting is Ownable, ReentrancyGuard {
    struct Recipe {
        uint256 id;
        string name;
        uint8[] requiredRarities;
        uint8 resultRarity;
        bool active;
    }

    IFriendzoneNFT public immutable nftContract;
    mapping(uint256 => Recipe) private _recipes;
    uint256 public nextRecipeId;

    event RecipeAdded(uint256 indexed id, string name);
    event RecipeStatusUpdated(uint256 indexed id, bool active);
    event Crafted(address indexed crafter, uint256 recipeId, uint256 resultTokenId);

    error RecipeInactive();
    error LengthMismatch();
    error NotOwner();
    error RarityTooLow();
    error DuplicateIngredient();
    error UnknownRecipe();
    error ZeroAddress();

    constructor(address nftContract_, address initialOwner) Ownable(initialOwner) {
        if (nftContract_ == address(0)) revert ZeroAddress();
        nftContract = IFriendzoneNFT(nftContract_);
    }

    function addRecipe(string calldata name, uint8[] calldata requiredRarities, uint8 resultRarity)
        external
        onlyOwner
        returns (uint256 id)
    {
        id = nextRecipeId;
        unchecked {
            ++nextRecipeId;
        }
        Recipe storage recipe = _recipes[id];
        recipe.id = id;
        recipe.name = name;
        recipe.requiredRarities = requiredRarities;
        recipe.resultRarity = resultRarity;
        recipe.active = true;
        emit RecipeAdded(id, name);
    }

    function setRecipeActive(uint256 recipeId, bool active) external onlyOwner {
        if (recipeId >= nextRecipeId) revert UnknownRecipe();
        _recipes[recipeId].active = active;
        emit RecipeStatusUpdated(recipeId, active);
    }

    function getRecipe(uint256 recipeId)
        external
        view
        returns (uint256 id, string memory name, uint8[] memory requiredRarities, uint8 resultRarity, bool active)
    {
        Recipe storage recipe = _recipes[recipeId];
        return (recipe.id, recipe.name, recipe.requiredRarities, recipe.resultRarity, recipe.active);
    }

    function craft(uint256 recipeId, uint256[] calldata ingredientTokenIds) external nonReentrant returns (uint256 tokenId) {
        Recipe storage recipe = _recipes[recipeId];
        if (!recipe.active) revert RecipeInactive();
        if (ingredientTokenIds.length != recipe.requiredRarities.length) revert LengthMismatch();

        uint256 count = ingredientTokenIds.length;
        for (uint256 i = 0; i < count; ) {
            uint256 ingredientId = ingredientTokenIds[i];
            if (nftContract.ownerOf(ingredientId) != msg.sender) revert NotOwner();
            if (nftContract.getRarity(ingredientId) < recipe.requiredRarities[i]) revert RarityTooLow();
            for (uint256 j = 0; j < i; ) {
                if (ingredientTokenIds[j] == ingredientId) revert DuplicateIngredient();
                unchecked {
                    ++j;
                }
            }
            unchecked {
                ++i;
            }
        }

        for (uint256 i = 0; i < count; ) {
            nftContract.burn(ingredientTokenIds[i]);
            unchecked {
                ++i;
            }
        }

        tokenId = nftContract.mint(msg.sender, recipe.resultRarity);
        emit Crafted(msg.sender, recipeId, tokenId);
    }
}
