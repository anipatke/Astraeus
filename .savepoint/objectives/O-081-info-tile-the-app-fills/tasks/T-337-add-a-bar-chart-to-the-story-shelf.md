---
id: T-337
title: Add a bar chart to the story shelf
objective: O-081
status: planned
depends_on: []
check_waiver: {task: T-337, reason: 'Owner said "Orchestrate this obj" (O-081): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o081-20261121}, recorded_at: '2026-11-21T07:23:30Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o081-20261121}
planned_reads: [packages/astraeus/src/app/shelfContract.ts, packages/astraeus/src/shelf/part.ts, packages/astraeus/src/shelf/colourKey/factory.ts, packages/astraeus/src/shelf/colourKey/View.tsx]
planned_writes: [packages/astraeus/src/shelf/chart/factory.ts, packages/astraeus/src/shelf/chart/View.tsx, packages/astraeus/src/shelf/chart/part.css, packages/astraeus/src/shelf/part.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/app/style.css, packages/astraeus/src/api/errors.ts, tools/check-shelf-split.mjs, packages/astraeus/tests/shelfContentParts.test.ts, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/tests/twoViewers.test.ts, packages/astraeus/api-surface.lock.json]
---

# Add a bar chart to the story shelf

## Outcome

A `chart` block an app puts in a shelf panel and fills with its own counts: bars from `bins [{from, to, count, color?}]`, an axis label, optional labelled `marks [{at, label}]`, and an optional `highlight {from, to}` that dims bars outside it. `handle.part(chart)` gives `setBins` and `setHighlight` (silent); the chart hears nothing. It is its own import, drawn as SVG from the shared look, with a short accessible summary of the bars.

## User Check

A synthetic panel holding a chart of made-up counts with two marks: open it, call `setHighlight` and see bars outside the range dim; call `setBins` and see the bars redraw while the panel is open; `npm run check:shelf-split -- --import chart` passes and importing chart alone carries no other part's marker.

## Done When

The "Chart" and (for the chart) "One contract" O-081 Success Conditions hold: `bad-part` shape cases for every chart field (empty bins, `from >= to`, negative or non-finite count, bad colour, highlight outside or reversed, bad mark), both embedding paths in the lifecycle suite, two viewers, a synthetic scene (ARCH-03), drift check clean over `src/shelf`, the split check knows the chart's marker, doc comment with `@shelf` (a catalogue entry comes in the catalogue Task; if `shelfCatalogue.test.ts` fails for the missing entry, add a minimal entry and example only so the gate stays green, noting it for that Task). `npm run api:errors`, `npm run api:lock`. Apply `docs/agents/verification.md`.

## Context Files

- `.savepoint/objectives/O-081-info-tile-the-app-fills/Objective.md`
- `docs/architecture/viewer-interface.md` under `7. Public interface (O-079, O-080, O-081)`
- `docs/architecture/viewer-interface.md` under `11. Story-component shelf`
- `docs/architecture/viewer-interface.md` under `10. Shared look`
- `packages/astraeus/src/app/shelfContract.ts`
- `packages/astraeus/src/shelf/part.ts`
- `packages/astraeus/src/shelf/colourKey/factory.ts`
- `packages/astraeus/src/shelf/colourKey/View.tsx`
- `packages/astraeus/src/shelf/colourKey/part.css`
- `packages/astraeus/src/api/index.ts`
- `packages/astraeus/src/shell/look/look.css`
- `tools/check-shelf-split.mjs`
- `packages/astraeus/tests/shelfContentParts.test.ts`

## Design References

Design "Viewer interface", "Public API shape (G-016, owner 2026-11-01)".

## Guardrails

ARCH-01, ARCH-02, ARCH-03, API-01, API-02, API-03, API-04, API-05, API-07, TEST-01, TEST-03, STYLE-07, STYLE-09.

## Implementation Plan

1. Confirm the O-080 block contract (`BlockPart<K>`, `ShelfCell`, descriptor `control`) exists as described; return REPLAN REQUIRED if not.
2. `src/shelf/chart/` following the colour key's pattern: factory checked at the call, frozen descriptor, view and control carried on the descriptor.
3. SVG view: one x scale from the bins' extent, y from the largest count, marks as labelled lines, highlight dims bars wholly outside it; colours from `--astraeus-*` tokens, a bin's own colour through the part's custom property as the colour key does; `role="img"` with a summary label (bin count, range, largest bin, highlight).
4. Control: `setBins`, `setHighlight(range | undefined)`, silent, checked as the factory checks.
5. Add the chart's marker to `check-shelf-split.mjs`; tests; doc comment; README line; CHANGELOG 0.9.5 Added line; api errors and lock.

## Boundaries

No readout tile, no new screen area, no catalogue entry beyond a gate-keeping minimum, no bar or panel rule changes, no site demo changes. Bars do not take taps.

## Technical Verification

Focused tests during iteration; configured gates plus `npm run check:shelf-split` at handoff. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here for the planner to reconcile in T-340 before the Full Objective Check.
