import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying gamification suite from", deployer.address);

  const fzoneAddress = process.env.FZONE_ADDRESS;
  const nftAddress = process.env.NFT_CONTRACT;

  const Token = await ethers.getContractFactory("FriendzoneToken");
  const token = fzoneAddress
    ? Token.attach(fzoneAddress)
    : await Token.deploy(deployer.address);
  if (!fzoneAddress) await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("FriendzoneToken:", tokenAddr);

  const XP = await ethers.getContractFactory("ExperienceSystem");
  const xp = await XP.deploy(tokenAddr);
  await xp.waitForDeployment();
  const xpAddr = await xp.getAddress();
  console.log("ExperienceSystem:", xpAddr);

  const Badges = await ethers.getContractFactory("AchievementBadges");
  const badges = await Badges.deploy("https://api.friendzone.com/badge/");
  await badges.waitForDeployment();
  const badgesAddr = await badges.getAddress();
  console.log("AchievementBadges:", badgesAddr);

  const Leaderboard = await ethers.getContractFactory("Leaderboard");
  const leaderboard = await Leaderboard.deploy();
  await leaderboard.waitForDeployment();
  const leaderboardAddr = await leaderboard.getAddress();
  console.log("Leaderboard:", leaderboardAddr);

  const NFT = await ethers.getContractFactory("MockERC721");
  const nft = nftAddress ? NFT.attach(nftAddress) : await NFT.deploy();
  if (!nftAddress) await nft.waitForDeployment();
  const nftAddr = await nft.getAddress();
  console.log("NFT:", nftAddr);

  const Staking = await ethers.getContractFactory("NFTStakingBoost");
  const staking = await Staking.deploy(nftAddr, tokenAddr);
  await staking.waitForDeployment();
  console.log("NFTStakingBoost:", await staking.getAddress());

  const BattlePass = await ethers.getContractFactory("BattlePass");
  const battlePass = await BattlePass.deploy(tokenAddr, tokenAddr);
  await battlePass.waitForDeployment();
  await battlePass.setBadges(badgesAddr);
  console.log("BattlePass:", await battlePass.getAddress());

  const Quest = await ethers.getContractFactory("QuestSystem");
  const quest = await Quest.deploy(tokenAddr, xpAddr);
  await quest.waitForDeployment();
  await quest.setBadges(badgesAddr);
  console.log("QuestSystem:", await quest.getAddress());

  const Challenges = await ethers.getContractFactory("Challenges");
  const challenges = await Challenges.deploy(tokenAddr, xpAddr);
  await challenges.waitForDeployment();
  await challenges.setBadges(badgesAddr);
  console.log("Challenges:", await challenges.getAddress());

  const Guilds = await ethers.getContractFactory("GuildWars");
  const guilds = await Guilds.deploy();
  await guilds.waitForDeployment();
  console.log("GuildWars:", await guilds.getAddress());

  const Referral = await ethers.getContractFactory("ReferralSocial");
  const referral = await Referral.deploy(tokenAddr);
  await referral.waitForDeployment();
  console.log("ReferralSocial:", await referral.getAddress());

  const Evolution = await ethers.getContractFactory("NFTEvolution");
  const evolution = await Evolution.deploy("Friendzone Evolved", "FZNEVO", "https://api.friendzone.com/evo/");
  await evolution.waitForDeployment();
  console.log("NFTEvolution:", await evolution.getAddress());

  const Tournament = await ethers.getContractFactory("TournamentELO");
  const tournament = await Tournament.deploy(leaderboardAddr);
  await tournament.waitForDeployment();
  console.log("TournamentELO:", await tournament.getAddress());

  const Coordinator = await ethers.getContractFactory("MockVRFCoordinator");
  const coordinator = process.env.VRF_COORDINATOR
    ? Coordinator.attach(process.env.VRF_COORDINATOR)
    : await Coordinator.deploy();
  if (!process.env.VRF_COORDINATOR) await coordinator.waitForDeployment();
  const coordinatorAddr = await coordinator.getAddress();

  const LootBox = await ethers.getContractFactory("LootBoxVRF");
  const lootBox = await LootBox.deploy(
    nftAddr,
    ethers.parseEther(process.env.BOX_PRICE || "5"),
    coordinatorAddr,
    BigInt(process.env.SUBSCRIPTION_ID || "1"),
    process.env.KEY_HASH || ethers.ZeroHash,
  );
  await lootBox.waitForDeployment();
  console.log("LootBoxVRF:", await lootBox.getAddress());

  await xp.setOperator(await quest.getAddress(), true);
  await xp.setOperator(await challenges.getAddress(), true);
  await badges.setOperator(await quest.getAddress(), true);
  await badges.setOperator(await challenges.getAddress(), true);
  await badges.setOperator(await battlePass.getAddress(), true);

  const funding = ethers.parseEther("1000000");
  await token.transfer(xpAddr, funding);
  await token.transfer(await quest.getAddress(), funding);
  await token.transfer(await challenges.getAddress(), funding);
  await token.transfer(await battlePass.getAddress(), funding);
  await token.transfer(await referral.getAddress(), funding);
  await token.transfer(await staking.getAddress(), funding);

  await staking.createPool("Plaza Stakes", 1n, 0);

  console.log("Gamification contracts deployed and wired.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
