// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title AutomationCompatibleInterface
 * @notice Local Chainlink Automation surface so the suite does not depend on @chainlink/contracts.
 */
interface AutomationCompatibleInterface {
    function checkUpkeep(bytes calldata checkData) external view returns (bool upkeepNeeded, bytes memory performData);
    function performUpkeep(bytes calldata performData) external;
}

/**
 * @title FriendzoneDynamic
 * @notice Evolving ERC-721 whose stage, power, and URI change with interaction and keepers.
 */
contract FriendzoneDynamic is ERC721, Ownable, AutomationCompatibleInterface {
    using Strings for uint256;

    struct NFTState {
        uint256 stage;
        uint256 lastUpdate;
        uint256 interactions;
        uint256 power;
        uint256 level;
        uint256 experience;
    }

    mapping(uint256 => NFTState) public nftStates;
    mapping(uint256 => string) public stageURIs;

    uint256 public nextTokenId;
    uint256 public updateInterval = 7 days;
    uint256 public maxStages = 5;
    string public baseTokenURI;

    event NFTUpdated(uint256 indexed tokenId, uint256 newStage);
    event NFTLeveledUp(uint256 indexed tokenId, uint256 newLevel);

    error NotTokenOwner();
    error UnknownToken();
    error UpkeepNotNeeded();

    constructor(string memory name_, string memory symbol_, string memory baseURI_, address initialOwner)
        ERC721(name_, symbol_)
        Ownable(initialOwner)
    {
        baseTokenURI = baseURI_;
    }

    function mint(address to) external onlyOwner returns (uint256 tokenId) {
        tokenId = nextTokenId;
        unchecked {
            ++nextTokenId;
        }
        _safeMint(to, tokenId);
        nftStates[tokenId] = NFTState({
            stage: 0,
            lastUpdate: block.timestamp,
            interactions: 0,
            power: 10,
            level: 1,
            experience: 0
        });
    }

    function interact(uint256 tokenId) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        NFTState storage state = nftStates[tokenId];
        unchecked {
            ++state.interactions;
            state.power += 1;
            state.experience += 10;
        }

        if (state.experience >= state.level * 100) {
            unchecked {
                ++state.level;
                state.power += 5;
            }
            emit NFTLeveledUp(tokenId, state.level);
        }

        _checkStageUpdate(tokenId);
    }

    function setStageURI(uint256 stage, string calldata uri) external onlyOwner {
        stageURIs[stage] = uri;
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
    }

    function setUpdateInterval(uint256 interval) external onlyOwner {
        updateInterval = interval;
    }

    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        uint256 total = nextTokenId;
        for (uint256 i = 0; i < total; ) {
            if (block.timestamp - nftStates[i].lastUpdate >= updateInterval) {
                return (true, abi.encode(i));
            }
            unchecked {
                ++i;
            }
        }
    }

    function performUpkeep(bytes calldata performData) external override {
        uint256 tokenId = abi.decode(performData, (uint256));
        if (_ownerOf(tokenId) == address(0)) revert UnknownToken();
        NFTState storage state = nftStates[tokenId];
        if (block.timestamp - state.lastUpdate < updateInterval) revert UpkeepNotNeeded();

        state.lastUpdate = block.timestamp;
        unchecked {
            state.power += 5;
        }
        _checkStageUpdate(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        uint256 stage = nftStates[tokenId].stage;
        return string.concat(baseTokenURI, tokenId.toString(), "/", stageURIs[stage]);
    }

    function _checkStageUpdate(uint256 tokenId) private {
        NFTState storage state = nftStates[tokenId];
        uint256 newStage = 0;
        if (state.level >= 10) newStage = 4;
        else if (state.level >= 7) newStage = 3;
        else if (state.level >= 4) newStage = 2;
        else if (state.level >= 2) newStage = 1;

        if (newStage > maxStages - 1) newStage = maxStages - 1;
        if (newStage != state.stage) {
            state.stage = newStage;
            emit NFTUpdated(tokenId, newStage);
        }
    }
}
