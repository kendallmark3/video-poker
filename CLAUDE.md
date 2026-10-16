# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Carla's Video Poker Game is a React and Vite app built through progressive intents in `intents/`.

- **Before any new intent, read `memory-map.md`.** It records every past intent, the modules, the invariants not to break, the findings, and the open items.
- **After every intent run, update `memory-map.md`** using its "How to update" steps. Do this in the same commit as the intent's evidence.
- Commands:
  - `npm test`: the regression suite
  - `npm run test:tdd`: the adversarial suite
  - `node TDD/mutate.mjs`: run it on a clean, committed `src/`
  - `npm run build`
- Never edit existing tests or TDD assertions to make something pass.
