// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";

/**
 * @title PredictionMarket
 * @notice Community yes/no markets for Friendzone social outcomes.
 */
contract PredictionMarket is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum MarketStatus {
        Active,
        Resolved,
        Canceled
    }

    enum Outcome {
        Unknown,
        Yes,
        No
    }

    struct Market {
        uint256 id;
        string title;
        string description;
        address creator;
        uint256 createdAt;
        uint256 endTime;
        uint256 resolutionTime;
        MarketStatus status;
        Outcome outcome;
        uint256 totalYes;
        uint256 totalNo;
        bool resolved;
    }

    struct Bet {
        uint256 id;
        address better;
        uint256 marketId;
        Outcome outcome;
        uint256 amount;
        uint256 timestamp;
        bool claimed;
    }

    IERC20 public immutable betToken;

    mapping(uint256 => Market) public markets;
    mapping(uint256 => Bet) public bets;
    mapping(uint256 => uint256[]) public marketBetIds;
    mapping(address => uint256[]) public userBets;
    mapping(uint256 => mapping(address => uint256[])) public userMarketBets;

    uint256 public nextMarketId;
    uint256 public nextBetId;
    uint256 public minBetAmount = 1 * 10 ** 18;
    uint256 public maxBetAmount = 100 * 10 ** 18;
    uint256 public platformFee = 100;
    uint256 public collectedFees;

    event MarketCreated(uint256 indexed marketId, address indexed creator, string title);
    event BetPlaced(uint256 indexed marketId, address indexed better, Outcome outcome, uint256 amount);
    event MarketResolved(uint256 indexed marketId, Outcome outcome);
    event MarketCanceled(uint256 indexed marketId);
    event BetClaimed(uint256 indexed marketId, address indexed better, uint256 amount);

    error InvalidDuration();
    error InvalidOutcome();
    error AmountOutOfRange();
    error MarketNotActive();
    error MarketOpen();
    error NotAuthorized();
    error NoWinnings();
    error FeeTooHigh();

    constructor(address betToken_, address initialOwner) Ownable(initialOwner) {
        require(betToken_ != address(0), "Zero address");
        betToken = IERC20(betToken_);
    }

    function createMarket(
        string calldata title,
        string calldata description,
        uint256 durationDays
    ) external returns (uint256 marketId) {
        require(bytes(title).length > 0, "Title required");
        if (durationDays == 0 || durationDays > 30) revert InvalidDuration();

        marketId = nextMarketId++;
        markets[marketId] = Market({
            id: marketId,
            title: title,
            description: description,
            creator: msg.sender,
            createdAt: block.timestamp,
            endTime: block.timestamp + (durationDays * 1 days),
            resolutionTime: 0,
            status: MarketStatus.Active,
            outcome: Outcome.Unknown,
            totalYes: 0,
            totalNo: 0,
            resolved: false
        });

        emit MarketCreated(marketId, msg.sender, title);
    }

    function placeBet(uint256 marketId, Outcome outcome, uint256 amount) external nonReentrant {
        if (outcome != Outcome.Yes && outcome != Outcome.No) revert InvalidOutcome();
        if (amount < minBetAmount || amount > maxBetAmount) revert AmountOutOfRange();

        Market storage market = markets[marketId];
        if (market.status != MarketStatus.Active || block.timestamp >= market.endTime) revert MarketNotActive();

        betToken.safeTransferFrom(msg.sender, address(this), amount);

        uint256 betId = nextBetId++;
        bets[betId] = Bet({
            id: betId,
            better: msg.sender,
            marketId: marketId,
            outcome: outcome,
            amount: amount,
            timestamp: block.timestamp,
            claimed: false
        });

        marketBetIds[marketId].push(betId);
        userBets[msg.sender].push(betId);
        userMarketBets[marketId][msg.sender].push(betId);

        if (outcome == Outcome.Yes) {
            market.totalYes += amount;
        } else {
            market.totalNo += amount;
        }

        emit BetPlaced(marketId, msg.sender, outcome, amount);
    }

    function resolveMarket(uint256 marketId, Outcome outcome) external {
        Market storage market = markets[marketId];
        if (market.status != MarketStatus.Active) revert MarketNotActive();
        if (block.timestamp < market.endTime) revert MarketOpen();
        if (msg.sender != market.creator && msg.sender != owner()) revert NotAuthorized();
        if (outcome != Outcome.Yes && outcome != Outcome.No) revert InvalidOutcome();

        market.status = MarketStatus.Resolved;
        market.outcome = outcome;
        market.resolutionTime = block.timestamp;
        market.resolved = true;

        emit MarketResolved(marketId, outcome);
    }

    function cancelMarket(uint256 marketId) external {
        Market storage market = markets[marketId];
        if (market.status != MarketStatus.Active) revert MarketNotActive();
        if (msg.sender != market.creator && msg.sender != owner()) revert NotAuthorized();

        market.status = MarketStatus.Canceled;
        emit MarketCanceled(marketId);
    }

    function claimWinnings(uint256 marketId) external nonReentrant {
        Market storage market = markets[marketId];
        require(market.resolved, "Market not resolved");

        uint256[] storage betIds = userMarketBets[marketId][msg.sender];
        uint256 totalWinnings = 0;
        uint256 feeAmount = 0;
        uint256 winningPool = market.outcome == Outcome.Yes ? market.totalYes : market.totalNo;
        uint256 totalPool = market.totalYes + market.totalNo;

        for (uint256 i = 0; i < betIds.length; ) {
            Bet storage bet = bets[betIds[i]];
            if (!bet.claimed && bet.outcome == market.outcome && winningPool > 0 && totalPool > 0) {
                bet.claimed = true;
                uint256 payout = (bet.amount * totalPool) / winningPool;
                uint256 fee = (payout * platformFee) / 10_000;
                totalWinnings += payout - fee;
                feeAmount += fee;
            }
            unchecked {
                ++i;
            }
        }

        if (totalWinnings == 0) revert NoWinnings();
        collectedFees += feeAmount;
        betToken.safeTransfer(msg.sender, totalWinnings);
        emit BetClaimed(marketId, msg.sender, totalWinnings);
    }

    function claimRefund(uint256 marketId) external nonReentrant {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Canceled, "Market not canceled");

        uint256[] storage betIds = userMarketBets[marketId][msg.sender];
        uint256 refund = 0;

        for (uint256 i = 0; i < betIds.length; ) {
            Bet storage bet = bets[betIds[i]];
            if (!bet.claimed) {
                bet.claimed = true;
                refund += bet.amount;
            }
            unchecked {
                ++i;
            }
        }

        if (refund == 0) revert NoWinnings();
        betToken.safeTransfer(msg.sender, refund);
        emit BetClaimed(marketId, msg.sender, refund);
    }

    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    function getBets(uint256 marketId) external view returns (Bet[] memory) {
        uint256[] storage ids = marketBetIds[marketId];
        Bet[] memory result = new Bet[](ids.length);
        for (uint256 i = 0; i < ids.length; ) {
            result[i] = bets[ids[i]];
            unchecked {
                ++i;
            }
        }
        return result;
    }

    function getUserBets(address user) external view returns (uint256[] memory) {
        return userBets[user];
    }

    function getMarketOdds(uint256 marketId) external view returns (uint256 yesOdds, uint256 noOdds) {
        Market storage market = markets[marketId];
        uint256 total = market.totalYes + market.totalNo;
        if (total == 0) return (50, 50);
        yesOdds = (market.totalYes * 100) / total;
        noOdds = (market.totalNo * 100) / total;
    }

    function getTotalPool(uint256 marketId) external view returns (uint256) {
        return markets[marketId].totalYes + markets[marketId].totalNo;
    }

    function setMinBetAmount(uint256 minAmount) external onlyOwner {
        minBetAmount = minAmount;
    }

    function setMaxBetAmount(uint256 maxAmount) external onlyOwner {
        maxBetAmount = maxAmount;
    }

    function setPlatformFee(uint256 fee) external onlyOwner {
        if (fee > 500) revert FeeTooHigh();
        platformFee = fee;
    }

    function withdrawFees() external onlyOwner {
        uint256 amount = collectedFees;
        require(amount > 0, "No fees");
        collectedFees = 0;
        betToken.safeTransfer(owner(), amount);
    }
}
