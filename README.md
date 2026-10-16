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
