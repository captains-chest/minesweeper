import { expect, test, type Page } from '@playwright/test';
import { createMinefield, getNeighborIndices, startGame } from '../src/app/minesweeper/minefield';
import type { Minefield } from '../src/app/minesweeper/models';

/**
 * Math.random is pinned to a constant in the page, which makes mine placement independent of how
 * many times anything else calls it. The same pure rules then tell the test where mines are.
 */
const FIRST = 40;
const PINNED_RANDOM = 0.3; // keep in sync with the init script below
const layout = (): Minefield =>
  startGame(createMinefield('beginner'), FIRST, () => PINNED_RANDOM, 0).minefield;

const cell = (page: Page, index: number) => page.locator(`button[data-index="${index}"]`);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.3;
    localStorage.clear();
  });
  await page.goto('/');
  await expect(cell(page, FIRST)).toBeVisible();
});

test('first click is always safe and opens an area', async ({ page }) => {
  const expected = layout();
  expect(expected.cells[FIRST]!.isMine).toBe(false);
  await cell(page, FIRST).click();
  await expect(cell(page, FIRST)).toHaveClass(/is-revealed/);
  await expect(page.locator('button.is-mine')).toHaveCount(0);
  await expect(page.locator('button.is-revealed')).toHaveCount(expected.revealedCount);
});

test('chording reveals neighbours when flags match the number', async ({ page }) => {
  const field = layout();
  const { rows, columns } = field;
  const target = field.cells.find(
    (c) =>
      c.isRevealed &&
      c.adjacentMines > 0 &&
      getNeighborIndices(c.index, rows, columns).some(
        (n) => !field.cells[n]!.isRevealed && !field.cells[n]!.isMine,
      ),
  );
  expect(target, 'pinned layout should offer a chordable number').toBeDefined();
  const neighbors = getNeighborIndices(target!.index, rows, columns);
  const mines = neighbors.filter((n) => field.cells[n]!.isMine);
  const opened = neighbors.filter((n) => !field.cells[n]!.isRevealed && !field.cells[n]!.isMine);

  await cell(page, FIRST).click();
  await expect(cell(page, target!.index)).toHaveClass(/is-revealed/);
  for (const mine of mines) {
    await cell(page, mine).click({ button: 'right' });
    await expect(cell(page, mine)).toHaveClass(/is-flagged/);
  }
  await cell(page, target!.index).click();
  for (const index of opened) {
    await expect(cell(page, index)).toHaveClass(/is-revealed/);
  }
});

test('revealing every safe tile wins the run', async ({ page }) => {
  const field = layout();
  await cell(page, FIRST).click();
  for (const c of field.cells) {
    if (c.isMine) continue;
    const button = cell(page, c.index);
    if (!(await button.getAttribute('class'))?.includes('is-revealed')) {
      await button.click();
    }
  }
  await expect(page.getByText('Beautiful work. Every safe tile is yours.')).toBeVisible();
});

test('revealing a mine loses the run', async ({ page }) => {
  const mine = layout().cells.find((c) => c.isMine)!;
  await cell(page, FIRST).click();
  await cell(page, mine.index).click();
  await expect(cell(page, mine.index)).toHaveClass(/is-exploded/);
  await expect(page.getByText('The field got you this time. Reset and run it back.')).toBeVisible();
});
