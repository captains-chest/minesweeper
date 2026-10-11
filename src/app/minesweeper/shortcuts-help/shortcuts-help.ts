import { Component, input, output } from '@angular/core';
import { GLOBAL_KEYSHORTCUTS, SHORTCUT_HELP } from '../shortcuts';

@Component({
  selector: 'mine-shortcuts-help',
  templateUrl: './shortcuts-help.html',
  styleUrl: './shortcuts-help.css',
})
export class ShortcutsHelp {
  readonly open = input(false);
  readonly openChange = output<boolean>();

  protected readonly shortcuts = SHORTCUT_HELP;
  protected readonly keyshortcuts = GLOBAL_KEYSHORTCUTS;

  protected onToggle(event: Event): void {
    const isOpen = (event.target as HTMLDetailsElement).open;
    if (isOpen !== this.open()) {
      this.openChange.emit(isOpen);
    }
  }
}
