// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";
import {MathUtils} from "../utils/MathUtils.sol";

/**
 * @title GamifiedDAO
 * @notice Vote-to-earn governance: voters buy weight, losing-side spend funds
 *         the winning side, minus a platform fee.
 */
contract GamifiedDAO is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum ProposalStatus {
        Active,
        Passed,
        Failed,
        Executed
    }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        ProposalStatus status;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 totalVotes;
        uint256 votePrice;
        uint256 rewardPool;
        uint256 startTime;
        uint256 endTime;
        uint256 executedAt;
        bool resolved;
    }

    struct Vote {
        address voter;
        bool support;
        uint256 weight;
        uint256 cost;
        uint256 timestamp;
        bool claimed;
        uint256 reward;
    }

    IERC20 public immutable voteToken;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public votes;
    mapping(uint256 => address[]) public proposalVoters;
    mapping(address => uint256) public pendingRewards;

    uint256 public nextProposalId;
    uint256 public baseVotePrice = 1e18;
    uint256 public votingPeriod = 7 days;
    uint256 public platformFee = 100;

    event ProposalCreated(uint256 indexed id, address indexed proposer, string title);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalResolved(uint256 indexed proposalId, bool passed);
    event RewardClaimed(address indexed voter, uint256 indexed proposalId, uint256 amount);
    event RewardsWithdrawn(address indexed voter, uint256 amount);

    error TitleRequired();
    error ProposalNotActive();
    error VotingEnded();
    error VotingNotEnded();
    error AlreadyVoted();
    error InvalidWeight();
    error AlreadyResolved();
    error ProposalNotResolved();
    error NoVote();
    error AlreadyClaimed();
    error NoRewards();
    error FeeTooHigh();

    constructor(address voteToken_, address initialOwner) Ownable(initialOwner) {
        require(voteToken_ != address(0), "Zero address");
        voteToken = IERC20(voteToken_);
    }

    function createProposal(string calldata title, string calldata description) external returns (uint256 id) {
        if (bytes(title).length == 0) revert TitleRequired();

        id = nextProposalId++;
        proposals[id] = Proposal({
            id: id,
            proposer: msg.sender,
            title: title,
            description: description,
            status: ProposalStatus.Active,
            forVotes: 0,
            againstVotes: 0,
            totalVotes: 0,
            votePrice: baseVotePrice,
            rewardPool: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + votingPeriod,
            executedAt: 0,
            resolved: false
        });

        emit ProposalCreated(id, msg.sender, title);
    }

    function vote(uint256 proposalId, bool support, uint256 voteWeight) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.status != ProposalStatus.Active) revert ProposalNotActive();
        if (block.timestamp >= proposal.endTime) revert VotingEnded();
        if (votes[proposalId][msg.sender].voter != address(0)) revert AlreadyVoted();
        if (voteWeight == 0) revert InvalidWeight();

        uint256 cost = voteWeight * proposal.votePrice;
        voteToken.safeTransferFrom(msg.sender, address(this), cost);

        uint256 fee = MathUtils.pct(cost, platformFee);
        uint256 poolContribution = cost - fee;

        votes[proposalId][msg.sender] = Vote({
            voter: msg.sender,
            support: support,
            weight: voteWeight,
            cost: cost,
            timestamp: block.timestamp,
            claimed: false,
            reward: 0
        });
        proposalVoters[proposalId].push(msg.sender);

        if (support) {
            proposal.forVotes += voteWeight;
        } else {
            proposal.againstVotes += voteWeight;
        }
        proposal.totalVotes += voteWeight;
        proposal.rewardPool += poolContribution;

        if (fee > 0) {
            voteToken.safeTransfer(owner(), fee);
        }

        emit VoteCast(proposalId, msg.sender, support, voteWeight);
    }

    function resolveProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        if (block.timestamp < proposal.endTime) revert VotingNotEnded();
        if (proposal.resolved) revert AlreadyResolved();

        proposal.resolved = true;
        if (proposal.forVotes > proposal.againstVotes) {
            proposal.status = ProposalStatus.Passed;
        } else {
            proposal.status = ProposalStatus.Failed;
        }

        emit ProposalResolved(proposalId, proposal.status == ProposalStatus.Passed);
    }

    function claimReward(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        if (!proposal.resolved) revert ProposalNotResolved();

        Vote storage recorded = votes[proposalId][msg.sender];
        if (recorded.voter == address(0)) revert NoVote();
        if (recorded.claimed) revert AlreadyClaimed();

        bool won = (recorded.support && proposal.status == ProposalStatus.Passed) ||
            (!recorded.support && proposal.status == ProposalStatus.Failed);

        if (won && proposal.rewardPool > 0) {
            uint256 winnerVotes = recorded.support ? proposal.forVotes : proposal.againstVotes;
            if (winnerVotes > 0) {
                uint256 share = (recorded.weight * proposal.rewardPool) / winnerVotes;
                recorded.reward = share;
                pendingRewards[msg.sender] += share;
            }
        }

        recorded.claimed = true;
        emit RewardClaimed(msg.sender, proposalId, recorded.reward);
    }

    function withdrawRewards() external nonReentrant {
        uint256 amount = pendingRewards[msg.sender];
        if (amount == 0) revert NoRewards();
        pendingRewards[msg.sender] = 0;
        voteToken.safeTransfer(msg.sender, amount);
        emit RewardsWithdrawn(msg.sender, amount);
    }

    function setBaseVotePrice(uint256 price) external onlyOwner {
        require(price > 0, "Invalid price");
        baseVotePrice = price;
    }

    function setVotingPeriod(uint256 period) external onlyOwner {
        require(period >= 1 hours, "Period too short");
        votingPeriod = period;
    }

    function setPlatformFee(uint256 feeBps) external onlyOwner {
        if (feeBps > 1000) revert FeeTooHigh();
        platformFee = feeBps;
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    function getVote(uint256 proposalId, address voter) external view returns (Vote memory) {
        return votes[proposalId][voter];
    }

    function getVoters(uint256 proposalId) external view returns (address[] memory) {
        return proposalVoters[proposalId];
    }

    function getPendingRewards(address user) external view returns (uint256) {
        return pendingRewards[user];
    }

    function getVotePrice(uint256 proposalId) external view returns (uint256) {
        return proposals[proposalId].votePrice;
    }
}
