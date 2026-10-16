# Intent: Build a Polished React Video Poker Game (Jacks or Better)

## Goal

Create a browser-based Jacks or Better video poker game that is fun to play, visually polished, easy to understand, and faithful to the standard rules.

It should feel like a real video poker machine, not a technical prototype. The goal of the game is to see how many credits the player can build.

## Inputs / Context

- Starting point: an empty repository containing this file.
- Player input comes only from the browser interface: choosing a bet, Deal, holding or releasing cards, and Draw.
- The application allows only the actions that are valid in the current state.

## Rules

- A single 52-card deck, freshly shuffled for every hand.
- **Deal:** five cards face up. The player may hold any of them, from none to all five.
- **Draw:** each card that is not held is replaced from the same deck. The hand is then final.
- **Credits:** the player starts with 100 play-money credits and bets 1 to 5 credits per hand. The bet comes off the credits when the hand is dealt.
- **Payouts** use the standard 9/6 Jacks or Better table. Amounts are per credit bet and are returned in total, so a pair of jacks or better returns the bet.

| Hand | Pays per credit |
|---|---|
| Royal flush | 250 (4,000 total on a 5-credit bet) |
| Straight flush | 50 |
| Four of a kind | 25 |
| Full house | 9 |
| Flush | 6 |
| Straight | 4 |
| Three of a kind | 3 |
| Two pair | 2 |
| Jacks or better (a pair of J, Q, K or A) | 1 |

- **Straights:** Aces count high or low (10-J-Q-K-A and A-2-3-4-5). Straights do not wrap around (Q-K-A-2-3 is not a straight).
- **Out of credits:** when credits fall below 1, a Start Over action resets them to 100.
- Play money only. No real money, payments, or purchases.

Any other minor rule choices are up to the implementation, but they must be documented, not hidden.

## Outputs

- A working React application containing everything needed to run and play the game.
- A machine-style display showing:
  - the paytable, with the row for the current bet highlighted
  - five cards, with a clear indication of which cards are held
  - credits and the current bet
  - Deal/Draw and bet controls
  - the result of each hand, including the winning hand's name and the payout
- Automated tests covering the hand evaluator and the payouts.
- A README explaining how to install, run, and test the game, and listing any rule assumptions.

## Success Criteria

- [x] The application installs, builds, and runs as a React application. Check: the repository's install, build, and dev commands succeed.
- [x] A player can play complete hands (bet, deal, hold, draw, see result, deal again) without reloading. Check: play several hands in the running app.
- [x] Cards that are held stay put on the draw, every other card is replaced, and no card appears twice in one hand. Check: automated tests.
- [x] Every paying hand is identified correctly, including:
  - the ace-low straight A-2-3-4-5
  - a royal flush paying more than any other straight flush
  - a pair of tens or lower paying nothing

  Check: automated evaluator tests with at least one hand per category plus these edge cases.
- [x] Payouts and credits match the paytable for bets of 1 and 5. Check: automated tests.
- [x] Only valid actions are available. Holding is possible only between Deal and Draw, and the bet cannot change during a hand. Check: tests or a runtime check.
- [x] The interface looks deliberate, cohesive, and polished: the paytable, held cards, credits, and results are immediately readable. Check: screenshots of the running game.

## Boundaries

- Use React, in the browser.
- No backend, database, AI/LLM features, or external services.
- No real-money wagering, payments, or gambling services.
- No dependencies or infrastructure beyond what the game needs. Prefer the simplest implementation that meets the gameplay and quality bar.
- Not in this intent: double-up, other poker variants (deuces wild and so on), sound, statistics, and saving progress. These are later intents.

## Experience

The visual experience matters. The implementation chooses its own component structure, state management, styling, animations, layout, card presentation, project structure, and testing tools. Those choices belong to the agent, not to the human.

When several implementations satisfy this intent, prefer the one with fewer assumptions, dependencies, and irreversible decisions.

## Delta

New project. Every file is new.

**Toolchain**
- `package.json`: React 18, with Vite for the dev server and build, and Vitest for tests.
  - Vite and Vitest are the smallest standard way to build and test React. They're dev-only dependencies.
  - Scripts: `dev`, `build`, `preview`, `test`.
- `vite.config.js`: the React plugin.
- `index.html`: the page entry.

**Game rules (plain JavaScript, no React)**
- `src/poker.js`: the deck, a shuffle with an injectable random function (for tests), the hand evaluator, the paytable, and payouts.
- `src/game.js`: pure state transitions (`newGame`, `setBet`, `deal`, `toggleHold`, `draw`, `startOver`). Invalid actions return the state unchanged.

**Interface**
- `src/App.jsx` and `src/App.css`: the machine.
  - The paytable has 5 bet columns, with the current one highlighted.
  - Five cards, each with a HELD state.
  - A credits and bet display, and Bet One / Bet Max / Deal-Draw buttons.
  - A result banner, and a Start Over button.
- `src/main.jsx`: mounts the app.

**Tests and docs**
- `src/poker.test.js`, `src/game.test.js`: written first and seen failing.
- `README.md`: install, run, test, and rule assumptions.

**Not added**
- A state library (`useState` is enough).
- A CSS framework, a card-image library, or a router.

## Evidence

| Criterion | Check run | Result |
|---|---|---|
| Installs, builds, runs as React | `npm install`; `npm run build`; `vite preview` | 92 packages; `✓ built in 251ms`; preview HTTP 200 |
| Complete hands without reload | Headless Chrome: Bet Max → hold 2 → Draw → Deal | "No win — deal again / credits 95"; Deal is available again (`screenshots/r1-result.png`) |
| Held cards stay, others replaced, no repeats | `npm test` (`src/game.test.js`) | Passes. Seen failing first against stubs (26 of 33 failed). |
| Every paying hand, plus edge cases | `npm test` (`src/poker.test.js`) | 13 hand categories incl. A-2-3-4-5, royal vs straight flush; tens and lower pay nothing. Passes. |
| Payouts and credits for bets 1 and 5 | `npm test` | full house 9/45, jacks 1/5, royal 250/4000; credits = 95 + win. Passes. |
| Only valid actions | `npm test` ("only valid actions", 6 tests) | Passes. These pass against a do-nothing stub by design: they assert the state is unchanged, and are paired with the flow tests above. |
| Polished, readable interface | `screenshots/r1-start.png`, `r1-held.png`, `r1-result.png` | Paytable with active bet column, HELD badges, LED meters, result banner. The screenshots caught a stale-state bug where a second quick hold was lost; fixed with functional state updates (`src/App.jsx`). |

## Stop

Done when every success criterion has passing evidence: build and test output, plus screenshots of the running game.

Producing a plan, an architecture, or a test strategy does not complete this intent. Completion requires a playable game and proof that it works.

Bail out and report if a requirement can only be met with a backend, an external service, or a new class of dependency this intent does not allow.
