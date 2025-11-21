"use client";

import { useState, useMemo } from "react";
import { useState } from "react";
import { useEncryptedVotingSystem } from "../hooks/useEncryptedVotingSystem";
import { useAccount, useChainId } from "wagmi";
import { EncryptedVotingSystemAddresses } from "../abi/EncryptedVotingSystemAddresses";

export const EncryptedVotingDemo = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Get contract address based on current chain
  // Priority: chain-specific address > environment variable > default localhost
  // Use useMemo to recalculate when chainId changes
  const contractAddress = useMemo(() => {
    // First, try to get address from addresses file based on current chain
    const chainIdStr = chainId.toString();
    const chainAddress = EncryptedVotingSystemAddresses[chainIdStr as keyof typeof EncryptedVotingSystemAddresses];
    
    if (chainAddress) {
      return chainAddress.address;
    }
    
    // If no chain-specific address found, use environment variable if set
    if (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
      return process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    }
    
    // Fallback to localhost address
    return "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  }, [chainId]);
  const {
    votes,
    userVotes,
    decryptedResults,
    isLoading,
    message,
    createVote,
    castVote,
    decryptUserVote,
    loadVotes,
    refreshVote,
  } = useEncryptedVotingSystem(contractAddress);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVote, setNewVote] = useState({
    title: "",
    description: "",
    options: ["", ""],
    durationDays: 7,
  });
  const [selectedVoteId, setSelectedVoteId] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<number>(0);

  const handleCreateVote = async () => {
    if (!newVote.title || !newVote.description || newVote.options.some(opt => !opt.trim())) {
      alert("Please fill in all fields and ensure all options have text");
      return;
    }

    try {
      const voteId = await createVote(
        newVote.title,
        newVote.description,
        newVote.options.filter(opt => opt.trim()),
        newVote.durationDays
      );

      setNewVote({
        title: "",
        description: "",
        options: ["", ""],
        durationDays: 7,
      });
      setShowCreateForm(false);
      alert(`Vote created successfully with ID: ${voteId}`);
    } catch (error) {
      console.error("Failed to create vote:", error);
    }
  };

  const handleCastVote = async () => {
    if (selectedVoteId === null) return;

    try {
      await castVote(selectedVoteId, selectedOption);
      alert("Vote cast successfully!");
      refreshVote(selectedVoteId);
    } catch (error) {
      console.error("Failed to cast vote:", error);
    }
  };

  const addOption = () => {
    setNewVote(prev => ({
      ...prev,
      options: [...prev.options, ""]
    }));
  };

  const removeOption = (index: number) => {
    if (newVote.options.length > 2) {
      setNewVote(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setNewVote(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-600/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-orange-400/10 to-transparent rounded-full"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <div className="inline-block p-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <h1 className="text-6xl md:text-8xl font-black text-white tracking-wider">
                  VOTE
                </h1>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-orange-400 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                ENCRYPTED BALLOT SYSTEM
              </h2>
            </div>

            <div className="space-y-6">
              <p className="text-xl md:text-2xl text-gray-300 font-light leading-relaxed">
                🔥 <strong className="text-orange-400">FHEVM-Powered</strong> Privacy Voting Revolution
              </p>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Experience the future of democratic participation with <span className="text-red-400 font-semibold">military-grade encryption</span>.
                Your vote remains private, your choice remains powerful.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 mt-12">
              <div className="bg-black/40 backdrop-blur-sm border border-orange-500/30 rounded-xl p-6 transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl mb-2">🔐</div>
                <p className="text-orange-300 font-semibold">Zero-Knowledge</p>
                <p className="text-gray-400 text-sm">Your vote stays secret</p>
              </div>
              <div className="bg-black/40 backdrop-blur-sm border border-red-500/30 rounded-xl p-6 transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl mb-2">⚡</div>
                <p className="text-red-300 font-semibold">Real-Time</p>
                <p className="text-gray-400 text-sm">Instant verification</p>
              </div>
              <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6 transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl mb-2">🚀</div>
                <p className="text-yellow-300 font-semibold">Blockchain</p>
                <p className="text-gray-400 text-sm">Immutable records</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] bg-gradient-to-br from-gray-900 via-red-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-red-600/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-[95%] xl:max-w-[1600px] mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-block">
            <div className="bg-gradient-to-r from-orange-500 via-red-600 to-pink-600 p-1 rounded-2xl md:rounded-3xl shadow-2xl">
              <div className="bg-black/90 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8">
                <div className="flex items-center justify-center gap-2 md:gap-4 mb-3 md:mb-4">
                  <div className="text-3xl md:text-5xl lg:text-6xl animate-bounce">🔥</div>
                  <h1 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white tracking-wider bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    CRYPTO VOTE
                  </h1>
                  <div className="text-3xl md:text-5xl lg:text-6xl animate-bounce delay-100">⚡</div>
                </div>
                <p className="text-sm md:text-lg lg:text-xl xl:text-2xl text-gray-300 font-light mb-2 md:mb-3">
                  The Ultimate <span className="text-orange-400 font-bold">Privacy-First</span> Voting Experience
                </p>
                {address && (
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 px-4 md:px-6 py-1.5 md:py-2 rounded-full text-white font-semibold text-xs md:text-sm">
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span>
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-4 md:mb-6">
            <div className={`p-6 rounded-2xl backdrop-blur-sm border-2 shadow-2xl font-semibold text-center ${
              message.includes("Error") || message.includes("Failed") || message.includes("not deployed")
                ? "bg-red-900/50 border-red-500/50 text-red-200"
                : message.includes("success")
                ? "bg-green-900/50 border-green-500/50 text-green-200"
                : "bg-orange-900/50 border-orange-500/50 text-orange-200"
            }`}>
              <div className="flex items-center justify-center gap-3 mb-2">
                {message.includes("Error") || message.includes("Failed") || message.includes("not deployed") ? (
                  <span className="text-2xl">❌</span>
                ) : message.includes("success") ? (
                  <span className="text-2xl">✅</span>
                ) : (
                  <span className="text-2xl">⚡</span>
                )}
                <span>{message}</span>
              </div>
              {message.includes("not deployed") && (
                <div className="mt-4 text-sm text-gray-300 space-y-2">
                  <p>💡 <strong>Solutions:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-left max-w-2xl mx-auto">
                    {chainId === 31337 ? (
                      <>
                        <li>✅ Current network: <strong>Localhost (Hardhat)</strong> - Correct network</li>
                        <li>⚠️ But contract address doesn&apos;t match, please check:</li>
                        <li>Current contract address: <code className="bg-black/50 px-2 py-1 rounded text-red-300">{contractAddress}</code></li>
                        <li>Expected address: <code className="bg-black/50 px-2 py-1 rounded text-green-300">0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512</code></li>
                        <li>Please ensure <code className="bg-black/50 px-2 py-1 rounded">NEXT_PUBLIC_CONTRACT_ADDRESS</code> is removed or commented out in <code className="bg-black/50 px-2 py-1 rounded">.env.local</code></li>
                        <li>Or ensure the local Hardhat node is running and the contract is deployed</li>
                      </>
                    ) : chainId === 11155111 ? (
                      <>
                        <li>Current network: <strong>Sepolia Testnet</strong></li>
                        <li>Please deploy the contract on Sepolia testnet, or switch to local network</li>
                        <li>Current contract address: <code className="bg-black/50 px-2 py-1 rounded">{contractAddress}</code></li>
                      </>
                    ) : (
                      <>
                        <li>Switch to local network (localhost:8545) to use locally deployed contract</li>
                        <li>Or deploy contract on Sepolia testnet</li>
                        <li>Current contract address: <code className="bg-black/50 px-2 py-1 rounded">{contractAddress}</code></li>
                        <li>Current network chain ID: <code className="bg-black/50 px-2 py-1 rounded">{chainId}</code></li>
                      </>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 w-full">
          <div className="lg:col-span-4 space-y-4 md:space-y-6">
            <div className="bg-black/40 backdrop-blur-sm border-2 border-orange-500/30 rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 shadow-2xl transform hover:scale-105 transition-all duration-500">
              <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                  <span className="text-white text-3xl animate-pulse">⚡</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">CREATE VOTE</h2>
                  <p className="text-orange-400 text-sm">Ignite the democratic revolution</p>
                </div>
              </div>

              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full bg-gradient-to-r from-orange-500 via-red-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <span className="relative flex items-center justify-center gap-3">
                    <span className="text-2xl animate-bounce">🚀</span>
                    LAUNCH NEW VOTE
                    <span className="text-2xl animate-bounce">🔥</span>
                  </span>
                </button>
              ) : (
                <div className="space-y-4 md:space-y-5">
                  <div className="space-y-2">
                    <label className="text-orange-400 font-bold text-sm uppercase tracking-wider">VOTE TITLE</label>
                    <input
                      type="text"
                      placeholder="What shall we decide?"
                      value={newVote.title}
                      onChange={(e) => setNewVote(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 bg-black/50 border-2 border-orange-500/30 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 text-white placeholder-gray-500 font-semibold transition-all duration-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-orange-400 font-bold text-sm uppercase tracking-wider">DESCRIPTION</label>
                    <textarea
                      placeholder="Describe the decision..."
                      value={newVote.description}
                      onChange={(e) => setNewVote(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 bg-black/50 border-2 border-orange-500/30 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 text-white placeholder-gray-500 font-semibold resize-none transition-all duration-300"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-orange-400 font-bold text-sm uppercase tracking-wider">OPTIONS</label>
                    {newVote.options.map((option, index) => (
                      <div key={index} className="flex gap-3">
                        <input
                          type="text"
                          placeholder={`Choice ${index + 1}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 px-4 py-3 bg-black/50 border-2 border-red-500/30 rounded-xl focus:border-red-400 focus:ring-2 focus:ring-red-500/20 text-white placeholder-gray-500 font-semibold transition-all duration-300"
                        />
                        {newVote.options.length > 2 && (
                          <button
                            onClick={() => removeOption(index)}
                            className="px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:shadow-lg transform hover:scale-110 transition-all duration-300 font-bold"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addOption}
                      className="w-full py-3 border-2 border-dashed border-orange-500/50 rounded-xl text-orange-400 hover:border-orange-400 hover:bg-orange-500/10 transition-all duration-300 font-bold flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">+</span> ADD CHOICE
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-orange-400 font-bold text-sm uppercase tracking-wider">DURATION (DAYS)</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={newVote.durationDays}
                      onChange={(e) => setNewVote(prev => ({ ...prev, durationDays: parseInt(e.target.value) || 7 }))}
                      className="w-full px-4 py-3 bg-black/50 border-2 border-orange-500/30 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 text-white font-semibold transition-all duration-300"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleCreateVote}
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-orange-500 via-red-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                      <span className="relative flex items-center justify-center gap-2">
                        {isLoading ? "⏳" : "🚀"} {isLoading ? "DEPLOYING..." : "LAUNCH VOTE"}
                      </span>
                    </button>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="px-6 py-4 border-2 border-gray-600 rounded-2xl font-bold hover:border-gray-400 text-gray-300 hover:text-white transition-all duration-300 transform hover:scale-105"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4 md:space-y-6">
            <div className="bg-black/40 backdrop-blur-sm border-2 border-red-500/30 rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl">🎯</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">ACTIVE VOTES</h2>
                    <p className="text-red-400 text-sm">Cast your encrypted ballot</p>
                  </div>
                </div>
                <button
                  onClick={loadVotes}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:shadow-xl hover:shadow-blue-500/50 transform hover:scale-110 transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    🔄 {isLoading ? "LOADING..." : "REFRESH"}
                  </span>
                </button>
              </div>

              {votes.length === 0 ? (
                <div className="text-center py-8 md:py-12 lg:py-16">
                  <div className="text-6xl md:text-8xl mb-4 md:mb-6 animate-bounce">🎭</div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-300 mb-2 md:mb-4">No Active Votes Yet</h3>
                  <p className="text-gray-500 text-base md:text-lg mb-4 md:mb-6 lg:mb-8">Be the first to ignite democracy!</p>
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 px-6 py-3 rounded-2xl text-white font-bold animate-pulse">
                    <span>⚡</span>
                    <span>CREATE THE FIRST VOTE</span>
                    <span>🔥</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {votes.filter(vote => vote.active).map((vote) => (
                    <div key={vote.id} className="bg-gradient-to-r from-black/60 to-gray-900/60 backdrop-blur-sm border-2 border-orange-500/20 rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 shadow-2xl transform hover:scale-102 transition-all duration-500 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4 md:mb-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-sm">
                                {votes.indexOf(vote) + 1}
                              </div>
                              <h3 className="font-black text-2xl text-white">{vote.title}</h3>
                            </div>
                            <p className="text-gray-300 text-lg mb-4 leading-relaxed">{vote.description}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-500">Creator:</span>
                              <code className="bg-black/50 px-3 py-1 rounded-lg text-orange-400 font-mono">
                                {vote.creator.slice(0, 6)}...{vote.creator.slice(-4)}
                              </code>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="bg-green-900/50 border border-green-500/30 px-4 py-2 rounded-xl mb-3">
                              <div className="text-green-400 font-bold text-sm uppercase tracking-wider">ACTIVE</div>
                              <div className="text-gray-400 text-xs">
                                Ends: {new Date(vote.endTime * 1000).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4 md:mb-6">
                          <h4 className="font-bold text-orange-400 mb-3 md:mb-4 text-base md:text-lg uppercase tracking-wider">Choose Your Path:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {vote.options.map((option, index) => (
                              <label key={index} className="group cursor-pointer">
                                <div className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                                  selectedVoteId === vote.id && selectedOption === index
                                    ? "border-orange-400 bg-orange-500/20 shadow-lg shadow-orange-500/30"
                                    : "border-gray-600 hover:border-orange-400 bg-black/30 hover:bg-orange-500/10"
                                }`}>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="radio"
                                      name={`vote-${vote.id}`}
                                      value={index}
                                      checked={selectedVoteId === vote.id && selectedOption === index}
                                      onChange={() => {
                                        setSelectedVoteId(vote.id);
                                        setSelectedOption(index);
                                      }}
                                      className="w-5 h-5 text-orange-600 bg-black border-2 border-orange-500 focus:ring-orange-500 focus:ring-2"
                                    />
                                    <span className={`font-semibold transition-colors ${
                                      selectedVoteId === vote.id && selectedOption === index
                                        ? "text-orange-300"
                                        : "text-gray-300 group-hover:text-orange-200"
                                    }`}>
                                      {option}
                                    </span>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-4">
                          {selectedVoteId === vote.id && !userVotes[vote.id] && (
                            <button
                              onClick={handleCastVote}
                              disabled={isLoading}
                              className="flex-1 bg-gradient-to-r from-orange-500 via-red-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                              <span className="relative flex items-center justify-center gap-3">
                                {isLoading ? "⏳" : "🗳️"} {isLoading ? "CASTING..." : "CAST ENCRYPTED VOTE"}
                              </span>
                            </button>
                          )}

                          {userVotes[vote.id] && (
                            <div className="w-full space-y-4 md:space-y-5">
                              <div className="flex items-center justify-center gap-3 bg-green-900/50 border-2 border-green-500/50 px-6 py-4 rounded-2xl">
                                <div className="text-3xl animate-bounce">✅</div>
                                <span className="text-green-400 font-black text-lg">VOTE CAST SUCCESSFULLY</span>
                              </div>

                              {!decryptedResults[vote.id] ? (
                                <div className="bg-gradient-to-r from-gray-800 to-black border-2 border-gray-600 rounded-2xl p-4 md:p-6 lg:p-8 text-center transform hover:scale-102 transition-all duration-300">
                                  <div className="text-6xl mb-4 animate-pulse">🔒</div>
                                  <h4 className="text-xl font-bold text-gray-300 mb-3">YOUR VOTE IS ENCRYPTED</h4>
                                  <p className="text-gray-500 mb-6">Military-grade privacy protection active</p>
                                  <button
                                    onClick={() => decryptUserVote(vote.id)}
                                    disabled={isLoading}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-2xl font-bold hover:shadow-xl hover:shadow-blue-500/50 transform hover:scale-110 transition-all duration-300"
                                  >
                                    <span className="flex items-center gap-2">
                                      {isLoading ? "⏳" : "🔓"} {isLoading ? "DECRYPTING..." : "REVEAL RESULTS"}
                                    </span>
                                  </button>
                                </div>
                              ) : (
                                <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-2 border-green-500/50 rounded-2xl p-4 md:p-6 lg:p-8">
                                  <div className="flex items-center justify-center gap-3 mb-6">
                                    <div className="text-4xl animate-spin">🔓</div>
                                    <h4 className="text-xl font-bold text-green-400">RESULTS DECRYPTED</h4>
                                  </div>

                                  {decryptedResults[vote.id] && decryptedResults[vote.id].length > 0 ? (
                                    <div className="space-y-4">
                                      <h5 className="text-center font-bold text-white text-lg mb-4">FINAL VOTE TALLY:</h5>
                                      <div className="grid gap-3">
                                        {decryptedResults[vote.id].map((result) => (
                                          <div key={result.optionId} className="flex justify-between items-center bg-black/50 p-4 rounded-xl border border-gray-600">
                                            <span className="text-gray-300 font-semibold">{vote.options[result.optionId]}</span>
                                            <div className="bg-gradient-to-r from-orange-600 to-red-600 px-4 py-2 rounded-xl">
                                              <span className="text-white font-black">
                                                {result.count} VOTE{result.count !== 1 ? 'S' : ''}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center text-gray-500 py-4 md:py-6 lg:py-8">
                                      <div className="text-4xl mb-4">📊</div>
                                      <p className="text-lg">No results data available</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};