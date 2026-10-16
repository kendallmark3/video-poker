import { describe, it, expect } from 'vitest'
import { createDeck, shuffle, evaluate, payout, PAYTABLE } from './poker.js'

const RANK = { T: 10, J: 11, Q: 12, K: 13, A: 14 }
const hand = (text) =>
  text.split(' ').map((c) => ({ rank: RANK[c[0]] ?? Number(c[0]), suit: c[1] }))
const key = (text) => evaluate(hand(text))?.key ?? null

describe('deck', () => {
  it('has 52 unique cards', () => {
    const deck = createDeck()
    expect(deck).toHaveLength(52)
    expect(new Set(deck.map((c) => `${c.rank}${c.suit}`)).size).toBe(52)
  })

  it('shuffles deterministically with an injected random function and keeps every card', () => {
    const rng = () => 0.42
    const a = shuffle(createDeck(), rng)
    const b = shuffle(createDeck(), rng)
    expect(a).toEqual(b)
    expect(a).not.toEqual(createDeck())
    expect(new Set(a.map((c) => `${c.rank}${c.suit}`)).size).toBe(52)
  })
})

describe('hand evaluator', () => {
  it.each([
    ['TS JS QS KS AS', 'royal'],
    ['9H TH JH QH KH', 'straightFlush'],
    ['AD 2D 3D 4D 5D', 'straightFlush'],
    ['7C 7D 7H 7S 2C', 'fourKind'],
    ['3C 3D 3H 9S 9C', 'fullHouse'],
    ['2H 6H 9H JH KH', 'flush'],
    ['5C 6D 7H 8S 9C', 'straight'],
    ['TC JD QH KS AC', 'straight'],
    ['AC 2D 3H 4S 5C', 'straight'],
    ['8C 8D 8H KS 2C', 'threeKind'],
    ['4C 4D 9H 9S KC', 'twoPair'],
    ['JC JD 3H 7S 9C', 'jacksOrBetter'],
    ['AC AD 3H 7S 9C', 'jacksOrBetter'],
  ])('%s is %s', (cards, expected) => {
    expect(key(cards)).toBe(expected)
  })

  it.each([
    ['TC TD 3H 7S 9C'],
    ['2C 2D 5H 8S KC'],
    ['QC KD AH 2S 3C'],
    ['2C 5D 9H JS KC'],
  ])('%s pays nothing', (cards) => {
    expect(key(cards)).toBeNull()
  })

  it('names the winning hand', () => {
    expect(evaluate(hand('3C 3D 3H 9S 9C')).name).toBe('Full House')
  })
})

describe('payouts (9/6 Jacks or Better)', () => {
  it('lists the paytable from royal flush down', () => {
    expect(PAYTABLE.map((r) => [r.key, r.pays])).toEqual([
      ['royal', 250],
      ['straightFlush', 50],
      ['fourKind', 25],
      ['fullHouse', 9],
      ['flush', 6],
      ['straight', 4],
      ['threeKind', 3],
      ['twoPair', 2],
      ['jacksOrBetter', 1],
    ])
  })

  it('pays per credit for bets of 1 and 5', () => {
    expect(payout('fullHouse', 1)).toBe(9)
    expect(payout('fullHouse', 5)).toBe(45)
    expect(payout('jacksOrBetter', 1)).toBe(1)
    expect(payout('jacksOrBetter', 5)).toBe(5)
    expect(payout(null, 5)).toBe(0)
  })

  it('pays the royal flush bonus only on a 5-credit bet', () => {
    expect(payout('royal', 1)).toBe(250)
    expect(payout('royal', 4)).toBe(1000)
    expect(payout('royal', 5)).toBe(4000)
    expect(payout('royal', 5)).toBeGreaterThan(payout('straightFlush', 5))
  })
})
