@echo off
echo 🚀 Starting Crypto-Vote Development Environment
echo ===============================================
echo.

echo 📦 Starting Hardhat node in background...
start /B npm run local-node

echo ⏳ Waiting for Hardhat node to be ready...
timeout /t 5 /nobreak > nul

echo 🏗️ Deploying contracts...
call npm run deploy-local

echo 🗳️ Initializing voting system...
call npm run setup-voting

echo 🌐 Starting frontend development server in background...
start /B npm run frontend-dev

echo.
echo ✅ Development environment is ready!
echo 📱 Frontend: http://localhost:3000
echo 🔗 Hardhat Node: http://localhost:8545
echo 📋 Contract: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
echo.
echo 💡 Close this window to stop all services
echo.
pause
