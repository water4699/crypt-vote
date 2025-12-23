"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function AnimatedCounter({ value, duration = 2, className = "", style }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: "easeOut",
    });

    const unsubscribe = rounded.on("change", (latest) => {
      setDisplayValue(latest);
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, duration, motionValue, rounded]);

  return (
    <motion.span className={className} style={style}>
      {displayValue.toLocaleString()}
    </motion.span>
  );
}

interface AnimatedProgressProps {
  value: number;
  max: number;
  duration?: number;
  className?: string;
  showPercentage?: boolean;
}

export function AnimatedProgress({
  value,
  max,
  duration = 1.5,
  className = "",
  showPercentage = true
}: AnimatedProgressProps) {
  const [progress, setProgress] = useState(0);
  const percentage = Math.round((value / max) * 100);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(percentage);
    }, 100);

    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-gray-300 drop-shadow-sm">Progress</span>
        {showPercentage && (
          <AnimatedCounter
            value={percentage}
            duration={duration}
            className="text-orange-400 font-semibold"
          />
        )}
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

interface AnimatedStatProps {
  value: number;
  label: string;
  icon: string;
  color: string;
  delay?: number;
}

export function AnimatedStat({ value, label, icon, color, delay = 0 }: AnimatedStatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={`bg-black/40 backdrop-blur-sm border-2 border-${color}-500/30 rounded-2xl p-6 transform hover:scale-105 transition-all duration-300 group`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r from-${color}-500 to-${color}-600 flex items-center justify-center shadow-lg shadow-${color}-500/30`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-gray-300 text-sm font-medium drop-shadow-sm">{label}</p>
        <div className="relative">
          <AnimatedCounter
            value={value}
            className="text-3xl font-black text-white drop-shadow-2xl"
            style={{
              textShadow: `0 0 20px rgba(0, 0, 0, 1), 0 2px 8px rgba(0, 0, 0, 0.8), 0 0 40px currentColor`,
              color: color === 'orange' ? '#ff6b35' : color === 'blue' ? '#3b82f6' : color === 'green' ? '#22c55e' : '#a855f7',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
