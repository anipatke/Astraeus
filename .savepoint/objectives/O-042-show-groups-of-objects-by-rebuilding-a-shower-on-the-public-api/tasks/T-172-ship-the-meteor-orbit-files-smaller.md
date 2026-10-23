---
id: T-172
title: Ship the meteor orbit files smaller
objective: O-042
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o042-planning-20261024}
---

# Ship the meteor orbit files smaller

## Outcome

The shipped Perseids and Geminids orbit files store each record id without the time it repeats (ids whose time differs kept in full) and no longer carry the three quality columns (O-042 Decisions 1 and 5); every remaining parsed value is unchanged and both pages are lighter.

## User Check

None visible (owner, Decision 5: no visual change; this is the owner's DATA-01 OK to rewrite the two files).

## Done When

- The fetch tool writes the shorter layout; `parseMeasuredOrbits` reads it (and the old layout, if any test fixture still needs it).
- A test shows both new shipped files parse to exactly the same members (ids, times, elements) as the old ones.
- Both shipped files regenerated from the old shipped files or the local full files; provenance records the layout and that the quality columns were dropped, with the published quality counts kept as text for the stream's known limits.
- The "All orbits / Reliable only" alternates, `?span=` and `?orbits=` are removed from the showers demo (Decision 1) where they depend on the dropped columns, or left for the rebuild Task if cleaner — say which.
- Page sets re-measured on a public build and figures recorded; no limit change here (that is the rebuild Task).
- Hand-off gates green.

## Context Files

`packages/astraeus-demo-showers/tools/data/fetch-meteoroid-orbits.mjs`, `packages/astraeus-demo-showers/tools/data/fetch-meteoroid-orbits.d.mts`, `packages/astraeus-demo-showers/src/experiences/showers/measuredOrbits.ts`, `packages/astraeus-demo-showers/src/experiences/showers/showerDefinition.ts`, `packages/astraeus-demo-showers/tests/fetchMeteoroidOrbits.test.ts`, `packages/astraeus-demo-showers/tests/showersMeasured.test.ts`, `packages/astraeus-demo-showers/tests/helpers/measuredOrbits.ts`, `packages/astraeus-demo-showers/data/stories/perseids/gmn-iau-7.json`, `packages/astraeus-demo-showers/data/stories/geminids/gmn-iau-4.json`, `packages/astraeus-site/tools/validate/load-budget.mjs`.

## Design References

Design Current Technical State (showers data, O-030 load budget).

## Guardrails

DATA-01, PROV-01, TEST-01, TEST-02, TEST-03.

## Implementation Plan

1. New layout in the tool and parser. 2. Regenerate both files; equality test. 3. Remove the quality-only Developer extras if cleanly separable. 4. Measure.

## Boundaries

No rounding, no dropped records, no re-fetch from the network unless the local full files are the only source.

## Technical Verification

Hand-off gates from AGENTS.md (`npm run lint`, `npm run typecheck`, `npm run build`, `npm test`) plus the extra gates named in Done When. No `npm run check:browser` per Task (one run at the Full Objective Check); a changed browser step may be run alone once. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas for Design reconciliation in the showers rebuild Task.
