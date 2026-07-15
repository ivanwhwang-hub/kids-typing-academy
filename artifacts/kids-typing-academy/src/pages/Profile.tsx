import { useState, useMemo, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Star, Lock, CheckCircle, ChevronRight, Zap, Target, Flame, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { loadProfiles, saveProfiles } from "@/lib/storage";
import { Profile, SoundTheme } from "@/lib/types";
import { LEVEL_NAMES } from "@/lib/content";
import { BADGE_DEFS } from "@/lib/badges";
import { ALL_GAMES, Difficulty, formatScore } from "@/lib/games";
import { setSoundTheme, playClick } from "@/lib/sounds";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { motion } from "framer-motion";

function getLevelColor(level: number) {
  const colors = ["bg-indigo-500", "bg-blue-500", "bg-teal-500", "bg-orange-500", "bg-rose-500"];
  return colors[(level - 1) % colors.length];
}

function getLevelRequirements(level: number) {
  const reqs: Record<number, { accuracy: number; wpm: number | null }> = {
    1: { accuracy: 80, wpm: null },
    2: { accuracy: 80, wpm: 10 },
    3: { accuracy: 85, wpm: 25 },
    4: { accuracy: 90, wpm: 45 },
    5: { accuracy: 92, wpm: 70 },
  };
  return reqs[level] || { accuracy: 80, wpm: null };
}

function StarsDisplay({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((n) => (
        <Star
          key={n}
          className={`w-4 h-4 ${n <= count ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}


export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [profiles, setProfiles] = useState<Profile[]>(loadProfiles);
  const profile = profiles.find((p) => p.id === id);

  useEffect(() => {
    if (profile) setSoundTheme(profile.soundTheme ?? 'classic');
  }, [profile?.soundTheme]);

  function changeTheme(theme: SoundTheme) {
    if (!profile) return;
    const updated = profiles.map(p => p.id === profile.id ? { ...p, soundTheme: theme } : p);
    saveProfiles(updated);
    setProfiles(updated);
    setSoundTheme(theme);
    playClick();
  }

  const chartData = useMemo(() => {
    if (!profile) return [];
    return profile.lessonResults
      .slice()
      .sort((a, b) => a.date - b.date)
      .map((r, i) => ({
        name: `#${i + 1}`,
        WPM: Math.round(r.wpm),
        Accuracy: Math.round(r.accuracy),
      }));
  }, [profile]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Profile not found.</p>
          <Button onClick={() => setLocation("/")} data-testid="button-back-home">Back to Home</Button>
        </div>
      </div>
    );
  }

  const lessonsInCurrentLevel = profile.lessonResults.filter(
    (r) => r.level === profile.currentLevel
  ).length;
  const totalLessonsInLevel = 5;
  const assessmentReady = lessonsInCurrentLevel >= totalLessonsInLevel;
  const req = getLevelRequirements(profile.currentLevel);

  const bestWpm = profile.lessonResults.length > 0
    ? Math.max(...profile.lessonResults.map((r) => r.wpm))
    : 0;

  const unlockedGames = profile.unlockedGames ?? [];

  return (
    <div className="min-h-screen bg-background" data-testid="profile-page">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          onClick={() => setLocation("/")}
          data-testid="button-back-home"
        >
          <ArrowLeft className="w-4 h-4" />
          All Profiles
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-5 mb-8">
            <div className="text-7xl">{profile.avatar}</div>
            <div>
              <h1 className="text-3xl font-black text-foreground">Welcome back, {profile.name}!</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`${getLevelColor(profile.currentLevel)} text-white text-sm font-bold px-4 py-1 rounded-full`}>
                  Level {profile.currentLevel}
                </span>
                <span className="text-muted-foreground font-semibold">{LEVEL_NAMES[profile.currentLevel - 1]}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border rounded-2xl p-5 text-center">
              <Zap className="w-6 h-6 mx-auto mb-2 text-amber-500" />
              <div className="text-3xl font-black text-foreground">{Math.round(bestWpm)}</div>
              <div className="text-sm text-muted-foreground font-medium">Best WPM</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 text-center">
              <Target className="w-6 h-6 mx-auto mb-2 text-teal-500" />
              <div className="text-3xl font-black text-foreground">{profile.lessonResults.length}</div>
              <div className="text-sm text-muted-foreground font-medium">Lessons Done</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 text-center">
              <Star className="w-6 h-6 mx-auto mb-2 text-rose-500" />
              <div className="text-3xl font-black text-foreground">{profile.badges.length}</div>
              <div className="text-sm text-muted-foreground font-medium">Badges Earned</div>
            </div>
            <div className={`border rounded-2xl p-5 text-center ${(profile.currentStreak ?? 0) >= 3 ? "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800" : "bg-card border-border"}`}>
              <Flame className={`w-6 h-6 mx-auto mb-2 ${(profile.currentStreak ?? 0) >= 1 ? "text-orange-500" : "text-muted-foreground"}`} />
              <div className={`text-3xl font-black ${(profile.currentStreak ?? 0) >= 1 ? "text-orange-500" : "text-foreground"}`}>
                {profile.currentStreak ?? 0}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Day Streak</div>
            </div>
          </div>

          {/* Sound Theme Picker */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-lg text-foreground mb-4">🎵 Sound Theme</h2>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'classic' as SoundTheme, emoji: '🎹', label: 'Classic',  desc: 'Warm tones'    },
                { value: 'space'   as SoundTheme, emoji: '🚀', label: 'Space',    desc: 'Sci-fi lasers' },
                { value: 'piano'   as SoundTheme, emoji: '🎼', label: 'Piano',    desc: 'Soft piano keys' },
              ] as const).map(({ value, emoji, label, desc }) => {
                const active = (profile.soundTheme ?? 'classic') === value;
                return (
                  <button
                    key={value}
                    onClick={() => changeTheme(value)}
                    data-testid={`theme-${value}`}
                    className={`rounded-2xl border-2 p-4 text-center transition-all hover:scale-105 ${
                      active
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/40'
                        : 'border-border hover:border-primary/40 hover:bg-muted/50'
                    }`}
                  >
                    <div className="text-3xl mb-1">{emoji}</div>
                    <div className={`font-black text-sm ${active ? 'text-primary' : 'text-foreground'}`}>{label}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                    {active && <div className="mt-1 text-xs font-bold text-primary">✓ Active</div>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg text-foreground">Current Level Progress</h2>
              <span className="text-sm text-muted-foreground">{lessonsInCurrentLevel}/{totalLessonsInLevel} lessons</span>
            </div>
            <Progress value={(lessonsInCurrentLevel / totalLessonsInLevel) * 100} className="h-3 mb-3" />
            <p className="text-sm text-muted-foreground">
              To pass: {req.wpm ? `${req.wpm}+ WPM and ` : ""}{req.accuracy}%+ accuracy
            </p>
          </div>

          <div className="flex gap-3 mb-8">
            <Button
              size="lg"
              className="flex-1 rounded-2xl py-6 text-lg shadow-md"
              onClick={() => setLocation(`/lesson/${profile.id}`)}
              data-testid="button-start-practice"
            >
              Start Practice
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
            {assessmentReady && (
              <Button
                size="lg"
                variant="outline"
                className="flex-1 rounded-2xl py-6 text-lg border-2 border-primary text-primary hover:bg-primary hover:text-white"
                onClick={() => setLocation(`/assessment/${profile.id}`)}
                data-testid="button-take-assessment"
              >
                Take Assessment
                <Zap className="w-5 h-5 ml-1" />
              </Button>
            )}
          </div>

          {chartData.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <h2 className="font-bold text-lg text-foreground mb-4">Progress Over Time</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  <Line type="monotone" dataKey="WPM" stroke="hsl(255 85% 60%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Accuracy" stroke="hsl(165 75% 45%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-lg text-foreground mb-4">Badges</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {BADGE_DEFS.map((def) => {
                const earned = profile.badges.find((b) => b.id === def.id);
                return (
                  <div
                    key={def.id}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl text-center transition-all ${
                      earned ? "bg-primary/10 ring-1 ring-primary/30" : "opacity-40 bg-muted/50"
                    }`}
                    data-testid={`badge-${def.id}`}
                  >
                    <div className="text-3xl">{def.icon}</div>
                    <div className="text-xs font-bold text-foreground leading-tight">{def.name}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Games Arcade */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6" data-testid="games-arcade">
            <div className="flex items-center gap-2 mb-4">
              <Gamepad2 className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-lg text-foreground">Games Arcade</h2>
              <span className="ml-auto text-sm text-muted-foreground font-medium">
                {unlockedGames.length} / {ALL_GAMES.length} unlocked
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {ALL_GAMES.map((game) => {
                const isUnlocked = unlockedGames.includes(game.id);
                const gameScores = profile.gameHighScores?.[game.id] ?? {};
                const difficulties: Difficulty[] = ['normal', 'hard', 'extreme'];
                const bestEntries = difficulties
                  .map(d => ({ d, score: gameScores[d] }))
                  .filter(e => e.score !== undefined);
                return (
                  <div
                    key={game.id}
                    className={`rounded-2xl border p-3 flex flex-col items-center gap-2 text-center transition-all ${
                      isUnlocked
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-muted/30 opacity-55"
                    }`}
                    data-testid={`game-card-${game.id}`}
                  >
                    <div className="text-2xl">{isUnlocked ? game.emoji : "🔒"}</div>
                    <div className="text-xs font-black text-foreground leading-tight">{game.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Lv {game.level} · {game.position === "mid" ? "Mid" : "End"}
                    </div>

                    {isUnlocked && bestEntries.length > 0 && (
                      <div className="w-full mt-1 flex flex-col gap-0.5">
                        {bestEntries.map(({ d, score }) => (
                          <div key={d} className="flex items-center justify-between text-xs px-1">
                            <span className={`font-bold ${d === 'normal' ? 'text-teal-600' : d === 'hard' ? 'text-amber-600' : 'text-rose-600'}`}>
                              {d === 'normal' ? '😊' : d === 'hard' ? '😤' : '🔥'}
                            </span>
                            <span className="font-black text-foreground">{formatScore(game.type, score!)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {isUnlocked && bestEntries.length === 0 && (
                      <div className="text-xs text-muted-foreground italic">No score yet</div>
                    )}

                    {isUnlocked && (
                      <button
                        className="w-full text-xs font-bold px-2 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors mt-1"
                        onClick={() => setLocation(`/minigame/${profile.id}/${game.id}/replay`)}
                        data-testid={`play-${game.id}`}
                      >
                        🎮 Play →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {unlockedGames.length === 0 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                🎮 Complete lessons 3 and 5 in each level to unlock games!
              </p>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-lg text-foreground mb-4">Levels</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {LEVEL_NAMES.map((name, i) => {
                const levelNum = i + 1;
                const locked = levelNum > profile.currentLevel;
                const current = levelNum === profile.currentLevel;
                const completed = levelNum < profile.currentLevel;
                const starsInLevel = profile.lessonResults
                  .filter((r) => r.level === levelNum)
                  .reduce((sum, r) => sum + r.stars, 0);
                return (
                  <div
                    key={levelNum}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 text-center ${
                      current ? "border-primary bg-primary/5 ring-2 ring-primary/30" :
                      completed ? "border-teal-400 bg-teal-50 dark:bg-teal-900/20" :
                      "border-border bg-muted/30 opacity-60"
                    }`}
                    data-testid={`level-card-${levelNum}`}
                  >
                    <div className="text-2xl">
                      {completed ? <CheckCircle className="w-6 h-6 text-teal-500" /> :
                       locked ? <Lock className="w-6 h-6 text-muted-foreground" /> :
                       <span className="font-black text-primary text-lg">{levelNum}</span>}
                    </div>
                    <div className="text-xs font-bold text-foreground">{name}</div>
                    {starsInLevel > 0 && <StarsDisplay count={Math.min(3, Math.round(starsInLevel / 5))} />}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
