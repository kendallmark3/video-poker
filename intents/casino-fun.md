# Intent: Casino Atmosphere and Win Celebrations (Round 7)

## Goal
The game currently sits on a plain dark background and feels flat. Make it feel like playing in a lively casino: a casino floor with lights and machines around the player, a marquee-lit machine, and a celebration when they win, so it's fun to keep playing.

## Inputs / Context
- Source: the request in conversation ("put a background in… make it look like she's in a casino and having fun… it's kind of boring right now").
- Current state:
  - `src/App.css` `body` is a dark radial gradient.
  - `.machine` is the Carl's Poker Game cabinet from round 6.
  - Wins show a message, a paytable highlight and a count-up (round 2).
  - Rules, tests (88) and layouts (wide two-column and 390px phone) are established.
- Earlier rounds set the constraint: no image files and no new dependencies. Everything is drawn with CSS and inline SVG.

## Outputs
- **A casino background behind the machine:**
  - a patterned casino carpet
  - glowing, softly twinkling out-of-focus casino lights in gold, magenta and teal
  - a row of slot-machine silhouettes with glowing screens along the floor
- **Marquee lights:** chasing bulbs around the cabinet.
- **A win celebration:** gold coins rain down after a win.
  - Its size scales with the win: small for jacks or better, bigger for a full house, biggest for four of a kind and up.
  - It also fires on a winning Double Up.
  - Losses and pushes stay quiet.
- **Reduced motion:** with `prefers-reduced-motion`, the background is still and there's no coin rain.

## Success Criteria
- [x] **Celebration size is right.** Check: unit tests for a pure `celebration(result, bet)`. It returns 0 for no win or a push; small, medium or large by payout tier; and medium or above for a winning Double Up.
- [x] **The casino background is visible behind the machine on wide and phone screens.** Check: a screenshot at 1600×1000 and 390×844. The background layer exists and is behind the machine (`z-index`), and it doesn't catch clicks (`pointer-events: none`).
- [x] **Coins rain on a win and not on a loss.** Check: in headless Chrome with a seeded winning hand, coin elements appear after the draw and are gone within 4 s. After a losing hand, none appear.
- [x] **Nothing breaks.** Check:
  - `npm test` (all 88 earlier tests pass unchanged)
  - `npm run build`
  - 390px `scrollWidth` stays 390
  - every button is still at least 44px
  - a hand still plays by keyboard and by tap
- [x] **Reduced motion is respected.** Check: in headless Chrome with reduced motion emulated, no coins render after a win.

## Constraints
- No image files and no new dependencies.
- Rules, payouts and earlier tests don't change.
- Decoration never blocks input, and never pushes the machine off-screen or adds a sideways scroll.

## Delta
- **`src/celebrate.js` (new, pure):** `celebration(result, bet)` returns 0–3. The tiers:
  - jacks or better, two pair and three of a kind: 1
  - straight, flush and full house: 2
  - four of a kind, straight flush and royal flush: 3
  - Double Up win: 2, or 3 if `win ≥ 25×bet`
  - push, loss or no win: 0
- **`src/celebrate.test.js` (new):** written first and seen failing.
- **`src/Casino.jsx` (new):**
  - `CasinoBackdrop`: fixed, `aria-hidden`, `pointer-events: none`. It holds the casino lights plus an inline-SVG row of slot machines.
  - `CoinShower({ level, onDone })`: coin count by level (16 / 34 / 64), and it removes itself after its animation (≤3.5 s).
  - Positions come from the coin's index (golden-ratio spacing), **not `Math.random`**. That keeps the seeded `Math.random` that deals the browser-check hands untouched.
- **`src/App.jsx`:**
  - Renders `<CasinoBackdrop />`.
  - The existing `[game]` transition effect also computes `celebration(...)` when a draw or pick settles, and sets a `burst` state. It is skipped when `prefersReducedMotion()` is true; that helper already exists from round 2.
  - Renders `<CoinShower>` while `burst` is set.
- **`src/App.css`:**
  - `body` becomes a casino carpet (layered CSS gradients).
  - Backdrop and coin styles.
  - A `.machine::before` marquee of chasing bulbs.
  - `#root` is stacked above the backdrop.
  - The reduced-motion rules are extended.
- **Folded in from check-plan (READY):**
  - `CoinShower` is also `pointer-events: none`.
  - Stacking: `App` returns a fragment. The backdrop is fixed at `z-index: 0`, `.machine` is at `z-index: 1` (it's already `position: relative`), and the coins are fixed at `z-index: 2`.
  - `burst` carries an increasing id, used as `CoinShower`'s `key`, so a quick second win restarts the shower.
  - The celebration is computed in its own branch covering both the draw and the pick, each guarded on `result`.
  - `celebration` checks `result.double` before `win`.
  - Jacks or Better keeps tier 1 on purpose: it's shown as a win ("Jacks or Better — win 5"), and only a Double Up push is a push.
  - Marquee bulbs are drawn inside the cabinet's border box, so there's no overflow on phones.
- **Unchanged:** rules, game, storage, sound and all existing tests.
- **New dependencies:** none.

## Evidence

| Criterion | Check run | Result |
|---|---|---|
| Celebration size is right | `npm test` (`src/celebrate.test.js`, 12 tests) | Seen failing against a stub (12 of 12), then passing. 0 for none, push or loss; tiers 1/2/3 by hand; Double Up win is 2, or 3 at 25×bet. |
| Casino background visible, behind, doesn't catch clicks | Headless Chrome computed styles; `screenshots/r7-win.png`, `r7-wide.png`, `r7-phone.png` | Backdrop `z-index` 0 and `pointer-events: none`; machine `z-index` 1; 28 lights plus the slot-machine row render. Carpet, lights, slots and marquee are visible at 1600 and 390. |
| Coins on a win, not on a loss | Headless Chrome: seeded two-pair win; then random hands until a loss | Win: 16 coins (tier 1), the shower is `pointer-events: none`, and 0 coins remain 3.5 s later. Loss (hand 2): 0 coins right after and 0 later. |
| Nothing breaks | `npm test`; `npm run build`; 390×844 tap play; keyboard regression | 100/100 tests pass (the 88 earlier tests unchanged). Build passes. Phone `scrollWidth` 390, no button under 44px, a hand played by tap. Keyboard check: `sameNode [true,false,true,false,false]`. |
| Reduced motion respected | Headless Chrome with emulated `prefers-reduced-motion: reduce`, seeded win | `reduced: true`, "Two Pair — win 10", 0 coins. |

Found during implementation and fixed:
- **Coin shower timer:** `CoinShower`'s timer depended on an inline `onDone` that changes on every re-render, and the count-up re-renders it constantly. The timer kept restarting. It now reads the callback through a ref and starts once.
- **Measurement timing:** the first phone measurement caught cards mid-flip (30px and 21px wide). Re-measured after the animation settled, nothing was under 44px. This was a fault in the checking tool, not the layout.
- **White strip on long pages:** the page could show white below the machine. `html` now has the base carpet color.

## Stop
Done when every success criterion is shown satisfied in Evidence and the repository's checks pass.
