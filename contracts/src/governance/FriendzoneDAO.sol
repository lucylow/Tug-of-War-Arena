// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FriendzoneDAO
 * @notice Token-weighted parameter votes. Voting power is snapshotted at vote time
 *         from FZONE balance. Flash-loan voting is an accepted hackathon limitation;
 *         production should migrate to ERC20Votes checkpoints.
 */
contract FriendzoneDAO is Ownable {
    IERC20 public immutable governanceToken;
    uint256 public proposalThreshold = 1_000 * 10 ** 18;
    uint256 public minQuorum = 1_000 * 10 ** 18;

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startBlock;
        uint256 endBlock;
        bool executed;
        bool passed;
        bytes callData;
        address target;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 private _nextProposalId = 1;

    event ProposalCreated(uint256 indexed id, address indexed proposer, string description, address target);
    event VoteCast(uint256 indexed id, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed id);
    event ProposalFailed(uint256 indexed id);
    event ThresholdUpdated(uint256 proposalThreshold, uint256 minQuorum);

    error InsufficientVotingPower();
    error UnknownProposal();
    error VotingClosed();
    error VotingActive();
    error AlreadyVoted();
    error AlreadyExecuted();
    error ProposalRejected();
    error ExecutionFailed();
    error InvalidPeriod();

    constructor(address governanceToken_, address initialOwner) Ownable(initialOwner) {
        governanceToken = IERC20(governanceToken_);
    }

    function createProposal(
        string calldata description,
        address target,
        bytes calldata callData,
        uint256 votingPeriod
    ) external returns (uint256 proposalId) {
        if (governanceToken.balanceOf(msg.sender) < proposalThreshold) revert InsufficientVotingPower();
        if (votingPeriod == 0 || votingPeriod > 100_000) revert InvalidPeriod();

        proposalId = _nextProposalId;
        unchecked {
            ++_nextProposalId;
        }

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            description: description,
            forVotes: 0,
            againstVotes: 0,
            startBlock: block.number,
            endBlock: block.number + votingPeriod,
            executed: false,
            passed: false,
            callData: callData,
            target: target
        });

        emit ProposalCreated(proposalId, msg.sender, description, target);
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = _requireProposal(proposalId);
        if (block.number < proposal.startBlock || block.number >= proposal.endBlock) revert VotingClosed();
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();

        uint256 votingPower = governanceToken.balanceOf(msg.sender);
        if (votingPower == 0) revert InsufficientVotingPower();

        hasVoted[proposalId][msg.sender] = true;
        if (support) {
            proposal.forVotes += votingPower;
        } else {
            proposal.againstVotes += votingPower;
        }
        emit VoteCast(proposalId, msg.sender, support, votingPower);
    }

    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = _requireProposal(proposalId);
        if (block.number < proposal.endBlock) revert VotingActive();
        if (proposal.executed) revert AlreadyExecuted();

        proposal.executed = true;
        bool passed = proposal.forVotes > proposal.againstVotes && proposal.forVotes >= minQuorum;
        proposal.passed = passed;
        if (!passed) {
            emit ProposalFailed(proposalId);
            revert ProposalRejected();
        }

        (bool success, ) = proposal.target.call(proposal.callData);
        if (!success) revert ExecutionFailed();
        emit ProposalExecuted(proposalId);
    }

    function setThresholds(uint256 newProposalThreshold, uint256 newMinQuorum) external onlyOwner {
        proposalThreshold = newProposalThreshold;
        minQuorum = newMinQuorum;
        emit ThresholdUpdated(newProposalThreshold, newMinQuorum);
    }

    function nextProposalId() external view returns (uint256) {
        return _nextProposalId;
    }

    function _requireProposal(uint256 proposalId) private view returns (Proposal storage proposal) {
        proposal = proposals[proposalId];
        if (proposal.id == 0) revert UnknownProposal();
    }
}
