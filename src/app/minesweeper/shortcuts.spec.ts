import { describe, expect, it } from 'vitest';
import { SHORTCUT_HELP, shortcutFor } from './shortcuts';

describe('page shortcuts', () => {
  it('maps R, P and ? to commands, case-insensitively', () => {
    expect(shortcutFor({ key: 'r' })).toEqual({ type: 'restart' });
    expect(shortcutFor({ key: 'R' })).toEqual({ type: 'restart' });
    expect(shortcutFor({ key: 'p' })).toEqual({ type: 'pause' });
    expect(shortcutFor({ key: '?' })).toEqual({ type: 'help' });
  });

  it('maps 1/2/3 to the three levels', () => {
    expect(shortcutFor({ key: '1' })).toEqual({ type: 'difficulty', difficulty: 'beginner' });
    expect(shortcutFor({ key: '2' })).toEqual({ type: 'difficulty', difficulty: 'intermediate' });
    expect(shortcutFor({ key: '3' })).toEqual({ type: 'difficulty', difficulty: 'expert' });
    expect(shortcutFor({ key: '4' })).toBeNull();
  });

  it('ignores modified keys and typing in text fields', () => {
    expect(shortcutFor({ key: 'r', ctrlKey: true })).toBeNull();
    expect(shortcutFor({ key: 'r', metaKey: true })).toBeNull();
    expect(shortcutFor({ key: 'p', altKey: true })).toBeNull();
    expect(shortcutFor({ key: '1', fromEditable: true })).toBeNull();
  });

  it('leaves board keys to the board', () => {
    for (const key of ['f', 'Enter', ' ', 'ArrowUp', 'Home']) {
      expect(shortcutFor({ key })).toBeNull();
    }
  });

  it('documents every page shortcut in the help list', () => {
    const keys = SHORTCUT_HELP.flatMap((entry) => entry.keys);
    for (const key of ['R', 'P', '1', '2', '3', '?', 'Enter', 'Space', 'F', 'Home', 'PgDn']) {
      expect(keys).toContain(key);
    }
  });
});
