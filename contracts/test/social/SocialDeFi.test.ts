import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const TEN = ethers.parseEther("10");
const WEEK = 7 * 24 * 60 * 60;

async function deploySuite() {
  const [owner, alice, bob, carol] = await ethers.getSigners();

  const Token = await ethers.getContractFactory("FriendzoneToken");
  const token = await Token.deploy(owner.address);
  await token.waitForDeployment();

  const Bonding = await ethers.getContractFactory("SocialBondingCurve");
  const bonding = await Bonding.deploy(await token.getAddress(), owner.address);
  await bonding.waitForDeployment();

  const Faction = await ethers.getContractFactory("FactionDeFi");
  const factionDeFi = await Faction.deploy(await token.getAddress(), await token.getAddress(), owner.address);
  await factionDeFi.waitForDeployment();

  const DAO = await ethers.getContractFactory("GamifiedDAO");
  const dao = await DAO.deploy(await token.getAddress(), owner.address);
  await dao.waitForDeployment();

  const Rep = await ethers.getContractFactory("ReputationStaking");
  const reputationStaking = await Rep.deploy(await token.getAddress(), owner.address);
  await reputationStaking.waitForDeployment();

  const CheckIn = await ethers.getContractFactory("CheckInStreak");
  const checkIn = await CheckIn.deploy(await token.getAddress(), owner.address);
  await checkIn.waitForDeployment();

  const Prediction = await ethers.getContractFactory("SocialPrediction");
  const prediction = await Prediction.deploy(await token.getAddress(), owner.address);
  await prediction.waitForDeployment();

  const Quests = await ethers.getContractFactory("QuestProtocol");
  const quests = await Quests.deploy(await token.getAddress(), owner.address);
  await quests.waitForDeployment();

  const Tipping = await ethers.getContractFactory("ContentTippingCurator");
  const tipping = await Tipping.deploy(await token.getAddress(), owner.address);
  await tipping.waitForDeployment();

  const Identity = await ethers.getContractFactory("DecentralizedIdentity");
  const identity = await Identity.deploy("https://api.friendzone.game/achievement/", owner.address);
  await identity.waitForDeployment();

  await quests.setBadges(await identity.getAddress());
  await identity.setOperator(await quests.getAddress(), true);

  await token.transfer(await checkIn.getAddress(), ethers.parseEther("100000"));
  await token.transfer(await quests.getAddress(), ethers.parseEther("100000"));

  for (const player of [alice, bob, carol]) {
    await token.transfer(player.address, ethers.parseEther("10000"));
  }

  return {
    owner,
    alice,
    bob,
    carol,
    token,
    bonding,
    factionDeFi,
    dao,
    reputationStaking,
    checkIn,
    prediction,
    quests,
    tipping,
    identity,
  };
}

describe("FactionDeFi", function () {
  it("registers players, accepts deposits, and accrues faction points over time", async function () {
    const { alice, bob, token, factionDeFi } = await deploySuite();

    await factionDeFi.connect(alice).register(0);
    await factionDeFi.connect(bob).register(1);

    const p1 = await factionDeFi.getPlayer(alice.address);
    const p2 = await factionDeFi.getPlayer(bob.address);
    expect(p1.faction).to.equal(0);
    expect(p2.faction).to.equal(1);

    await token.connect(alice).approve(await factionDeFi.getAddress(), TEN);
    await factionDeFi.connect(alice).deposit(TEN);
    expect((await factionDeFi.getPlayer(alice.address)).depositAmount).to.equal(TEN);

    await time.increase(3600);
    expect(await factionDeFi.getFactionPoints(0)).to.be.gt(0);
  });

  it("pays the winning faction from a funded prize pool without touching deposits", async function () {
    const { owner, alice, bob, token, factionDeFi } = await deploySuite();
    await factionDeFi.connect(alice).register(0);
    await factionDeFi.connect(bob).register(1);

    await token.connect(alice).approve(await factionDeFi.getAddress(), TEN);
    await factionDeFi.connect(alice).deposit(TEN);

    const prize = ethers.parseEther("100");
    await token.connect(owner).approve(await factionDeFi.getAddress(), prize);
    await factionDeFi.fundPrizePool(prize);

    await time.increase(4 * 24 * 60 * 60 + 1);
    await factionDeFi.resolveEpoch();

    const aliceDepositBefore = (await factionDeFi.getPlayer(alice.address)).depositAmount;
    await factionDeFi.connect(alice).claimRewards();
    await factionDeFi.connect(alice).withdrawRewards();

    expect((await factionDeFi.getPlayer(alice.address)).depositAmount).to.equal(aliceDepositBefore);
    expect((await factionDeFi.getPlayer(alice.address)).totalEarned).to.be.gt(0);
    await expect(factionDeFi.connect(bob).claimRewards()).to.be.revertedWithCustomError(factionDeFi, "NotAWinner");
  });
});

describe("SocialBondingCurve", function () {
  it("seeds a community, buys along the curve, and sells back into reserve", async function () {
    const { alice, bob, token, bonding } = await deploySuite();
    const seed = 5n;
    const seedCost = await bonding.getBuyPrice(0, seed);
    await token.connect(alice).approve(await bonding.getAddress(), seedCost + ethers.parseEther("50"));
    await bonding.connect(alice).createCommunity("Moon Crew", seed, 100, 100);

    const community = await bonding.getCommunity(0);
    expect(community.creator).to.equal(alice.address);
    expect(community.supply).to.equal(seed);

    const buyCost = await bonding.getBuyPrice(0, 2n);
    await token.connect(bob).approve(await bonding.getAddress(), buyCost);
    await bonding.connect(bob).buyTokens(0, 2n);
    expect((await bonding.getHolding(0, bob.address)).amount).to.equal(2n);

    const before = await token.balanceOf(bob.address);
    await bonding.connect(bob).sellTokens(0, 1n);
    expect(await token.balanceOf(bob.address)).to.be.gt(before);
    expect((await bonding.getHolding(0, bob.address)).amount).to.equal(1n);
  });
});

describe("GamifiedDAO", function () {
  it("lets voters buy weight and pays the winning side", async function () {
    const { alice, bob, token, dao } = await deploySuite();
    await dao.connect(alice).createProposal("Open night plaza", "Keep the rope out");

    await token.connect(alice).approve(await dao.getAddress(), TEN);
    await token.connect(bob).approve(await dao.getAddress(), TEN);
    await dao.connect(alice).vote(0, true, 3n);
    await dao.connect(bob).vote(0, false, 1n);

    await time.increase(7 * 24 * 60 * 60 + 1);
    await dao.resolveProposal(0);
    expect((await dao.getProposal(0)).status).to.equal(1);

    await dao.connect(alice).claimReward(0);
    const before = await token.balanceOf(alice.address);
    await dao.connect(alice).withdrawRewards();
    expect(await token.balanceOf(alice.address)).to.be.gt(before);
    await dao.connect(bob).claimReward(0);
    expect(await dao.getPendingRewards(bob.address)).to.equal(0n);
  });
});

describe("ReputationStaking", function () {
  it("stakes with a lock multiplier, accrues XP, and returns principal after unlock", async function () {
    const { alice, token, reputationStaking } = await deploySuite();
    await token.connect(alice).approve(await reputationStaking.getAddress(), TEN);
    await reputationStaking.connect(alice).stake(TEN, WEEK);

    const rep = await reputationStaking.getReputation(alice.address);
    expect(rep.stakedAmount).to.equal(TEN);
    expect(rep.xp).to.be.gt(0);
    expect(rep.level).to.be.gte(1);

    await expect(reputationStaking.connect(alice).unstake(0)).to.be.revertedWithCustomError(
      reputationStaking,
      "StillLocked",
    );

    await time.increase(WEEK + 1);
    const before = await token.balanceOf(alice.address);
    await reputationStaking.connect(alice).unstake(0);
    expect(await token.balanceOf(alice.address)).to.equal(before + TEN);
  });
});

describe("CheckInStreak", function () {
  it("pays escalating daily rewards and keeps a 48h streak window", async function () {
    const { alice, token, checkIn } = await deploySuite();
    const before = await token.balanceOf(alice.address);
    await checkIn.connect(alice).checkIn();
    expect(await token.balanceOf(alice.address)).to.be.gt(before);
    await expect(checkIn.connect(alice).checkIn()).to.be.revertedWithCustomError(checkIn, "AlreadyCheckedInToday");

    await time.increase(24 * 60 * 60 + 1);
    await checkIn.connect(alice).checkIn();
    const [streak] = await checkIn.getCheckIn(alice.address);
    expect(streak).to.equal(2n);
  });
});

describe("SocialPrediction", function () {
  it("settles a market, pays winners, and ranks by points", async function () {
    const { alice, bob, token, prediction } = await deploySuite();
    await prediction.connect(alice).createPrediction("Sun crew holds Plaza?", "Night match", 1);

    await token.connect(alice).approve(await prediction.getAddress(), TEN);
    await token.connect(bob).approve(await prediction.getAddress(), TEN);
    await prediction.connect(alice).placeBet(0, true, TEN);
    await prediction.connect(bob).placeBet(0, false, TEN);

    await time.increase(2 * 24 * 60 * 60);
    await prediction.connect(alice).resolvePrediction(0, 1);

    const before = await token.balanceOf(alice.address);
    await prediction.connect(alice).claimWinnings(0);
    expect(await token.balanceOf(alice.address)).to.be.gt(before);
    await expect(prediction.connect(bob).claimWinnings(0)).to.be.revertedWithCustomError(prediction, "NoWinnings");

    const [users, points] = await prediction.getLeaderboard(2);
    expect(users[0]).to.equal(alice.address);
    expect(points[0]).to.be.gt(0n);
  });
});

describe("QuestProtocol", function () {
  it("progresses a quest and pays tokens plus a soulbound achievement", async function () {
    const { alice, quests, identity } = await deploySuite();
    await identity.createAchievement("Crew Helper", "Finish a social quest", 2, "Community", 50, true);
    await quests.createQuest("Follow a crewmate", "Follow 1 player", 0, "follow", 1, TEN, 1, false, 0, 7);

    await quests.progressQuest(0, alice.address, 1);
    expect(await quests.isCompleted(0, alice.address)).to.equal(true);

    const token = await ethers.getContractAt("FriendzoneToken", await quests.rewardToken());
    const before = await token.balanceOf(alice.address);
    await quests.connect(alice).claimReward(0);
    expect(await token.balanceOf(alice.address)).to.equal(before + TEN);
    expect(await identity.hasAchievement_(1, alice.address)).to.equal(true);
  });
});

describe("ContentTippingCurator", function () {
  it("pays the creator immediately and lets the curator claim their share", async function () {
    const { alice, bob, carol, token, tipping } = await deploySuite();
    await tipping.connect(alice).registerContent("ipfs://plaza-clip", bob.address);

    const aliceBefore = await token.balanceOf(alice.address);
    await token.connect(carol).approve(await tipping.getAddress(), TEN);
    await tipping.connect(carol).sendTip("ipfs://plaza-clip", TEN, "insane pull");

    const curatorCut = (TEN * 1000n) / 10_000n;
    expect(await token.balanceOf(alice.address)).to.equal(aliceBefore + TEN - curatorCut);
    expect(await tipping.getCuratorReward("ipfs://plaza-clip")).to.equal(curatorCut);

    const bobBefore = await token.balanceOf(bob.address);
    await tipping.connect(bob).claimCuratorReward("ipfs://plaza-clip");
    expect(await token.balanceOf(bob.address)).to.equal(bobBefore + curatorCut);
  });
});

describe("DecentralizedIdentity", function () {
  it("stores a profile, awards a soulbound badge, and blocks transfers", async function () {
    const { owner, alice, bob, identity } = await deploySuite();
    await identity.connect(alice).updateProfile("Alice", "Sun crew", "ipfs://avatar", ["https://x.com/alice"]);
    expect((await identity.getProfile(alice.address)).name).to.equal("Alice");

    await identity.createAchievement("First Pull", "Join a match", 1, "Social", 100, true);
    await identity.awardAchievement(alice.address, 1);
    expect(await identity.hasAchievement_(1, alice.address)).to.equal(true);
    await expect(
      identity.connect(alice).safeTransferFrom(alice.address, bob.address, 1, 1, "0x"),
    ).to.be.revertedWithCustomError(identity, "Soulbound");
    expect(await identity.getTierName(1)).to.equal("Bronze");
    expect(owner.address).to.not.equal(ethers.ZeroAddress);
  });
});
