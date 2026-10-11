import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  untracked,
} from '@angular/core';
import { Cell } from '../cell/cell';
import { GameSession } from '../game-session';
import {
  BOARD_KEYS,
  clickSuppressionResetMs,
  initialBoardInputState,
  longPressMs,
  reduceBoardInput,
  tabIndexFor,
  type BoardInputState,
  type BoardIntent,
} from './board-input';

@Component({
  selector: 'mine-board',
  imports: [Cell],
  templateUrl: './board.html',
  styleUrl: './board.css',
  host: {
    role: 'grid',
    '[attr.aria-label]': '"Minesweeper board"',
    '[attr.aria-describedby]': '"board-hint"',
    '[attr.aria-rowcount]': 'session.game().rows',
    '[attr.aria-colcount]': 'session.game().columns',
    '[style.grid-template-columns]': '"repeat(" + session.game().columns + ", 30px)"',
  },
})
export class Board {
  protected readonly session = inject(GameSession);
  readonly #host = inject(ElementRef<HTMLElement>);

  readonly #input = signal(initialBoardInputState());
  readonly #injector = inject(Injector);
  #longPressTimerId: number | null = null;
  #suppressionTimerId: number | null = null;

  constructor() {
    // After a reset (restart or level switch), put keyboard focus back on the board.
    let seenResets = this.session.resetCount();
    effect(() => {
      const resets = this.session.resetCount();
      if (resets === seenResets) {
        return;
      }
      seenResets = resets;
      untracked(() => {
        const cellCount = this.session.game().cells.length;
        const index = Math.min(this.#input().focusedIndex, cellCount - 1);
        afterNextRender(() => this.#focusCell(index), { injector: this.#injector });
      });
    });
  }

  protected onPrimaryAction(index: number): void {
    this.#dispatch({ kind: 'click', index });
  }

  protected onFlag(index: number): void {
    this.#dispatch({ kind: 'contextFlag', index });
  }

  protected onPointerDown(event: PointerEvent, index: number): void {
    this.#dispatch({ kind: 'pointerDown', index, pointerType: event.pointerType });
  }

  protected onPointerEnd(event: PointerEvent, index: number): void {
    this.#dispatch({ kind: 'pointerEnd', index, pointerType: event.pointerType });
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    if (event.altKey || event.metaKey) {
      return;
    }
    if (BOARD_KEYS.has(event.key)) {
      event.preventDefault();
    }
    this.#dispatch({ kind: 'key', index, key: event.key, ctrlKey: event.ctrlKey });
  }

  protected tabIndexFor(index: number): number {
    return tabIndexFor(this.#input(), index, this.session.game().cells.length);
  }

  #dispatch(
    event:
      | { kind: 'click'; index: number }
      | { kind: 'contextFlag'; index: number }
      | { kind: 'key'; index: number; key: string; ctrlKey: boolean }
      | { kind: 'pointerDown'; index: number; pointerType: string }
      | { kind: 'pointerEnd'; index: number; pointerType: string },
  ): void {
    const result = reduceBoardInput(this.#input(), this.session.game(), event);
    this.#input.set(result.state);
    this.#applySchedules(result.scheduleLongPressIndex, result.scheduleClearSuppressionIndex);
    for (const intent of result.intents) {
      this.#applyIntent(intent);
    }
  }

  #applySchedules(longPressIndex: number | null, clearSuppressionIndex: number | null): void {
    this.#clearLongPressTimer();
    if (longPressIndex !== null) {
      this.#longPressTimerId = window.setTimeout(() => {
        this.#longPressTimerId = null;
        const result = reduceBoardInput(this.#input(), this.session.game(), {
          kind: 'longPressFire',
          index: longPressIndex,
        });
        this.#input.set(result.state);
        for (const intent of result.intents) {
          this.#applyIntent(intent);
        }
      }, longPressMs);
    }

    if (clearSuppressionIndex !== null) {
      if (this.#suppressionTimerId !== null) {
        window.clearTimeout(this.#suppressionTimerId);
      }
      this.#suppressionTimerId = window.setTimeout(() => {
        this.#suppressionTimerId = null;
        const result = reduceBoardInput(this.#input(), this.session.game(), {
          kind: 'clearSuppression',
          index: clearSuppressionIndex,
        });
        this.#input.set(result.state);
      }, clickSuppressionResetMs);
    }
  }

  #applyIntent(intent: BoardIntent): void {
    if (intent.type === 'primary') {
      this.session.handlePrimaryAction(intent.index);
      return;
    }
    if (intent.type === 'flag') {
      this.session.flag(intent.index);
      return;
    }
    this.#focusCell(intent.index);
  }

  #focusCell(index: number): void {
    this.#input.update((state: BoardInputState) => ({ ...state, focusedIndex: index }));
    const target = this.#host.nativeElement.querySelector(
      `[data-index="${index}"]`,
    ) as HTMLElement | null;
    target?.focus({ preventScroll: true });
  }

  #clearLongPressTimer(): void {
    if (this.#longPressTimerId === null) {
      return;
    }
    window.clearTimeout(this.#longPressTimerId);
    this.#longPressTimerId = null;
  }
}
