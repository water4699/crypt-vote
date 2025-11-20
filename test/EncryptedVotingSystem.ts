import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { EncryptedVotingSystem, EncryptedVotingSystem__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("EncryptedVotingSystem")) as EncryptedVotingSystem__factory;
  const votingSystemContract = (await factory.deploy()) as EncryptedVotingSystem;
  const votingSystemContractAddress = await votingSystemContract.getAddress();

  return { votingSystemContract, votingSystemContractAddress };
}

describe("EncryptedVotingSystem", function () {
  let signers: Signers;
  let votingSystemContract: EncryptedVotingSystem;
  let votingSystemContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      charlie: ethSigners[3]
    };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ votingSystemContract, votingSystemContractAddress } = await deployFixture());
  });

  it("should initialize voting with options", async function () {
    const options = ["Option A", "Option B", "Option C"];
    await votingSystemContract.initializeVoting(options);

    const nextVoteId = await votingSystemContract.getNextVoteId();
    expect(nextVoteId).to.equal(2); // Should be incremented after creating vote
  });

    const optionCount = await votingSystemContract.getOptionCount();
    expect(optionCount).to.eq(3);

    for (let i = 0; i < options.length; i++) {
      const description = await votingSystemContract.getOptionDescription(i);
      expect(description).to.eq(options[i]);
    }
  });

  it("should allow users to cast votes", async function () {
    const options = ["Option A", "Option B"];
    await votingSystemContract.initializeVoting(options);

    // Alice votes for option 0
    await votingSystemContract.connect(signers.alice).castVote(0, "0x00");

    const voteCount0 = await votingSystemContract.getVoteCount(0);
    const voteCount1 = await votingSystemContract.getVoteCount(1);
    const totalVotes = await votingSystemContract.getTotalVotes();

    expect(voteCount0).to.eq(1);
    expect(voteCount1).to.eq(0);
    expect(totalVotes).to.eq(1);
  });

  it("should prevent double voting", async function () {
    const options = ["Option A", "Option B"];
    await votingSystemContract.initializeVoting(options);

    // Alice votes for option 0
    await votingSystemContract.connect(signers.alice).castVote(0, "0x00");

    // Alice tries to vote again - should fail
    await expect(
      votingSystemContract.connect(signers.alice).castVote(1, "0x00")
    ).to.be.revertedWith("Already voted");
  });

  it("should track multiple votes correctly", async function () {
    const options = ["Option A", "Option B"];
    await votingSystemContract.initializeVoting(options);

    // Alice votes for option 0
    await votingSystemContract.connect(signers.alice).castVote(0, "0x00");

    // Bob votes for option 1
    await votingSystemContract.connect(signers.bob).castVote(1, "0x00");

    // Charlie votes for option 0
    await votingSystemContract.connect(signers.charlie).castVote(0, "0x00");

    const voteCount0 = await votingSystemContract.getVoteCount(0);
    const voteCount1 = await votingSystemContract.getVoteCount(1);
    const totalVotes = await votingSystemContract.getTotalVotes();

    expect(voteCount0).to.eq(2);
    expect(voteCount1).to.eq(1);
    expect(totalVotes).to.eq(3);
  });

  it("should record daily study time and accumulate total study time", async function () {
    // Encrypt study time (30 minutes) as a euint32
    const studyMinutes = 30;
    const encryptedStudyTime = await fhevm
      .createEncryptedInput(studyTrackerContractAddress, signers.alice.address)
      .add32(studyMinutes)
      .encrypt();

    // Record study time
    const tx = await studyTrackerContract
      .connect(signers.alice)
      .recordStudyTime(encryptedStudyTime.handles[0], encryptedStudyTime.inputProof);
    await tx.wait();

    // Get encrypted values
    const encryptedDailyTime = await studyTrackerContract.getDailyStudyTime();
    const encryptedTotalTime = await studyTrackerContract.getTotalStudyTime();

    // Check that handles are initialized (non-zero)
    expect(encryptedDailyTime).to.not.eq(ethers.ZeroHash);
    expect(encryptedTotalTime).to.not.eq(ethers.ZeroHash);

    // Decrypt and verify
    const clearDailyTime = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedDailyTime,
      studyTrackerContractAddress,
      signers.alice,
    );
    const clearTotalTime = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTotalTime,
      studyTrackerContractAddress,
      signers.alice,
    );

    expect(clearDailyTime).to.eq(studyMinutes);
    expect(clearTotalTime).to.eq(studyMinutes);
  });

  it("should accumulate multiple daily study sessions", async function () {
    // First study session: 45 minutes
    const firstSession = 45;
    const encryptedFirst = await fhevm
      .createEncryptedInput(studyTrackerContractAddress, signers.alice.address)
      .add32(firstSession)
      .encrypt();

    let tx = await studyTrackerContract
      .connect(signers.alice)
      .recordStudyTime(encryptedFirst.handles[0], encryptedFirst.inputProof);
    await tx.wait();

    // Second study session: 25 minutes (same day)
    const secondSession = 25;
    const encryptedSecond = await fhevm
      .createEncryptedInput(studyTrackerContractAddress, signers.alice.address)
      .add32(secondSession)
      .encrypt();

    tx = await studyTrackerContract
      .connect(signers.alice)
      .recordStudyTime(encryptedSecond.handles[0], encryptedSecond.inputProof);
    await tx.wait();

    // Get encrypted values
    const encryptedDailyTime = await studyTrackerContract.getDailyStudyTime();
    const encryptedTotalTime = await studyTrackerContract.getTotalStudyTime();

    // Check that handles are initialized (non-zero)
    expect(encryptedDailyTime).to.not.eq(ethers.ZeroHash);
    expect(encryptedTotalTime).to.not.eq(ethers.ZeroHash);

    // Decrypt and verify
    const clearDailyTime = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedDailyTime,
      studyTrackerContractAddress,
      signers.alice,
    );
    const clearTotalTime = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTotalTime,
      studyTrackerContractAddress,
      signers.alice,
    );

    expect(clearDailyTime).to.eq(firstSession + secondSession); // 70 minutes
    expect(clearTotalTime).to.eq(firstSession + secondSession); // 70 minutes
  });

  it("should maintain separate study records for different users", async function () {
    // Alice studies 60 minutes
    const aliceStudyTime = 60;
    const encryptedAlice = await fhevm
      .createEncryptedInput(studyTrackerContractAddress, signers.alice.address)
      .add32(aliceStudyTime)
      .encrypt();

    let tx = await studyTrackerContract
      .connect(signers.alice)
      .recordStudyTime(encryptedAlice.handles[0], encryptedAlice.inputProof);
    await tx.wait();

    // Bob studies 45 minutes
    const bobStudyTime = 45;
    const encryptedBob = await fhevm
      .createEncryptedInput(studyTrackerContractAddress, signers.bob.address)
      .add32(bobStudyTime)
      .encrypt();

    tx = await studyTrackerContract
      .connect(signers.bob)
      .recordStudyTime(encryptedBob.handles[0], encryptedBob.inputProof);
    await tx.wait();

    // Verify Alice's records
    const aliceDailyTime = await studyTrackerContract.connect(signers.alice).getDailyStudyTime();
    const aliceTotalTime = await studyTrackerContract.connect(signers.alice).getTotalStudyTime();

    const aliceClearDaily = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      aliceDailyTime,
      studyTrackerContractAddress,
      signers.alice,
    );
    const aliceClearTotal = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      aliceTotalTime,
      studyTrackerContractAddress,
      signers.alice,
    );

    expect(aliceClearDaily).to.eq(aliceStudyTime);
    expect(aliceClearTotal).to.eq(aliceStudyTime);

    // Verify Bob's records
    const bobDailyTime = await studyTrackerContract.connect(signers.bob).getDailyStudyTime();
    const bobTotalTime = await studyTrackerContract.connect(signers.bob).getTotalStudyTime();

    const bobClearDaily = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      bobDailyTime,
      studyTrackerContractAddress,
      signers.bob,
    );
    const bobClearTotal = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      bobTotalTime,
      studyTrackerContractAddress,
      signers.bob,
    );

    expect(bobClearDaily).to.eq(bobStudyTime);
    expect(bobClearTotal).to.eq(bobStudyTime);
  });

  it("should reset daily study time on new day", async function () {
    // Set up: record study time today
    const todayStudyTime = 90;
    const encryptedToday = await fhevm
      .createEncryptedInput(studyTrackerContractAddress, signers.alice.address)
      .add32(todayStudyTime)
      .encrypt();

    let tx = await studyTrackerContract
      .connect(signers.alice)
      .recordStudyTime(encryptedToday.handles[0], encryptedToday.inputProof);
    await tx.wait();

    // Manually advance time by 1 day (86400 seconds)
    await ethers.provider.send("evm_increaseTime", [86400]);
    await ethers.provider.send("evm_mine", []);

    // Record study time for the new day
    const newDayStudyTime = 60;
    const encryptedNewDay = await fhevm
      .createEncryptedInput(studyTrackerContractAddress, signers.alice.address)
      .add32(newDayStudyTime)
      .encrypt();

    tx = await studyTrackerContract
      .connect(signers.alice)
      .recordStudyTime(encryptedNewDay.handles[0], encryptedNewDay.inputProof);
    await tx.wait();

    // Get encrypted values
    const encryptedDailyTime = await studyTrackerContract.getDailyStudyTime();
    const encryptedTotalTime = await studyTrackerContract.getTotalStudyTime();

    // Check that handles are initialized (non-zero)
    expect(encryptedDailyTime).to.not.eq(ethers.ZeroHash);
    expect(encryptedTotalTime).to.not.eq(ethers.ZeroHash);

    // Decrypt and verify
    const clearDailyTime = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedDailyTime,
      studyTrackerContractAddress,
      signers.alice,
    );
    const clearTotalTime = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTotalTime,
      studyTrackerContractAddress,
      signers.alice,
    );

    expect(clearDailyTime).to.eq(newDayStudyTime); // Only new day's time
    expect(clearTotalTime).to.eq(todayStudyTime + newDayStudyTime); // Accumulated total
  });

  it("should return correct current date", async function () {
    const currentDate = await studyTrackerContract.getCurrentDate();
    const expectedDate = Math.floor(Date.now() / 1000 / 86400);

    // Allow for some time difference in testing
    expect(Number(currentDate)).to.be.closeTo(expectedDate, 1);
  });
});
