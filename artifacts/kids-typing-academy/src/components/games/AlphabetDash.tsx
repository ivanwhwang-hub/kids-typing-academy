import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playClick, playError } from '@/lib/sounds';
import { useComboStreak, ComboCounter, ComboMilestone } from './ComboStreak';

interface Props {
  letters: string[];
  timeLimitMs: number;
  maxMisses: number;
  onComplete: (passed: boolean, score: number) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function AlphabetDash({ letters, timeLimitMs, maxMisses, onComplete }: Props) {
  const shuffled = useMemo(() => shuffle(letters), []);
  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(timeLimitMs);
  const [misses, setMisses] = useState(0);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const doneRef = useRef(false);
  const currentIdxRef = useRef(0);
  const missesRef = useRef(0);
  const { streak, milestone, onCorrect, onWrong } = useComboStreak();
  const startTimeRef = useRef<number>(0);

  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { missesRef.current = misses; }, [misses]);

  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => {
      setTimeLeftMs(t => {
        const next = t - 100;
        if (next <= 0 && !doneRef.current) {
          doneRef.current = true;
          setTimeout(() => onComplete(false, 0), 0);
        }
        return Math.max(0, next);
      });
    }, 100);
    return () => clearInterval(interval);
  }, [started, onComplete]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (doneRef.current) return;
    e.preventDefault();
    if (!started) { setStarted(true); startTimeRef.current = Date.now(); return; }

    const key = e.key.toLowerCase();
    const expected = shuffled[currentIdxRef.current];
    if (key === expected) {
      playClick();
      onCorrect();
      setFlash('correct');
      setTimeout(() => setFlash(null), 180);
      const next = currentIdxRef.current + 1;
      if (next >= shuffled.length) {
        if (!doneRef.current) {
          doneRef.current = true;
          const elapsed = Date.now() - startTimeRef.current;
          onComplete(true, elapsed);
        }
      } else {
        setCurrentIdx(next);
      }
    } else {
      playError();
      onWrong();
      setFlash('wrong');
      setTimeout(() => setFlash(null), 180);
      setMisses(m => {
        const next = m + 1;
        if (next >= maxMisses && !doneRef.current) {
          doneRef.current = true;
          setTimeout(() => onComplete(false, 0), 0);
        }
        return next;
      });
    }
  }, [started, shuffled, maxMisses, onComplete, onCorrect, onWrong]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const timerPct = (timeLeftMs / timeLimitMs) * 100;

  return (
    <div className="flex flex-col gap-5 items-center relative">
      <div className="flex justify-between w-full px-2">
        <span className="font-black text-teal-600">{currentIdx} / {shuffled.length} done</span>
        <ComboCounter streak={streak} />
        <span className="font-black text-destructive">❌ {misses} / {maxMisses}</span>
      </div>

      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ${timerPct > 50 ? 'bg-teal-500' : timerPct > 25 ? 'bg-amber-500' : 'bg-destructive'}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ scale: 0.4, opacity: 0, rotateY: -90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0.4, opacity: 0, rotateY: 90 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`w-44 h-44 rounded-3xl flex items-center justify-center font-black text-8xl shadow-xl select-none transition-colors ${
              flash === 'correct' ? 'bg-teal-400 text-white' :
              flash === 'wrong'   ? 'bg-destructive text-white' :
              'bg-primary/10 text-primary'
            }`}
          >
            {started ? shuffled[currentIdx]?.toUpperCase() : '?'}
          </motion.div>
        </AnimatePresence>
        <ComboMilestone milestone={milestone} />
      </div>

      {!started && <p className="font-bold text-lg text-muted-foreground">Press any key to start!</p>}

      <div className="flex flex-wrap gap-1 justify-center max-w-sm">
        {shuffled.map((l, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
              i < currentIdx     ? 'bg-teal-500 text-white scale-90' :
              i === currentIdx   ? 'bg-primary text-white ring-2 ring-primary/50 scale-110' :
              'bg-muted text-muted-foreground'
            }`}
          >
            {l.toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
}
