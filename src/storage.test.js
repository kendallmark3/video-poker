import { describe, it, expect } from 'vitest'
import { toSave, fromSave, loadGame, saveGame, SAVE_KEY } from './storage.js'
import { newGame, setBet, deal, draw, toggleHold, startDouble } from './game.js'

const rng = () => 0.3
const memory = () => {
  const data = {}
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = String(v) }, data }
}
const played = () => {
  let s = deal(setBet(newGame(), 5), rng)
  s = draw([0, 1, 2, 3, 4].reduce(toggleHold, s))
  return s
}

describe('save and load', () => {
  it('round-trips credits, bet and stats into a ready-to-deal game', () => {
    const s = played()
    const restored = fromSave(JSON.stringify(toSave(s)))
    expect(restored.credits).toBe(s.credits)
    expect(restored.bet).toBe(5)
    expect(restored.stats).toEqual(s.stats)
    expect(restored.phase).toBe('ready')
    expect(restored.hand).toEqual([])
    expect(restored.result).toBeNull()
  })

  it('loads a fresh game when nothing is saved', () => {
    expect(loadGame(memory()).credits).toBe(100)
    expect(loadGame(null).credits).toBe(100)
  })

  it('saves to and loads from storage', () => {
    const store = memory()
    saveGame(store, played())
    expect(store.data[SAVE_KEY]).toBeTruthy()
    expect(loadGame(store).stats.handsPlayed).toBe(1)
  })
})

describe('rejects corrupt or tampered saves', () => {
  const good = () => toSave(played())
  it.each([
    ['not JSON', '{oops'],
    ['wrong version', JSON.stringify({ ...good(), version: 99 })],
    ['negative credits', JSON.stringify({ ...good(), credits: -5 })],
    ['fractional credits', JSON.stringify({ ...good(), credits: 10.5 })],
    ['bet of 0', JSON.stringify({ ...good(), bet: 0 })],
    ['bet of 9', JSON.stringify({ ...good(), bet: 9 })],
    ['string credits', JSON.stringify({ ...good(), credits: '500' })],
    ['unknown best hand', JSON.stringify({ ...good(), stats: { ...good().stats, best: 'fiveAces' } })],
    ['missing stats field', JSON.stringify({ ...good(), stats: { handsPlayed: 1 } })],
    ['huge credits', JSON.stringify({ ...good(), credits: 1e20 })],
    ['null', 'null'],
  ])('%s', (_, raw) => {
    expect(fromSave(raw)).toBeNull()
    const store = memory()
    store.setItem(SAVE_KEY, raw)
    expect(loadGame(store).credits).toBe(100)
  })

  it('accepts negative winnings after a lost Double Up', () => {
    const save = { ...good(), stats: { ...good().stats, won: -10 } }
    expect(fromSave(JSON.stringify(save)).stats.won).toBe(-10)
  })
})

describe('no refunds on reload', () => {
  it('a reload mid-hand keeps the bet taken', () => {
    const midHand = deal(setBet(newGame(), 5), rng)
    expect(fromSave(JSON.stringify(toSave(midHand))).credits).toBe(95)
  })

  it('a reload mid-double keeps the stake taken and does not overstate winnings', () => {
    const won = { ...newGame(), credits: 105, result: { key: 'twoPair', name: 'Two Pair', win: 10 }, stats: { handsPlayed: 1, wagered: 5, won: 10, best: 'twoPair', biggest: 10 } }
    const doubling = startDouble(won, rng)
    const restored = fromSave(JSON.stringify(toSave(doubling)))
    expect(restored.credits).toBe(95)
    expect(restored.stats.won).toBe(0)
  })
})

describe('storage failures never break the game', () => {
  it('survives storage that throws', () => {
    const broken = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('full') } }
    expect(loadGame(broken).credits).toBe(100)
    expect(() => saveGame(broken, newGame())).not.toThrow()
    expect(() => saveGame(null, newGame())).not.toThrow()
  })
})
