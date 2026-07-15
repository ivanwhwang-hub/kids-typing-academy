import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playHit } from '@/lib/sounds';
import { useComboStreak, ComboCounter, ComboMilestone } from './ComboStreak';

interface FallingKey {
  id: number;
  char: string;
  x: number;
  startTime: number;
}

interface Props {
  keys: string[];
  fallDurationMs: number;
  spawnIntervalMs: number;
  maxMisses: number;
  targetScore: number;
  onComplete: (passed: boolean, score: number) => void;
}

export function KeyRain({ keys, fallDurationMs, spawnIntervalMs, maxMisses, targetScore, onComplete }: Props) {
  const [started, setStarted] = useState(false);
  const [letters, setLetters] = useState<FallingKey[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const idRef = useRef(0);
  const doneRef = useRef(false);
  const scoreRef = useRef(0);
  const { streak, milestone, onCorrect, onWrong } = useComboStreak();

  useEffect(() => { scoreRef.current = score; }, [score]);

  useEffect(() => {
    if (!started) return;
    const loop = setInterval(() => {
      const now = Date.now();
      setLetters(prev => {
        let missCount = 0;
        const alive: FallingKey[] = [];
        for (const l of prev) {
          if (now - l.startTime >= fallDurationMs) missCount++;
          else alive.push(l);
        }
        if (missCount > 0) {
          onWrong();
          setMisses(m => {
            const next = m + missCount;
            if (next >= maxMisses && !doneRef.current) {
              doneRef.current = true;
              setTimeout(() => onComplete(scoreRef.current >= targetScore, scoreRef.current), 0);
            }
            return next;
          });
        }
        return alive;
      });
    }, 50);
    return () => clearInterval(loop);
  }, [started, fallDurationMs, maxMisses, targetScore, onComplete, onWrong]);

  useEffect(() => {
    if (!started) return;
    const spawn = setInterval(() => {
      if (doneRef.current) return;
      idRef.current += 1;
      setLetters(prev => [...prev, {
        id: idRef.current,
        char: keys[Math.floor(Math.random() * keys.length)],
        x: 10 + Math.random() * 80,
        startTime: Date.now(),
      }]);
    }, spawnIntervalMs);
    return () => clearInterval(spawn);
  }, [started, spawnIntervalMs, keys]);

  useEffect(() => {
    if (score >= targetScore && !doneRef.current) {
      doneRef.current = true;
      onComplete(true, score);
    }
  }, [score, targetScore, onComplete]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (doneRef.current) return;
    e.preventDefault();
    if (!started) { setStarted(true); return; }
    const key = e.key.toLowerCase();
    setLetters(prev => {
      const idx = prev.findIndex(l => l.char === key);
      if (idx === -1) { onWrong(); return prev; }
      playHit();
      onCorrect();
      setScore(s => s + 1);
      return prev.filter((_, i) => i !== idx);
    });
  }, [started, onCorrect, onWrong]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const now = Date.now();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center px-2">
        <span className="font-black text-primary text-lg">⌨️ {score} / {targetScore}</span>
        <ComboCounter streak={streak} />
        <span className="font-black text-destructive text-lg">❌ {misses} / {maxMisses}</span>
      </div>

      <div className="relative w-full h-72 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 overflow-hidden select-none">
        {!started && (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
            <div className="text-5xl">🌧️</div>
            <p className="font-black text-xl text-foreground">Press any key to start!</p>
            <div className="flex gap-1 flex-wrap justify-center max-w-xs">
              {keys.map(k => (
                <span key={k} className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-sm font-bold">{k}</span>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {letters.map(l => {
            const progress = Math.min(((now - l.startTime) / fallDurationMs) * 94, 94);
            return (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 2 }}
                transition={{ duration: 0.15 }}
                className="absolute w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-black text-2xl shadow-lg -translate-x-1/2"
                style={{ left: `${l.x}%`, top: `${progress}%` }}
              >
                {l.char}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <ComboMilestone milestone={milestone} />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {started ? 'Type each falling letter before it hits the bottom!' : ''}
      </p>
    </div>
  );
}
