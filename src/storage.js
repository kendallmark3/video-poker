import { PAYTABLE } from './poker.js'
import { newGame, MAX_BET } from './game.js'

// Saved progress: credits, bet and session stats only. Saved data is untrusted input,
// so it is validated field by field; anything invalid falls back to a fresh game.

export const SAVE_KEY = 'videopoker.save'
const VERSION = 1
const MAX_CREDITS = 1_000_000_000
const HANDS = new Set(PAYTABLE.map((row) => row.key))

const count = (n) => Number.isSafeInteger(n) && n >= 0
const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v)

export function toSave(state) {
  const stats = { ...state.stats }
  // Mid-double, the stake is out of the credits but still counted in `won`.
  // A reload forfeits the stake, so take it out of `won` too.
  if (state.phase === 'double' && state.double) stats.won -= state.double.stake
  return { version: VERSION, credits: state.credits, bet: state.bet, stats }
}

export function fromSave(raw) {
  let data
  try {
    data = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return null
  }
  if (!isObject(data) || data.version !== VERSION) return null
  const { credits, bet, stats } = data
  if (!count(credits) || credits > MAX_CREDITS) return null
  if (!Number.isSafeInteger(bet) || bet < 1 || bet > MAX_BET) return null
  if (!isObject(stats)) return null
  const { handsPlayed, wagered, won, best, biggest } = stats
  if (![handsPlayed, wagered, biggest].every(count)) return null
  if (!Number.isSafeInteger(won)) return null // can be negative after a lost Double Up
  if (best !== null && !HANDS.has(best)) return null
  // Whatever phase the game was saved in, it comes back ready to deal.
  return { ...newGame(), credits, bet, stats: { handsPlayed, wagered, won, best, biggest } }
}

export function loadGame(storage) {
  try {
    return fromSave(storage?.getItem(SAVE_KEY) ?? null) ?? newGame()
  } catch {
    return newGame()
  }
}

export function saveGame(storage, state) {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(toSave(state)))
  } catch {
    // Storage blocked or full: keep playing without saving.
  }
}
