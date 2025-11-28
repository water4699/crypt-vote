import { task } from "hardhat/config.js";
import type { TaskArguments } from "hardhat/types.js";

/**
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the EncryptedVotingSystem contract
 *
 *   npx hardhat --network localhost deploy
 *
 * 3. Initialize voting with options
 *
 *   npx hardhat --network localhost task:vote-init --options "Alice,Bob,Charlie"
 *
 * 4. Interact with the EncryptedVotingSystem contract
 *
 *   npx hardhat --network localhost task:vote-cast --option 0
 *   npx hardhat --network localhost task:vote-results
 *   npx hardhat --network localhost task:vote-status
 *
 *
 * Tutorial: Deploy and Interact on Sepolia (--network sepolia)
 * ===========================================================
 *
 * 1. Deploy the EncryptedVotingSystem contract
 *
 *   npx hardhat --network sepolia deploy
 *
 * 2. Initialize voting with options
 *
 *   npx hardhat --network sepolia task:vote-init --options "Alice,Bob,Charlie"
 *
 * 3. Interact with the EncryptedVotingSystem contract
 *
 *   npx hardhat --network sepolia task:vote-cast --option 0
 *   npx hardhat --network sepolia task:vote-results
 *
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:vote-address
 *   - npx hardhat --network sepolia task:vote-address
 */
task("task:vote-address", "Prints the EncryptedVotingSystem address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const votingSystem = await deployments.get("EncryptedVotingSystem");

  console.log("EncryptedVotingSystem address is " + votingSystem.address);
});

/**
 * Example:
 *   - npx hardhat --network localhost task:vote-init --options "Alice,Bob,Charlie"
 *   - npx hardhat --network sepolia task:vote-init --options "Option A,Option B"
 */
task("task:vote-init", "Initializes voting with options")
  .addOptionalParam("address", "Optionally specify the EncryptedVotingSystem contract address")
  .addParam("options", "Comma-separated list of voting options")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const votingSystemDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("EncryptedVotingSystem");

    console.log(`EncryptedVotingSystem: ${votingSystemDeployment.address}`);

    const signers = await ethers.getSigners();
    const votingSystemContract = await ethers.getContractAt("EncryptedVotingSystem", votingSystemDeployment.address);

    const options = taskArguments.options.split(",").map((opt: string) => opt.trim());
    console.log(`Initializing voting with options: ${options.join(", ")}`);

    const tx = await votingSystemContract.initializeVoting(options);
    await tx.wait();

    console.log("Voting initialized successfully!");
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:vote-cast --option 0
 *   - npx hardhat --network sepolia task:vote-cast --option 1
 */
task("task:vote-cast", "Casts a vote for the specified option")
  .addOptionalParam("address", "Optionally specify the EncryptedVotingSystem contract address")
  .addParam("option", "The option index to vote for")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const votingSystemDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("EncryptedVotingSystem");

    console.log(`EncryptedVotingSystem: ${votingSystemDeployment.address}`);

    const signers = await ethers.getSigners();
    const votingSystemContract = await ethers.getContractAt("EncryptedVotingSystem", votingSystemDeployment.address);

    const optionId = parseInt(taskArguments.option);
    console.log(`Casting vote for option ${optionId}...`);

    const tx = await votingSystemContract.connect(signers[0]).castVote(optionId, "0x00");
    await tx.wait();

    console.log(`Vote cast successfully for option ${optionId}!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:vote-results
 *   - npx hardhat --network sepolia task:vote-results
 */
task("task:vote-results", "Shows current voting results")
  .addOptionalParam("address", "Optionally specify the EncryptedVotingSystem contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const votingSystemDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("EncryptedVotingSystem");

    console.log(`EncryptedVotingSystem: ${votingSystemDeployment.address}`);

    const votingSystemContract = await ethers.getContractAt("EncryptedVotingSystem", votingSystemDeployment.address);

    const optionCount = await votingSystemContract.getOptionCount();
    const totalVotes = await votingSystemContract.getTotalVotes();

    console.log(`\nVoting Results (Total votes: ${totalVotes})`);
    console.log("=".repeat(40));

    for (let i = 0; i < Number(optionCount); i++) {
      const description = await votingSystemContract.getOptionDescription(i);
      const voteCount = await votingSystemContract.getVoteCount(i);
      const percentage = totalVotes > 0 ? ((Number(voteCount) / Number(totalVotes)) * 100).toFixed(1) : "0.0";
      console.log(`${description}: ${voteCount} votes (${percentage}%)`);
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:vote-status
 *   - npx hardhat --network sepolia task:vote-status
 */
task("task:vote-status", "Shows voting status and information")
  .addOptionalParam("address", "Optionally specify the EncryptedVotingSystem contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const votingSystemDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("EncryptedVotingSystem");

    console.log(`EncryptedVotingSystem: ${votingSystemDeployment.address}`);

    const signers = await ethers.getSigners();
    const votingSystemContract = await ethers.getContractAt("EncryptedVotingSystem", votingSystemDeployment.address);

    const optionCount = await votingSystemContract.getOptionCount();
    const totalVotes = await votingSystemContract.getTotalVotes();
    const isVotingActive = await votingSystemContract.isVotingActive();
    const votingEndTime = await votingSystemContract.getVotingEndTime();
    const hasVoted = await votingSystemContract.hasVoted(signers[0].address);

    console.log("\nVoting Status");
    console.log("=".repeat(20));
    console.log(`Options available: ${optionCount}`);
    console.log(`Total votes cast: ${totalVotes}`);
    console.log(`Voting active: ${isVotingActive}`);
    console.log(`Voting ends: ${new Date(Number(votingEndTime) * 1000).toLocaleString()}`);
    console.log(`Current user has voted: ${hasVoted}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:study-decrypt-daily
 *   - npx hardhat --network sepolia task:study-decrypt-daily
 */
task("task:study-decrypt-daily", "Decrypts the daily study time from EncryptedStudyTracker Contract")
  .addOptionalParam("address", "Optionally specify the EncryptedStudyTracker contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const studyTrackerDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("EncryptedStudyTracker");
    console.log(`EncryptedStudyTracker: ${studyTrackerDeployment.address}`);

    const signers = await ethers.getSigners();

    const studyTrackerContract = await ethers.getContractAt("EncryptedStudyTracker", studyTrackerDeployment.address);

    const encryptedDailyTime = await studyTrackerContract.getDailyStudyTime();
    if (encryptedDailyTime === ethers.ZeroHash) {
      console.log(`encrypted daily time: ${encryptedDailyTime}`);
      console.log("clear daily time    : 0 minutes");
      return;
    }

    const clearDailyTime = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedDailyTime,
      studyTrackerDeployment.address,
      signers[0],
    );
    console.log(`Encrypted daily time: ${encryptedDailyTime}`);
    console.log(`Clear daily time    : ${clearDailyTime} minutes`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:study-decrypt-total
 *   - npx hardhat --network sepolia task:study-decrypt-total
 */
task("task:study-decrypt-total", "Decrypts the total study time from EncryptedStudyTracker Contract")
  .addOptionalParam("address", "Optionally specify the EncryptedStudyTracker contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const studyTrackerDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("EncryptedStudyTracker");
    console.log(`EncryptedStudyTracker: ${studyTrackerDeployment.address}`);

    const signers = await ethers.getSigners();

    const studyTrackerContract = await ethers.getContractAt("EncryptedStudyTracker", studyTrackerDeployment.address);

    const encryptedTotalTime = await studyTrackerContract.getTotalStudyTime();
    if (encryptedTotalTime === ethers.ZeroHash) {
      console.log(`encrypted total time: ${encryptedTotalTime}`);
      console.log("clear total time    : 0 minutes");
      return;
    }

    const clearTotalTime = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTotalTime,
      studyTrackerDeployment.address,
      signers[0],
    );
    console.log(`Encrypted total time: ${encryptedTotalTime}`);
    console.log(`Clear total time    : ${clearTotalTime} minutes`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:study-record --minutes 30
 *   - npx hardhat --network sepolia task:study-record --minutes 30
 */
task("task:study-record", "Records study time in the EncryptedStudyTracker Contract")
  .addOptionalParam("address", "Optionally specify the EncryptedStudyTracker contract address")
  .addParam("minutes", "The study time in minutes")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const minutes = parseInt(taskArguments.minutes);
    if (!Number.isInteger(minutes) || minutes <= 0) {
      throw new Error(`Argument --minutes must be a positive integer`);
    }

    await fhevm.initializeCLIApi();

    const studyTrackerDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("EncryptedStudyTracker");
    console.log(`EncryptedStudyTracker: ${studyTrackerDeployment.address}`);

    const signers = await ethers.getSigners();

    const studyTrackerContract = await ethers.getContractAt("EncryptedStudyTracker", studyTrackerDeployment.address);

    // Encrypt the study time value
    const encryptedStudyTime = await fhevm
      .createEncryptedInput(studyTrackerDeployment.address, signers[0].address)
      .add32(minutes)
      .encrypt();

    const tx = await studyTrackerContract
      .connect(signers[0])
      .recordStudyTime(encryptedStudyTime.handles[0], encryptedStudyTime.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    console.log(`EncryptedStudyTracker recordStudyTime(${minutes} minutes) succeeded!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:study-info
 *   - npx hardhat --network sepolia task:study-info
 */
task("task:study-info", "Shows current study information from EncryptedStudyTracker Contract")
  .addOptionalParam("address", "Optionally specify the EncryptedStudyTracker contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const studyTrackerDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("EncryptedStudyTracker");
    console.log(`EncryptedStudyTracker: ${studyTrackerDeployment.address}`);

    const studyTrackerContract = await ethers.getContractAt("EncryptedStudyTracker", studyTrackerDeployment.address);

    const currentDate = await studyTrackerContract.getCurrentDate();
    const lastStudyDate = await studyTrackerContract.getLastStudyDate();

    console.log(`Current date: ${currentDate}`);
    console.log(`Last study date: ${lastStudyDate}`);
    console.log(`Daily time handle: ${await studyTrackerContract.getDailyStudyTime()}`);
    console.log(`Total time handle: ${await studyTrackerContract.getTotalStudyTime()}`);
  });
