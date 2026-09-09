// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IMintableNFT, IRarityProvider} from "../gamification/interfaces/IMintableNFT.sol";

contract MockERC721 is ERC721, Ownable, IMintableNFT, IRarityProvider {
    uint256 public nextId = 1;

    constructor() ERC721("Arena NFT", "ARENA") Ownable(msg.sender) {}

    function mint(address to) external returns (uint256 tokenId) {
        tokenId = nextId++;
        _mint(to, tokenId);
    }

    function mintTo(address to, uint8) external returns (uint256 tokenId) {
        tokenId = nextId++;
        _mint(to, tokenId);
    }

    function rarityOf(uint256 tokenId) external view returns (uint8) {
        require(_ownerOf(tokenId) != address(0), "Unknown token");
        return uint8(tokenId % 6);
    }
}
