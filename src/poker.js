export const SUITS = ['S', 'H', 'D', 'C']
export const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

// 9/6 Jacks or Better, paid per credit bet and returned in total.
export const PAYTABLE = [
  { key: 'royal', name: 'Royal Flush', pays: 250 },
  { key: 'straightFlush', name: 'Straight Flush', pays: 50 },
  { key: 'fourKind', name: 'Four of a Kind', pays: 25 },
  { key: 'fullHouse', name: 'Full House', pays: 9 },
  { key: 'flush', name: 'Flush', pays: 6 },
  { key: 'straight', name: 'Straight', pays: 4 },
  { key: 'threeKind', name: 'Three of a Kind', pays: 3 },
  { key: 'twoPair', name: 'Two Pair', pays: 2 },
  { key: 'jacksOrBetter', name: 'Jacks or Better', pays: 1 },
]

const ROYAL_MAX_BET_PAYOUT = 4000
const BY_KEY = Object.fromEntries(PAYTABLE.map((row) => [row.key, row]))

export function createDeck() {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit })))
}

// Fisher-Yates. `rng` is injectable so tests and replays are deterministic.
export function shuffle(deck, rng = Math.random) {
  const cards = [...deck]
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards
}

function isStraight(ranks) {
  const sorted = [...new Set(ranks)].sort((a, b) => a - b)
  if (sorted.length !== 5) return false
  if (sorted[4] - sorted[0] === 4) return true
  return sorted.join() === '2,3,4,5,14' // ace low; no wrap-around
}

function handKey(cards) {
  const ranks = cards.map((c) => c.rank)
  const flush = cards.every((c) => c.suit === cards[0].suit)
  const straight = isStraight(ranks)
  const counts = Object.values(
    ranks.reduce((acc, r) => ({ ...acc, [r]: (acc[r] ?? 0) + 1 }), {})
  ).sort((a, b) => b - a)

  if (straight && flush) return Math.min(...ranks) === 10 ? 'royal' : 'straightFlush'
  if (counts[0] === 4) return 'fourKind'
  if (counts[0] === 3 && counts[1] === 2) return 'fullHouse'
  if (flush) return 'flush'
  if (straight) return 'straight'
  if (counts[0] === 3) return 'threeKind'
  if (counts[0] === 2 && counts[1] === 2) return 'twoPair'
  if (counts[0] === 2) {
    const pair = ranks.find((r) => ranks.filter((x) => x === r).length === 2)
    return pair >= 11 ? 'jacksOrBetter' : null
  }
  return null
}

// Returns the paying hand ({ key, name, pays }) or null.
export function evaluate(cards) {
  const key = handKey(cards)
  return key ? BY_KEY[key] : null
}

export function payout(key, bet) {
  if (!key) return 0
  if (key === 'royal' && bet === 5) return ROYAL_MAX_BET_PAYOUT
  return BY_KEY[key].pays * bet
}
