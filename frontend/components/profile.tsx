"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { useEncryptedVotingSystem } from "../hooks/useEncryptedVotingSystem";
import { ethers } from "ethers";
import { EncryptedVotingSystemABI } from "../abi/EncryptedVotingSystemABI";

// Achievement type definition
type Achievement = {
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
};

// Achievements based on real stats
const getAchievements = (votesCount: number, createdCount: number): Achievement[] => [
  { 
    name: "First Vote", 
    icon: "🎯", 
    description: "Cast your first encrypted vote", 
    unlocked: votesCount >= 1 
  },
  { 
    name: "Vote Creator", 
    icon: "🚀", 
    description: "Created your first vote", 
    unlocked: createdCount >= 1 
  },
  { 
    name: "Community Leader", 
    icon: "👑", 
    description: "Voted in 10+ polls", 
    unlocked: votesCount >= 10 
  },
  { 
    name: "Privacy Champion", 
    icon: "🔐", 
    description: "Voted in 50+ encrypted polls", 
    unlocked: votesCount >= 50 
  }
];

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
        achievement.unlocked
          ? "bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30"
          : "bg-gray-900/50 border-gray-600/30 opacity-60"
      }`}
    >
      <div className="text-center space-y-2">
        <div className={`text-3xl ${achievement.unlocked ? "animate-bounce" : "grayscale"}`}>
          {achievement.icon}
        </div>
        <h3 className={`font-bold ${achievement.unlocked ? "text-yellow-300" : "text-gray-500"}`}>
          {achievement.name}
        </h3>
        <p className={`text-sm ${achievement.unlocked ? "text-gray-300" : "text-gray-500"}`}>
          {achievement.description}
        </p>
        {!achievement.unlocked && (
          <div className="text-xs text-gray-500 mt-2">🔒 Locked</div>
        )}
      </div>
    </motion.div>
  );
}

// Vote history item type
type VoteHistoryItemType = {
  id: number;
  title: string;
  status: string;
  votes: number;
  result: string;
  date: string;
};

function VoteHistoryItem({ vote }: { vote: VoteHistoryItemType }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-black/40 backdrop-blur-sm border-2 border-orange-500/20 rounded-xl p-4 hover:border-orange-500/40 transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">{vote.title}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-300 drop-shadow-sm">
            <span>🗳️ {vote.votes} votes</span>
            <span>📅 {vote.date}</span>
          </div>
        </div>
        <div className="text-right">
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
            vote.status === 'completed'
              ? "bg-green-900/50 text-green-300 border border-green-500/30"
              : "bg-blue-900/50 text-blue-300 border border-blue-500/30"
          }`}>
            {vote.status === 'completed' ? '✅' : '⏳'} {vote.status}
          </div>
          <div className="text-gray-300 text-sm">
            Result: <span className="text-orange-400 font-semibold">{vote.result}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PrivacySettings() {
  const [settings, setSettings] = useState({
    anonymousVoting: true,
    shareVotingHistory: false,
    allowAnalytics: true,
    publicProfile: false
  });

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-black text-white mb-4">🔒 Privacy Settings</h3>

      {Object.entries(settings).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-gray-600/30">
          <div>
            <h4 className="text-white font-semibold capitalize">
              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </h4>
            <p className="text-gray-300 text-sm drop-shadow-sm">
              {key === 'anonymousVoting' && 'Keep your votes completely anonymous'}
              {key === 'shareVotingHistory' && 'Allow others to see your voting history'}
              {key === 'allowAnalytics' && 'Help improve the platform with usage data'}
              {key === 'publicProfile' && 'Make your profile visible to other users'}
            </p>
          </div>
          <button
            onClick={() => handleSettingChange(key, !value)}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
              value ? 'bg-green-500' : 'bg-gray-600'
            }`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 ${
              value ? 'translate-x-6' : 'translate-x-0'
            }`}></div>
          </button>
        </div>
      ))}
    </div>
  );
}

export function Profile() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'created' | 'achievements' | 'settings'>('overview');
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const { votes, userVotes, decryptedUserVotes, loadVotes } = useEncryptedVotingSystem(contractAddress);
  const [voteStats, setVoteStats] = useState<Record<number, { voteCount: number; participants: number }>>({});

  // Load votes on mount
  useEffect(() => {
    if (isConnected && loadVotes) {
      loadVotes();
      
      // Refresh every 10 seconds
      const interval = setInterval(() => {
        loadVotes();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isConnected, loadVotes]);

  // Load vote statistics from contract
  useEffect(() => {
    const loadVoteStats = async () => {
      if (!contractAddress || !publicClient || votes.length === 0) return;

      try {
        let rpcUrl = "http://localhost:8545";
        if (publicClient) {
          const client = publicClient as { transport?: { url?: string } };
          if (client.transport?.url) {
            rpcUrl = client.transport.url;
          }
        }
        
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(contractAddress, EncryptedVotingSystemABI, provider);

        const statsMap: Record<number, { voteCount: number; participants: number }> = {};
        
        for (const vote of votes) {
          try {
            const voteCount = await contract.getVoteCount(vote.id);
            const encryptedVotes = await contract.getEncryptedVoteChoices(vote.id);
            
            statsMap[vote.id] = {
              voteCount: Number(voteCount),
              participants: Array.isArray(encryptedVotes) ? encryptedVotes.length : 0
            };
          } catch (error) {
            console.warn(`Failed to load stats for vote ${vote.id}:`, error);
            statsMap[vote.id] = { voteCount: 0, participants: 0 };
          }
        }

        setVoteStats(statsMap);
      } catch (error) {
        console.error("Error loading vote statistics:", error);
      }
    };

    if (isConnected && votes.length > 0) {
      loadVoteStats();
    }
  }, [contractAddress, publicClient, votes, isConnected]);

  // Calculate real statistics from votes data
  const userVotingHistory = votes.filter(vote => {
    // Check if user has voted in this vote
    return userVotes[vote.id] !== undefined;
  }).map(vote => ({
    id: vote.id,
    title: vote.title,
    status: vote.active ? 'active' : 'completed',
    votes: voteStats[vote.id]?.voteCount || 0,
    result: decryptedUserVotes[vote.id] !== undefined 
      ? `Option ${decryptedUserVotes[vote.id]}` 
      : 'Pending',
    date: new Date(vote.startTime * 1000).toISOString().split('T')[0]
  }));

  const userCreatedVotes = votes.filter(vote => 
    vote.creator?.toLowerCase() === address?.toLowerCase()
  ).map(vote => ({
    id: vote.id,
    title: vote.title,
    status: vote.active ? 'active' : 'completed',
    participants: voteStats[vote.id]?.participants || 0,
    date: new Date(vote.startTime * 1000).toISOString().split('T')[0]
  }));

  // Calculate user stats
  const userStats = {
    totalVotes: userVotingHistory.length,
    createdVotes: userCreatedVotes.length,
    activeVotes: userVotingHistory.filter(v => v.status === 'active').length,
    reputation: userVotingHistory.length * 10 + userCreatedVotes.length * 20,
    level: userVotingHistory.length < 5 ? 'Beginner' : 
           userVotingHistory.length < 20 ? 'Intermediate' : 
           userVotingHistory.length < 50 ? 'Expert' : 'Master'
  };

  // Get dynamic achievements
  const achievements = getAchievements(userStats.totalVotes, userStats.createdVotes);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'history', label: 'Voting History', icon: '📋' },
    { id: 'created', label: 'Created Votes', icon: '🚀' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="text-6xl">🔐</div>
          <h1 className="text-3xl font-black text-white">Access Restricted</h1>
          <p className="text-gray-300 max-w-md mx-auto drop-shadow-sm">
            Please connect your wallet to view your profile and voting history.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-sm border-2 border-orange-500/20 rounded-2xl p-8"
        >
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-orange-500 via-red-600 to-pink-600 flex items-center justify-center text-4xl shadow-lg shadow-orange-500/30">
              👤
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-white mb-2">Crypto Voter</h1>
              <p className="text-gray-300 mb-4 drop-shadow-sm">
                {address?.slice(0, 6)}...{address?.slice(-4)} • Joined 2024-01-15
              </p>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-black text-orange-400">{userStats.reputation}</div>
                  <div className="text-sm text-gray-300 drop-shadow-sm">Reputation</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-blue-400">{userStats.level}</div>
                  <div className="text-sm text-gray-300 drop-shadow-sm">Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-green-400">{userStats.totalVotes}</div>
                  <div className="text-sm text-gray-300 drop-shadow-sm">Total Votes</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/40 backdrop-blur-sm border-2 border-blue-500/20 rounded-2xl p-2"
        >
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                    : "text-gray-300 hover:text-white hover:bg-blue-500/10"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="space-y-6">
                <div className="bg-black/40 backdrop-blur-sm border-2 border-green-500/20 rounded-2xl p-6">
                  <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">📈</span>
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {userVotingHistory.slice(0, 3).map((vote) => (
                      <div key={vote.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                        <div>
                          <p className="text-white font-semibold text-sm">{vote.title}</p>
                          <p className="text-gray-300 text-xs drop-shadow-sm">{vote.date}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-semibold ${
                          vote.status === 'completed' ? 'bg-green-900/50 text-green-300' : 'bg-blue-900/50 text-blue-300'
                        }`}>
                          {vote.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/40 backdrop-blur-sm border-2 border-purple-500/20 rounded-2xl p-6">
                  <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    Recent Achievements
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {achievements.filter(a => a.unlocked).slice(0, 4).map((achievement) => (
                      <div key={achievement.name} className="text-center p-3 bg-black/30 rounded-lg">
                        <div className="text-2xl mb-2">{achievement.icon}</div>
                        <p className="text-yellow-300 font-semibold text-sm">{achievement.name}</p>
                      </div>
                    ))}
                    {achievements.filter(a => a.unlocked).length === 0 && (
                      <div className="col-span-2 text-center p-4 text-gray-500">
                        No achievements unlocked yet
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-black/40 backdrop-blur-sm border-2 border-red-500/20 rounded-2xl p-6">
                <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Voting Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-black/30 rounded-lg">
                    <span className="text-gray-300">Total Votes Cast</span>
                    <span className="text-orange-400 font-bold">{userStats.totalVotes}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-black/30 rounded-lg">
                    <span className="text-gray-300">Created Votes</span>
                    <span className="text-blue-400 font-bold">{userStats.createdVotes}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-black/30 rounded-lg">
                    <span className="text-gray-300">Active Votes</span>
                    <span className="text-green-400 font-bold">{userStats.activeVotes}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-black/30 rounded-lg">
                    <span className="text-gray-300">All Votes in System</span>
                    <span className="text-purple-400 font-bold">{votes.length}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <h3 className="text-2xl font-black text-white mb-6">📋 Voting History</h3>
              {userVotingHistory.length > 0 ? (
                userVotingHistory.map((vote) => (
                  <VoteHistoryItem key={vote.id} vote={vote} />
                ))
              ) : (
                <div className="text-center py-12 bg-black/40 backdrop-blur-sm border-2 border-gray-500/20 rounded-2xl">
                  <div className="text-6xl mb-4">🗳️</div>
                  <h4 className="text-xl font-bold text-gray-300 mb-2">No Voting History Yet</h4>
                  <p className="text-gray-500">Cast your first vote to see it here!</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'created' && (
            <motion.div
              key="created"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <h3 className="text-2xl font-black text-white mb-6">🚀 Created Votes</h3>
              {userCreatedVotes.length > 0 ? (
                userCreatedVotes.map((vote) => (
                  <motion.div
                    key={vote.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-black/40 backdrop-blur-sm border-2 border-green-500/20 rounded-xl p-4 hover:border-green-500/40 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold mb-1">{vote.title}</h3>
                        <p className="text-gray-300 text-sm drop-shadow-sm">
                          👥 {vote.participants} participants • 📅 {vote.date}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        vote.status === 'active'
                          ? "bg-blue-900/50 text-blue-300 border border-blue-500/30"
                          : "bg-green-900/50 text-green-300 border border-green-500/30"
                      }`}>
                        {vote.status}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 bg-black/40 backdrop-blur-sm border-2 border-gray-500/20 rounded-2xl">
                  <div className="text-6xl mb-4">🚀</div>
                  <h4 className="text-xl font-bold text-gray-300 mb-2">No Created Votes Yet</h4>
                  <p className="text-gray-500">Create your first vote to see it here!</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h3 className="text-2xl font-black text-white mb-6">🏆 Achievements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement) => (
                  <AchievementCard key={achievement.name} achievement={achievement} />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-black/40 backdrop-blur-sm border-2 border-gray-500/20 rounded-2xl p-6"
            >
              <PrivacySettings />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
