#!/usr/bin/env node

/**
 * Setup script for initializing voting with predefined options
 * This script can be run after deployment to set up voting options
 */

import { ethers } from 'ethers';

// Hardcoded values for Sepolia
const CONTRACT_ADDRESS = '0x98D6225AAfEa695d236B17F17cea4c401B03951D';
const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "string[]", "name": "options", "type": "string[]"},
      {"internalType": "uint256", "name": "durationInDays", "type": "uint256"}
    ],
    "name": "createVote",
    "outputs": [{"internalType": "uint256", "name": "voteId", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getNextVoteId",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const DEFAULT_OPTIONS = [
  "Alice Johnson - Technology Innovation",
  "Bob Smith - Economic Development",
  "Charlie Brown - Environmental Protection",
  "Diana Prince - Education Reform"
];

async function setupVoting(options = DEFAULT_OPTIONS) {
  console.log('🚀 Setting up voting system...');

  const contractAddress = CONTRACT_ADDRESS;
  console.log(`📍 Contract address: ${contractAddress}`);

  // Connect to localhost provider
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');

  // For localhost, use the first account
  const signer = await provider.getSigner(0);

  const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

  console.log(`👤 Using account: ${await signer.getAddress()}`);

  try {
    // Check if voting is already initialized by checking next vote ID
    const nextVoteId = await contract.getNextVoteId();
    if (nextVoteId > 0) {
      console.log('⚠️  Voting system already has votes created. Next vote ID:', nextVoteId);
    }

    console.log(`📝 Creating vote with ${options.length} options:`);
    options.forEach((option, index) => {
      console.log(`  ${index + 1}. ${option}`);
    });

    // Create vote with title, description, options, and duration
    const tx = await contract.createVote(
      "Demo Voting Session",
      "This is a demonstration of FHE-based encrypted voting",
      options,
      7 // 7 days duration
    );
    console.log('⏳ Transaction submitted:', tx.hash);

    const receipt = await tx.wait();
    console.log('✅ Vote created successfully!');
    console.log('🆔 Vote ID:', receipt.logs[0]?.topics[1] ? parseInt(receipt.logs[0].topics[1], 16) : 'Unknown');
    console.log('📦 Block number:', receipt.blockNumber);
    console.log('⏱️  Gas used:', receipt.gasUsed.toString());

  } catch (error) {
    console.error('❌ Error setting up voting:', error.message);
    process.exit(1);
  }
}

// Allow custom options via command line arguments
const customOptions = process.argv.slice(2);
if (customOptions.length > 0) {
  console.log('Using custom options from command line');
  await setupVoting(customOptions);
} else {
  console.log('Using default voting options');
  await setupVoting();
}
