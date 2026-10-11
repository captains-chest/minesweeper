import { inject, Service, signal } from '@angular/core';
import { BEST_METER_MIN_PERCENT, BEST_METER_TIME_SCALE, DIFFICULTIES } from './constants';
import type { RunStats } from './models';
import { PLAYER_STORE } from './player-store';
import { formatTime } from './format';
import { getRunStatsForDifficulty } from './storage/functions';
import { THEME_SURFACE } from './theme-surface';
import type { DifficultyKey, Theme } from './types';

export interface RecordWinResult {
  readonly isNewBest: boolean;
  readonly bestTime: number;
}

@Service()
export class PlayerRecord {
  readonly #store = inject(PLAYER_STORE);
  readonly #themeSurface = inject(THEME_SURFACE);

  readonly #bestTimes = signal(this.#store.readBestTimes());
  readonly #runStats = signal(this.#store.readRunStats());
  readonly #theme = signal<Theme>(this.#store.readTheme() ?? 'dark');

  readonly theme = this.#theme.asReadonly();

  constructor() {
    this.#themeSurface.apply(this.#theme());
  }

  runStatsFor(difficulty: DifficultyKey): RunStats {
    return getRunStatsForDifficulty(this.#runStats(), difficulty);
  }

  bestTime(difficulty: DifficultyKey): number | undefined {
    return this.#bestTimes()[difficulty];
  }

  bestTimeLabel(difficulty: DifficultyKey): string {
    const bestTime = this.bestTime(difficulty);
    return bestTime === undefined ? '—:——' : formatTime(bestTime);
  }

  bestCopy(difficulty: DifficultyKey): string {
    const bestTime = this.bestTime(difficulty);
    return bestTime === undefined
      ? 'Clear a board to set your first record.'
      : `${DIFFICULTIES[difficulty].label} pace. Can you shave off a second?`;
  }

  bestMeterPercent(difficulty: DifficultyKey): number {
    const bestTime = this.bestTime(difficulty);
    if (bestTime === undefined) {
      return 0;
    }
    return Math.max(BEST_METER_MIN_PERCENT, Math.min(100, 100 - bestTime / BEST_METER_TIME_SCALE));
  }

  recordPlayed(difficulty: DifficultyKey): void {
    this.#runStats.set(this.#store.incrementRunStat(this.#runStats(), difficulty, 'played'));
  }

  recordWin(difficulty: DifficultyKey, elapsedSeconds: number): RecordWinResult {
    this.#runStats.set(this.#store.incrementRunStat(this.#runStats(), difficulty, 'wins'));
    const previousBestTimes = this.#bestTimes();
    const nextBestTimes = this.#store.writeBestTime(previousBestTimes, difficulty, elapsedSeconds);
    const isNewBest = nextBestTimes !== previousBestTimes;
    this.#bestTimes.set(nextBestTimes);
    const bestTime = nextBestTimes[difficulty] ?? elapsedSeconds;
    return { isNewBest, bestTime };
  }

  recordLoss(difficulty: DifficultyKey): void {
    this.#runStats.set(this.#store.incrementRunStat(this.#runStats(), difficulty, 'losses'));
  }

  toggleTheme(): void {
    const nextTheme: Theme = this.#theme() === 'light' ? 'dark' : 'light';
    this.#theme.set(nextTheme);
    this.#store.writeTheme(nextTheme);
    this.#themeSurface.apply(nextTheme);
  }
}
