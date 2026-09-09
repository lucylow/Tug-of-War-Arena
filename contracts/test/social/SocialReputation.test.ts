import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("SocialReputation", function () {
  let reputation: Awaited<ReturnType<typeof deployReputation>>["reputation"];
  let owner: Awaited<ReturnType<typeof deployReputation>>["owner"];
  let user1: Awaited<ReturnType<typeof deployReputation>>["user1"];
  let user2: Awaited<ReturnType<typeof deployReputation>>["user2"];

  async function deployReputation() {
    const [owner, user1, user2] = await ethers.getSigners();
    const Reputation = await ethers.getContractFactory("SocialReputation");
    const reputation = await Reputation.deploy(owner.address);
    await reputation.waitForDeployment();
    return { reputation, owner, user1, user2 };
  }

  before(async () => {
    ({ reputation, owner, user1, user2 } = await deployReputation());
  });

  it("should update reputation", async function () {
    await reputation.updateReputation(user1.address, "tip", true, 10);
    const rep = await reputation.getReputation(user1.address);
    expect(rep.score).to.equal(10);
  });

  it("should allow following", async function () {
    await reputation.connect(user1).follow(user2.address);
    const followers = await reputation.getFollowers(user2.address);
    expect(followers.length).to.equal(1);
    expect(followers[0]).to.equal(user1.address);
    expect(await reputation.isFollowing(user1.address, user2.address)).to.equal(true);
  });

  it("should calculate trust level", async function () {
    const rep = await reputation.getReputation(user1.address);
    expect(rep.trustLevel).to.be.gt(50);
  });

  it("rejects self-follow and duplicate follow", async function () {
    await expect(reputation.connect(user1).follow(user1.address)).to.be.revertedWithCustomError(
      reputation,
      "CannotFollowSelf",
    );
    await expect(reputation.connect(user1).follow(user2.address)).to.be.revertedWithCustomError(
      reputation,
      "AlreadyFollowing",
    );
  });

  it("unfollows and verifies high-reputation users", async function () {
    await reputation.connect(user1).unfollow(user2.address);
    expect(await reputation.isFollowing(user1.address, user2.address)).to.equal(false);

        await reputation.setMinReputationForVerified(10);
        await reputation.updateReputation(user2.address, "endorse", true, 0);
        await reputation.verifyUser(user2.address);
    expect((await reputation.getReputation(user2.address)).isVerified).to.equal(true);
    expect(owner.address).to.not.equal(ethers.ZeroAddress);
  });
});
