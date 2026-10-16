# Intent: Carl's Poker Game: Branding and Wide Layout (Round 6)

## Goal
Make the game Carl's own: it's called **Carl's Poker Game**, has a fun logo, and uses more of the screen on desktop instead of sitting in a narrow column.

## Inputs / Context
- Source: the request in conversation ("game is called Carl's Poker Game, spread the game more across the screen and put a logo for fun").
- Current state:
  - `src/App.jsx` renders `<h1 className="title">Jacks or Better</h1>`.
  - `index.html` has `<title>Jacks or Better</title>`.
  - The `.machine` in `src/App.css` is capped at `min(880px, 100%)`, and everything is stacked in one column.
- Jacks or Better is still the game being played. Only the branding changes.

## Outputs
- The name **Carl's Poker Game** in the page title and on the machine. "Jacks or Better" stays visible as the game type.
- A fun logo, made as inline SVG with no image files.
- **A wide layout on large screens:**
  - the machine grows to about 1400px
  - on screens 1100px and wider, the paytable and stats sit in a left column, and the cards, meters and controls sit in a right column
  - narrower screens keep the single column, so the phone layout from round 5 is unchanged

## Success Criteria
- [x] The name is shown everywhere. Check: the browser tab title is "Carl's Poker Game", and the machine shows "Carl's Poker Game" plus "Jacks or Better".
- [x] The logo is visible. Check: an SVG logo is rendered (`svg.logo` exists) and appears in the screenshot.
- [x] The game spreads across a wide screen. Check: in headless Chrome at 1600×1000, the machine is at least 1300px wide, and the paytable and cards sit side by side (the paytable's right edge is left of the cards' left edge).
- [x] Phones are unchanged. Check: at 390×844, `scrollWidth` is still 390 and no button is under 44px.
- [x] Everything still works. Check: `npm test` (88 pass) and `npm run build`. A hand plays at 1600 wide.

## Constraints
- No new dependencies and no image files. Rules and tests don't change.

## Delta
- **`index.html`:** `<title>Carl's Poker Game</title>`.
- **`src/App.jsx`:**
  - A new `Logo` component (inline SVG): a gold poker chip with a spade and Carl's "C".
  - The `<h1 className="title">` becomes a header: the logo, the title "Carl's Poker Game", and a "Jacks or Better" subtitle.
  - The paytable, the play area (message, hand, meters, controls) and `Stats` are wrapped in `<div className="machine-body">`, with the play area in `<div className="play">`.
  - Component logic, actions and keys are untouched.
- **`src/App.css`:**
  - `.machine` max width goes from 880px to 1400px.
  - `.machine-body` uses grid areas. Below 1100px it's one column ordered pay / play / stats, which is today's order, so phones are unchanged. From 1100px up it's two columns: paytable and stats on the left, play on the right.
  - Header and logo styles, extending `.title`.
- **Folded in from check-plan (READY):**
  - Stats use 3 columns in the wide left column.
  - The Sound toggle moves into the header grid, so it can't overlap the longer title. This replaces its absolute positioning and the old ≤900px rule.
  - Explicit column sizes (`minmax(380px, 0.8fr) minmax(0, 1.5fr)`), with the left column top-aligned. The single column uses `minmax(0, 1fr)`.
  - The title is allowed to wrap, and the logo has a fixed size.
  - The README title is updated.
  - The name check uses `textContent` (the title is uppercased by CSS).
- **Unchanged:** all logic modules and tests.
- **New dependencies:** none.

## Evidence

| Criterion | Check run | Result |
|---|---|---|
| Name everywhere | Headless Chrome, `document.title` and `textContent` | Tab "Carl's Poker Game"; title "Carl's Poker Game"; subtitle "Jacks or Better" |
| Logo visible | `svg.logo` present; `screenshots/r6-wide.png`, `r6-phone.png` | true. Red-and-white poker chip with a gold spade and a "C"; it spins on hover. |
| Spreads across wide screens | Headless Chrome 1600×1000 | Machine 1400px (was 880). Paytable right edge 591 < hand left edge 622, so side by side. No overflow (`scrollWidth` 1600). |
| Phones unchanged | Headless Chrome 390×844 (touch) | `scrollWidth` 390; no button under 44px (`small: []`). At 950px: single column and the toggle doesn't overlap the brand. |
| Everything still works | `npm test`; `npm run build`; a hand at 1600 wide | 88/88 tests pass; build passes; Bet Max, hold 2, Draw gives "No win — deal again", credits 95. |

## Stop
Done when every success criterion is shown satisfied in Evidence and the repository's checks pass.
