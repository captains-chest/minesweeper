import { describe, expect, it } from 'vite-plus/test';
import { MemoryPlayerStore } from './player-store';
import type { PlayerStore } from './player-store';
import type { ThemeSurface } from './theme-surface';
import type { Theme } from './types';

/**
 * Lightweight harness: PlayerRecord is an Angular @Service that injects tokens.
 * Exercise the store rules the record relies on, plus MemoryPlayerStore semantics.
 */
describe('MemoryPlayerStore / player record rules', () => {
  it('records a strictly better best time only', () => {
    const store = new MemoryPlayerStore();
    const first = store.writeBestTime({}, 'beginner', 40);
    expect(first.beginner).toBe(40);
    const same = store.writeBestTime(first, 'beginner', 40);
    expect(same).toBe(first);
    const worse = store.writeBestTime(first, 'beginner', 50);
    expect(worse).toBe(first);
    const better = store.writeBestTime(first, 'beginner', 30);
    expect(better.beginner).toBe(30);
  });

  it('increments run stats per difficulty', () => {
    const store = new MemoryPlayerStore();
    let stats = store.readRunStats();
    stats = store.incrementRunStat(stats, 'beginner', 'played');
    stats = store.incrementRunStat(stats, 'beginner', 'wins');
    stats = store.incrementRunStat(stats, 'expert', 'losses');
    expect(stats.beginner?.played).toBe(1);
    expect(stats.beginner?.wins).toBe(1);
    expect(stats.expert?.losses).toBe(1);
  });

  it('persists theme preference in memory', () => {
    const store = new MemoryPlayerStore();
    expect(store.readTheme()).toBeNull();
    store.writeTheme('light');
    expect(store.readTheme()).toBe('light');
  });
});

describe('theme surface contract', () => {
  it('applies theme without throwing when noop', () => {
    const applied: Theme[] = [];
    const surface: ThemeSurface = {
      apply: (theme) => {
        applied.push(theme);
      },
    };
    surface.apply('dark');
    surface.apply('light');
    expect(applied).toEqual(['dark', 'light']);
  });
});

// Keep PlayerStore type import live for future DI tests.
void (null as unknown as PlayerStore);
