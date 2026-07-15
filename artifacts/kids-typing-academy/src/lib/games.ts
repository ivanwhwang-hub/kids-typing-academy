export type Difficulty = 'normal' | 'hard' | 'extreme';
export type GameType = 'key-rain' | 'alpha-dash' | 'word-pop' | 'speed-race' | 'code-breaker';

export function formatScore(type: GameType, score: number): string {
  if (type === 'alpha-dash' || type === 'code-breaker') {
    return `${(score / 1000).toFixed(1)}s`;
  }
  if (type === 'speed-race') return `${score} WPM`;
  if (type === 'word-pop') return `${score} pops`;
  return `${score} keys`;
}

export function isBetterScore(type: GameType, newScore: number, oldScore: number): boolean {
  if (type === 'alpha-dash' || type === 'code-breaker') {
    return newScore < oldScore;
  }
  return newScore > oldScore;
}

export interface GameMeta {
  id: string;
  level: number;
  position: 'mid' | 'end';
  type: GameType;
  title: string;
  emoji: string;
  description: string;
}

export interface KeyRainCfg    { keys: string[]; fallDurationMs: number; spawnIntervalMs: number; maxMisses: number; targetScore: number; }
export interface AlphaDashCfg  { letters: string[]; timeLimitMs: number; maxMisses: number; }
export interface WordPopCfg    { words: string[]; timePerWordMs: number; targetPop: number; }
export interface SpeedRaceCfg  { text: string; targetWpm: number; }
export interface CodeBreakerCfg { codes: string[]; }

export const ALL_GAMES: GameMeta[] = [
  { id: '1-mid', level: 1, position: 'mid', type: 'key-rain',     title: 'Key Rain',        emoji: '🌧️', description: 'Type the falling home-row keys before they land!' },
  { id: '1-end', level: 1, position: 'end', type: 'key-rain',     title: 'Key Downpour',    emoji: '⛈️', description: 'Faster keys — keep up with the downpour!' },
  { id: '2-mid', level: 2, position: 'mid', type: 'alpha-dash',   title: 'Alphabet Dash',   emoji: '🔤', description: 'Type the letters as fast as you can!' },
  { id: '2-end', level: 2, position: 'end', type: 'alpha-dash',   title: 'Alphabet Sprint', emoji: '🏃', description: 'All 26 letters — on your marks, go!' },
  { id: '3-mid', level: 3, position: 'mid', type: 'word-pop',     title: 'Word Pop',        emoji: '🫧', description: 'Type the word before the bubble pops!' },
  { id: '3-end', level: 3, position: 'end', type: 'word-pop',     title: 'Bubble Burst',    emoji: '💥', description: 'Longer words, faster bubbles — burst them all!' },
  { id: '4-mid', level: 4, position: 'mid', type: 'speed-race',   title: 'Speed Race',      emoji: '🏎️', description: 'Type fast enough to win the race!' },
  { id: '4-end', level: 4, position: 'end', type: 'speed-race',   title: 'Grand Prix',      emoji: '🏁', description: 'Hit 45 WPM to cross the finish line!' },
  { id: '5-mid', level: 5, position: 'mid', type: 'code-breaker', title: 'Code Breaker',    emoji: '🔐', description: 'Type the sequences to crack the safe!' },
  { id: '5-end', level: 5, position: 'end', type: 'code-breaker', title: 'Master Hacker',   emoji: '💻', description: 'Longer codes, bigger challenge — unlock them all!' },
];

const HOME_ROW = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
const ALL_LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const SHORT_WORDS = ['cat', 'dog', 'sun', 'run', 'hop', 'frog', 'duck', 'fish', 'tree', 'bird'];
const LONG_WORDS  = ['jungle', 'spring', 'castle', 'forest', 'planet', 'dragon', 'basket', 'bridge'];

function dm(d: Difficulty): number {
  return d === 'hard' ? 0.7 : d === 'extreme' ? 0.5 : 1.0;
}

export function getKeyRainConfig(gameId: string, difficulty: Difficulty): KeyRainCfg {
  const isMid = gameId === '1-mid';
  const m = dm(difficulty);
  return {
    keys: HOME_ROW,
    fallDurationMs: Math.round((isMid ? 4000 : 3000) * m),
    spawnIntervalMs: Math.round((isMid ? 1600 : 1200) * m),
    maxMisses: difficulty === 'extreme' ? 2 : 3,
    targetScore: isMid ? 10 : 15,
  };
}

export function getAlphaDashConfig(gameId: string, difficulty: Difficulty): AlphaDashCfg {
  const isMid = gameId === '2-mid';
  const m = dm(difficulty);
  return {
    letters: isMid ? ALL_LETTERS.slice(0, 13) : ALL_LETTERS,
    timeLimitMs: Math.round((isMid ? 40000 : 65000) * m),
    maxMisses: difficulty === 'extreme' ? 3 : difficulty === 'hard' ? 5 : 8,
  };
}

export function getWordPopConfig(gameId: string, difficulty: Difficulty): WordPopCfg {
  const isMid = gameId === '3-mid';
  const m = dm(difficulty);
  return {
    words: isMid ? SHORT_WORDS.slice(0, 6) : LONG_WORDS,
    timePerWordMs: Math.round((isMid ? 6000 : 5000) * m),
    targetPop: isMid ? 4 : 6,
  };
}

export function getSpeedRaceConfig(gameId: string, difficulty: Difficulty): SpeedRaceCfg {
  const isMid = gameId === '4-mid';
  const wm = difficulty === 'hard' ? 1.3 : difficulty === 'extreme' ? 1.6 : 1.0;
  return {
    text: isMid
      ? 'the quick brown fox jumps over the lazy dog'
      : 'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.',
    targetWpm: Math.round((isMid ? 30 : 45) * wm),
  };
}

export function getCodeBreakerConfig(gameId: string, difficulty: Difficulty): CodeBreakerCfg {
  const isMid = gameId === '5-mid';
  if (difficulty === 'extreme') return { codes: ['A1!b@c#', '#P@ss0!x', 'Xy9$Rf&2'] };
  if (difficulty === 'hard')   return { codes: isMid ? ['qwerty', 'asdfgh', 'zxcvbn'] : ['A1b@cd', 'x9!Yz2', '#Rf5&q', 'P@s0!x'] };
  return { codes: isMid ? ['asdf', 'jkl;', 'fdsa', ';lkj'] : ['A1b@cd', 'x9!Yz2', '#Rf5&q', 'P@s0!x'] };
}
