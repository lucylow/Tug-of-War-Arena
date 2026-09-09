import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Social Features Suite from", deployer.address);

  const Token = await ethers.getContractFactory("FriendzoneToken");
  const token = process.env.FZONE_ADDRESS
    ? Token.attach(process.env.FZONE_ADDRESS)
    : await Token.deploy(deployer.address);
  if (!process.env.FZONE_ADDRESS) await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("FriendzoneToken:", tokenAddr);

  const NFT = await ethers.getContractFactory("FriendzoneNFT");
  const nft = process.env.NFT_CONTRACT
    ? NFT.attach(process.env.NFT_CONTRACT)
    : await NFT.deploy("Friendzone Wearable", "FZNFT", "https://api.friendzone.game/nft/", ethers.parseEther("10"), deployer.address);
  if (!process.env.NFT_CONTRACT) await nft.waitForDeployment();
  const nftAddr = await nft.getAddress();
  console.log("FriendzoneNFT:", nftAddr);

  const Reputation = await ethers.getContractFactory("SocialReputation");
  const reputation = await Reputation.deploy(deployer.address);
  await reputation.waitForDeployment();
  const reputationAddr = await reputation.getAddress();
  console.log("SocialReputation:", reputationAddr);

  const Tipping = await ethers.getContractFactory("ContentTipping");
  const tipping = await Tipping.deploy(tokenAddr, reputationAddr, deployer.address);
  await tipping.waitForDeployment();
  console.log("ContentTipping:", await tipping.getAddress());

  const Market = await ethers.getContractFactory("PredictionMarket");
  const market = await Market.deploy(tokenAddr, deployer.address);
  await market.waitForDeployment();
  console.log("PredictionMarket:", await market.getAddress());

  const Staking = await ethers.getContractFactory("SocialStaking");
  const staking = await Staking.deploy(tokenAddr, nftAddr, deployer.address);
  await staking.waitForDeployment();
  await staking.createPool("Plaza Social Stake", 5, 0);
  console.log("SocialStaking:", await staking.getAddress());

  const Badges = await ethers.getContractFactory("SoulboundBadges");
  const badges = await Badges.deploy("https://api.friendzone.game/badge/", deployer.address);
  await badges.waitForDeployment();
  console.log("SoulboundBadges:", await badges.getAddress());

  const Chat = await ethers.getContractFactory("DecentralizedChat");
  const chat = await Chat.deploy(reputationAddr, deployer.address);
  await chat.waitForDeployment();
  console.log("DecentralizedChat:", await chat.getAddress());

  const Quests = await ethers.getContractFactory("SocialQuests");
  const quests = await Quests.deploy(reputationAddr, deployer.address);
  await quests.waitForDeployment();
  await quests.setBadges(await badges.getAddress());
  console.log("SocialQuests:", await quests.getAddress());

  const Leaderboard = await ethers.getContractFactory("SocialLeaderboard");
  const leaderboard = await Leaderboard.deploy(reputationAddr, deployer.address);
  await leaderboard.waitForDeployment();
  console.log("SocialLeaderboard:", await leaderboard.getAddress());

  const Referral = await ethers.getContractFactory("FriendReferral");
  const referral = await Referral.deploy(tokenAddr, deployer.address);
  await referral.waitForDeployment();
  console.log("FriendReferral:", await referral.getAddress());

  const DAO = await ethers.getContractFactory("DAOSocialEngagement");
  const dao = await DAO.deploy(tokenAddr, deployer.address);
  await dao.waitForDeployment();
  console.log("DAOSocialEngagement:", await dao.getAddress());

  await reputation.setOperator(await tipping.getAddress(), true);
  await reputation.setOperator(await quests.getAddress(), true);
  await badges.setOperator(await quests.getAddress(), true);

  const funding = ethers.parseEther("1000000");
  await token.transfer(await referral.getAddress(), funding);
  await token.transfer(await staking.getAddress(), funding);
  await token.transfer(await dao.getAddress(), funding);

  const network = await ethers.provider.getNetwork();
  const payload = {
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    contracts: {
      FriendzoneToken: tokenAddr,
      FriendzoneNFT: nftAddr,
      SocialReputation: reputationAddr,
      ContentTipping: await tipping.getAddress(),
      PredictionMarket: await market.getAddress(),
      SocialStaking: await staking.getAddress(),
      SoulboundBadges: await badges.getAddress(),
      DecentralizedChat: await chat.getAddress(),
      SocialQuests: await quests.getAddress(),
      SocialLeaderboard: await leaderboard.getAddress(),
      FriendReferral: await referral.getAddress(),
      DAOSocialEngagement: await dao.getAddress(),
    },
  };

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `social-${network.chainId}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  console.log("Wrote", file);
  console.log("All social contracts deployed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
