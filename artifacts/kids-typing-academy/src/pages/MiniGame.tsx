import { useState, useCallback, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { loadProfiles, saveProfiles } from '@/lib/storage';
import { BADGE_DEFS } from '@/lib/badges';
import { playWin } from '@/lib/sounds';
import { ConfettiCelebration } from '@/components/ConfettiCelebration';
import {
  ALL_GAMES, Difficulty,
  getKeyRainConfig, getAlphaDashConfig,
  getWordPopConfig, getSpeedRaceConfig, getCodeBreakerConfig,
  formatScore, isBetterScore,
} from '@/lib/games';
import { KeyRain }      from '@/components/games/KeyRain';
import { AlphabetDash } from '@/components/games/AlphabetDash';
import { WordPop }      from '@/components/games/WordPop';
import { SpeedRace }    from '@/components/games/SpeedRace';
import { CodeBreaker }  from '@/components/games/CodeBreaker';

type Phase = 'difficulty-picker' | 'intro' | 'playing' | 'result';

const DIFFICULTY_DEFS: { value: Difficulty; label: string; emoji: string; color: string; desc: string }[] = [
  { value: 'normal',  label: 'Normal',  emoji: '😊', color: 'border-teal-400 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40',   desc: 'Just right — the same pace as the story game' },
  { value: 'hard',    label: 'Hard',    emoji: '😤', color: 'border-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40', desc: 'Faster and trickier — are you up for it?' },
  { value: 'extreme', label: 'Extreme', emoji: '🔥', color: 'border-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40',    desc: 'Maximum challenge — for true keyboard masters!' },
];

export default function MiniGamePage() {
  const { profileId, gameId, difficulty: diffParam } = useParams<{
    profileId: string; gameId: string; difficulty?: string;
  }>();
  const [, setLocation] = useLocation();

  const isArcade = !!diffParam;
  const gameMeta = ALL_GAMES.find(g => g.id === gameId);

  const [phase, setPhase] = useState<Phase>(isArcade ? 'difficulty-picker' : 'intro');
  const [difficulty, setDifficulty] = useState<Difficulty>(
    diffParam === 'hard' || diffParam === 'extreme' ? diffParam : 'normal'
  );
  const [passed, setPassed] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [prevBest, setPrevBest] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);

  useEffect(() => {
    if (phase === 'result' && passed) {
      setShowConfetti(true);
      playWin();
      const t = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, passed]);

  const handleComplete = useCallback((didPass: boolean, score: number) => {
    setPassed(didPass);
    setLastScore(score);
    setPhase('result');

    const profiles = loadProfiles();
    const updated = profiles.map(p => {
      if (p.id !== profileId) return p;

      const unlocked = p.unlockedGames ?? [];
      const count = p.miniGamesCompleted ?? 0;
      const alreadyUnlocked = unlocked.includes(gameId);
      const newUnlocked = alreadyUnlocked ? unlocked : [...unlocked, gameId];
      const newCount = alreadyUnlocked ? count : count + 1;
      let updatedProfile = { ...p, unlockedGames: newUnlocked, miniGamesCompleted: newCount };

      if (newCount >= 5) {
        const hasBadge = updatedProfile.badges.some(b => b.id === 'game-master');
        if (!hasBadge) {
          const def = BADGE_DEFS.find(b => b.id === 'game-master');
          if (def) updatedProfile.badges = [...updatedProfile.badges, { id: def.id, name: def.name, description: def.description, earnedAt: Date.now(), icon: def.icon }];
        }
      }

      if (gameMeta) {
        const existingScores = { ...(updatedProfile.gameHighScores ?? {}) };
        const gameScores = { ...(existingScores[gameId] ?? {}) };
        const currentBest = gameScores[difficulty];

        const shouldUpdate = currentBest === undefined
          ? (gameMeta.type !== 'alpha-dash' || didPass)
          : isBetterScore(gameMeta.type, score, currentBest);

        if (currentBest !== undefined) {
          setPrevBest(currentBest);
        } else {
          setPrevBest(null);
        }

        if (shouldUpdate && (gameMeta.type !== 'alpha-dash' || didPass)) {
          setIsNewRecord(currentBest !== undefined);
          gameScores[difficulty] = score;
          existingScores[gameId] = gameScores;
          updatedProfile = { ...updatedProfile, gameHighScores: existingScores };
        } else {
          setIsNewRecord(false);
        }
      }

      return updatedProfile;
    });
    saveProfiles(updated);
  }, [profileId, gameId, difficulty, gameMeta]);

  if (!gameMeta) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Game not found.</p>
          <Button onClick={() => setLocation(`/profile/${profileId}`)}>Back</Button>
        </div>
      </div>
    );
  }

  function renderGame() {
    if (!gameMeta) return null;
    const type = gameMeta.type;
    if (type === 'key-rain') {
      const cfg = getKeyRainConfig(gameId, difficulty);
      return <KeyRain key={gameKey} {...cfg} onComplete={handleComplete} />;
    }
    if (type === 'alpha-dash') {
      const cfg = getAlphaDashConfig(gameId, difficulty);
      return <AlphabetDash key={gameKey} {...cfg} onComplete={handleComplete} />;
    }
    if (type === 'word-pop') {
      const cfg = getWordPopConfig(gameId, difficulty);
      return <WordPop key={gameKey} {...cfg} onComplete={handleComplete} />;
    }
    if (type === 'speed-race') {
      const cfg = getSpeedRaceConfig(gameId, difficulty);
      return <SpeedRace key={gameKey} {...cfg} onComplete={handleComplete} />;
    }
    if (type === 'code-breaker') {
      const cfg = getCodeBreakerConfig(gameId, difficulty);
      return <CodeBreaker key={gameKey} {...cfg} onComplete={handleComplete} />;
    }
    return null;
  }

  const difficultyColors: Record<Difficulty, string> = {
    normal: 'bg-teal-100 text-teal-800',
    hard: 'bg-amber-100 text-amber-800',
    extreme: 'bg-rose-100 text-rose-800',
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="minigame-page">
      <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <button
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setLocation(`/profile/${profileId}`)}
        >
          ← Back
        </button>
        <div className="text-center">
          <div className="font-black text-foreground">{gameMeta.emoji} {gameMeta.title}</div>
          {isArcade && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${difficultyColors[difficulty]}`}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
          )}
        </div>
        <div className="w-16" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">

          {/* DIFFICULTY PICKER — shown before every Arcade replay */}
          {phase === 'difficulty-picker' && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="text-center">
                <div className="text-6xl mb-3 animate-bounce">{gameMeta.emoji}</div>
                <h1 className="text-3xl font-black text-foreground">{gameMeta.title}</h1>
                <p className="text-muted-foreground mt-1 text-lg">Choose your difficulty</p>
              </div>

              <div className="grid gap-3 w-full max-w-sm">
                {DIFFICULTY_DEFS.map(d => (
                  <button
                    key={d.value}
                    className={`p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${d.color} ${difficulty === d.value ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => { setDifficulty(d.value); setPhase('intro'); }}
                    data-testid={`difficulty-${d.value}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{d.emoji}</span>
                      <div>
                        <div className="font-black text-lg text-foreground">{d.label}</div>
                        <div className="text-sm text-muted-foreground">{d.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setLocation(`/profile/${profileId}`)}
              >
                ← Back to profile
              </button>
            </motion.div>
          )}

          {/* INTRO */}
          {phase === 'intro' && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center flex flex-col items-center gap-6"
            >
              <div className="text-8xl animate-bounce">{gameMeta.emoji}</div>
              <div>
                <h1 className="text-4xl font-black text-foreground mb-2">{gameMeta.title}</h1>
                <p className="text-lg text-muted-foreground">{gameMeta.description}</p>
              </div>
              {isArcade && (
                <div className={`px-4 py-2 rounded-xl font-bold text-sm ${difficultyColors[difficulty]}`}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} difficulty
                </div>
              )}
              <Button
                size="lg"
                className="rounded-2xl px-12 py-6 text-xl font-black shadow-lg"
                onClick={() => setPhase('playing')}
              >
                Let's Play! 🎮
              </Button>
            </motion.div>
          )}

          {/* PLAYING */}
          {phase === 'playing' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-3xl p-6 shadow-md"
            >
              {renderGame()}
            </motion.div>
          )}

          {/* RESULT */}
          {phase === 'result' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="text-center flex flex-col items-center gap-6"
            >
              <ConfettiCelebration active={showConfetti} />
              <div className="text-8xl">
                {passed ? (isNewRecord ? '🏅' : '🏆') : '💪'}
              </div>
              <div>
                <h2 className="text-4xl font-black text-foreground mb-2">
                  {passed
                    ? isNewRecord ? 'New Record!' : 'Awesome job!'
                    : 'Good try!'}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {passed
                    ? isNewRecord
                      ? 'You beat your personal best — incredible!'
                      : 'You crushed that game! Keep it up!'
                    : 'Practice makes perfect. You got this!'}
                </p>
              </div>

              {lastScore !== null && (
                <div className="flex flex-col items-center gap-2">
                  <div className={`px-8 py-4 rounded-2xl text-4xl font-black ${passed ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>
                    {formatScore(gameMeta.type, lastScore)}
                  </div>
                  {prevBest !== null && !isNewRecord && passed && (
                    <p className="text-sm text-muted-foreground font-medium">
                      Personal best: {formatScore(gameMeta.type, prevBest)}
                    </p>
                  )}
                  {isNewRecord && prevBest !== null && (
                    <p className="text-sm text-muted-foreground font-medium">
                      Previous best: {formatScore(gameMeta.type, prevBest)}
                    </p>
                  )}
                </div>
              )}

              {lastScore === null && (
                <div className={`px-8 py-4 rounded-2xl text-5xl font-black ${passed ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>
                  {passed ? '⭐ Complete!' : '🔄 Try again?'}
                </div>
              )}

              <div className="flex gap-3 w-full max-w-sm">
                {isArcade && (
                  <Button
                    variant="outline"
                    className="flex-1 rounded-2xl"
                    onClick={() => {
                      setGameKey(k => k + 1);
                      setLastScore(null);
                      setPrevBest(null);
                      setIsNewRecord(false);
                      setPhase('difficulty-picker');
                    }}
                  >
                    Play Again
                  </Button>
                )}
                <Button
                  className="flex-1 rounded-2xl"
                  onClick={() => setLocation(`/profile/${profileId}`)}
                >
                  {passed ? 'Continue →' : 'Back to Profile'}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
