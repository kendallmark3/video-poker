# Intent: Machine Higher on Screen, Named Casino Seats and Onlookers (Round 8)

## Goal
The machine sits too low, with empty space above it, so move it up near the top of the screen. Make the casino floor personal: two slot stools carry the names **Carla** and **Stephanie**, and **Mark** and **Brandon** sit off to the side at a cocktail table, sipping drinks and watching. They're drawn as silhouettes, with no faces.

## Inputs / Context
- Source: the request in conversation.
- Current state:
  - `src/App.css` `body` is `display: grid; place-items: center; min-height: 100vh`, so the machine is centered vertically. At 1600×1000 that leaves about a 200px gap above it.
  - `src/Casino.jsx` `CasinoBackdrop` draws lights plus an `svg.slot-row` (viewBox 1400×220, `xMidYMax slice`) along the bottom.
  - The machine (`z-index: 1`) covers the middle of the screen. Only the floor strip below it and the side edges show the scene.
- The spoken name "Stephanie" is used; the spelling given was S-T-E-P-H-A-N-E.

## Outputs
- **The machine near the top:** it's aligned to the top with a small margin and stays centered left to right on every screen size.
- **A floor scene:** the slot-machine row gains a stool in front of each machine.
  - Two stools, in the part of the floor visible below the machine, carry gold name plates reading **Carla** and **Stephanie**.
  - At one side of the floor, two seated silhouettes sit at a small cocktail table, each holding a cocktail glass raised as if sipping.
  - Small, subtle name tags read **Mark** and **Brandon**.
  - The figures have no faces.
- **Still decorative:** the scene doesn't catch clicks and doesn't move with reduced motion.

## Success Criteria
- [x] **The machine sits near the top.** Check: in headless Chrome at 1600×1000 and at 1280×800, the top of `.machine` is 40px or less from the top of the viewport, and its left and right gaps are equal (within 2px).
- [x] **The names appear on the casino floor.** Check: the backdrop SVG contains the text "Carla", "Stephanie", "Mark" and "Brandon". At 1600×1000, each name's box lies inside the viewport and doesn't overlap the machine's box, so it's actually visible.
- [x] **The onlookers are seated and drinking.** Check: a screenshot at 1600×1000 shows two seated silhouettes with raised cocktail glasses at a side table, and stools at the slot machines.
- [x] **Nothing breaks.** Check:
  - `npm test` (all 100 earlier tests pass unchanged) and `npm run build`
  - at 390×844, `scrollWidth` is 390 and no button is under 44px
  - a hand plays by keyboard at 1600
  - the backdrop keeps `pointer-events: none`

## Constraints
- No image files and no new dependencies. Rules, game logic and tests don't change.
- No faces or likenesses: the figures are generic silhouettes.

## Delta
- **`src/App.css`, `body`:**
  - `place-items: center` becomes `justify-items: center; align-items: start`, so the machine stays centered left to right and sits at the top.
  - Top padding of 20px.
  - The `.slot-row` sizing is renamed to `.floor`, with height `30vh` (min 180px).
- **`src/Casino.jsx` `CasinoBackdrop`:** the `svg.slot-row` is replaced by `svg.floor` (viewBox 1600×300, `xMidYMax slice`):
  - 13 slot machines (same drawing as now)
  - a backed stool in front of each one
  - gold name plates **Carla** (stool 4) and **Stephanie** (stool 8)
  - a right-hand cocktail table with two seated, faceless silhouettes, each with a cocktail glass raised to the head
  - small tags **Mark** and **Brandon**
  - a pink rim stroke so the silhouettes read against the dark floor

  Positions are fixed in the drawing, with no randomness, keeping round 7's rule that the backdrop never uses `Math.random`.
- **Folded in from check-plan (READY):**
  - The padding is `20px 16px 24px`, keeping the 16px sides.
  - 13 machines at 104-unit spacing, with stools counted from 0 (Carla on 4, Stephanie on 8).
  - The `.slot-row` class name is kept (the rename is cut).
  - The rim stroke is kept for silhouette visibility.
  - The Stephanie spelling is flagged to the user.
- **Unchanged:** logic modules, `App.jsx`, and tests. The backdrop keeps `aria-hidden` and `pointer-events: none`.
- **New dependencies:** none.

## Evidence

| Criterion | Check run | Result |
|---|---|---|
| Machine near the top, centered | Headless Chrome at 1600×1000 and 1280×800 | Top 20px at both sizes (was about 205px). Gaps 100/100 at 1600 and 16/16 at 1280. |
| Names on the floor and visible | Headless Chrome: SVG `text` boxes vs viewport and `.machine` box | Carla, Stephanie, Mark and Brandon all `inView: true` and `overlapsMachine: false`, at 1600×1000 and 1280×800 |
| Seated onlookers drinking; stools at the slots | `screenshots/r8-wide.png` | A stool in front of each machine, with gold plates "Carla" and "Stephanie". At the right-hand cocktail table, two faceless rim-lit silhouettes on bar stools, each with a martini glass raised, tagged Mark and Brandon. |
| Nothing breaks | `npm test`; `npm run build`; phone 390×844 tap; keyboard at 1600; backdrop pointer | 100/100 tests pass and the build passes. Phone `scrollWidth` 390 with no button under 44px. Keyboard check: `sameNode [true,false,true,false,false]`. Backdrop `pointer-events: none`. |

Screenshot review: the "Brandon" tag nearly touched the right edge, so the table group was moved 20 units left and re-measured (still in view, no overlap).

## Stop
Done when every success criterion is shown satisfied in Evidence and the repository's checks pass.
