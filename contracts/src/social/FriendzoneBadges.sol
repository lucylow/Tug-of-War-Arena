// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title FriendzoneBadges
 * @notice ERC-1155 achievement badges for streaks, missions, and social milestones.
 */
contract FriendzoneBadges is ERC1155, Ownable {
    using Strings for uint256;

    mapping(uint256 => string) public badgeNames;
    mapping(uint256 => uint256) public maxSupply;
    mapping(uint256 => uint256) public minted;
    mapping(address => bool) public minters;
    uint256 public nextBadgeId;
    string public baseTokenURI;

    event BadgeCreated(uint256 indexed id, string name, uint256 supply);
    event BadgeAwarded(uint256 indexed id, address indexed to, uint256 amount);
    event MinterUpdated(address indexed account, bool allowed);

    error NotMinter();
    error UnknownBadge();
    error SupplyExceeded();

    modifier onlyMinter() {
        if (!minters[msg.sender] && msg.sender != owner()) revert NotMinter();
        _;
    }

    constructor(string memory baseURI_, address initialOwner) ERC1155(baseURI_) Ownable(initialOwner) {
        baseTokenURI = baseURI_;
        minters[initialOwner] = true;
    }

    function setMinter(address account, bool allowed) external onlyOwner {
        minters[account] = allowed;
        emit MinterUpdated(account, allowed);
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
        _setURI(newBaseURI);
    }

    function createBadge(string calldata name, uint256 supply) external onlyOwner returns (uint256 id) {
        id = nextBadgeId;
        unchecked {
            ++nextBadgeId;
        }
        badgeNames[id] = name;
        maxSupply[id] = supply;
        emit BadgeCreated(id, name, supply);
    }

    function awardBadge(address to, uint256 id, uint256 amount) external onlyMinter {
        if (id >= nextBadgeId) revert UnknownBadge();
        if (minted[id] + amount > maxSupply[id]) revert SupplyExceeded();
        minted[id] += amount;
        _mint(to, id, amount, "");
        emit BadgeAwarded(id, to, amount);
    }

    function uri(uint256 id) public view override returns (string memory) {
        return string.concat(baseTokenURI, id.toString(), ".json");
    }
}
