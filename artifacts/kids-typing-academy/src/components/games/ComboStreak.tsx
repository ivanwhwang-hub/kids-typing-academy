import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playCombo } from '@/lib/sounds';

const MILESTONES = [5, 10, 20] as const;

interface MilestoneHit { value: number; key: number }

export interface ComboStreakState {
  streak: number;
  milestone: MilestoneHit | null;
  onCorrect: () => void;
  onWrong: () => void;
}

export function useComboStreak(): ComboStreakState {
  const [streak, setStreak] = useState(0);
  const [milestone, setMilestone] = useState<MilestoneHit | null>(null);
  const streakRef = useRef(0);
  const milestoneKeyRef = useRef(0);

  const onCorrect = useCallback(() => {
    const next = streakRef.current + 1;
    streakRef.current = next;
    setStreak(next);
    const hit = MILESTONES.find(m => next === m);
    if (hit !== undefined) {
      milestoneKeyRef.current += 1;
      const level = (MILESTONES.indexOf(hit) + 1) as 1 | 2 | 3;
      playCombo(level);
      const key = milestoneKeyRef.current;
      setMilestone({ value: hit, key });
      setTimeout(() => setMilestone(prev => prev?.key === key ? null : prev), 1400);
    }
  }, []);

  const onWrong = useCallback(() => {
    streakRef.current = 0;
    setStreak(0);
  }, []);

  return { streak, milestone, onCorrect, onWrong };
}

interface ComboCounterProps { streak: number }
export function ComboCounter({ streak }: ComboCounterProps) {
  if (streak < 3) return null;
  const color =
    streak >= 20 ? 'text-purple-500' :
    streak >= 10 ? 'text-red-500' :
    'text-orange-500';
  return (
    <motion.span
      key={streak}
      initial={{ scale: 1.5, opacity: 0.5 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`font-black ${color}`}
    >
      🔥 {streak}
    </motion.span>
  );
}

const MILESTONE_CFG: Record<number, { label: string; emoji: string; bg: string }> = {
  5:  { label: 'On fire!',   emoji: '🔥', bg: 'bg-orange-500' },
  10: { label: 'Super hot!', emoji: '🌋', bg: 'bg-red-600'    },
  20: { label: 'LEGENDARY!', emoji: '⚡', bg: 'bg-purple-600'  },
};

interface ComboMilestoneProps { milestone: MilestoneHit | null }
export function ComboMilestone({ milestone }: ComboMilestoneProps) {
  return (
    <AnimatePresence>
      {milestone && (() => {
        const cfg = MILESTONE_CFG[milestone.value];
        if (!cfg) return null;
        return (
          <motion.div
            key={milestone.key}
            initial={{ opacity: 0, scale: 0.5, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.4, y: -50 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className={`${cfg.bg} text-white font-black px-8 py-4 rounded-3xl shadow-2xl text-center`}>
              <div className="text-5xl mb-1">{cfg.emoji}</div>
              <div className="text-2xl">{milestone.value} in a row!</div>
              <div className="text-sm opacity-90 mt-0.5">{cfg.label}</div>
            </div>
          </motion.div>
        );
      })()}
    </AnimatePresence>
  );
}
