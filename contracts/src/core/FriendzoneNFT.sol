// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title FriendzoneNFT
 * @notice Wearable collection whose rarity maps onto in-game power and speed bonuses.
 */
contract FriendzoneNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    using Strings for uint256;

    enum Rarity {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary,
        Mythic
    }

    struct NFTData {
        Rarity rarity;
        uint256 powerBonus;
        uint256 speedBonus;
        uint256 mintedAt;
        bool isEvolved;
    }

    mapping(uint256 => NFTData) public nftData;
    mapping(Rarity => uint256) public raritySupply;
    mapping(Rarity => uint256) public rarityMaxSupply;
    mapping(address => bool) public minters;

    string public baseTokenURI;
    uint256 public mintPrice;
    uint256 private _nextTokenId;

    event NFTMinted(address indexed to, uint256 indexed tokenId, Rarity rarity);
    event NFTBurned(uint256 indexed tokenId, address indexed from);
    event MinterUpdated(address indexed account, bool allowed);
    event Evolved(uint256 indexed tokenId, uint256 newPowerBonus);

    error NotMinter();
    error InvalidRarity();
    error RaritySupplyExhausted();
    error NotTokenOwner();
    error AlreadyEvolved();

    modifier onlyMinter() {
        if (!minters[msg.sender] && msg.sender != owner()) revert NotMinter();
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        uint256 mintPrice_,
        address initialOwner
    ) ERC721(name_, symbol_) Ownable(initialOwner) {
        baseTokenURI = baseURI_;
        mintPrice = mintPrice_;
        minters[initialOwner] = true;

        rarityMaxSupply[Rarity.Common] = 5000;
        rarityMaxSupply[Rarity.Uncommon] = 2000;
        rarityMaxSupply[Rarity.Rare] = 1000;
        rarityMaxSupply[Rarity.Epic] = 500;
        rarityMaxSupply[Rarity.Legendary] = 200;
        rarityMaxSupply[Rarity.Mythic] = 50;
    }

    function setMinter(address account, bool allowed) external onlyOwner {
        minters[account] = allowed;
        emit MinterUpdated(account, allowed);
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    function mintNFT(address to, uint8 rarityIndex) public onlyMinter returns (uint256 tokenId) {
        if (rarityIndex > uint8(Rarity.Mythic)) revert InvalidRarity();
        Rarity rarity = Rarity(rarityIndex);
        if (raritySupply[rarity] >= rarityMaxSupply[rarity]) revert RaritySupplyExhausted();

        tokenId = _nextTokenId;
        unchecked {
            ++_nextTokenId;
            ++raritySupply[rarity];
        }

        _safeMint(to, tokenId);
        nftData[tokenId] = NFTData({
            rarity: rarity,
            powerBonus: _powerBonus(rarity),
            speedBonus: _speedBonus(rarity),
            mintedAt: block.timestamp,
            isEvolved: false
        });
        _setTokenURI(tokenId, string.concat(baseTokenURI, tokenId.toString(), ".json"));
        emit NFTMinted(to, tokenId, rarity);
    }

    function mint(address to, uint8 rarityIndex) external onlyMinter returns (uint256) {
        return mintNFT(to, rarityIndex);
    }

    function mintRandom(address to, uint8 rarityIndex) external onlyMinter returns (uint256) {
        return mintNFT(to, rarityIndex);
    }

    function burn(uint256 tokenId) external {
        address tokenOwner = _requireOwned(tokenId);
        if (
            msg.sender != tokenOwner &&
            getApproved(tokenId) != msg.sender &&
            !isApprovedForAll(tokenOwner, msg.sender) &&
            !minters[msg.sender]
        ) {
            revert NotTokenOwner();
        }

        Rarity rarity = nftData[tokenId].rarity;
        delete nftData[tokenId];
        if (raritySupply[rarity] > 0) {
            unchecked {
                --raritySupply[rarity];
            }
        }
        _burn(tokenId);
        emit NFTBurned(tokenId, tokenOwner);
    }

    function getRarity(uint256 tokenId) external view returns (uint8) {
        _requireOwned(tokenId);
        return uint8(nftData[tokenId].rarity);
    }

    function evolve(uint256 tokenId) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        NFTData storage data = nftData[tokenId];
        if (data.isEvolved) revert AlreadyEvolved();
        data.isEvolved = true;
        data.powerBonus += data.powerBonus / 5;
        data.speedBonus += data.speedBonus / 5;
        emit Evolved(tokenId, data.powerBonus);
    }

    function getPowerBonus(uint256 tokenId) external view returns (uint256) {
        _requireOwned(tokenId);
        return nftData[tokenId].powerBonus;
    }

    function getSpeedBonus(uint256 tokenId) external view returns (uint256) {
        _requireOwned(tokenId);
        return nftData[tokenId].speedBonus;
    }

    function getRarityName(Rarity rarity) public pure returns (string memory) {
        string[6] memory names = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];
        return names[uint256(rarity)];
    }

    function getRarityColor(Rarity rarity) public pure returns (string memory) {
        string[6] memory colors = ["#808080", "#008000", "#0000FF", "#800080", "#FF8C00", "#FF0000"];
        return colors[uint256(rarity)];
    }

    function _powerBonus(Rarity rarity) private pure returns (uint256) {
        uint256[6] memory bonuses = [uint256(5), 10, 20, 35, 50, 100];
        return bonuses[uint256(rarity)];
    }

    function _speedBonus(Rarity rarity) private pure returns (uint256) {
        uint256[6] memory bonuses = [uint256(2), 4, 8, 15, 25, 50];
        return bonuses[uint256(rarity)];
    }

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
