import { Component, computed, inject } from '@angular/core';
import { DIFFICULTIES } from '../constants';
import { GameCard } from '../game-card/game-card';
import { GameSession } from '../game-session';
import { GameToolbar } from '../game-toolbar/game-toolbar';
import { InfoColumn } from '../info-column/info-column';
import { PlayerRecord } from '../player-record';
import { ShortcutsHelp } from '../shortcuts-help/shortcuts-help';
import type { DifficultyKey } from '../types';

@Component({
  selector: 'mine-game-layout',
  imports: [GameToolbar, GameCard, InfoColumn, ShortcutsHelp],
  templateUrl: './game-layout.html',
  styleUrl: './game-layout.css',
})
export class GameLayout {
  protected readonly session = inject(GameSession);
  protected readonly playerRecord = inject(PlayerRecord);
  protected readonly difficultyEntries = Object.entries(DIFFICULTIES) as [
    DifficultyKey,
    (typeof DIFFICULTIES)[DifficultyKey],
  ][];

  protected readonly bestTimeLabel = computed(() =>
    this.playerRecord.bestTimeLabel(this.session.difficulty()),
  );
  protected readonly bestCopy = computed(() =>
    this.playerRecord.bestCopy(this.session.difficulty()),
  );
  protected readonly bestMeterPercent = computed(() =>
    this.playerRecord.bestMeterPercent(this.session.difficulty()),
  );
  protected readonly runStats = computed(() =>
    this.playerRecord.runStatsFor(this.session.difficulty()),
  );

  protected setDifficulty(difficulty: DifficultyKey): void {
    this.session.setDifficulty(difficulty);
  }
}
