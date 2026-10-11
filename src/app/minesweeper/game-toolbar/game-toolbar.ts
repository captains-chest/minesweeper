import { Component, input, output } from '@angular/core';
import type { Difficulty } from '../models';
import type { DifficultyKey } from '../types';

@Component({
  selector: 'mine-game-toolbar',
  templateUrl: './game-toolbar.html',
  styleUrl: './game-toolbar.css',
})
export class GameToolbar {
  readonly difficulty = input.required<DifficultyKey>();
  readonly difficultyEntries =
    input.required<ReadonlyArray<readonly [DifficultyKey, Difficulty]>>();

  readonly difficultyChange = output<DifficultyKey>();
  readonly newGame = output<void>();

  protected formatSize(rows: number, columns: number): string {
    return `${String(columns).padStart(2, '0')} × ${String(rows).padStart(2, '0')}`;
  }

  protected onDifficulty(key: DifficultyKey): void {
    this.difficultyChange.emit(key);
  }

  protected onNewGame(): void {
    this.newGame.emit();
  }
}
