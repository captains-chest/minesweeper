import '@angular/compiler';
import { createEnvironmentInjector, type EnvironmentInjector } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { BrowserClock, CLOCK } from './clock';
import { GameSession } from './game-session';
import { PlayerRecord } from './player-record';
import { MemoryPlayerStore, PLAYER_STORE } from './player-store';
import { NoopThemeSurface, THEME_SURFACE } from './theme-surface';

/** Small seeded PRNG so mine placement is repeatable. */
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const setup = () => {
  const injector = createEnvironmentInjector(
    [
      { provide: CLOCK, useClass: BrowserClock },
      { provide: PLAYER_STORE, useClass: MemoryPlayerStore },
      { provide: THEME_SURFACE, useClass: NoopThemeSurface },
      PlayerRecord,
      GameSession,
    ],
    null as unknown as EnvironmentInjector,
  );
  return {
    injector,
    session: injector.get(GameSession),
    record: injector.get(PlayerRecord),
  };
};

const safeHidden = (session: GameSession) =>
  session.game().cells.filter((cell) => !cell.isMine && !cell.isRevealed);

const winBoard = (session: GameSession) => {
  for (const cell of safeHidden(session)) {
    if (session.status() !== 'playing') break;
    if (!session.game().cells[cell.index]!.isRevealed) session.reveal(cell.index);
  }
};

describe('GameSession', () => {
  let injector: EnvironmentInjector;
  let session: GameSession;
  let record: PlayerRecord;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    vi.stubGlobal('window', globalThis);
    vi.spyOn(Math, 'random').mockImplementation(seeded(42));
    ({ injector, session, record } = setup());
  });

  afterEach(() => {
    injector.destroy();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('starts ready with a fresh beginner board', () => {
    expect(session.status()).toBe('ready');
    expect(session.difficulty()).toBe('beginner');
    expect(session.elapsedLabel()).toBe('00:00');
    expect(session.pauseEnabled()).toBe(false);
  });

  it('keeps the first reveal safe and counts the run as played once', () => {
    session.reveal(40);
    expect(session.status()).toBe('playing');
    const first = session.game().cells[40]!;
    expect(first.isMine).toBe(false);
    expect(first.isRevealed).toBe(true);
    expect(record.runStatsFor('beginner').played).toBe(1);
    session.reveal(safeHidden(session)[0]!.index);
    expect(record.runStatsFor('beginner').played).toBe(1);
  });

  it('ticks the timer while playing and freezes it while paused', () => {
    session.reveal(40);
    vi.advanceTimersByTime(3_000);
    expect(session.elapsedLabel()).toBe('00:03');

    session.togglePause();
    expect(session.status()).toBe('paused');
    vi.advanceTimersByTime(10_000);
    expect(session.elapsedLabel()).toBe('00:03');

    session.reveal(safeHidden(session)[0]!.index);
    expect(session.status()).toBe('paused');

    session.togglePause();
    expect(session.status()).toBe('playing');
    vi.advanceTimersByTime(2_000);
    expect(session.elapsedLabel()).toBe('00:05');
  });

  it('records a win, sets a best time and announces it', () => {
    session.reveal(40);
    vi.advanceTimersByTime(7_000);
    winBoard(session);
    expect(session.status()).toBe('won');
    expect(record.runStatsFor('beginner')).toMatchObject({ played: 1, wins: 1, losses: 0 });
    expect(record.bestTime('beginner')).toBe(7);
    expect(session.announcement()).toBe('Board cleared in 00:07. New best time.');

    vi.advanceTimersByTime(5_000);
    expect(session.elapsedLabel()).toBe('00:07');
  });

  it('only announces a new best when strictly faster', () => {
    session.reveal(40);
    vi.advanceTimersByTime(5_000);
    winBoard(session);
    session.reset();
    session.reveal(40);
    vi.advanceTimersByTime(9_000);
    winBoard(session);
    expect(record.bestTime('beginner')).toBe(5);
    expect(session.announcement()).toBe('Board cleared in 00:09.');
  });

  it('records a loss and announces the detonation', () => {
    session.reveal(40);
    const mine = session.game().cells.find((cell) => cell.isMine)!;
    session.reveal(mine.index);
    expect(session.status()).toBe('lost');
    expect(record.runStatsFor('beginner')).toMatchObject({ played: 1, wins: 0, losses: 1 });
    expect(session.announcement()).toBe('Mine detonated. The board is revealed.');
    session.reveal(safeHidden(session)[0]?.index ?? 0);
    expect(session.status()).toBe('lost');
  });

  it('announces flags, flag mode and multi-tile reveals', () => {
    session.reveal(40);
    expect(session.announcement()).toMatch(/^\d+ safe tiles revealed\.$/);
    const hidden = session.game().cells.find((cell) => !cell.isRevealed)!;
    session.flag(hidden.index);
    expect(session.announcement()).toBe('Tile flagged.');
    session.flag(hidden.index);
    expect(session.announcement()).toBe('Flag removed.');
    session.toggleFlagMode();
    expect(session.announcement()).toBe('Flag mode on.');
    session.handlePrimaryAction(hidden.index);
    expect(session.game().cells[hidden.index]!.isFlagged).toBe(true);
  });

  it('chords a revealed number when its flags match', () => {
    session.reveal(40);
    const game = session.game();
    const numbered = game.cells.find((cell) => {
      if (!cell.isRevealed || cell.adjacentMines === 0) return false;
      const row = Math.floor(cell.index / game.columns);
      const col = cell.index % game.columns;
      return game.cells.some(
        (other) =>
          !other.isRevealed &&
          !other.isMine &&
          Math.abs(Math.floor(other.index / game.columns) - row) <= 1 &&
          Math.abs((other.index % game.columns) - col) <= 1,
      );
    })!;
    const cols = game.columns;
    const neighbors = game.cells.filter(
      (other) =>
        other.index !== numbered.index &&
        Math.abs(Math.floor(other.index / cols) - Math.floor(numbered.index / cols)) <= 1 &&
        Math.abs((other.index % cols) - (numbered.index % cols)) <= 1,
    );
    for (const mine of neighbors.filter((cell) => cell.isMine)) session.flag(mine.index);
    const before = session.game().revealedCount;
    session.handlePrimaryAction(numbered.index);
    expect(session.game().revealedCount).toBeGreaterThan(before);
    expect(session.status()).not.toBe('lost');
  });

  it('reset and difficulty switch stop the timer and announce', () => {
    session.reveal(40);
    vi.advanceTimersByTime(2_000);
    session.setDifficulty('expert');
    expect(session.status()).toBe('ready');
    expect(session.game().cells).toHaveLength(480);
    expect(session.announcement()).toBe('Expert game ready.');
    vi.advanceTimersByTime(5_000);
    expect(session.elapsedLabel()).toBe('00:00');
  });
});
