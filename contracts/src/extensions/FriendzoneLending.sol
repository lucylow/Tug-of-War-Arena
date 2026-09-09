// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IFriendzoneNFT} from "../interfaces/IFriendzoneNFT.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";

/**
 * @title FriendzoneLending
 * @notice Escrow-based wearable rentals with ERC-4907-style user assignment.
 */
contract FriendzoneLending is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Rental {
        uint256 tokenId;
        address owner;
        address renter;
        uint256 startTime;
        uint256 endTime;
        uint256 duration;
        uint256 fee;
        uint256 revenueShare;
        bool listed;
        bool active;
        uint256 totalEarned;
    }

    IFriendzoneNFT public immutable nftContract;
    IERC20 public immutable paymentToken;

    mapping(uint256 => Rental) public rentals;

    event RentalListed(uint256 indexed tokenId, address indexed owner, uint256 fee, uint256 duration);
    event RentalCreated(uint256 indexed tokenId, address indexed renter, uint256 endTime);
    event RentalEnded(uint256 indexed tokenId, address indexed owner);
    event RevenueCollected(uint256 indexed tokenId, uint256 amount, uint256 ownerShare);

    error NotOwner();
    error AlreadyListed();
    error NotListed();
    error AlreadyRented();
    error NotAuthorized();
    error RentalNotEnded();
    error InvalidShare();
    error ZeroAddress();
    error NotActive();

    constructor(address nftContract_, address paymentToken_, address initialOwner) Ownable(initialOwner) {
        if (nftContract_ == address(0) || paymentToken_ == address(0)) revert ZeroAddress();
        nftContract = IFriendzoneNFT(nftContract_);
        paymentToken = IERC20(paymentToken_);
    }

    /**
     * @notice Owner escrows the wearable and optionally names an invited renter.
     * @dev Pass `renter = address(0)` to allow anyone to take the listing.
     */
    function rentNFT(
        uint256 tokenId,
        address renter,
        uint256 durationDays,
        uint256 fee,
        uint256 revenueShare
    ) external nonReentrant {
        if (nftContract.ownerOf(tokenId) != msg.sender) revert NotOwner();
        if (rentals[tokenId].listed || rentals[tokenId].active) revert AlreadyListed();
        if (revenueShare > 10_000) revert InvalidShare();
        require(durationDays > 0, "Duration required");

        nftContract.transferFrom(msg.sender, address(this), tokenId);

        rentals[tokenId] = Rental({
            tokenId: tokenId,
            owner: msg.sender,
            renter: renter,
            startTime: 0,
            endTime: 0,
            duration: durationDays * 1 days,
            fee: fee,
            revenueShare: revenueShare,
            listed: true,
            active: false,
            totalEarned: 0
        });

        emit RentalListed(tokenId, msg.sender, fee, durationDays * 1 days);
    }

    function acceptRental(uint256 tokenId) external nonReentrant {
        Rental storage rental = rentals[tokenId];
        if (!rental.listed) revert NotListed();
        if (rental.active) revert AlreadyRented();
        if (rental.renter != address(0) && rental.renter != msg.sender) revert NotAuthorized();

        if (rental.fee > 0) {
            paymentToken.safeTransferFrom(msg.sender, rental.owner, rental.fee);
        }

        rental.renter = msg.sender;
        rental.startTime = block.timestamp;
        rental.endTime = block.timestamp + rental.duration;
        rental.active = true;
        rental.listed = false;

        emit RentalCreated(tokenId, msg.sender, rental.endTime);
    }

    function endRental(uint256 tokenId) external nonReentrant {
        Rental storage rental = rentals[tokenId];
        if (!rental.active && !rental.listed) revert NotListed();
        if (rental.active) {
            if (msg.sender != rental.owner && msg.sender != rental.renter) revert NotAuthorized();
            if (block.timestamp < rental.endTime) revert RentalNotEnded();
        } else if (msg.sender != rental.owner) {
            revert NotAuthorized();
        }

        address tokenOwner = rental.owner;
        delete rentals[tokenId];
        nftContract.transferFrom(address(this), tokenOwner, tokenId);
        emit RentalEnded(tokenId, tokenOwner);
    }

    function collectRevenue(uint256 tokenId, uint256 amount) external nonReentrant {
        Rental storage rental = rentals[tokenId];
        if (!rental.active) revert NotActive();
        if (block.timestamp >= rental.endTime) revert RentalNotEnded();

        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        uint256 ownerShare = (amount * rental.revenueShare) / 10_000;
        uint256 renterShare = amount - ownerShare;

        rental.totalEarned += amount;
        if (ownerShare > 0) paymentToken.safeTransfer(rental.owner, ownerShare);
        if (renterShare > 0) paymentToken.safeTransfer(rental.renter, renterShare);

        emit RevenueCollected(tokenId, amount, ownerShare);
    }

    function userOf(uint256 tokenId) external view returns (address) {
        Rental storage rental = rentals[tokenId];
        if (rental.active && block.timestamp < rental.endTime) return rental.renter;
        return address(0);
    }

    function userExpires(uint256 tokenId) external view returns (uint256) {
        Rental storage rental = rentals[tokenId];
        if (rental.active) return rental.endTime;
        return 0;
    }

    function getRental(uint256 tokenId) external view returns (address renter, uint256 endTime, bool active) {
        Rental storage rental = rentals[tokenId];
        return (rental.renter, rental.endTime, rental.active);
    }
}
