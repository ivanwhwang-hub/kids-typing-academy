import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playClick, playError } from '@/lib/sounds';
import { useComboStreak, ComboCounter, ComboMilestone } from './ComboStreak';

interface Props {
  codes: string[];
  onComplete: (passed: boolean, score: number) => void;
}

export function CodeBreaker({ codes, onComplete }: Props) {
  const [started, setStarted] = useState(false);
  const [codeIdx, setCodeIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [solved, setSolved] = useState<boolean[][]>(
    codes.map(c => Array(c.length).fill(false))
  );
  const [shake, setShake] = useState(false);
  const [unlockAnim, setUnlockAnim] = useState(false);
  const doneRef = useRef(false);
  const codeIdxRef = useRef(0);
  const charIdxRef = useRef(0);
  const { streak, milestone, onCorrect, onWrong } = useComboStreak();
  const startTimeRef = useRef<number>(0);

  useEffect(() => { codeIdxRef.current = codeIdx; }, [codeIdx]);
  useEffect(() => { charIdxRef.current = charIdx; }, [charIdx]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (doneRef.current) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();

    if (!started) { setStarted(true); startTimeRef.current = Date.now(); return; }

    const ci = codeIdxRef.current;
    const ki = charIdxRef.current;
    const currentCode = codes[ci];
    if (!currentCode) return;

    const expected = currentCode[ki];
    if (e.key === expected) {
      playClick();
      onCorrect();
      const newSolved = solved.map((row, ri) =>
        ri === ci ? row.map((v, vi) => vi <= ki ? true : v) : row
      );
      setSolved(newSolved);

      const nextKi = ki + 1;
      if (nextKi >= currentCode.length) {
        setUnlockAnim(true);
        setTimeout(() => {
          setUnlockAnim(false);
          const nextCi = ci + 1;
          if (nextCi >= codes.length) {
            doneRef.current = true;
            const elapsed = Date.now() - startTimeRef.current;
            onComplete(true, elapsed);
          } else {
            setCodeIdx(nextCi);
            setCharIdx(0);
          }
        }, 600);
      } else {
        setCharIdx(nextKi);
      }
    } else {
      playError();
      onWrong();
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setSolved(prev => prev.map((row, ri) =>
        ri === ci ? row.map((v, vi) => vi < ki ? v : false) : row
      ));
      setCharIdx(0);
    }
  }, [started, codes, solved, onComplete, onCorrect, onWrong]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const currentCode = codes[codeIdx] ?? '';

  return (
    <div className="flex flex-col gap-6 items-center relative">
      {/* Code progress + combo */}
      <div className="flex items-center gap-4">
        <div className="flex gap-3">
          {codes.map((code, ci) => {
            const isDone = ci < codeIdx;
            const isCurrent = ci === codeIdx;
            return (
              <div
                key={ci}
                className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                  isDone    ? 'bg-teal-500 text-white' :
                  isCurrent ? 'bg-primary text-white ring-2 ring-primary/40' :
                  'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? '✓' : `#${ci + 1}`}
              </div>
            );
          })}
        </div>
        <ComboCounter streak={streak} />
      </div>

      {/* Safe / lock visual */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={codeIdx}
            animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : unlockAnim ? { scale: [1, 1.1, 0.95, 1] } : {}}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-4"
          >
            <div className={`text-8xl transition-all duration-300 ${unlockAnim ? 'animate-bounce' : ''}`}>
              {unlockAnim ? '🔓' : '🔒'}
            </div>

            <div className="flex gap-2">
              {currentCode.split('').map((char, ki) => {
                const isSolved = solved[codeIdx]?.[ki];
                const isCurrent = ki === charIdx && !unlockAnim;
                return (
                  <motion.div
                    key={ki}
                    animate={isCurrent ? { scale: [1, 1.08, 1], transition: { repeat: Infinity, duration: 0.8 } } : {}}
                    className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center font-black text-xl transition-all ${
                      isSolved   ? 'bg-teal-500 border-teal-600 text-white' :
                      isCurrent  ? 'bg-primary/10 border-primary text-primary' :
                      'bg-muted border-border text-muted-foreground'
                    }`}
                  >
                    {isSolved ? char : isCurrent ? char : '?'}
                  </motion.div>
                );
              })}
            </div>

            {!started && <p className="text-muted-foreground font-bold">Press any key to start!</p>}
            {started && !unlockAnim && (
              <p className="text-sm text-muted-foreground">
                Type: <span className="font-black text-primary text-lg">{currentCode[charIdx]}</span>
              </p>
            )}
            {unlockAnim && <p className="text-teal-600 font-black text-lg">Code Cracked! 🎉</p>}
          </motion.div>
        </AnimatePresence>
        <ComboMilestone milestone={milestone} />
      </div>

      <div className="text-sm text-muted-foreground text-center">
        Code {codeIdx + 1} of {codes.length} — type each character exactly
      </div>
    </div>
  );
}
