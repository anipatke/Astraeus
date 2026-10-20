---
id: T-120
title: Show every planet on the home shelf and every new body in the catalogue
objective: O-033
status: in_progress
stage: build
depends_on: [{task: T-118, requires: clear}, {task: T-119, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o033-planning-20261020}
---

# Show every planet on the home shelf and every new body in the catalogue

## Outcome

The home page's shelf is one row of the Sun and the nine planets with a "+N moons" link under each planet that has moons, the Jupiter demo card becomes the planets demo, and the catalogue lists every new body, its map credit and its tagged places.

## User Check

Open the home page on the preview at phone and desktop width; follow Saturn's "+N moons" link into the catalogue; browse Titan's tagged places there.

## Done When

1. Shelf per Owner Decision 4: thumbnails and licence lines from the same records as the catalogue; moon counts from the moon lists, never typed; reads at 375x667 and 1280x720 without overlap; the index load budget raised on purpose with the figure stated.
2. Demo card renamed and pointed at the planets demo, with its text and image updated.
3. `assets.html`: every shipped body and map under Surface pictures and Credits; a tagged-places section per body (count, categories, sources, shown in the app or not, a browsable list) generated from `data/bodies/` packages; "Traced, not in the app yet" and the wish list shrink to match; `tests/assetsPageCredits.test.ts` checks each new row against its licence record.

## Context Files

`index.html`, `assets.html`, `tests/assetsPageCredits.test.ts`, `tests/assets.test.ts`, `tools/validate/load-budget.mjs`, `data/bodies/catalogue.json`, `src/assets/licence.ts`.

## Design References

Design: public site row (O-016), Texture rights.

## Guardrails

PROV-01, PROV-02, TEST-01, STYLE-07, STYLE-09.

## Implementation Plan

1. Shelf row and thumbnails; demo card.
2. Catalogue rows and generated tagged-places section; tests; budget.

## Boundaries

Pages and their tests only.

## Technical Verification

Configured gates; no browser runs (owner rule); evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
