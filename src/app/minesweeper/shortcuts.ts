import type { DifficultyKey } from './types';

export type ShortcutCommand =
  | { readonly type: 'restart' }
  | { readonly type: 'pause' }
  | { readonly type: 'help' }
  | { readonly type: 'difficulty'; readonly difficulty: DifficultyKey };

export interface ShortcutKeyEvent {
  readonly key: string;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly altKey?: boolean;
  /** True when the event comes from a text field, where letters must type normally. */
  readonly fromEditable?: boolean;
}

const DIFFICULTY_KEYS: Record<string, DifficultyKey> = {
  '1': 'beginner',
  '2': 'intermediate',
  '3': 'expert',
};

/** A shortcut shown in the on-screen help. */
export interface ShortcutHelp {
  readonly keys: readonly string[];
  readonly action: string;
}

export const SHORTCUT_HELP: readonly ShortcutHelp[] = [
  { keys: ['Enter', 'Space'], action: 'Reveal a tile, or chord a number' },
  { keys: ['F'], action: 'Flag or unflag a tile' },
  { keys: ['←', '↑', '→', '↓'], action: 'Move between tiles' },
  { keys: ['Home', 'End'], action: 'Start or end of the row' },
  { keys: ['Ctrl + Home', 'Ctrl + End'], action: 'First or last tile' },
  { keys: ['PgUp', 'PgDn'], action: 'Top or bottom of the column' },
  { keys: ['R'], action: 'Restart' },
  { keys: ['P'], action: 'Pause or resume' },
  { keys: ['1', '2', '3'], action: 'Beginner, Intermediate, Expert' },
  { keys: ['?'], action: 'Show or hide these shortcuts' },
];

/** aria-keyshortcuts value for the page-level shortcuts. */
export const GLOBAL_KEYSHORTCUTS = 'R P 1 2 3 Shift+?';

export const shortcutFor = (event: ShortcutKeyEvent): ShortcutCommand | null => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.fromEditable) {
    return null;
  }
  const key = event.key.toLowerCase();
  if (key === 'r') {
    return { type: 'restart' };
  }
  if (key === 'p') {
    return { type: 'pause' };
  }
  if (key === '?') {
    return { type: 'help' };
  }
  const difficulty = DIFFICULTY_KEYS[key];
  return difficulty ? { type: 'difficulty', difficulty } : null;
};
