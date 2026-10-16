import { createDeck, shuffle, evaluate, payout } from './poker.js'

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
  }
}

export function setBet(state, bet) {
  if (state.phase !== 'ready') return state
  return { ...state, bet: Math.min(MAX_BET, Math.max(1, bet)) }
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
  }
}

export function canStartOver(state) {
  return state.phase === 'ready' && state.credits < 1
}

export function startOver(state) {
  return canStartOver(state) ? newGame() : state
}
