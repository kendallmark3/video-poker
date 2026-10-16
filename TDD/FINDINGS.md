# Break-the-Game Findings

Adversarial suite: `TDD/break-the-game.test.js` · Run: `npm run test:tdd` · Mutation check: `node TDD/mutate.mjs`
Intent: [`intents/break-the-game.md`](../intents/break-the-game.md). No game code was changed in this round.

## Status: both findings fixed

Fixed by [`intents/fix-break-findings.md`](../intents/fix-break-findings.md). `npm run test:tdd` now shows **34 passed / 0 failed**, with no assertion changed. The mutation check still catches 7/7, now from a baseline of 0 failing tests.
- **Finding 1:** `setBet` ignores anything that isn't a number (including NaN) and truncates fractions.
- **Finding 2:** the game and the save code now share one range, any exact (safe) integer. The save code's 1e9 cap is removed, and Double Up isn't offered when a win would leave that range.

## Result at time of discovery

```
npm run test:tdd
Tests  5 failed | 29 passed (34)   Duration 7.5 s
```

**The game broke in 2 places (5 failing tests).** Everything else held up under attack, including every possible hand and 90,000 random actions.

## What broke

| # | Finding | Failing tests | Can a player reach it? | Severity |
|---|---|---|---|---|
| 1 | **`setBet` accepts non-integer bets.** `setBet(2.5)` leaves a bet of 2.5. `setBet(NaN)` and `setBet(undefined)` leave `NaN`, and the next deal turns credits into `NaN`. `setBet` clamps the range but never checks the type or rounds the value. | `setBet(2.5)`, `setBet(NaN)`, `setBet(undefined)` | **No.** The interface only ever passes `bet + 1` or `5`. This is a gap at the code's boundary, waiting for a future caller. | Low. It would be High if anything ever passed user input to `setBet`, because the save check would then reject the corrupted save and the player would be reset to 100. |
| 2 | **Saved games over 1,000,000,000 credits are thrown away.** The game logic has no ceiling on credits, but `fromSave` rejects anything above `MAX_CREDITS` (1e9). A legitimate rich player who reloads is silently reset to a fresh 100-credit game. | the 30-win Double Up streak (10 × 2³⁰ = 10,737,418,240 credits); the 1,000,000,001-credit save | **Yes, in theory.** About 27 Double Up wins in a row from a 10-credit win (each pick is roughly a coin flip), or an astronomically long winning session. | Low likelihood, high impact: total loss of progress. The game logic and the storage disagree about the valid range. |

## What held up (29 passing tests)

| Attack | Oracle | Result |
|---|---|---|
| All 2,598,960 five-card hands classified | [MATH] published counts, and a [REF] evaluator with a different algorithm | Every count matches (4 royal, 36 straight flush … 337,920 jacks or better), and there are 0 disagreements with the reference evaluator |
| Card order (120 orderings × 300 hands) | [REF] | Same result in every ordering |
| Every paying hand × bet 1–5 | [RULES] paytable from `intents/videopoker.md` | All 45 payouts exact |
| Royal flush when the bet was reduced to 3 credits | [RULES] | Pays 750, not the 4,000 max-bet bonus |
| A-2-3-4-5 straight flush | [RULES] | Pays as a straight flush, not a royal |
| Shuffle fairness, first and last positions (20,800 shuffles) | [STATS] chi-square, 51 degrees of freedom, p < 0.001 | Under the critical value of 86.66 |
| Shuffle at the edges of the random range (0, and 1 − 2⁻⁵³) | [INPUT] | Still a permutation of all 52 cards |
| 5,000 draws with random holds | [INPUT] card identity | Never a duplicate card, and never a discarded card coming back |
| 30 seeds × 3,000 random actions, valid and invalid | [BOOKS] credits = baseline + won − wagered − stake; [REF] and [RULES] on every draw; [RULES] on every Double Up | The books balanced after all 90,000 steps. Cards stayed unique, every payout and Double Up result followed the rules, and every state saved and loaded. |
| `toggleHold` with −1, 5, 1.5, NaN, '0' | [INPUT] | Ignored |
| `pickDouble` with −1, 4, 1.5, NaN | [INPUT] | Ignored |
| All-in Double Up, then a loss | [BOOKS] | 0 credits, never negative, Start Over offered |
| Double Up tie | [RULES] | Stake returned, Double Up offered again |
| Reload mid-Double Up | [BOOKS] | Books still balance after the stake is forfeited |
| Tampered save with `__proto__` | [INPUT] | `Object.prototype` not polluted |
| Save with zero credits | [RULES] | Loads broke; Deal does nothing |
| Celebration tiers at the edges | Round 7 tier rules | Royal at bet 1 gets the biggest celebration; exactly 25× gets the biggest, 24× gets medium |

## Proof the suite can fail: mutation check

`node TDD/mutate.mjs` first records the 5 tests that already fail on the original code and ignores them. It then plants one bug at a time. A mutant counts as **caught** only if a test that passed on the original now fails.

| Planted bug | Caught by |
|---|---|
| Shuffle off by one (a card can never stay put) | [STATS] chi-square |
| Evaluator forgets the ace-low straight | [MATH] counts, the wheel test, random play |
| Royal decided by "has an ace" instead of "starts at 10" | [MATH] counts, the wheel test |
| Royal bonus paid from 4 credits up | [RULES] paytable × bet |
| Draw reuses the same replacement card | Card identity on draws |
| Double Up ties count as wins | Random play ([RULES] Double Up), the tie test |
| Save forgets to forfeit the Double Up stake | [BOOKS] on reload mid-Double Up |

**7 of 7 caught.** `git diff --quiet src/` was clean after the run.

## Assumptions in the code, and what happened to each

1. **The evaluator is right on every hand:** held (exhaustive).
2. **The shuffle is unbiased:** held (chi-square).
3. **The draw never repeats or brings back a discarded card:** held.
4. **The books always balance:** held through 90,000 random actions.
5. **Only valid actions change state, even with odd inputs:** **broken for `setBet`** (finding 1). It held for holds and picks.
6. **The royal bonus applies only to a real 5-credit bet:** held.
7. **Any state the game produces can be saved and loaded:** **broken above 1e9 credits** (finding 2).
8. **Saves can't inject or pollute objects:** held.
9. **Double Up is safe at the edges:** held. The streak test failed only because of finding 2's save cap; the game logic itself stayed exact.

## Suggested follow-up (not done in this round)

Make one decision for both findings, then write an intent to fix them:
- `setBet` should truncate to an integer and ignore non-numbers (or reject them, returning the same state).
- Either cap credits in the game logic at the same `MAX_CREDITS` the storage uses, or raise and align the storage limit (any safe integer). The game and the storage must agree.

The 5 failing tests in this suite are the acceptance tests for that fix.
