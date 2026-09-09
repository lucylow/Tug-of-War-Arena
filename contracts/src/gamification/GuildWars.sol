// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {OperatorOwnable} from "./OperatorOwnable.sol";

/**
 * @title GuildWars
 * @notice Competitive guilds with member lists, reputation, and timed wars.
 */
contract GuildWars is OperatorOwnable {
    struct Guild {
        uint256 id;
        string name;
        string tag;
        address leader;
        uint256 reputation;
        uint256 power;
        uint256 memberCount;
        uint256 warsWon;
        uint256 warsLost;
        uint256 createdAt;
    }

    struct War {
        uint256 id;
        uint256 guildAId;
        uint256 guildBId;
        uint256 startedAt;
        uint256 endedAt;
        uint256 guildAScore;
        uint256 guildBScore;
        uint256 winnerId;
        uint256 prizePool;
        bool resolved;
        bool active;
    }

    mapping(uint256 => Guild) public guilds;
    mapping(uint256 => War) public wars;
    mapping(address => uint256) public playerGuild;
    mapping(uint256 => mapping(address => bool)) public isMember;
    mapping(uint256 => mapping(address => uint256)) public memberReputation;
    mapping(uint256 => address[]) private guildMembers;

    uint256 public nextGuildId = 1;
    uint256 public nextWarId = 1;
    uint256 public warDuration = 7 days;
    uint256 public minGuildSize = 3;
    uint256 public maxGuildSize = 100;

    event GuildCreated(uint256 indexed id, string name, address leader);
    event GuildJoined(uint256 indexed id, address member);
    event GuildLeft(uint256 indexed id, address member);
    event WarStarted(uint256 indexed id, uint256 guildA, uint256 guildB);
    event WarEnded(uint256 indexed id, uint256 winner);
    event ReputationAdded(uint256 indexed guildId, address member, uint256 amount);

    constructor() OperatorOwnable(msg.sender) {}

    function createGuild(string memory name, string memory tag) external returns (uint256) {
        require(bytes(name).length > 0, "Name required");
        require(bytes(tag).length > 0 && bytes(tag).length <= 5, "Invalid tag");
        require(playerGuild[msg.sender] == 0, "Already in guild");

        uint256 id = nextGuildId++;
        Guild storage guild = guilds[id];
        guild.id = id;
        guild.name = name;
        guild.tag = tag;
        guild.leader = msg.sender;
        guild.createdAt = block.timestamp;
        guild.memberCount = 1;

        isMember[id][msg.sender] = true;
        guildMembers[id].push(msg.sender);
        playerGuild[msg.sender] = id;

        emit GuildCreated(id, name, msg.sender);
        return id;
    }

    function joinGuild(uint256 guildId) external {
        require(playerGuild[msg.sender] == 0, "Already in guild");
        Guild storage guild = guilds[guildId];
        require(guild.id == guildId, "Unknown guild");
        require(guild.memberCount < maxGuildSize, "Guild full");

        isMember[guildId][msg.sender] = true;
        guild.memberCount++;
        playerGuild[msg.sender] = guildId;
        guildMembers[guildId].push(msg.sender);

        emit GuildJoined(guildId, msg.sender);
    }

    function leaveGuild(uint256 guildId) external {
        Guild storage guild = guilds[guildId];
        require(isMember[guildId][msg.sender], "Not member");
        require(guild.leader != msg.sender, "Leader cannot leave");

        isMember[guildId][msg.sender] = false;
        guild.memberCount--;
        playerGuild[msg.sender] = 0;
        _removeMember(guildId, msg.sender);

        emit GuildLeft(guildId, msg.sender);
    }

    function addReputation(uint256 guildId, address member, uint256 amount) external onlyOperator {
        require(isMember[guildId][member], "Not member");
        require(amount > 0, "No amount");
        memberReputation[guildId][member] += amount;
        guilds[guildId].reputation += amount;
        emit ReputationAdded(guildId, member, amount);
    }

    function declareWar(uint256 guildAId, uint256 guildBId) external returns (uint256) {
        require(guildAId != guildBId, "Same guild");
        Guild storage guildA = guilds[guildAId];
        Guild storage guildB = guilds[guildBId];
        require(guildA.leader == msg.sender, "Not leader");
        require(guildA.memberCount >= minGuildSize, "Guild too small");
        require(guildB.memberCount >= minGuildSize, "Opponent too small");

        uint256 warId = nextWarId++;
        wars[warId] = War({
            id: warId,
            guildAId: guildAId,
            guildBId: guildBId,
            startedAt: block.timestamp,
            endedAt: 0,
            guildAScore: 0,
            guildBScore: 0,
            winnerId: 0,
            prizePool: 0,
            resolved: false,
            active: true
        });

        emit WarStarted(warId, guildAId, guildBId);
        return warId;
    }

    function recordWarScore(uint256 warId, uint256 guildId, uint256 score) external onlyOperator {
        War storage war = wars[warId];
        require(war.active, "War not active");
        require(war.guildAId == guildId || war.guildBId == guildId, "Invalid guild");

        if (war.guildAId == guildId) {
            war.guildAScore += score;
        } else {
            war.guildBScore += score;
        }
    }

    function endWar(uint256 warId) external onlyOperator {
        War storage war = wars[warId];
        require(war.active, "War not active");
        require(block.timestamp >= war.startedAt + warDuration || msg.sender == owner(), "War still running");

        war.active = false;
        war.endedAt = block.timestamp;
        war.resolved = true;

        if (war.guildAScore > war.guildBScore) {
            war.winnerId = war.guildAId;
            guilds[war.guildAId].warsWon++;
            guilds[war.guildBId].warsLost++;
        } else if (war.guildBScore > war.guildAScore) {
            war.winnerId = war.guildBId;
            guilds[war.guildBId].warsWon++;
            guilds[war.guildAId].warsLost++;
        }

        emit WarEnded(warId, war.winnerId);
    }

    function getGuild(uint256 guildId)
        external
        view
        returns (uint256, string memory, string memory, address, uint256, uint256, uint256)
    {
        Guild storage guild = guilds[guildId];
        return (guild.id, guild.name, guild.tag, guild.leader, guild.reputation, guild.memberCount, guild.createdAt);
    }

    function getGuildMembers(uint256 guildId) external view returns (address[] memory) {
        return guildMembers[guildId];
    }

    function getPlayerGuild(address player) external view returns (uint256) {
        return playerGuild[player];
    }

    function _removeMember(uint256 guildId, address member) private {
        address[] storage members = guildMembers[guildId];
        for (uint256 i = 0; i < members.length; ) {
            if (members[i] == member) {
                members[i] = members[members.length - 1];
                members.pop();
                break;
            }
            unchecked {
                ++i;
            }
        }
    }
}
