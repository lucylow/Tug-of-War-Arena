// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";
import {MathUtils} from "../utils/MathUtils.sol";

/**
 * @title ContentTippingCurator
 * @notice Tip registered content. Creators are paid immediately; curators who
 *         discovered the post claim a share of each tip.
 */
contract ContentTippingCurator is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Content {
        string id;
        address creator;
        address curator;
        uint256 totalTips;
        uint256 tipCount;
        uint256 lastTipTime;
        bool active;
        uint256 curatorReward;
    }

    struct Tip {
        uint256 id;
        address from;
        string contentId;
        uint256 amount;
        uint256 tipTime;
        string message;
        bool claimed;
    }

    IERC20 public immutable tipToken;

    mapping(string => Content) public contents;
    mapping(uint256 => Tip) public tips;
    mapping(address => uint256[]) public userTips;

    uint256 public nextTipId;
    uint256 public curatorRewardShare = 1000;
    uint256 public minTipAmount = 1e18;

    event ContentRegistered(string contentId, address indexed creator, address indexed curator);
    event TipSent(uint256 indexed tipId, address indexed from, string contentId, uint256 amount);
    event CuratorRewardClaimed(address indexed curator, string contentId, uint256 amount);
    event ContentToggled(string contentId, bool active);

    error InvalidContent();
    error ContentTaken();
    error InvalidCurator();
    error InactiveContent();
    error AmountBelowMinimum();
    error NotCurator();
    error NoRewards();
    error ShareTooHigh();

    constructor(address tipToken_, address initialOwner) Ownable(initialOwner) {
        require(tipToken_ != address(0), "Zero address");
        tipToken = IERC20(tipToken_);
    }

    function registerContent(string calldata contentId, address curator) external {
        if (bytes(contentId).length == 0) revert InvalidContent();
        if (contents[contentId].creator != address(0)) revert ContentTaken();
        if (curator == address(0)) revert InvalidCurator();

        contents[contentId] = Content({
            id: contentId,
            creator: msg.sender,
            curator: curator,
            totalTips: 0,
            tipCount: 0,
            lastTipTime: block.timestamp,
            active: true,
            curatorReward: 0
        });

        emit ContentRegistered(contentId, msg.sender, curator);
    }

    function sendTip(string calldata contentId, uint256 amount, string calldata message) external nonReentrant {
        if (amount < minTipAmount) revert AmountBelowMinimum();

        Content storage content = contents[contentId];
        if (content.creator == address(0)) revert InvalidContent();
        if (!content.active) revert InactiveContent();

        tipToken.safeTransferFrom(msg.sender, address(this), amount);

        uint256 tipId = nextTipId++;
        tips[tipId] = Tip({
            id: tipId,
            from: msg.sender,
            contentId: contentId,
            amount: amount,
            tipTime: block.timestamp,
            message: message,
            claimed: false
        });
        userTips[msg.sender].push(tipId);

        content.totalTips += amount;
        content.tipCount += 1;
        content.lastTipTime = block.timestamp;

        uint256 curatorCut = MathUtils.pct(amount, curatorRewardShare);
        uint256 creatorPayout = amount - curatorCut;

        if (creatorPayout > 0) {
            tipToken.safeTransfer(content.creator, creatorPayout);
        }
        content.curatorReward += curatorCut;
        tips[tipId].claimed = true;

        emit TipSent(tipId, msg.sender, contentId, amount);
    }

    function claimCuratorReward(string calldata contentId) external nonReentrant {
        Content storage content = contents[contentId];
        if (content.curator != msg.sender) revert NotCurator();
        uint256 reward = content.curatorReward;
        if (reward == 0) revert NoRewards();
        content.curatorReward = 0;
        tipToken.safeTransfer(msg.sender, reward);
        emit CuratorRewardClaimed(msg.sender, contentId, reward);
    }

    function getContent(string calldata contentId) external view returns (Content memory) {
        return contents[contentId];
    }

    function getTip(uint256 tipId) external view returns (Tip memory) {
        return tips[tipId];
    }

    function getUserTips(address user) external view returns (uint256[] memory) {
        return userTips[user];
    }

    function getCuratorReward(string calldata contentId) external view returns (uint256) {
        return contents[contentId].curatorReward;
    }

    function setCuratorRewardShare(uint256 share) external onlyOwner {
        if (share > 5000) revert ShareTooHigh();
        curatorRewardShare = share;
    }

    function setMinTipAmount(uint256 minAmount) external onlyOwner {
        minTipAmount = minAmount;
    }

    function toggleContent(string calldata contentId) external onlyOwner {
        contents[contentId].active = !contents[contentId].active;
        emit ContentToggled(contentId, contents[contentId].active);
    }
}
