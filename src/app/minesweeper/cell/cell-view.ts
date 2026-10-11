import type { Cell } from '../models';
import type { GameStatus } from '../types';

const describeCell = (
  cell: Cell,
  explodedIndex: number | undefined,
  status: GameStatus,
): string => {
  if (cell.isRevealed && cell.isMine) {
    return cell.index === explodedIndex ? 'exploded mine' : 'mine';
  }
  if (cell.isRevealed) {
    return cell.adjacentMines === 0
      ? 'empty, no nearby mines'
      : `${cell.adjacentMines} nearby mine${cell.adjacentMines === 1 ? '' : 's'}`;
  }
  if (cell.isFlagged) {
    return status === 'lost' && !cell.isMine ? 'flagged, not a mine' : 'flagged';
  }
  return 'hidden';
};

/** Screen-reader label, e.g. "Row 3, column 5: 2 nearby mines". */
export const getCellLabel = (
  cell: Cell,
  explodedIndex: number | undefined,
  columns: number,
  status: GameStatus = 'playing',
): string => {
  const row = Math.floor(cell.index / columns) + 1;
  const column = (cell.index % columns) + 1;
  return `Row ${row}, column ${column}: ${describeCell(cell, explodedIndex, status)}`;
};

export const getCellClasses = (
  cell: Cell,
  explodedIndex: number | undefined,
  status: GameStatus,
): readonly string[] => {
  const classes = ['cell'];
  if (cell.isRevealed) {
    classes.push('is-revealed');
  }
  if (cell.isFlagged) {
    classes.push('is-flagged');
  }
  if (cell.isMine && cell.isRevealed) {
    classes.push('is-mine');
  }
  if (cell.index === explodedIndex) {
    classes.push('is-exploded');
  }
  if (status === 'lost' && cell.isFlagged && !cell.isMine) {
    classes.push('is-wrong-flag');
  }
  return classes;
};

export const getCellDisplay = (cell: Cell, explodedIndex: number | undefined): string => {
  if (cell.isRevealed && !cell.isMine && cell.adjacentMines > 0) {
    return String(cell.adjacentMines);
  }
  if (cell.isRevealed && cell.isMine && cell.index !== explodedIndex) {
    return '✹';
  }
  return '';
};
