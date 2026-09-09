// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {OperatorOwnable} from "./OperatorOwnable.sol";
import {IAchievementBadges} from "./interfaces/IAchievementBadges.sol";

/**
 * @title AchievementBadges
 * @notice ERC-1155 soulbound achievement badges for portable on-chain reputation.
 */
contract AchievementBadges is ERC1155, OperatorOwnable, IAchievementBadges {
    using Strings for uint256;

    struct Badge {
        uint256 id;
        string name;
        string description;
        uint8 tier;
        uint256 maxSupply;
        uint256 minted;
        bool soulbound;
        bool active;
    }

    mapping(uint256 => Badge) public badges;
    mapping(uint256 => mapping(address => bool)) public hasBadge;
    mapping(address => uint256[]) public playerBadges;

    uint256 public nextBadgeId = 1;
    string public baseURI;

    event BadgeCreated(uint256 indexed id, string name, uint8 tier);
    event BadgeAwarded(uint256 indexed id, address indexed to);
    event BaseURIUpdated(string newBaseURI);

    constructor(string memory _baseURI) ERC1155(_baseURI) OperatorOwnable(msg.sender) {
        baseURI = _baseURI;
    }

    function createBadge(
        string memory name,
        string memory description,
        uint8 tier,
        uint256 maxSupply,
        bool soulbound
    ) external onlyOwner returns (uint256) {
        require(tier >= 1 && tier <= 5, "Invalid tier");
        require(maxSupply > 0, "Max supply required");
        require(bytes(name).length > 0, "Name required");

        uint256 id = nextBadgeId++;
        badges[id] = Badge({
            id: id,
            name: name,
            description: description,
            tier: tier,
            maxSupply: maxSupply,
            minted: 0,
            soulbound: soulbound,
            active: true
        });

        emit BadgeCreated(id, name, tier);
        return id;
    }

    function awardBadge(address to, uint256 badgeId) external onlyOperator {
        require(to != address(0), "Zero address");
        Badge storage badge = badges[badgeId];
        require(badge.id == badgeId, "Unknown badge");
        require(badge.active, "Badge not active");
        require(badge.minted < badge.maxSupply, "Max supply reached");
        require(!hasBadge[badgeId][to], "Already has badge");

        badge.minted++;
        hasBadge[badgeId][to] = true;
        playerBadges[to].push(badgeId);
        _mint(to, badgeId, 1, "");

        emit BadgeAwarded(badgeId, to);
    }

    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
        _setURI(_baseURI);
        emit BaseURIUpdated(_baseURI);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        require(badges[tokenId].id == tokenId, "Unknown badge");
        return string(abi.encodePacked(baseURI, tokenId.toString(), ".json"));
    }

    function getBadge(uint256 badgeId) external view returns (Badge memory) {
        return badges[badgeId];
    }

    function getPlayerBadges(address player) external view returns (uint256[] memory) {
        return playerBadges[player];
    }

    function getTierName(uint8 tier) public pure returns (string memory) {
        require(tier >= 1 && tier <= 5, "Invalid tier");
        string[5] memory names = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
        return names[tier - 1];
    }

    function getTierColor(uint8 tier) public pure returns (string memory) {
        require(tier >= 1 && tier <= 5, "Invalid tier");
        string[5] memory colors = ["#CD7F32", "#C0C0C0", "#FFD700", "#E5E4E2", "#B9F2FF"];
        return colors[tier - 1];
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override
    {
        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < ids.length; ) {
                require(!badges[ids[i]].soulbound, "Soulbound: cannot transfer");
                unchecked {
                    ++i;
                }
            }
        }
        super._update(from, to, ids, values);
    }
}
