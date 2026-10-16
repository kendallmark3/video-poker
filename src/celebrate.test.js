import { describe, it, expect } from 'vitest'
import { celebration } from './celebrate.js'

const hand = (key, win) => ({ key, name: key, win })

describe('celebration size', () => {
  it('stays quiet with no result or no win', () => {
    expect(celebration(null, 5)).toBe(0)
    expect(celebration(hand(null, 0), 5)).toBe(0)
  })

  it.each([
    ['jacksOrBetter', 1],
    ['twoPair', 1],
    ['threeKind', 1],
    ['straight', 2],
    ['flush', 2],
    ['fullHouse', 2],
    ['fourKind', 3],
    ['straightFlush', 3],
    ['royal', 3],
  ])('%s is level %i', (key, level) => {
    expect(celebration(hand(key, 10), 5)).toBe(level)
  })

  it('stays quiet on a Double Up push or loss', () => {
    expect(celebration({ key: null, name: 'Double Up push', win: 10, double: 'push' }, 5)).toBe(0)
    expect(celebration({ key: null, name: 'Double Up lost', win: 0, double: 'lose' }, 5)).toBe(0)
  })

  it('celebrates a Double Up win at medium or above', () => {
    expect(celebration({ key: null, name: 'Double Up won', win: 20, double: 'win' }, 5)).toBe(2)
    expect(celebration({ key: null, name: 'Double Up won', win: 160, double: 'win' }, 5)).toBe(3)
  })
})
