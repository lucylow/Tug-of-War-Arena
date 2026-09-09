// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";
import {MathUtils} from "../utils/MathUtils.sol";

/**
 * @title SocialBondingCurve
 * @notice Community-token bonding curve with buy/sell fees and holder tracking.
 * @dev Linear spot price `supply * SLOPE + BASE_PRICE`. Buy/sell cost is the
 *      closed-form sum of that series so large lots do not loop per token.
 *
 *      Creator seed tokens are paid for at the curve so the reserve can always
 *      cover redemptions. Fees leave the curve and are sent to the owner.
 */
contract SocialBondingCurve is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Community {
        uint256 id;
        string name;
        address creator;
        uint256 supply;
        uint256 reserveBalance;
        uint256 buyFee;
        uint256 sellFee;
        bool active;
        uint256 createdAt;
    }

    struct Holding {
        uint256 amount;
        uint256 lastBuyPrice;
        uint256 totalSpent;
        uint256 totalReceived;
    }

    IERC20 public immutable reserveToken;

    mapping(uint256 => Community) public communities;
    mapping(uint256 => mapping(address => Holding)) public holdings;
    mapping(uint256 => mapping(address => bool)) public isMember;
    mapping(address => uint256[]) public userCommunities;

    uint256 public nextCommunityId;
    uint256 public constant SLOPE = 1000;
    uint256 public constant BASE_PRICE = 1e18;
    uint256 public constant MAX_FEE_BPS = 1000;

    event CommunityCreated(uint256 indexed id, string name, address indexed creator, uint256 initialSupply);
    event TokensBought(uint256 indexed communityId, address indexed buyer, uint256 amount, uint256 price);
    event TokensSold(uint256 indexed communityId, address indexed seller, uint256 amount, uint256 payout);
    event FeeCollected(uint256 indexed communityId, uint256 amount);
    event CommunityToggled(uint256 indexed communityId, bool active);
    event FeesUpdated(uint256 indexed communityId, uint256 buyFee, uint256 sellFee);

    error NameRequired();
    error FeeTooHigh();
    error CommunityInactive();
    error InvalidAmount();
    error InsufficientBalance();
    error InsufficientReserve();
    error UnknownCommunity();

    constructor(address reserveToken_, address initialOwner) Ownable(initialOwner) {
        require(reserveToken_ != address(0), "Zero address");
        reserveToken = IERC20(reserveToken_);
    }

    function createCommunity(
        string calldata name,
        uint256 initialSupply,
        uint256 buyFee,
        uint256 sellFee
    ) external nonReentrant returns (uint256 communityId) {
        if (bytes(name).length == 0) revert NameRequired();
        if (buyFee > MAX_FEE_BPS || sellFee > MAX_FEE_BPS) revert FeeTooHigh();

        communityId = nextCommunityId++;
        communities[communityId] = Community({
            id: communityId,
            name: name,
            creator: msg.sender,
            supply: 0,
            reserveBalance: 0,
            buyFee: buyFee,
            sellFee: sellFee,
            active: true,
            createdAt: block.timestamp
        });

        _joinCommunity(communityId, msg.sender);

        if (initialSupply > 0) {
            uint256 seedCost = _buyCost(0, initialSupply);
            reserveToken.safeTransferFrom(msg.sender, address(this), seedCost);
            communities[communityId].supply = initialSupply;
            communities[communityId].reserveBalance = seedCost;
            Holding storage holding = holdings[communityId][msg.sender];
            holding.amount = initialSupply;
            holding.totalSpent = seedCost;
            holding.lastBuyPrice = getSpotPrice(initialSupply);
            emit TokensBought(communityId, msg.sender, initialSupply, seedCost);
        }

        emit CommunityCreated(communityId, name, msg.sender, initialSupply);
    }

    function buyTokens(uint256 communityId, uint256 tokenAmount) external nonReentrant {
        if (tokenAmount == 0) revert InvalidAmount();
        Community storage community = _liveCommunity(communityId);

        uint256 price = _buyCost(community.supply, tokenAmount);
        reserveToken.safeTransferFrom(msg.sender, address(this), price);

        uint256 fee = MathUtils.pct(price, community.buyFee);
        uint256 reserveAmount = price - fee;

        community.supply += tokenAmount;
        community.reserveBalance += reserveAmount;

        Holding storage holding = holdings[communityId][msg.sender];
        holding.amount += tokenAmount;
        holding.totalSpent += price;
        holding.lastBuyPrice = getSpotPrice(community.supply);
        _joinCommunity(communityId, msg.sender);

        if (fee > 0) {
            reserveToken.safeTransfer(owner(), fee);
            emit FeeCollected(communityId, fee);
        }

        emit TokensBought(communityId, msg.sender, tokenAmount, price);
    }

    function sellTokens(uint256 communityId, uint256 tokenAmount) external nonReentrant {
        if (tokenAmount == 0) revert InvalidAmount();
        Community storage community = _liveCommunity(communityId);

        Holding storage holding = holdings[communityId][msg.sender];
        if (holding.amount < tokenAmount) revert InsufficientBalance();

        uint256 price = _sellCost(community.supply, tokenAmount);
        if (price == 0) revert InvalidAmount();
        if (community.reserveBalance < price) revert InsufficientReserve();

        uint256 fee = MathUtils.pct(price, community.sellFee);
        uint256 payout = price - fee;

        community.supply -= tokenAmount;
        community.reserveBalance -= price;
        holding.amount -= tokenAmount;
        holding.totalReceived += payout;

        reserveToken.safeTransfer(msg.sender, payout);
        if (fee > 0) {
            reserveToken.safeTransfer(owner(), fee);
            emit FeeCollected(communityId, fee);
        }

        emit TokensSold(communityId, msg.sender, tokenAmount, payout);
    }

    function getBuyPrice(uint256 communityId, uint256 amount) public view returns (uint256) {
        return _buyCost(communities[communityId].supply, amount);
    }

    function getSellPrice(uint256 communityId, uint256 amount) public view returns (uint256) {
        Community storage community = communities[communityId];
        if (amount > community.supply) return 0;
        uint256 theoretical = _sellCost(community.supply, amount);
        return theoretical > community.reserveBalance ? community.reserveBalance : theoretical;
    }

    function getSpotPrice(uint256 supply) public pure returns (uint256) {
        return (supply * SLOPE) + BASE_PRICE;
    }

    function getCurrentPrice(uint256 communityId) public view returns (uint256) {
        return getSpotPrice(communities[communityId].supply);
    }

    function getMarketCap(uint256 communityId) public view returns (uint256) {
        Community storage community = communities[communityId];
        return getSpotPrice(community.supply) * community.supply;
    }

    function getCommunity(uint256 communityId) external view returns (Community memory) {
        return communities[communityId];
    }

    function getHolding(uint256 communityId, address user) external view returns (Holding memory) {
        return holdings[communityId][user];
    }

    function getUserCommunities(address user) external view returns (uint256[] memory) {
        return userCommunities[user];
    }

    function getTotalValue(uint256 communityId, address user) external view returns (uint256) {
        return getSpotPrice(communities[communityId].supply) * holdings[communityId][user].amount;
    }

    function setFees(uint256 communityId, uint256 buyFee, uint256 sellFee) external onlyOwner {
        if (communities[communityId].createdAt == 0 && communities[communityId].creator == address(0)) revert UnknownCommunity();
        if (buyFee > MAX_FEE_BPS || sellFee > MAX_FEE_BPS) revert FeeTooHigh();
        communities[communityId].buyFee = buyFee;
        communities[communityId].sellFee = sellFee;
        emit FeesUpdated(communityId, buyFee, sellFee);
    }

    function toggleCommunity(uint256 communityId) external onlyOwner {
        communities[communityId].active = !communities[communityId].active;
        emit CommunityToggled(communityId, communities[communityId].active);
    }

    function _liveCommunity(uint256 communityId) private view returns (Community storage community) {
        community = communities[communityId];
        if (!community.active) revert CommunityInactive();
    }

    function _joinCommunity(uint256 communityId, address user) private {
        if (!isMember[communityId][user]) {
            isMember[communityId][user] = true;
            userCommunities[user].push(communityId);
        }
    }

    /// @dev Sum of spot prices from `supply` through `supply + amount - 1`.
    function _buyCost(uint256 supply, uint256 amount) private pure returns (uint256) {
        if (amount == 0) return 0;
        uint256 series = amount * supply + (amount * (amount - 1)) / 2;
        return amount * BASE_PRICE + SLOPE * series;
    }

    /// @dev Sum of spot prices from `supply - 1` down to `supply - amount`.
    function _sellCost(uint256 supply, uint256 amount) private pure returns (uint256) {
        if (amount == 0 || amount > supply) return 0;
        uint256 series = amount * (2 * supply - amount - 1) / 2;
        return amount * BASE_PRICE + SLOPE * series;
    }
}
