export const formatTime = (seconds: number): string =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export const formatMines = (count: number): string => String(Math.max(0, count)).padStart(3, '0');
