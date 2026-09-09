import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Friendzone contracts with", deployer.address);

  const Token = await ethers.getContractFactory("FriendzoneToken");
  const fzone = await Token.deploy(deployer.address);
  await fzone.waitForDeployment();
  console.log("FriendzoneToken:", await fzone.getAddress());

  const NFT = await ethers.getContractFactory("FriendzoneNFT");
  const nft = await NFT.deploy(
    "Friendzone Wearable",
    "FZNFT",
    "https://api.friendzone.game/nft/",
    ethers.parseEther("10"),
    deployer.address,
  );
  await nft.waitForDeployment();
  console.log("FriendzoneNFT:", await nft.getAddress());

  let vrfAddress = process.env.VRF_COORDINATOR || ethers.ZeroAddress;
  const subscriptionId = BigInt(process.env.SUBSCRIPTION_ID || "0");
  const keyHash = (process.env.KEY_HASH as `0x${string}`) || ethers.ZeroHash;

  if (vrfAddress === ethers.ZeroAddress || vrfAddress === "0x...") {
    const Mock = await ethers.getContractFactory("MockVRFCoordinator");
    const mock = await Mock.deploy();
    await mock.waitForDeployment();
    vrfAddress = await mock.getAddress();
    console.log("MockVRFCoordinator:", vrfAddress);
  } else {
    console.log("Using VRF coordinator:", vrfAddress);
  }

  const Arena = await ethers.getContractFactory("TugOfWarArena");
  const arena = await Arena.deploy(
    await fzone.getAddress(),
    await nft.getAddress(),
    vrfAddress,
    subscriptionId,
    keyHash,
    deployer.address,
  );
  await arena.waitForDeployment();
  console.log("TugOfWarArena:", await arena.getAddress());

  await (await nft.setMinter(await arena.getAddress(), true)).wait();

  const Badges = await ethers.getContractFactory("FriendzoneBadges");
  const badges = await Badges.deploy("https://api.friendzone.game/badge/", deployer.address);
  await badges.waitForDeployment();
  console.log("FriendzoneBadges:", await badges.getAddress());

  const Guilds = await ethers.getContractFactory("FriendzoneGuilds");
  const guilds = await Guilds.deploy(deployer.address);
  await guilds.waitForDeployment();
  console.log("FriendzoneGuilds:", await guilds.getAddress());

  const Referrals = await ethers.getContractFactory("FriendzoneReferrals");
  const referrals = await Referrals.deploy(await fzone.getAddress(), deployer.address);
  await referrals.waitForDeployment();
  console.log("FriendzoneReferrals:", await referrals.getAddress());
  await (await fzone.transfer(await referrals.getAddress(), ethers.parseEther("10000"))).wait();

  const Tournament = await ethers.getContractFactory("TournamentBracket");
  const tournament = await Tournament.deploy(await fzone.getAddress(), await nft.getAddress(), deployer.address);
  await tournament.waitForDeployment();
  console.log("TournamentBracket:", await tournament.getAddress());

  const DAO = await ethers.getContractFactory("FriendzoneDAO");
  const dao = await DAO.deploy(await fzone.getAddress(), deployer.address);
  await dao.waitForDeployment();
  console.log("FriendzoneDAO:", await dao.getAddress());

  const Staking = await ethers.getContractFactory("FriendzoneStaking");
  const staking = await Staking.deploy(await nft.getAddress(), await fzone.getAddress(), deployer.address);
  await staking.waitForDeployment();
  console.log("FriendzoneStaking:", await staking.getAddress());
  await (await fzone.transfer(await staking.getAddress(), ethers.parseEther("100000"))).wait();

  const Lending = await ethers.getContractFactory("FriendzoneLending");
  const lending = await Lending.deploy(await nft.getAddress(), await fzone.getAddress(), deployer.address);
  await lending.waitForDeployment();
  console.log("FriendzoneLending:", await lending.getAddress());

  const Battle = await ethers.getContractFactory("FriendzoneBattle");
  const battle = await Battle.deploy(
    await nft.getAddress(),
    await fzone.getAddress(),
    ethers.parseEther("10"),
    vrfAddress,
    subscriptionId,
    keyHash,
    deployer.address,
  );
  await battle.waitForDeployment();
  console.log("FriendzoneBattle:", await battle.getAddress());

  const Breeding = await ethers.getContractFactory("FriendzoneBreeding");
  const breeding = await Breeding.deploy(
    await nft.getAddress(),
    0,
    vrfAddress,
    subscriptionId,
    keyHash,
    deployer.address,
  );
  await breeding.waitForDeployment();
  console.log("FriendzoneBreeding:", await breeding.getAddress());
  await (await nft.setMinter(await breeding.getAddress(), true)).wait();

  const Dynamic = await ethers.getContractFactory("FriendzoneDynamic");
  const dynamicNft = await Dynamic.deploy(
    "Friendzone Dynamic",
    "FZDYN",
    "https://api.friendzone.game/dynamic/",
    deployer.address,
  );
  await dynamicNft.waitForDeployment();
  console.log("FriendzoneDynamic:", await dynamicNft.getAddress());

  const Marketplace = await ethers.getContractFactory("FriendzoneMarketplace");
  const marketplace = await Marketplace.deploy(await fzone.getAddress(), ethers.ZeroAddress, deployer.address);
  await marketplace.waitForDeployment();
  console.log("FriendzoneMarketplace:", await marketplace.getAddress());

  const LootBox = await ethers.getContractFactory("FriendzoneLootBox");
  const lootBox = await LootBox.deploy(
    await nft.getAddress(),
    await fzone.getAddress(),
    ethers.parseEther("10"),
    vrfAddress,
    subscriptionId,
    keyHash,
    deployer.address,
  );
  await lootBox.waitForDeployment();
  console.log("FriendzoneLootBox:", await lootBox.getAddress());
  await (await nft.setMinter(await lootBox.getAddress(), true)).wait();

  const Crafting = await ethers.getContractFactory("FriendzoneCrafting");
  const crafting = await Crafting.deploy(await nft.getAddress(), deployer.address);
  await crafting.waitForDeployment();
  console.log("FriendzoneCrafting:", await crafting.getAddress());
  await (await nft.setMinter(await crafting.getAddress(), true)).wait();

  const Leaderboard = await ethers.getContractFactory("FriendzoneLeaderboard");
  const leaderboard = await Leaderboard.deploy(deployer.address);
  await leaderboard.waitForDeployment();
  console.log("FriendzoneLeaderboard:", await leaderboard.getAddress());

  const network = await ethers.provider.getNetwork();
  const payload = {
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    contracts: {
      FriendzoneToken: await fzone.getAddress(),
      FriendzoneNFT: await nft.getAddress(),
      VRFCoordinator: vrfAddress,
      TugOfWarArena: await arena.getAddress(),
      FriendzoneBadges: await badges.getAddress(),
      FriendzoneGuilds: await guilds.getAddress(),
      FriendzoneReferrals: await referrals.getAddress(),
      TournamentBracket: await tournament.getAddress(),
      FriendzoneDAO: await dao.getAddress(),
      FriendzoneStaking: await staking.getAddress(),
      FriendzoneLending: await lending.getAddress(),
      FriendzoneBattle: await battle.getAddress(),
      FriendzoneBreeding: await breeding.getAddress(),
      FriendzoneDynamic: await dynamicNft.getAddress(),
      FriendzoneMarketplace: await marketplace.getAddress(),
      FriendzoneLootBox: await lootBox.getAddress(),
      FriendzoneCrafting: await crafting.getAddress(),
      FriendzoneLeaderboard: await leaderboard.getAddress(),
    },
  };

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${network.chainId}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  console.log("Wrote", file);
  console.log("All contracts deployed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
