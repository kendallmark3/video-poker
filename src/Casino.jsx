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
      <FloorScene />
      <div className="vignette" />
    </div>
  )
}

const GLOW = ['#ff4fa3', '#ffd54a', '#3fe0d0', '#b07cff', '#ff8a3d']
const NAMED_SEATS = { 4: 'Carla', 8: 'Stephanie' } // stool index (from 0) -> name plate
const SILHOUETTE = '#0a0210'
const RIM = { stroke: '#ff4fa3', strokeOpacity: 0.55, strokeWidth: 2 }

function Stool({ cx, name }) {
  return (
    <g>
      <rect x={cx - 28} y="204" width="56" height="42" rx="7" fill="#2a0b2e" stroke="#5a1d55" strokeWidth="2" />
      {name && (
        <g>
          <rect x={cx - 48} y="211" width="96" height="26" rx="5" fill="#ffd54a" stroke="#a8740e" strokeWidth="2" />
          <text x={cx} y="229" textAnchor="middle" fontSize="16" fontWeight="700" fill="#2a1700" fontFamily="Georgia, serif">
            {name}
          </text>
        </g>
      )}
      <ellipse cx={cx} cy="252" rx="34" ry="9" fill="#3b1240" />
      <rect x={cx - 3} y="258" width="6" height="32" fill="#5a1d55" />
      <ellipse cx={cx} cy="293" rx="22" ry="5" fill="#3b1240" />
    </g>
  )
}

// A seated, faceless onlooker on a bar stool, glass raised. dir = 1 faces right, -1 faces left.
function Onlooker({ cx, dir, name }) {
  const hand = [cx + dir * 20, 158]
  return (
    <g>
      <ellipse cx={cx} cy="252" rx="26" ry="7" fill="#3b1240" />
      <rect x={cx - 3} y="257" width="6" height="34" fill="#5a1d55" />
      <ellipse cx={cx} cy="293" rx="18" ry="4" fill="#3b1240" />
      <rect x={dir > 0 ? cx : cx - 36} y="234" width="36" height="15" rx="7" fill={SILHOUETTE} {...RIM} />
      <rect x={cx + dir * 30 - 6} y="240" width="12" height="50" rx="6" fill={SILHOUETTE} {...RIM} />
      <rect x={cx - 20} y="168" width="40" height="80" rx="18" fill={SILHOUETTE} {...RIM} />
      <circle cx={cx} cy="148" r="18" fill={SILHOUETTE} {...RIM} />
      <polyline
        points={`${cx + dir * 12},180 ${cx + dir * 34},204 ${hand[0]},${hand[1]}`}
        fill="none"
        stroke={SILHOUETTE}
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`${hand[0] - 10},${hand[1] - 18} ${hand[0] + 10},${hand[1] - 18} ${hand[0]},${hand[1] - 5}`}
        fill="rgba(127, 211, 255, 0.55)"
        stroke="#cfefff"
        strokeWidth="1.5"
      />
      <line x1={hand[0]} y1={hand[1] - 5} x2={hand[0]} y2={hand[1] + 4} stroke="#cfefff" strokeWidth="1.5" />
      <circle cx={hand[0] + 3} cy={hand[1] - 14} r="2.5" fill="#7cd36b" />
      <text x={cx} y="122" textAnchor="middle" fontSize="14" fontWeight="700" fill="rgba(255, 255, 255, 0.6)" letterSpacing="1">
        {name}
      </text>
    </g>
  )
}

function FloorScene() {
  const machines = Array.from({ length: 13 }, (_, i) => i)
  return (
    <svg className="slot-row" viewBox="0 0 1600 300" preserveAspectRatio="xMidYMax slice">
      {machines.map((i) => {
        const x = 12 + i * 104
        const c = GLOW[i % GLOW.length]
        return (
          <g key={i}>
            <rect x={x} y="20" width="84" height="180" rx="14" fill="#16051c" stroke="#3b1240" strokeWidth="2" />
            <rect x={x + 8} y="28" width="68" height="22" rx="6" fill={c} opacity="0.85" />
            <rect x={x + 12} y="62" width="60" height="44" rx="6" fill={c} opacity="0.35" />
            <rect x={x + 18} y="68" width="14" height="32" rx="3" fill="#fff" opacity="0.5" />
            <rect x={x + 35} y="68" width="14" height="32" rx="3" fill="#fff" opacity="0.5" />
            <rect x={x + 52} y="68" width="14" height="32" rx="3" fill="#fff" opacity="0.5" />
            <rect x={x + 22} y="120" width="40" height="10" rx="5" fill={c} opacity="0.6" />
            <Stool cx={x + 42} name={NAMED_SEATS[i]} />
          </g>
        )
      })}
      <g>
        <ellipse cx="1472" cy="214" rx="46" ry="9" fill="#3b1240" stroke="#ffd54a" strokeOpacity="0.5" />
        <rect x="1469" y="220" width="6" height="70" fill="#5a1d55" />
        <ellipse cx="1472" cy="293" rx="24" ry="5" fill="#3b1240" />
        <Onlooker cx={1400} dir={1} name="Mark" />
        <Onlooker cx={1544} dir={-1} name="Brandon" />
      </g>
    </svg>
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
