---
id: T-294
title: Give the stars their catalogue ids
objective: O-065
status: done
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

Extra reads: none beyond Context Files (sky.ts star section only; tests/hygStars.test.ts whole).

Done When:
1. Fetch tool (`tools/data/fetch-hyg-stars.mjs` + `.d.mts`): reads HYG `hip`, writes it as fifth column (0 where HYG has none; 50 of 8,920 rows). Re-fetched from the live source (`node tools/data/fetch-hyg-stars.mjs`): 8,920 stars, 119,626 records, 1 skipped, same as before. Scratch script compared old vs new file: 0 of 8,920 rows differ in the first four values; the only provenance changes are `attribution`, `columns` and `accessed` (2026-10-16 to 2026-11-10). Fetch tool now collects duplicate HIP numbers (`duplicateHip`) and fails the fetch naming them (none occurred). Size 284,317 B to 338,278 B (+53,961 B, +19%); the "under 330 KB" test limit was raised to 345 KB.
2. `assets/sky.ts`: `StarRow` has optional fifth `hip`; `parseStarFile` accepts 4 or 5 columns (hip a non-negative integer); new internal `starIdTable(stars)` (HIP to `{direction: Vec3, vMag}`, first row wins, 0/absent unlisted) and `starIdsOf(catalogue)` (built once per loaded catalogue, WeakMap cache). `HYG_STAR_LICENCE` attribution/accessed updated to match the file. SkyView/skyModel untouched; star drawing unchanged (not browser-checked).
3. `tests/hygStars.test.ts`: new "Hipparcos ids" block (Sirius HIP 32349 and Polaris HIP 11767 resolve to the published positions within 3 arcsec; real file has no repeated id; made-up listed id resolves, unlisted/0 resolve to none; first-row-wins; bad id column rejected); fetch parsing test updated for the fifth column and `duplicateHip`.
4. `npm run check:pack` passes (17.3 s); engine within its unpacked limit.

Gates (repo root): lint pass 4.0 s; typecheck pass 6.0 s; build pass 2.4 s; npm test pass 40 s; check:pack pass 17.3 s. No browser run.

Not verified: that the star drawing is visually unchanged (no browser run; the drawing code and first four values are unchanged); the public `Astraeus` API does not expose the lookup yet (next Task).

Files changed: packages/astraeus/tools/data/fetch-hyg-stars.mjs, fetch-hyg-stars.d.mts, packages/astraeus/src/assets/stars/hyg-v42-naked-eye.json, packages/astraeus/src/assets/sky.ts, packages/astraeus/tests/hygStars.test.ts.

## Drift Notes

Record architecture deltas; Design is reconciled in the last step of this Objective.

- Star file is now five columns `[raDeg, decDeg, vMag, bMinusV|null, hip]` (hip 0 = none), 338 KB (was 284 KB); the star-file size test limit is 345 KB. Internal id lookup `starIdsOf(catalogue)` / `starIdTable` in assets/sky.ts (HIP to EQJ direction and V); not public yet. Design's sky/asset description should say so at the last step's reconciliation.
