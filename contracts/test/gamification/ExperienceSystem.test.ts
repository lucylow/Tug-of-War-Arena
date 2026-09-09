import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ExperienceSystem", function () {
  let xp: any;
  let token: any;
  let owner: HardhatEthersSigner;
  let player: HardhatEthersSigner;
  let player2: HardhatEthersSigner;

  beforeEach(async () => {
    [owner, player, player2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("FriendzoneToken");
    token = await Token.deploy(owner.address);
    await token.waitForDeployment();

    const XP = await ethers.getContractFactory("ExperienceSystem");
    xp = await XP.deploy(await token.getAddress());
    await xp.waitForDeployment();
    await token.transfer(await xp.getAddress(), ethers.parseEther("100000"));
  });

  it("should add XP to a player", async function () {
    await xp.addXP(player.address, 50, "Test");
    const progression = await xp.getPlayerProgression(player.address);
    expect(progression.xp).to.equal(50n);
    expect(progression.level).to.equal(1n);
  });

  it("should level up and pay the level reward", async function () {
    const before = await token.balanceOf(player.address);
    await xp.addXP(player.address, 100, "Test");
    const progression = await xp.getPlayerProgression(player.address);
    expect(progression.level).to.equal(2n);
    expect(await token.balanceOf(player.address)).to.equal(before + ethers.parseEther("10"));
  });

  it("should handle daily login streaks", async function () {
    await xp.connect(player).claimDailyLogin();
    let progression = await xp.getPlayerProgression(player.address);
    expect(progression.dailyStreak).to.equal(1n);
    expect(progression.xp).to.equal(25n);

    await expect(xp.connect(player).claimDailyLogin()).to.be.revertedWith("Already claimed today");

    await time.increase(1 * 24 * 60 * 60);
    await xp.connect(player).claimDailyLogin();
    progression = await xp.getPlayerProgression(player.address);
    expect(progression.dailyStreak).to.equal(2n);
  });

  it("should record match wins and losses", async function () {
    await xp.recordMatch(player.address, true);
    await xp.recordMatch(player.address, false);
    const progression = await xp.getPlayerProgression(player.address);
    expect(progression.totalMatches).to.equal(2n);
    expect(progression.totalWins).to.equal(1n);
    expect(progression.xp).to.equal(125n);
  });

  it("should rank top players by XP", async function () {
    await xp.addXP(player.address, 40, "A");
    await xp.addXP(player2.address, 80, "B");
    const [addresses, amounts] = await xp.getTopPlayers(2);
    expect(addresses[0]).to.equal(player2.address);
    expect(amounts[0]).to.equal(80n);
  });

  it("should reject XP writes from non-operators", async function () {
    await expect(xp.connect(player).addXP(player.address, 10, "Nope")).to.be.revertedWith("Not operator");
  });
});
