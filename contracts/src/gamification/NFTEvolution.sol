// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {OperatorOwnable} from "./OperatorOwnable.sol";

/**
 * @title NFTEvolution
 * @notice Evolving ERC-721s that gain XP, levels, and visual stages from play.
 */
contract NFTEvolution is ERC721, OperatorOwnable {
    using Strings for uint256;

    struct Evolution {
        uint256 tokenType;
        uint256 stage;
        uint256 xp;
        uint256 level;
        uint256 maxLevel;
        uint256 power;
        uint256 speed;
        uint256 interactions;
        uint256 lastInteract;
        string name;
        string description;
    }

    struct EvolutionStage {
        uint256 stage;
        string name;
        string description;
        uint256 requiredXP;
        uint256 powerMultiplier;
        uint256 speedMultiplier;
        string imageURI;
        bool active;
    }

    mapping(uint256 => Evolution) public nftEvolution;
    mapping(uint256 => EvolutionStage[]) public stageConfigs;

    uint256 public nextTokenId = 1;
    uint256 public maxStages = 5;
    string public baseURI;

    event NFTEvolved(uint256 indexed tokenId, uint256 newStage);
    event NFTLeveledUp(uint256 indexed tokenId, uint256 newLevel);
    event NFTInteracted(uint256 indexed tokenId, address indexed interactor);

    constructor(string memory _name, string memory _symbol, string memory _baseURI)
        ERC721(_name, _symbol)
        OperatorOwnable(msg.sender)
    {
        baseURI = _baseURI;
    }

    function addStage(
        uint256 tokenType,
        uint256 stage,
        string memory name,
        string memory description,
        uint256 requiredXP,
        uint256 powerMultiplier,
        uint256 speedMultiplier,
        string memory imageURI
    ) external onlyOwner {
        require(stage <= maxStages, "Stage exceeds max");
        require(powerMultiplier > 0 && speedMultiplier > 0, "Multipliers required");
        stageConfigs[tokenType].push(
            EvolutionStage({
                stage: stage,
                name: name,
                description: description,
                requiredXP: requiredXP,
                powerMultiplier: powerMultiplier,
                speedMultiplier: speedMultiplier,
                imageURI: imageURI,
                active: true
            })
        );
    }

    function mint(address to, uint256 tokenType) external onlyOperator returns (uint256) {
        require(to != address(0), "Zero address");
        uint256 tokenId = nextTokenId++;
        _safeMint(to, tokenId);

        nftEvolution[tokenId] = Evolution({
            tokenType: tokenType,
            stage: 0,
            xp: 0,
            level: 1,
            maxLevel: 10,
            power: 10,
            speed: 5,
            interactions: 0,
            lastInteract: block.timestamp,
            name: string(abi.encodePacked("Friendzone #", tokenId.toString())),
            description: "A Friendzone NFT"
        });

        return tokenId;
    }

    function interact(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        Evolution storage evo = nftEvolution[tokenId];
        require(evo.level <= evo.maxLevel, "Maxed");

        evo.interactions++;
        evo.lastInteract = block.timestamp;
        evo.xp += 10;

        if (evo.level < evo.maxLevel && evo.xp >= evo.level * 100) {
            evo.level++;
            evo.power += 5;
            evo.speed += 2;
            emit NFTLeveledUp(tokenId, evo.level);
        }

        _checkEvolution(tokenId);
        emit NFTInteracted(tokenId, msg.sender);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        Evolution storage evo = nftEvolution[tokenId];
        return string(abi.encodePacked(baseURI, tokenId.toString(), "/", evo.stage.toString(), ".json"));
    }

    function getEvolution(uint256 tokenId) external view returns (Evolution memory) {
        _requireOwned(tokenId);
        return nftEvolution[tokenId];
    }

    function getStage(uint256 tokenType, uint256 index) external view returns (EvolutionStage memory) {
        require(index < stageConfigs[tokenType].length, "Stage not found");
        return stageConfigs[tokenType][index];
    }

    function getPowerBonus(uint256 tokenId) external view returns (uint256) {
        return nftEvolution[tokenId].power;
    }

    function getSpeedBonus(uint256 tokenId) external view returns (uint256) {
        return nftEvolution[tokenId].speed;
    }

    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
    }

    function _checkEvolution(uint256 tokenId) private {
        Evolution storage evo = nftEvolution[tokenId];
        EvolutionStage[] storage stages = stageConfigs[evo.tokenType];
        if (stages.length == 0) return;

        for (uint256 i = stages.length; i > 0; ) {
            unchecked {
                --i;
            }
            EvolutionStage storage stage = stages[i];
            if (stage.active && evo.xp >= stage.requiredXP && evo.stage < stage.stage) {
                evo.stage = stage.stage;
                evo.power = (evo.power * stage.powerMultiplier) / 100;
                evo.speed = (evo.speed * stage.speedMultiplier) / 100;
                evo.name = stage.name;
                evo.description = stage.description;
                emit NFTEvolved(tokenId, evo.stage);
                break;
            }
        }
    }
}
