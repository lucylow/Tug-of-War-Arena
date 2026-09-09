import { expect } from "chai";
import { ethers } from "hardhat";
import { mine } from "@nomicfoundation/hardhat-network-helpers";

const FEE = ethers.parseEther("10");

async function deploySuite(useMockVrf = false) {
  const [owner, alice, bob, carol] = await ethers.getSigners();

  const Token = await ethers.getContractFactory("FriendzoneToken");
  const fzone = await Token.deploy(owner.address);
  await fzone.waitForDeployment();

  const NFT = await ethers.getContractFactory("FriendzoneNFT");
  const nft = await NFT.deploy("Friendzone Wearable", "FZNFT", "https://api.friendzone.game/nft/", FEE, owner.address);
  await nft.waitForDeployment();

  let vrfAddress = ethers.ZeroAddress;
  let mock: { fulfillWithSeed(requestId: bigint, seed: bigint): Promise<unknown> } | undefined;
  if (useMockVrf) {
    const Mock = await ethers.getContractFactory("MockVRFCoordinator");
    mock = await Mock.deploy();
    await mock.waitForDeployment();
    vrfAddress = await mock.getAddress();
  }

  const Arena = await ethers.getContractFactory("TugOfWarArena");
  const arena = await Arena.deploy(
    await fzone.getAddress(),
    await nft.getAddress(),
    vrfAddress,
    0,
    ethers.ZeroHash,
    owner.address,
  );
  await arena.waitForDeployment();
  await nft.setMinter(await arena.getAddress(), true);

  for (const player of [alice, bob, carol]) {
    await fzone.transfer(player.address, ethers.parseEther("1000"));
    await fzone.connect(player).approve(await arena.getAddress(), ethers.MaxUint256);
  }

  const Badges = await ethers.getContractFactory("FriendzoneBadges");
  const badges = await Badges.deploy("https://api.friendzone.game/badge/", owner.address);
  await badges.waitForDeployment();

  const Guilds = await ethers.getContractFactory("FriendzoneGuilds");
  const guilds = await Guilds.deploy(owner.address);
  await guilds.waitForDeployment();

  const Referrals = await ethers.getContractFactory("FriendzoneReferrals");
  const referrals = await Referrals.deploy(await fzone.getAddress(), owner.address);
  await referrals.waitForDeployment();
  await fzone.transfer(await referrals.getAddress(), ethers.parseEther("1000"));

  const Tournament = await ethers.getContractFactory("TournamentBracket");
  const tournament = await Tournament.deploy(await fzone.getAddress(), await nft.getAddress(), owner.address);
  await tournament.waitForDeployment();

  const DAO = await ethers.getContractFactory("FriendzoneDAO");
  const dao = await DAO.deploy(await fzone.getAddress(), owner.address);
  await dao.waitForDeployment();

  return { owner, alice, bob, carol, fzone, nft, arena, badges, guilds, referrals, tournament, dao, mock };
}

describe("FriendzoneToken", () => {
  it("mints the initial supply under the cap and rejects overflow mint", async () => {
    const { fzone, owner } = await deploySuite();
    expect(await fzone.totalSupply()).to.equal(ethers.parseEther("100000000"));
    await expect(fzone.mint(owner.address, await fzone.MAX_SUPPLY())).to.be.revertedWithCustomError(fzone, "ExceedsMaxSupply");
  });
});

describe("TugOfWarArena", () => {
  it("creates a match, balances Sun/Moon, settles a win, and mints a wearable", async () => {
    const { alice, bob, fzone, nft, arena } = await deploySuite();

    await arena.connect(alice).createMatch("SunCaptain");
    const matchId = 1n;
    await arena.connect(bob).joinMatch(matchId, "MoonPuller");
    await arena.connect(alice).startMatch(matchId);

    const aliceBefore = await fzone.balanceOf(alice.address);
    await arena.settleMatch(matchId, 50, 6);

    const game = await arena.getMatch(matchId);
    expect(game.status).to.equal(2);
    expect(game.winner).to.equal(0);
    expect(game.sunPower).to.equal(50n);
    expect(game.moonPower).to.equal(6n);
    expect(await arena.playerElo(alice.address)).to.equal(10n);
    expect(await arena.playerElo(bob.address)).to.equal(0n);
    expect(await fzone.balanceOf(alice.address)).to.equal(aliceBefore + ethers.parseEther("16"));
    expect(await nft.balanceOf(alice.address)).to.equal(1n);
  });

  it("finishes when operator-relayed power crosses the 44-point threshold", async () => {
    const { alice, bob, arena } = await deploySuite();
    await arena.connect(alice).createMatch("SunCaptain");
    await arena.connect(bob).joinMatch(1n, "MoonPuller");
    await arena.connect(alice).startMatch(1n);

    await arena.updatePower(1n, alice.address, 20);
    await arena.updatePower(1n, alice.address, 20);
    await arena.updatePower(1n, alice.address, 4);

    const game = await arena.getMatch(1n);
    expect(game.status).to.equal(2);
    expect(game.winner).to.equal(0);
  });

  it("refunds the entry fee when a player leaves a waiting lobby", async () => {
    const { alice, bob, fzone, arena } = await deploySuite();
    const before = await fzone.balanceOf(bob.address);
    await arena.connect(alice).createMatch("SunCaptain");
    await arena.connect(bob).joinMatch(1n, "MoonPuller");
    await arena.connect(bob).leaveMatch(1n);
    expect(await fzone.balanceOf(bob.address)).to.equal(before);
    const game = await arena.getMatch(1n);
    expect(game.players.length).to.equal(1);
  });

  it("fulfills async mock VRF and awards a Common wearable for seed 0", async () => {
    const { alice, bob, nft, arena, mock } = await deploySuite(true);
    await arena.connect(alice).createMatch("SunCaptain");
    await arena.connect(bob).joinMatch(1n, "MoonPuller");
    await arena.connect(alice).startMatch(1n);
    await arena.settleMatch(1n, 44, 0);

    expect(await nft.balanceOf(alice.address)).to.equal(0n);
    const requestId = await arena.getMatchVrfRequestId(1n);
    await mock!.fulfillWithSeed(requestId, 0n);
    expect(await nft.balanceOf(alice.address)).to.equal(1n);
    const tokenId = await nft.tokenOfOwnerByIndex(alice.address, 0);
    const data = await nft.nftData(tokenId);
    expect(data.rarity).to.equal(0);
  });
});

describe("FriendzoneNFT", () => {
  it("mints rarity-capped wearables with power bonuses", async () => {
    const { owner, alice, nft } = await deploySuite();
    await nft.mintNFT(alice.address, 5);
    const tokenId = await nft.tokenOfOwnerByIndex(alice.address, 0);
    expect(await nft.getPowerBonus(tokenId)).to.equal(100n);
    expect(await nft.getRarityName(5)).to.equal("Mythic");
    await expect(nft.connect(alice).mintNFT(owner.address, 0)).to.be.revertedWithCustomError(nft, "NotMinter");
  });
});

describe("FriendzoneBadges", () => {
  it("creates and awards an ERC-1155 badge under supply", async () => {
    const { alice, badges } = await deploySuite();
    await badges.createBadge("Seven-Tap Surge", 100);
    await badges.awardBadge(alice.address, 0, 1);
    expect(await badges.balanceOf(alice.address, 0)).to.equal(1n);
    await expect(badges.awardBadge(alice.address, 0, 100)).to.be.revertedWithCustomError(badges, "SupplyExceeded");
  });
});

describe("FriendzoneGuilds", () => {
  it("uses 1-indexed guild ids so zero always means unaffiliated", async () => {
    const { alice, bob, guilds } = await deploySuite();
    expect(await guilds.playerGuild(alice.address)).to.equal(0n);
    await guilds.connect(alice).createGuild("Sun Crew");
    expect(await guilds.playerGuild(alice.address)).to.equal(1n);
    await guilds.connect(bob).joinGuild(1n);
    await guilds.connect(alice).addReputation(1n, bob.address, 25);
    const guild = await guilds.getGuild(1n);
    expect(guild.memberCount).to.equal(2n);
    expect(guild.reputation).to.equal(25n);
  });
});

describe("FriendzoneReferrals", () => {
  it("accrues rewards on bind and pays them only once on claim", async () => {
    const { alice, bob, fzone, referrals } = await deploySuite();
    const before = await fzone.balanceOf(alice.address);
    await referrals.connect(bob).setReferrer(alice.address);
    expect(await referrals.pendingRewards(alice.address)).to.equal(FEE);
    await referrals.connect(alice).claimRewards();
    expect(await fzone.balanceOf(alice.address)).to.equal(before + FEE);
    expect(await referrals.pendingRewards(alice.address)).to.equal(0n);
    await expect(referrals.connect(alice).claimRewards()).to.be.revertedWithCustomError(referrals, "NoRewards");
  });
});

describe("TournamentBracket", () => {
  it("locks wearables, pays the winner, and returns NFTs", async () => {
    const { alice, bob, fzone, nft, tournament } = await deploySuite();
    await nft.mintNFT(alice.address, 2);
    await nft.mintNFT(bob.address, 1);
    const aliceToken = await nft.tokenOfOwnerByIndex(alice.address, 0);
    const bobToken = await nft.tokenOfOwnerByIndex(bob.address, 0);

    await tournament.createTournament("Plaza Sprint", FEE, 4);
    await fzone.connect(alice).approve(await tournament.getAddress(), FEE);
    await fzone.connect(bob).approve(await tournament.getAddress(), FEE);
    await nft.connect(alice).approve(await tournament.getAddress(), aliceToken);
    await nft.connect(bob).approve(await tournament.getAddress(), bobToken);
    await tournament.connect(alice).register(1n, aliceToken);
    await tournament.connect(bob).register(1n, bobToken);
    await tournament.startTournament(1n);

    const before = await fzone.balanceOf(alice.address);
    await tournament.resolveMatch(1n, alice.address);
    expect(await fzone.balanceOf(alice.address)).to.equal(before + FEE * 2n);

    await tournament.returnWearables(1n);
    expect(await nft.ownerOf(aliceToken)).to.equal(alice.address);
    expect(await nft.ownerOf(bobToken)).to.equal(bob.address);
  });
});

describe("FriendzoneDAO", () => {
  it("executes a passed proposal that updates arena entry fee", async () => {
    const { owner, fzone, arena, dao } = await deploySuite();
    await arena.transferOwnership(await dao.getAddress());
    const calldata = arena.interface.encodeFunctionData("setEntryFee", [ethers.parseEther("5")]);
    await dao.createProposal("Lower entry fee to 5 FZONE", await arena.getAddress(), calldata, 10);
    await dao.vote(1n, true);
    await mine(10);
    await dao.executeProposal(1n);
    expect(await arena.entryFee()).to.equal(ethers.parseEther("5"));
    expect(await fzone.balanceOf(owner.address)).to.be.gt(0n);
  });
});
