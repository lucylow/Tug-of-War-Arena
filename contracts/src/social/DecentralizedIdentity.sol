// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {OperatorOwnable} from "../gamification/OperatorOwnable.sol";

/**
 * @title DecentralizedIdentity
 * @notice Profiles plus soulbound ERC-1155 achievement badges.
 * @dev Transfers and operator approvals revert. Badge ids start at 0;
 *      award through the operator role so quests can mint.
 */
contract DecentralizedIdentity is ERC1155, OperatorOwnable {
    using Strings for uint256;

    struct Profile {
        string name;
        string bio;
        string avatar;
        uint256 reputation;
        uint256 createdAt;
        uint256 lastUpdated;
        bool verified;
        string[] socialLinks;
    }

    struct Achievement {
        uint256 id;
        string name;
        string description;
        uint8 tier;
        string category;
        uint256 maxSupply;
        uint256 minted;
        bool active;
        bool soulbound;
    }

    mapping(address => Profile) private profiles;
    mapping(uint256 => Achievement) public achievements;
    mapping(uint256 => mapping(address => bool)) public hasAchievement;
    mapping(address => uint256[]) public userAchievements;

    uint256 public nextAchievementId = 1;
    string public baseURI;

    event ProfileUpdated(address indexed user, string name);
    event AchievementCreated(uint256 indexed id, string name, uint8 tier);
    event AchievementAwarded(uint256 indexed id, address indexed to);
    event UserVerified(address indexed user, bool verified);

    error NameRequired();
    error InvalidTier();
    error AchievementInactive();
    error MaxSupplyReached();
    error AlreadyHasAchievement();
    error Soulbound();

    constructor(string memory baseURI_, address initialOwner) ERC1155(baseURI_) OperatorOwnable(initialOwner) {
        baseURI = baseURI_;
    }

    function updateProfile(
        string calldata name,
        string calldata bio,
        string calldata avatar,
        string[] calldata socialLinks
    ) external {
        if (bytes(name).length == 0) revert NameRequired();

        Profile storage profile = profiles[msg.sender];
        profile.name = name;
        profile.bio = bio;
        profile.avatar = avatar;
        profile.socialLinks = socialLinks;
        profile.lastUpdated = block.timestamp;
        if (profile.createdAt == 0) {
            profile.createdAt = block.timestamp;
        }

        emit ProfileUpdated(msg.sender, name);
    }

    function getProfile(address user) external view returns (Profile memory) {
        return profiles[user];
    }

    function createAchievement(
        string calldata name,
        string calldata description,
        uint8 tier,
        string calldata category,
        uint256 maxSupply,
        bool soulbound
    ) external onlyOwner returns (uint256 id) {
        if (bytes(name).length == 0) revert NameRequired();
        if (tier < 1 || tier > 5) revert InvalidTier();

        id = nextAchievementId++;
        achievements[id] = Achievement({
            id: id,
            name: name,
            description: description,
            tier: tier,
            category: category,
            maxSupply: maxSupply,
            minted: 0,
            active: true,
            soulbound: soulbound
        });

        emit AchievementCreated(id, name, tier);
    }

    function awardAchievement(address to, uint256 achievementId) external onlyOperator {
        _award(to, achievementId);
    }

    /// @notice ISoulboundBadges-compatible alias so QuestProtocol can mint.
    function awardBadge(address to, uint256 badgeId) external onlyOperator {
        _award(to, badgeId);
    }

    function _award(address to, uint256 achievementId) private {
        Achievement storage ach = achievements[achievementId];
        if (!ach.active) revert AchievementInactive();
        if (ach.minted >= ach.maxSupply) revert MaxSupplyReached();
        if (hasAchievement[achievementId][to]) revert AlreadyHasAchievement();

        ach.minted += 1;
        hasAchievement[achievementId][to] = true;
        userAchievements[to].push(achievementId);
        profiles[to].reputation += uint256(ach.tier) * 10;
        _mint(to, achievementId, 1, "");
        emit AchievementAwarded(achievementId, to);
    }

    function setVerified(address user, bool verified) external onlyOwner {
        profiles[user].verified = verified;
        emit UserVerified(user, verified);
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        baseURI = newBaseURI;
        _setURI(newBaseURI);
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal override {
        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < ids.length; ) {
                if (achievements[ids[i]].soulbound) revert Soulbound();
                unchecked {
                    ++i;
                }
            }
        }
        super._update(from, to, ids, values);
    }

    function setApprovalForAll(address, bool) public pure override {
        revert Soulbound();
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(baseURI, tokenId.toString(), ".json"));
    }

    function getAchievement(uint256 achievementId) external view returns (Achievement memory) {
        return achievements[achievementId];
    }

    function getUserAchievements(address user) external view returns (uint256[] memory) {
        return userAchievements[user];
    }

    function hasAchievement_(uint256 achievementId, address user) external view returns (bool) {
        return hasAchievement[achievementId][user];
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
}
