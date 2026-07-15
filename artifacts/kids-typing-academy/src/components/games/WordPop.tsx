import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playClick, playPop, playError } from '@/lib/sounds';
import { useComboStreak, ComboCounter, ComboMilestone } from './ComboStreak';

interface Props {
  words: string[];
  timePerWordMs: number;
  targetPop: number;
  onComplete: (passed: boolean, score: number) => void;
}

export function WordPop({ words, timePerWordMs, targetPop, onComplete }: Props) {
  const [started, setStarted] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [popped, setPopped] = useState(0);
  const [missed, setMissed] = useState(0);
  const [bursting, setBursting] = useState(false);
  const [shake, setShake] = useState(false);
  const [tick, setTick] = useState(0);
  const { streak, milestone, onCorrect, onWrong } = useComboStreak();

  const doneRef     = useRef(false);
  const wordIdxRef  = useRef(0);
  const typedRef    = useRef('');
  const poppedRef   = useRef(0);
  const missedRef   = useRef(0);
  const wordStartRef = useRef(0);
  const burstingRef = useRef(false);

  useEffect(() => { wordIdxRef.current = wordIdx; }, [wordIdx]);
  useEffect(() => { typedRef.current = typed; }, [typed]);
  useEffect(() => { burstingRef.current = bursting; }, [bursting]);

  function goNextWord(wasPopped: boolean) {
    if (doneRef.current) return;
    if (wasPopped) poppedRef.current += 1;
    else           { missedRef.current += 1; onWrong(); }

    const nextIdx = wordIdxRef.current + 1;
    wordStartRef.current = Date.now();

    if (nextIdx >= words.length) {
      doneRef.current = true;
      setPopped(poppedRef.current);
      setMissed(missedRef.current);
      onComplete(poppedRef.current >= targetPop, poppedRef.current);
      return;
    }

    wordIdxRef.current = nextIdx;
    typedRef.current = '';
    setWordIdx(nextIdx);
    setTyped('');
    setPopped(poppedRef.current);
    setMissed(missedRef.current);
  }

  useEffect(() => {
    if (!started) return;
    wordStartRef.current = Date.now();
    const interval = setInterval(() => {
      if (doneRef.current) return;
      setTick(t => t + 1);
      if (burstingRef.current) return;
      const elapsed = Date.now() - wordStartRef.current;
      if (elapsed >= timePerWordMs) {
        setShake(true);
        setTimeout(() => setShake(false), 400);
        goNextWord(false);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [started, wordIdx, timePerWordMs]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (doneRef.current || burstingRef.current) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.key === 'Backspace') return;
    e.preventDefault();

    if (!started) {
      setStarted(true);
      wordStartRef.current = Date.now();
      return;
    }

    const currentWord = words[wordIdxRef.current] ?? '';
    const key = e.key;
    const expected = currentWord[typedRef.current.length];
    if (!expected) return;

    if (key === expected) {
      playClick();
      onCorrect();
      const newTyped = typedRef.current + key;
      typedRef.current = newTyped;
      setTyped(newTyped);

      if (newTyped.length === currentWord.length) {
        burstingRef.current = true;
        setBursting(true);
        playPop();
        setTimeout(() => {
          burstingRef.current = false;
          setBursting(false);
          goNextWord(true);
        }, 350);
      }
    } else {
      playError();
      onWrong();
    }
  }, [started, words, onCorrect, onWrong]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const currentWord = words[wordIdx] ?? '';
  const elapsed = started ? Math.min(Date.now() - wordStartRef.current, timePerWordMs) : 0;
  const timeFrac = started && !bursting ? elapsed / timePerWordMs : 0;
  const bubbleScale = 1 - timeFrac * 0.38;
  const timerPct = (1 - timeFrac) * 100;

  return (
    <div className="flex flex-col gap-5 items-center">
      <div className="flex justify-between w-full px-2">
        <span className="font-black text-teal-600">💥 {popped} popped</span>
        <ComboCounter streak={streak} />
        <span className="font-black text-destructive">💨 {missed} missed</span>
      </div>

      <div className="relative flex items-center justify-center h-52 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={wordIdx}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={bursting
              ? { scale: 2.5, opacity: 0 }
              : shake
              ? { x: [0, -10, 10, -10, 10, 0] }
              : { scale: bubbleScale, opacity: 1 }
            }
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              duration: bursting ? 0.3 : shake ? 0.4 : 0.05,
              type: 'tween',
            }}
            className={`px-10 py-7 rounded-full border-4 shadow-xl select-none ${
              bursting ? 'border-teal-400 bg-teal-100' :
              timeFrac > 0.75 ? 'border-destructive/60 bg-destructive/5' :
              timeFrac > 0.5  ? 'border-amber-400/60 bg-amber-50/80' :
              'border-primary/40 bg-primary/5'
            }`}
          >
            {!started ? (
              <span className="text-2xl font-black text-muted-foreground">Press any key!</span>
            ) : (
              <div className="flex gap-0.5">
                {currentWord.split('').map((char, i) => (
                  <span
                    key={i}
                    className={`text-4xl font-black font-mono transition-colors ${
                      i < typed.length   ? 'text-teal-600' :
                      i === typed.length ? 'text-primary' :
                      'text-muted-foreground'
                    }`}
                  >
                    {char}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        <ComboMilestone milestone={milestone} />
      </div>

      <div className="w-full max-w-xs h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${timerPct > 50 ? 'bg-teal-500' : timerPct > 25 ? 'bg-amber-500' : 'bg-destructive'}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {popped >= targetPop
          ? '🎉 Got enough — finish the round!'
          : `${targetPop - popped} more pop${targetPop - popped === 1 ? '' : 's'} to win!`}
      </p>
    </div>
  );
}
