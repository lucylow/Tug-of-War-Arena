// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";
import {MathUtils} from "../utils/MathUtils.sol";

/**
 * @title SocialPrediction
 * @notice Yes/No social markets with accuracy stats and a points leaderboard.
 * @dev Creator or owner resolves after `endTime`. Winners split the pool minus fee.
 *      Leaderboard ranking is computed off storage so the view cannot write ranks.
 */
contract SocialPrediction is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    enum PredictionStatus {
        Open,
        Resolved,
        Canceled
    }

    struct Prediction {
        uint256 id;
        string title;
        string description;
        address creator;
        uint256 endTime;
        PredictionStatus status;
        uint256 totalYes;
        uint256 totalNo;
        uint256 outcome;
        uint256 createdAt;
        uint256 resolvedAt;
    }

    struct Bet {
        address user;
        bool prediction;
        uint256 amount;
        uint256 timestamp;
        bool claimed;
        uint256 reward;
    }

    struct UserStats {
        uint256 totalBets;
        uint256 correctBets;
        uint256 totalWagered;
        uint256 totalWon;
        uint256 accuracy;
        uint256 streak;
        uint256 bestStreak;
        uint256 points;
        uint256 rank;
        bool accuracyBonusAwarded;
    }

    IERC20 public immutable betToken;

    mapping(uint256 => Prediction) public predictions;
    mapping(uint256 => mapping(address => Bet)) public bets;
    mapping(uint256 => address[]) public predictionBettors;
    mapping(address => UserStats) public userStats;
    EnumerableSet.AddressSet private activeBettors;

    uint256 public nextPredictionId;
    uint256 public minBet = 1e18;
    uint256 public maxBet = 100e18;
    uint256 public platformFee = 100;
    uint256 public winPoints = 10;
    uint256 public streakBonusPoints = 5;
    uint256 public accuracyBonusPoints = 20;

    event PredictionCreated(uint256 indexed id, string title, address indexed creator);
    event BetPlaced(uint256 indexed id, address indexed user, bool prediction, uint256 amount);
    event PredictionResolved(uint256 indexed id, uint256 outcome);
    event PredictionCanceled(uint256 indexed id);
    event RewardClaimed(uint256 indexed id, address indexed user, uint256 amount);
    event RefundClaimed(uint256 indexed id, address indexed user, uint256 amount);

    error TitleRequired();
    error InvalidDuration();
    error AmountOutOfRange();
    error PredictionNotOpen();
    error PredictionEnded();
    error TooEarly();
    error AlreadyBet();
    error NotAuthorized();
    error InvalidOutcome();
    error PredictionNotResolved();
    error NoBet();
    error AlreadyClaimed();
    error NoWinnings();
    error NotCanceled();

    constructor(address betToken_, address initialOwner) Ownable(initialOwner) {
        require(betToken_ != address(0), "Zero address");
        betToken = IERC20(betToken_);
    }

    function createPrediction(
        string calldata title,
        string calldata description,
        uint256 durationDays
    ) external returns (uint256 id) {
        if (bytes(title).length == 0) revert TitleRequired();
        if (durationDays == 0 || durationDays > 30) revert InvalidDuration();

        id = nextPredictionId++;
        predictions[id] = Prediction({
            id: id,
            title: title,
            description: description,
            creator: msg.sender,
            endTime: block.timestamp + (durationDays * 1 days),
            status: PredictionStatus.Open,
            totalYes: 0,
            totalNo: 0,
            outcome: 0,
            createdAt: block.timestamp,
            resolvedAt: 0
        });

        emit PredictionCreated(id, title, msg.sender);
    }

    function placeBet(uint256 predictionId, bool side, uint256 amount) external nonReentrant {
        if (amount < minBet || amount > maxBet) revert AmountOutOfRange();

        Prediction storage market = predictions[predictionId];
        if (market.status != PredictionStatus.Open) revert PredictionNotOpen();
        if (block.timestamp >= market.endTime) revert PredictionEnded();
        if (bets[predictionId][msg.sender].user != address(0)) revert AlreadyBet();

        betToken.safeTransferFrom(msg.sender, address(this), amount);

        bets[predictionId][msg.sender] = Bet({
            user: msg.sender,
            prediction: side,
            amount: amount,
            timestamp: block.timestamp,
            claimed: false,
            reward: 0
        });
        predictionBettors[predictionId].push(msg.sender);

        if (side) {
            market.totalYes += amount;
        } else {
            market.totalNo += amount;
        }

        activeBettors.add(msg.sender);
        emit BetPlaced(predictionId, msg.sender, side, amount);
    }

    function resolvePrediction(uint256 predictionId, uint256 outcome) external {
        Prediction storage market = predictions[predictionId];
        if (market.status != PredictionStatus.Open) revert PredictionNotOpen();
        if (block.timestamp < market.endTime) revert TooEarly();
        if (msg.sender != market.creator && msg.sender != owner()) revert NotAuthorized();
        if (outcome != 1 && outcome != 2) revert InvalidOutcome();

        market.status = PredictionStatus.Resolved;
        market.outcome = outcome;
        market.resolvedAt = block.timestamp;
        _updateStats(predictionId, outcome);
        emit PredictionResolved(predictionId, outcome);
    }

    function cancelPrediction(uint256 predictionId) external {
        Prediction storage market = predictions[predictionId];
        if (market.status != PredictionStatus.Open) revert PredictionNotOpen();
        if (msg.sender != market.creator && msg.sender != owner()) revert NotAuthorized();
        market.status = PredictionStatus.Canceled;
        emit PredictionCanceled(predictionId);
    }

    function claimWinnings(uint256 predictionId) external nonReentrant {
        Prediction storage market = predictions[predictionId];
        if (market.status != PredictionStatus.Resolved) revert PredictionNotResolved();

        Bet storage userBet = bets[predictionId][msg.sender];
        if (userBet.user == address(0)) revert NoBet();
        if (userBet.claimed) revert AlreadyClaimed();
        if (userBet.reward == 0) revert NoWinnings();

        userBet.claimed = true;
        betToken.safeTransfer(msg.sender, userBet.reward);
        emit RewardClaimed(predictionId, msg.sender, userBet.reward);
    }

    function claimRefund(uint256 predictionId) external nonReentrant {
        Prediction storage market = predictions[predictionId];
        if (market.status != PredictionStatus.Canceled) revert NotCanceled();

        Bet storage userBet = bets[predictionId][msg.sender];
        if (userBet.user == address(0)) revert NoBet();
        if (userBet.claimed) revert AlreadyClaimed();

        userBet.claimed = true;
        betToken.safeTransfer(msg.sender, userBet.amount);
        emit RefundClaimed(predictionId, msg.sender, userBet.amount);
    }

    function getPrediction(uint256 predictionId) external view returns (Prediction memory) {
        return predictions[predictionId];
    }

    function getBet(uint256 predictionId, address user) external view returns (Bet memory) {
        return bets[predictionId][user];
    }

    function getUserStats(address user) external view returns (UserStats memory) {
        return userStats[user];
    }

    function getBettors(uint256 predictionId) external view returns (address[] memory) {
        return predictionBettors[predictionId];
    }

    function getLeaderboard(uint256 count) external view returns (address[] memory, uint256[] memory) {
        uint256 total = activeBettors.length();
        uint256 maxCount = count > total ? total : count;

        address[] memory users = activeBettors.values();
        uint256[] memory points = new uint256[](total);

        for (uint256 i = 0; i < total; ) {
            points[i] = userStats[users[i]].points;
            unchecked {
                ++i;
            }
        }

        for (uint256 i = 0; i < total; ) {
            for (uint256 j = i + 1; j < total; ) {
                if (points[j] > points[i]) {
                    (points[i], points[j]) = (points[j], points[i]);
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
        uint256[] memory topPoints = new uint256[](maxCount);
        for (uint256 i = 0; i < maxCount; ) {
            topUsers[i] = users[i];
            topPoints[i] = points[i];
            unchecked {
                ++i;
            }
        }
        return (topUsers, topPoints);
    }

    function _updateStats(uint256 predictionId, uint256 outcome) private {
        Prediction storage market = predictions[predictionId];
        address[] memory bettors = predictionBettors[predictionId];
        uint256 totalPool = market.totalYes + market.totalNo;
        uint256 winningPool = outcome == 1 ? market.totalYes : market.totalNo;

        for (uint256 i = 0; i < bettors.length; ) {
            address user = bettors[i];
            Bet storage userBet = bets[predictionId][user];
            UserStats storage stats = userStats[user];

            stats.totalBets += 1;
            stats.totalWagered += userBet.amount;

            bool correct = (userBet.prediction && outcome == 1) || (!userBet.prediction && outcome == 2);
            if (correct && winningPool > 0) {
                stats.correctBets += 1;
                stats.streak += 1;
                if (stats.streak > stats.bestStreak) {
                    stats.bestStreak = stats.streak;
                }

                uint256 gross = (userBet.amount * totalPool) / winningPool;
                uint256 fee = MathUtils.pct(gross, platformFee);
                userBet.reward = gross - fee;
                stats.totalWon += userBet.reward;
                stats.points += winPoints;
                if (stats.streak >= 5) {
                    stats.points += streakBonusPoints;
                }
            } else {
                stats.streak = 0;
            }

            stats.accuracy = (stats.correctBets * 100) / stats.totalBets;
            if (stats.accuracy >= 80 && !stats.accuracyBonusAwarded && stats.totalBets >= 5) {
                stats.accuracyBonusAwarded = true;
                stats.points += accuracyBonusPoints;
            }

            unchecked {
                ++i;
            }
        }
    }
}
