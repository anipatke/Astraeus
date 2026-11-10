---
id: T-294
title: Give the stars their catalogue ids
objective: O-065
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-294, reason: 'Owner said "orchestrate O65" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o065-run-20261110}, recorded_at: '2026-11-10T03:16:41Z'}
planned_by: {role: planner, session: o065-planning-20261110}
---

# Give the stars their catalogue ids

## Outcome

The engine's star list carries each star's Hipparcos number (HIP) where the HYG catalogue gives one, and the engine can find a listed star's sky direction by that number, so a sky figure can name its stars by id.

## User Check

None for the owner at this step; the owner looks at the finished sky figures in the last step.

## Done When

- `tools/data/fetch-hyg-stars.mjs` writes a fifth column, the HIP number (0 or absent where HYG has none; the planner prefers 0 so rows stay fixed-width numbers), and the committed `hyg-v42-naked-eye.json` is regenerated with it; the same 8,920 stars and the same four existing values per star (a test compares positions, magnitudes and colours to the previous file's values); provenance `columns` and `attribution` say what changed (PROV-01).
- `assets/sky.ts` reads the id column and exposes one internal lookup from HIP number to EQJ unit direction (and magnitude), built once per star load; the star drawing is unchanged (no visible change).
- Tests on made-up ids and on the real file's shape (`tests/hygStars.test.ts`): a listed id resolves to its direction; an unlisted id resolves to none; duplicate ids, if any, are reported by the fetch tool rather than silently overwritten.
- `npm run check:pack` passes with the engine inside its unpacked limit; the size change is recorded in evidence.

## Context Files

`packages/astraeus/tools/data/fetch-hyg-stars.mjs`, `packages/astraeus/tools/data/fetch-hyg-stars.d.mts`, `packages/astraeus/src/assets/sky.ts`, `packages/astraeus/src/app/SkyView.ts`, `packages/astraeus/src/app/skyModel.ts`, `packages/astraeus/tests/hygStars.test.ts`, `.savepoint/objectives/O-065-draw-and-trace-figures-on-the-sky/Objective.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (the sky view, O-064; Asset architecture, O-014); `docs/architecture/state-and-assets.md` where it describes the sky assets.

## Guardrails

PROV-01, ARCH-02, ARCH-04, DATA-01, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Read the fetch tool; add the HIP column to the kept fields (HYG `hip`), keep the filter and rounding unchanged.
2. Re-run the fetch (network) and diff: only the new column and provenance text may change; if the source moved, stop and report.
3. Read the column in `assets/sky.ts`; add the id lookup (one table, STYLE-07).
4. Tests; gates; `npm run check:pack`.

## Boundaries

No public API (the next step); no figures or lines; no change to which stars are kept or how they look.

## Technical Verification

Focused Vitest runs while building; hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, plus `npm run check:pack`; no browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas; Design is reconciled in the last step of this Objective.
