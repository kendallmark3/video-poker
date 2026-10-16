import { useState } from 'react'
import { PAYTABLE, payout } from './poker.js'
import { newGame, setBet, deal, toggleHold, draw, startOver, canStartOver, MAX_BET } from './game.js'

const SUIT_SYMBOL = { S: '♠', H: '♥', D: '♦', C: '♣' }
const SUIT_NAME = { S: 'Spades', H: 'Hearts', D: 'Diamonds', C: 'Clubs' }
const RANK_LABEL = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }
const RANK_NAME = { 11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace' }

const label = (rank) => RANK_LABEL[rank] ?? String(rank)
const cardName = (c) => `${RANK_NAME[c.rank] ?? c.rank} of ${SUIT_NAME[c.suit]}`

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

function Card({ card, held, canHold, onToggle, index, dealKey }) {
  if (!card) {
    return (
      <div className="slot">
        <div className="held-badge hidden">HELD</div>
        <div className="card back" aria-hidden="true" />
      </div>
    )
  }
  const red = card.suit === 'H' || card.suit === 'D'
  return (
    <div className="slot">
      <div className={`held-badge ${held ? '' : 'hidden'}`}>HELD</div>
      <button
        key={dealKey}
        className={`card face ${red ? 'red' : 'black'} ${held ? 'held' : ''}`}
        style={{ animationDelay: `${index * 70}ms` }}
        onClick={onToggle}
        disabled={!canHold}
        aria-pressed={canHold ? held : undefined}
        aria-label={`${cardName(card)}${held ? ', held' : ''}`}
      >
        <span className="corner top">
          {label(card.rank)}
          <br />
          {SUIT_SYMBOL[card.suit]}
        </span>
        <span className="pip">{SUIT_SYMBOL[card.suit]}</span>
        <span className="corner bottom">
          {label(card.rank)}
          <br />
          {SUIT_SYMBOL[card.suit]}
        </span>
      </button>
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
  const holding = game.phase === 'holding'

  // Always update from the latest state, so quick successive clicks are never lost.
  const onDealDraw = () => {
    if (holding) setGame((g) => draw(g))
    else {
      setGame((g) => deal(g))
      setHandNo((n) => n + 1)
    }
  }
  const onBetOne = () => setGame((g) => setBet(g, g.bet >= MAX_BET ? 1 : g.bet + 1))
  const onBetMax = () => {
    setGame((g) => deal(setBet(g, MAX_BET)))
    setHandNo((n) => n + 1)
  }

  const broke = canStartOver(game)
  const lastWin = game.result?.win ?? 0

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
            onToggle={() => setGame((g) => toggleHold(g, i))}
            dealKey={`${handNo}-${game.hand[i]?.rank}${game.hand[i]?.suit}`}
          />
        ))}
      </section>

      <section className="meters">
        <div className="meter">
          <span>Win</span>
          <strong>{lastWin}</strong>
        </div>
        <div className="meter">
          <span>Bet</span>
          <strong>{game.bet}</strong>
        </div>
        <div className="meter">
          <span>Credits</span>
          <strong>{game.credits}</strong>
        </div>
      </section>

      <section className="controls">
        {broke ? (
          <button className="btn primary" onClick={() => setGame((g) => startOver(g))}>
            Start Over
          </button>
        ) : (
          <>
            <button className="btn" onClick={onBetOne} disabled={holding}>
              Bet One
            </button>
            <button className="btn" onClick={onBetMax} disabled={holding}>
              Bet Max
            </button>
            <button className="btn primary" onClick={onDealDraw}>
              {holding ? 'Draw' : 'Deal'}
            </button>
          </>
        )}
      </section>
    </main>
  )
}
