// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";
import {ISocialReputation} from "../interfaces/ISocialReputation.sol";

/**
 * @title ContentTipping
 * @notice Decentralized social tipping with reputation-weighted recorded value.
 * @dev Tippers pay `amount`. High-reputation tippers record a larger social value
 *      without being charged extra tokens.
 */
contract ContentTipping is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Tip {
        uint256 id;
        address from;
        address to;
        uint256 amount;
        uint256 tipTime;
        string contentId;
        string message;
        uint256 multiplier;
        bool claimed;
    }

    struct Content {
        string id;
        address creator;
        uint256 totalTips;
        uint256 tipCount;
        uint256 lastTipTime;
        bool active;
    }

    IERC20 public immutable tipToken;
    ISocialReputation public reputation;

    mapping(uint256 => Tip) public tips;
    mapping(string => Content) public contents;
    mapping(address => uint256[]) public userTips;
    mapping(string => uint256[]) public contentTipIds;

    uint256 public nextTipId;
    uint256 public platformFee = 50;
    uint256 public minTipAmount = 1 * 10 ** 18;
    uint256 public maxTipAmount = 1000 * 10 ** 18;
    uint256 public collectedFees;

    mapping(uint256 => uint256) public reputationMultipliers;

    event TipSent(uint256 indexed tipId, address indexed from, address indexed to, uint256 amount);
    event TipClaimed(uint256 indexed tipId, address indexed to, uint256 amount);
    event TipsClaimed(address indexed to, uint256 amount, uint256 fee);
    event ContentRegistered(string contentId, address indexed creator);
    event ContentStatusUpdated(string contentId, bool active);

    error InvalidContent();
    error ContentTaken();
    error InactiveContent();
    error AmountOutOfRange();
    error NotRecipient();
    error AlreadyClaimed();
    error NothingToClaim();
    error FeeTooHigh();

    constructor(address tipToken_, address reputation_, address initialOwner) Ownable(initialOwner) {
        require(tipToken_ != address(0) && reputation_ != address(0), "Zero address");
        tipToken = IERC20(tipToken_);
        reputation = ISocialReputation(reputation_);

        reputationMultipliers[0] = 100;
        reputationMultipliers[500] = 110;
        reputationMultipliers[1000] = 125;
        reputationMultipliers[2000] = 150;
        reputationMultipliers[5000] = 200;
    }

    function registerContent(string calldata contentId) external {
        if (bytes(contentId).length == 0) revert InvalidContent();
        if (contents[contentId].creator != address(0)) revert ContentTaken();

        contents[contentId] = Content({
            id: contentId,
            creator: msg.sender,
            totalTips: 0,
            tipCount: 0,
            lastTipTime: block.timestamp,
            active: true
        });

        emit ContentRegistered(contentId, msg.sender);
    }

    function sendTip(string calldata contentId, uint256 amount, string calldata message) external nonReentrant {
        if (amount < minTipAmount || amount > maxTipAmount) revert AmountOutOfRange();

        Content storage content = contents[contentId];
        if (!content.active) revert InactiveContent();
        if (content.creator == address(0)) revert InvalidContent();

        uint256 reputationScore = reputation.getReputation(msg.sender).score;
        uint256 multiplier = _getMultiplier(reputationScore);

        tipToken.safeTransferFrom(msg.sender, address(this), amount);

        uint256 tipId = nextTipId++;
        tips[tipId] = Tip({
            id: tipId,
            from: msg.sender,
            to: content.creator,
            amount: amount,
            tipTime: block.timestamp,
            contentId: contentId,
            message: message,
            multiplier: multiplier,
            claimed: false
        });

        userTips[msg.sender].push(tipId);
        contentTipIds[contentId].push(tipId);
        content.totalTips += amount;
        content.tipCount++;
        content.lastTipTime = block.timestamp;

        uint256 socialValue = (amount * multiplier) / 100;
        reputation.recordInteractionFor(msg.sender, content.creator, "tip", socialValue, true, contentId);

        emit TipSent(tipId, msg.sender, content.creator, amount);
    }

    function claimTips(uint256[] calldata tipIds) external nonReentrant {
        uint256 totalAmount = 0;
        uint256 feeAmount = 0;

        for (uint256 i = 0; i < tipIds.length; ) {
            Tip storage tip = tips[tipIds[i]];
            if (tip.to != msg.sender) revert NotRecipient();
            if (tip.claimed) revert AlreadyClaimed();

            tip.claimed = true;
            uint256 fee = (tip.amount * platformFee) / 10_000;
            totalAmount += tip.amount - fee;
            feeAmount += fee;
            emit TipClaimed(tipIds[i], msg.sender, tip.amount - fee);
            unchecked {
                ++i;
            }
        }

        if (totalAmount == 0) revert NothingToClaim();

        collectedFees += feeAmount;
        tipToken.safeTransfer(msg.sender, totalAmount);
        emit TipsClaimed(msg.sender, totalAmount, feeAmount);
    }

    function getTip(uint256 tipId) external view returns (Tip memory) {
        return tips[tipId];
    }

    function getUserTips(address user) external view returns (uint256[] memory) {
        return userTips[user];
    }

    function getContent(string calldata contentId) external view returns (Content memory) {
        return contents[contentId];
    }

    function getContentTips(string calldata contentId) external view returns (uint256) {
        return contents[contentId].totalTips;
    }

    function getContentTipIds(string calldata contentId) external view returns (uint256[] memory) {
        return contentTipIds[contentId];
    }

    function setPlatformFee(uint256 fee) external onlyOwner {
        if (fee > 1000) revert FeeTooHigh();
        platformFee = fee;
    }

    function setMinTipAmount(uint256 minAmount) external onlyOwner {
        minTipAmount = minAmount;
    }

    function setMaxTipAmount(uint256 maxAmount) external onlyOwner {
        maxTipAmount = maxAmount;
    }

    function setReputationMultiplier(uint256 threshold, uint256 multiplier) external onlyOwner {
        require(multiplier >= 100, "Multiplier below 1x");
        reputationMultipliers[threshold] = multiplier;
    }

    function setReputation(address reputation_) external onlyOwner {
        require(reputation_ != address(0), "Zero address");
        reputation = ISocialReputation(reputation_);
    }

    function setContentActive(string calldata contentId, bool active) external {
        Content storage content = contents[contentId];
        require(content.creator == msg.sender || msg.sender == owner(), "Not authorized");
        content.active = active;
        emit ContentStatusUpdated(contentId, active);
    }

    function withdrawFees() external onlyOwner {
        uint256 amount = collectedFees;
        require(amount > 0, "No fees");
        collectedFees = 0;
        tipToken.safeTransfer(owner(), amount);
    }

    function _getMultiplier(uint256 score) private view returns (uint256) {
        if (score >= 5000) return reputationMultipliers[5000];
        if (score >= 2000) return reputationMultipliers[2000];
        if (score >= 1000) return reputationMultipliers[1000];
        if (score >= 500) return reputationMultipliers[500];
        return reputationMultipliers[0];
    }
}
