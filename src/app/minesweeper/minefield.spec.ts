import { describe, expect, it } from 'vite-plus/test';
import {
  createMinefield,
  getMinesRemaining,
  getSafeRemaining,
  isTerminalStatus,
  pauseGame,
  resumeGame,
  revealCell,
  toggleFlag,
} from './minefield';

const fixedRandom = (...values: number[]): (() => number) => {
  let index = 0;
  return () => {
    const value = values[index % values.length] ?? 0;
    index += 1;
    return value;
  };
};

describe('minefield', () => {
  it('creates a ready minefield for the chosen difficulty', () => {
    const game = createMinefield('beginner');
    expect(game.status).toBe('ready');
    expect(game.rows).toBe(9);
    expect(game.columns).toBe(9);
    expect(game.mineCount).toBe(10);
    expect(game.cells).toHaveLength(81);
    expect(getSafeRemaining(game)).toBe(71);
    expect(getMinesRemaining(game)).toBe(10);
  });

  it('starts on first reveal and never plants the first cell as a mine', () => {
    const ready = createMinefield('beginner');
    const { minefield: state, revealedIndices } = revealCell(ready, 0, fixedRandom(0.99), 1_000);
    expect(state.cells[0]?.isMine).toBe(false);
    expect(state.cells[0]?.isRevealed).toBe(true);
    expect(revealedIndices.length).toBeGreaterThan(0);
    expect(state.status === 'playing' || state.status === 'won').toBe(true);
    if (state.status === 'playing') {
      expect(isTerminalStatus(state.status)).toBe(false);
    }
  });

  it('toggles flags without exceeding mine count', () => {
    let game = createMinefield('beginner');
    game = toggleFlag(game, 0);
    expect(game.cells[0]?.isFlagged).toBe(true);
    expect(getMinesRemaining(game)).toBe(9);
  });

  it('pauses and resumes elapsed time bookkeeping', () => {
    const playing = {
      ...createMinefield('beginner'),
      status: 'playing' as const,
      startedAt: 1_000,
      elapsedSeconds: 0,
    };
    const paused = pauseGame(playing, 4_000);
    expect(paused.status).toBe('paused');
    expect(paused.elapsedSeconds).toBe(3);
    expect(paused.startedAt).toBeNull();
    const resumed = resumeGame(paused, 5_000);
    expect(resumed.status).toBe('playing');
    expect(resumed.startedAt).toBe(5_000);
  });
});
