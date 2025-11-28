"use client";

import { useState, useMemo } from "react";
import { ethers } from "ethers";
import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useEncryptedVotingSystem } from "../hooks/useEncryptedVotingSystem";
import { errorNotDeployed } from "./ErrorNotDeployed";

export const EncryptedVotingSystemDemo = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const fhevmProvider = useMemo(
    () => (chainId === 31337 ? "http://localhost:8545" : provider),
    [chainId, provider]
  );

  const fhevmReadonlyProvider = useMemo(
    () =>
      chainId === 31337
        ? new ethers.JsonRpcProvider("http://localhost:8545")
        : ethersReadonlyProvider,
    [chainId, ethersReadonlyProvider]
  );

  const [selectedOption, setSelectedOption] = useState<string>("0");
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
  const [newOption, setNewOption] = useState<string>("");
  const [candidateOptions, setCandidateOptions] = useState<string[]>([]);
  const [isCreatingVote, setIsCreatingVote] = useState<boolean>(false);

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider: fhevmProvider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const votingSystem = useEncryptedVotingSystem({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider: fhevmReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const handleCreateVote = async () => {
    if (candidateOptions.length < 2) {
      alert("请至少添加2个候选人选项");
      return;
    }

    setIsCreatingVote(true);
    try {
      await votingSystem.initializeVoting(candidateOptions);
      alert("投票创建成功！现在可以开始投票了。");
      setCandidateOptions([]); // 清空候选人列表
    } catch (error) {
      console.error("创建投票失败:", error);
      alert("创建投票失败，请重试");
    } finally {
      setIsCreatingVote(false);
    }
  };

  const addCandidate = () => {
    if (newOption.trim() && !candidateOptions.includes(newOption.trim())) {
      setCandidateOptions([...candidateOptions, newOption.trim()]);
      setNewOption("");
    }
  };

  const removeCandidate = (index: number) => {
    setCandidateOptions(candidateOptions.filter((_, i) => i !== index));
  };

  const handleCastVote = () => {
    const optionId = parseInt(selectedOption);
    if (optionId >= 0) {
      votingSystem.castVote(optionId);
    }
  };


  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 w-full">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-800">Welcome to Encrypted Voting System</h2>
          <p className="text-gray-600 text-xl">
            Privacy-preserving voting platform with FHEVM
          </p>
        </div>
        <button
          className="btn-primary inline-flex items-center justify-center rounded-xl px-10 py-5 font-semibold text-white shadow-lg text-xl hover:shadow-xl transition-shadow"
          onClick={connect}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (votingSystem.isDeployed === false) {
    return errorNotDeployed(chainId);
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 px-4 md:px-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Encrypted Voting System
        </h1>
        <p className="text-slate-300 text-sm md:text-base">
          Cast your vote with fully homomorphic encryption for maximum privacy
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Vote or Cast Vote Card */}
          {votingSystem.options.length === 0 ? (
            /* Create Vote Card */
            <div className="bg-white rounded-2xl p-6 card-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <span className="text-white text-xl">⚙️</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Create New Vote</h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Add Candidate Options</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCandidate()}
                      placeholder="Enter candidate name..."
                      className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <button
                      onClick={addCandidate}
                      disabled={!newOption.trim()}
                      className="btn-secondary rounded-xl px-4 py-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Candidate List */}
                {candidateOptions.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Candidates ({candidateOptions.length})</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {candidateOptions.map((candidate, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-800 font-medium">{candidate}</span>
                          <button
                            onClick={() => removeCandidate(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  className="btn-primary w-full rounded-xl px-6 py-3 font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={candidateOptions.length < 2 || isCreatingVote}
                  onClick={handleCreateVote}
                >
                  {isCreatingVote ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Creating Vote...
                    </span>
                  ) : (
                    `Create Vote with ${candidateOptions.length} Candidates`
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Cast Vote Card */
            <div className="bg-white rounded-2xl p-6 card-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-xl">🗳️</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Cast Your Vote</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {votingSystem.options.map((option, index) => (
                    <label key={index} className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer transition-all">
                      <input
                        type="radio"
                        name="vote-option"
                        value={index.toString()}
                        checked={selectedOption === index.toString()}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-800 font-medium">{option}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="btn-primary w-full rounded-xl px-6 py-3 font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!votingSystem.canCastVote || votingSystem.hasVoted}
                  onClick={handleCastVote}
                >
                  {votingSystem.isVoting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Casting Vote...
                    </span>
                  ) : votingSystem.hasVoted ? (
                    "Already Voted ✓"
                  ) : (
                    "Cast Vote"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Voting Results */}
          <div className="bg-white rounded-2xl p-6 card-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <span className="text-white text-xl">📊</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Voting Results</h3>
            </div>
            <div className="space-y-4">
              {votingSystem.totalVotes > 0 ? (
                <>
                  {votingSystem.options.map((option, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{option}</span>
                        <span className="text-lg font-bold text-gray-800">
                          {votingSystem.decryptedResults ?
                            `${votingSystem.decryptedResults[index] || 0} votes` :
                            "🔒 Encrypted"
                          }
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        {votingSystem.decryptedResults ? (
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: (votingSystem.decryptedTotalVotes && votingSystem.decryptedTotalVotes > 0)
                                ? `${((votingSystem.decryptedResults[index] || 0) / votingSystem.decryptedTotalVotes) * 100}%`
                                : '0%'
                            }}
                          ></div>
                        ) : (
                          <div className="bg-gray-400 h-2 rounded-full w-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="text-center text-sm text-gray-600">
                    Total Votes: {votingSystem.decryptedTotalVotes !== undefined ?
                      votingSystem.decryptedTotalVotes :
                      "🔒 Encrypted"
                    }
                  </div>
                  {votingSystem.decryptedResults ? (
                    <button
                      className="btn-success w-full rounded-xl px-6 py-3 font-semibold text-white shadow-lg"
                      disabled={true}
                    >
                      ✅ Results Decrypted
                    </button>
                  ) : (
                    <button
                      className="btn-primary w-full rounded-xl px-6 py-3 font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={votingSystem.isDecrypting}
                      onClick={votingSystem.decryptResults}
                    >
                      {votingSystem.isDecrypting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Decrypting...
                        </span>
                      ) : (
                        "🔓 Decrypt Results"
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No votes cast yet
                </div>
              )}
            </div>
          </div>

          {/* Refresh Results Button */}
          <button
            className="btn-primary w-full rounded-xl px-6 py-4 font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!votingSystem.canRefreshResults}
            onClick={votingSystem.refreshResults}
          >
            {votingSystem.isRefreshing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Refreshing...
              </span>
            ) : (
              "🔄 Refresh Results"
            )}
          </button>
        </div>

        {/* Right Column - Status & Debug */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-2xl p-6 card-shadow">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Status</h3>
            <div className="space-y-3">
              <StatusItem
                label="FHEVM"
                value={fhevmInstance ? "Connected" : "Disconnected"}
                isGood={!!fhevmInstance}
              />
              <StatusItem
                label="Contract"
                value={votingSystem.isDeployed ? "Deployed" : "Not Deployed"}
                isGood={!!votingSystem.isDeployed}
              />
              <StatusItem
                label="Network"
                value={`Chain ${chainId}`}
                isGood={true}
              />
              <StatusItem
                label="Voting"
                value={votingSystem.isVotingActive ? "Active" : "Ended"}
                isGood={votingSystem.isVotingActive}
              />
              <StatusItem
                label="Your Vote"
                value={votingSystem.hasVoted ? "Cast" : "Not Cast"}
                isGood={votingSystem.hasVoted}
              />
            </div>
          </div>

          {/* Message Card */}
          {votingSystem.message && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 slide-in">
              <p className="text-sm text-blue-800">{votingSystem.message}</p>
            </div>
          )}

          {/* Debug Toggle */}
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
          >
            {showDebugInfo ? "Hide" : "Show"} Debug Info
          </button>

          {/* Debug Info */}
          {showDebugInfo && (
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Debug Information
              </h3>
              <div className="space-y-2 text-xs">
                <DebugItem label="ChainId" value={chainId} />
                <DebugItem
                  label="Signer"
                  value={
                    ethersSigner
                      ? `${ethersSigner.address.slice(0, 6)}...${ethersSigner.address.slice(-4)}`
                      : "No signer"
                  }
                />
                <DebugItem
                  label="Contract"
                  value={
                    votingSystem.contractAddress
                      ? `${votingSystem.contractAddress.slice(0, 6)}...${votingSystem.contractAddress.slice(-4)}`
                      : "Not deployed"
                  }
                />
                <DebugItem label="FHEVM Status" value={fhevmStatus} />
                <DebugItem
                  label="FHEVM Error"
                  value={fhevmError?.message || "No error"}
                />
                <DebugItem label="isRefreshing" value={votingSystem.isRefreshing} />
                <DebugItem label="isVoting" value={votingSystem.isVoting} />
                <DebugItem label="hasVoted" value={votingSystem.hasVoted} />
                <DebugItem label="isVotingActive" value={votingSystem.isVotingActive} />
                <DebugItem label="totalVotes" value={votingSystem.totalVotes} />
                <DebugItem label="canCastVote" value={votingSystem.canCastVote} />
                <DebugItem label="canRefreshResults" value={votingSystem.canRefreshResults} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function StatusItem({
  label,
  value,
  isGood,
}: {
  label: string;
  value: string;
  isGood: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isGood ? "bg-green-500" : "bg-red-500"
          }`}
        ></div>
        <span className="text-sm font-medium text-gray-800">{value}</span>
      </div>
    </div>
  );
}

function DebugItem({ label, value }: { label: string; value: unknown }) {
  const displayValue =
    typeof value === "boolean"
      ? value
        ? "true"
        : "false"
      : typeof value === "string" || typeof value === "number"
      ? String(value)
      : value === null || value === undefined
      ? String(value)
      : JSON.stringify(value);

  return (
    <div className="flex justify-between">
      <span className="text-gray-600 font-mono">{label}:</span>
      <span className="text-gray-800 font-mono font-semibold">{displayValue}</span>
    </div>
  );
}
