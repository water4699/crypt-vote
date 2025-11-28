"use client";

import { useState } from "react";
import { useEncryptedVotingSystem, Vote, VoteResult } from "../hooks/useEncryptedVotingSystem";
import { useAccount } from "wagmi";

export const EncryptedVotingDemo = () => {
  const { address, isConnected } = useAccount();
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const {
    votes,
    currentVote,
    userVotes,
    decryptedResults,
    decryptedUserVotes,
    isLoading,
    message,
    createVote,
    castVote,
    decryptUserVote,
    decryptVoteResults,
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

  const handleDecryptResults = async (voteId: number) => {
    try {
      const results = await decryptVoteResults(voteId);
      console.log("Decrypted results:", results);

      // Count votes by option
      const counts: Record<number, number> = {};
      results.forEach(result => {
        counts[result.optionId] = (counts[result.optionId] || 0) + 1;
      });

      alert(`Results decrypted! Check console for details.`);
    } catch (error) {
      console.error("Failed to decrypt results:", error);
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 w-full">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-800">Encrypted Voting System</h2>
          <p className="text-gray-600 text-xl">
            Secure and private voting powered by FHEVM (Fully Homomorphic Encryption)
          </p>
          <p className="text-gray-500">
            Connect your wallet to create votes, cast encrypted votes, and decrypt results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 px-4 md:px-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6 md:p-8 shadow-xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          🔐 Encrypted Voting System
        </h1>
        <p className="text-blue-100 text-sm md:text-base">
          Create secure votes, cast encrypted ballots, and decrypt results privately using FHEVM
        </p>
        {address && (
          <p className="text-blue-200 text-sm mt-2">
            Connected: {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        )}
      </div>

      {/* Status Messages */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes("Error") || message.includes("Failed")
            ? "bg-red-50 border border-red-200 text-red-800"
            : message.includes("success")
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-blue-50 border border-blue-200 text-blue-800"
        }`}>
          {message}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Create Vote */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <span className="text-white text-xl">➕</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Create New Vote</h2>
            </div>

            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Create Vote
              </button>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Vote Title"
                  value={newVote.title}
                  onChange={(e) => setNewVote(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />

                <textarea
                  placeholder="Vote Description"
                  value={newVote.description}
                  onChange={(e) => setNewVote(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Options:</label>
                  {newVote.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      {newVote.options.length > 2 && (
                        <button
                          onClick={() => removeOption(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addOption}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
                  >
                    + Add Option
                  </button>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Duration (days):</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={newVote.durationDays}
                    onChange={(e) => setNewVote(prev => ({ ...prev, durationDays: parseInt(e.target.value) || 7 }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCreateVote}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Creating..." : "Create Vote"}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-3 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Vote Statistics */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">System Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Votes:</span>
                <span className="font-semibold">{votes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Your Votes:</span>
                <span className="font-semibold">{Object.keys(userVotes).length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Vote List & Voting */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Votes */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Active Votes</h2>
              <button
                onClick={loadVotes}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                🔄 Refresh
              </button>
            </div>

            {votes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📊</div>
                <p>No active votes yet. Create the first vote!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {votes.filter(vote => vote.active).map((vote) => (
                  <div key={vote.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{vote.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{vote.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Created by: {vote.creator.slice(0, 6)}...{vote.creator.slice(-4)}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <div>Ends: {new Date(vote.endTime * 1000).toLocaleDateString()}</div>
                        <div className="text-green-600 font-semibold">Active</div>
                      </div>
                    </div>

                    {/* Voting Options */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-700 mb-2">Select your option:</h4>
                      <div className="space-y-2">
                        {vote.options.map((option, index) => (
                          <label key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name={`vote-${vote.id}`}
                              value={index}
                              checked={selectedVoteId === vote.id && selectedOption === index}
                              onChange={() => {
                                setSelectedVoteId(vote.id);
                                setSelectedOption(index);
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Vote Actions */}
                    <div className="flex gap-2">
                      {selectedVoteId === vote.id && !userVotes[vote.id] && (
                        <button
                          onClick={handleCastVote}
                          disabled={isLoading}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
                        >
                          🗳️ Cast Vote
                        </button>
                      )}

                      {userVotes[vote.id] && (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-green-600">
                            <span>✅</span>
                            <span className="font-semibold">Vote Cast</span>
                          </div>
                          {!decryptedResults[vote.id] ? (
                            <div className="relative">
                              {/* Locked vote display */}
                              <div className="flex items-center justify-center p-4 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
                                <div className="text-center">
                                  <span className="text-2xl">🔒</span>
                                  <p className="text-gray-600 text-sm mt-1">Vote Encrypted</p>
                                  <button
                                    onClick={() => decryptUserVote(vote.id)}
                                    disabled={isLoading}
                                    className="mt-2 text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
                                  >
                                    🔓 Decrypt Results
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2 text-green-700 mb-3">
                                <span>🔓</span>
                                <span className="font-semibold">Vote Results Decrypted</span>
                              </div>
                              {decryptedResults[vote.id] && decryptedResults[vote.id].length > 0 ? (
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-gray-800 text-center mb-2">Final Results:</h4>
                                  {decryptedResults[vote.id].map((result) => (
                                    <div key={result.optionId} className="flex justify-between items-center py-1">
                                      <span className="text-gray-700">{vote.options[result.optionId]}</span>
                                      <span className="font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                        {result.count} vote{result.count !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  ))}
                                  {decryptedUserVotes[vote.id] !== undefined && (
                                    <div className="mt-3 pt-3 border-t border-green-200">
                                      <p className="text-center text-green-700 text-sm">
                                        Your vote: <span className="font-semibold">{vote.options[decryptedUserVotes[vote.id]]}</span>
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center text-gray-600">
                                  <p>No results available</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Votes */}
          {votes.filter(vote => !vote.active).length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Completed Votes</h2>
              <div className="space-y-4">
                {votes.filter(vote => !vote.active).map((vote) => (
                  <div key={vote.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{vote.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{vote.description}</p>
                      </div>
                      <button
                        onClick={() => handleDecryptResults(vote.id)}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
                      >
                        🔓 Decrypt Results
                      </button>
                    </div>

                    {/* Show decrypted results if available */}
                    {decryptedResults[vote.id] && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Results:</h4>
                        <div className="space-y-1">
                          {decryptedResults[vote.id].map((result) => (
                            <div key={result.optionId} className="flex justify-between text-sm">
                              <span>{vote.options[result.optionId]}</span>
                              <span className="font-bold text-blue-600">{result.count} votes</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
