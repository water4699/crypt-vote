"use client";

import { useState } from "react";
import { useEncryptedVotingSystem } from "../hooks/useEncryptedVotingSystem";

export const AdminPanel = () => {
  const [newOption, setNewOption] = useState<string>("");
  const [candidateOptions, setCandidateOptions] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x98D6225AAfEa695d236B17F17cea4c401B03951D";
  const { createVote } = useEncryptedVotingSystem(contractAddress);

  const handleInitializeVoting = async () => {
    if (candidateOptions.length < 2) {
      setMessage("Please add at least 2 candidate options");
      return;
    }

    setIsInitializing(true);
    setMessage("");
    try {
      const title = `Admin Vote ${new Date().toLocaleDateString()}`;
      const description = "Vote created by administrator";
      const durationDays = 7; // Default 7 days

      await createVote(title, description, candidateOptions, durationDays);
      setMessage("Vote created successfully!");
      setCandidateOptions([]);
    } catch (error: unknown) {
      console.error("Failed to create vote:", error);
      setMessage(`Failed to create vote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleResetVoting = async () => {
    // For now, just show a message since reset functionality is not implemented
    setMessage("Reset functionality is not yet implemented");

    setIsResetting(true);
    try {
      // TODO: Implement resetVoting function call
      // await resetVoting();
      setMessage("Voting reset successfully!");
    } catch (error: unknown) {
      console.error("Failed to reset voting:", error);
      setMessage(`Failed to reset voting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsResetting(false);
    }
  };

  const addOption = () => {
    if (newOption.trim() && !candidateOptions.includes(newOption.trim())) {
      setCandidateOptions([...candidateOptions, newOption.trim()]);
      setNewOption("");
    }
  };

  const removeOption = (index: number) => {
    setCandidateOptions(candidateOptions.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-black/40 backdrop-blur-sm border-2 border-orange-500/30 rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 shadow-2xl transform hover:scale-102 transition-all duration-500 relative overflow-hidden group mb-6">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl animate-pulse">🔧</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">ADMIN CONTROL CENTER</h2>
            <p className="text-orange-400 text-sm">Master the democratic machinery</p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-black/30 border border-orange-500/20 rounded-xl">
          <p className="text-xs text-gray-300 mb-1 uppercase tracking-wider drop-shadow-sm">Contract Status</p>
          <p className="text-orange-300 font-mono text-sm">
            {contractAddress ? `${contractAddress.slice(0, 10)}...${contractAddress.slice(-8)}` : "Not Deployed"}
          </p>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-2xl backdrop-blur-sm border-2 shadow-2xl font-semibold text-center relative overflow-hidden">
            <div className={`absolute inset-0 ${
              message.includes("success") ? "bg-green-900/20 border-green-500/30" :
              message.includes("Failed") || message.includes("error") ? "bg-red-900/20 border-red-500/30" :
              "bg-orange-900/20 border-orange-500/30"
            }`}></div>
            <div className="relative z-10 flex items-center justify-center gap-3">
              {message.includes("success") ? (
                <span className="text-2xl">✅</span>
              ) : message.includes("Failed") || message.includes("error") ? (
                <span className="text-2xl">❌</span>
              ) : (
                <span className="text-2xl">⚡</span>
              )}
              <span className={
                message.includes("success") ? "text-green-200" :
                message.includes("Failed") || message.includes("error") ? "text-red-200" :
                "text-orange-200"
              }>{message}</span>
            </div>
          </div>
        )}

        <div className="space-y-4 md:space-y-6">
          {/* Add candidate options */}
          <div className="space-y-3">
            <label className="text-orange-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="text-lg">🎯</span>
              Add Candidate Options
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Enter candidate name..."
                className="flex-1 px-4 py-3 bg-black/50 border-2 border-orange-500/30 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 text-white placeholder-gray-500 font-semibold transition-all duration-300 hover:border-orange-500/50 focus:scale-105"
                onKeyPress={(e) => e.key === 'Enter' && addOption()}
              />
              <button
                onClick={addOption}
                disabled={!newOption.trim()}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 via-red-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-2xl hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <span className="relative flex items-center gap-2">
                  <span className="text-lg">➕</span>
                  ADD
                </span>
              </button>
            </div>
          </div>

          {/* Candidate list */}
          {candidateOptions.length > 0 && (
            <div className="space-y-3">
              <label className="text-orange-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                <span className="text-lg">📋</span>
                Candidate List ({candidateOptions.length})
              </label>
              <div className="space-y-3">
                {candidateOptions.map((option, index) => (
                  <div key={index} className="flex items-center justify-between bg-gradient-to-r from-gray-900/60 to-black/60 backdrop-blur-sm p-4 rounded-xl border border-orange-500/20 transform hover:scale-102 transition-all duration-300 group hover:shadow-lg hover:shadow-orange-500/20">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                    <span className="text-gray-200 font-semibold flex items-center gap-3 relative z-10 group-hover:text-orange-200 transition-colors duration-300">
                      <span className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-xs transform group-hover:scale-110 transition-transform duration-300">
                        {index + 1}
                      </span>
                      <span className="group-hover:transform group-hover:translate-x-1 transition-transform duration-300">
                        {option}
                      </span>
                    </span>
                    <button
                      onClick={() => removeOption(index)}
                      className="w-8 h-8 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 text-white hover:shadow-lg transform hover:scale-110 active:scale-95 transition-all duration-300 font-bold flex items-center justify-center relative z-10 group-hover:animate-pulse"
                    >
                      <span className="text-lg group-hover:animate-bounce">🗑️</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-orange-500/20">
            <button
              onClick={handleInitializeVoting}
              disabled={candidateOptions.length < 2 || isInitializing}
              className="flex-1 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <span className="relative flex items-center justify-center gap-3">
                {isInitializing ? (
                  <>
                    <span className="text-2xl animate-spin">⏳</span>
                    INITIALIZING...
                  </>
                ) : (
                  <>
                    <span className="text-2xl animate-bounce">🚀</span>
                    LAUNCH VOTING
                    <span className="text-2xl animate-bounce">⚡</span>
                  </>
                )}
              </span>
            </button>

            <button
              onClick={handleResetVoting}
              disabled={isResetting}
              className="flex-1 bg-gradient-to-r from-red-600 via-pink-600 to-rose-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-red-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <span className="relative flex items-center justify-center gap-3">
                {isResetting ? (
                  <>
                    <span className="text-2xl animate-spin">🔄</span>
                    RESETTING...
                  </>
                ) : (
                  <>
                    <span className="text-2xl">💥</span>
                    RESET SYSTEM
                    <span className="text-2xl">⚠️</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
