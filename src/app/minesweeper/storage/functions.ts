import type { BestTimes, RunStats, RunStatsByDifficulty } from '../models';
import type { DifficultyKey, RunStatKey, Theme } from '../types';
import { BEST_TIMES_STORAGE_KEY, RUN_STATS_STORAGE_KEY, THEME_STORAGE_KEY } from './constants';

const readStoredObject = (storage: Storage, key: string): Record<string, unknown> => {
  try {
    const value = JSON.parse(storage.getItem(key) || '{}') as unknown;
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

const writeStoredValue = (storage: Storage, key: string, value: unknown): void => {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Persistence is an enhancement, not a dependency.
  }
};

export const readBestTimes = (storage: Storage): BestTimes => {
  const raw = readStoredObject(storage, BEST_TIMES_STORAGE_KEY);
  const bestTimes: BestTimes = {};
  for (const [key, value] of Object.entries(raw)) {
    if (
      (key === 'beginner' || key === 'intermediate' || key === 'expert') &&
      typeof value === 'number'
    ) {
      bestTimes[key] = value;
    }
  }
  return bestTimes;
};

export const writeBestTime = (
  storage: Storage,
  bestTimes: BestTimes,
  difficulty: DifficultyKey,
  time: number,
): BestTimes => {
  const previousBestTime = bestTimes[difficulty];
  if (previousBestTime !== undefined && previousBestTime <= time) {
    return bestTimes;
  }
  const nextBestTimes = { ...bestTimes, [difficulty]: time };
  writeStoredValue(storage, BEST_TIMES_STORAGE_KEY, nextBestTimes);
  return nextBestTimes;
};

export const readRunStats = (storage: Storage): RunStatsByDifficulty => {
  const raw = readStoredObject(storage, RUN_STATS_STORAGE_KEY);
  const parsed: RunStatsByDifficulty = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key !== 'beginner' && key !== 'intermediate' && key !== 'expert') {
      continue;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      continue;
    }
    const stats = value as Record<string, unknown>;
    parsed[key] = {
      played: typeof stats['played'] === 'number' ? stats['played'] : undefined,
      wins: typeof stats['wins'] === 'number' ? stats['wins'] : undefined,
      losses: typeof stats['losses'] === 'number' ? stats['losses'] : undefined,
    };
  }
  return parsed;
};

export const getRunStatsForDifficulty = (
  allStats: RunStatsByDifficulty,
  difficulty: DifficultyKey,
): RunStats => {
  const stats = allStats[difficulty] ?? {};
  return {
    played: stats.played ?? 0,
    wins: stats.wins ?? 0,
    losses: stats.losses ?? 0,
  };
};

export const incrementRunStat = (
  storage: Storage,
  allStats: RunStatsByDifficulty,
  difficulty: DifficultyKey,
  stat: RunStatKey,
): RunStatsByDifficulty => {
  const currentStats = getRunStatsForDifficulty(allStats, difficulty);
  const nextStats: RunStatsByDifficulty = {
    ...allStats,
    [difficulty]: {
      ...currentStats,
      [stat]: currentStats[stat] + 1,
    },
  };
  writeStoredValue(storage, RUN_STATS_STORAGE_KEY, nextStats);
  return nextStats;
};

export const readTheme = (storage: Storage): Theme | null => {
  try {
    const theme = storage.getItem(THEME_STORAGE_KEY);
    return theme === 'light' || theme === 'dark' ? theme : null;
  } catch {
    return null;
  }
};

export const writeTheme = (storage: Storage, theme: Theme): void => {
  try {
    storage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Theme preference is optional.
  }
};
