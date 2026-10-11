import '@angular/compiler';
import { createEnvironmentInjector, type EnvironmentInjector } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserClock, CLOCK } from './clock';
import { GameSession } from './game-session';
import { PlayerRecord } from './player-record';
import { MemoryPlayerStore, PLAYER_STORE } from './player-store';
import { NoopThemeSurface, THEME_SURFACE } from './theme-surface';

describe('GameSession keyboard support', () => {
  let injector: EnvironmentInjector;
  let session: GameSession;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('window', globalThis);
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    injector = createEnvironmentInjector(
      [
        { provide: CLOCK, useClass: BrowserClock },
        { provide: PLAYER_STORE, useClass: MemoryPlayerStore },
        { provide: THEME_SURFACE, useClass: NoopThemeSurface },
        PlayerRecord,
        GameSession,
      ],
      null as unknown as EnvironmentInjector,
    );
    session = injector.get(GameSession);
  });

  afterEach(() => {
    injector.destroy();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('counts resets so the board can restore focus', () => {
    expect(session.resetCount()).toBe(0);
    session.reset();
    session.setDifficulty('intermediate');
    expect(session.resetCount()).toBe(2);
  });

  it('announces pause and resume', () => {
    session.reveal(40);
    session.togglePause();
    expect(session.announcement()).toBe('Game paused.');
    session.togglePause();
    expect(session.announcement()).toBe('Game resumed.');
  });

  it('toggles the shortcut help', () => {
    expect(session.shortcutHelpOpen()).toBe(false);
    session.toggleShortcutHelp();
    expect(session.shortcutHelpOpen()).toBe(true);
    session.toggleShortcutHelp(false);
    expect(session.shortcutHelpOpen()).toBe(false);
  });
});
