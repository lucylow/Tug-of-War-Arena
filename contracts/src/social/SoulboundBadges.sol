// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {OperatorOwnable} from "../gamification/OperatorOwnable.sol";

/**
 * @title SoulboundBadges
 * @notice Non-transferable ERC-1155 badges for social achievements.
 *
 * Categories: Social, Content, Governance, Community.
 * Tiers: 1-5 Bronze, Silver, Gold, Platinum, Diamond.
 */
contract SoulboundBadges is ERC1155, OperatorOwnable {
    using Strings for uint256;

    struct Badge {
        uint256 id;
        string name;
        string description;
        uint8 tier;
        string category;
        uint256 maxSupply;
        uint256 minted;
        bool active;
    }

    mapping(uint256 => Badge) public badges;
    mapping(uint256 => mapping(address => bool)) public hasBadge;
    mapping(address => uint256[]) public playerBadges;

    uint256 public nextBadgeId = 1;
    string public baseURI;

    event BadgeCreated(uint256 indexed id, string name, uint8 tier);
    event BadgeAwarded(uint256 indexed id, address indexed to);
    event BadgeStatusUpdated(uint256 indexed id, bool active);

    error InvalidTier();
    error NameRequired();
    error BadgeInactive();
    error MaxSupplyReached();
    error AlreadyHasBadge();
    error Soulbound();

    constructor(string memory baseURI_, address initialOwner) ERC1155(baseURI_) OperatorOwnable(initialOwner) {
        baseURI = baseURI_;
    }

    function createBadge(
        string calldata name,
        string calldata description,
        uint8 tier,
        string calldata category,
        uint256 maxSupply
    ) external onlyOwner returns (uint256 id) {
        if (tier < 1 || tier > 5) revert InvalidTier();
        if (bytes(name).length == 0) revert NameRequired();

        id = nextBadgeId++;
        badges[id] = Badge({
            id: id,
            name: name,
            description: description,
            tier: tier,
            category: category,
            maxSupply: maxSupply,
            minted: 0,
            active: true
        });

        emit BadgeCreated(id, name, tier);
    }

    function awardBadge(address to, uint256 badgeId) external onlyOperator {
        Badge storage badge = badges[badgeId];
        if (!badge.active) revert BadgeInactive();
        if (badge.minted >= badge.maxSupply) revert MaxSupplyReached();
        if (hasBadge[badgeId][to]) revert AlreadyHasBadge();

        badge.minted++;
        hasBadge[badgeId][to] = true;
        playerBadges[to].push(badgeId);
        _mint(to, badgeId, 1, "");

        emit BadgeAwarded(badgeId, to);
    }

    function setBadgeActive(uint256 badgeId, bool active) external onlyOwner {
        badges[badgeId].active = active;
        emit BadgeStatusUpdated(badgeId, active);
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        baseURI = newBaseURI;
        _setURI(newBaseURI);
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal override {
        if (from != address(0) && to != address(0)) revert Soulbound();
        super._update(from, to, ids, values);
    }

    function setApprovalForAll(address, bool) public pure override {
        revert Soulbound();
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(baseURI, tokenId.toString(), ".json"));
    }

    function getBadge(uint256 badgeId) external view returns (Badge memory) {
        return badges[badgeId];
    }

    function getPlayerBadges(address player) external view returns (uint256[] memory) {
        return playerBadges[player];
    }

    function getBadgeCount(address player) external view returns (uint256) {
        return playerBadges[player].length;
    }

    function getTierName(uint8 tier) public pure returns (string memory) {
        if (tier < 1 || tier > 5) revert InvalidTier();
        string[5] memory names = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
        return names[tier - 1];
    }

    function getTierColor(uint8 tier) public pure returns (string memory) {
        if (tier < 1 || tier > 5) revert InvalidTier();
        string[5] memory colors = ["#CD7F32", "#C0C0C0", "#FFD700", "#E5E4E2", "#B9F2FF"];
        return colors[tier - 1];
    }

    function getBadgesByCategory(string calldata category) external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](nextBadgeId);
        uint256 count = 0;
        bytes32 needle = keccak256(bytes(category));
        for (uint256 i = 1; i < nextBadgeId; ) {
            if (keccak256(bytes(badges[i].category)) == needle) {
                result[count] = i;
                unchecked {
                    ++count;
                }
            }
            unchecked {
                ++i;
            }
        }
        uint256[] memory trimmed = new uint256[](count);
        for (uint256 i = 0; i < count; ) {
            trimmed[i] = result[i];
            unchecked {
                ++i;
            }
        }
        return trimmed;
    }
}
