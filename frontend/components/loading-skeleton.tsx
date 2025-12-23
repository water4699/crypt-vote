"use client";

import { motion } from "framer-motion";

export function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-700 rounded h-full w-full"></div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-black/40 backdrop-blur-sm border-2 border-gray-600/30 rounded-2xl p-6"
    >
      <div className="space-y-4">
        <LoadingSkeleton className="h-6 w-3/4" />
        <LoadingSkeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          <LoadingSkeleton className="h-3 w-full" />
          <LoadingSkeleton className="h-3 w-5/6" />
          <LoadingSkeleton className="h-3 w-4/6" />
        </div>
      </div>
    </motion.div>
  );
}

export function StatsSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-black/40 backdrop-blur-sm border-2 border-gray-600/30 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <LoadingSkeleton className="w-12 h-12 rounded-xl" />
        <LoadingSkeleton className="w-12 h-6 rounded" />
      </div>
      <LoadingSkeleton className="h-8 w-16 mb-2" />
      <LoadingSkeleton className="h-4 w-20" />
    </motion.div>
  );
}

export function PageLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full mx-auto"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-orange-400 font-semibold"
        >
          Loading Crypto Vote...
        </motion.p>
      </motion.div>
    </div>
  );
}
