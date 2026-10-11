import { computed, DestroyRef, inject, Service, signal } from '@angular/core';
import { CLOCK } from './clock';
import { DIFFICULTIES } from './constants';
import { STATUS_DETAILS } from './constants';
import {
  chordCell,
  createMinefield,
  getCurrentElapsedSeconds,
  getMinesRemaining,
  getSafeRemaining,
  isTerminalStatus,
  pauseGame,
  resumeGame,
  revealCell,
  toggleFlag,
} from './minefield';
import type { Minefield, RevealResult } from './models';
import { PlayerRecord } from './player-record';
import { formatMines, formatTime } from './format';
import type { DifficultyKey } from './types';

@Service()
export class GameSession {
  readonly #destroyRef = inject(DestroyRef);
  readonly #clock = inject(CLOCK);
  readonly #playerRecord = inject(PlayerRecord);

  readonly #game = signal<Minefield>(createMinefield('beginner'));
  readonly #flagMode = signal(false);
  readonly #announcement = signal('');
  readonly #now = signal(this.#clock.now());
  readonly #resetCount = signal(0);
  readonly #shortcutHelpOpen = signal(false);

  readonly game = this.#game.asReadonly();
  readonly flagMode = this.#flagMode.asReadonly();
  readonly announcement = this.#announcement.asReadonly();
  /** Increments on every reset so views can restore focus to the new board. */
  readonly resetCount = this.#resetCount.asReadonly();
  readonly shortcutHelpOpen = this.#shortcutHelpOpen.asReadonly();

  readonly difficulty = computed(() => this.#game().difficulty);
  readonly status = computed(() => this.#game().status);
  readonly statusDetail = computed(() => STATUS_DETAILS[this.status()]);
  readonly minesRemainingLabel = computed(() => formatMines(getMinesRemaining(this.#game())));
  readonly elapsedLabel = computed(() =>
    formatTime(getCurrentElapsedSeconds(this.#game(), this.#now())),
  );
  readonly safeRemaining = computed(() => getSafeRemaining(this.#game()));
  readonly isWon = computed(() => this.status() === 'won');
  readonly isPaused = computed(() => this.status() === 'paused');
  readonly pauseEnabled = computed(() => this.status() === 'playing' || this.status() === 'paused');
  readonly difficulties = DIFFICULTIES;

  constructor() {
    this.#destroyRef.onDestroy(() => this.#clock.stopTick());
  }

  reset(nextDifficulty: DifficultyKey = this.difficulty()): void {
    this.#clock.stopTick();
    this.#game.set(createMinefield(nextDifficulty));
    this.#flagMode.set(false);
    this.#now.set(this.#clock.now());
    this.#resetCount.update((count) => count + 1);
    this.#announce(`${DIFFICULTIES[nextDifficulty].label} game ready.`);
  }

  setDifficulty(difficulty: DifficultyKey): void {
    this.reset(difficulty);
  }

  toggleShortcutHelp(open: boolean = !this.#shortcutHelpOpen()): void {
    this.#shortcutHelpOpen.set(open);
  }

  toggleFlagMode(): void {
    this.#flagMode.update((flagMode) => !flagMode);
    this.#announce(this.#flagMode() ? 'Flag mode on.' : 'Flag mode off.');
  }

  togglePause(): void {
    const game = this.#game();
    const now = this.#clock.now();
    if (game.status === 'paused') {
      this.#game.set(resumeGame(game, now));
      this.#startTimer();
      this.#announce('Game resumed.');
      return;
    }
    if (game.status === 'playing') {
      this.#game.set(pauseGame(game, now));
      this.#clock.stopTick();
      this.#announce('Game paused.');
    }
  }

  handlePrimaryAction(index: number): void {
    const game = this.#game();
    if (isTerminalStatus(game.status) || game.status === 'paused') {
      return;
    }
    if (this.#flagMode()) {
      this.flag(index);
      return;
    }
    const cell = game.cells[index];
    if (cell?.isRevealed) {
      this.#applyRevealResult(chordCell(game, index, this.#clock.now()));
      return;
    }
    this.reveal(index);
  }

  reveal(index: number): void {
    const game = this.#game();
    if (isTerminalStatus(game.status) || game.status === 'paused') {
      return;
    }
    const result = revealCell(game, index, Math.random, this.#clock.now());
    if (result.minefield === game && result.revealedIndices.length === 0) {
      return;
    }
    this.#applyRevealResult(result, game.status === 'ready');
  }

  flag(index: number): void {
    const game = this.#game();
    const nextGame = toggleFlag(game, index);
    if (nextGame === game) {
      return;
    }
    this.#game.set(nextGame);
    this.#announce(nextGame.cells[index]?.isFlagged ? 'Tile flagged.' : 'Flag removed.');
  }

  #applyRevealResult(result: RevealResult, startedFromReady = false): void {
    const previous = this.#game();
    this.#game.set(result.minefield);

    if (startedFromReady && result.minefield.status === 'playing') {
      this.#playerRecord.recordPlayed(result.minefield.difficulty);
      this.#startTimer();
    } else if (previous.status === 'ready' && result.minefield.status === 'playing') {
      this.#playerRecord.recordPlayed(result.minefield.difficulty);
      this.#startTimer();
    }

    if (result.minefield.status === 'won') {
      this.#finishWon(result.minefield);
      return;
    }
    if (result.minefield.status === 'lost') {
      this.#finishLost(result.minefield.difficulty);
      return;
    }
    if (result.revealedIndices.length > 1) {
      this.#announce(`${result.revealedIndices.length} safe tiles revealed.`);
    }
  }

  #finishWon(game: Minefield): void {
    this.#clock.stopTick();
    const { isNewBest } = this.#playerRecord.recordWin(game.difficulty, game.elapsedSeconds);
    this.#announce(
      isNewBest
        ? `Board cleared in ${formatTime(game.elapsedSeconds)}. New best time.`
        : `Board cleared in ${formatTime(game.elapsedSeconds)}.`,
    );
  }

  #finishLost(difficulty: DifficultyKey): void {
    this.#clock.stopTick();
    this.#playerRecord.recordLoss(difficulty);
    this.#announce('Mine detonated. The board is revealed.');
  }

  #startTimer(): void {
    this.#clock.startTick(() => {
      this.#now.set(this.#clock.now());
    });
  }

  #announce(message: string): void {
    this.#announcement.set(message);
  }
}
