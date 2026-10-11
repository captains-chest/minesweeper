import { CLICK_SUPPRESSION_RESET_MS, LONG_PRESS_MS } from '../constants';
import { isTerminalStatus } from '../minefield';
import type { Minefield } from '../models';

export type BoardIntent =
  | { readonly type: 'primary'; readonly index: number }
  | { readonly type: 'flag'; readonly index: number }
  | { readonly type: 'focus'; readonly index: number };

export type BoardInputEvent =
  | { readonly kind: 'click'; readonly index: number }
  | { readonly kind: 'contextFlag'; readonly index: number }
  | { readonly kind: 'key'; readonly index: number; readonly key: string }
  | { readonly kind: 'pointerDown'; readonly index: number; readonly pointerType: string }
  | { readonly kind: 'pointerEnd'; readonly index: number; readonly pointerType: string }
  | { readonly kind: 'longPressFire'; readonly index: number }
  | { readonly kind: 'clearSuppression'; readonly index: number };

export interface BoardInputState {
  readonly focusedIndex: number;
  readonly longPressIndex: number | null;
  readonly suppressedClickIndex: number | null;
}

export interface BoardInputResult {
  readonly state: BoardInputState;
  readonly intents: readonly BoardIntent[];
  /** Schedule a long-press fire after LONG_PRESS_MS, or null to clear. */
  readonly scheduleLongPressIndex: number | null;
  /** After click suppression, clear after CLICK_SUPPRESSION_RESET_MS when set. */
  readonly scheduleClearSuppressionIndex: number | null;
}

export const initialBoardInputState = (focusedIndex = 0): BoardInputState => ({
  focusedIndex,
  longPressIndex: null,
  suppressedClickIndex: null,
});

export const longPressMs = LONG_PRESS_MS;
export const clickSuppressionResetMs = CLICK_SUPPRESSION_RESET_MS;

const movement: Record<string, readonly [number, number]> = {
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
};

const neighborIndex = (
  game: Minefield,
  index: number,
  delta: readonly [number, number],
): number | null => {
  const row = Math.floor(index / game.columns);
  const column = index % game.columns;
  const nextRow = row + delta[0];
  const nextColumn = column + delta[1];
  if (nextRow < 0 || nextRow >= game.rows || nextColumn < 0 || nextColumn >= game.columns) {
    return null;
  }
  return nextRow * game.columns + nextColumn;
};

export const reduceBoardInput = (
  state: BoardInputState,
  game: Minefield,
  event: BoardInputEvent,
): BoardInputResult => {
  const idle = {
    scheduleLongPressIndex: null as number | null,
    scheduleClearSuppressionIndex: null as number | null,
  };

  if (event.kind === 'longPressFire') {
    return {
      state: {
        ...state,
        longPressIndex: null,
        suppressedClickIndex: event.index,
      },
      intents: [{ type: 'flag', index: event.index }],
      ...idle,
    };
  }

  if (event.kind === 'clearSuppression') {
    if (state.suppressedClickIndex !== event.index) {
      return { state, intents: [], ...idle };
    }
    return {
      state: { ...state, suppressedClickIndex: null },
      intents: [],
      ...idle,
    };
  }

  if (event.kind === 'pointerDown') {
    if (event.pointerType !== 'touch') {
      return { state, intents: [], ...idle };
    }
    return {
      state: { ...state, longPressIndex: event.index },
      intents: [],
      scheduleLongPressIndex: event.index,
      scheduleClearSuppressionIndex: null,
    };
  }

  if (event.kind === 'pointerEnd') {
    if (event.pointerType !== 'touch') {
      return { state, intents: [], ...idle };
    }
    const next: BoardInputState = { ...state, longPressIndex: null };
    if (state.suppressedClickIndex === event.index) {
      return {
        state: next,
        intents: [],
        scheduleLongPressIndex: null,
        scheduleClearSuppressionIndex: event.index,
      };
    }
    return { state: next, intents: [], ...idle };
  }

  if (event.kind === 'click') {
    if (state.suppressedClickIndex === event.index) {
      return {
        state: { ...state, suppressedClickIndex: null },
        intents: [],
        ...idle,
      };
    }
    return {
      state,
      intents: [{ type: 'primary', index: event.index }],
      ...idle,
    };
  }

  if (event.kind === 'contextFlag') {
    return {
      state,
      intents: [{ type: 'flag', index: event.index }],
      ...idle,
    };
  }

  // key
  if (isTerminalStatus(game.status) || game.status === 'paused') {
    return { state, intents: [], ...idle };
  }

  if (event.key.toLowerCase() === 'f') {
    return {
      state,
      intents: [{ type: 'flag', index: event.index }],
      ...idle,
    };
  }

  const delta = movement[event.key];
  if (delta) {
    const nextIndex = neighborIndex(game, event.index, delta);
    if (nextIndex === null) {
      return { state, intents: [], ...idle };
    }
    return {
      state: { ...state, focusedIndex: nextIndex },
      intents: [{ type: 'focus', index: nextIndex }],
      ...idle,
    };
  }

  if (event.key === 'Enter' && game.cells[event.index]?.isRevealed) {
    return {
      state,
      intents: [{ type: 'primary', index: event.index }],
      ...idle,
    };
  }

  return { state, intents: [], ...idle };
};

export const tabIndexFor = (state: BoardInputState, index: number, cellCount: number): number => {
  const maxIndex = Math.max(0, cellCount - 1);
  const focusedIndex = Math.min(state.focusedIndex, maxIndex);
  return index === focusedIndex ? 0 : -1;
};
