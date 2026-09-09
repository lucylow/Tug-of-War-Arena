import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

async function deploySuite() {
  const [owner, player, player2, player3, player4] = await ethers.getSigners();
  const Token = await ethers.getContractFactory("FriendzoneToken");
  const token = await Token.deploy(owner.address);
  const XP = await ethers.getContractFactory("ExperienceSystem");
  const xp = await XP.deploy(await token.getAddress());
  const Badges = await ethers.getContractFactory("AchievementBadges");
  const badges = await Badges.deploy("https://api.friendzone.com/badge/");
  const Leaderboard = await ethers.getContractFactory("Leaderboard");
  const leaderboard = await Leaderboard.deploy();
  const NFT = await ethers.getContractFactory("MockERC721");
  const nft = await NFT.deploy();
  const funding = ethers.parseEther("1000000");
  await token.transfer(await xp.getAddress(), funding);
  return { owner, player, player2, player3, player4, token, xp, badges, leaderboard, nft, funding };
}

describe("Gamification suite", function () {
  it("runs quests, badges, and soulbound transfers", async function () {
    const { owner, player, player2, token, xp, badges } = await deploySuite();
    const Quest = await ethers.getContractFactory("QuestSystem");
    const quest = await Quest.deploy(await token.getAddress(), await xp.getAddress());
    await quest.setBadges(await badges.getAddress());
    await xp.setOperator(await quest.getAddress(), true);
    await badges.setOperator(await quest.getAddress(), true);
    await token.transfer(await quest.getAddress(), ethers.parseEther("1000"));

    const badgeId = await badges.createBadge.staticCall("First Pull", "Win your first match", 1, 1000, true);
    await badges.createBadge("First Pull", "Win your first match", 1, 1000, true);

    const questId = await quest.createQuest.staticCall(
      "Win 1",
      "Win a match",
      0,
      0,
      1,
      50,
      ethers.parseEther("10"),
      badgeId,
      7,
      0,
    );
    await quest.createQuest("Win 1", "Win a match", 0, 0, 1, 50, ethers.parseEther("10"), badgeId, 7, 0);

    await quest.connect(player).acceptQuest(questId);
    await quest.updateQuestProgress(player.address, questId, 1);
    await quest.connect(player).claimQuest(questId);

    expect((await xp.getPlayerProgression(player.address)).xp).to.equal(50n);
    expect(await badges.hasBadge(badgeId, player.address)).to.equal(true);
    await expect(
      badges.connect(player).safeTransferFrom(player.address, player2.address, badgeId, 1, "0x"),
    ).to.be.revertedWith("Soulbound: cannot transfer");
    expect(await token.balanceOf(player.address)).to.equal(ethers.parseEther("10"));
    expect(owner.address).to.not.equal(ethers.ZeroAddress);
  });

  it("updates ELO and pays season prizes", async function () {
    const { player, player2, player3, leaderboard } = await deploySuite();
    await leaderboard.recordMatch(player.address, player2.address, false);
    const winner = await leaderboard.getElo(player.address);
    const loser = await leaderboard.getElo(player2.address);
    expect(winner).to.be.gt(1200n);
    expect(loser).to.be.lt(1200n);

    const seasonId = await leaderboard.currentSeasonId();
    await leaderboard.recordMatch(player.address, player3.address, false);
    await leaderboard.endSeason(seasonId);
    await leaderboard.fundSeasonPrize(seasonId, { value: ethers.parseEther("1") });
    await expect(leaderboard.claimSeasonPrize(seasonId)).to.changeEtherBalance(player, ethers.parseEther("0.5"));
  });

  it("stakes NFTs, applies rarity boosts, and respects locks", async function () {
    const { player, token, nft, funding } = await deploySuite();
    const Staking = await ethers.getContractFactory("NFTStakingBoost");
    const staking = await Staking.deploy(await nft.getAddress(), await token.getAddress());
    await token.transfer(await staking.getAddress(), funding);
    await staking.createPool("Plaza", ethers.parseEther("1"), 3600);
    const tokenId = await nft.mint.staticCall(player.address);
    await nft.mint(player.address);
    await nft.connect(player).approve(await staking.getAddress(), tokenId);
    await staking.connect(player).stake(tokenId, 0);
    await expect(staking.connect(player).unstake(tokenId)).to.be.revertedWith("Still locked");
    await time.increase(3600);
    await staking.connect(player).claimRewards(tokenId);
    expect(await token.balanceOf(player.address)).to.be.gt(0n);
    await staking.connect(player).unstake(tokenId);
    expect(await nft.ownerOf(tokenId)).to.equal(player.address);
  });

  it("keeps free and premium battle pass claims per player", async function () {
    const { player, player2, token, badges } = await deploySuite();
    const BattlePass = await ethers.getContractFactory("BattlePass");
    const battlePass = await BattlePass.deploy(await token.getAddress(), await token.getAddress());
    await token.transfer(await battlePass.getAddress(), ethers.parseEther("10000"));
    await battlePass.startSeason("Season Zero", 30, 5, ethers.parseEther("20"));
    await token.transfer(player.address, ethers.parseEther("20"));
    await token.connect(player).approve(await battlePass.getAddress(), ethers.parseEther("20"));
    await battlePass.connect(player).buyPremium(1);
    await battlePass.addXP(1, player.address, 150);
    await battlePass.addXP(1, player2.address, 150);
    await battlePass.connect(player).claimReward(1, 1, false);
    await battlePass.connect(player).claimReward(1, 1, true);
    await battlePass.connect(player2).claimReward(1, 1, false);
    await expect(battlePass.connect(player).claimReward(1, 1, false)).to.be.revertedWith("Already claimed");
    expect(await badges.getAddress()).to.not.equal(ethers.ZeroAddress);
  });

  it("evolves an NFT after enough interactions", async function () {
    const { player } = await deploySuite();
    const Evolution = await ethers.getContractFactory("NFTEvolution");
    const evo = await Evolution.deploy("Friendzone Evolved", "FZNEVO", "https://api.friendzone.com/evo/");
    await evo.addStage(0, 1, "Spark", "Stage 1", 20, 150, 120, "ipfs://spark");
    const tokenId = await evo.mint.staticCall(player.address, 0);
    await evo.mint(player.address, 0);
    await evo.connect(player).interact(tokenId);
    await evo.connect(player).interact(tokenId);
    const data = await evo.getEvolution(tokenId);
    expect(data.stage).to.equal(1n);
    expect(data.xp).to.equal(20n);
  });

  it("resets daily challenges by epoch", async function () {
    const { player, token, xp } = await deploySuite();
    const Challenges = await ethers.getContractFactory("Challenges");
    const challenges = await Challenges.deploy(await token.getAddress(), await xp.getAddress());
    await xp.setOperator(await challenges.getAddress(), true);
    await token.transfer(await challenges.getAddress(), ethers.parseEther("1000"));
    await challenges.connect(player).acceptChallenge(1);
    await challenges.updateChallengeProgress(player.address, 1, 3);
    await challenges.connect(player).claimChallenge(1);
    await expect(challenges.connect(player).claimChallenge(1)).to.be.revertedWith("Already claimed");
    await time.increase(24 * 60 * 60);
    await challenges.connect(player).acceptChallenge(1);
    const pc = await challenges.getPlayerChallenge(player.address, 1);
    expect(pc.progress).to.equal(0n);
    expect(pc.claimed).to.equal(false);
  });

  it("tracks guild wars between crews", async function () {
    const { player, player2, player3, owner } = await deploySuite();
    const extra = await ethers.getSigners();
    const Guilds = await ethers.getContractFactory("GuildWars");
    const guilds = await Guilds.deploy();
    const membersA = [player, extra[5], extra[6]];
    const membersB = [player2, extra[7], extra[8]];
    await guilds.connect(membersA[0]).createGuild("Sun Crew", "SUN");
    await guilds.connect(membersA[1]).joinGuild(1);
    await guilds.connect(membersA[2]).joinGuild(1);
    await guilds.connect(membersB[0]).createGuild("Moon Crew", "MOON");
    await guilds.connect(membersB[1]).joinGuild(2);
    await guilds.connect(membersB[2]).joinGuild(2);
    await guilds.connect(player).declareWar(1, 2);
    await guilds.recordWarScore(1, 1, 10);
    await guilds.recordWarScore(1, 2, 4);
    await guilds.endWar(1);
    expect((await guilds.wars(1)).winnerId).to.equal(1n);
    expect((await guilds.guilds(1)).warsWon).to.equal(1n);
    expect(owner.address).to.equal(await guilds.owner());
    expect(player3.address).to.not.equal(ethers.ZeroAddress);
  });

  it("credits referral rewards with a pull pattern", async function () {
    const { player, player2, token } = await deploySuite();
    const Referral = await ethers.getContractFactory("ReferralSocial");
    const referral = await Referral.deploy(await token.getAddress());
    await token.transfer(await referral.getAddress(), ethers.parseEther("100"));
    await referral.connect(player).setReferrer(player2.address);
    await referral.connect(player).claimReferralRewards();
    await referral.connect(player2).claimReferralRewards();
    expect(await token.balanceOf(player.address)).to.equal(ethers.parseEther("10"));
    expect(await token.balanceOf(player2.address)).to.equal(ethers.parseEther("5"));
    await expect(referral.connect(player).claimReferralRewards()).to.be.revertedWith("No rewards");
  });

  it("opens a loot box from mock VRF randomness", async function () {
    const { player, nft } = await deploySuite();
    const Coordinator = await ethers.getContractFactory("MockVRFCoordinator");
    const coordinator = await Coordinator.deploy();
    const LootBox = await ethers.getContractFactory("LootBoxVRF");
    const lootBox = await LootBox.deploy(
      await nft.getAddress(),
      ethers.parseEther("1"),
      await coordinator.getAddress(),
      1,
      ethers.ZeroHash,
    );
    await lootBox.connect(player).purchaseBox({ value: ethers.parseEther("1") });
    await coordinator.fulfill(1, [12345n]);
    const box = await lootBox.getBox(1);
    expect(box.opened).to.equal(true);
    expect(box.tokenId).to.equal(1n);
    expect(await nft.ownerOf(1)).to.equal(player.address);
  });

  it("runs a two-player ELO tournament to a prize claim", async function () {
    const { player, player2, leaderboard } = await deploySuite();
    await leaderboard.recordMatch(player.address, player2.address, false);
    const Tournament = await ethers.getContractFactory("TournamentELO");
    const tournament = await Tournament.deploy(await leaderboard.getAddress());
    await tournament.createTournament("Plaza Cup", 0, 2, ethers.parseEther("1"));
    await tournament.connect(player).register(1, { value: ethers.parseEther("1") });
    await tournament.connect(player2).register(1, { value: ethers.parseEther("1") });
    await tournament.startTournament(1);
    const matchIds = await tournament.getTournamentMatches(1);
    const game = await tournament.getMatch(matchIds[0]);
    await tournament.reportMatch(matchIds[0], game.playerA, 3, 1);
    await expect(tournament.connect(player).claimPrize(1)).to.changeEtherBalance(player, ethers.parseEther("2"));
  });
});
