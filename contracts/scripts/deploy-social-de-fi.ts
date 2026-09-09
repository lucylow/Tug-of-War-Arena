import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Social DeFi & Gamification Suite from", deployer.address);

  const Token = await ethers.getContractFactory("FriendzoneToken");
  const token = process.env.FZONE_ADDRESS
    ? Token.attach(process.env.FZONE_ADDRESS)
    : await Token.deploy(deployer.address);
  if (!process.env.FZONE_ADDRESS) await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("FriendzoneToken:", tokenAddr);

  const BondingCurve = await ethers.getContractFactory("SocialBondingCurve");
  const bondingCurve = await BondingCurve.deploy(tokenAddr, deployer.address);
  await bondingCurve.waitForDeployment();
  console.log("SocialBondingCurve:", await bondingCurve.getAddress());

  const Faction = await ethers.getContractFactory("FactionDeFi");
  const factionDeFi = await Faction.deploy(tokenAddr, tokenAddr, deployer.address);
  await factionDeFi.waitForDeployment();
  console.log("FactionDeFi:", await factionDeFi.getAddress());

  const DAO = await ethers.getContractFactory("GamifiedDAO");
  const gamifiedDAO = await DAO.deploy(tokenAddr, deployer.address);
  await gamifiedDAO.waitForDeployment();
  console.log("GamifiedDAO:", await gamifiedDAO.getAddress());

  const RepStake = await ethers.getContractFactory("ReputationStaking");
  const reputationStaking = await RepStake.deploy(tokenAddr, deployer.address);
  await reputationStaking.waitForDeployment();
  console.log("ReputationStaking:", await reputationStaking.getAddress());

  const CheckIn = await ethers.getContractFactory("CheckInStreak");
  const checkInStreak = await CheckIn.deploy(tokenAddr, deployer.address);
  await checkInStreak.waitForDeployment();
  console.log("CheckInStreak:", await checkInStreak.getAddress());

  const Prediction = await ethers.getContractFactory("SocialPrediction");
  const socialPrediction = await Prediction.deploy(tokenAddr, deployer.address);
  await socialPrediction.waitForDeployment();
  console.log("SocialPrediction:", await socialPrediction.getAddress());

  const Quests = await ethers.getContractFactory("QuestProtocol");
  const questProtocol = await Quests.deploy(tokenAddr, deployer.address);
  await questProtocol.waitForDeployment();
  console.log("QuestProtocol:", await questProtocol.getAddress());

  const Tipping = await ethers.getContractFactory("ContentTippingCurator");
  const contentTipping = await Tipping.deploy(tokenAddr, deployer.address);
  await contentTipping.waitForDeployment();
  console.log("ContentTippingCurator:", await contentTipping.getAddress());

  const Identity = await ethers.getContractFactory("DecentralizedIdentity");
  const identity = await Identity.deploy("https://api.friendzone.game/achievement/", deployer.address);
  await identity.waitForDeployment();
  console.log("DecentralizedIdentity:", await identity.getAddress());

  await questProtocol.setBadges(await identity.getAddress());
  await identity.setOperator(await questProtocol.getAddress(), true);

  const funding = ethers.parseEther("1000000");
  await token.transfer(await checkInStreak.getAddress(), funding);
  await token.transfer(await questProtocol.getAddress(), funding);

  const network = await ethers.provider.getNetwork();
  const payload = {
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    contracts: {
      FriendzoneToken: tokenAddr,
      SocialBondingCurve: await bondingCurve.getAddress(),
      FactionDeFi: await factionDeFi.getAddress(),
      GamifiedDAO: await gamifiedDAO.getAddress(),
      ReputationStaking: await reputationStaking.getAddress(),
      CheckInStreak: await checkInStreak.getAddress(),
      SocialPrediction: await socialPrediction.getAddress(),
      QuestProtocol: await questProtocol.getAddress(),
      ContentTippingCurator: await contentTipping.getAddress(),
      DecentralizedIdentity: await identity.getAddress(),
    },
  };

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `social-defi-${network.chainId}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  console.log("Wrote", file);
  console.log("All social DeFi contracts deployed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
