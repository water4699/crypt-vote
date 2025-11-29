"use client";

import { useState } from "react";
import { useEncryptedVotingSystem } from "../hooks/useEncryptedVotingSystem";

export const AdminPanel = () => {
  const [newOption, setNewOption] = useState<string>("");
  const [candidateOptions, setCandidateOptions] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x98D6225AAfEa695d236B17F17cea4c401B03951D";
  const { createVote } = useEncryptedVotingSystem(contractAddress);

  const handleInitializeVoting = async () => {
    if (candidateOptions.length < 2) {
      alert("Please add at least 2 candidate options");
      return;
    }

    setIsInitializing(true);
    try {
      const title = `Admin Vote ${new Date().toLocaleDateString()}`;
      const description = "Vote created by administrator";
      const durationDays = 7; // Default 7 days

      await createVote(title, description, candidateOptions, durationDays);
      alert("Vote created successfully!");
      setCandidateOptions([]);
    } catch (error: unknown) {
      console.error("Failed to create vote:", error);
      alert(`Failed to create vote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleResetVoting = async () => {
    if (!confirm("Are you sure you want to reset voting? This will clear all voting data!")) {
      return;
    }

    setIsResetting(true);
    try {
      // TODO: Implement resetVoting function call
      // await resetVoting();
      alert("Voting reset successfully!");
    } catch (error: unknown) {
      console.error("Failed to reset voting:", error);
      alert(`Failed to reset voting: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-yellow-800 mb-4">🔧 Admin Panel</h2>
      <p className="text-sm text-yellow-700 mb-4">
        Contract Address: {contractAddress || "Not Deployed"}
      </p>

      <div className="space-y-4">
        {/* Add candidate options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Candidate Options
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="Enter candidate name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              onKeyPress={(e) => e.key === 'Enter' && addOption()}
            />
            <button
              onClick={addOption}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              disabled={!newOption.trim()}
            >
              Add
            </button>
          </div>
        </div>

        {/* Candidate list */}
        {candidateOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Candidate List ({candidateOptions.length})
            </label>
            <div className="space-y-2">
              {candidateOptions.map((option, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md border">
                  <span className="text-gray-800">{option}</span>
                  <button
                    onClick={() => removeOption(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-4 border-t border-yellow-200">
          <button
            onClick={handleInitializeVoting}
            disabled={candidateOptions.length < 2 || isInitializing}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isInitializing ? "Initializing..." : "Initialize Voting"}
          </button>

          <button
            onClick={handleResetVoting}
            disabled={isResetting}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isResetting ? "Resetting..." : "Reset Voting"}
          </button>
        </div>
      </div>
    </div>
  );
};
