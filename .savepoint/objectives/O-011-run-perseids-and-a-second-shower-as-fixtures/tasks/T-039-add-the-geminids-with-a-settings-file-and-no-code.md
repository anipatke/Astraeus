---
id: T-039
title: Add the Geminids with a settings file and no code
objective: O-011
status: done
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

### Second attempt, after T-055 (2026-10-16): PASS (configuration only)

The first attempt's FINDING above stands as the record for that attempt. After T-055 (1734bd8, C-032 CLEAR) `data/showers/geminids.json` defines Phaethon with `parentElements`, and the diff against HEAD is that one file (`git diff --stat`: data/showers/geminids.json, 2 insertions, 2 deletions; nothing else outside .savepoint/ and docs/evidence/). No code, test or script edit.

Peak instant (criterion fix): the earlier 2026-12-14T00:00:00Z had solar longitude 261.99 deg against the IAU MDC 261.6 deg (0.39 deg off, outside the strict 0.3 deg check). Now `peakUtc` = 2026-12-13T14:48:22Z. Method: the Astronomical Almanac low-precision solar longitude (n days from J2000.0; L = 280.460 + 0.9856474 n; g = 357.528 + 0.9856003 n; lambda = L + 1.915 sin g + 0.020 sin 2g), the same formula browser-showers.mjs and T-038 use for Perseids, solved by bisection for 261.6 deg between 2026-12-10 and 2026-12-18 (result 261.59999 deg at that second). The engine's Earth ephemeris was not used. Caveat: the formula is the mean equinox of date, which differs from J2000 by about 0.36 deg in 2026, so a pure J2000 longitude would put the peak about 8.7 h later (near Dec 14 00:00Z); the instant above follows T-038's convention, which is what the strict check measures. The window (Dec 4 to Dec 18 00:00Z) and ZHR 150 stay as the AMS states them, labelled AMS; the peak is inside the window. The radiant source text in the file records that the peak instant is computed, not published.

Geminid facts and sources (all in geminids.json, accessed 2026-10-16): Phaethon elements from JPL SBDB (solution SB441-N16 of 2026-10-15, epoch JD 2461200.5 TDB; a 1.271464620766258 AU, e 0.8896722843984632); radiant RA 113.0, Dec +32.4 (J2000) and peak solar longitude 261.6 from the IAU MDC (streamestablisheddata2026.txt, Geminids GEM, IAU number 4, parameter set AdNo 8, Jenniskens 2023); window Dec 4-17, peak night Dec 13-14 and ZHR 150 from the AMS Meteor Shower Calendar 2026 (not IMO; IMO not consulted). CAMS IAU 4, fetched with the unchanged tool: 14905 records, 32 unbound dropped, 14873 bound and drawn ("all"), 12439 in the reliable set (the panel in the browser run states 14873 of 14873 and 12439, cuts 2434; 164 pairs flagged, 138 in the reliable set).

Browser: strict `node tools/validate/browser-showers.mjs` (no ASTRAEUS_SOFT_PEAK), vite on 5199 (stopped afterwards), evidence directory docs/evidence/o011-t039-20261016T053602Z/. The run over every shower started 2026-10-16T05:36:02Z, passed Geminids (run.log; screenshots in geminids/) and was cut by my 580 s command timeout while Perseids ran; Perseids was then run alone to completion (run-perseids.log, screenshots in perseids/). Both: no assertion failure, `"errors": []`, desktop and phone. Geminids crossing: peak instant 2026-12-13T14:48:22Z, solar longitude 261.6, difference 0 deg. Perseids crossing difference -0.047 deg.

Radiant/peak cross-check: the script's checks ran on IAU 4 without any code change (the radiant readout, the peak solar longitude check and the factual checks all read the settings file); they passed.

Gates: `npx tsc --noEmit` clean; `npm run build` built; `npx vitest run` 41 files, 783 passed, 1 skipped on a clean run. Two other full runs each failed one test, tests/listedOrbitGroup.test.ts "fills 30,000 members inside the frame budget" (a timing test from T-052), once while the machine was busy; no test or code relates to this Task's change. Limitation: that flake is unexplained beyond load; I did not rerun it in isolation.

### Attempt 2b, corrected peak (2026-10-16, after I-027): PASS (configuration only)

Attempt 2's PASS stands as configuration only, with the peak corrected. The IAU MDC solar longitudes are J2000 ("All records on J2000"); the 2026-12-13T14:48:22Z above used the equinox-of-date formula and is 261.23 deg in J2000, so it was wrong. This supersedes the peak instant, method and caveat in the attempt 2 paragraph above; I-027 repaired the convention in tests/helpers/streamFacts.ts and tools/validate/browser-showers.mjs.

Peak: `activity.peakUtc` = 2026-12-13T23:31:44Z. Method: `timeOfSolarLongitude` from tests/helpers/streamFacts.ts (bisection on the engine's Earth ephemeris, geometric J2000 ecliptic longitude, no general precession added) for 261.6 deg between 2026-12-10 and 2026-12-18, run from a scratch test file that I deleted afterwards (no code left behind). Result 2026-12-13T23:31:44.418Z; at the whole second 23:31:44Z the longitude is 261.59999 deg. This matches the repair builder's estimate. The source text in geminids.json states this method and the of-date wording is gone. Window and ZHR are unchanged AMS values (labelled AMS); the peak is inside the window.

Browser, strict (no ASTRAEUS_SOFT_PEAK), vite on 5199 (stopped afterwards), new directory docs/evidence/o011-t039-20261016T062113Z/: Geminids `node tools/validate/browser-showers.mjs geminids`, started 2026-10-16T06:21:13Z, exit 0 (run-geminids.log, geminids/); crossing difference -0.007 deg at 2026-12-13T23:31:44Z. Perseids run separately, exit 0 (run-perseids.log, perseids/, finished 06:33Z); peak 2027-08-13T10:41:18Z, difference -0.006 deg.

Gates: `npx tsc --noEmit` clean; `npm run build` built; `npx vitest run` 42 files, 786 passed, 1 skipped (the I-027 test file is among them).

Diff: this Task changes only data/showers/geminids.json outside .savepoint/ and docs/evidence/ (2 insertions, 2 deletions against HEAD: peakUtc and the activity source text). The other working-tree changes (data/showers/perseids.json, docs/ASTRONOMY_VALIDATION.md, tests/helpers/streamFacts.ts, tools/validate/browser-showers.mjs, tests/solarLongitudeConvention.test.ts, the Horizons fixture, I-027) belong to I-027, not this Task.

Radiant and peak-distance figures: not computed. tests/showersMeasured.test.ts (DW2) hard-codes Perseid values (solar longitude 140.1, RA 47.9, Dec 57.9, orbit file 7), so running it on IAU 4 needs a test edit, which this Task forbids. The shared helpers in tests/helpers/streamFacts.ts are generic. The browser script's own radiant and peak checks did run on the Geminids and passed.

## Completion

Task Check C-033 CLEAR, 2026-10-16T06:45Z. Owner validation not required. `status: done` was set by the O-011 orchestrator under the owner's delegation ("You may mark a task Done after a satisfactory check, except tasks that need my look"). Actor {role: owner-delegate, session: o011-orchestrator-check-20261013}.

## Drift Notes

Record the PASS or FINDING here for T-040 and O-012.

FINDING (2026-10-16): a second shower with a new parent is not configuration only. Phaethon needs a catalogue body (core definition and binding, asset entry, registrations, comparison test). Path corrections: planned_reads and Context Files name src/showers/ and data/showers/perseids-orbits.json; the code is in src/experiences/showers/ and the orbits are fetched to data/local/cams-iau-<code>.json (git-ignored). browser-showers.mjs may also need Perseid-specific checks parameterised. Architecture note for the integration Task: the shower settings contract requires a catalogued parent; this belongs in Design.md.

## Replan — 2026-10-13 (I-025)

Amended in planning: "configuration only" now means a settings file plus its measured-orbit data file, because the owner decided on measured CAMS orbits with no invented members. The dependency on T-038 is unchanged.

## Replan — 2026-10-16T03:42:02Z (T-039 FINDING)

The FINDING above (parent 3200 Phaethon not catalogued) went to the owner. Owner decision (AskUserQuestion): "Let settings define a body (Recommended)". T-055 adds that generic capability and parameterises the browser shower script. T-039 now depends on T-055 and resumes after it, still writing only `data/showers/geminids.json`. The FINDING stays recorded as this spike's result for the first attempt, and the second attempt's PASS or FINDING is recorded separately.

## Drift Notes, second attempt

- Result: PASS (configuration only) after T-055; the first attempt's FINDING stands.
- A time-window shower's peak must be computed from its published solar longitude with the formula the browser check uses; a calendar night (Dec 13-14) gives an instant up to 0.4 deg off. Possible Design note for the integration Task: peak instants are derived values and the settings file should say so (done here in the radiant source text).
- The Astronomical Almanac formula is the equinox of date; the IAU MDC states radiants in J2000 and does not say which equinox its solar longitude uses. Unresolved; the convention is T-038's.
- tests/listedOrbitGroup.test.ts frame-budget test is load sensitive (failed in 2 of 4 full runs here). Candidate Issue for the owner; I created none.
- Browser script runtime: the all-shower run takes over 9 minutes for two showers, longer than a 10 minute command limit when three are added.

## Drift Notes, attempt 2b

- I-027: the IAU MDC solar longitude is J2000; comparing it with an equinox-of-date formula put attempt 2's peak about 9 h early (261.23 deg in J2000). Superseded: the Drift Notes above that call the equinox of date an unresolved convention are answered by I-027 (J2000 with J2000, no general precession).
- The Geminid radiant/peak-distance cross-check (the DW2 style test) is not shower-generic: tests/showersMeasured.test.ts is Perseid-only. A generic version is a follow-up for the owner or O-012; I created nothing.
