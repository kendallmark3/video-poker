// Adversarial suite: tries to BREAK the game, not confirm it.
// Rule for every test: the expected value comes from an independent oracle,
// never from calling the function under test. Oracles used:
//   [RULES]  the paytable and rules in intents/videopoker.md, transcribed below
//   [MATH]   published five-card hand counts (2,598,960 hands)
//   [REF]    a reference evaluator written here with a different algorithm
//   [STATS]  chi-square uniformity bound
//   [BOOKS]  accounting identity: credits = baseline + won - wagered (- stake mid-double)
//   [INPUT]  the documented domain: bets are integers 1..5, five cards, four Double Up picks

import { describe, it, expect } from 'vitest'
import { evaluate, payout, shuffle, createDeck } from '../src/poker.js'
import {
  newGame, setBet, deal, toggleHold, draw, startOver, canStartOver,
  canDouble, startDouble, pickDouble, collect,
} from '../src/game.js'
import { toSave, fromSave } from '../src/storage.js'
import { celebration } from '../src/celebrate.js'

// ---------- Oracles ----------

// [RULES] 9/6 Jacks or Better, per credit, from intents/videopoker.md
const RULES_PAYS = {
  royal: 250, straightFlush: 50, fourKind: 25, fullHouse: 9, flush: 6,
  straight: 4, threeKind: 3, twoPair: 2, jacksOrBetter: 1,
}
const rulesPayout = (key, bet) => (!key ? 0 : key === 'royal' && bet === 5 ? 4000 : RULES_PAYS[key] * bet)

// [MATH] Published counts of five-card poker hands; "jacksOrBetter" = one pair of J, Q, K or A
// (4 of the 13 pair ranks x 84,480 hands each).
const PUBLISHED_COUNTS = {
  royal: 4, straightFlush: 36, fourKind: 624, fullHouse: 3744, flush: 5108,
  straight: 10200, threeKind: 54912, twoPair: 123552, jacksOrBetter: 337920,
  none: 2598960 - 536100,
}

// [REF] Independent evaluator: classifies by the sorted rank-count signature.
function refCategory(cards) {
  const counts = new Map()
  for (const c of cards) counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1)
  const signature = [...counts.values()].sort((a, b) => b - a).join('')
  const flush = new Set(cards.map((c) => c.suit)).size === 1
  const ranks = [...counts.keys()].sort((a, b) => a - b)
  let straightHigh = 0
  if (signature === '11111') {
    if (ranks[4] - ranks[0] === 4) straightHigh = ranks[4]
    else if (ranks.join(',') === '2,3,4,5,14') straightHigh = 5
  }
  if (straightHigh && flush) return straightHigh === 14 ? 'royal' : 'straightFlush'
  if (signature === '41') return 'fourKind'
  if (signature === '32') return 'fullHouse'
  if (flush) return 'flush'
  if (straightHigh) return 'straight'
  if (signature === '311') return 'threeKind'
  if (signature === '221') return 'twoPair'
  if (signature === '2111') {
    const pairRank = [...counts].find(([, n]) => n === 2)[0]
    return pairRank >= 11 ? 'jacksOrBetter' : null
  }
  return null
}

// Our own deck, so the deck under test is not its own oracle.
const ORACLE_DECK = []
for (const suit of ['S', 'H', 'D', 'C']) for (let rank = 2; rank <= 14; rank++) ORACLE_DECK.push({ rank, suit })
const id = (c) => `${c.rank}${c.suit}`

// Seeded LCG: deterministic, so every failure is repeatable.
const lcg = (seed) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)

const card = (rank, suit) => ({ rank, suit })

// ---------- Assumption 1: the evaluator is right on EVERY hand ----------

describe('evaluator vs [MATH] and [REF] on all 2,598,960 hands', () => {
  it('category counts match the published counts, and every hand agrees with the reference evaluator', () => {
    const tally = {}
    const mismatches = []
    const d = ORACLE_DECK
    for (let a = 0; a < 48; a++)
      for (let b = a + 1; b < 49; b++)
        for (let c = b + 1; c < 50; c++)
          for (let e = c + 1; e < 51; e++)
            for (let f = e + 1; f < 52; f++) {
              const hand = [d[a], d[b], d[c], d[e], d[f]]
              const got = evaluate(hand)?.key ?? null
              const want = refCategory(hand)
              tally[got ?? 'none'] = (tally[got ?? 'none'] ?? 0) + 1
              if (got !== want && mismatches.length < 5) mismatches.push({ hand: hand.map(id).join(' '), got, want })
            }
    expect(mismatches).toEqual([])
    expect(tally).toEqual(PUBLISHED_COUNTS)
  })

  it('[REF] card order never changes the result (all 120 orderings of 300 seeded hands)', () => {
    const rng = lcg(7)
    const perms = (xs) => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])))
    for (let n = 0; n < 300; n++) {
      const hand = shuffle(ORACLE_DECK, rng).slice(0, 5)
      const want = refCategory(hand)
      for (const p of perms(hand)) expect(evaluate(p)?.key ?? null).toBe(want)
    }
  })
})

// ---------- Payouts vs the written rules ----------

describe('payouts vs [RULES]', () => {
  it('every paying hand at every bet 1..5 pays exactly what the paytable says', () => {
    for (const key of Object.keys(RULES_PAYS))
      for (let bet = 1; bet <= 5; bet++) expect([key, bet, payout(key, bet)]).toEqual([key, bet, rulesPayout(key, bet)])
  })

  it('royal bonus only on a real 5-credit bet, even when the bet was reduced to the credits left', () => {
    const royal = [card(10, 'S'), card(11, 'S'), card(12, 'S'), card(13, 'S'), card(14, 'S')]
    const reduced = deal(setBet({ ...newGame(), credits: 3 }, 5), lcg(1)) // bet reduced to 3
    const held = { ...reduced, hand: royal, held: [true, true, true, true, true] }
    expect(draw(held).result.win).toBe(rulesPayout('royal', 3)) // 750, not 4000
    const full = { ...deal(setBet(newGame(), 5), lcg(1)), hand: royal, held: [true, true, true, true, true] }
    expect(draw(full).result.win).toBe(4000)
  })

  it('[RULES] the A-2-3-4-5 straight flush pays as a straight flush, not a royal', () => {
    const wheel = [card(14, 'H'), card(2, 'H'), card(3, 'H'), card(4, 'H'), card(5, 'H')]
    expect(payout(evaluate(wheel)?.key, 5)).toBe(rulesPayout('straightFlush', 5))
  })
})

// ---------- Assumption 2: the shuffle is fair ----------

describe('shuffle vs [STATS]', () => {
  it('every card is equally likely in the first and last positions (chi-square, p < 0.001 bound)', () => {
    const N = 52 * 400
    const rng = lcg(2026)
    const first = new Map()
    const last = new Map()
    for (let n = 0; n < N; n++) {
      const s = shuffle(createDeck(), rng)
      first.set(id(s[0]), (first.get(id(s[0])) ?? 0) + 1)
      last.set(id(s[51]), (last.get(id(s[51])) ?? 0) + 1)
    }
    const expected = N / 52
    const chi = (m) => ORACLE_DECK.reduce((sum, c) => sum + ((m.get(id(c)) ?? 0) - expected) ** 2 / expected, 0)
    const CRITICAL_DF51_P001 = 86.66 // chi-square critical value, 51 degrees of freedom, p = 0.001
    expect(chi(first)).toBeLessThan(CRITICAL_DF51_P001)
    expect(chi(last)).toBeLessThan(CRITICAL_DF51_P001)
  })

  it('[INPUT] stays a permutation of 52 cards even at the top edge of the random range', () => {
    for (const edge of [0, 0.9999999999999999]) {
      const s = shuffle(createDeck(), () => edge)
      expect(new Set(s.map((c) => c && id(c))).size).toBe(52)
      expect(s.every(Boolean)).toBe(true)
    }
  })
})

// ---------- Assumption 3: the draw never repeats or resurrects a card ----------

describe('draw vs [INPUT] card identity', () => {
  it('5,000 seeded hands with random holds: five unique cards, no discarded card ever comes back', () => {
    const rng = lcg(99)
    for (let n = 0; n < 5000; n++) {
      let s = deal(newGame(), rng)
      const before = s.hand.map(id)
      const holds = [0, 1, 2, 3, 4].filter(() => rng() < 0.5)
      s = holds.reduce(toggleHold, s)
      const after = draw(s).hand.map(id)
      const discarded = before.filter((_, i) => !holds.includes(i))
      expect(new Set(after).size).toBe(5)
      for (const i of holds) expect(after[i]).toBe(before[i])
      for (const c of discarded) expect(after.filter((_, i) => !holds.includes(i))).not.toContain(c)
    }
  })
})

// ---------- Assumptions 4 and 5: random play, invalid actions included ----------

describe('random play vs [BOOKS], [REF] and [RULES]', () => {
  it('30 seeds x 3,000 random actions (valid and invalid): the books balance, cards stay unique, payouts follow the rules', () => {
    const KEYS = new Set([null, ...Object.keys(RULES_PAYS)])
    for (let seed = 1; seed <= 30; seed++) {
      const rng = lcg(seed)
      let s = newGame()
      let baseline = s.credits
      let deals = 0
      for (let step = 0; step < 3000; step++) {
        const prev = s
        const r = rng()
        const n = Math.floor(rng() * 7) // indexes 0..6 include out-of-range values
        if (r < 0.12) s = setBet(s, n)
        else if (r < 0.32) s = deal(s, rng)
        else if (r < 0.52) s = toggleHold(s, n)
        else if (r < 0.7) s = draw(s)
        else if (r < 0.8) s = startDouble(s, rng)
        else if (r < 0.9) s = pickDouble(s, n)
        else if (r < 0.95) s = collect(s)
        else s = startOver(s)

        if (prev.phase === 'ready' && s.phase === 'holding') deals++
        if (s !== prev && prev.phase === 'ready' && s.credits === 100 && canStartOver(prev)) baseline += 100 - prev.credits

        // [BOOKS]
        const atRisk = s.phase === 'double' ? s.double.stake : 0
        expect(Number.isSafeInteger(s.credits) && s.credits >= 0).toBe(true)
        expect(s.credits).toBe(baseline + s.stats.won - s.stats.wagered - atRisk)
        expect(s.stats.handsPlayed).toBe(deals)
        expect(KEYS.has(s.stats.best)).toBe(true)
        expect(['ready', 'holding', 'double']).toContain(s.phase)
        expect(Number.isInteger(s.bet) && s.bet >= 1 && s.bet <= 5).toBe(true)

        // cards
        if (s.phase === 'holding') {
          const all = [...s.hand, ...s.deck].map(id)
          expect(s.hand).toHaveLength(5)
          expect(new Set(all).size).toBe(52)
        }

        // [REF] + [RULES] on every settled draw
        if (prev.phase === 'holding' && s.phase === 'ready') {
          const want = refCategory(s.hand)
          expect(s.result.key).toBe(want)
          expect(s.result.win).toBe(rulesPayout(want, s.bet))
        }

        // [RULES] Double Up: higher pays 2x, equal returns the stake, lower loses; aces high
        if (prev.phase === 'double' && s.phase === 'ready') {
          const mine = s.double.choices[s.double.pick].rank
          const dealer = s.double.dealer.rank
          const stake = prev.double.stake
          expect(s.result.win).toBe(mine > dealer ? 2 * stake : mine === dealer ? stake : 0)
        }

        // Assumption 7: anything the game produces can be saved and loaded back
        expect(fromSave(JSON.stringify(toSave(s)))).not.toBeNull()
      }
    }
  })
})

// ---------- Assumption 5: odd inputs (API boundary; the UI only sends integers) ----------

describe('odd inputs vs [INPUT]', () => {
  it.each([[2.5], [NaN], [undefined], [Infinity], [-Infinity], ['3'], [null]])(
    'setBet(%s) leaves an integer bet from 1 to 5',
    (value) => {
      const s = setBet(newGame(), value)
      expect(Number.isInteger(s.bet) && s.bet >= 1 && s.bet <= 5).toBe(true)
      const dealt = deal(s, lcg(3))
      expect(Number.isInteger(dealt.credits)).toBe(true)
    },
  )

  it.each([[-1], [5], [1.5], [NaN], ['0']])('toggleHold(%s) does not change which cards are held', (index) => {
    const s = deal(newGame(), lcg(4))
    expect(toggleHold(s, index).held).toEqual([false, false, false, false, false])
  })

  it.each([[-1], [4], [1.5], [NaN]])('pickDouble(%s) is ignored', (index) => {
    const won = { ...newGame(), credits: 105, result: { key: 'twoPair', name: 'Two Pair', win: 10 } }
    const s = startDouble(won, lcg(5))
    expect(pickDouble(s, index)).toBe(s)
  })
})

// ---------- Assumption 9: Double Up at the edges ----------

describe('Double Up edges vs [RULES] and [BOOKS]', () => {
  const forced = (s, dealer, mine) => ({ ...s, double: { ...s.double, dealer: card(dealer, 'H'), choices: [card(mine, 'C'), card(2, 'S'), card(3, 'S'), card(4, 'S')] } })

  it('all-in: doubling every credit and losing leaves 0 credits, Start Over available, never negative', () => {
    const won = { ...newGame(), credits: 10, result: { key: 'twoPair', name: 'Two Pair', win: 10 } }
    const doubling = startDouble(won, lcg(6))
    expect(doubling.credits).toBe(0)
    const lost = pickDouble(forced(doubling, 9, 2), 0)
    expect(lost.credits).toBe(0)
    expect(canStartOver(lost)).toBe(true)
    expect(startOver(lost).credits).toBe(100)
  })

  it('a tie is a push: the stake comes back and Double Up is offered again', () => {
    const won = { ...newGame(), credits: 105, result: { key: 'twoPair', name: 'Two Pair', win: 10 } }
    const push = pickDouble(forced(startDouble(won, lcg(8)), 9, 9), 0)
    expect(push.credits).toBe(105)
    expect(canDouble(push)).toBe(true)
  })

  it('a 30-win streak keeps exact integer credits, and the save still loads (assumption 7)', () => {
    let s = { ...newGame(), credits: 10, result: { key: 'twoPair', name: 'Two Pair', win: 10 } }
    for (let i = 0; i < 30; i++) s = pickDouble(forced(startDouble(s, lcg(i + 10)), 2, 14), 0)
    const expected = 10 * 2 ** 30 // [RULES] each win doubles the stake
    expect(s.credits).toBe(expected)
    expect(Number.isSafeInteger(s.credits)).toBe(true)
    const reloaded = fromSave(JSON.stringify(toSave(s)))
    expect(reloaded?.credits).toBe(expected)
  })
})

// ---------- Assumptions 7 and 8: saves ----------

describe('saves vs [BOOKS] and [INPUT]', () => {
  it('reloading mid-Double Up keeps the books balanced', () => {
    const won = {
      ...newGame(), credits: 105, result: { key: 'twoPair', name: 'Two Pair', win: 10 },
      stats: { handsPlayed: 1, wagered: 5, won: 10, best: 'twoPair', biggest: 10 },
    }
    const reloaded = fromSave(JSON.stringify(toSave(startDouble(won, lcg(12)))))
    // baseline 100: credits must equal 100 + won - wagered once the stake is forfeited
    expect(reloaded.credits).toBe(100 + reloaded.stats.won - reloaded.stats.wagered)
  })

  it('a large but legitimate credit total (1,000,000,001) survives save and load', () => {
    const rich = { ...newGame(), credits: 1_000_000_001 }
    expect(fromSave(JSON.stringify(toSave(rich)))?.credits).toBe(1_000_000_001)
  })

  it('a tampered save cannot pollute Object.prototype', () => {
    const raw = '{"version":1,"credits":5,"bet":1,"stats":{"handsPlayed":0,"wagered":0,"won":0,"best":null,"biggest":0},"__proto__":{"polluted":"yes"}}'
    fromSave(raw)
    fromSave(raw.replace('"biggest":0}', '"biggest":0,"__proto__":{"polluted":"yes"}}'))
    expect({}.polluted).toBeUndefined()
  })

  it('a save with zero credits loads as a broke machine that cannot deal', () => {
    const broke = fromSave(JSON.stringify({ version: 1, credits: 0, bet: 5, stats: { handsPlayed: 3, wagered: 15, won: 0, best: null, biggest: 0 } }))
    expect(canStartOver(broke)).toBe(true)
    expect(deal(broke, lcg(13))).toBe(broke)
  })
})

// ---------- Celebration tiers vs the round 7 rules ----------

describe('celebration vs [RULES] (round 7 tiers)', () => {
  it('royal flush at bet 1 is still the biggest celebration', () => {
    expect(celebration({ key: 'royal', name: 'Royal Flush', win: 250 }, 1)).toBe(3)
  })

  it('a Double Up win of exactly 25x the bet is biggest; 24x is medium', () => {
    expect(celebration({ key: null, win: 125, double: 'win' }, 5)).toBe(3)
    expect(celebration({ key: null, win: 120, double: 'win' }, 5)).toBe(2)
  })
})
