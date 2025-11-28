#!/usr/bin/env node

import { ethers } from 'ethers';
import { EncryptedVotingSystemAddresses } from '../frontend/abi/EncryptedVotingSystemAddresses.ts';

async function testDeployment() {
  console.log('🧪 Testing Sepolia deployment...');

  // Get Sepolia contract address
  const sepoliaConfig = EncryptedVotingSystemAddresses['11155111'];
  if (!sepoliaConfig) {
    throw new Error('Sepolia config not found');
  }

  console.log('📍 Contract address:', sepoliaConfig.address);

  // Create provider
  const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/b18fb7e6ca7045ac83c41157ab93f990');

  // Load contract ABI
  const fs = await import('fs');
  const contractArtifact = JSON.parse(fs.readFileSync('./deployments/sepolia/EncryptedVotingSystem.json', 'utf8'));

  const contract = new ethers.Contract(sepoliaConfig.address, contractArtifact.abi, provider);

  try {
    // Test basic contract interaction
    const nextVoteId = await contract.getNextVoteId();
    console.log('✅ Contract is responsive');
    console.log('📊 Next Vote ID:', nextVoteId.toString());

    const owner = await contract.owner();
    console.log('👑 Contract owner:', owner);

    console.log('🎉 Deployment verification successful!');

  } catch (error) {
    console.error('❌ Contract verification failed:', error.message);
    throw error;
  }
}

testDeployment().catch(console.error);
