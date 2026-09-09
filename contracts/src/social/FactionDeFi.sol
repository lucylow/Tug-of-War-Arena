// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";
import {OperatorOwnable} from "../gamification/OperatorOwnable.sol";
import {MathUtils} from "../utils/MathUtils.sol";

/**
 * @title FactionDeFi
 * @notice Red vs Blue deposit game. Time-weighted deposits mint faction points;
 *         the winning side splits a separately funded reward-token prize pool.
 * @dev Deposits stay fully withdrawable. Epoch rewards are never taken from
 *      player principal — the owner (or a sponsor) funds `rewardToken`.
 */
contract FactionDeFi is OperatorOwnable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    enum Faction {
        Red,
        Blue
    }

    struct Player {
        address wallet;
        Faction faction;
        uint256 depositAmount;
        uint256 factionPoints;
        uint256 lastDepositTime;
        uint256 totalEarned;
        bool active;
        uint256 accrualEpochId;
    }

    struct Epoch {
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        uint256 redPoints;
        uint256 bluePoints;
        uint256 prizePool;
        Faction winner;
        bool resolved;
        uint256 redDeposits;
        uint256 blueDeposits;
        uint256 lastPointSync;
    }

    IERC20 public immutable depositToken;
    IERC20 public immutable rewardToken;

    mapping(address => Player) public players;
    mapping(uint256 => Epoch) public epochs;
    mapping(uint256 => mapping(address => uint256)) public epochPoints;
    mapping(uint256 => mapping(address => bool)) public epochClaimed;
    mapping(address => uint256) public pendingRewards;

    EnumerableSet.AddressSet private activePlayers;

    uint256 public currentEpochId;
    uint256 public epochDuration = 4 days;
    uint256 public pointsPerTokenPerSecond = 1;
    uint256 public minDeposit = 1e18;
    uint256 public platformFee = 50;

    event PlayerRegistered(address indexed player, Faction faction);
    event DepositMade(address indexed player, uint256 amount);
    event Withdrawal(address indexed player, uint256 amount);
    event EpochStarted(uint256 indexed epochId, uint256 endTime);
    event EpochResolved(uint256 indexed epochId, Faction winner, uint256 prizePool);
    event PrizeFunded(uint256 indexed epochId, address indexed from, uint256 amount);
    event RewardClaimed(address indexed player, uint256 indexed epochId, uint256 amount);
    event RewardsWithdrawn(address indexed player, uint256 amount);

    error AlreadyRegistered();
    error NotRegistered();
    error AmountBelowMinimum();
    error InsufficientBalance();
    error EpochNotEnded();
    error AlreadyResolved();
    error EpochNotResolved();
    error AlreadyClaimed();
    error NotAWinner();
    error NoRewards();
    error NoWinningPoints();
    error FeeTooHigh();

    constructor(
        address depositToken_,
        address rewardToken_,
        address initialOwner
    ) OperatorOwnable(initialOwner) {
        require(depositToken_ != address(0) && rewardToken_ != address(0), "Zero address");
        depositToken = IERC20(depositToken_);
        rewardToken = IERC20(rewardToken_);
        _startNewEpoch();
    }

    function register(Faction faction) external {
        if (players[msg.sender].wallet != address(0)) revert AlreadyRegistered();

        players[msg.sender] = Player({
            wallet: msg.sender,
            faction: faction,
            depositAmount: 0,
            factionPoints: 0,
            lastDepositTime: block.timestamp,
            totalEarned: 0,
            active: true,
            accrualEpochId: currentEpochId
        });

        activePlayers.add(msg.sender);
        emit PlayerRegistered(msg.sender, faction);
    }

    function deposit(uint256 amount) external nonReentrant {
        Player storage player = players[msg.sender];
        if (player.wallet == address(0)) revert NotRegistered();
        if (amount < minDeposit) revert AmountBelowMinimum();

        _syncPlayer(msg.sender);
        depositToken.safeTransferFrom(msg.sender, address(this), amount);

        player.depositAmount += amount;
        _addFactionDeposits(player.faction, amount);
        player.lastDepositTime = block.timestamp;

        emit DepositMade(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        Player storage player = players[msg.sender];
        if (player.wallet == address(0)) revert NotRegistered();
        if (player.depositAmount < amount) revert InsufficientBalance();

        _syncPlayer(msg.sender);
        player.depositAmount -= amount;
        _subFactionDeposits(player.faction, amount);
        player.lastDepositTime = block.timestamp;

        depositToken.safeTransfer(msg.sender, amount);
        emit Withdrawal(msg.sender, amount);
    }

    function accrue(address account) external {
        if (players[account].wallet == address(0)) revert NotRegistered();
        _syncPlayer(account);
    }

    function fundPrizePool(uint256 amount) external {
        if (amount == 0) revert AmountBelowMinimum();
        Epoch storage epoch = epochs[currentEpochId];
        if (epoch.resolved) revert AlreadyResolved();
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        epoch.prizePool += amount;
        emit PrizeFunded(currentEpochId, msg.sender, amount);
    }

    function resolveEpoch() external onlyOperator {
        Epoch storage epoch = epochs[currentEpochId];
        if (epoch.resolved) revert AlreadyResolved();
        if (block.timestamp < epoch.endTime) revert EpochNotEnded();

        _syncEpoch();
        epoch.resolved = true;
        epoch.winner = epoch.redPoints >= epoch.bluePoints ? Faction.Red : Faction.Blue;
        emit EpochResolved(currentEpochId, epoch.winner, epoch.prizePool);
        _startNewEpoch();
    }

    function claimRewards() external nonReentrant {
        if (currentEpochId == 0) revert EpochNotResolved();
        _claimEpoch(currentEpochId - 1);
    }

    function claimEpochRewards(uint256 epochId) external nonReentrant {
        _claimEpoch(epochId);
    }

    function withdrawRewards() external nonReentrant {
        uint256 amount = pendingRewards[msg.sender];
        if (amount == 0) revert NoRewards();
        pendingRewards[msg.sender] = 0;
        rewardToken.safeTransfer(msg.sender, amount);
        emit RewardsWithdrawn(msg.sender, amount);
    }

    function setEpochDuration(uint256 duration) external onlyOwner {
        require(duration >= 1 hours, "Duration too short");
        epochDuration = duration;
    }

    function setMinDeposit(uint256 amount) external onlyOwner {
        minDeposit = amount;
    }

    function setPlatformFee(uint256 feeBps) external onlyOwner {
        if (feeBps > 1000) revert FeeTooHigh();
        platformFee = feeBps;
    }

    function getPlayer(address player) external view returns (Player memory) {
        return players[player];
    }

    function getCurrentEpoch() external view returns (Epoch memory) {
        return _epochView(currentEpochId);
    }

    function getEpoch(uint256 epochId) external view returns (Epoch memory) {
        return _epochView(epochId);
    }

    function getFactionPoints(Faction faction) external view returns (uint256) {
        Epoch memory epoch = _epochView(currentEpochId);
        return faction == Faction.Red ? epoch.redPoints : epoch.bluePoints;
    }

    function getPendingReward(address player) external view returns (uint256) {
        return pendingRewards[player];
    }

    function getActivePlayers() external view returns (address[] memory) {
        return activePlayers.values();
    }

    function _claimEpoch(uint256 epochId) private {
        _syncPlayer(msg.sender);
        Player storage player = players[msg.sender];
        if (!player.active) revert NotRegistered();

        Epoch storage epoch = epochs[epochId];
        if (!epoch.resolved) revert EpochNotResolved();
        if (epochClaimed[epochId][msg.sender]) revert AlreadyClaimed();
        if (player.faction != epoch.winner) revert NotAWinner();

        uint256 winnerPoints = epoch.winner == Faction.Red ? epoch.redPoints : epoch.bluePoints;
        if (winnerPoints == 0) revert NoWinningPoints();

        uint256 playerPts = epochPoints[epochId][msg.sender];
        uint256 share = (playerPts * epoch.prizePool) / winnerPoints;
        uint256 fee = MathUtils.pct(share, platformFee);
        uint256 reward = share - fee;

        epochClaimed[epochId][msg.sender] = true;
        if (reward > 0) {
            pendingRewards[msg.sender] += reward;
            player.totalEarned += reward;
        }
        if (epochId == currentEpochId - 1) {
            player.factionPoints = epochPoints[currentEpochId][msg.sender];
        }

        emit RewardClaimed(msg.sender, epochId, reward);
    }

    function _startNewEpoch() private {
        uint256 epochId = currentEpochId + 1;
        epochs[epochId] = Epoch({
            id: epochId,
            startTime: block.timestamp,
            endTime: block.timestamp + epochDuration,
            redPoints: 0,
            bluePoints: 0,
            prizePool: 0,
            winner: Faction.Red,
            resolved: false,
            redDeposits: epochId == 1 ? 0 : epochs[currentEpochId].redDeposits,
            blueDeposits: epochId == 1 ? 0 : epochs[currentEpochId].blueDeposits,
            lastPointSync: block.timestamp
        });
        currentEpochId = epochId;
        emit EpochStarted(epochId, block.timestamp + epochDuration);
    }

    function _syncPlayer(address account) private {
        Player storage player = players[account];
        if (player.wallet == address(0)) return;

        if (player.accrualEpochId != 0 && player.accrualEpochId != currentEpochId) {
            _closeEpochPoints(account, player.accrualEpochId);
        }

        _syncEpoch();
        Epoch storage epoch = epochs[currentEpochId];
        uint256 to = epoch.lastPointSync;
        uint256 from = player.lastDepositTime;
        if (from < epoch.startTime) from = epoch.startTime;
        if (to > from && player.depositAmount > 0) {
            uint256 points = (player.depositAmount * (to - from) * pointsPerTokenPerSecond) / 1e18;
            epochPoints[currentEpochId][account] += points;
        }
        player.factionPoints = epochPoints[currentEpochId][account];
        player.lastDepositTime = to;
        player.accrualEpochId = currentEpochId;
    }

    function _closeEpochPoints(address account, uint256 epochId) private {
        Epoch storage epoch = epochs[epochId];
        Player storage player = players[account];
        uint256 to = epoch.endTime;
        uint256 from = player.lastDepositTime;
        if (from < epoch.startTime) from = epoch.startTime;
        if (to > from && player.depositAmount > 0) {
            epochPoints[epochId][account] += (player.depositAmount * (to - from) * pointsPerTokenPerSecond) / 1e18;
        }
        if (!epoch.resolved) {
            _syncEpochAt(epochId);
        }
        player.lastDepositTime = to > player.lastDepositTime ? to : player.lastDepositTime;
    }

    function _syncEpoch() private {
        _syncEpochAt(currentEpochId);
    }

    function _syncEpochAt(uint256 epochId) private {
        Epoch storage epoch = epochs[epochId];
        if (epoch.resolved) return;
        uint256 to = _syncCursor(epoch.endTime);
        if (to <= epoch.lastPointSync) return;
        uint256 dt = to - epoch.lastPointSync;
        if (epoch.redDeposits > 0) {
            epoch.redPoints += (epoch.redDeposits * dt * pointsPerTokenPerSecond) / 1e18;
        }
        if (epoch.blueDeposits > 0) {
            epoch.bluePoints += (epoch.blueDeposits * dt * pointsPerTokenPerSecond) / 1e18;
        }
        epoch.lastPointSync = to;
    }

    function _addFactionDeposits(Faction faction, uint256 amount) private {
        Epoch storage epoch = epochs[currentEpochId];
        if (faction == Faction.Red) {
            epoch.redDeposits += amount;
        } else {
            epoch.blueDeposits += amount;
        }
    }

    function _subFactionDeposits(Faction faction, uint256 amount) private {
        Epoch storage epoch = epochs[currentEpochId];
        if (faction == Faction.Red) {
            epoch.redDeposits -= amount;
        } else {
            epoch.blueDeposits -= amount;
        }
    }

    function _epochView(uint256 epochId) private view returns (Epoch memory epoch) {
        epoch = epochs[epochId];
        if (epoch.resolved || epoch.startTime == 0) return epoch;
        uint256 to = _syncCursor(epoch.endTime);
        if (to <= epoch.lastPointSync) return epoch;
        uint256 dt = to - epoch.lastPointSync;
        if (epoch.redDeposits > 0) {
            epoch.redPoints += (epoch.redDeposits * dt * pointsPerTokenPerSecond) / 1e18;
        }
        if (epoch.blueDeposits > 0) {
            epoch.bluePoints += (epoch.blueDeposits * dt * pointsPerTokenPerSecond) / 1e18;
        }
        epoch.lastPointSync = to;
    }

    function _syncCursor(uint256 endTime) private view returns (uint256) {
        uint256 to = block.timestamp;
        if (to > endTime) to = endTime;
        return to;
    }
}
