// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IFriendzoneNFT
 * @notice ERC-721 wearable surface used by the arena and tournament bracket.
 */
interface IFriendzoneNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function mint(address to, uint8 rarity) external returns (uint256 tokenId);
    function mintNFT(address to, uint8 rarity) external returns (uint256 tokenId);
    function mintRandom(address to, uint8 rarityIndex) external returns (uint256 tokenId);
    function burn(uint256 tokenId) external;
    function getRarity(uint256 tokenId) external view returns (uint8);
    function getPowerBonus(uint256 tokenId) external view returns (uint256);
    function getSpeedBonus(uint256 tokenId) external view returns (uint256);
}
