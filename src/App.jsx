import { useEffect, useRef, useState } from 'react'
import { PAYTABLE, payout } from './poker.js'
import {
  newGame, setBet, deal, toggleHold, draw, startOver, canStartOver, MAX_BET,
  canDouble, startDouble, pickDouble, collect, returnPercent,
} from './game.js'
import { createSound } from './sound.js'
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

function Card({ card, held, canHold, onToggle, index, dealKey, faceDown, topLabel, hint = index + 1 }) {
  const badge = topLabel ?? (card && held ? 'HELD' : null)
  return (
    <div className="slot">
      <div className={`held-badge ${badge ? '' : 'hidden'} ${topLabel === 'DEALER' ? 'dealer' : ''}`}>{badge ?? 'HELD'}</div>
      {faceDown ? (
        <button
          key={dealKey}
          className="card back pickable"
          style={{ animationDelay: `${index * 70}ms` }}
          onClick={onToggle}
          disabled={!canHold}
          aria-label={`Face-down card ${hint}`}
        />
      ) : card ? (
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
      <kbd className={`key-hint ${hint ? '' : 'hidden'}`}>{hint ?? '·'}</kbd>
    </div>
  )
}

function Stats({ stats }) {
  const pct = returnPercent(stats)
  const best = PAYTABLE.find((row) => row.key === stats.best)?.name ?? '—'
  const items = [
    ['Hands', stats.handsPlayed],
    ['Wagered', stats.wagered],
    ['Won', stats.won],
    ['Return', pct === null ? '—' : `${pct.toFixed(1)}%`],
    ['Best hand', best],
    ['Biggest win', stats.biggest],
  ]
  return (
    <dl className="stats" aria-label="Session stats">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Message({ game }) {
  if (game.phase === 'double') return <span>Pick a card higher than the dealer — 1 to 4</span>
  if (game.result?.double === 'win')
    return <span className="win">Double Up won — win {game.result.win}</span>
  if (game.result?.double === 'push')
    return <span className="win">Push — {game.result.win} kept</span>
  if (game.result?.double === 'lose') return <span className="lose">Double Up lost</span>
  if (canStartOver(game)) return <span className="lose">Out of credits</span>
  if (game.phase === 'holding') return <span>Click cards to hold, then Draw</span>
  if (game.result?.win > 0)
    return (
      <span className="win">
        {game.result.name} — win {game.result.win}
        {canDouble(game) ? ' · Double Up?' : ''}
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

  // One sound engine for the app's lifetime (safe under StrictMode's double mount).
  const soundRef = useRef(null)
  if (!soundRef.current) soundRef.current = createSound()
  const [soundOn, setSoundOn] = useState(false)

  // Sounds follow state changes, so the pure game logic and actions stay sound-free.
  const prevRef = useRef(game)
  useEffect(() => {
    const prev = prevRef.current
    prevRef.current = game
    if (prev === game) return
    const play = soundRef.current.play
    if (game.phase === 'holding' && prev.phase !== 'holding') play('deal')
    else if (game.phase === 'holding') play('hold')
    else if (prev.phase === 'holding' && game.phase === 'ready') play(game.result.win > 0 ? 'win' : 'lose')
    else if (game.phase === 'double' && prev.phase !== 'double') play('double')
    else if (prev.phase === 'double' && game.phase === 'ready') play(game.result.double)
  }, [game])

  const holding = game.phase === 'holding'
  const broke = canStartOver(game)

  // Every action checks the latest state, so buttons and keys share the same guards
  // and the hand number only changes when a deal actually happens.
  const actions = {
    dealDraw() {
      const g = gameRef.current
      if (g.phase === 'double') return
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
    double() {
      setGame((s) => startDouble(s))
    },
    collect() {
      setGame((s) => collect(s))
    },
    pick(i) {
      setGame((s) => pickDouble(s, i))
    },
    toggleSound() {
      const sound = soundRef.current
      sound.setEnabled(!sound.enabled) // runs inside the click or key press, as browsers require
      setSoundOn(sound.enabled)
      sound.play('hold')
    },
  }
  const actionsRef = useRef(actions)
  actionsRef.current = actions

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      const a = actionsRef.current
      const key = e.key.toLowerCase()
      const inDouble = gameRef.current.phase === 'double'
      if (inDouble && key >= '1' && key <= '4') a.pick(Number(key) - 1)
      else if (!inDouble && key >= '1' && key <= '5') a.hold(Number(key) - 1)
      else if (key === 'd') a.double()
      else if (key === 'c') a.collect()
      else if (key === 's') a.toggleSound()
      else if (key === ' ' || key === 'enter') a.dealDraw()
      else if (key === 'b') a.betOne()
      else if (key === 'm') a.betMax()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const inDouble = game.phase === 'double'
  const offerDouble = canDouble(game)
  const win = useCountUp(inDouble ? game.double.stake : game.result?.win ?? 0)
  const credits = useCountUp(game.credits)

  return (
    <main className="machine">
      <button
        className={`sound-toggle ${soundOn ? 'on' : ''}`}
        onClick={actions.toggleSound}
        aria-pressed={soundOn}
      >
        {soundOn ? '🔊 Sound on' : '🔇 Sound off'} <kbd>S</kbd>
      </button>
      <h1 className="title">Jacks or Better</h1>
      <Paytable bet={game.bet} winKey={game.phase === 'ready' ? game.result?.key : null} />

      <div className="message" role="status" aria-live="polite">
        <Message game={game} />
      </div>

      <section className="hand" aria-label={game.double ? 'Double Up' : 'Your hand'}>
        {game.double ? (
          <>
            <Card
              index={0}
              card={game.double.dealer}
              topLabel="DEALER"
              hint={null}
              canHold={false}
              dealKey={`dbl-${game.double.stake}-${game.double.dealer.rank}${game.double.dealer.suit}`}
            />
            {game.double.choices.map((c, i) => (
              <Card
                key={i}
                index={i + 1}
                card={c}
                faceDown={game.double.pick === null}
                topLabel={game.double.pick === i ? 'YOUR PICK' : null}
                hint={inDouble ? i + 1 : null}
                canHold={inDouble}
                onToggle={() => actions.pick(i)}
                dealKey={`dbl-${game.double.stake}-${c.rank}${c.suit}-${game.double.pick === null}`}
              />
            ))}
          </>
        ) : [0, 1, 2, 3, 4].map((i) => (
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
          <span>{inDouble ? 'At risk' : 'Win'}</span>
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
            {offerDouble ? (
              <>
                <button className="btn double" onClick={actions.double}>
                  Double Up <kbd>D</kbd>
                </button>
                <button className="btn" onClick={actions.collect}>
                  Collect <kbd>C</kbd>
                </button>
              </>
            ) : (
              <>
                <button className="btn" onClick={actions.betOne} disabled={holding || inDouble}>
                  Bet One <kbd>B</kbd>
                </button>
                <button className="btn" onClick={actions.betMax} disabled={holding || inDouble}>
                  Bet Max <kbd>M</kbd>
                </button>
              </>
            )}
            <button className="btn primary" onClick={actions.dealDraw} disabled={inDouble}>
              {holding ? 'Draw' : 'Deal'} <kbd>Space</kbd>
            </button>
          </>
        )}
      </section>

      <Stats stats={game.stats} />
    </main>
  )
}
