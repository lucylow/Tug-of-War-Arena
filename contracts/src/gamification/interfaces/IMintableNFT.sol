// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMintableNFT {
    function mintTo(address to, uint8 rarity) external returns (uint256 tokenId);
}

interface IRarityProvider {
    function rarityOf(uint256 tokenId) external view returns (uint8);
}
