import { Profile } from './types';

const PROFILES_KEY = 'kta-data';
const CUSTOM_WORDS_KEY = 'kta-custom-words';

export function loadProfiles(): Profile[] {
  try {
    const data = localStorage.getItem(PROFILES_KEY);
    if (data) {
      const profiles = JSON.parse(data) as Profile[];
      return profiles.map(p => ({
        ...p,
        unlockedGames: p.unlockedGames ?? [],
        miniGamesCompleted: p.miniGamesCompleted ?? 0,
        soundTheme: p.soundTheme ?? 'classic',
        gameHighScores: p.gameHighScores ?? {},
      }));
    }
  } catch (e) {
    console.error("Failed to load profiles", e);
  }
  return [];
}

export function saveProfiles(profiles: Profile[]) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error("Failed to save profiles", e);
  }
}

export function loadCustomWords(): Record<number, string[]> {
  try {
    const data = localStorage.getItem(CUSTOM_WORDS_KEY);
    if (data) {
      return JSON.parse(data) as Record<number, string[]>;
    }
  } catch (e) {
    console.error("Failed to load custom words", e);
  }
  return {};
}

export function saveCustomWords(words: Record<number, string[]>) {
  try {
    localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(words));
  } catch (e) {
    console.error("Failed to save custom words", e);
  }
}
