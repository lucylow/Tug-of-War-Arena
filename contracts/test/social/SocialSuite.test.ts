import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const ONE = ethers.parseEther("10");

async function deploySocial() {
  const [owner, alice, bob, carol] = await ethers.getSigners();

  const Token = await ethers.getContractFactory("FriendzoneToken");
  const token = await Token.deploy(owner.address);
  await token.waitForDeployment();

  const NFT = await ethers.getContractFactory("FriendzoneNFT");
  const nft = await NFT.deploy("Friendzone Wearable", "FZNFT", "https://api.friendzone.game/nft/", ONE, owner.address);
  await nft.waitForDeployment();

  const Reputation = await ethers.getContractFactory("SocialReputation");
  const reputation = await Reputation.deploy(owner.address);
  await reputation.waitForDeployment();

  const Tipping = await ethers.getContractFactory("ContentTipping");
  const tipping = await Tipping.deploy(await token.getAddress(), await reputation.getAddress(), owner.address);
  await tipping.waitForDeployment();

  const Market = await ethers.getContractFactory("PredictionMarket");
  const market = await Market.deploy(await token.getAddress(), owner.address);
  await market.waitForDeployment();

  const Staking = await ethers.getContractFactory("SocialStaking");
  const staking = await Staking.deploy(await token.getAddress(), await nft.getAddress(), owner.address);
  await staking.waitForDeployment();
  await staking.createPool("Plaza", 5, 0);

  const Badges = await ethers.getContractFactory("SoulboundBadges");
  const badges = await Badges.deploy("https://api.friendzone.game/badge/", owner.address);
  await badges.waitForDeployment();

  const Chat = await ethers.getContractFactory("DecentralizedChat");
  const chat = await Chat.deploy(await reputation.getAddress(), owner.address);
  await chat.waitForDeployment();

  const Quests = await ethers.getContractFactory("SocialQuests");
  const quests = await Quests.deploy(await reputation.getAddress(), owner.address);
  await quests.waitForDeployment();
  await quests.setBadges(await badges.getAddress());

  const Leaderboard = await ethers.getContractFactory("SocialLeaderboard");
  const leaderboard = await Leaderboard.deploy(await reputation.getAddress(), owner.address);
  await leaderboard.waitForDeployment();

  const Referral = await ethers.getContractFactory("FriendReferral");
  const referral = await Referral.deploy(await token.getAddress(), owner.address);
  await referral.waitForDeployment();

  const DAO = await ethers.getContractFactory("DAOSocialEngagement");
  const dao = await DAO.deploy(await token.getAddress(), owner.address);
  await dao.waitForDeployment();

  await reputation.setOperator(await tipping.getAddress(), true);
  await reputation.setOperator(await quests.getAddress(), true);
  await badges.setOperator(await quests.getAddress(), true);

  const funding = ethers.parseEther("10000");
  await token.transfer(await referral.getAddress(), funding);
  await token.transfer(await staking.getAddress(), funding);
  await token.transfer(await dao.getAddress(), funding);

  for (const player of [alice, bob, carol]) {
    await token.transfer(player.address, ethers.parseEther("1000"));
  }

  return {
    owner,
    alice,
    bob,
    carol,
    token,
    nft,
    reputation,
    tipping,
    market,
    staking,
    badges,
    chat,
    quests,
    leaderboard,
    referral,
    dao,
  };
}

describe("ContentTipping", () => {
  it("registers content, applies reputation multipliers, and pays claims minus fee", async () => {
    const { alice, bob, token, tipping } = await deploySocial();
    await tipping.connect(alice).registerContent("ipfs://crew-clip");
    await token.connect(bob).approve(await tipping.getAddress(), ONE);
    await tipping.connect(bob).sendTip("ipfs://crew-clip", ONE, "nice pull");

    const content = await tipping.getContent("ipfs://crew-clip");
    expect(content.creator).to.equal(alice.address);
    expect(content.totalTips).to.equal(ONE);

    const before = await token.balanceOf(alice.address);
    await tipping.connect(alice).claimTips([0]);
    const fee = (ONE * 50n) / 10_000n;
    expect(await token.balanceOf(alice.address)).to.equal(before + ONE - fee);
  });
});

describe("PredictionMarket", () => {
  it("creates a market, settles yes, and pays the winning side", async () => {
    const { alice, bob, token, market } = await deploySocial();
    await market.connect(alice).createMarket("Sun crew wins Plaza night?", "Crew match", 1);
    await token.connect(alice).approve(await market.getAddress(), ONE);
    await token.connect(bob).approve(await market.getAddress(), ONE);
    await market.connect(alice).placeBet(0, 1, ONE);
    await market.connect(bob).placeBet(0, 2, ONE);

    await time.increase(2 * 24 * 60 * 60);
    await market.connect(alice).resolveMarket(0, 1);

    const before = await token.balanceOf(alice.address);
    await market.connect(alice).claimWinnings(0);
    expect(await token.balanceOf(alice.address)).to.be.gt(before);
    await expect(market.connect(bob).claimWinnings(0)).to.be.revertedWithCustomError(market, "NoWinnings");
  });
});

describe("SocialStaking", () => {
  it("stakes tokens, accrues power, and returns principal on unstake", async () => {
    const { alice, token, staking } = await deploySocial();
    await token.connect(alice).approve(await staking.getAddress(), ONE);
    await staking.connect(alice).stakeTokens(ONE, 0);
    expect(await staking.getTotalGovernancePower(alice.address)).to.be.gt(0n);

    await time.increase(60);
    const pending = await staking.getPendingReward(0);
    expect(pending).to.be.gt(0n);

    const before = await token.balanceOf(alice.address);
    await staking.connect(alice).unstake(0);
    expect(await token.balanceOf(alice.address)).to.be.gte(before + ONE);
  });
});

describe("SoulboundBadges", () => {
  it("awards a badge and blocks transfers", async () => {
    const { owner, alice, bob, badges } = await deploySocial();
    await badges.createBadge("Plaza Regular", "Attend a crew night", 1, "Social", 100);
    await badges.awardBadge(alice.address, 1);
    expect(await badges.hasBadge(1, alice.address)).to.equal(true);
    await expect(
      badges.connect(alice).safeTransferFrom(alice.address, bob.address, 1, 1, "0x"),
    ).to.be.revertedWithCustomError(badges, "Soulbound");
    expect(await badges.getTierName(1)).to.equal("Bronze");
    expect(owner.address).to.not.equal(ethers.ZeroAddress);
  });
});

describe("DecentralizedChat", () => {
  it("sends DMs, creates threads, and honors blocks", async () => {
    const { alice, bob, chat } = await deploySocial();
    await chat.connect(alice).sendMessage(bob.address, "ipfs://hello", false, 0);
    const conversation = await chat.getConversation(alice.address, bob.address);
    expect(conversation.length).to.equal(1);

    const threadId = await chat.connect(alice).createThread.staticCall("Plaza night", "who is pulling?");
    await chat.connect(alice).createThread("Plaza night", "who is pulling?");
    await chat.connect(bob).postToThread(threadId, "moon crew");
    expect((await chat.getThread(threadId)).messageCount).to.equal(2n);

    await chat.connect(bob).blockUser(alice.address);
    await expect(chat.connect(alice).sendMessage(bob.address, "hey", false, 0)).to.be.revertedWithCustomError(
      chat,
      "SenderBlocked",
    );
  });
});

describe("SocialQuests", () => {
  it("accepts, progresses, and claims reputation plus a badge", async () => {
    const { alice, reputation, badges, quests } = await deploySocial();
    await badges.createBadge("Helpful", "Complete a social quest", 2, "Community", 50);
    await quests.createQuest("Follow a crewmate", "Follow 1 player", 0, "follow", 1, 5, 1, 7, 0);
    await quests.connect(alice).acceptQuest(1);
    await quests.updateProgress(alice.address, 1, 1);
    await quests.connect(alice).claimQuest(1);

    expect((await reputation.getReputation(alice.address)).score).to.equal(5n);
    expect(await badges.hasBadge(1, alice.address)).to.equal(true);
  });
});

describe("SocialLeaderboard", () => {
  it("ranks players by combined social score", async () => {
    const { alice, bob, reputation, leaderboard } = await deploySocial();
    await reputation.updateReputation(alice.address, "endorse", true, 0);
    await reputation.updateReputation(alice.address, "endorse", true, 0);
    await reputation.updateReputation(bob.address, "comment", true, 0);
    await leaderboard.addPlayer(alice.address);
    await leaderboard.addPlayer(bob.address);
    await leaderboard.updateLeaderboard();

    const top = await leaderboard.getTopPlayers(2);
    expect(top[0].player).to.equal(alice.address);
    expect(top[0].rank).to.equal(1n);
    expect(top[0].totalScore).to.be.gt(top[1].totalScore);
  });
});

describe("FriendReferral", () => {
  it("accrues tier-1 rewards on bind and pays on claim", async () => {
    const { alice, bob, token, referral } = await deploySocial();
    await referral.connect(bob).setReferrer(alice.address);
    expect(await referral.getReferralCount(alice.address)).to.equal(1n);

    const aliceBefore = await token.balanceOf(alice.address);
    const bobBefore = await token.balanceOf(bob.address);
    await referral.connect(alice).claimRewards();
    await referral.connect(bob).claimRewards();
    expect(await token.balanceOf(alice.address)).to.equal(aliceBefore + ONE);
    expect(await token.balanceOf(bob.address)).to.equal(bobBefore + ONE);
  });
});

describe("DAOSocialEngagement", () => {
  it("records votes, builds a streak, and pays engagement rewards", async () => {
    const { alice, token, dao } = await deploySocial();
    await dao.recordEngagement(alice.address, 0, "vote-1");
    await time.increase(24 * 60 * 60 + 1);
    await dao.recordEngagement(alice.address, 1, "proposal-1");

    const stats = await dao.getMemberStats(alice.address);
    expect(stats.streak).to.equal(2n);
    expect(stats.totalEngagement).to.equal(35n);

    const before = await token.balanceOf(alice.address);
    await dao.connect(alice).claimRewards();
    expect(await token.balanceOf(alice.address)).to.equal(before + ethers.parseEther("3.5"));
  });
});
