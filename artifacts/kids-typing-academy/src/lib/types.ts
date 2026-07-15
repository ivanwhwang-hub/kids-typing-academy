export type SoundTheme = 'classic' | 'space' | 'piano';

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  createdAt: number;
  currentLevel: number;
  currentLesson: number;
  assessmentHistory: Assessment[];
  badges: Badge[];
  lessonResults: LessonResult[];
  totalPracticeTime: number;
  currentStreak: number;
  lastPracticeDate: string | null;
  unlockedGames: string[];
  miniGamesCompleted: number;
  soundTheme: SoundTheme;
  gameHighScores: Record<string, Record<string, number>>;
}

export interface Assessment {
  level: number;
  date: number;
  wpm: number;
  accuracy: number;
  passed: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  earnedAt: number;
  icon: string;
}

export interface LessonResult {
  level: number;
  lessonIndex: number;
  date: number;
  wpm: number;
  accuracy: number;
  stars: number;
}
