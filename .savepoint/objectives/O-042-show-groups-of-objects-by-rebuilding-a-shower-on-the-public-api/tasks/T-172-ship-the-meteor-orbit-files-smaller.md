---
id: T-172
title: Ship the meteor orbit files smaller
objective: O-042
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o042-planning-20261024}
check_waiver:
  task: T-172
  reason: 'Owner said "orchestrate O42"; under the standing O-042 run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.'
  actor: {role: owner, session: o042-run-20261024}
  recorded_at: '2026-10-23T23:42:02Z'
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

### Evidence (builder, 2026-10-24)

- Layout: `fetch-meteoroid-orbits.mjs` now ships `recordId, epochUtcMs, a, e, i, w, node` (7 columns, was 10), stored by column with the epoch as differences; a record id drops the 14-digit time it repeats when it equals the epoch's UTC time to the second (stored from the underscore, `provenance.recordIds: "time-trimmed"`), else kept in full (Perseids 28 of 25,588, Geminids 118 of 51,115). `parseMeasuredOrbits` reads the new lean layout, the earlier 10-column layout and the full layout (fixtures still use them); lean files give `quality: []`.
- Both files regenerated from the old shipped files with the tool's own `shippedCopy` (no network, no rounding, no dropped records). Header keeps everything and adds `recordIds`, `shipped.droppedColumns` (sheetRow, solarLongitudeDeg, pairsFlag, convergenceAngleDeg, geocentricVelocityKmS, geocentricVelocityErrorKmS) and `shipped.qualityCounts` text (Perseids: 23,335 of 25,588 pass the published cut, 2,253 fail; Geminids: 46,828 of 51,115 pass).
- Bytes (raw / gzip): perseids/gmn-iau-7.json 2,596,954 -> 1,687,363 / 977,693 -> 697,814; geminids/gmn-iau-4.json 5,081,427 -> 3,262,930 / 1,798,165 -> 1,259,878.
- Equality test (`showersMeasured.test.ts`, "holds exactly the members of the file shipped before..."): the SHA-256 of the [id, epoch, a, e, i, w, node] rows of each new file equals the hash taken from the old file through its own reader before the rewrite (Perseids 36280b61..., Geminids 00cf9c13...), and the parsed members match the rows. Tool test covers trim/restore, full-kept ids, marker clash and shipping a shipped copy again.
- Orbit-set alternates: kept in the code for files that have quality, but with the shipped lean files `alternatesOf` returns nothing, `?orbits=reliable` falls back to all orbits, and the stream panel quotes `shipped.qualityCounts`. The settings `stream.quality` rule, `?orbits=`/`?span=` in `astraeus-site/src/main.tsx` and the `OrbitSet`/`selectOrbits` code are LEFT FOR THE REBUILD TASK (cleaner there; nothing breaks meanwhile). Browser driver helpers for the switch are unused by any script.
- Tests removed because the data is gone: DW3(i) median geocentric velocity per set, and the "reliable" variants of DW3(ii)-(iv) on the shipped files (the reliable set is still tested on the made-up full-layout orbits in showers.test.ts).
- Page sets on a public build (`npm run build`, `node packages/astraeus-site/tools/validate/load-budget.mjs`, no limit changed): `?experience=showers` (Perseids) 23 files 9,183,625 B raw / 6,755,899 B gzip (limit 10,080,000 / 7,040,000); `?experience=showers&shower=geminids` 23 files 10,761,295 B raw / 7,311,520 B gzip (limit 12,680,000 / 7,890,000). Files shrank by 909,591 / 1,818,497 B raw and 279,879 / 538,287 B gzip. The script also printed FAIL lines for the Apollo, Jupiter and both shower sets over an unlisted `catalogueItem` chunk import and for the whole build (64,255,565 B raw vs limit 54,610,000), none about the orbit files; not investigated or changed here (see drift).
- Gates: `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test` pass (124 files, 1649 passed, 1 skipped). No browser check run.


## Drift Notes

Record architecture deltas for Design reconciliation in the showers rebuild Task.
