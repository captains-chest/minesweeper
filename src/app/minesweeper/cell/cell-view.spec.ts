import { describe, expect, it } from 'vite-plus/test';
import type { Cell } from '../models';
import { getCellLabel } from './cell-view';

const cell = (overrides: Partial<Cell>): Cell => ({
  index: 0,
  isMine: false,
  isRevealed: false,
  isFlagged: false,
  adjacentMines: 0,
  ...overrides,
});

describe('cell aria labels', () => {
  it('names the position of each tile, 1-based', () => {
    expect(getCellLabel(cell({ index: 0 }), undefined, 9)).toBe('Row 1, column 1: hidden');
    expect(getCellLabel(cell({ index: 22 }), undefined, 9)).toBe('Row 3, column 5: hidden');
  });

  it('describes numbers, empty tiles and flags', () => {
    expect(getCellLabel(cell({ isRevealed: true, adjacentMines: 1 }), undefined, 9)).toBe(
      'Row 1, column 1: 1 nearby mine',
    );
    expect(getCellLabel(cell({ isRevealed: true, adjacentMines: 3 }), undefined, 9)).toBe(
      'Row 1, column 1: 3 nearby mines',
    );
    expect(getCellLabel(cell({ isRevealed: true }), undefined, 9)).toBe(
      'Row 1, column 1: empty, no nearby mines',
    );
    expect(getCellLabel(cell({ isFlagged: true }), undefined, 9)).toBe('Row 1, column 1: flagged');
  });

  it('distinguishes the exploded mine and wrong flags after a loss', () => {
    const mine = cell({ index: 4, isMine: true, isRevealed: true });
    expect(getCellLabel(mine, 4, 9, 'lost')).toBe('Row 1, column 5: exploded mine');
    expect(getCellLabel(mine, 7, 9, 'lost')).toBe('Row 1, column 5: mine');
    expect(getCellLabel(cell({ isFlagged: true }), 4, 9, 'lost')).toBe(
      'Row 1, column 1: flagged, not a mine',
    );
  });
});
