# Intent: Try to Break the Game (Adversarial TDD Round)

## Goal
Find out where Carla's Video Poker Game breaks, rather than confirm what already works. Write a separate adversarial test suite in `TDD/`. It examines the assumptions in the code, attacks the edge cases, and reports honestly which ones fail. The suite must not be able to pass by construction: every assertion is checked against something independent of the game's code, and the suite is shown to fail when the game is deliberately broken.

## Inputs / Context
- Source: the request in conversation.
- The rules (the acceptance criteria) are in `intents/videopoker.md`. The behavior added since then is in `intents/*.md` (rounds 2–9).
- The code under test is pure JavaScript:
  - `src/poker.js`: deck, shuffle, evaluator, payouts
  - `src/game.js`: state transitions, Double Up, stats
  - `src/storage.js`: save and load
  - `src/celebrate.js`: celebration size
- The existing suite is 100 tests in `src/*.test.js`. They were written alongside the code, so they share its assumptions.

### Assumptions in the code under attack
1. The evaluator classifies every one of the 2,598,960 five-card hands correctly, not just the hand-picked examples.
2. The shuffle is unbiased. Every card is equally likely in every position.
3. The draw never repeats a card and never brings back a discarded one.
4. Credits are always a non-negative integer, and the books always balance: credits = baseline + won − wagered (− the stake during Double Up).
5. Only valid actions change state, even when the inputs are odd (non-integer bets, out-of-range hold or pick indexes).
6. The royal flush bonus applies only to a real 5-credit bet, including when the bet was reduced to the credits left.
7. A save the game itself produces always loads again, including large but legitimate credit totals.
8. A save can't be used to inject or pollute objects.
9. Double Up at the edges is safe: going all-in, long win streaks, ties, and out-of-range picks.

## Outputs
- **`TDD/break-the-game.test.js`:** adversarial tests. Each one names its independent oracle:
  - **Combinatorics:** an exhaustive count of all 2,598,960 hands by category, compared with the published counts.
  - **A reference evaluator:** written inside the test with a different algorithm, and compared on every hand.
  - **Statistics:** a chi-square test of shuffle uniformity, using a seeded random function so the result is repeatable.
  - **Invariants:** seeded random play over many thousands of steps, including invalid actions, with the invariants checked after every step.
  - **Rule-based edge cases** from `intents/videopoker.md`.
- **`TDD/vitest.config.js`** and an `npm run test:tdd` script, so the adversarial suite runs separately. The `vite.config.js` test settings exclude `TDD/`, so `npm test` still means the regression suite.
- **`TDD/mutate.mjs`:** a mutation check. It applies deliberate bugs to the source, one at a time, runs the TDD suite, records whether the suite caught each one, and always restores the original file.
- **`TDD/FINDINGS.md`:** every edge case tried, whether it broke the game, how severe it is, whether a player can reach it through the interface, and the mutation results.

## Success Criteria
- [x] **Every assertion has an independent oracle.** Check: each `describe` and `it` in `TDD/break-the-game.test.js` names its oracle in its title or a comment, and no test computes its expected value by calling the function under test.
- [x] **The suite can fail.** Check: `node TDD/mutate.mjs` reports that every planned mutation was caught (at least 5, covering the evaluator, the shuffle, the draw, Double Up and storage). After the run, `git status` shows `src/` unchanged.
- [x] **The suite was run and its results recorded honestly.** Check: the `npm run test:tdd` output (pass and fail counts plus the failing test names) is captured in `TDD/FINDINGS.md`. Every failure is explained as a real defect with its reachability, or as a mistake in the test, never by quietly changing an assertion.
- [x] **Game code is unchanged and the regression suite is still green.** Check: `git diff --stat src/` is empty, and `npm test` shows 100 passing.

## Constraints
- No changes to `src/` game code in this round. Defects are reported, not fixed; fixing them is a follow-up intent.
- No new dependencies.
- Tests are deterministic, using seeded randomness, so a failure is repeatable.

## Out of Scope
- Fixing any defects found.
- Browser and UI tests. This round covers game logic, storage and celebration.

## Delta
- **`TDD/break-the-game.test.js` (new).** It imports the code under test from `../src/*.js` and holds its own oracles: a reference evaluator built on sorted rank-count signatures, the published 5-card counts, a chi-square critical value, and a seeded LCG.
- **`TDD/vitest.config.js` (new).** `root` is the repository, `include: ['TDD/**/*.test.js']`, and `testTimeout` is 120 s for the exhaustive and fuzz tests.
- **`TDD/mutate.mjs` (new).** For each mutation it:
  - reads the target `src` file and asserts the target text is present
  - writes the mutant, runs `npx vitest run --config TDD/vitest.config.js`, and records whether the suite was caught (non-zero exit)
  - restores the original in `finally`, then runs a final `git diff --quiet src/` check

  It changes `src/` only for the duration of each run.
- **`TDD/FINDINGS.md` (new):** the results.
- **Folded in from check-plan (FIX FIRST, both blockers resolved):**
  - **Blocker 1, baseline-aware mutation check.** `mutate.mjs` first records which tests fail on the original code, using `--reporter=json`. A mutant counts as caught only when a test that passed on the original fails on the mutant.
  - **Blocker 2, test exclude.** `vite.config.js` uses `exclude: [...configDefaults.exclude, 'TDD/**']` from `vitest/config`, so the default excludes (`node_modules`, `dist`) are kept.
  - **Start Over in the balance check.** The fuzz test's baseline rises by `100 − credits before` on every successful `startOver`.
  - **Mid-double reload.** The storage check covers the `toSave` stake subtraction for a mid-double save.
  - **Odd-input defects.** `setBet` odd-input failures, if found, are recorded as defects, not as test mistakes.
- **`vite.config.js`:** `test.exclude` adds `TDD/**`, so `npm test` keeps meaning the regression suite. This is test configuration only.
- **`package.json`:** a `"test:tdd": "vitest run --config TDD/vitest.config.js"` script.
- **Unchanged:** everything under `src/`.

## Evidence

| Criterion | Check run | Result |
|---|---|---|
| Every assertion has an independent oracle | Review of `TDD/break-the-game.test.js` | Every `describe` names its oracle: [MATH], [REF], [RULES], [STATS], [BOOKS] or [INPUT]. Expected values come from the transcribed paytable, the published counts, the reference evaluator, the chi-square bound, the books identity or the documented input domain. The functions under test only generate inputs and are never their own oracle. |
| The suite can fail | `node TDD/mutate.mjs` | Baseline: 5 already failing (ignored). **7/7 mutants caught**, across shuffle, evaluator (×2), payout, draw, Double Up and storage, each by a test that passed on the original. "src/ restored: git diff is clean." Exit 0. |
| Run and recorded honestly | `npm run test:tdd`; `TDD/FINDINGS.md` | **5 failed / 29 passed (34).** The failures are two real defects: `setBet` accepts non-integers (2.5, NaN, undefined), which the interface can't reach; and saves over 1e9 credits are rejected although the game logic allows them, which is reachable in theory and loses all progress. No assertion was changed. |
| Game code unchanged; regression suite green | `git diff --stat src/`; `npm test` | Empty diff for `src/`. 100/100 tests pass, and `TDD/` is excluded from `npm test` while the default excludes are kept. |

check-plan returned FIX FIRST: both blockers were resolved before the suite was written (baseline-aware mutation counting and `configDefaults` excludes), and the Start Over baseline reset was added to the fuzz test. The fuzz test's books check passed through 90,000 steps, which confirms the reset was needed and correct.

## Stop
Done when every success criterion is shown satisfied in Evidence. The TDD suite itself may be red, because finding failures is the point; its results are recorded in FINDINGS.md.
Bail out and report if a test can't be given an independent oracle. In that case drop the test rather than write one that passes by construction.
