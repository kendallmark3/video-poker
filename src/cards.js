// Card face data: pure, so it can be tested without React.

const SUIT_NAME = { S: 'Spades', H: 'Hearts', D: 'Diamonds', C: 'Clubs' }
const RANK_LABEL = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }
const RANK_NAME = { 11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace' }

export const SUIT_SYMBOL = { S: '♠', H: '♥', D: '♦', C: '♣' }
export const rankLabel = (rank) => RANK_LABEL[rank] ?? String(rank)
export const cardName = (c) => `${RANK_NAME[c.rank] ?? c.rank} of ${SUIT_NAME[c.suit]}`
export const isCourt = (rank) => rank >= 11 && rank <= 13
export const isRed = (suit) => suit === 'H' || suit === 'D'

// Standard pip positions as [x%, y%] within the pip area.
const L = 28
const C = 50
const R = 72
const TOP = 12
const BOTTOM = 88
const corners = [[L, TOP], [R, TOP], [L, BOTTOM], [R, BOTTOM]]
const sides = [[L, C], [R, C]]

const LAYOUTS = {
  2: [[C, TOP], [C, BOTTOM]],
  3: [[C, TOP], [C, C], [C, BOTTOM]],
  4: corners,
  5: [...corners, [C, C]],
  6: [...corners, ...sides],
  7: [...corners, ...sides, [C, 31]],
  8: [...corners, ...sides, [C, 31], [C, 69]],
  9: [...corners, [L, 37], [R, 37], [L, 63], [R, 63], [C, C]],
  10: [...corners, [L, 37], [R, 37], [L, 63], [R, 63], [C, 24], [C, 76]],
}

// Pips in the bottom half are drawn upside down, as on real cards.
export function pipLayout(rank) {
  return (LAYOUTS[rank] ?? []).map(([x, y]) => [x, y, y > 50])
}
