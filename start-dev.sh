#!/bin/bash

echo "🚀 Starting Crypto-Vote Development Environment"
echo "==============================================="

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $FRONTEND_PID $NODE_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

echo "📦 Starting Hardhat node..."
npm run local-node &
NODE_PID=$!

echo "⏳ Waiting for Hardhat node to be ready..."
sleep 5

echo "🏗️ Deploying contracts..."
npm run deploy-local

echo "🗳️ Initializing voting system..."
npm run setup-voting

echo "🌐 Starting frontend development server..."
npm run frontend-dev &
FRONTEND_PID=$!

echo ""
echo "✅ Development environment is ready!"
echo "📱 Frontend: http://localhost:3000"
echo "🔗 Hardhat Node: http://localhost:8545"
echo "📋 Contract: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
echo ""
echo "💡 Press Ctrl+C to stop all services"

# Wait for background processes
wait
