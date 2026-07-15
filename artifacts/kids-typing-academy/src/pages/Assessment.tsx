import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadProfiles, saveProfiles } from "@/lib/storage";
import { ASSESSMENTS, LEVEL_NAMES } from "@/lib/content";
import { awardBadgesForResult } from "@/lib/badges";
import { VirtualKeyboard } from "@/components/VirtualKeyboard";
import { motion, AnimatePresence } from "framer-motion";

const PASS_REQUIREMENTS: Record<number, { accuracy: number; wpm: number | null }> = {
  1: { accuracy: 80, wpm: null },
  2: { accuracy: 80, wpm: 10 },
  3: { accuracy: 85, wpm: 25 },
  4: { accuracy: 90, wpm: 45 },
  5: { accuracy: 92, wpm: 70 },
};

function Confetti() {
  const colors = ["#7C3AED", "#F59E0B", "#10B981", "#EF4444", "#3B82F6", "#EC4899"];
  const pieces = Array.from({ length: 40 });
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {pieces.map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-10px",
            width: `${6 + Math.random() * 8}px`,
            height: `${6 + Math.random() * 8}px`,
            background: colors[i % colors.length],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function AssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [profiles, setProfiles] = useState(loadProfiles);
  const profile = profiles.find((p) => p.id === id);

  // Snapshot the level at mount — never read from profile after the save
  // updates currentLevel, or the displayed text drifts (e.g. "Level 3" on a Level 1 assessment).
  const levelRef = useRef<number | null>(null);
  if (levelRef.current === null) levelRef.current = profile?.currentLevel ?? 1;
  const level = levelRef.current;

  const texts = ASSESSMENTS[level] ?? [];
  const fullText = texts.join(" ") + " " + texts.join(" ");

  const [phase, setPhase] = useState<"ready" | "running" | "done">("ready");
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [typedCorrect, setTypedCorrect] = useState<boolean[]>([]);
  const [correctFlash, setCorrectFlash] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [finalWpm, setFinalWpm] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const [passed, setPassed] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startAssessment() {
    setPhase("running");
    setStartTime(Date.now());
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          finishAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function finishAssessment() {
    setPhase("done");
    if (timerRef.current) clearInterval(timerRef.current);
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const wpm = startTime && totalKeystrokes > 0
    ? Math.round((currentIndex / 5) / ((Date.now() - startTime) / 60000))
    : 0;

  const accuracy = totalKeystrokes > 0
    ? Math.round(((totalKeystrokes - errorCount) / totalKeystrokes) * 100)
    : 100;

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (phase !== "running") return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key === "Tab" || e.key === "Escape") return;
    e.preventDefault();

    const expected = fullText[currentIndex % fullText.length];
    const isCorrect = e.key === expected || (e.key === " " && expected === " ");

    setTotalKeystrokes((prev) => prev + 1);
    setTypedCorrect((prev) => [...prev, isCorrect]);
    if (!isCorrect) {
      setErrorCount((prev) => prev + 1);
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 150);
    } else {
      setCorrectFlash(true);
      setTimeout(() => setCorrectFlash(false), 150);
    }
    setCurrentIndex((prev) => prev + 1);
  }, [phase, fullText, currentIndex]);

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useEffect(() => {
    if (phase === "done") {
      const elapsed = startTime ? (Date.now() - startTime) / 60000 : 1;
      const w = Math.round((currentIndex / 5) / elapsed);
      const a = totalKeystrokes > 0 ? Math.round(((totalKeystrokes - errorCount) / totalKeystrokes) * 100) : 0;
      setFinalWpm(w);
      setFinalAccuracy(a);
      const req = PASS_REQUIREMENTS[level];
      const p = a >= req.accuracy && (req.wpm === null || w >= req.wpm);
      setPassed(p);

      if (!profile) return;
      const assessmentRecord = { level, date: Date.now(), wpm: w, accuracy: a, passed: p };
      const updatedProfiles = profiles.map((pr) => {
        if (pr.id !== id) return pr;
        const newHistory = [...pr.assessmentHistory, assessmentRecord];
        let updated = { ...pr, assessmentHistory: newHistory };
        if (p && pr.currentLevel === level) {
          updated = { ...updated, currentLevel: Math.min(5, level + 1), currentLesson: 0 };
          awardBadgesForResult(updated, { type: "assessment", passed: true, level, wpm: w, accuracy: a });
        }
        return updated;
      });
      saveProfiles(updatedProfiles);
      setProfiles(updatedProfiles);
    }
  }, [phase]);

  if (!profile) return <div className="min-h-screen flex items-center justify-center"><p>Profile not found.</p></div>;

  const req = PASS_REQUIREMENTS[level];
  const nextKey = fullText[currentIndex % fullText.length] ?? "";
  const displayText = fullText.slice(0, Math.min(fullText.length, currentIndex + 80));

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="assessment-page">
      <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <button
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setLocation(`/profile/${id}`)}
          data-testid="button-back-assessment"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="text-center">
          <div className="font-black text-foreground">Level {level} Assessment</div>
          <div className="text-sm text-muted-foreground">{LEVEL_NAMES[level - 1]}</div>
        </div>
        <div className={`text-3xl font-black tabular-nums ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-foreground"}`} data-testid="timer-display">
          {timeLeft}s
        </div>
      </div>

      {phase === "ready" ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
          <div className="bg-card border border-border rounded-3xl p-10 max-w-lg w-full text-center shadow-sm">
            <div className="text-5xl mb-4">⚡</div>
            <h2 className="text-2xl font-black text-foreground mb-3">Level {level} Assessment</h2>
            <p className="text-muted-foreground mb-6">Type as accurately and quickly as you can for 60 seconds.</p>
            <div className="bg-muted/50 rounded-2xl p-4 mb-8 text-sm">
              <p className="font-bold text-foreground mb-2">To pass you need:</p>
              {req.wpm && <p className="text-primary font-bold">{req.wpm}+ words per minute</p>}
              <p className="text-teal-600 font-bold">{req.accuracy}%+ accuracy</p>
            </div>
            <Button size="lg" className="w-full rounded-2xl py-6 text-lg" onClick={startAssessment} data-testid="button-start-assessment">
              <Zap className="w-5 h-5 mr-2" />
              Start Assessment
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6">
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-4xl font-black text-primary">{wpm}</div>
              <div className="text-sm text-muted-foreground">WPM</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-teal-500">{accuracy}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
          </div>

          <div className="w-full max-w-3xl bg-card border border-border rounded-3xl p-8 shadow-sm">
            <div className="font-mono text-xl leading-loose tracking-wider break-all select-none" data-testid="assessment-text">
              {displayText.split("").map((char, i) => {
                let className = "px-0.5 rounded transition-colors ";
                if (i === currentIndex % fullText.length) className += "bg-primary/30 text-primary underline underline-offset-4 animate-pulse";
                else if (i < currentIndex) className += typedCorrect[i]
                  ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
                else className += "text-muted-foreground";
                return <span key={i} className={className}>{char === " " ? "\u00A0" : char}</span>;
              })}
            </div>
          </div>

          <VirtualKeyboard activeKey={nextKey} correctFlash={correctFlash} wrongFlash={wrongFlash} />
        </div>
      )}

      <AnimatePresence>
        {phase === "done" && (
          <>
            {passed && <Confetti />}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
              data-testid="assessment-results"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="bg-card border border-border rounded-3xl p-10 max-w-md w-full text-center shadow-2xl"
              >
                {passed ? (
                  <>
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-3xl font-black text-primary mb-2">Level Unlocked!</h2>
                    <p className="text-muted-foreground mb-6">Congratulations! You passed Level {level}!</p>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-primary/10 rounded-2xl p-4">
                        <div className="text-3xl font-black text-primary">{finalWpm}</div>
                        <div className="text-xs text-muted-foreground">WPM achieved</div>
                      </div>
                      <div className="bg-teal-500/10 rounded-2xl p-4">
                        <div className="text-3xl font-black text-teal-600">{finalAccuracy}%</div>
                        <div className="text-xs text-muted-foreground">Accuracy</div>
                      </div>
                    </div>
                    <Button size="lg" className="w-full rounded-2xl py-5" onClick={() => setLocation(`/profile/${id}`)} data-testid="button-continue-after-pass">
                      Continue to Level {Math.min(5, level + 1)}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4">💪</div>
                    <h2 className="text-2xl font-black text-foreground mb-2">You're almost there!</h2>
                    <p className="text-muted-foreground mb-6">Keep practicing and you'll get it!</p>
                    <div className="bg-muted/50 rounded-2xl p-4 mb-4 text-sm text-left space-y-2">
                      <p className="font-bold text-foreground">Your results:</p>
                      <div className="flex justify-between">
                        <span>WPM</span>
                        <span className={finalWpm >= (req.wpm ?? 0) ? "text-teal-600 font-bold" : "text-red-500 font-bold"}>{finalWpm} {req.wpm ? `/ ${req.wpm} needed` : ""}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Accuracy</span>
                        <span className={finalAccuracy >= req.accuracy ? "text-teal-600 font-bold" : "text-red-500 font-bold"}>{finalAccuracy}% / {req.accuracy}% needed</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6 italic">
                      {finalAccuracy < req.accuracy
                        ? "Tip: Slow down a little — focus on accuracy first!"
                        : "Tip: You have the accuracy! Focus on keeping a steady rhythm to build speed."}
                    </p>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setLocation(`/lesson/${id}`)} data-testid="button-practice-more">
                        Practice More
                      </Button>
                      <Button className="flex-1 rounded-xl" onClick={() => { setPhase("ready"); setTimeLeft(60); setCurrentIndex(0); setErrorCount(0); setTotalKeystrokes(0); setStartTime(null); setTypedCorrect([]); }} data-testid="button-retry-assessment">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
