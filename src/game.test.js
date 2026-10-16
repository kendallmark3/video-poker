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

import { canDouble, startDouble, pickDouble, collect } from './game.js'

const card = (rank, suit = 'S') => ({ rank, suit })
const afterWin = (win = 10, credits = 105) => ({
  ...newGame(),
  credits,
  bet: 5,
  result: { key: 'twoPair', name: 'Two Pair', win },
})
const inDouble = (dealerRank, choiceRanks, stake = 10, credits = 95) => ({
  ...afterWin(stake, credits),
  phase: 'double',
  double: { stake, dealer: card(dealerRank, 'H'), choices: choiceRanks.map((r) => card(r, 'C')), pick: null, outcome: null },
})

describe('double up: when it is offered', () => {
  it('is offered after a win only', () => {
    expect(canDouble(afterWin())).toBe(true)
    expect(canDouble({ ...afterWin(), result: { key: null, name: null, win: 0 } })).toBe(false)
    expect(canDouble(newGame())).toBe(false)
  })

  it('is not offered during a hand', () => {
    const holding = deal(newGame(), rng)
    expect(canDouble(holding)).toBe(false)
    expect(startDouble(holding, rng)).toBe(holding)
  })

  it('does nothing when not offered', () => {
    const s = newGame()
    expect(startDouble(s, rng)).toBe(s)
    expect(collect(s)).toBe(s)
    expect(pickDouble(s, 0)).toBe(s)
  })
})

describe('double up: stake and payouts', () => {
  it('takes the stake out of the credits and deals a dealer card plus four choices', () => {
    const s = startDouble(afterWin(10, 105), rng)
    expect(s.phase).toBe('double')
    expect(s.credits).toBe(95)
    expect(s.double.stake).toBe(10)
    expect(s.double.choices).toHaveLength(4)
    const ids = [s.double.dealer, ...s.double.choices].map(id)
    expect(new Set(ids).size).toBe(5)
  })

  it('pays double on a higher card', () => {
    const s = pickDouble(inDouble(9, [12, 2, 3, 4]), 0)
    expect(s.double.outcome).toBe('win')
    expect(s.result.win).toBe(20)
    expect(s.credits).toBe(115)
    expect(s.phase).toBe('ready')
  })

  it('returns the stake on a tie', () => {
    const s = pickDouble(inDouble(9, [2, 9, 3, 4]), 1)
    expect(s.double.outcome).toBe('push')
    expect(s.result.win).toBe(10)
    expect(s.credits).toBe(105)
  })

  it('loses the stake on a lower card', () => {
    const s = pickDouble(inDouble(9, [2, 3, 4, 8]), 3)
    expect(s.double.outcome).toBe('lose')
    expect(s.result.win).toBe(0)
    expect(s.credits).toBe(95)
    expect(canDouble(s)).toBe(false)
  })

  it('treats aces as high', () => {
    expect(pickDouble(inDouble(13, [14, 2, 3, 4]), 0).double.outcome).toBe('win')
    expect(pickDouble(inDouble(14, [13, 2, 3, 4]), 0).double.outcome).toBe('lose')
  })

  it('ignores a second pick', () => {
    const picked = { ...inDouble(9, [12, 2, 3, 4]), double: { ...inDouble(9, [12, 2, 3, 4]).double, pick: 0, outcome: 'win' } }
    expect(pickDouble(picked, 1)).toBe(picked)
  })
})

describe('double up: again and collect', () => {
  it('can double again after a win, and after a push', () => {
    const won = pickDouble(inDouble(9, [12, 2, 3, 4]), 0)
    expect(canDouble(won)).toBe(true)
    const again = startDouble(won, rng)
    expect(again.double.stake).toBe(20)
    expect(again.credits).toBe(won.credits - 20)
    expect(canDouble(pickDouble(inDouble(9, [9, 2, 3, 4]), 0))).toBe(true)
  })

  it('collect keeps the amount and ends the offer', () => {
    const won = pickDouble(inDouble(9, [12, 2, 3, 4]), 0)
    const kept = collect(won)
    expect(kept.credits).toBe(won.credits)
    expect(canDouble(kept)).toBe(false)
    expect(kept.double).toBeNull()
  })

  it('a new deal clears the double', () => {
    const won = pickDouble(inDouble(9, [12, 2, 3, 4]), 0)
    expect(deal(won, rng).double).toBeNull()
  })
})

describe('double up: normal play is blocked', () => {
  it('blocks deal, draw, hold, bet and start over during a double', () => {
    const s = inDouble(9, [12, 2, 3, 4], 10, 0)
    expect(deal(s, rng)).toBe(s)
    expect(draw(s)).toBe(s)
    expect(toggleHold(s, 0)).toBe(s)
    expect(setBet(s, 3)).toBe(s)
    expect(startOver(s)).toBe(s)
  })
})
