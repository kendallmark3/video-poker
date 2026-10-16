import { describe, it, expect } from 'vitest'
import { newGame, setBet, deal, toggleHold, draw, startOver } from './game.js'

const rng = () => 0.3
const id = (c) => `${c.rank}${c.suit}`

describe('game flow', () => {
  it('starts with 100 credits, bet 1, ready to deal', () => {
    const s = newGame()
    expect(s.credits).toBe(100)
    expect(s.bet).toBe(1)
    expect(s.phase).toBe('ready')
  })

  it('takes the bet on deal and deals 5 cards', () => {
    const s = deal(setBet(newGame(), 5), rng)
    expect(s.credits).toBe(95)
    expect(s.hand).toHaveLength(5)
    expect(s.phase).toBe('holding')
  })

  it('keeps held cards, replaces the rest, and never repeats a card', () => {
    let s = deal(newGame(), rng)
    const before = s.hand
    s = toggleHold(s, 0)
    s = toggleHold(s, 2)
    const after = draw(s).hand
    expect(after[0]).toEqual(before[0])
    expect(after[2]).toEqual(before[2])
    for (const i of [1, 3, 4]) expect(id(after[i])).not.toBe(id(before[i]))
    const seen = [...before, ...after.filter((_, i) => ![0, 2].includes(i))].map(id)
    expect(new Set(seen).size).toBe(seen.length)
  })

  it('credits the payout after the draw', () => {
    let s = deal(setBet(newGame(), 5), rng)
    s = [0, 1, 2, 3, 4].reduce(toggleHold, s)
    const result = draw(s)
    expect(result.phase).toBe('ready')
    expect(result.credits).toBe(95 + result.result.win)
  })
})

describe('only valid actions', () => {
  it('ignores holds before a deal and after the draw', () => {
    const s = newGame()
    expect(toggleHold(s, 0)).toBe(s)
    const done = draw(deal(s, rng))
    expect(toggleHold(done, 0)).toBe(done)
  })

  it('does not change the bet during a hand', () => {
    const s = deal(newGame(), rng)
    expect(setBet(s, 5)).toBe(s)
  })

  it('does not draw before a deal or deal twice', () => {
    const s = newGame()
    expect(draw(s)).toBe(s)
    const dealt = deal(s, rng)
    expect(deal(dealt, rng)).toBe(dealt)
  })

  it('keeps the bet between 1 and 5', () => {
    expect(setBet(newGame(), 9).bet).toBe(5)
    expect(setBet(newGame(), 0).bet).toBe(1)
  })

  it('bets only what the player can cover', () => {
    const s = deal(setBet({ ...newGame(), credits: 3 }, 5), rng)
    expect(s.bet).toBe(3)
    expect(s.credits).toBe(0)
  })

  it('offers Start Over only when credits run out, and resets to 100', () => {
    const s = newGame()
    expect(startOver(s)).toBe(s)
    const broke = { ...s, credits: 0 }
    expect(startOver(broke).credits).toBe(100)
    expect(deal(broke, rng)).toBe(broke)
  })
})
