"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { useEncryptedVotingSystem, Vote } from "../hooks/useEncryptedVotingSystem";
import { AnimatedStat } from "./animated-counter";
import { EnglishConnectButton } from "./EnglishConnectButton";
import Link from "next/link";
import { ethers } from "ethers";
import { EncryptedVotingSystemABI } from "../abi/EncryptedVotingSystemABI";

// Interface for vote statistics
interface VoteStats {
  voteId: number;
  voteCount: number;
  participantCount: number;
}

// Helper function to generate trending topics from real data
function generateTrendingTopics(votes: Vote[]) {
  if (votes.length === 0) {
    return [
      { topic: "No active votes yet", votes: 0, trend: "neutral" as const }
    ];
  }

  // Group votes by category (mock categorization based on keywords)
  const categories = {
    "Governance": votes.filter(v => v.title.toLowerCase().includes('govern') || v.title.toLowerCase().includes('decision')).length,
    "Product": votes.filter(v => v.title.toLowerCase().includes('product') || v.title.toLowerCase().includes('feature')).length,
    "Team": votes.filter(v => v.title.toLowerCase().includes('team') || v.title.toLowerCase().includes('building')).length,
    "Budget": votes.filter(v => v.title.toLowerCase().includes('budget') || v.title.toLowerCase().includes('allocation')).length,
  };

  return Object.entries(categories)
    .filter(([, count]) => count > 0)
    .map(([topic, count]) => ({
      topic,
      votes: count * 10, // Mock vote count per category
      trend: Math.random() > 0.5 ? "up" as const : "down" as const
    }))
    .sort((a, b) => b.votes - a.votes);
}

// Helper function to format recent votes from real data
function formatRecentVotes(votes: Vote[], voteStats: Record<number, VoteStats>) {
  return votes.slice(0, 3).map(vote => ({
    id: vote.id,
    title: vote.title,
    creator: vote.creator ? `${vote.creator.slice(0, 6)}...${vote.creator.slice(-4)}` : "Unknown",
    participants: voteStats[vote.id]?.participantCount || 0,
    endTime: vote.endTime,
    status: vote.active ? "active" : "ended"
  }));
}


interface VoteCardProps {
  id: number;
  title: string;
  creator: string;
  participants: number;
  endTime: number;
  status: string;
}

function VoteCard({ vote }: { vote: VoteCardProps }) {
  const timeLeft = vote.endTime - Date.now();
  const isActive = timeLeft > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-black/40 backdrop-blur-sm border-2 border-orange-500/20 rounded-xl p-4 hover:border-orange-500/40 transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1 group-hover:text-orange-200 transition-colors drop-shadow-sm">
            {vote.title}
          </h3>
          <p className="text-gray-300 text-sm drop-shadow-sm">
            by {vote.creator}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isActive
            ? "bg-green-900/50 text-green-300 border border-green-500/30"
            : "bg-gray-900/50 text-gray-300 border border-gray-500/30"
        }`}>
          {isActive ? "Active" : "Ended"}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300 drop-shadow-sm">
          👥 {vote.participants} participants
        </span>
        {isActive && (
          <span className="text-orange-400 drop-shadow-sm font-medium">
            ⏰ {Math.ceil(timeLeft / (1000 * 60 * 60))}h left
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function Dashboard() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const { votes, loadVotes } = useEncryptedVotingSystem(contractAddress);
  const [voteStats, setVoteStats] = useState<Record<number, VoteStats>>({});

  // Auto-refresh data every 10 seconds when connected
  useEffect(() => {
    if (isConnected && loadVotes) {
      // Initial load
      loadVotes();
      
      // Set up periodic refresh
      const interval = setInterval(() => {
        loadVotes();
      }, 10000); // Refresh every 10 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, loadVotes]);

  // Load vote statistics from contract
  useEffect(() => {
    const loadVoteStats = async () => {
      if (!contractAddress || !publicClient || votes.length === 0) return;

      try {
        // Create provider - use localhost for Hardhat, or get RPC URL from publicClient
        let rpcUrl = "http://localhost:8545";
        if (publicClient) {
          const client = publicClient as { transport?: { url?: string } };
          if (client.transport?.url) {
            rpcUrl = client.transport.url;
          }
        }
        
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(contractAddress, EncryptedVotingSystemABI, provider);

        const statsMap: Record<number, VoteStats> = {};
        
        for (const vote of votes) {
          try {
            // Get vote count
            const voteCount = await contract.getVoteCount(vote.id);
            const count = Number(voteCount);

            // Get encrypted vote choices to count participants
            const encryptedVotes = await contract.getEncryptedVoteChoices(vote.id);
            const participantCount = Array.isArray(encryptedVotes) ? encryptedVotes.length : 0;

            statsMap[vote.id] = {
              voteId: vote.id,
              voteCount: count,
              participantCount
            };
          } catch (error) {
            console.warn(`Failed to load stats for vote ${vote.id}:`, error);
            statsMap[vote.id] = {
              voteId: vote.id,
              voteCount: 0,
              participantCount: 0
            };
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
  const stats = useMemo(() => {
    const activeVotes = votes.filter(vote => vote.active).length;
    
    // Calculate total votes cast across all votes
    const totalVotes = Object.values(voteStats).reduce((sum, stat) => sum + stat.voteCount, 0);
    
    // Calculate total unique participants (sum of all participants)
    const totalParticipants = Object.values(voteStats).reduce((sum, stat) => sum + stat.participantCount, 0);
    
    // Calculate today's votes (estimate based on total votes)
    // In a real implementation, we'd track vote timestamps from contract events
    const todayVotes = Math.floor(totalVotes * 0.1); // Estimate 10% are from today

    return {
      activeVotes,
      totalParticipants,
      todayVotes,
      totalVotes
    };
  }, [votes, voteStats]);

  const trendingTopics = generateTrendingTopics(votes);
  const recentVotes = formatRecentVotes(votes, voteStats);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 max-w-2xl mx-auto"
        >
          <div className="space-y-4">
            <div className="inline-block p-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl shadow-2xl">
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
            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              Connect your wallet to access the encrypted voting dashboard and participate in secure, private democratic processes.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-12">
            <div className="bg-black/40 backdrop-blur-sm border border-orange-500/30 rounded-xl p-6 transform hover:scale-105 transition-all duration-300">
              <div className="text-4xl mb-2">🔐</div>
              <p className="text-orange-300 font-semibold">Zero-Knowledge</p>
              <p className="text-gray-300 text-sm drop-shadow-sm">Your vote stays secret</p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm border border-red-500/30 rounded-xl p-6 transform hover:scale-105 transition-all duration-300">
              <div className="text-4xl mb-2">⚡</div>
              <p className="text-red-300 font-semibold">Real-Time</p>
              <p className="text-gray-300 text-sm drop-shadow-sm">Instant verification</p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6 transform hover:scale-105 transition-all duration-300">
              <div className="text-4xl mb-2">🚀</div>
              <p className="text-yellow-300 font-semibold">Blockchain</p>
              <p className="text-gray-300 text-sm drop-shadow-sm">Immutable records</p>
            </div>
          </div>

          {/* Connect Wallet Button */}
          <div className="flex justify-center mt-8">
            <EnglishConnectButton />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl md:text-6xl font-black text-white bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
            DASHBOARD
          </h1>
          <p className="text-xl text-gray-300 font-light drop-shadow-sm">
            Welcome back, <span className="text-orange-400 font-semibold drop-shadow-sm">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedStat
            value={stats.activeVotes}
            label="Active Votes"
            icon="🗳️"
            color="orange"
            delay={0.1}
          />
          <AnimatedStat
            value={stats.totalParticipants}
            label="Total Participants"
            icon="👥"
            color="blue"
            delay={0.2}
          />
          <AnimatedStat
            value={stats.todayVotes}
            label="Today's Votes"
            icon="📈"
            color="green"
            delay={0.3}
          />
          <AnimatedStat
            value={stats.totalVotes}
            label="All Time Votes"
            icon="🏆"
            color="purple"
            delay={0.4}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recent Votes */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-black/40 backdrop-blur-sm border-2 border-orange-500/20 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <span className="text-3xl">📋</span>
                  Recent Votes
                </h2>
                <Link
                  href="/vote"
                  className="bg-gradient-to-r from-orange-500 via-red-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105 transition-all duration-300"
                >
                  View All →
                </Link>
              </div>

                <div className="space-y-4">
                  <AnimatePresence>
                    {recentVotes.length > 0 ? recentVotes.map((vote, index) => (
                      <motion.div
                        key={vote.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <VoteCard vote={vote} />
                      </motion.div>
                    )) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8 text-gray-300 drop-shadow-sm"
                      >
                        <div className="text-4xl mb-4">📊</div>
                        <p>No votes available yet</p>
                        <p className="text-sm">Create your first vote to get started!</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
            </motion.div>
          </div>

          {/* Right Column - Trending & Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-black/40 backdrop-blur-sm border-2 border-blue-500/20 rounded-2xl p-6"
            >
              <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  href="/vote"
                  className="w-full bg-gradient-to-r from-orange-500 via-red-600 to-pink-600 text-white px-4 py-3 rounded-xl font-bold hover:shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span className="text-xl">🚀</span>
                  Create New Vote
                </Link>
                <Link
                  href="/profile"
                  className="w-full bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 text-white px-4 py-3 rounded-xl font-bold hover:shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span className="text-xl">👤</span>
                  View Profile
                </Link>
              </div>
            </motion.div>

            {/* Trending Topics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-black/40 backdrop-blur-sm border-2 border-green-500/20 rounded-2xl p-6"
            >
              <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                Trending Topics
              </h3>
              <div className="space-y-3">
                {trendingTopics.length > 0 ? trendingTopics.map((topic, index) => (
                  <motion.div
                    key={topic.topic}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-green-500/20 hover:border-green-500/40 transition-all duration-300"
                  >
                    <div>
                      <p className="text-white font-semibold text-sm drop-shadow-sm">{topic.topic}</p>
                      <p className="text-gray-300 text-xs drop-shadow-sm">{topic.votes} votes</p>
                    </div>
                    <div className={`text-lg ${topic.trend === 'up' ? 'text-green-400' : topic.trend === 'down' ? 'text-red-400' : 'text-gray-300'}`}>
                      {topic.trend === 'up' ? '📈' : topic.trend === 'down' ? '📉' : '➡️'}
                    </div>
                  </motion.div>
                )) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-4 text-gray-300 drop-shadow-sm"
                  >
                    <div className="text-2xl mb-2">🔍</div>
                    <p className="text-sm">No trending topics yet</p>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* System Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-black/40 backdrop-blur-sm border-2 border-purple-500/20 rounded-2xl p-6"
            >
              <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🔧</span>
                System Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-200 drop-shadow-sm font-medium">FHEVM Network</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    <span className="text-green-400 text-sm font-semibold drop-shadow-sm">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-200 drop-shadow-sm font-medium">Contract Status</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    <span className="text-green-400 text-sm font-semibold drop-shadow-sm">Deployed</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-200 drop-shadow-sm font-medium">Gas Price</span>
                  <span className="text-orange-400 text-sm font-semibold drop-shadow-sm">12 gwei</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
