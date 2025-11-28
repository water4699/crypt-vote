import type { HardhatRuntimeEnvironment } from "hardhat/types.js";

const func = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy FHECounter
  const deployedFHECounter = await deploy("FHECounter", {
    from: deployer,
    log: true,
  });
  console.log(`FHECounter contract: `, deployedFHECounter.address);

  // Deploy EncryptedVotingSystem
  const deployedVotingSystem = await deploy("EncryptedVotingSystem", {
    from: deployer,
    log: true,
  });
  console.log(`EncryptedVotingSystem contract: `, deployedVotingSystem.address);
};
func.id = "deploy_contracts"; // id required to prevent reexecution
func.tags = ["FHECounter", "EncryptedVotingSystem"];

export default func;
