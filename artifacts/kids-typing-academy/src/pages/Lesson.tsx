import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadProfiles, saveProfiles } from "@/lib/storage";
import { Profile, LessonResult } from "@/lib/types";
import { LESSONS, LEVEL_NAMES } from "@/lib/content";
import { awardBadgesForResult, updateStreak } from "@/lib/badges";
import { VirtualKeyboard } from "@/components/VirtualKeyboard";
import { motion, AnimatePresence } from "framer-motion";

interface LevelThreshold {
  minAccuracy: number;
  minWpm: number | null;
}

const THRESHOLDS: Record<number, LevelThreshold> = {
  1: { minAccuracy: 80, minWpm: null },
  2: { minAccuracy: 75, minWpm: 8 },
  3: { minAccuracy: 80, minWpm: 20 },
  4: { minAccuracy: 85, minWpm: 35 },
  5: { minAccuracy: 90, minWpm: 50 },
};

function calcPassed(level: number, wpm: number, accuracy: number): boolean {
  const t = THRESHOLDS[level] ?? { minAccuracy: 80, minWpm: null };
  if (accuracy < t.minAccuracy) return false;
  if (t.minWpm !== null && wpm < t.minWpm) return false;
  return true;
}

function calcStars(level: number, wpm: number, accuracy: number): number {
  if (level === 1) {
    if (accuracy >= 90) return 3;
    if (accuracy >= 80) return 2;
    return 1;
  }
  if (level === 2) {
    if (accuracy >= 90 && wpm >= 15) return 3;
    if (accuracy >= 80 && wpm >= 10) return 2;
    return 1;
  }
  if (level === 3) {
    if (accuracy >= 85 && wpm >= 30) return 3;
    if (accuracy >= 80 && wpm >= 25) return 2;
    if (wpm >= 25) return 1;
    return 1;
  }
  if (level === 4) {
    if (accuracy >= 90 && wpm >= 55) return 3;
    if (accuracy >= 90 && wpm >= 45) return 2;
    if (wpm >= 35) return 1;
    return 1;
  }
  if (level === 5) {
    if (accuracy >= 95 && wpm >= 80) return 3;
    if (accuracy >= 92 && wpm >= 70) return 2;
    if (wpm >= 55) return 1;
    return 1;
  }
  return 1;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <Star className={`w-10 h-10 ${filled ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
  );
}

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const [profiles, setProfiles] = useState<Profile[]>(loadProfiles);
  const profile = profiles.find((p) => p.id === id);

  const level = profile?.currentLevel ?? 1;
  const lessonIndex = Math.min(profile?.currentLesson ?? 0, 4);
  const text = LESSONS[level]?.[lessonIndex] ?? "";

  const [typedChars, setTypedChars] = useState<{ char: string; correct: boolean }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [correctFlash, setCorrectFlash] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [done, setDone] = useState(false);
  const [finalWpm, setFinalWpm] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const [stars, setStars] = useState(0);
  const [passed, setPassed] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startTime && !done) {
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 500);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTime, done]);

  const wpm = startTime && elapsedMs > 0
    ? Math.round((currentIndex / 5) / (elapsedMs / 60000))
    : 0;

  const accuracy = currentIndex > 0
    ? Math.round(((currentIndex - errorCount) / currentIndex) * 100)
    : 100;

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (done) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key === "Tab" || e.key === "Escape") return;

    e.preventDefault();

    // Backspace / Delete — go back one character and undo the last keystroke
    if (e.key === "Backspace" || e.key === "Delete") {
      if (currentIndex === 0) return;
      const removedEntry = typedChars[currentIndex - 1];
      if (removedEntry && !removedEntry.correct) {
        setErrorCount((prev) => Math.max(0, prev - 1));
      }
      setTypedChars((prev) => prev.slice(0, -1));
      setCurrentIndex((prev) => prev - 1);
      return;
    }

    const expected = text[currentIndex];
    if (!expected) return;

    if (!startTime) setStartTime(Date.now());

    let isCorrect = false;
    if (e.key === expected) {
      isCorrect = true;
    } else if (e.key === " " && expected === " ") {
      isCorrect = true;
    }

    if (isCorrect) {
      setCorrectFlash(true);
      setTimeout(() => setCorrectFlash(false), 150);
    } else {
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 150);
      setErrorCount((prev) => prev + 1);
    }

    const newTyped = [...typedChars, { char: e.key, correct: isCorrect }];
    setTypedChars(newTyped);
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);

    if (newIndex >= text.length) {
      const elapsed = (Date.now() - (startTime ?? Date.now())) / 60000;
      const finalW = elapsed > 0 ? Math.round((newIndex / 5) / elapsed) : 0;
      const finalA = Math.round(((newIndex - errorCount - (isCorrect ? 0 : 1)) / newIndex) * 100);
      const s = calcStars(level, finalW, finalA);
      const clampedA = Math.max(0, Math.min(100, finalA));
      setFinalWpm(finalW);
      setFinalAccuracy(clampedA);
      setStars(s);
      setPassed(calcPassed(level, finalW, clampedA));
      setDone(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [done, text, currentIndex, typedChars, startTime, errorCount, level]);

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  function saveAndContinue() {
    if (!profile) return;
    const result: LessonResult = {
      level,
      lessonIndex,
      date: Date.now(),
      wpm: finalWpm,
      accuracy: finalAccuracy,
      stars,
    };
    const updated = profiles.map((p) => {
      if (p.id !== id) return p;
      const newLessonResults = [...p.lessonResults, result];
      const nextLesson = Math.min(lessonIndex + 1, 4);
      const withStreak = updateStreak({ ...p, lessonResults: newLessonResults, currentLesson: nextLesson });
      awardBadgesForResult(withStreak, result);
      return withStreak;
    });
    saveProfiles(updated);
    setProfiles(updated);

    const unlockedGames = profile.unlockedGames ?? [];
    const midGameId = `${level}-mid`;
    const endGameId = `${level}-end`;

    if (lessonIndex === 2 && !unlockedGames.includes(midGameId)) {
      setLocation(`/minigame/${id}/${midGameId}`);
    } else if (lessonIndex === 4 && !unlockedGames.includes(endGameId)) {
      setLocation(`/minigame/${id}/${endGameId}`);
    } else {
      setLocation(`/profile/${id}`);
    }
  }

  function retry() {
    setTypedChars([]);
    setCurrentIndex(0);
    setErrorCount(0);
    setStartTime(null);
    setElapsedMs(0);
    setDone(false);
    setFinalWpm(0);
    setFinalAccuracy(0);
    setStars(0);
    setPassed(false);
  }

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center"><p>Profile not found.</p></div>;
  }

  const nextKey = text[currentIndex] ?? "";

  const threshold = THRESHOLDS[level] ?? { minAccuracy: 80, minWpm: null };

  const failHints: string[] = [];
  if (!passed) {
    if (finalAccuracy < threshold.minAccuracy)
      failHints.push(`Accuracy: ${finalAccuracy}% (need ${threshold.minAccuracy}%)`);
    if (threshold.minWpm !== null && finalWpm < threshold.minWpm)
      failHints.push(`Speed: ${finalWpm} WPM (need ${threshold.minWpm} WPM)`);
  }

  const motivationalMessage = !passed
    ? "So close! Try again and you'll get it! 💪"
    : stars === 3
    ? "Amazing! Perfect practice!"
    : stars === 2
    ? "Well done! Keep it up!"
    : "Great effort! Practice makes perfect!";

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="lesson-page">
      <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <button
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => { if (!done && currentIndex > 0) setShowLeaveConfirm(true); else setLocation(`/profile/${id}`); }}
          data-testid="button-back-lesson"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="text-center">
          <div className="font-black text-foreground">Level {level}: {LEVEL_NAMES[level - 1]}</div>
          <div className="text-sm text-muted-foreground">Lesson {lessonIndex + 1} of 5</div>
        </div>
        <div className="flex gap-6 text-sm font-bold">
          <div className="text-center">
            <div className="text-primary text-lg">{wpm}</div>
            <div className="text-muted-foreground text-xs">WPM</div>
          </div>
          <div className="text-center">
            <div className="text-teal-500 text-lg">{accuracy}%</div>
            <div className="text-muted-foreground text-xs">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-foreground text-lg">{currentIndex}/{text.length}</div>
            <div className="text-muted-foreground text-xs">Chars</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-8">
        <div className="w-full max-w-3xl bg-card border border-border rounded-3xl p-8 shadow-sm">
          <div className="font-mono text-xl leading-loose tracking-wider break-all select-none" data-testid="text-display">
            {text.split("").map((char, i) => {
              const typed = typedChars[i];
              let className = "px-0.5 rounded transition-colors ";
              if (i === currentIndex) className += "bg-primary/30 text-primary underline underline-offset-4 animate-pulse";
              else if (typed) className += typed.correct ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
              else className += "text-muted-foreground";
              return (
                <span key={i} className={className}>
                  {char === " " ? "\u00A0" : char}
                </span>
              );
            })}
          </div>
        </div>

        <div className="text-sm text-muted-foreground text-center">
          {startTime ? "Keep typing..." : "Start typing to begin!"}
        </div>

        <VirtualKeyboard
          activeKey={nextKey}
          correctFlash={correctFlash}
          wrongFlash={wrongFlash}
        />
      </div>

      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            data-testid="results-overlay"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-card border border-border rounded-3xl p-10 max-w-md w-full text-center shadow-2xl"
            >
              <div className="text-5xl mb-4">{passed ? "🎉" : "😅"}</div>
              <h2 className="text-2xl font-black text-foreground mb-2">
                {passed ? "Lesson Complete!" : "Not quite there yet!"}
              </h2>
              <p className="text-muted-foreground mb-4">{motivationalMessage}</p>

              {/* Fail hints — show what needs improving */}
              {!passed && failHints.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-2xl px-4 py-3 mb-4 text-left space-y-1">
                  <p className="text-xs font-bold text-destructive uppercase tracking-wide mb-1">Need to improve:</p>
                  {failHints.map((hint) => (
                    <p key={hint} className="text-sm font-semibold text-destructive">❌ {hint}</p>
                  ))}
                </div>
              )}

              {/* Stars — only show when passed */}
              {passed && (
                <div className="flex justify-center gap-2 mb-6">
                  <StarIcon filled={stars >= 1} />
                  <StarIcon filled={stars >= 2} />
                  <StarIcon filled={stars >= 3} />
                </div>
              )}

              {/* Score stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className={`rounded-2xl p-4 ${finalAccuracy >= threshold.minAccuracy ? "bg-primary/10" : "bg-destructive/10"}`}>
                  <div className={`text-3xl font-black ${finalAccuracy >= threshold.minAccuracy ? "text-primary" : "text-destructive"}`}>
                    {finalWpm}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">WPM</div>
                  {threshold.minWpm !== null && (
                    <div className="text-xs text-muted-foreground mt-0.5">need {threshold.minWpm}+</div>
                  )}
                </div>
                <div className={`rounded-2xl p-4 ${finalAccuracy >= threshold.minAccuracy ? "bg-teal-500/10" : "bg-destructive/10"}`}>
                  <div className={`text-3xl font-black ${finalAccuracy >= threshold.minAccuracy ? "text-teal-600" : "text-destructive"}`}>
                    {finalAccuracy}%
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Accuracy</div>
                  <div className="text-xs text-muted-foreground mt-0.5">need {threshold.minAccuracy}%+</div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={retry} data-testid="button-retry-lesson">
                  Try Again
                </Button>
                {passed && (
                  <Button className="flex-1 rounded-xl" onClick={saveAndContinue} data-testid="button-next-lesson">
                    Continue
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <h3 className="text-xl font-black mb-3 text-foreground">Leave lesson?</h3>
              <p className="text-muted-foreground mb-6">Your progress on this lesson will be lost.</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowLeaveConfirm(false)} data-testid="button-stay-lesson">
                  Keep Going
                </Button>
                <Button variant="destructive" className="flex-1 rounded-xl" onClick={() => setLocation(`/profile/${id}`)} data-testid="button-leave-lesson">
                  Leave
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
