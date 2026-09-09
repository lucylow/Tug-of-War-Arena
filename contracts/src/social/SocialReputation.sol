// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {OperatorOwnable} from "../gamification/OperatorOwnable.sol";
import {MathUtils} from "../utils/MathUtils.sol";
import {ISocialReputation} from "../interfaces/ISocialReputation.sol";

/**
 * @title SocialReputation
 * @notice On-chain reputation, trust, and social graph for the Friendzone ecosystem.
 *
 * Reputation is earned through positive interactions (tips, endorsements, referrals)
 * and community participation. It decays after long inactivity and can be reduced by
 * operator-recorded reports.
 */
contract SocialReputation is OperatorOwnable, ISocialReputation {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Interaction {
        uint256 id;
        address from;
        address to;
        string action;
        uint256 amount;
        uint256 timestamp;
        bool positive;
        string data;
    }

    mapping(address => Reputation) public reputations;
    mapping(address => EnumerableSet.AddressSet) private _followers;
    mapping(address => EnumerableSet.AddressSet) private _following;
    mapping(address => uint256[]) public userInteractions;
    mapping(uint256 => Interaction) public interactions;
    mapping(string => int256) public actionWeights;

    EnumerableSet.AddressSet private _knownUsers;

    uint256 public nextInteractionId;
    uint256 public minReputationForVerified = 1000;
    uint256 public reputationDecayRate = 1;

    event ReputationUpdated(address indexed user, uint256 newScore, uint256 trustLevel);
    event InteractionRecorded(uint256 indexed interactionId, address indexed from, address indexed to, string action);
    event Followed(address indexed follower, address indexed target);
    event Unfollowed(address indexed follower, address indexed target);
    event Verified(address indexed user);
    event MetadataUpdated(address indexed user, string metadata);
    event ActionWeightUpdated(string action, int256 weight);

    error CannotFollowSelf();
    error AlreadyFollowing();
    error NotFollowing();
    error InsufficientReputation();
    error InvalidUser();

    constructor(address initialOwner) OperatorOwnable(initialOwner) {
        actionWeights["tip"] = 10;
        actionWeights["endorse"] = 15;
        actionWeights["referral"] = 20;
        actionWeights["helpful"] = 5;
        actionWeights["report"] = 25;
        actionWeights["spam"] = 10;
        actionWeights["follow"] = 2;
        actionWeights["comment"] = 1;
        actionWeights["quest_complete"] = 5;
        actionWeights["event_participation"] = 3;
    }

    function updateReputation(
        address user,
        string calldata action,
        bool positive,
        uint256 amount
    ) external onlyOperator returns (uint256) {
        return _applyReputation(user, action, positive, amount);
    }

    function applyDecay(address user) external {
        Reputation storage rep = reputations[user];
        if (rep.lastActive == 0 || rep.score == 0) return;

        uint256 daysInactive = (block.timestamp - rep.lastActive) / 1 days;
        if (daysInactive > 30) {
            uint256 decay = daysInactive * reputationDecayRate;
            rep.score = rep.score > decay ? rep.score - decay : 0;
            rep.lastActive = block.timestamp;
            emit ReputationUpdated(user, rep.score, rep.trustLevel);
        }
    }

    function follow(address target) external {
        if (target == address(0)) revert InvalidUser();
        if (target == msg.sender) revert CannotFollowSelf();
        if (_followers[target].contains(msg.sender)) revert AlreadyFollowing();

        _followers[target].add(msg.sender);
        _following[msg.sender].add(target);

        reputations[target].followers++;
        reputations[msg.sender].following++;

        _recordInteraction(msg.sender, target, "follow", 0, true, "");
        emit Followed(msg.sender, target);
    }

    function unfollow(address target) external {
        if (!_followers[target].contains(msg.sender)) revert NotFollowing();

        _followers[target].remove(msg.sender);
        _following[msg.sender].remove(target);

        reputations[target].followers--;
        reputations[msg.sender].following--;

        emit Unfollowed(msg.sender, target);
    }

    function recordInteraction(
        address to,
        string calldata action,
        uint256 amount,
        bool positive,
        string calldata data
    ) external onlyOperator {
        _recordInteraction(msg.sender, to, action, amount, positive, data);
    }

    function recordInteractionFor(
        address from,
        address to,
        string calldata action,
        uint256 amount,
        bool positive,
        string calldata data
    ) external onlyOperator {
        _recordInteraction(from, to, action, amount, positive, data);
    }

    function verifyUser(address user) external onlyOwner {
        if (reputations[user].score < minReputationForVerified) revert InsufficientReputation();
        reputations[user].isVerified = true;
        emit Verified(user);
    }

    function setMetadata(string calldata metadata) external {
        reputations[msg.sender].metadata = metadata;
        reputations[msg.sender].lastActive = block.timestamp;
        _knownUsers.add(msg.sender);
        emit MetadataUpdated(msg.sender, metadata);
    }

    function getReputation(address user) external view returns (Reputation memory) {
        return reputations[user];
    }

    function getFollowers(address user) external view returns (address[] memory) {
        return _followers[user].values();
    }

    function getFollowing(address user) external view returns (address[] memory) {
        return _following[user].values();
    }

    function getInteraction(uint256 id) external view returns (Interaction memory) {
        return interactions[id];
    }

    function getUserInteractions(address user) external view returns (uint256[] memory) {
        return userInteractions[user];
    }

    function getTrustLevel(address user) external view returns (uint256) {
        return reputations[user].trustLevel;
    }

    function isFollowing(address follower, address target) external view returns (bool) {
        return _followers[target].contains(follower);
    }

    function getTopReputation(uint256 count) external view returns (address[] memory, uint256[] memory) {
        uint256 total = _knownUsers.length();
        uint256 maxCount = count > total ? total : count;
        address[] memory users = _knownUsers.values();

        for (uint256 i = 0; i < total; ) {
            for (uint256 j = i + 1; j < total; ) {
                if (reputations[users[j]].score > reputations[users[i]].score) {
                    (users[i], users[j]) = (users[j], users[i]);
                }
                unchecked {
                    ++j;
                }
            }
            unchecked {
                ++i;
            }
        }

        address[] memory topUsers = new address[](maxCount);
        uint256[] memory scores = new uint256[](maxCount);
        for (uint256 i = 0; i < maxCount; ) {
            topUsers[i] = users[i];
            scores[i] = reputations[users[i]].score;
            unchecked {
                ++i;
            }
        }
        return (topUsers, scores);
    }

    function setActionWeight(string calldata action, int256 weight) external onlyOwner {
        require(weight >= 0, "Weight must be >= 0");
        actionWeights[action] = weight;
        emit ActionWeightUpdated(action, weight);
    }

    function setMinReputationForVerified(uint256 minScore) external onlyOwner {
        minReputationForVerified = minScore;
    }

    function setReputationDecayRate(uint256 rate) external onlyOwner {
        reputationDecayRate = rate;
    }

    function _recordInteraction(
        address from,
        address to,
        string memory action,
        uint256 amount,
        bool positive,
        string memory data
    ) private {
        uint256 id = nextInteractionId++;
        interactions[id] = Interaction({
            id: id,
            from: from,
            to: to,
            action: action,
            amount: amount,
            timestamp: block.timestamp,
            positive: positive,
            data: data
        });

        userInteractions[from].push(id);
        if (to != address(0) && to != from) {
            userInteractions[to].push(id);
        }

        _applyReputation(to, action, positive, amount);
        emit InteractionRecorded(id, from, to, action);
    }

    function _applyReputation(
        address user,
        string memory action,
        bool positive,
        uint256 amount
    ) private returns (uint256) {
        if (user == address(0)) revert InvalidUser();

        Reputation storage rep = reputations[user];
        int256 weight = actionWeights[action];
        if (amount > 0 && amount < 1e12) {
            weight = int256(amount);
        } else if (weight == 0) {
            weight = 1;
        }
        if (!positive) weight = -weight;

        if (weight > 0) {
            rep.score += uint256(weight);
            rep.positiveFeedback++;
        } else {
            uint256 absWeight = uint256(-weight);
            rep.score = rep.score > absWeight ? rep.score - absWeight : 0;
            rep.negativeFeedback++;
        }

        rep.interactions++;
        rep.lastActive = block.timestamp;
        rep.trustLevel = _calculateTrustLevel(rep);
        _knownUsers.add(user);

        emit ReputationUpdated(user, rep.score, rep.trustLevel);
        return rep.score;
    }

    function _calculateTrustLevel(Reputation storage rep) private view returns (uint256) {
        if (rep.interactions == 0) return 50;

        uint256 totalFeedback = rep.positiveFeedback + rep.negativeFeedback;
        if (totalFeedback == 0) return 50;

        uint256 positiveRatio = (rep.positiveFeedback * 100) / totalFeedback;
        uint256 interactionBonus = rep.interactions > 100 ? 10 : (rep.interactions / 10);
        return MathUtils.min(100, positiveRatio + interactionBonus);
    }
}
