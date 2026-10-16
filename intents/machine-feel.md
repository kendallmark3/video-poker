# Intent: Make Video Poker Feel Like a Real Machine (Round 2)

## Goal
Make the game feel like a real video poker machine. Players should be able to play quickly from the keyboard, cards should look like real playing cards, held cards should stay still on the draw, and wins should count up into the credits meter. This builds on round 1 (`intents/videopoker.md`) without changing its rules.

## Inputs / Context
- Source: the round 2 request in conversation.
- Current state:
  - `src/App.jsx` renders the machine.
  - Every card is drawn the same way: corner indices plus one big suit symbol (`Card`, `.pip`).
  - Held cards already keep their DOM node on the draw: `dealKey` is `${handNo}-${card}` and `handNo` only increases on a deal (`src/App.jsx:123`), so only replaced cards remount. The criterion is kept as a regression check. (Corrected after check-plan.)
  - Credits update instantly.
- Rules and state live in `src/poker.js` and `src/game.js` (pure functions) and are covered by 33 tests in `src/*.test.js`.
- Validation: `npm test`, `npm run build`, and headless Chrome screenshots in `screenshots/`.

## Outputs
- **Keyboard controls:**
  - keys `1`–`5` toggle hold on that card
  - `Space` or `Enter` deals or draws
  - `B` is Bet One, `M` is Bet Max
  - The keys are shown on screen as small hints.
- **Real card faces:**
  - number cards 2–10 show the standard pip arrangement
  - J, Q and K show a framed court panel with the rank and suit
  - the ace shows one large center pip
- **Draw animation:** only the replaced cards animate in. Held cards don't move or re-render.
- **Win count-up:** after a win, the Win and Credits meters count up to the final value.

## Success Criteria
- [x] Keyboard play works for every control. Check: in headless Chrome, press `M`, `1`, `3`, then `Space`. Two cards are HELD before the draw, and the hand completes.
- [x] Number cards show the correct number of pips in the standard layout. Check: a unit test that the pip layout for each rank 2–10 has exactly that many positions; a screenshot.
- [x] J, Q and K are visibly court cards, distinct from number cards. Check: a screenshot.
- [x] Held cards are not re-animated on the draw. Check: in headless Chrome, a held card's DOM node is the same node before and after the draw, and each replaced card's node is new.
- [x] Wins count up. Check: in headless Chrome, after a winning draw the Credits meter shows at least one value between the start and the final total before it settles on the final total.
- [x] Round 1 still holds. Check: `npm test` (all earlier tests pass) and `npm run build`.

## Constraints
- No new dependencies. Cards are drawn with markup and CSS only, with no image assets or card library.
- Game rules and state transitions in `src/poker.js` and `src/game.js` don't change behavior.
- The count-up is display only. The credits in game state change at once, as they do today.
- Respect `prefers-reduced-motion`: with it on, there's no count-up and no deal animation.

## Out of Scope
- Sound, double-up, statistics, and saving progress (later rounds).

## Delta
- **`src/cards.js` (new).** Pure card-face data, kept out of React so it can be tested:
  - `pipLayout(rank)` gives `[x%, y%, inverted]` positions for ranks 2–10, using the standard arrangement
  - display helpers (`rankLabel`, `cardName`), moved from `src/App.jsx`
- **`src/cards.test.js` (new).** Pip counts and layout sanity. Written first and seen failing.
- **`src/App.jsx`:**
  - `Card` renders the pip grid for 2–10, a framed court panel for J/Q/K, and a large center pip for the ace.
  - A `keydown` listener on `window` (in `useEffect`) handles `1`–`5`, `Space`/`Enter`, `B` and `M`. It uses the same functional `setGame` updaters as the buttons, following the existing pattern in `onDealDraw` and `onBetOne`.
  - A `useCountUp(value)` hook animates the displayed Win and Credits with `requestAnimationFrame`. It's display only, and is skipped when the user prefers reduced motion (`matchMedia`).
  - Small key hints are added on the cards and buttons.
- **Folded in from check-plan:**
  - `dealKey` and the hand-number logic stay as they are.
  - Keyboard handlers read the latest state through a ref, not a stale closure.
  - Keys follow the same guards as the buttons: `B`/`M` only when not holding, no deal when out of credits, and Space/Enter does Start Over when out of credits.
  - `handNo` only increases when a deal actually happens.
  - Handled keys call `preventDefault()`, and key repeats are ignored.
  - The count-up snaps straight to a lower value (bet taken, new hand) and to the first value.
  - `README.md` gets the keyboard controls.
- **`src/App.css`:** pip positioning, the court panel, and key-hint styles. These extend the existing `.card` and `.btn` rules.
- **Unchanged:** `src/poker.js`, `src/game.js`, and their tests (the rules don't change).
- **New dependencies:** none.

## Evidence

| Criterion | Check run | Result |
|---|---|---|
| Keyboard play | Headless Chrome, real key events: `M`, `1`, `3`, then `Space` | Two cards held before the draw; button read "Draw" then "Deal"; the hand completed (`screenshots/r2-keyboard-held.png`, `r2-keyboard-drawn.png`) |
| Pip counts and layout | `npm test` (`src/cards.test.js`, 14 tests) | Seen failing against stubs (13 of 14), then passing; screenshots show standard 3/8/9/10 layouts |
| Court cards are distinct | `screenshots/r2-keyboard-held.png`, `r2-win.png` | J/K show a framed panel with rank, figure (♞ ♛ ♚) and suit; number cards show pip grids |
| Held cards not re-animated | Headless Chrome: compare card nodes before and after the draw | `sameNode: [true,false,true,false,false]`: held cards 1 and 3 kept their node; the replaced cards are new |
| Wins count up | Seeded deal (`Math.random` LCG, seed 214), hold all, draw; sample Credits every 40 ms | Samples `99, 100, 101, 102, 103, 104, 105` (95 → 105, two pair at bet 5) |
| Round 1 still holds | `npm test`; `npm run build` | 47/47 tests pass (33 from round 1 + 14 new); build passes |

Found in screenshots and fixed this round:
- The machine rendered 560px wide because `#root` shrank to its content. It now spans up to 880px.
- Pips and court frames overlapped the corner indices. Card art is now inset, and its size scales with card width (CSS container units).

check-plan findings, all folded in before coding:
- corrected the context claim about remounting
- the keyboard reads the latest state through a ref, so Space can't get stuck dealing
- keys follow the same guards as the buttons
- `preventDefault` stops a key firing twice on a focused button; key repeat is ignored

## Stop
Done when every success criterion is shown satisfied in Evidence and the repository's checks pass.
Bail out and report if card faces can't be made convincing without image assets or a new dependency.
