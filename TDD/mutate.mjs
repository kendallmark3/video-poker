// Mutation check: proves the TDD suite can fail.
// 1. Run the suite on the original code and record which tests already fail.
// 2. For each mutation: plant one deliberate bug, rerun, and count it CAUGHT only if a test
//    that passed on the original now fails. Always restore the file, even on error.
// Usage: node TDD/mutate.mjs

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(mkdtempSync(join(tmpdir(), 'mutate-')), 'result.json')

const MUTATIONS = [
  { name: 'shuffle off-by-one (Sattolo: a card can never stay put)', file: 'src/poker.js',
    from: 'const j = Math.floor(rng() * (i + 1))', to: 'const j = Math.floor(rng() * i)' },
  { name: 'evaluator forgets the ace-low straight', file: 'src/poker.js',
    from: "return sorted.join() === '2,3,4,5,14'", to: 'return false' },
  { name: 'royal decided by "has an ace" instead of "starts at 10"', file: 'src/poker.js',
    from: "Math.min(...ranks) === 10 ? 'royal'", to: "Math.max(...ranks) === 14 ? 'royal'" },
  { name: 'royal bonus paid from 4 credits up', file: 'src/poker.js',
    from: "key === 'royal' && bet === 5", to: "key === 'royal' && bet >= 4" },
  { name: 'draw reuses the same replacement card', file: 'src/game.js',
    from: 'state.held[i] ? card : deck.shift()', to: 'state.held[i] ? card : deck[0]' },
  { name: 'Double Up ties count as wins', file: 'src/game.js',
    from: "mine > d.dealer.rank ? 'win'", to: "mine >= d.dealer.rank ? 'win'" },
  { name: 'save forgets to forfeit the Double Up stake', file: 'src/storage.js',
    from: 'if (state.phase === \'double\' && state.double) stats.won -= state.double.stake', to: '' },
]

function failingTests() {
  try {
    execFileSync('npx', ['vitest', 'run', '--config', 'TDD/vitest.config.js', '--reporter=json', `--outputFile=${OUT}`], { cwd: ROOT, stdio: 'ignore' })
  } catch {
    // a non-zero exit just means some tests failed; the JSON report has the details
  }
  const report = JSON.parse(readFileSync(OUT, 'utf8'))
  return new Set(report.testResults.flatMap((f) => f.assertionResults).filter((t) => t.status !== 'passed').map((t) => t.fullName))
}

const baseline = failingTests()
console.log(`Baseline: ${baseline.size} test(s) already failing on the original code (ignored when judging mutants).\n`)

let caught = 0
for (const m of MUTATIONS) {
  const path = join(ROOT, m.file)
  const original = readFileSync(path, 'utf8')
  if (!original.includes(m.from)) throw new Error(`Mutation target not found in ${m.file}: ${m.from}`)
  let newlyFailing = []
  try {
    writeFileSync(path, original.replace(m.from, m.to))
    newlyFailing = [...failingTests()].filter((t) => !baseline.has(t))
  } finally {
    writeFileSync(path, original)
  }
  const ok = newlyFailing.length > 0
  if (ok) caught++
  console.log(`${ok ? 'CAUGHT ' : 'MISSED '} ${m.name} (${m.file})`)
  for (const t of newlyFailing.slice(0, 3)) console.log(`         ↳ ${t}`)
}

console.log(`\n${caught}/${MUTATIONS.length} mutants caught.`)
try {
  execFileSync('git', ['diff', '--quiet', '--', 'src/'], { cwd: ROOT })
  console.log('src/ restored: git diff is clean.')
} catch {
  console.log('WARNING: src/ differs from git after the run.')
  process.exitCode = 1
}
if (caught < MUTATIONS.length) process.exitCode = 1
