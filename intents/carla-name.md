# Intent: Carla's Video Poker Game, Developed by Mark Kendall (Round 9)

## Goal
Correct the game's name: it's **Carla's Video Poker Game** (C-A-R-L-A), not "Carl's Poker Game". Credit the developer with "Developed by Mark Kendall".

## Inputs / Context
- Source: the request in conversation.
- Round 6 introduced "Carl's Poker Game". It appears in:
  - `index.html:6` (`<title>`)
  - `src/App.jsx:339` (`h1.title`)
  - `src/App.jsx:152` (the logo's `aria-label`)
  - `README.md:1`
  - a comment at `src/App.css:627`
- The logo's "C" still fits Carla.

## Outputs
- The name **Carla's Video Poker Game** in the tab title, the heading, the logo label and the README.
- A visible credit line, **Developed by Mark Kendall**, on the machine, plus a README credit.
- "Jacks or Better" stays as the subtitle.

## Success Criteria
- [x] **The new name is everywhere and the old one is gone.** Check: `grep -rn "Carl's" src index.html README.md` finds nothing. In headless Chrome, `document.title` and `.title` `textContent` are "Carla's Video Poker Game".
- [x] **The credit is visible.** Check: in headless Chrome, an element reads "Developed by Mark Kendall" and lies inside the viewport at 1600×1000 and at 390×844 (after scrolling to it on the phone). Screenshot.
- [x] **Nothing breaks.** Check: `npm test` (100 pass), `npm run build`, phone `scrollWidth` 390, and no button under 44px.

## Delta
- **`index.html`:** the title.
- **`src/App.jsx`:**
  - the `h1` text and the logo `aria-label`
  - a `<p className="credit">Developed by Mark Kendall</p>` at the bottom of `.machine`, after `.machine-body`
- **`src/App.css`:** a `.credit` style (small, muted, centered), and the comment renamed.
- **`README.md`:** the title, and a credit line under it.
- **Unchanged:** logic and tests.

## Evidence

| Criterion | Check run | Result |
|---|---|---|
| New name everywhere, old one gone | `grep -rn "Carl's" src index.html README.md`; headless Chrome | The grep finds nothing. `document.title` and `.title` both read "Carla's Video Poker Game". |
| Credit visible | Headless Chrome at 1600×1000 and 390×844 (scrolled to it) | "Developed by Mark Kendall", `inView: true` at both sizes (`screenshots/r9-wide.png`, `r9-phone.png`) |
| Nothing breaks | `npm test`; `npm run build`; phone checks | 100/100 tests pass and the build passes. Phone `scrollWidth` 390, no button under 44px. |

check-plan returned READY. It confirmed these five places were the only references and that "Carla" on the stool plate wouldn't trip the grep. At 1600 wide the Sound and Reset buttons are under 44px tall; the 44px rule applies to touch layouts (round 5), and at 390 every target passes.

## Stop
Done when every success criterion is shown satisfied in Evidence and the repository's checks pass.
