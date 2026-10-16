// How big a win celebration to show: 0 (none) to 3 (biggest). Pure, so it can be tested.

const TIER = {
  jacksOrBetter: 1,
  twoPair: 1,
  threeKind: 1,
  straight: 2,
  flush: 2,
  fullHouse: 2,
  fourKind: 3,
  straightFlush: 3,
  royal: 3,
}

export function celebration(result, bet) {
  if (!result) return 0
  // Check Double Up first: a push has win > 0 but is not a win.
  if (result.double) return result.double === 'win' ? (result.win >= 25 * bet ? 3 : 2) : 0
  if (!(result.win > 0)) return 0
  return TIER[result.key] ?? 0
}
