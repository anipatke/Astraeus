---
id: T-039
title: Add the Geminids with a settings file and no code
objective: O-011
status: in_progress
stage: audit
depends_on: [{task: T-038, requires: clear}, {task: T-055, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o011-plan-2026-10-11}
lane: showers
planned_reads: [docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md, data/showers/perseids.json, data/showers/perseids-orbits.json, src/experiences/showers/showerSettings.ts, src/experiences/showers/showerDefinition.ts, tools/validate/browser-showers.mjs]
planned_writes: [data/showers/geminids.json]
---

# Add the Geminids with a settings file and no code

## Outcome

The Geminids run from `data/showers/geminids.json` alone. The pass/fail answer to the brief's question, "could Astraeus support a second meteor shower primarily through configuration?", is recorded with evidence: either it passed with zero code change, or the exact change it would need is recorded as a finding.

## Astraeus Hypothesis

- **Capability tested:** that a second shower with a materially different parent (asteroid 3200 Phaethon, short period, small perihelion distance, December) is configuration only.
- **Contract reused:** everything T-038 reused, plus the T-038 shower builder, settings validation and entry discovery, unchanged.
- **Gap or hypothesis:** zero code change. Likely stress points: a small perihelion and short period under the uniform spread, a different activity length and ZHR profile, and camera reach and presets for a different geometry.
- **Generic change:** none permitted in this Task. A needed change in any code, including `src/showers/`, the entry, tests or browser scripts, is a finding: stop, record it, and return it to the owner.
- **Perseids-independent evidence:** this Task is that evidence. Only one settings file is added.

## User Check

Open the Geminids experience and confirm it loads with its own window, peak, rate and stream. Confirm the diff adds only the settings file.

## Done When

1. `geminids.json` holds 3200 Phaethon's elements and epoch (JPL Small-Body Database) and the radiant, activity window, peak and peak ZHR, each with source and access date, fetched from the source. The CAMS Geminid (IAU 4) subset is fetched locally by running T-038's fetch tool unchanged (git-ignored, never committed; T-051 replan), with its provenance header. No member is invented.
2. `git diff --stat` for this Task shows `data/showers/geminids.json` as the only changed file outside `.savepoint/` and `docs/evidence/`. If the parent body needs a catalogued definition (as Swift–Tuttle did), that is code, so it is a FINDING returned to the owner, not a silent change.
3. Run with the existing browser shower script, pointed at Geminids by its existing parameters or by running the script as written over every discovered shower: the experience loads with zero console errors at desktop and phone sizes, the stream is near Earth across its window, and the window, peak and rate readouts are present. Evidence goes in a fresh run directory.
4. Existing tests pass unchanged. If the builder's tests iterate over discovered settings, Geminids is covered with no test edit.
5. **Result recorded** in Technical Evidence: PASS (configuration only) or FINDING (the exact file, change and reason). A FINDING is returned to the owner before anything is changed. It is a valid spike outcome, not a failed Task.
6. Configured typecheck, build and test gates pass; record counts.

## Context Files

`.savepoint/objectives/O-011-run-perseids-and-a-second-shower-as-fixtures/Objective.md`, `data/showers/perseids.json`, `src/showers/showerSettings.ts`, `src/showers/showerDefinition.ts`, `tools/validate/browser-showers.mjs`.

## Design References

Design: Experience plug-in boundary; Groups and the `points` layer (O-009); Time windows and rates (O-010).

## Guardrails

ARCH-01, ARCH-03, PROV-01, TEST-01, TEST-03.

## Implementation Plan

1. Confirm T-038's builder, discovery and browser script exist as named; return REPLAN REQUIRED if not.
2. Fetch and record the Geminids facts with citations.
3. Write the settings file, choosing the spread with the same method T-038 recorded.
4. Run the browser script and gates. If anything fails because of code, stop and record the FINDING.

## Boundaries

Only `data/showers/geminids.json` is written outside records and evidence. No code edits, including "small" ones to the builder, entry, tests or scripts.

## Technical Verification

Configured gates and the shower browser script. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Result: FINDING (not configuration only). Recorded 2026-10-16 by the builder; no code was changed.

Finding: `parentBodyId` must name a catalogued body. 3200 Phaethon is not catalogued (the catalogue holds Sun, Earth, Moon, Mercury, Venus, Mars, Jupiter, Io, Swift-Tuttle). `showerComposition` (src/experiences/showers/showerDefinition.ts:372) throws `parentBodyId "phaethon" is not a catalogued body that circles the Sun (earth, mercury, venus, mars, jupiter, swift-tuttle)`; `createStreamLayer` also needs the parent's state source. `parseShowerSettings` itself accepts every field. The change needed is a catalogue entry for Phaethon mirroring Swift-Tuttle: new `src/core/bodies/phaethon.ts` (definition, elements, epoch, binding, sampling from the SBDB elements below), new `src/assets/bodies/phaethon.ts` (visual and entry), registration in `src/core/bodies/index.ts` (BUILT_IN_BODIES and bindings) and `src/assets/catalogue.ts`, and a Horizons comparison test and fixture like tests/swiftTuttle.test.ts. Cosmetic: the "Focus comet" preset label (showerDefinition.ts:454) says comet for an asteroid.

Facts gathered (all in data/showers/geminids.json with source and access date 2026-10-16):
- Phaethon, SBDB https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=3200&full-prec=1, fetched 2026-10-16T03:25Z: solution of 2026-10-15 (SB441-N16), epoch JD 2461200.5 TDB, a 1.271464620766258 AU, e 0.8896722843984632, q 0.1402777870773155 AU, i 22.31052728903618, node 265.0988060336058, peri 322.300168494526, M 301.4858238591272, period 523.67 d.
- Radiant and peak solar longitude: IAU MDC streamestablisheddata2026.txt (updated 2026-10-09), Geminids GEM, IAU number 4, parameter set AdNo 8 (Jenniskens 2023): lambda-sun 261.6, RA 113.0, Dec +32.4, J2000. (The task text said AdNo 4; 4 is the IAU number, the set is AdNo 8.)
- Window, peak, ZHR: AMS Meteor Shower Calendar 2026 (https://www.amsmeteors.org/calendar/): active Dec 4-17, peak night Dec 13-14, ZHR 150. IMO not consulted (offline at last check); this is the AMS figure, not IMO's.
- CAMS (node tools/data/fetch-meteoroid-orbits.mjs 4, unchanged, 2026-10-16T03:25Z) to git-ignored data/local/cams-iau-4.json: 14905 records, 32 unbound dropped, 14873 drawn (bound, "all" set); about 12439 meet the reliable rule (convergence >= 15 deg, velocity error <= 10%; my own count from the file, not the app panel's). Median a 1.30 AU; solar longitude 239.4 to 295.2, median 261.66.

Settings choices: concentration fraction 0 (no published clump), seed 20261214, fallOffPerDay 0.1 as for Perseids, camera reach 400000 / 1200000 Earth radii (aphelion 2.4 AU), peak 2026-12-14T00:00Z by the Perseid convention (night Dec 13-14), end 2026-12-18T00:00Z (day after the listed last day, as for Perseids).

Gates with geminids.json present (no code changed): `npx tsc --noEmit` clean; `npx vitest run` 40 files, 728 passed, 1 skipped (no test iterates the discovered settings, so none covers or fails on Geminids); `npm run build` succeeded.

Browser: `ASTRAEUS_SHOWER=geminids ASTRAEUS_IAU=4 node tools/validate/browser-showers.mjs` (vite port 5199, stopped afterwards), started 2026-10-16T03:28Z, evidence in docs/evidence/o011-t039-20261016T032805Z/run.log, failed at its first step: the canvas never mounted (30 s timeout). A probe of ?experience=shower-geminids logged the page error above.

Per-criterion: 1 met (facts and CAMS subset present, no member invented). 2 diff is only geminids.json outside .savepoint and docs/evidence, but the condition it names (parent needs a catalogued definition) is what triggered the FINDING. 3 not met. 4 met (existing tests pass unchanged). 5 recorded here. 6 met.

Limitations: the stream-near-Earth check, desktop and phone runs and the panel readouts were not reached. browser-showers.mjs hard-codes Perseid values (for example 140.1 deg) and may need parameterising; unverified because it never got that far. geminids.json is left in the tree and ?experience=shower-geminids errors until Phaethon is catalogued.

## Drift Notes

Record the PASS or FINDING here for T-040 and O-012.

FINDING (2026-10-16): a second shower with a new parent is not configuration only. Phaethon needs a catalogue body (core definition and binding, asset entry, registrations, comparison test). Path corrections: planned_reads and Context Files name src/showers/ and data/showers/perseids-orbits.json; the code is in src/experiences/showers/ and the orbits are fetched to data/local/cams-iau-<code>.json (git-ignored). browser-showers.mjs may also need Perseid-specific checks parameterised. Architecture note for the integration Task: the shower settings contract requires a catalogued parent; this belongs in Design.md.

## Replan — 2026-10-13 (I-025)

Amended in planning: "configuration only" now means a settings file plus its measured-orbit data file, because the owner decided on measured CAMS orbits with no invented members. The dependency on T-038 is unchanged.

## Replan — 2026-10-16T03:42:02Z (T-039 FINDING)

The FINDING above (parent 3200 Phaethon not catalogued) went to the owner. Owner decision (AskUserQuestion): "Let settings define a body (Recommended)". T-055 adds that generic capability and parameterises the browser shower script. T-039 now depends on T-055 and resumes after it, still writing only `data/showers/geminids.json`. The FINDING stays recorded as this spike's result for the first attempt, and the second attempt's PASS or FINDING is recorded separately.
