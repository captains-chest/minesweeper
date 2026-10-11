# Minesweeper

Single-player minefield clearing: a live run on a board, plus the player's lasting record and preferences.

## Language

**Cell**:
One tile on the minefield. May hide a mine, carry an adjacent-mine count, and be revealed or flagged.
_Avoid_: Tile (in code/types), square

**Minefield**:
The board for one run: dimensions, mine placement, flags, reveals, and run status. In code: the `Minefield` type and `createMinefield` transitions in the minefield module.
_Avoid_: GameState, board state as a second domain name; grid; `functions` as the module name for rules

**Run** / **Game session**:
One attempt on a minefield at a chosen difficulty, from ready through playing/paused to won or lost.
_Avoid_: Game (alone), match, playthrough

**Reveal** / **Chord**:
Primary clear of a cell; chord clears neighbors when flags match the adjacent count.
_Avoid_: Click, open, expand (for the rule itself)

**Player record**:
Lasting outcomes for the player: best times and run counts (played / wins / losses) per difficulty.
_Avoid_: Stats bag, leaderboard, save data

**Theme preference**:
The player's chosen light/dark chrome; not part of a run. Held with the player record as lasting preference, not as run state.
_Avoid_: Mode (alone), appearance as a run concern

## Relationships

- **Game session → Player record**: when a run ends (or starts counting as played), the session records outcomes via intent methods on the player record (`recordPlayed` / `recordWin` / `recordLoss`). The UI does not coordinate that handoff. The session does not manipulate storage maps or keys.
- **Best time**: a win replaces the stored best only when the new elapsed time is strictly less than the previous best (ties keep the old best). `recordWin` returns whether a new best was set and the best time after the write so the session can announce.
- **Played count**: increments once when a run first leaves ready into playing, not on every reset.
- **Persistence**: player record updates in-memory state even if storage write fails; durability is best-effort.
- **Game session → Clock**: the session reads "now" and tick scheduling from a clock; it does not own platform timers directly. The clock is not part of the minefield rules.
- **Player record → store / theme surface**: persistence and applying theme to the chrome sit behind adapters; the player record exposes prefs and history, not `localStorage` details.
- **Screen labels**: run-facing labels and live-region announcements belong to the game session; cell face (label/classes/glyph) belongs with the cell view. There is no separate presentation bag as a domain concept.
- **Minefield rules**: pure transitions over minefield state (create, reveal, flag, chord, pause, resume, elapsed). The game session applies those transitions; it does not re-implement seeding or flood fill.
