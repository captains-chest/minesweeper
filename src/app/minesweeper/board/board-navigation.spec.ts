import { describe, expect, it } from 'vitest';
import { createMinefield, revealCell } from '../minefield';
import {
  BOARD_KEYS,
  initialBoardInputState,
  navigationTarget,
  reduceBoardInput,
} from './board-input';

const key = (index: number, keyName: string, ctrlKey = false) =>
  reduceBoardInput(initialBoardInputState(index), createMinefield('beginner'), {
    kind: 'key',
    index,
    key: keyName,
    ctrlKey,
  });

describe('board keyboard navigation', () => {
  const game = createMinefield('beginner'); // 9 × 9

  it('Home/End jump within the row', () => {
    expect(navigationTarget(game, 22, 'Home')).toBe(18);
    expect(navigationTarget(game, 22, 'End')).toBe(26);
  });

  it('Ctrl+Home/End jump to the first and last tile', () => {
    expect(navigationTarget(game, 22, 'Home', true)).toBe(0);
    expect(navigationTarget(game, 22, 'End', true)).toBe(80);
  });

  it('PageUp/PageDown jump within the column', () => {
    expect(navigationTarget(game, 22, 'PageUp')).toBe(4);
    expect(navigationTarget(game, 22, 'PageDown')).toBe(76);
  });

  it('works on non-square boards', () => {
    const expert = createMinefield('expert'); // 30 columns × 16 rows
    expect(navigationTarget(expert, 35, 'End')).toBe(59);
    expect(navigationTarget(expert, 35, 'PageDown')).toBe(15 * 30 + 5);
  });

  it('moves focus and emits a focus intent', () => {
    const result = key(22, 'End');
    expect(result.state.focusedIndex).toBe(26);
    expect(result.intents).toEqual([{ type: 'focus', index: 26 }]);
  });

  it('does nothing when already at the target', () => {
    expect(key(18, 'Home').intents).toEqual([]);
    expect(key(0, 'ArrowLeft').intents).toEqual([]);
  });

  it('ignores non-navigation keys', () => {
    expect(navigationTarget(game, 22, 'x')).toBeUndefined();
  });
});

describe('board keyboard actions', () => {
  it('Enter and Space reveal a hidden tile', () => {
    expect(key(10, 'Enter').intents).toEqual([{ type: 'primary', index: 10 }]);
    expect(key(10, ' ').intents).toEqual([{ type: 'primary', index: 10 }]);
  });

  it('Enter on a revealed number still chords', () => {
    const game = revealCell(createMinefield('beginner'), 40, () => 0.3, 0).minefield;
    const numbered = game.cells.find((cell) => cell.isRevealed && cell.adjacentMines > 0)!;
    const result = reduceBoardInput(initialBoardInputState(numbered.index), game, {
      kind: 'key',
      index: numbered.index,
      key: 'Enter',
    });
    expect(result.intents).toEqual([{ type: 'primary', index: numbered.index }]);
  });

  it('ignores keys once the run is over', () => {
    const lost = { ...createMinefield('beginner'), status: 'lost' as const };
    const result = reduceBoardInput(initialBoardInputState(0), lost, {
      kind: 'key',
      index: 0,
      key: 'Enter',
    });
    expect(result.intents).toEqual([]);
  });

  it('suppresses browser defaults for every board key', () => {
    for (const k of ['Home', 'End', 'PageUp', 'PageDown', ' ', 'Enter', 'f']) {
      expect(BOARD_KEYS.has(k)).toBe(true);
    }
    expect(BOARD_KEYS.has('r')).toBe(false);
  });
});
