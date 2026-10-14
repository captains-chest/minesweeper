import { Component, inject } from '@angular/core';
import { GameLayout } from './game-layout/game-layout';
import { GameSession } from './game-session';
import { Hero } from './hero/hero';
import { LiveRegion } from './live-region/live-region';
import { PlayerRecord } from './player-record';
import { shortcutFor } from './shortcuts';
import { SiteFooter } from './site-footer/site-footer';
import { Topbar } from './topbar/topbar';

@Component({
  selector: 'mine-minesweeper',
  imports: [Topbar, Hero, GameLayout, SiteFooter, LiveRegion],
  templateUrl: './minesweeper.html',
  styleUrl: './minesweeper.css',
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class Minesweeper {
  protected readonly session = inject(GameSession);
  protected readonly playerRecord = inject(PlayerRecord);

  protected onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.repeat) {
      return;
    }
    const target = event.target as HTMLElement | null;
    const command = shortcutFor({
      key: event.key,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
      fromEditable:
        !!target &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)),
    });
    if (!command) {
      return;
    }
    event.preventDefault();
    switch (command.type) {
      case 'restart':
        this.session.reset();
        return;
      case 'pause':
        this.session.togglePause();
        return;
      case 'help':
        this.session.toggleShortcutHelp();
        return;
      case 'difficulty':
        this.session.setDifficulty(command.difficulty);
        return;
    }
  }
}
