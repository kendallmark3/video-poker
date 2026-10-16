# Intent: Save Progress and Mobile-Ready (Round 5, final)

## Goal
Make the machine something a player can come back to and play anywhere. Credits, bet and session stats survive a reload, and saved data is never trusted blindly. The game looks right and plays fully by touch on a phone.

## Inputs / Context
- Source: the round 5 request in conversation.
- Current state:
  - Game state is pure: `src/game.js` covers `newGame`, `deal`, `draw`, `startDouble`, `pickDouble`, `collect` and `startOver`, plus `stats`.
  - `deal` takes the bet out of the credits. `startDouble` takes the stake out.
  - `src/App.jsx` holds the state in `useState(newGame)`.
  - Layout: `src/App.css` has breakpoints at 520px, 640px and 900px, but the game has never been checked at phone width.
- **No refunds on reload:** the save always reflects the credits as they stand. Because the bet (or the Double Up stake) has already left the credits, a mid-hand or mid-double reload restores a ready-to-deal machine without refunding them. This is like walking away from a real machine mid-hand.

## Outputs
- **A pure `src/storage.js`:**
  - `toSave(state)` keeps only `credits`, `bet` and `stats`, plus a `version`.
  - `fromSave(raw)` returns a ready-to-deal game state, or `null` if anything is invalid. Valid means:
    - `credits` is a non-negative integer and `bet` is an integer from 1 to 5
    - every stats field is a non-negative integer, except `won`, which can go negative after a lost Double Up
    - `best` is a paytable key or `null`
    - `version` matches
  - `loadGame(storage)` and `saveGame(storage, state)` take an injectable storage and never throw.
- **`App` wiring:**
  - It starts from the saved game (or a new one).
  - It saves after every state change.
  - A **Reset Session** control, with a confirm, clears the save and starts fresh.
- **A phone layout at 390px** with no horizontal scroll and touch targets of at least 44px. Every control is reachable without a keyboard.

## Success Criteria
- [x] **A save round-trips.** Check: unit tests. A saved state reloads with the same credits, bet and stats, in phase `ready` with no hand.
- [x] **Corrupt or tampered saves are rejected.** Check: unit tests with bad JSON, a wrong version, a negative or fractional credit, a bet of 0 or 9, a string where a number is expected, an unknown `best`, and a missing field. Each falls back to a new game, and nothing throws.
- [x] **No refund mid-hand or mid-double.** Check: unit tests. Save a game after `deal` (and after `startDouble`), then reload. The credits equal the post-bet (post-stake) credits.
- [x] **It survives a real reload.** Check: in headless Chrome, play a hand, reload the page, and confirm the credits and stats match what was shown before.
- [x] **Reset Session clears progress.** Check: in headless Chrome, Reset (confirm accepted). Credits 100, stats zeroed, and that's still true after a reload.
- [x] **Phone-ready at 390px.** Check: in headless Chrome at 390×844 (mobile), `document.documentElement.scrollWidth <= 390`, every button and card is at least 44px in both directions, and a hand is played by tapping. A screenshot is saved.
- [x] **Earlier rounds hold.** Check: `npm test` (all 70 earlier tests pass unchanged) and `npm run build`.

## Constraints
- No new dependencies. Browser `localStorage` only.
- Rules, payouts and earlier tests don't change.
- Storage errors (blocked, full, private mode) never break the game. It simply plays without saving.

## Out of Scope
- Accounts, a server, or syncing between devices.
- Saving the sound setting (sound starts off by design, from round 4).

## Delta
- **`src/storage.js` (new, pure):**
  - Uses the key `videopoker.save` and `version: 1`.
  - `toSave(state)` and `fromSave(raw)` handle the format, with strict validation. The paytable keys are imported from `src/poker.js`.
  - `loadGame(storage)` and `saveGame(storage, state)` wrap the storage in try/catch, and the storage is injectable.
  - A fresh game comes from `newGame()` in `src/game.js`, the same constructor that `startOver` uses.
- **`src/storage.test.js` (new):** round-trip, rejection, no-refund and never-throws cases, using an in-memory fake storage. Written first and seen failing.
- **`src/App.jsx`:**
  - The game state is initialized lazily as `useState(() => loadGame(storage))`.
  - `useEffect([game])` calls `saveGame`, next to the existing sound effect, which also reacts to `[game]`.
  - `resetSession` is added to `actions`. It confirms with `window.confirm`, clears the save, and starts a new game.
  - A Reset Session button is added in the stats panel.
  - `storage` is read once through a guarded accessor, because `localStorage` itself can throw.
- **Folded in from check-plan (verdict: FIX FIRST):**
  - **Blocker fixed at the root.** The round-4 sound effect in `src/App.jsx` now null-guards `game.result`. Before this, Reset mid-hand or mid-double would have thrown inside the effect and unmounted the app. Reset stays allowed in any phase.
  - When saving during a double, `toSave` subtracts `double.stake` from `stats.won`, so a reload doesn't overstate the return %. There is a test for this.
  - Reset Session sits below the stats `<dl>`, not inside it, and `Stats` gets an `onReset` prop.
  - The ≤520px pass covers `.sound-toggle` and overrides `.btn.primary`'s min-width.
  - `fromSave` uses `MAX_BET`.
  - `clearSave` is cut: the save effect overwrites the slot right after reset.
  - The tighter paytable is added only if the 390px `scrollWidth` check fails. The meters already stack.
- **`src/App.css`:**
  - The phone pass at ≤520px (an existing breakpoint): 44px minimum touch targets, a tighter paytable, and stacked meters.
  - The Reset button style.
- **`README.md`:** saving and reset notes.
- **Unchanged:** `src/game.js`, `src/poker.js`, `src/cards.js`, `src/sound.js`, and all existing tests.
- **New dependencies:** none.

## Evidence

| Criterion | Check run | Result |
|---|---|---|
| A save round-trips | `npm test` (`src/storage.test.js`, "save and load") | Credits, bet and stats are restored. Phase is `ready`, with no hand and no result. |
| Corrupt or tampered saves rejected | `npm test` (11 rejection cases, plus negative `won` accepted) | Bad JSON, wrong version, negative / fractional / huge / string credits, bet 0 or 9, unknown best hand, missing field, and `null` all give a fresh 100-credit game. Nothing throws. |
| No refund mid-hand or mid-double | `npm test` ("no refunds on reload"); headless Chrome reload mid-hand | Unit tests: credits 95 after a mid-hand reload; credits 95 and `won` 0 after a mid-double reload. Browser: reload mid-hand gives credits 95 and the button reads Deal. |
| Survives a real reload | Headless Chrome: play a hand, `Page.reload` | Before: credits 95, stats `1/5/0/0.0%/—/0`. After: identical. The saved JSON was checked in `localStorage`. |
| Reset Session clears progress | Headless Chrome: Reset mid-hand (confirm accepted), then reload | The app stayed mounted. Credits 100, stats zeroed, and still 100 / 0 hands after the reload. |
| Phone-ready at 390px | Headless Chrome 390×844, mobile and touch emulation, played with touch taps only | `scrollWidth` 390. No button or card under 44px (`small: []`). Bet Max, two hold taps and Draw completed a hand (`screenshots/r5-mobile-held.png`, `r5-mobile-result.png`). |
| Earlier rounds hold | `npm test`; `npm run build` | 88/88 tests pass. The 70 earlier tests are unchanged and pass. The build passes. |

The storage tests were seen failing first: 18 of 18 against a stub, then passing.

check-plan returned FIX FIRST, and every finding was folded in before coding:
- **Blocker:** Reset mid-hand would have crashed the app through the round-4 sound effect reading `result.win` on a null result. It's fixed at the root with a null guard, and the browser check proved Reset mid-hand works.
- The `won` correction for a mid-double save.
- Reset placed outside the stats `<dl>`.
- 44px Sound and Reset targets on phones.
- `MAX_BET` reused.
- `clearSave` cut.

Screenshot review: "Click cards to hold" was changed to "Hold the cards you want, then Draw", which reads right for touch, mouse and keys.

## Stop
Done when every success criterion is shown satisfied in Evidence and the repository's checks pass.
Bail out and report if the save can't be made safe without a server.
