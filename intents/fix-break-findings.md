# Intent: Fix the Break-the-Game Findings

## Goal
Fix the two defects found by the adversarial suite (`TDD/FINDINGS.md`) so that the attack suite goes fully green, without weakening any test.
1. `setBet` must never produce a bet that isn't a whole number.
2. The game and the save code must agree on the valid credit range, so a legitimate game always reloads.

## Inputs / Context
- Source: `TDD/FINDINGS.md` and the user's approval ("yes").
- **Finding 1:** `src/game.js` `setBet` does `Math.min(MAX_BET, Math.max(1, bet))`. That never truncates and never rejects NaN, so 2.5 stays 2.5 and NaN and undefined become NaN.
- **Finding 2:** `src/storage.js` `fromSave` rejects `credits > MAX_CREDITS` (1e9), but `src/game.js` has no ceiling. Double Up doubles without limit, so a state beyond 1e9 is possible and then silently reset to 100 on reload.
- **Acceptance tests:** the 5 failing tests in `TDD/break-the-game.test.js`. The other 29 TDD tests, the 100 regression tests, and the mutation check (7/7) must keep passing.

## Outputs
- **`setBet(state, bet)`:**
  - A finite number is truncated to an integer and clamped to 1–`MAX_BET`.
  - ±Infinity is clamped to the nearest end of the range (5 or 1).
  - Anything that isn't a number, including NaN, returns the same state.
- **One credit limit, shared by game and storage:** any safe integer.
  - `storage.js` drops the 1e9 cap. `count()` already requires a safe integer.
  - `game.js` `canDouble` returns false when `credits + stake` would exceed `Number.MAX_SAFE_INTEGER`, because a Double Up win adds the stake. This keeps credits exact.

## Success Criteria
- [ ] The adversarial suite is green. Check: `npm run test:tdd` shows 34 passed, 0 failed, with no TDD assertion edited (`git diff TDD/break-the-game.test.js` is empty).
- [ ] The new guard has its own regression test, seen failing first. Check: a new test in `src/game.test.js` asserts that `canDouble` is false when `credits + stake > Number.MAX_SAFE_INTEGER`, and true just at the limit.
- [ ] Nothing regressed. Check: `npm test` passes all 100 earlier tests plus the new ones; `node TDD/mutate.mjs` still catches 7/7 against the new baseline of 0 failing; `npm run build` passes.
- [ ] The live game still works. Check: build, redeploy to `carlas-video-poker-mkendall`, and play a hand on the S3 URL.

## Constraints
- Don't edit existing tests or TDD assertions. No new dependencies. No gameplay change for normal play.

## Delta
- **`src/game.js`:**
  - `setBet` returns `state` when `typeof bet !== 'number' || Number.isNaN(bet)`. Otherwise it truncates finite values (`Math.trunc`) and clamps as before. It keeps the existing phase guard and immutable-spread pattern.
  - `canDouble` adds `state.credits + state.result.win <= Number.MAX_SAFE_INTEGER`.
- **`src/storage.js`:** the `MAX_CREDITS` constant and the `credits > MAX_CREDITS` rejection are removed. `count()` (safe integer ≥ 0) remains the credit check.
- **`src/game.test.js`:** a new `describe` with its own import line, for the Double Up ceiling guard. Written first and seen failing.
- **Callers of `setBet`:** `src/App.jsx` `betOne` and `betMax` pass integers, so they're unaffected. `storage.fromSave` builds the bet directly and doesn't call `setBet`.
- **Folded in from check-plan (READY):**
  - The fix is committed before `mutate.mjs` runs, because its `git diff` check would otherwise warn.
  - When the ceiling blocks Double Up, `collect` and the "Double Up?" hint are also inactive (they share `canDouble`). That's harmless, because the next deal clears `result`.
  - Accepted, not fixed: `draw` adds at most 4000 with no ceiling, so credits could in theory pass the safe-integer limit after a Double Up that ended near 9×10¹⁵. That's unreachable in practice.
  - Redeploy uses `AWS_PROFILE=admin aws s3 sync dist s3://carlas-video-poker-mkendall --delete`, the same command as the original deploy.
- **Unchanged:** `TDD/break-the-game.test.js`, `TDD/mutate.mjs`, and all existing tests.

## Evidence

## Stop
Done when every success criterion is shown satisfied in Evidence.
Bail out and report if a TDD test can only be made to pass by changing its assertion.
