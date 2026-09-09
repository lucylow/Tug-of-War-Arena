// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IAggregatorV3} from "../interfaces/IAggregatorV3.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";

/**
 * @title FriendzoneMarketplace
 * @notice FZONE NFT marketplace with protocol fee, royalty split, and optional USD price feed.
 */
contract FriendzoneMarketplace is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Listing {
        uint256 id;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
        uint256 createdAt;
    }

    IERC20 public immutable paymentToken;
    IAggregatorV3 public priceFeed;

    mapping(uint256 => Listing) public listings;
    uint256 public nextListingId;
    uint256 public marketplaceFee = 250;
    uint256 public royaltyFee = 500;
    address public royaltyReceiver;

    event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 tokenId, uint256 price);
    event ListingSold(uint256 indexed listingId, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed listingId);
    event FeesUpdated(uint256 marketplaceFee, uint256 royaltyFee);

    error InvalidPrice();
    error ListingInactive();
    error NotSeller();
    error FeeTooHigh();
    error ZeroAddress();

    constructor(address paymentToken_, address priceFeed_, address initialOwner) Ownable(initialOwner) {
        if (paymentToken_ == address(0)) revert ZeroAddress();
        paymentToken = IERC20(paymentToken_);
        priceFeed = IAggregatorV3(priceFeed_);
        royaltyReceiver = initialOwner;
    }

    function setPriceFeed(address feed) external onlyOwner {
        priceFeed = IAggregatorV3(feed);
    }

    function setRoyaltyReceiver(address receiver) external onlyOwner {
        if (receiver == address(0)) revert ZeroAddress();
        royaltyReceiver = receiver;
    }

    function setFees(uint256 marketplaceFeeBps, uint256 royaltyFeeBps) external onlyOwner {
        if (marketplaceFeeBps + royaltyFeeBps > 2_000) revert FeeTooHigh();
        marketplaceFee = marketplaceFeeBps;
        royaltyFee = royaltyFeeBps;
        emit FeesUpdated(marketplaceFeeBps, royaltyFeeBps);
    }

    function createListing(address nftContract, uint256 tokenId, uint256 price) external nonReentrant returns (uint256 listingId) {
        if (price == 0) revert InvalidPrice();
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        listingId = nextListingId;
        unchecked {
            ++nextListingId;
        }

        listings[listingId] = Listing({
            id: listingId,
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true,
            createdAt: block.timestamp
        });

        emit ListingCreated(listingId, msg.sender, tokenId, price);
    }

    function buyListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        if (!listing.active) revert ListingInactive();

        uint256 priceInToken = _getPriceInToken(listing.price);
        paymentToken.safeTransferFrom(msg.sender, address(this), priceInToken);

        uint256 marketplaceAmount = (priceInToken * marketplaceFee) / 10_000;
        uint256 royaltyAmount = (priceInToken * royaltyFee) / 10_000;
        uint256 sellerAmount = priceInToken - marketplaceAmount - royaltyAmount;

        if (marketplaceAmount > 0) paymentToken.safeTransfer(owner(), marketplaceAmount);
        if (royaltyAmount > 0) paymentToken.safeTransfer(royaltyReceiver, royaltyAmount);
        paymentToken.safeTransfer(listing.seller, sellerAmount);

        listing.active = false;
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);

        emit ListingSold(listingId, msg.sender, listing.price);
    }

    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        if (listing.seller != msg.sender) revert NotSeller();
        if (!listing.active) revert ListingInactive();

        listing.active = false;
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        emit ListingCancelled(listingId);
    }

    function getTokenPrice(uint256 priceUsdCents) external view returns (uint256) {
        return _getPriceInToken(priceUsdCents);
    }

    function _getPriceInToken(uint256 price) private view returns (uint256) {
        if (address(priceFeed) == address(0)) {
            return price;
        }
        (, int256 answer,,,) = priceFeed.latestRoundData();
        if (answer <= 0) revert InvalidPrice();
        return (price * 1e18 * 1e8) / (uint256(answer) * 100);
    }
}
