import { useEffect, useRef } from 'react'

// Decorative casino scene and win celebration. Positions come from the index
// (golden-ratio spacing), never Math.random, so seeded deals stay deterministic.

const GOLDEN = 0.6180339887
const spread = (i, offset = 0) => (((i + offset) * GOLDEN) % 1) * 100

const LIGHT_COLORS = ['#ffd54a', '#ff4fa3', '#3fe0d0', '#ff8a3d', '#b07cff']

export function CasinoBackdrop() {
  const lights = Array.from({ length: 28 }, (_, i) => ({
    left: spread(i),
    top: spread(i, 0.37) * 0.7,
    size: 40 + ((i * 37) % 120),
    color: LIGHT_COLORS[i % LIGHT_COLORS.length],
    delay: (i % 7) * 0.8,
    duration: 4 + (i % 5),
  }))
  const machines = Array.from({ length: 14 }, (_, i) => i)
  const glow = ['#ff4fa3', '#ffd54a', '#3fe0d0', '#b07cff', '#ff8a3d']

  return (
    <div className="casino-bg" aria-hidden="true">
      <div className="chandelier" />
      {lights.map((l, i) => (
        <span
          key={i}
          className="bokeh"
          style={{
            left: `${l.left}%`,
            top: `${l.top}%`,
            width: l.size,
            height: l.size,
            background: l.color,
            animationDelay: `${l.delay}s`,
            animationDuration: `${l.duration}s`,
          }}
        />
      ))}
      <svg className="slot-row" viewBox="0 0 1400 220" preserveAspectRatio="xMidYMax slice">
        {machines.map((i) => {
          const x = i * 100 + 8
          const c = glow[i % glow.length]
          return (
            <g key={i}>
              <rect x={x} y="40" width="84" height="180" rx="14" fill="#16051c" stroke="#3b1240" strokeWidth="2" />
              <rect x={x + 8} y="48" width="68" height="22" rx="6" fill={c} opacity="0.85" />
              <rect x={x + 12} y="82" width="60" height="44" rx="6" fill={c} opacity="0.35" />
              <rect x={x + 18} y="88" width="14" height="32" rx="3" fill="#fff" opacity="0.5" />
              <rect x={x + 35} y="88" width="14" height="32" rx="3" fill="#fff" opacity="0.5" />
              <rect x={x + 52} y="88" width="14" height="32" rx="3" fill="#fff" opacity="0.5" />
              <rect x={x + 22} y="140" width="40" height="10" rx="5" fill={c} opacity="0.6" />
            </g>
          )
        })}
      </svg>
      <div className="vignette" />
    </div>
  )
}

const COINS = { 1: 16, 2: 34, 3: 64 }
const SHOWER_MS = 3600

export function CoinShower({ level, onDone }) {
  // The parent re-renders many times a second during the win count-up, so keep the
  // latest callback in a ref and start the timer once: the shower always ends on time.
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  useEffect(() => {
    const t = setTimeout(() => doneRef.current(), SHOWER_MS)
    return () => clearTimeout(t)
  }, [])

  const coins = Array.from({ length: COINS[level] ?? 0 }, (_, i) => ({
    left: spread(i, 0.13),
    delay: ((i * 7) % 10) * 0.08,
    duration: 1.8 + ((i * 3) % 10) * 0.1,
    size: 20 + ((i * 11) % 16),
  }))

  return (
    <div className="coin-shower" aria-hidden="true">
      {level === 3 && <div className="big-win">Huge win!</div>}
      {coins.map((c, i) => (
        <span
          key={i}
          className="coin"
          style={{
            left: `${c.left}%`,
            width: c.size,
            height: c.size,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
          }}
        >
          C
        </span>
      ))}
    </div>
  )
}
