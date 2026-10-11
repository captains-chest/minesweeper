import { Component, computed, input, output } from '@angular/core';
import type { Cell as CellModel } from '../models';
import type { GameStatus } from '../types';
import { getCellClasses, getCellDisplay, getCellLabel } from './cell-view';

@Component({
  selector: 'mine-cell',
  templateUrl: './cell.html',
  styleUrl: './cell.css',
})
export class Cell {
  readonly cell = input.required<CellModel>();
  readonly columns = input.required<number>();
  readonly explodedIndex = input<number | undefined>(undefined);
  readonly status = input.required<GameStatus>();
  readonly tabIndex = input(-1);

  readonly primaryAction = output<number>();
  readonly flagAction = output<number>();
  readonly keydown = output<KeyboardEvent>();
  readonly pointerDown = output<PointerEvent>();
  readonly pointerUp = output<PointerEvent>();
  readonly pointerCancel = output<PointerEvent>();

  readonly row = computed(() => Math.floor(this.cell().index / this.columns()) + 1);
  readonly column = computed(() => (this.cell().index % this.columns()) + 1);
  readonly label = computed(() =>
    getCellLabel(this.cell(), this.explodedIndex(), this.columns(), this.status()),
  );
  readonly classList = computed(() =>
    getCellClasses(this.cell(), this.explodedIndex(), this.status()).join(' '),
  );
  readonly display = computed(() => getCellDisplay(this.cell(), this.explodedIndex()));

  protected onPrimaryAction(): void {
    this.primaryAction.emit(this.cell().index);
  }

  protected onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.flagAction.emit(this.cell().index);
  }

  protected onKeydown(event: KeyboardEvent): void {
    this.keydown.emit(event);
  }

  protected onPointerDown(event: PointerEvent): void {
    this.pointerDown.emit(event);
  }

  protected onPointerUp(event: PointerEvent): void {
    this.pointerUp.emit(event);
  }

  protected onPointerCancel(event: PointerEvent): void {
    this.pointerCancel.emit(event);
  }
}
