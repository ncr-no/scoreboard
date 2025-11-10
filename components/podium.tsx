'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Medal, Target, Crown } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface PodiumEntry {
  rank: number;
  name: string;
  score: number;
  solvedChallenges?: number;
}

interface PodiumProps {
  topThree: PodiumEntry[];
  isLoading?: boolean;
}

const AnimatedScore = ({ score, previousScore }: { score: number; previousScore: number }) => {
  const [displayScore, setDisplayScore] = useState(previousScore);

  useEffect(() => {
    if (score !== previousScore) {
      const duration = 800;
      const steps = 30;
      const increment = (score - previousScore) / steps;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayScore(score);
          clearInterval(timer);
        } else {
          setDisplayScore(Math.round(previousScore + increment * currentStep));
        }
      }, stepDuration);

      return () => clearInterval(timer);
    }
  }, [score, previousScore]);

  return (
    <span className="score-count inline-block">
      {displayScore.toLocaleString()}
    </span>
  );
};

const PodiumPlace = ({ 
  entry, 
  rank, 
  platformHeight,
  platformWidth,
  delay,
  previousScore 
}: { 
  entry: PodiumEntry | undefined; 
  rank: 1 | 2 | 3;
  platformHeight: string;
  platformWidth: string;
  delay: number;
  previousScore: number;
}) => {
  const configs = {
    1: {
      gradient: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 20%, #ffd700 40%, #f4c430 60%, #ffd700 80%, #daa520 100%)',
      glowClass: 'podium-glow-gold',
      icon: Crown,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      iconSize: 'h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8',
      iconGlow: 'bg-yellow-300/40',
      textColor: 'text-gray-900 dark:text-gray-100',
      textColorSecondary: 'text-gray-700 dark:text-gray-300',
      textColorTertiary: 'text-gray-600 dark:text-gray-400',
      textShadow: '0 2px 4px rgba(0,0,0,0.2)',
      borderColor: 'border-yellow-400 dark:border-yellow-500',
      shadow: '0 20px 40px rgba(255, 215, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.4)',
      cardBg: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-gray-800 dark:to-gray-700 dark:border-yellow-500/50',
      borderGlow: 'shadow-[0_0_20px_rgba(255,215,0,0.6)]',
      targetIconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    2: {
      gradient: 'linear-gradient(135deg, #e8e8e8 0%, #c0c0c0 25%, #e8e8e8 50%, #a8a8a8 75%, #8e8e8e 100%)',
      glowClass: 'podium-glow-silver',
      icon: Medal,
      iconColor: 'text-gray-500 dark:text-gray-300',
      iconSize: 'h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7',
      iconGlow: 'bg-white/30',
      textColor: 'text-gray-900 dark:text-gray-100',
      textColorSecondary: 'text-gray-700 dark:text-gray-300',
      textColorTertiary: 'text-gray-600 dark:text-gray-400',
      textShadow: '0 2px 4px rgba(0,0,0,0.2)',
      borderColor: 'border-gray-400 dark:border-gray-500',
      shadow: '0 16px 32px rgba(192, 192, 192, 0.4), 0 0 25px rgba(192, 192, 192, 0.3)',
      cardBg: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 dark:border-gray-500/50',
      borderGlow: 'shadow-[0_0_15px_rgba(192,192,192,0.5)]',
      targetIconColor: 'text-gray-600 dark:text-gray-400',
    },
    3: {
      gradient: 'linear-gradient(135deg, #cd7f32 0%, #b87333 20%, #cd7f32 40%, #9c5f28 60%, #b87333 80%, #8b4513 100%)',
      glowClass: 'podium-glow-bronze',
      icon: Medal,
      iconColor: 'text-amber-700 dark:text-amber-500',
      iconSize: 'h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6',
      iconGlow: 'bg-amber-400/25',
      textColor: 'text-gray-900 dark:text-gray-100',
      textColorSecondary: 'text-gray-700 dark:text-gray-300',
      textColorTertiary: 'text-gray-600 dark:text-gray-400',
      textShadow: '0 2px 4px rgba(0,0,0,0.2)',
      borderColor: 'border-amber-500 dark:border-amber-400',
      shadow: '0 16px 32px rgba(205, 127, 50, 0.4), 0 0 25px rgba(205, 127, 50, 0.3)',
      cardBg: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-gray-800 dark:to-gray-700 dark:border-amber-500/50',
      borderGlow: 'shadow-[0_0_15px_rgba(205,127,50,0.5)]',
      targetIconColor: 'text-amber-600 dark:text-amber-400',
    },
  };

  const config = configs[rank];
  const Icon = config.icon;

  return (
    <motion.div
      className="flex flex-col items-center relative"
      style={{ width: platformWidth }}
      initial={{ opacity: 0, y: 100, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 150,
        damping: 18,
        delay,
      }}
    >
      {/* Icon above platform */}
      <motion.div
        className="relative mb-1.5 sm:mb-2 z-20"
        animate={rank === 1 ? {
          y: [0, -8, 0],
          rotate: [0, 6, -6, 0],
          scale: [1, 1.05, 1],
        } : {
          y: [0, -4, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="relative">
          <Icon className={`${config.iconSize} ${config.iconColor} drop-shadow-2xl`} style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }} />
          <div className={`absolute inset-0 ${config.iconGlow} blur-lg`} />
        </div>
      </motion.div>

      {/* User Card */}
      <motion.div
        className={`w-full bg-card rounded-lg border ${config.borderColor} ${config.borderGlow} p-2 sm:p-2.5 mb-1.5 sm:mb-2 relative overflow-hidden`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.03, y: -2 }}
      >
        {/* Shimmer effect for gold */}
        {rank === 1 && (
          <div className="absolute inset-0 podium-shimmer pointer-events-none rounded-lg" />
        )}

        {/* Decorative corner elements */}
        <div className="absolute top-1.5 left-1.5 w-1 h-1 bg-white/20 dark:bg-white/10 rounded-full blur-sm" />
        <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-white/20 dark:bg-white/10 rounded-full blur-sm" />
        <div className="absolute bottom-1.5 left-1.5 w-1 h-1 bg-white/20 dark:bg-white/10 rounded-full blur-sm" />
        <div className="absolute bottom-1.5 right-1.5 w-1 h-1 bg-white/20 dark:bg-white/10 rounded-full blur-sm" />

        {entry ? (
          <div className="relative z-10 text-center">
            {/* Rank Badge */}
            <motion.div
              className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full ${config.borderColor} border-2 bg-card mb-1.5 sm:mb-2 font-bold text-xs sm:text-sm ${config.textColor} shadow-sm`}
              style={{ textShadow: config.textShadow }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.3, type: "spring", stiffness: 300 }}
            >
              {rank}
            </motion.div>

            {/* Name */}
            <motion.h3
              className={`text-xs sm:text-sm md:text-base font-extrabold ${config.textColor} mb-1 sm:mb-1.5 truncate w-full`}
              style={{ textShadow: config.textShadow }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.4 }}
            >
              {entry.name}
            </motion.h3>

            {/* Score */}
            <motion.div
              className={`text-[10px] sm:text-xs md:text-sm font-mono font-bold ${config.textColorSecondary} mb-1 sm:mb-1.5`}
              style={{ textShadow: config.textShadow }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.5, type: "spring", stiffness: 200 }}
            >
              <AnimatedScore score={entry.score} previousScore={previousScore} />
            </motion.div>

            {/* Solve count */}
            {entry.solvedChallenges !== undefined && (
              <motion.div
                className={`text-[9px] sm:text-[10px] ${config.textColorTertiary} flex items-center justify-center gap-1 font-medium`}
                style={{ textShadow: config.textShadow }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.6 }}
              >
                <Target className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${config.targetIconColor}`} />
                <span>{entry.solvedChallenges}</span>
              </motion.div>
            )}
          </div>
        ) : (
          <div className={`text-xs ${config.textColorTertiary} text-center py-2`}>—</div>
        )}
      </motion.div>

      {/* Platform */}
      <motion.div
        className={`w-full ${config.glowClass} rounded-t-xl relative overflow-hidden`}
        style={{
          height: platformHeight,
          background: config.gradient,
          boxShadow: config.shadow,
          willChange: 'transform, box-shadow',
        }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ delay: delay + 0.1, type: "spring", stiffness: 150 }}
        whileHover={{ scale: 1.02 }}
      >
        {/* Shimmer effect for gold platform */}
        {rank === 1 && (
          <div className="absolute inset-0 podium-shimmer pointer-events-none rounded-t-2xl" />
        )}

        {/* Platform decorative elements */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/30" />
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/10" />
        
        {/* Side highlights */}
        <div className="absolute top-0 left-0 w-1 h-full bg-white/20" />
        <div className="absolute top-0 right-0 w-1 h-full bg-white/20" />
      </motion.div>

      {/* Platform shadow */}
      <motion.div
        className="w-[90%] h-1 sm:h-1.5 bg-black/20 rounded-b-lg blur-sm -mt-0.5"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: delay + 0.15 }}
      />
    </motion.div>
  );
};

export const Podium = ({ topThree, isLoading }: PodiumProps) => {
  const [previousScores, setPreviousScores] = useState<Record<number, number>>({});

  useEffect(() => {
    setPreviousScores((prev) => {
      const newScores: Record<number, number> = {};
      topThree.forEach(entry => {
        newScores[entry.rank] = prev[entry.rank] ?? entry.score;
      });
      return newScores;
    });
  }, [topThree]);

  if (isLoading) {
    return (
      <Card className="w-full overflow-hidden">
        <CardContent className="p-3 sm:p-4 pb-2 sm:pb-3">
          <div className="flex items-end justify-center gap-2 sm:gap-3 md:gap-4 h-[200px] sm:h-[220px] md:h-[240px]">
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <Skeleton className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg" />
              <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-t-xl" />
            </div>
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg" />
              <Skeleton className="h-28 w-24 sm:h-32 sm:w-28 rounded-t-xl" />
            </div>
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg" />
              <Skeleton className="h-16 w-20 sm:h-20 sm:w-24 rounded-t-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topThree || topThree.length === 0) {
    return null;
  }

  const first = topThree.find(u => u.rank === 1);
  const second = topThree.find(u => u.rank === 2);
  const third = topThree.find(u => u.rank === 3);

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-3 sm:p-4 pb-2 sm:pb-3">
        <motion.div
          className="flex items-end justify-center gap-2 sm:gap-3 md:gap-4 min-h-[200px] sm:min-h-[220px] md:min-h-[240px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* 2nd Place - Left */}
          <PodiumPlace
            entry={second}
            rank={2}
            platformHeight="80px"
            platformWidth="100px"
            delay={0.1}
            previousScore={previousScores[2] ?? second?.score ?? 0}
          />

          {/* 1st Place - Center (Tallest) */}
          <PodiumPlace
            entry={first}
            rank={1}
            platformHeight="120px"
            platformWidth="120px"
            delay={0.2}
            previousScore={previousScores[1] ?? first?.score ?? 0}
          />

          {/* 3rd Place - Right */}
          <PodiumPlace
            entry={third}
            rank={3}
            platformHeight="70px"
            platformWidth="100px"
            delay={0.3}
            previousScore={previousScores[3] ?? third?.score ?? 0}
          />
        </motion.div>
      </CardContent>
    </Card>
  );
};
