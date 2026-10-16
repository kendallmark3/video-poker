# Intent: Double Up Bonus (Round 3)

## Goal
Add the classic video poker Double Up bonus. After a winning hand, the player can risk the win on a high-card game against the dealer, and can keep doubling or collect. This adds a moment of suspense to every win without changing the poker rules from rounds 1 and 2.

## Inputs / Context
- Source: the round 3 request in conversation.
- Current state:
  - `src/game.js` `draw()` credits the win right away and returns to `phase: 'ready'` with `result: { key, name, win }`. Round 1 tests assert this: "credits the payout after the draw" in `src/game.test.js`.
  - `src/App.jsx` routes buttons and keys through one `actions` object that reads the latest state from `gameRef`, from round 2.
  - Cards are drawn by `Card` and `CardCenter` in `src/App.jsx`.
- **Reconciling "winnings at risk must not be in the credits":** the win is still credited on the draw, so round 1 behavior and tests stay unchanged. Choosing **Double Up** takes the win back out of the credits as the stake. The amount being doubled is therefore never in the credits. **Collect**, or dealing again, simply keeps the win that's already credited.

## Outputs
- **Pure double-up transitions in `src/game.js`:**
  - `startDouble`: only right after a win, or after a successful double.
  - `pickDouble(i)` and `collect`.
  - Only `startDouble` deals cards, so only it takes an injectable random function. Invalid actions return the same state.
- **The Double Up round:**
  - one dealer card face up and four face-down cards
  - the player picks one; aces are high
  - higher doubles the stake, equal returns it, lower loses it
- **After a double:**
  - a win offers Double Up / Collect again
  - a push returns the stake to the credits and offers Double Up / Collect again
  - a loss returns to normal play with nothing won
- **Controls:** Double Up and Collect buttons appear only when they're valid. `D` = Double Up, `C` = Collect, `1`–`4` = pick a card during a double.
- **README:** the Double Up rules and keys.

## Success Criteria
- [x] Double Up is offered only after a win (or a successful double), never after a losing hand or during a hand. Check: unit tests.
- [x] The stake leaves the credits when Double Up starts, and comes back as 2× on a higher card, 1× on a tie, and 0 on a lower card. Aces are high. Check: unit tests with fixed dealer and player cards.
- [x] The player can double repeatedly, and Collect ends the bonus with the current amount kept. Check: unit tests.
- [x] Normal play is blocked during a double (no deal, draw, hold or bet change). Check: unit tests.
- [x] It's playable in the browser with mouse and keys. Check: in headless Chrome, a seeded winning hand, `D`, then a pick with `1`–`4`. The result message and credits update. A screenshot is saved.
- [x] Rounds 1 and 2 still hold. Check: `npm test` (all 47 earlier tests pass unchanged) and `npm run build`.

## Constraints
- No new dependencies. The poker rules and payouts in `src/poker.js` don't change.
- Existing tests are not edited.

## Out of Scope
- Sound, statistics, and saving progress (later rounds).

## Delta
- **`src/game.js`:**
  - Add `double: null` to `newGame()`, and reset it in `deal()`.
  - New `canDouble(s)`: `phase === 'ready'`, `result.win > 0`, and not yet collected.
  - New `startDouble(s, rng)`:
    - takes the stake (`result.win`) out of the credits
    - deals the dealer card plus 4 choices from a fresh shuffled deck
    - sets `phase: 'double'`
  - New `pickDouble(s, i)`: compares ranks (aces high). It credits 2× / 1× / 0, sets `phase: 'ready'` and `result = { key: null, name, win, double: 'win'|'push'|'lose' }`, and keeps `double` (with `pick` and `outcome`) so the reveal stays on screen.
  - New `collect(s)`: marks the result collected and clears `double`.
  - The existing guards already block `deal`, `draw`, `toggleHold`, `setBet` and `startOver` during `phase: 'double'`, because they require `ready`/`holding`. This follows the guard pattern at `src/game.js` `setBet` and `deal`.
- **`src/game.test.js`:** new `describe` blocks only. Existing tests are untouched. Written first and seen failing.
- **`src/App.jsx`:**
  - The hand area shows the dealer card plus 4 choices while a double is active or just revealed.
  - `Card` gains a `faceDown` option and a top label ("DEALER" / "YOUR PICK"), in place of HELD.
  - `actions` gains `double`, `collect` and `pick(i)`, using the same `gameRef` and functional-update pattern as round 2.
  - The key handler gains `d`, `c`, and `1`–`4` routing to `pick` during a double.
  - The Double Up and Collect buttons appear only when `canDouble`.
  - The message covers the double states.
- **Folded in from check-plan:**
  - The state shape is `double: { stake, dealer, choices, pick, outcome }`. `result` stays unchanged during `phase: 'double'`, so the Win meter shows the stake, labelled "At risk".
  - `dealDraw` returns early during a double, so the hand number never moves.
  - During a double the dealer slot shows no key hint, and the choices show `1`–`4`. Number keys go to `pick` in a double and to `hold` otherwise.
  - Bet and Deal buttons are disabled during a double.
  - New tests go in a second `import` line, leaving the existing import untouched.
  - The clickable face-down card gets its own pointer, hover and focus rules.
  - The paytable highlight clears after a double, because the double result has `key: null`. This is intended.
- **`src/App.css`:** a face-down clickable card and the label variant. Reuses `.card.back` and `.held-badge`.
- **`README.md`:** a Double Up section.
- **Unchanged:** `src/poker.js`, `src/cards.js`, and all existing tests.

## Evidence

| Criterion | Check run | Result |
|---|---|---|
| Offered only after a win | `npm test` ("double up: when it is offered", 3 tests) | Passes. Two of them (the "does nothing" checks) passed against stubs by design, and one failed first. |
| Stake leaves credits; 2× / 1× / 0; aces high | `npm test` ("stake and payouts", 6 tests, with fixed dealer and choice cards) | Seen failing against stubs, then passing. 105 → 95 on start; higher → 115; tie → 105; lower → 95; A beats K, K loses to A. |
| Double again, and Collect | `npm test` ("again and collect", 3 tests) | Passes. Stake 20 on the second double; collect keeps the credits and ends the offer; a new deal clears the double. |
| Normal play blocked during a double | `npm test` ("normal play is blocked") | Passes. This was already guaranteed by the existing phase guards, as check-plan confirmed. |
| Playable with mouse and keys | Headless Chrome, seed 214: `M`, hold all, `Space`, `D`, `1` | "Two Pair — win 10 · Double Up?" with Double Up / Collect / Deal buttons. After `D`: credits 95, At risk 10, 4 face-down cards hinted 1–4, Deal disabled. After `1`: "Double Up lost", credits 95, normal buttons back (`screenshots/r3-offer.png`, `r3-double.png`, `r3-reveal.png`). |
| Rounds 1 and 2 hold | `npm test`; `npm run build` | 60/60 tests pass. The 47 earlier tests are unchanged and pass. The build passes. |

check-plan findings, all folded in before coding:
- Space during a double no longer bumps the hand number.
- The key hints are renumbered 1–4 for the picks.
- The shape of the `double` state is pinned down.
- Bet and Deal are disabled during a double.
- New tests use a separate import line, so the existing tests are untouched.
- The clickable face-down card has its own styles.

## Stop
Done when every success criterion is shown satisfied in Evidence and the repository's checks pass.
Bail out and report if meeting the request requires changing round 1's tested crediting behavior.
