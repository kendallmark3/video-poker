import { createDeck, shuffle, evaluate, payout, PAYTABLE } from './poker.js'

export const STARTING_CREDITS = 100
export const MAX_BET = 5

// Pure state transitions. An action that is not valid in the current state
// returns the same state object, so the UI cannot put the game in a bad state.

export function newGame() {
  return {
    credits: STARTING_CREDITS,
    bet: 1,
    phase: 'ready', // 'ready' (betting) | 'holding' (between Deal and Draw)
    deck: [],
    hand: [],
    held: [false, false, false, false, false],
    result: null, // { key, name, win } after a draw
    double: null, // { stake, dealer, choices, pick, outcome } during and after Double Up
    stats: { handsPlayed: 0, wagered: 0, won: 0, best: null, biggest: 0 },
  }
}

// PAYTABLE is ordered best-first, so a lower index is a better hand.
const rank = (key) => (key ? PAYTABLE.findIndex((row) => row.key === key) : Infinity)

function recordWin(stats, key, win) {
  return {
    ...stats,
    won: stats.won + win,
    best: rank(key) < rank(stats.best) ? key : stats.best,
    biggest: Math.max(stats.biggest, win),
  }
}

export function returnPercent(stats) {
  return stats.wagered > 0 ? (stats.won / stats.wagered) * 100 : null
}

export function setBet(state, bet) {
  if (state.phase !== 'ready') return state
  // Bets are whole credits: ignore anything that is not a number, truncate fractions.
  if (typeof bet !== 'number' || Number.isNaN(bet)) return state
  return { ...state, bet: Math.min(MAX_BET, Math.max(1, Math.trunc(bet))) }
}

export function deal(state, rng = Math.random) {
  if (state.phase !== 'ready' || state.credits < 1) return state
  const bet = Math.min(state.bet, state.credits)
  const deck = shuffle(createDeck(), rng)
  return {
    ...state,
    bet,
    credits: state.credits - bet,
    phase: 'holding',
    hand: deck.slice(0, 5),
    deck: deck.slice(5),
    held: [false, false, false, false, false],
    result: null,
    double: null,
    stats: { ...state.stats, handsPlayed: state.stats.handsPlayed + 1, wagered: state.stats.wagered + bet },
  }
}

export function toggleHold(state, index) {
  if (state.phase !== 'holding') return state
  const held = state.held.map((h, i) => (i === index ? !h : h))
  return { ...state, held }
}

export function draw(state) {
  if (state.phase !== 'holding') return state
  const deck = [...state.deck]
  const hand = state.hand.map((card, i) => (state.held[i] ? card : deck.shift()))
  const paying = evaluate(hand)
  const win = payout(paying?.key ?? null, state.bet)
  return {
    ...state,
    deck,
    hand,
    phase: 'ready',
    credits: state.credits + win,
    result: { key: paying?.key ?? null, name: paying?.name ?? null, win },
    stats: recordWin(state.stats, paying?.key ?? null, win),
  }
}

export function canStartOver(state) {
  return state.phase === 'ready' && state.credits < 1
}

export function startOver(state) {
  return canStartOver(state) ? { ...newGame(), stats: state.stats } : state
}


// Double Up: after a win, risk it on a high-card game against the dealer.
// The win is already in the credits (see draw), so starting a double takes it back out as the stake.

export function canDouble(state) {
  return (
    state.phase === 'ready' &&
    state.result?.win > 0 &&
    !state.result.collected &&
    // A Double Up win adds the stake to the credits; keep credits an exact (safe) integer.
    state.credits + state.result.win <= Number.MAX_SAFE_INTEGER
  )
}

export function startDouble(state, rng = Math.random) {
  if (!canDouble(state)) return state
  const stake = state.result.win
  const deck = shuffle(createDeck(), rng)
  return {
    ...state,
    phase: 'double',
    credits: state.credits - stake,
    double: { stake, dealer: deck[0], choices: deck.slice(1, 5), pick: null, outcome: null },
  }
}

export function pickDouble(state, index) {
  const d = state.double
  if (state.phase !== 'double' || !d || d.pick !== null || !d.choices[index]) return state
  const mine = d.choices[index].rank
  const outcome = mine > d.dealer.rank ? 'win' : mine === d.dealer.rank ? 'push' : 'lose'
  const win = { win: d.stake * 2, push: d.stake, lose: 0 }[outcome]
  const name = { win: 'Double Up won', push: 'Double Up push', lose: 'Double Up lost' }[outcome]
  return {
    ...state,
    phase: 'ready',
    credits: state.credits + win,
    result: { key: null, name, win, double: outcome },
    double: { ...d, pick: index, outcome },
    stats: { ...state.stats, won: state.stats.won + win - d.stake, biggest: Math.max(state.stats.biggest, win) },
  }
}

export function collect(state) {
  if (!canDouble(state)) return state
  return { ...state, result: { ...state.result, collected: true }, double: null }
}
