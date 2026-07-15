import { useState, useEffect, useCallback, useRef } from 'react';
import { playClick, playError } from '@/lib/sounds';
import { useComboStreak, ComboCounter, ComboMilestone } from './ComboStreak';

interface Props {
  text: string;
  targetWpm: number;
  onComplete: (passed: boolean, score: number) => void;
}

export function SpeedRace({ text, targetWpm, onComplete }: Props) {
  const [typedChars, setTypedChars] = useState<{ char: string; correct: boolean }[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const doneRef = useRef(false);
  const currentIdxRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const { streak, milestone, onCorrect, onWrong } = useComboStreak();

  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { startTimeRef.current = startTime; }, [startTime]);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => setElapsedMs(Date.now() - startTime), 100);
    return () => clearInterval(interval);
  }, [startTime]);

  const wpm = startTime && elapsedMs > 0
    ? Math.round((currentIdx / 5) / (elapsedMs / 60000))
    : 0;

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (doneRef.current) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.key === 'Tab' || e.key === 'Escape') return;
    e.preventDefault();

    const idx = currentIdxRef.current;
    if (idx >= text.length) return;

    const now = Date.now();
    if (!startTimeRef.current) setStartTime(now);

    const expected = text[idx];
    const correct = e.key === expected || (e.key === ' ' && expected === ' ');

    if (correct) { playClick(); onCorrect(); }
    else          { playError(); onWrong(); }

    setTypedChars(prev => [...prev, { char: e.key, correct }]);
    const nextIdx = idx + 1;
    setCurrentIdx(nextIdx);

    if (nextIdx >= text.length && !doneRef.current) {
      doneRef.current = true;
      const elapsed = (Date.now() - (startTimeRef.current ?? now)) / 60000;
      const finalWpm = elapsed > 0 ? Math.round((nextIdx / 5) / elapsed) : 0;
      setTimeout(() => onComplete(finalWpm >= targetWpm, finalWpm), 0);
    }
  }, [text, targetWpm, onComplete, onCorrect, onWrong]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const carPct = (currentIdx / text.length) * 90;
  const paceCarPct = startTime && elapsedMs > 0
    ? Math.min((wpm / targetWpm) * 90 * (currentIdx / text.length), 90)
    : 0;

  return (
    <div className="flex flex-col gap-5 relative">
      <div className="flex justify-between items-center px-2">
        <div className="text-center">
          <div className="text-3xl font-black text-primary">{wpm}</div>
          <div className="text-xs text-muted-foreground font-medium">WPM</div>
        </div>
        <div className="text-center">
          <ComboCounter streak={streak} />
          <div className={`text-lg font-black ${wpm >= targetWpm ? 'text-teal-600' : 'text-amber-500'}`}>
            Target: {targetWpm} WPM
          </div>
          <div className="text-xs text-muted-foreground">{currentIdx}/{text.length} chars</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-foreground">
            {Math.round((currentIdx / text.length) * 100)}%
          </div>
          <div className="text-xs text-muted-foreground font-medium">done</div>
        </div>
      </div>

      {/* Race track */}
      <div className="relative bg-amber-50 dark:bg-amber-950/20 rounded-2xl border-2 border-amber-200 dark:border-amber-800 overflow-hidden p-4">
        <div className="relative h-16 bg-gray-300 dark:bg-gray-700 rounded-xl overflow-hidden mb-2">
          <div className="absolute inset-y-0 left-0 right-0 flex items-center">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex-1 mx-1 h-1 bg-white/60 rounded-full" />
            ))}
          </div>
          <div className="absolute right-4 top-0 bottom-0 w-2 flex flex-col">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-black' : 'bg-white'}`} />
            ))}
          </div>
          <div
            className="absolute top-1/2 -translate-y-1/2 text-3xl transition-all duration-100"
            style={{ left: `${carPct}%` }}
          >
            🏎️
          </div>
          {startTime && (
            <div
              className="absolute top-1/2 -translate-y-1/2 text-2xl opacity-30 transition-all duration-100"
              style={{ left: `${Math.min(paceCarPct, 88)}%` }}
            >
              👻
            </div>
          )}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>Start</span>
          <span>🏁 Finish</span>
        </div>
        <ComboMilestone milestone={milestone} />
      </div>

      {/* Text display */}
      <div className="bg-card border border-border rounded-2xl p-5 font-mono text-lg leading-loose tracking-wide break-all select-none">
        {!startTime && (
          <p className="text-muted-foreground text-center font-sans text-sm mb-2">
            Start typing to begin the race!
          </p>
        )}
        {text.split('').map((char, i) => {
          const typed = typedChars[i];
          let cls = 'px-0.5 rounded transition-colors ';
          if (i === currentIdx) cls += 'bg-primary/30 text-primary underline underline-offset-4 animate-pulse';
          else if (typed) cls += typed.correct
            ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
          else cls += 'text-muted-foreground';
          return (
            <span key={i} className={cls}>
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
      </div>
    </div>
  );
}
