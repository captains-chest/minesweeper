import { describe, expect, it } from 'vitest';
import { createMinefield } from '../minefield';
import { initialBoardInputState, reduceBoardInput, tabIndexFor } from './board-input';

describe('board input policy', () => {
  it('emits primary on click when not suppressed', () => {
    const game = createMinefield('beginner');
    const result = reduceBoardInput(initialBoardInputState(), game, {
      kind: 'click',
      index: 3,
    });
    expect(result.intents).toEqual([{ type: 'primary', index: 3 }]);
  });

  it('suppresses the click after long-press fire', () => {
    const game = createMinefield('beginner');
    let state = initialBoardInputState();
    const down = reduceBoardInput(state, game, {
      kind: 'pointerDown',
      index: 2,
      pointerType: 'touch',
    });
    expect(down.scheduleLongPressIndex).toBe(2);
    state = down.state;
    const fire = reduceBoardInput(state, game, { kind: 'longPressFire', index: 2 });
    expect(fire.intents).toEqual([{ type: 'flag', index: 2 }]);
    state = fire.state;
    const click = reduceBoardInput(state, game, { kind: 'click', index: 2 });
    expect(click.intents).toEqual([]);
  });

  it('moves focus with arrows and flags with f', () => {
    const game = createMinefield('beginner');
    const right = reduceBoardInput(initialBoardInputState(0), game, {
      kind: 'key',
      index: 0,
      key: 'ArrowRight',
    });
    expect(right.intents).toEqual([{ type: 'focus', index: 1 }]);
    expect(right.state.focusedIndex).toBe(1);

    const flag = reduceBoardInput(right.state, game, {
      kind: 'key',
      index: 1,
      key: 'f',
    });
    expect(flag.intents).toEqual([{ type: 'flag', index: 1 }]);
  });

  it('computes roving tabindex', () => {
    const state = initialBoardInputState(4);
    expect(tabIndexFor(state, 4, 81)).toBe(0);
    expect(tabIndexFor(state, 3, 81)).toBe(-1);
  });
});
