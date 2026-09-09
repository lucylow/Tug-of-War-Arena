import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const FEE = ethers.parseEther("10");

async function deployExtensions() {
  const [owner, alice, bob] = await ethers.getSigners();

  const Token = await ethers.getContractFactory("FriendzoneToken");
  const fzone = await Token.deploy(owner.address);
  await fzone.waitForDeployment();

  const NFT = await ethers.getContractFactory("FriendzoneNFT");
  const nft = await NFT.deploy("Friendzone Wearable", "FZNFT", "https://api.friendzone.game/nft/", FEE, owner.address);
  await nft.waitForDeployment();

  const Staking = await ethers.getContractFactory("FriendzoneStaking");
  const staking = await Staking.deploy(await nft.getAddress(), await fzone.getAddress(), owner.address);
  await staking.waitForDeployment();

  const Lending = await ethers.getContractFactory("FriendzoneLending");
  const lending = await Lending.deploy(await nft.getAddress(), await fzone.getAddress(), owner.address);
  await lending.waitForDeployment();

  const Battle = await ethers.getContractFactory("FriendzoneBattle");
  const battle = await Battle.deploy(
    await nft.getAddress(),
    await fzone.getAddress(),
    FEE,
    ethers.ZeroAddress,
    0,
    ethers.ZeroHash,
    owner.address,
  );
  await battle.waitForDeployment();

  const Breeding = await ethers.getContractFactory("FriendzoneBreeding");
  const breeding = await Breeding.deploy(
    await nft.getAddress(),
    0,
    ethers.ZeroAddress,
    0,
    ethers.ZeroHash,
    owner.address,
  );
  await breeding.waitForDeployment();

  const Dynamic = await ethers.getContractFactory("FriendzoneDynamic");
  const dynamic = await Dynamic.deploy("Friendzone Dynamic", "FZDYN", "https://api.friendzone.game/dynamic/", owner.address);
  await dynamic.waitForDeployment();

  const Marketplace = await ethers.getContractFactory("FriendzoneMarketplace");
  const marketplace = await Marketplace.deploy(await fzone.getAddress(), ethers.ZeroAddress, owner.address);
  await marketplace.waitForDeployment();

  const LootBox = await ethers.getContractFactory("FriendzoneLootBox");
  const lootBox = await LootBox.deploy(
    await nft.getAddress(),
    await fzone.getAddress(),
    FEE,
    ethers.ZeroAddress,
    0,
    ethers.ZeroHash,
    owner.address,
  );
  await lootBox.waitForDeployment();

  const Crafting = await ethers.getContractFactory("FriendzoneCrafting");
  const crafting = await Crafting.deploy(await nft.getAddress(), owner.address);
  await crafting.waitForDeployment();

  const Leaderboard = await ethers.getContractFactory("FriendzoneLeaderboard");
  const leaderboard = await Leaderboard.deploy(owner.address);
  await leaderboard.waitForDeployment();

  await nft.setMinter(await breeding.getAddress(), true);
  await nft.setMinter(await lootBox.getAddress(), true);
  await nft.setMinter(await crafting.getAddress(), true);

  for (const player of [alice, bob]) {
    await fzone.transfer(player.address, ethers.parseEther("1000"));
  }

  await fzone.approve(await staking.getAddress(), ethers.parseEther("10000"));
  await staking.fundRewards(ethers.parseEther("10000"));

  return {
    owner,
    alice,
    bob,
    fzone,
    nft,
    staking,
    lending,
    battle,
    breeding,
    dynamic,
    marketplace,
    lootBox,
    crafting,
    leaderboard,
  };
}

describe("FriendzoneStaking", () => {
  it("locks a wearable, accrues FZONE, and returns it after the lock", async () => {
    const { alice, nft, staking, fzone } = await deployExtensions();
    await nft.mintNFT(alice.address, 0);
    await nft.connect(alice).approve(await staking.getAddress(), 0);
    await staking.createPool("Plaza Band", ethers.parseEther("1"), 3600);
    await staking.connect(alice).stake(0, 0);

    expect(await nft.ownerOf(0)).to.equal(await staking.getAddress());
    await expect(staking.connect(alice).unstake(0)).to.be.revertedWithCustomError(staking, "StillLocked");

    await time.increase(3600);
    expect(await staking.getPendingReward(0)).to.be.gte(ethers.parseEther("3600"));

    const before = await fzone.balanceOf(alice.address);
    await staking.connect(alice).unstake(0);
    expect(await nft.ownerOf(0)).to.equal(alice.address);
    expect(await fzone.balanceOf(alice.address)).to.be.gt(before);
    expect(await staking.getStakerTokens(alice.address)).to.deep.equal([]);
  });
});

describe("FriendzoneLending", () => {
  it("lets a renter pay, use, and return a wearable after expiry", async () => {
    const { alice, bob, nft, lending, fzone } = await deployExtensions();
    await nft.mintNFT(alice.address, 1);
    await nft.connect(alice).approve(await lending.getAddress(), 0);
    await lending.connect(alice).rentNFT(0, ethers.ZeroAddress, 1, FEE, 4000);

    await fzone.connect(bob).approve(await lending.getAddress(), ethers.MaxUint256);
    await lending.connect(bob).acceptRental(0);
    expect(await lending.userOf(0)).to.equal(bob.address);

    await fzone.connect(bob).approve(await lending.getAddress(), ethers.parseEther("100"));
    await expect(lending.connect(bob).collectRevenue(0, ethers.parseEther("100")))
      .to.emit(lending, "RevenueCollected");

    await time.increase(24 * 60 * 60 + 1);
    await lending.connect(alice).endRental(0);
    expect(await nft.ownerOf(0)).to.equal(alice.address);
    expect(await lending.userOf(0)).to.equal(ethers.ZeroAddress);
  });
});

describe("FriendzoneBattle", () => {
  it("escrows two wearables and pays the VRF winner both entry fees", async () => {
    const { alice, bob, nft, battle, fzone } = await deployExtensions();
    await nft.mintNFT(alice.address, 2);
    await nft.mintNFT(bob.address, 2);
    await nft.connect(alice).approve(await battle.getAddress(), 0);
    await nft.connect(bob).approve(await battle.getAddress(), 1);
    await fzone.connect(alice).approve(await battle.getAddress(), FEE);
    await fzone.connect(bob).approve(await battle.getAddress(), FEE);

    await battle.connect(alice).createBattle(0);
    const aliceBefore = await fzone.balanceOf(alice.address);
    const bobBefore = await fzone.balanceOf(bob.address);
    await battle.connect(bob).acceptBattle(1, 1);

    expect(await nft.ownerOf(0)).to.equal(alice.address);
    expect(await nft.ownerOf(1)).to.equal(bob.address);

    const resolved = await battle.battles(1);
    expect(resolved.resolved).to.equal(true);
    const prizeWentToAlice = (await fzone.balanceOf(alice.address)) === aliceBefore + FEE * 2n;
    const prizeWentToBob = (await fzone.balanceOf(bob.address)) === bobBefore + FEE;
    expect(prizeWentToAlice || prizeWentToBob).to.equal(true);
  });
});

describe("FriendzoneBreeding", () => {
  it("returns parents and mints a child whose rarity sits near the parents", async () => {
    const { alice, nft, breeding } = await deployExtensions();
    await nft.mintNFT(alice.address, 2);
    await nft.mintNFT(alice.address, 2);
    await nft.connect(alice).approve(await breeding.getAddress(), 0);
    await nft.connect(alice).approve(await breeding.getAddress(), 1);

    await breeding.connect(alice).initiateBreeding(0, 1);
    expect(await nft.ownerOf(0)).to.equal(alice.address);
    expect(await nft.ownerOf(1)).to.equal(alice.address);
    expect(await nft.ownerOf(2)).to.equal(alice.address);

    const childRarity = await nft.getRarity(2);
    expect(childRarity).to.be.within(1, 3);
  });
});

describe("FriendzoneDynamic", () => {
  it("levels up from interactions and advances stage on keeper upkeep", async () => {
    const { alice, dynamic } = await deployExtensions();
    await dynamic.mint(alice.address);
    await dynamic.setStageURI(1, "stage-1.json");
    await dynamic.setUpdateInterval(60);

    for (let i = 0; i < 10; i++) {
      await dynamic.connect(alice).interact(0);
    }

    const state = await dynamic.nftStates(0);
    expect(state.level).to.equal(2n);
    expect(state.stage).to.equal(1n);

    await time.increase(60);
    const [needed, data] = await dynamic.checkUpkeep("0x");
    expect(needed).to.equal(true);
    await dynamic.performUpkeep(data);
    expect((await dynamic.nftStates(0)).power).to.be.gt(state.power);
    expect(await dynamic.tokenURI(0)).to.contain("stage-1.json");
  });
});

describe("FriendzoneMarketplace", () => {
  it("splits protocol fee and royalty when a listing sells in FZONE", async () => {
    const { owner, alice, bob, nft, marketplace, fzone } = await deployExtensions();
    await nft.mintNFT(alice.address, 0);
    await nft.connect(alice).approve(await marketplace.getAddress(), 0);
    const price = ethers.parseEther("100");
    await marketplace.connect(alice).createListing(await nft.getAddress(), 0, price);

    await fzone.connect(bob).approve(await marketplace.getAddress(), price);
    const ownerBefore = await fzone.balanceOf(owner.address);
    const aliceBefore = await fzone.balanceOf(alice.address);
    await marketplace.connect(bob).buyListing(0);

    expect(await nft.ownerOf(0)).to.equal(bob.address);
    expect(await fzone.balanceOf(owner.address) - ownerBefore).to.equal(ethers.parseEther("7.5"));
    expect(await fzone.balanceOf(alice.address) - aliceBefore).to.equal(ethers.parseEther("92.5"));
  });
});

describe("FriendzoneLootBox", () => {
  it("spends FZONE and mints a wearable from the VRF rarity table", async () => {
    const { alice, nft, lootBox, fzone } = await deployExtensions();
    await fzone.connect(alice).approve(await lootBox.getAddress(), FEE);
    await lootBox.connect(alice).purchaseBox();
    expect(await nft.balanceOf(alice.address)).to.equal(1n);
    const box = await lootBox.boxes(1);
    expect(box.opened).to.equal(true);
    expect(box.owner).to.equal(alice.address);
  });
});

describe("FriendzoneCrafting", () => {
  it("burns matching ingredients and mints the recipe result", async () => {
    const { alice, nft, crafting } = await deployExtensions();
    await crafting.addRecipe("Rare fusion", [0, 0], 2);
    await nft.mintNFT(alice.address, 0);
    await nft.mintNFT(alice.address, 0);
    await crafting.connect(alice).craft(0, [0, 1]);
    await expect(nft.ownerOf(0)).to.be.reverted;
    await expect(nft.ownerOf(1)).to.be.reverted;
    expect(await nft.ownerOf(2)).to.equal(alice.address);
    expect(await nft.getRarity(2)).to.equal(2);
  });
});

describe("FriendzoneLeaderboard", () => {
  it("ranks players without underflowing a losing record", async () => {
    const { owner, alice, bob, leaderboard } = await deployExtensions();
    await leaderboard.updateScore(alice.address, 5, 1);
    await leaderboard.updateScore(bob.address, 2, 0);
    await leaderboard.updateScore(owner.address, 1, 10);

    const [players, scores] = await leaderboard.getTopPlayers(2);
    expect(players[0]).to.equal(alice.address);
    expect(scores[0]).to.equal(45n);
    expect(players[1]).to.equal(bob.address);

    const ownerScore = await leaderboard.getPlayerScore(owner.address);
    expect(ownerScore.score).to.equal(0n);
    expect(await leaderboard.playerCount()).to.equal(2n);
  });
});
