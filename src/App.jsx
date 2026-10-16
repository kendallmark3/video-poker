import { useEffect, useRef, useState } from 'react'
import { PAYTABLE, payout } from './poker.js'
import { newGame, setBet, deal, toggleHold, draw, startOver, canStartOver, MAX_BET } from './game.js'
import { SUIT_SYMBOL, rankLabel, cardName, isCourt, isRed, pipLayout } from './cards.js'

const COURT_FIGURE = { 11: '♞', 12: '♛', 13: '♚' }

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Display-only count-up. Counts from the value currently shown; snaps when the value drops.
function useCountUp(value) {
  const [shown, setShown] = useState(value)
  const shownRef = useRef(value)
  useEffect(() => {
    const start = shownRef.current
    if (value <= start || prefersReducedMotion()) {
      shownRef.current = value
      setShown(value)
      return
    }
    const duration = Math.min(1600, 300 + (value - start) * 10)
    const t0 = performance.now()
    let frame
    const tick = (now) => {
      const progress = Math.min(1, (now - t0) / duration)
      const next = Math.round(start + (value - start) * progress)
      shownRef.current = next
      setShown(next)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return shown
}

function Paytable({ bet, winKey }) {
  return (
    <table className="paytable" aria-label="Paytable">
      <tbody>
        {PAYTABLE.map((row) => (
          <tr key={row.key} className={row.key === winKey ? 'win-row' : undefined}>
            <th scope="row">{row.name}</th>
            {[1, 2, 3, 4, 5].map((b) => (
              <td key={b} className={b === bet ? 'active-col' : undefined}>
                {payout(row.key, b)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function CardCenter({ card }) {
  const symbol = SUIT_SYMBOL[card.suit]
  if (isCourt(card.rank)) {
    return (
      <span className="court" aria-hidden="true">
        <span className="court-rank">{rankLabel(card.rank)}</span>
        <span className="court-figure">{COURT_FIGURE[card.rank]}</span>
        <span className="court-suit">{symbol}</span>
      </span>
    )
  }
  if (card.rank === 14) {
    return (
      <span className="ace-pip" aria-hidden="true">
        {symbol}
      </span>
    )
  }
  return (
    <span className="pips" aria-hidden="true">
      {pipLayout(card.rank).map(([x, y, inverted], i) => (
        <span
          key={i}
          className={`pip-mark ${inverted ? 'inverted' : ''}`}
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          {symbol}
        </span>
      ))}
    </span>
  )
}

function Card({ card, held, canHold, onToggle, index, dealKey }) {
  return (
    <div className="slot">
      <div className={`held-badge ${card && held ? '' : 'hidden'}`}>HELD</div>
      {card ? (
        <button
          key={dealKey}
          className={`card face ${isRed(card.suit) ? 'red' : 'black'} ${held ? 'held' : ''}`}
          style={{ animationDelay: `${index * 70}ms` }}
          onClick={onToggle}
          disabled={!canHold}
          aria-pressed={canHold ? held : undefined}
          aria-label={`${cardName(card)}${held ? ', held' : ''}`}
        >
          <span className="corner top" aria-hidden="true">
            {rankLabel(card.rank)}
            <br />
            {SUIT_SYMBOL[card.suit]}
          </span>
          <CardCenter card={card} />
          <span className="corner bottom" aria-hidden="true">
            {rankLabel(card.rank)}
            <br />
            {SUIT_SYMBOL[card.suit]}
          </span>
        </button>
      ) : (
        <div className="card back" aria-hidden="true" />
      )}
      <kbd className="key-hint">{index + 1}</kbd>
    </div>
  )
}

function Message({ game }) {
  if (canStartOver(game)) return <span className="lose">Out of credits</span>
  if (game.phase === 'holding') return <span>Click cards to hold, then Draw</span>
  if (game.result?.win > 0)
    return (
      <span className="win">
        {game.result.name} — win {game.result.win}
      </span>
    )
  if (game.result) return <span className="lose">No win — deal again</span>
  return <span>Choose your bet and Deal</span>
}

export default function App() {
  const [game, setGame] = useState(newGame)
  const [handNo, setHandNo] = useState(0)
  const gameRef = useRef(game)
  gameRef.current = game

  const holding = game.phase === 'holding'
  const broke = canStartOver(game)

  // Every action checks the latest state, so buttons and keys share the same guards
  // and the hand number only changes when a deal actually happens.
  const actions = {
    dealDraw() {
      const g = gameRef.current
      if (g.phase === 'holding') setGame((s) => draw(s))
      else if (canStartOver(g)) setGame((s) => startOver(s))
      else {
        setGame((s) => deal(s))
        setHandNo((n) => n + 1)
      }
    },
    betOne() {
      if (gameRef.current.phase !== 'ready') return
      setGame((s) => setBet(s, s.bet >= MAX_BET ? 1 : s.bet + 1))
    },
    betMax() {
      const g = gameRef.current
      if (g.phase !== 'ready' || canStartOver(g)) return
      setGame((s) => deal(setBet(s, MAX_BET)))
      setHandNo((n) => n + 1)
    },
    hold(i) {
      setGame((s) => toggleHold(s, i))
    },
  }
  const actionsRef = useRef(actions)
  actionsRef.current = actions

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      const a = actionsRef.current
      const key = e.key.toLowerCase()
      if (key >= '1' && key <= '5') a.hold(Number(key) - 1)
      else if (key === ' ' || key === 'enter') a.dealDraw()
      else if (key === 'b') a.betOne()
      else if (key === 'm') a.betMax()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const win = useCountUp(game.result?.win ?? 0)
  const credits = useCountUp(game.credits)

  return (
    <main className="machine">
      <h1 className="title">Jacks or Better</h1>
      <Paytable bet={game.bet} winKey={game.phase === 'ready' ? game.result?.key : null} />

      <div className="message" role="status" aria-live="polite">
        <Message game={game} />
      </div>

      <section className="hand" aria-label="Your hand">
        {[0, 1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            index={i}
            card={game.hand[i]}
            held={game.held[i]}
            canHold={holding}
            onToggle={() => actions.hold(i)}
            dealKey={`${handNo}-${game.hand[i]?.rank}${game.hand[i]?.suit}`}
          />
        ))}
      </section>

      <section className="meters">
        <div className="meter">
          <span>Win</span>
          <strong data-testid="win">{win}</strong>
        </div>
        <div className="meter">
          <span>Bet</span>
          <strong>{game.bet}</strong>
        </div>
        <div className="meter">
          <span>Credits</span>
          <strong data-testid="credits">{credits}</strong>
        </div>
      </section>

      <section className="controls">
        {broke ? (
          <button className="btn primary" onClick={actions.dealDraw}>
            Start Over <kbd>Space</kbd>
          </button>
        ) : (
          <>
            <button className="btn" onClick={actions.betOne} disabled={holding}>
              Bet One <kbd>B</kbd>
            </button>
            <button className="btn" onClick={actions.betMax} disabled={holding}>
              Bet Max <kbd>M</kbd>
            </button>
            <button className="btn primary" onClick={actions.dealDraw}>
              {holding ? 'Draw' : 'Deal'} <kbd>Space</kbd>
            </button>
          </>
        )}
      </section>
    </main>
  )
}
