# Jacks or Better Video Poker

A browser video poker machine built with React, driven by the intent files in [intents/](intents/).

## Run

```bash
npm install
npm run dev      # play at the URL Vite prints (usually http://localhost:5173)
npm test         # rules and game-flow tests
npm run build    # production build in dist/
```

## How to play

1. **Bet One** raises the bet by 1 (1 to 5, then back to 1). **Bet Max** sets the bet to 5 and deals.
2. **Deal** gives you five cards. Click the cards you want to keep; they show **HELD**.
3. **Draw** replaces every card you didn't hold. Winning hands pay from the paytable, and the row lights up.
4. You start with 100 play-money credits. When you run out, **Start Over** resets to 100.

### Keyboard

| Key | Action |
|---|---|
| `1`–`5` | Hold or release that card |
| `Space` / `Enter` | Deal, Draw, or Start Over |
| `B` | Bet One |
| `M` | Bet Max (deals) |
| `D` / `C` | Double Up / Collect (after a win) |
| `1`–`4` | Pick a card during Double Up |
| `S` | Sound on / off (starts off) |

### Double Up

After any win you can **Double Up** or **Collect**.

1. **Start:** Double Up takes the win out of your credits as the stake, then shows the dealer's card and four face-down cards.
2. **Pick:** choose one of the four. Aces are high.
   - **Higher:** the stake is doubled and paid.
   - **Equal:** the stake is returned (push).
   - **Lower:** the stake is lost.
3. **Keep going or stop:** after a win or a push you can double again, collect, or just deal the next hand. Collecting or dealing keeps what you've won.

### Sound and stats

- **Sound:** effects are synthesized in the browser (Web Audio), with no audio files. Sound starts off; press `S` or the Sound button to turn it on.
- **Stats:** the panel under the machine shows hands played, credits wagered and won, your return percentage, your best hand, and your biggest win. Double Up results count toward credits won. Start Over keeps the session stats.

## Rules (9/6 Jacks or Better)

| Hand | Pays per credit |
|---|---|
| Royal Flush | 250 (4,000 on a 5-credit bet) |
| Straight Flush | 50 |
| Four of a Kind | 25 |
| Full House | 9 |
| Flush | 6 |
| Straight | 4 |
| Three of a Kind | 3 |
| Two Pair | 2 |
| Jacks or Better | 1 |

Payouts include the bet, so a pair of jacks or better gets your bet back.

## Rule assumptions

- A single 52-card deck, freshly shuffled for every hand. Replacement cards come from the same deck, so a card never appears twice in a hand.
- Aces count high or low in straights (10-J-Q-K-A and A-2-3-4-5). Straights don't wrap (Q-K-A-2-3 isn't a straight).
- The bet is taken when the hand is dealt and can't change until the draw. If the bet is more than your credits, the game bets what you have left.
- **Bet Max** deals immediately, as on a real machine.
- Credits are play money only. They reset when the page reloads.
