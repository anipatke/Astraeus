---
id: C-126
scope: {kind: objective, id: O-047}
result: NEEDS WORK
checked_by: {role: checker, session: o047-check-20261031}
executed_session: o047-run-20261031
checked_at: '2026-10-31T03:55:00Z'
health_snapshot: sha256:19d6360bdc85f8fd6d8d4241036f7b720f408997f25a723bde4b53d567112c4b
reviewed:
  base_commit: 2bf6c06b
  head_commit: 2b7be6af
  files: [packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/story.ts, packages/astraeus/src/api/sunOrbit.ts, packages/astraeus/src/api/data.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus/src/api/pathProvenance.ts, packages/astraeus/src/api/mount.ts, packages/astraeus/src/api/AstraeusScene.tsx, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/sceneFraming.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/dotMaterial.ts, packages/astraeus/src/core/pacing.ts, packages/astraeus/src/core/clock.ts, packages/astraeus/src/core/chebyshevEphemeris.ts, packages/astraeus/src/core/bodies/moonSystem.ts, packages/astraeus/src/shell/infoModel.ts, packages/astraeus/src/synthetic/syntheticJourneyScene.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus-site/tools/validate/load-budget.mjs, tools/check-packs.mjs, tools/check-node-consumer.mjs, .savepoint/Design.md]
  dependencies: []
issues: []
---

# C-126: O-047 Full Objective Check

Mandatory Full Objective Check of O-047 ("Show a historical probe journey end to end", T-195 to T-201 and T-203; T-202 is a retired number).

**Independence.** This session did not plan, build, repair or coordinate O-047. It wrote only gate outputs (`coverage/`, `junit.xml`, `dist/`, example builds), the official health snapshot, browser run folder `docs/evidence/browser-20261031T034931Z/`, one throwaway probe test (written to `packages/astraeus/tests/`, run after the full gate and the browser run, then deleted), this record, and `rechecked` history entries on the linked Issues.

**Baseline.** HEAD `2b7be6af` on `o047-historical-probe`, merge base with `main` `2bf6c06b`; diff `main...HEAD` (105 non-data files, 1,464 data files). Not a lane (`git-dir` = `git-common-dir`). `docs/prds/` and `docs/research/` not read or touched. Times UTC.

**Verdict: NEEDS WORK.** Almost all of it works and every gate passes. Two narrow faults against named criteria remain, both recorded on existing open Issues (no new Issue IDs): pacing's documented "slower speed wins" rule is false when a slow span meets a faster event rule (I-112), and a scene with a planet orbit line or `fitOrbit` whose timeline starts before 1950 fails with a raw `TimeScaleOutOfRangeError` instead of the named `out-of-span` (I-110).

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature in scope; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. Criteria: the O-047 Success Conditions; each Task's Done When; Guardrails ARCH-01 to ARCH-06, PROV-01, TEST-01 to TEST-04; gates: full gate, `check:engine-alone`, `check:pack`, `check:node-consumer`, one `check:browser`, Code Health.
2. Entry points: `Scene.addBody({orbit})`, `camera.fitOrbit`, `setTimeline({pacing})`, `addTrajectory({provenanceSpans})`, `camera.lookAt/follow` opening selection, `mount` handle (`time`, `rate`, `setTime`, `setRate`, `onChange`), `AstraeusScene` `time`/`rate`/`onChange`, `parseEphemerisIndex` per-body `span`, `MoonSystem.load`, `installData`, `toDefinition().prepare`, the four data packages and `planets.json`.
3. Relied-on runtime: the one `SimulationClock` (pacing, `stopWithin`), `liveReach`/`focusLimits`, `infoView`, the shell's opening selection, the moon chunk loader.
4. Matrix: below. Not applicable: text classes (no width/truncation in scope), output sinks (no CLI).
5. Admission: supported public API path, named criterion or README/doc statement the Task promised, credible host-visible consequence.

## Coverage Matrix

| # | Row (criterion) | Cells | Result | Evidence |
|---|---|---|---|---|
| 1 | Per-body span in index (T-195) | absent span; own span narrower; wider than chunks; malformed/reversed | Proven | `dataSpans.test.ts`, `chebyshevEphemeris.test.ts` "a span per body" (full gate) |
| 2 | Moon out of span, named, once (T-195, I-110) | window before/after span; second load; installed set | Proven | `dataSpans.test.ts` public error names io, package, years; promise cached |
| 3 | Planet series out of span, named (T-195, I-110) | plain planet before 1950 / after 2045; planet **with orbit line**; planet with `fitOrbit` | **Issue** (orbit/fitOrbit cells) | Probe: `mercury` 1949-06 to 1951 and 2040 to 2046 give `out-of-span` naming mercury and 1950-01-01 to 2045-01-01. `saturn, {orbit:true}` and `fitOrbit("saturn")` with timeline 1945 to 1946 give `TimeScaleOutOfRangeError: time -788918400000 is outside the TT - UTC table`. Cause: `#earlySunPaths` (`scene.ts:503`, at `toDefinition` when the series are loaded) and the `sunPaths.push(... #sunPath)` and `#fitFarthestKm` reads in `prepare` (`scene.ts:716`, `:683`) run before `#checkPlanetSpan` (`scene.ts:717`); `drawnOrbit` treats out-of-range as "not covered" for the turn search, then `osculatingOrbit` reads the source at the opening time and throws (`sunOrbit.ts` `osculatingOrbit`). No test covers this cell; the `dataSpans.test.ts` "window before the planet series" case is now vacuous (1950 start takes its `resolves` branch) |
| 4 | 1950 data, accuracy (T-200) | Io 1979-03-05, Titan 1980-11-12, 1950-01-03, 1965/66 vs stored Horizons; small moons keep 2010; static `validUtc` matches index | Proven | `historicalMoons.test.ts` (independent oracle: Horizons UT vectors fixture); importer verify figures recorded in each index |
| 5 | Package sizes / owner decision (T-200) | pack limits; first download | Proven | `check:pack`: Saturn 53.46 MB (limit 59), Uranus 40.63 (45), Jupiter 30.90 (34), Neptune 18.54 (20.5), astraeus 458 files (460). Matches the owner's "Accept the larger size" |
| 6 | Orbit line + fitOrbit every planet (T-196, I-111) | Saturn/Uranus/Neptune at 1980, 2030; opening 2040 (turn past series end); 1950-01-02 opening; full-turn wording kept | Proven (inside the series) | `planetOrbitLines.test.ts`; probe: Saturn opened 2040 falls back to the osculating ellipse with the osculating description; 1950 to 2045 timeline prepares |
| 7 | Setup error once, not per frame (T-196) | fit settled at toDefinition / prepare | Proven | `#fitFarthestKm` caches and settles in setup; `planetOrbitLines.test.ts` stable read |
| 8 | Host time/rate (T-197, I-099) | before ready; set in/out of window; junk; rate not offered; callbacks host/visitor/playback; unmount | Proven | `viewerHostDom.test.ts` (happy-dom, real viewer) |
| 9 | Speed menu exact (I-106) | rates given; none given | Proven | `viewerHostDom.test.ts`; Apollo 11 updated to list its set |
| 10 | Pacing values and ramps (T-201, I-112) | cruise; at event; mid ramp; monotone both ways; loop/seek | Proven | `pacing.test.ts`, `pacingDom.test.ts` |
| 11 | Pacing overlap rule "slower wins" (T-201 README, JSDoc, CHANGELOG) | event rule slower than span; **event rule faster than span**; two rules of different types | **Issue** (faster-event cell) | Probe: span `{rate: 10}` around an event, rule `{near, rate: 1000}`: `pacedRate` at the event is 1000; inside the span away from the event 10. The README (line 161), `PacingInput` doc (`story.ts:39`) and CHANGELOG say "where an event rule meets a span or another rule, the slower speed wins". Cause: `pacingFor` lays spans first, then event zones sorted slowest last (`story.ts` `pacingFor`), and `pacedRate` lets a later zone win. Two rules: slower wins (10), correct. `pacing.test.ts` checks only the slower-event cell |
| 12 | Pacing validation (T-201) | NaN rate, negative ramp, empty type, missing fields, not a list, `[null]`, junk date, overlapping spans, `[]` | Proven | Probe: each `bad-timeline` naming the field; junk date `bad-time` naming `pacing[0].from` (acceptable); `[]` means no pacing |
| 13 | Override / release (T-201) | menu pick; `setRate(n)`; `setRate("auto")`; auto without pacing | Proven | `pacingDom.test.ts`, `viewerHostDom.test.ts` |
| 14 | Provenance spans (T-198, I-113) | three spans; gap fallback; empty list; zero length; outside path; bad provenance; out of order; whole path | Proven | `publicApiPaths.test.ts` plus probe (each `bad-trajectory` naming the index) |
| 15 | Opening selection (T-199, I-115) | lookAt/follow on path and body; no target; path unavailable at open | Proven | `publicApiOpeningSelection.test.ts` (derivation and the shell's `initialObjectId`) |
| 16 | 170 AU framing (T-203, I-114) | desktop, phone; declared reach wins; never narrows | Proven | `syntheticJourney.test.ts`; browser: 124 of 124 vertices in view, `traveller` label shown, both sizes |
| 17 | Journey end to end (T-203) | moons at 1979/1980 in browser; Saturn line; stop at timeline end; next-year chunk | Proven | Fresh `check:browser` `synthetic-journey` desktop and phone `ok`; `sceneFrame.test.ts`, `planetMoonSystems.test.ts` |
| 18 | Node consumer (T-203) | Saturn line, pacing, spans, out-of-span on packed package; historical moon date | Proven except the moon date (see Observation 3) | `check:node-consumer` 4 tests pass |
| 19 | Round dots (owner tweak) | no stray `PointsMaterial` | Proven | `dotMaterial.test.ts` |
| 20 | ARCH-01/05/06 | no mission names; no hard-coded body defaults | Proven | name-check tests in the full gate; fixture is made up |
| 21 | Docs and Design (T-203) | every drift note reconciled | Proven, except the two doc/behaviour mismatches above and Observation 2 | Design.md "Journeys across years"; README rows and examples; CHANGELOG Unreleased |

External boundary: browser runner used its own servers (owner's 5490 left alone); Horizons was not called by this Check (the cached importer run is executor evidence; the independent fixture test is the oracle). Workflow lock: the mount path toDefinition, prepare (planet series, sun paths, span check, fit settle, installData), ready; the two Issues are both ordering/rule faults in that path or in `pacingFor`.

## Gates (fresh, 2026-10-31 03:45 to 03:52 UTC, HEAD 2b7be6af)

| Gate | Result |
|---|---|
| `npm run lint`, `typecheck`, `build` | pass (chunk-size notice only) |
| `npm run test:full` | first run: 2 timeouts (`planetFits.test.ts` VSOP 1972-2045 case 10.6 s, `demoShowers.test.ts` geminids citation case) under load, both pass alone in 1.5 s and 0.4 s; full rerun: 155 files, 1979 passed, 1 skipped; statements 91.68%, lines 94.25% (Observation 4) |
| `npm run check:engine-alone` | pass (19.9 s) |
| `npm run check:pack` | pass (sizes above) |
| `npm run check:node-consumer` | pass, 4 tests |
| `npm run measure:example` | first open 1,607,643 B raw, 457,700 gzip |
| `git diff --check main...HEAD` | clean |
| `npm run check:browser` (once) | **pass**, all 8 steps exit 0, 0 error lines, 168 s; `docs/evidence/browser-20261031T034931Z`; logs `/tmp/astraeus-check-logs-PMGaLW`. `public-build-assets` passes under the owner's raised Jupiter page limit (7,160,000) |

## Code Health

`savepoint health check O-047 .` after the full rerun: snapshot `sha256:19d6360b...c4b` (created), "Code Health does not block clearance"; no finding in complexity, coverage, vulnerabilities, duplication or tests.

## Owner Decisions Assessed

- T-200 "Accept the larger size" (Saturn 53.46, Uranus 40.63 MB packed): work matches; limits stand.
- T-203 "Raise the limit a little" (Jupiter page raw 7,160,000): work matches; passes.
- T-203 owner look ("yes run the final check"), prose only. No structured `owner_validation.accepted_check` or `exception` exists, so no `carried_forward` entries. The two repairs below do not change what the owner looked at.
- Eight Task-check waivers (T-195 to T-201, T-203) stand as recorded (TEST-04).

## Issues (recorded on existing open Issues; no new IDs)

1. **I-112: pacing "slower wins" is false for a slow span meeting a faster event rule.** Violates T-201's stated overlap rule as documented in README line 161, `PacingInput` doc and CHANGELOG. Scenario: `setTimeline({ start: day 0, end: day 100, rate: 86_400, pacing: [{ from: day 40, to: day 60, rate: 10 }, { near: { type: "flyby", within: 86_400 }, rate: 1000 }] })` with a flyby at day 50. Expected 10 at day 50; actual 1000. Missing test: the faster-event-inside-slow-span cell in `pacing.test.ts`. Fix the rule (order zones so the slower wins wherever they meet, or document the real rule), and test both orders.
2. **I-110: a planet orbit line or `fitOrbit` before 1950 is not the named error.** Violates the O-047 condition "a scene time outside a loaded body's span fails once with a named error" and T-195 "a scene before the planet series' start fails the same named way". Scenario: `new Scene().addBody(sun).addBody(saturn, { orbit: true }).setTimeline({ start: "1945-01-01", end: "1946-01-01" })` (or `fitOrbit("saturn")` instead of `orbit`), `toDefinition()` then `prepare()`. Expected `SceneError("out-of-span")` naming saturn and 1950-01-01 to 2045-01-01; actual `TimeScaleOutOfRangeError` (thrown at `toDefinition` when the series are already loaded, else in `prepare`). Fix: check the planet span before the orbit lines and fit are worked out (both places); test both, and make the vacuous `dataSpans.test.ts` case test a date before 1950.

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-112 slower-wins | Low-Medium (a host combining a slow span with an encounter rule) | Low-Medium (playback races through the stretch the host slowed; contrary to the docs) | Medium | Fix now; one narrow repair with the next |
| I-110 orbit before 1950 | Low-Medium (a historical app with a pre-1950 timeline and orbit lines) | Low (fails once, but with a cryptic error that names no body or span) | Low-Medium | Fix now, combined with the above |

Both are small, local repairs under the recorded Issues (issue-capture.md, Out-Of-Scope Repair default); no Task retreats.

## Code Style Review

- [x] STYLE-01 **One job per file** (new `pacing.ts`, `viewerLink.ts`, `pathProvenance.ts`, `dotMaterial.ts`)
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — the faster-event and orbit-before-1950 branches are untested (the two Issues).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — `moonSystem.ts` comment on `HISTORICAL_MOON_FIT_SPAN` names `tests/moonSpans.test.ts`; the guard is `tests/historicalMoons.test.ts`.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — one data refit rewrote about 1,460 chunk files (explained in T-200: chunks are laid out from the span start).

## Owner Validation Still Needed

T-203 (`owner_validation.required: true`): after the re-check is CLEAR, the owner may record `accepted_check` against it. O-047 closes once that Check is CLEAR and the linked Issues are resolved.

## Non-blocking Observations

1. I-115 was not reproduced; the opening selection was already right and is now guarded by tests. Whether the reporter's case was a path unavailable at the opening time is unconfirmed (ask the reporter, as T-199 says).
2. Release figures are stale: CHANGELOG Unreleased gives the example's first download as 1,597,221 / 454,498 B; measured now 1,607,643 / 457,700 (later T-201/T-203 code). README line 200 still says 1,589,214 (stale since before 0.4.0). Refresh at release prep.
3. `check:node-consumer` does not exercise a historical moon date on packed packages (Node cannot fetch `file:` chunks); covered instead by `historicalMoons.test.ts` (same shipped index and chunk files) and the dev-server browser journey.
4. The full gate's two 5 s timeouts were load contention (owner dev server running; load average about 6); both cases pass alone in under 2 s. The 1972-2045 VSOP case got heavier with the longer series; consider a longer per-test timeout.
5. `moonSystem.load` reuses an in-flight load promise without checking the second caller's window (pre-existing pattern; only two scenes mounting at once could miss the span check).
6. Pressing play at the very end of a non-looping timeline now pauses straight away (`stopWithin`); intended, but the visitor must seek back first.

## Next

Direct repair under I-112 and I-110 (executor), then one Full re-check of O-047 with this scope lock. After a CLEAR re-check: owner records T-203 `accepted_check`, closes O-047, and commits at Objective close.
