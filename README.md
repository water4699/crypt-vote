# Encrypted Voting System

A privacy-preserving voting platform built with FHEVM (Fully Homomorphic Encryption Virtual Machine) technology. Users can cast their votes in encrypted form, ensuring complete privacy while maintaining the integrity of the voting process.

## 🔗 Links

- **📹 Demo Video**: [Watch on GitHub](https://github.com/BurnellDavy/crypto-ballot-vault/blob/main/crypt-vote.mp4)
- **🌐 Live Demo**: [View on Vercel](https://crypt-vote.vercel.app/)

## Features

- **Privacy-Preserving**: Votes are encrypted using FHEVM, ensuring voter privacy
- **Encrypted Operations**: Vote tallying happens in encrypted form using homomorphic operations
- **Secure Voting**: Users can cast votes securely without revealing their choices
- **Multi-User Support**: Each voter's choice is kept completely private
- **Modern UI**: Built with Next.js, React, and Tailwind CSS
- **Wallet Integration**: RainbowKit wallet integration for easy connection
- **Real-time Results**: Live vote counting and result visualization

## Architecture

### Smart Contracts
- `EncryptedVotingSystem.sol`: Main contract handling encrypted vote casting and result aggregation
- Uses FHEVM for fully homomorphic encryption operations

### Frontend
- Built with Next.js 15 and React 19
- RainbowKit for wallet connection
- Custom hooks for FHEVM operations
- Responsive design with Tailwind CSS
- Real-time vote result visualization

## Prerequisites

- Node.js >= 20
- npm >= 7.0.0
- A compatible Ethereum wallet (MetaMask, etc.)

## Quick Start

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Choose Your Network

#### Option A: Local Development (Recommended for testing)
```bash
# Start local Hardhat node (in one terminal)
npm run local-node

# In another terminal, deploy contracts
npm run deploy-local

# Initialize voting with default options (admin only)
npm run setup-voting

# Start frontend development server (in another terminal)
npm run frontend-dev
```

#### Option B: Sepolia Testnet (Production-like environment)
```bash
# Set your environment variables
export INFURA_API_KEY="your_infura_api_key"
export PRIVATE_KEY="your_private_key"

# Deploy to Sepolia testnet
npm run deploy-sepolia

# Initialize voting with default options (admin only)
npm run setup-voting

# Start frontend (will connect to Sepolia)
cd frontend && npm run dev
```

#### Option C: Custom Voting Options
```bash
# For custom voting options, use:
npm run setup-voting:custom "Option 1" "Option 2" "Option 3"
```

### 3. Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Quick Start (Automated)

For a faster setup experience, use the automated startup script:

**Windows:**
```bash
./start-dev.bat
```

**Linux/Mac:**
```bash
./start-dev.sh
```

This will automatically:
- Start the Hardhat node
- Deploy contracts
- Initialize voting with default options
- Start the frontend server

### Data Persistence Note

⚠️ **Important**: The local Hardhat network resets all data when restarted. This means:

- **Voting data is lost** when you stop the Hardhat node
- **You must re-initialize voting** after each restart
- **Contract addresses stay the same** but state is cleared

For production deployments, use Sepolia testnet or mainnet where data persists.

### 4. Connect Wallet and Test

1. Click "Connect Wallet" to connect your wallet
   - **Local Development**: Use any account from Hardhat node (has 10,000 ETH)
   - **Sepolia Testnet**: Use MetaMask with Sepolia network (needs test ETH)
2. Select your preferred voting option from the available choices
3. Click "Cast Vote" to submit your encrypted vote
4. View real-time voting results and statistics

### 5. Network Information

**Local Development (Chain ID: 31337)**
- Contract: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- RPC: `http://localhost:8545`
- Free test accounts with 10,000 ETH each

**Sepolia Testnet (Chain ID: 11155111)**
- Contract: `0xBdfEb9bb6889d5a96340A04C8e8Cb6442936f0C6`
- RPC: `https://sepolia.infura.io/v3/YOUR_INFURA_KEY`
- Requires test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

## Available Scripts

### Backend Scripts

```bash
# Clean build artifacts
npm run clean

# Compile contracts
npm run compile

# Run tests on local network
npm run test

# Run tests on Sepolia testnet
npm run test:sepolia

# Start local Hardhat node
npm run local-node

# Deploy contracts to local network
npm run deploy-local

# Deploy contracts to Sepolia
npm run deploy-sepolia
```

### Frontend Scripts

```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Generate ABI files
npm run genabi

# Lint code
npm run lint
```

## Testing

### Local Testing

```bash
# Run all tests
npm run test

# Run specific test file
npx hardhat test test/EncryptedVotingSystem.ts

# Run Sepolia tests
npm run test:sepolia
```

### Manual Testing Tasks

```bash
# Initialize voting with options
npx hardhat --network localhost task:vote-init --options "Option A,Option B,Option C"

# Cast a vote
npx hardhat --network localhost task:vote-cast --option 0

# Show voting results
npx hardhat --network localhost task:vote-results

# Check voting status
npx hardhat --network localhost task:vote-status
```

## Contract Addresses

### Local Network (Hardhat)
- EncryptedVotingSystem: Check `deployments/localhost/EncryptedVotingSystem.json`

### Sepolia Testnet
- EncryptedVotingSystem: Check `deployments/sepolia/EncryptedVotingSystem.json` (after deployment)

## How It Works

1. **Initializing Voting**:
   - Administrator sets up voting options and parameters
   - Voting period is established with start and end times
   - Contract is configured for the specific election or poll

2. **Casting Votes**:
   - Voters select their preferred option
   - Vote is encrypted using FHEVM before transmission
   - Contract stores encrypted votes and updates tally

3. **Vote Aggregation**:
   - Votes are tallied in encrypted form using homomorphic operations
   - Real-time results can be computed without decrypting individual votes
   - Privacy is maintained throughout the process

4. **Viewing Results**:
   - Aggregated results are available for public viewing
   - Individual votes remain encrypted and private
   - Results are computed homomorphically

## Security Features

- **Fully Homomorphic Encryption**: All vote computations happen on encrypted data
- **Voter Privacy**: Individual votes cannot be viewed or traced
- **Tamper Resistance**: Encrypted votes cannot be modified once cast
- **Verifiable Results**: Vote totals can be verified without revealing individual choices
- **Zero-Knowledge**: Contract cannot see actual vote values

## Development

### Project Structure

```
secure-study/
├── contracts/              # Solidity contracts
├── test/                   # Contract tests
├── tasks/                  # Hardhat tasks
├── frontend/               # Next.js frontend
│   ├── app/               # Next.js app router
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── abi/               # Generated ABI files
│   └── fhevm/             # FHEVM utilities
├── deployments/           # Deployment artifacts
└── types/                 # TypeScript types
```

### Adding New Features

1. Modify contracts in the `contracts/` directory
2. Update tests in the `test/` directory
3. Regenerate types: `npm run typechain`
4. Update frontend hooks and components as needed
5. Regenerate ABI: `cd frontend && npm run genabi`

## Deployment

### Local Deployment

```bash
# Start local node
npm run local-node

# Deploy contracts
npm run deploy-local
```

### Testnet Deployment

```bash
# Set up environment variables in .env
# INFURA_API_KEY=your_infura_key
# MNEMONIC=your_wallet_mnemonic
# ETHERSCAN_API_KEY=your_etherscan_key

# Deploy to Sepolia
npm run deploy-sepolia
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

BSD-3-Clause-Clear License

## Acknowledgments

- Built with [FHEVM](https://docs.zama.ai/fhevm) by Zama
- Frontend template based on [fhevm-react-template](https://github.com/zama-ai/fhevm-react-template)
- Wallet integration using [RainbowKit](https://rainbowkit.com)