# Intent: Sound Effects and Session Stats (Round 4)

## Goal
Make the machine sound alive and let the player see how the session is going. Short synthesized sound effects mark the key moments, behind a toggle that starts muted. A compact stats panel shows how the player is doing against the house.

## Inputs / Context
- Source: the round 4 request in conversation.
- Current state:
  - `src/game.js` holds pure transitions: `deal` takes the bet, `draw` credits the win, and `startDouble` / `pickDouble` / `collect` handle Double Up.
  - `src/App.jsx` routes buttons and keys through `actions`, which reads the latest state from `gameRef`.
  - There are 60 tests across `src/*.test.js`.
- **Accounting for Double Up:**
  - The base win is already credited on the draw.
  - Starting a double takes the stake back out.
  - The pick returns 2×, 1× or 0.
  - So "credits won" goes up by `returned − stake` on each pick. That makes it negative on a loss, so "credits won" always equals the credits actually gained from play.

## Outputs
- **Stats in game state** (pure, in `src/game.js`): hands played, credits wagered, credits won, best hand (the highest paytable row hit), and biggest single payout. Return % = won ÷ wagered, shown as "—" before the first hand.
- **A stats panel** under the machine:
  - one compact row
  - also shows the Double Up net result inside "credits won"
- **`src/sound.js`:**
  - synthesized effects for deal, hold, win, lose and double up, using the Web Audio API with no audio files
  - a `createSound()` that is muted by default
  - `play(name)` does nothing while muted or when Web Audio isn't available
- **A Sound on/off control:** a button plus the `S` key. It starts muted.

## Success Criteria
- [x] The stats are correct.
  - **Check:** unit tests. After scripted hands, `handsPlayed`, `wagered` and `won` match. `best` is the highest hand hit and `biggest` is the largest payout.
  - Double Up adjusts `won` by returned − stake.
  - A Start Over keeps or resets the stats as defined below.
- [x] Sound is silent until enabled, and safe without Web Audio.
  - **Check:** unit tests with an injected fake audio context. Nothing plays while muted; tones play once enabled; with no Web Audio, nothing throws.
- [x] It's audible and toggleable in the browser.
  - **Check:** in headless Chrome, press `S` and the toggle reads "Sound on". Play a hand and confirm the fake-context counter (injected before load) shows oscillators started.
- [x] The stats panel is visible and readable.
  - **Check:** a screenshot after a few hands.
- [x] Earlier rounds still hold.
  - **Check:** `npm test` (all 60 earlier tests pass unchanged) and `npm run build`.

## Constraints
- No new dependencies and no audio files.
- Rules and payouts don't change.
- Existing tests are not edited.
- Start Over resets credits but **keeps the session stats**, so the player can see their whole session.

## Out of Scope
- Saving progress across reloads (round 5).

## Delta
- **`src/game.js`:**
  - `newGame()` gains `stats: { handsPlayed, wagered, won, best, biggest }`.
  - `deal` adds 1 hand and the bet.
  - `draw` adds the win, raises `best` (ranked by `PAYTABLE` order, imported from `src/poker.js`) and `biggest`.
  - `pickDouble` adds `returned − stake` and can raise `biggest`.
  - `startOver` returns a new game but carries `stats` over.
  - New `returnPercent(stats)`: `null` before the first wager.
  - This follows the existing immutable-spread pattern in `deal` and `draw`.
- **`src/game.test.js`:** new `describe` blocks with a separate import line. Existing tests untouched.
- **`src/sound.js` (new):** `createSound({ createContext })`.
  - The audio context is created lazily, only once sound is enabled, which fits browser autoplay rules.
  - Tones are oscillator + gain envelopes. Named effects: `deal`, `hold`, `win`, `lose`, `double`.
  - It never throws when Web Audio is missing.
- **`src/sound.test.js` (new):** a fake context counts oscillator starts.
- **`src/App.jsx`:**
  - One `useEffect` compares the previous and next game state and picks the sound: deal, hold, win/lose after a draw, double, and win/lose after a pick. Sound logic stays out of the pure transitions and the `actions` object.
  - A Sound toggle button and the `S` key, added to the existing key handler.
  - A `Stats` panel component.
- **Folded in from check-plan:**
  - `PAYTABLE` is ordered best-first, so a lower index means a better `best`.
  - A Double Up push plays its own `push` chime.
  - The audio context is created and resumed inside `setEnabled(true)`, which only the toggle action calls (a user gesture). The default factory reads `window.AudioContext` at call time.
  - The `S` key goes through a new `toggleSound` action, like every other key.
  - The sound object is created once in a ref, so StrictMode's double mount can't close it.
  - The README gets the `S` row plus a short note.
- **`src/App.css`:** the stats row and the toggle button.
- **`README.md`:** sound and stats notes.
- **Unchanged:** `src/poker.js`, `src/cards.js`, and existing tests.
- **New dependencies:** none (Web Audio is a browser platform API).

## Evidence

| Criterion | Check run | Result |
|---|---|---|
| Stats correct | `npm test` ("session stats", 5 tests) | Seen failing against stubs, then passing. Hands and wagers counted on deal; won, best and biggest updated on draw. Best stays Full House after a later jacks win. Double Up adds `returned − stake` (+10 / 0 / −10). Start Over keeps stats and resets credits to 100. |
| Silent until enabled; safe without Web Audio | `npm test` (`src/sound.test.js`, 5 tests, fake context) | Passes. Two tests ("muted by default", "creates the context and plays every effect") failed first. The three "nothing happens" checks pass against a silent stub by design. |
| Audible and toggleable in the browser | Headless Chrome with a fake `AudioContext` counting tones, injected before load | "Sound off" with 0 tones after a muted deal. `S` gives "Sound on" and 1 tone. Five holds plus the win jingle: 10 tones, exactly 5×1 + 4. |
| Stats panel visible and readable | `screenshots/r4-stats.png` after 3 hands | Hands 3, Wagered 15, Won 20, Return 133.3%, Best hand Two Pair, Biggest win 10. Consistent with credits 105 (100 − 15 + 20). |
| Earlier rounds hold | `npm test`; `npm run build` | 70/70 tests pass. The 60 earlier tests are unchanged and pass. The build passes. |

check-plan findings, all folded in before coding:
- `best` is ranked lowest-index-first.
- A push plays its own chime.
- The audio context is created inside the toggle's user gesture.
- `S` routes through a `toggleSound` action.
- The sound engine is held in a ref, so StrictMode's double mount can't break it.

Screenshot review: the Sound toggle could overlap the title between 640 and 900px wide. Below 900px it now sits on its own line.

## Stop
Done when every success criterion is shown satisfied in Evidence and the repository's checks pass.
Bail out and report if browser sound needs anything beyond the Web Audio API.
