---
id: T-101
title: Show off the curve fits on the home page, and move planet positions to curve fits if smaller
objective: O-025
status: planned
depends_on: [{task: T-096, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Show off the curve fits on the home page, and move planet positions to curve fits if smaller

## Outcome

The Astraeus home page gains a short "how it works" section that explains curve fits in plain words with a small live picture built from the real fitted data; and the planet position series move to the same format if that is smaller at equal accuracy.

## User Check

Open the home page: a short section shows one moon's path drawn from many dots and from a few curve pieces, with a slider through time and the real size saving and accuracy beside it.

## Done When

1. O-025 Decision 10 (owner: "Sounds like a cool thing to show off on the main page"): plain words (the "photos versus recipes" explanation the owner liked), a small live visual from real T-096 data, the measured size saving and accuracy against NASA; within the home page's load budget; reduced-motion friendly; phone layout.
2. O-025 Decision 11: the planet position series (`planetModels` chunk, about 1.4 MB) are refitted as curve fits; if smaller at equal accuracy (C-022/C-023 checks still pass) they replace the series, otherwise the measurement is recorded and the series stay.
3. Browser checks through the shared driver (the section renders, the slider moves); full run passes; owner look.

## Context Files

`index.html`, `src/core/planetModels.ts`, `src/core/planetSeries.ts`, `tools/validate/load-budget.mjs`, `tools/validate/capture-site-pictures.mjs`, `tests/homePage.test.ts`, `.savepoint/objectives/O-025-show-jupiter-with-all-its-known-moons/Objective.md`.

## Design References

O-025 Decisions 10-11.

## Guardrails

PROV-01, ARCH-01, TEST-01.

## Implementation Plan

1. Home page section and live visual.
2. Planet refit measured; swap if smaller.

## Boundaries

Home page section and planet position format only.

## Technical Verification

Configured gates, accuracy tests, home page browser check, full run. Evaluated under `agent-skills/references/check-method.md`.
