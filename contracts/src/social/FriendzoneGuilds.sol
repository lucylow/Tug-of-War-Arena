// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FriendzoneGuilds
 * @notice Crew guilds with leader-managed reputation. Guild ids start at 1 so
 *         `playerGuild[user] == 0` always means "not in a guild".
 */
contract FriendzoneGuilds is Ownable {
    uint256 public constant MAX_MEMBERS = 100;

    struct GuildView {
        uint256 id;
        string name;
        address leader;
        uint256 reputation;
        uint256 memberCount;
        uint256 createdAt;
    }

    struct Guild {
        uint256 id;
        string name;
        address leader;
        uint256 reputation;
        uint256 memberCount;
        uint256 createdAt;
        mapping(address => bool) isMember;
        mapping(address => uint256) memberReputation;
    }

    mapping(uint256 => Guild) private _guilds;
    mapping(address => uint256) public playerGuild;
    uint256 private _nextGuildId = 1;

    event GuildCreated(uint256 indexed id, string name, address indexed leader);
    event MemberJoined(uint256 indexed id, address indexed member);
    event MemberLeft(uint256 indexed id, address indexed member);
    event LeadershipTransferred(uint256 indexed id, address indexed previousLeader, address indexed newLeader);
    event ReputationAdded(uint256 indexed id, address indexed member, uint256 amount);

    error NameRequired();
    error AlreadyInGuild();
    error NotInGuild();
    error GuildFull();
    error UnknownGuild();
    error OnlyLeader();
    error NotMember();
    error CannotLeaveAsLeader();

    constructor(address initialOwner) Ownable(initialOwner) {}

    function createGuild(string calldata name) external returns (uint256 id) {
        if (bytes(name).length == 0) revert NameRequired();
        if (playerGuild[msg.sender] != 0) revert AlreadyInGuild();

        id = _nextGuildId;
        unchecked {
            ++_nextGuildId;
        }

        Guild storage guild = _guilds[id];
        guild.id = id;
        guild.name = name;
        guild.leader = msg.sender;
        guild.createdAt = block.timestamp;
        guild.isMember[msg.sender] = true;
        guild.memberCount = 1;
        playerGuild[msg.sender] = id;

        emit GuildCreated(id, name, msg.sender);
    }

    function joinGuild(uint256 guildId) external {
        Guild storage guild = _requireGuild(guildId);
        if (playerGuild[msg.sender] != 0) revert AlreadyInGuild();
        if (guild.memberCount >= MAX_MEMBERS) revert GuildFull();

        guild.isMember[msg.sender] = true;
        unchecked {
            ++guild.memberCount;
        }
        playerGuild[msg.sender] = guildId;
        emit MemberJoined(guildId, msg.sender);
    }

    function leaveGuild() external {
        uint256 guildId = playerGuild[msg.sender];
        if (guildId == 0) revert NotInGuild();
        Guild storage guild = _guilds[guildId];
        if (guild.leader == msg.sender && guild.memberCount > 1) revert CannotLeaveAsLeader();

        guild.isMember[msg.sender] = false;
        unchecked {
            --guild.memberCount;
        }
        playerGuild[msg.sender] = 0;
        emit MemberLeft(guildId, msg.sender);
    }

    function transferLeadership(address newLeader) external {
        uint256 guildId = playerGuild[msg.sender];
        if (guildId == 0) revert NotInGuild();
        Guild storage guild = _guilds[guildId];
        if (guild.leader != msg.sender) revert OnlyLeader();
        if (!guild.isMember[newLeader]) revert NotMember();
        address previous = guild.leader;
        guild.leader = newLeader;
        emit LeadershipTransferred(guildId, previous, newLeader);
    }

    function addReputation(uint256 guildId, address member, uint256 amount) external {
        Guild storage guild = _requireGuild(guildId);
        if (guild.leader != msg.sender && msg.sender != owner()) revert OnlyLeader();
        if (!guild.isMember[member]) revert NotMember();
        guild.memberReputation[member] += amount;
        guild.reputation += amount;
        emit ReputationAdded(guildId, member, amount);
    }

    function getGuild(uint256 guildId) external view returns (GuildView memory view_) {
        Guild storage guild = _requireGuild(guildId);
        view_ = GuildView({
            id: guild.id,
            name: guild.name,
            leader: guild.leader,
            reputation: guild.reputation,
            memberCount: guild.memberCount,
            createdAt: guild.createdAt
        });
    }

    function isMember(uint256 guildId, address account) external view returns (bool) {
        return _guilds[guildId].isMember[account];
    }

    function memberReputation(uint256 guildId, address account) external view returns (uint256) {
        return _guilds[guildId].memberReputation[account];
    }

    function nextGuildId() external view returns (uint256) {
        return _nextGuildId;
    }

    function _requireGuild(uint256 guildId) private view returns (Guild storage guild) {
        guild = _guilds[guildId];
        if (guild.id == 0) revert UnknownGuild();
    }
}
