import { Profile, LessonResult } from './types';

export const BADGE_DEFS = [
  { id: "first-steps",    name: "First Steps",      icon: "🎯", description: "Complete your first lesson" },
  { id: "home-row-hero",  name: "Home Row Hero",     icon: "🏠", description: "Pass Level 1 assessment" },
  { id: "key-explorer",   name: "Key Explorer",      icon: "🔍", description: "Pass Level 2 assessment" },
  { id: "word-wizard",    name: "Word Wizard",       icon: "✨", description: "Pass Level 3 assessment" },
  { id: "speed-racer",    name: "Speed Racer",       icon: "🏎️", description: "Pass Level 4 assessment" },
  { id: "expert-typist",  name: "Expert Typist",     icon: "🏆", description: "Pass Level 5 assessment" },
  { id: "perfect-practice", name: "Perfect Practice", icon: "⭐", description: "Get 3 stars on any lesson" },
  { id: "accuracy-ace",   name: "Accuracy Ace",      icon: "🎯", description: "95%+ accuracy in any lesson" },
  { id: "speed-25",       name: "First 25 WPM",      icon: "💨", description: "Achieve 25+ WPM" },
  { id: "speed-50",       name: "First 50 WPM",      icon: "⚡", description: "Achieve 50+ WPM" },
  { id: "master-typist",  name: "Master Typist",     icon: "👑", description: "90 WPM+ at 95% accuracy" },
  { id: "dedicated",      name: "Dedicated",         icon: "📚", description: "Complete 10 lessons total" },
  { id: "streak-3",       name: "3-Day Streak",      icon: "🔥", description: "Practice 3 days in a row" },
  { id: "streak-7",       name: "Week Warrior",      icon: "🗓️", description: "Practice 7 days in a row" },
  { id: "streak-14",      name: "Fortnight Champ",   icon: "💪", description: "Practice 14 days in a row" },
  { id: "streak-30",      name: "Monthly Master",    icon: "🌟", description: "Practice 30 days in a row" },
  { id: "game-master",    name: "Game Master",       icon: "🎮", description: "Complete 5 mini-games" },
];

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function updateStreak(profile: Profile): Profile {
  const today = todayString();
  const yesterday = yesterdayString();
  if (profile.lastPracticeDate === today) return profile;
  const newStreak = profile.lastPracticeDate === yesterday
    ? (profile.currentStreak ?? 0) + 1
    : 0;
  return { ...profile, currentStreak: newStreak, lastPracticeDate: today };
}

export function awardBadgesForResult(
  profile: Profile,
  result: LessonResult | { type: 'assessment'; passed: boolean; level: number; wpm: number; accuracy: number }
): string[] {
  const newBadges: string[] = [];
  const hasBadge = (id: string) => profile.badges.some((b) => b.id === id);
  const award = (id: string) => {
    if (!hasBadge(id)) {
      const def = BADGE_DEFS.find((b) => b.id === id);
      if (def) {
        profile.badges.push({ id: def.id, name: def.name, description: def.description, earnedAt: Date.now(), icon: def.icon });
        newBadges.push(id);
      }
    }
  };

  const wpm = 'wpm' in result ? result.wpm : 0;
  const accuracy = 'accuracy' in result ? result.accuracy : 0;

  if (wpm >= 25) award("speed-25");
  if (wpm >= 50) award("speed-50");
  if (accuracy >= 95) award("accuracy-ace");
  if (wpm >= 90 && accuracy >= 95) award("master-typist");

  if ('stars' in result) {
    if (result.stars === 3) award("perfect-practice");
    if (profile.lessonResults.length >= 1) award("first-steps");
    if (profile.lessonResults.length >= 10) award("dedicated");
  } else if (result.type === 'assessment' && result.passed) {
    if (result.level === 1) award("home-row-hero");
    if (result.level === 2) award("key-explorer");
    if (result.level === 3) award("word-wizard");
    if (result.level === 4) award("speed-racer");
    if (result.level === 5) award("expert-typist");
  }

  const streak = profile.currentStreak ?? 0;
  if (streak >= 3)  award("streak-3");
  if (streak >= 7)  award("streak-7");
  if (streak >= 14) award("streak-14");
  if (streak >= 30) award("streak-30");

  const games = profile.miniGamesCompleted ?? 0;
  if (games >= 5) award("game-master");

  return newBadges;
}
