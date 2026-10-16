import { describe, it, expect } from 'vitest'
import { pipLayout, rankLabel, cardName, isCourt } from './cards.js'

describe('pip layout', () => {
  it.each([2, 3, 4, 5, 6, 7, 8, 9, 10])('rank %i has exactly that many pips', (rank) => {
    expect(pipLayout(rank)).toHaveLength(rank)
  })

  it('places every pip inside the card with no two in the same spot', () => {
    for (let rank = 2; rank <= 10; rank++) {
      const pips = pipLayout(rank)
      for (const [x, y] of pips) {
        expect(x).toBeGreaterThan(0)
        expect(x).toBeLessThan(100)
        expect(y).toBeGreaterThan(0)
        expect(y).toBeLessThan(100)
      }
      expect(new Set(pips.map(([x, y]) => `${x},${y}`)).size).toBe(rank)
    }
  })

  it('turns the bottom-half pips upside down, as on real cards', () => {
    expect(pipLayout(2).map((p) => p[2])).toEqual([false, true])
  })

  it('has no pip grid for aces or court cards', () => {
    for (const rank of [11, 12, 13, 14]) expect(pipLayout(rank)).toEqual([])
  })
})

describe('labels', () => {
  it('labels and names cards', () => {
    expect(rankLabel(10)).toBe('10')
    expect(rankLabel(12)).toBe('Q')
    expect(cardName({ rank: 14, suit: 'S' })).toBe('Ace of Spades')
    expect(cardName({ rank: 7, suit: 'D' })).toBe('7 of Diamonds')
  })

  it('knows which ranks are court cards', () => {
    expect([10, 11, 12, 13, 14].map(isCourt)).toEqual([false, true, true, true, false])
  })
})
