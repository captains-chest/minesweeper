import type { Cell } from '../models';
import type { GameStatus } from '../types';

export const getCellLabel = (cell: Cell, explodedIndex: number | undefined): string => {
  if (cell.isRevealed && cell.isMine) {
    return cell.index === explodedIndex ? 'Exploded mine' : 'Mine';
  }
  if (cell.isRevealed) {
    return cell.adjacentMines === 0
      ? 'Empty safe tile'
      : `Safe tile with ${cell.adjacentMines} nearby mine${cell.adjacentMines === 1 ? '' : 's'}`;
  }
  if (cell.isFlagged) {
    return 'Flagged tile';
  }
  return 'Hidden tile';
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
