---
id: C-132
scope: {kind: objective, id: O-050}
result: NEEDS WORK
checked_by: {role: checker, session: o050-check-20261101}
executed_session: o050-run-20261101
checked_at: '2026-10-31T22:30:00Z'
health_snapshot: sha256:6685ab4efeac00b988407342969460bcd2db12fd59757830aa653523274d5204
reviewed:
  base_commit: 4fca108a
  head_commit: b32bd8fd
  files: [.savepoint/Design.md, packages/astraeus-data/README.md, packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/load-budget.mjs, packages/astraeus/CHANGELOG.md, packages/astraeus/README.md, packages/astraeus/src/api/pathProvenance.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/sphereOfInfluence.ts, packages/astraeus/src/app/TrackedBodyView.ts, packages/astraeus/src/app/mission.ts, packages/astraeus/src/shell/TimelineBar.css, packages/astraeus/src/shell/TimelineBar.tsx, packages/astraeus/src/shell/timelineModel.ts, packages/astraeus/src/synthetic/syntheticJourneyScene.ts, packages/astraeus/tests/pictureList.test.ts, packages/astraeus/tests/publicApiAutoStretches.test.ts, packages/astraeus/tests/publicApiLineStretches.test.ts, packages/astraeus/tests/syntheticJourney.test.ts, packages/astraeus/tests/timelineMarkerGroups.test.ts, tools/check-node-consumer.mjs, tools/check-packs.mjs]
  dependencies: []
issues: [I-128]
unmet: [O-050-listed-stretches, O-050-automatic, T-213-done-when-1, T-216-done-when-1]
supersedes: null
---

# C-132: O-050 Full Objective Check

This is the mandatory Full Objective Check of O-050 ("Follow a probe as one path", T-213 to T-217, escalated from I-125, I-126 and I-127).

**Independence.** This session did not plan, build, repair or coordinate O-050. It wrote only these things:
- gate outputs (`coverage/`, `junit.xml`, `dist/`, packed tarballs, example builds);
- one official health snapshot (recorded above);
- the browser run folder `docs/evidence/browser-20261031T221053Z/`;
- two throwaway probe tests (each copied into `packages/astraeus/tests/`, run once, then deleted). Their source and logs are in the checker scratchpad, and the probes and results are quoted below. They ran after `test:full` and the health snapshot, and through plain `vitest run <file>`, which writes no junit or coverage, so the health inputs were not touched;
- this record and I-128.

**Baseline.** The branch is `o050-one-path`. The diff runs from plan commit `4fca108a` to HEAD `b32bd8fd` (ad0bd377, 2899eda0, b39f6adb, d01798f1, b32bd8fd) and covers 23 non-record files plus two cited browser evidence folders. This is not a lane (`git-dir` = `git-common-dir`). `docs/prds/` and `docs/research/` were not read or touched. Times are UTC; Node is v24.16.0 and npm 12.2.1.

**Records changed during this Check (not by this session).** At the start, T-217 already read `status: done` in the working tree, and the router selected `task: T-217`. Partway through, `git status` showed the router at `task: none`, with T-217's `stage: audit` line gone. This matches the board's owner close of T-217 (the board advances the router when the owner closes a Task). This session wrote neither file. The owner is told about it here, as the one-session-per-checkout rule asks.

**Verdict: NEEDS WORK.** On the sampled paths the Objective's main outcome works and is well proven:
- a listed or automatic flyby is one path with one menu entry;
- the line is drawn per stretch to within 1e-5 of an independent hand computation;
- the automatic boundaries land within one sample of an independent sphere-of-influence oracle (Earth and Moon);
- close timeline markers gather and each one opens;
- both READMEs carry the picture list and a test keeps it true;
- all gates, the packed-consumer test, the pack and engine-alone checks, and the health snapshot pass.

One reproducible defect is admitted (I-128). `addTrajectory` also takes a path as `provider` + `bounds`, and `lineFixedTo` is part of that same input. On such a path, `lineFixedTo: "auto"` throws an unnamed `RangeError` from `toDefinition`. A stretch list naming a non-centre body throws the same error when the line is drawn. The cause is provider path times that are not whole milliseconds. The plain-id form already failed this way before O-050, and the Objective widened the failure to the two new forms. The fix is likely small and general.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (lanes are advisory; nothing to evaluate, no finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first Check of O-050)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Criteria.** Under test:
   - O-050 Success Conditions: Listed stretches; Automatic; One object; Stacked timeline markers; Picture docs; Proof; Documentation;
   - Architectural Considerations ARCH-01, -02, -03, -05, -06 and PROV-01;
   - every Done When of T-213 to T-217;
   - Guardrails ARCH-01/02/03/05/06, PROV-01/02, TEST-01..04 and CODE-01/02, with STYLE as advisory;
   - release gates: `quality_gates`, `test:full`, `check:pack`, `check:engine-alone`, `check:node-consumer`, one `check:browser`, and `git diff --check`.
2. **Entry points.** These were changed:
   - `Scene.addTrajectory` (`lineFixedTo`: id, list or `"auto"`, for both `samples` and `provider`) and `Scene.toDefinition` / `prepare`;
   - `planLineStretches` and `planSpans` (`api/pathProvenance.ts`);
   - `sphereOfInfluenceKm`, `innermostHolding` and `influenceStretches` (`api/sphereOfInfluence.ts`);
   - `lineAgainstAt` and `lineBodies` (`app/mission.ts`), and the `TrackedBodyView` `#relative` / `#remap` drawing;
   - `groupMarkers` (`shell/timelineModel.ts`) and the `TimelineBar` group mark and list;
   - the synthetic journey scene, the browser smoke, the driver, the load budget, the pack limit, the consumer script, both READMEs, the CHANGELOG and Design.
3. **Relied-on behaviour.** The Check relies on:
   - the state resolver (`stateOf`, integer-ms guard);
   - catalogue GMs and parents (ARCH-05);
   - `loadPlanetSeries` and the `#deferredRead` / `#planetRead` out-of-span handling;
   - the camera follow code (`stepCameraTarget`, `resolveCamera`, `poseCamera`, `TrackedBodyView.absolute`);
   - Playwright and the preview build for the browser run.
4. **Matrix.** Axes and cells are in the Coverage Matrix below, with not-applicable cells given a reason.
5. **Admission boundary.** An Issue must break a named Success Condition or Done When item, through a supported public path: the `addTrajectory` input types as declared, in a sampled or a provider path, or the shipped viewer. Hypothetical inputs that the TypeScript types already refuse are recorded as observations.

## Coverage Matrix

Probe sources are in the checker scratchpad (`probe/o050.probe.ts`, `probe/o050b.probe.ts`). Logs: `probe/probe-log.txt` and `probe/probe-log-b.txt`. Command: each file was copied to `packages/astraeus/tests/`, run with `npx vitest run <file>` (22 and 2 tests passed), then deleted.

| # | Row | Cell | Expected | Actual | Class |
|---|---|---|---|---|---|
| M1 | list validation | unknown body, overlap, outside path, zero length, bad time, non-string body, non-list object | `bad-trajectory` naming the index | Matches. Builder test `names the index of each fault`, plus probe: `null` gives "must be a list"; `[null]` and NaN start give `lineFixedTo[0] ... not a valid moment`; a missing body gives `lineFixedTo[0] body must be a body id` | passed |
| M2 | list boundaries | starts 1 ms before the path; ends 1 ms after it; ends exactly at the path end; touching stretches | outside gives a fault; exact end and touching are accepted | Matches (probe) | passed |
| M3 | list input shape | empty list | no stretch, so the scene centre | Accepted; draws against the centre (probe) | passed |
| M4 | list input shape | the caller mutates the list after `addTrajectory` | planned stretches unchanged | Unchanged (probe `mutation-after`) | passed |
| M5 | `lineFixedTo` wrong type | number `5`, `true` | outside the declared type | `TypeError: lineFixedTo.map is not a function` from `toDefinition`. At baseline `#checkReadouts` gave `bad-trajectory` for these | observation O1 (the types refuse it) |
| M6 | single id unchanged | id against a one-stretch list; existing `publicApiSunPaths` / `publicApiPaths` | identical vertices; old tests pass | Builder test `a plain body id is the one-stretch case`; old suites pass in `test:full` | passed |
| M7 | per-stretch drawing | Sun/Mars/Sun boundary vertices | independent vertex | Builder test, within 1e-6 | passed |
| M8 | uncovered time | Earth-centred scene, Sun stretches days 0-2 and 4-6 with a gap | gap vertices are the raw samples about Earth; stretch vertices are carried by the Sun | All 7 vertices match an independent computation, error below 3.3e-8 (probe `gap-vertices`) | passed |
| M9 | shared boundary | `lineAgainstAt` at t = end of A = start of B; at the last end; inside a gap | B; the last stretch; the fallback | `["b","a","c"]` (probe) | passed |
| M10 | Moon stretch | Moon stretch in an Earth-centred scene | drawn against the Moon | Builder test; probe auto Moon (M15) | passed |
| M11 | remap per clock time | Sun-fixed stretch still, Mars stretch moves | as stated | Builder test (`earlier[2]` equal, `earlier[3]` moved) | passed |
| M12 | one object | listed and auto: one menu entry, availability = whole span, one tracked body | 1 entry | Builder tests; probe `earth-flyby` objects = 1; packed consumer | passed |
| M13 | follow across boundaries | camera target stays on the marker, in the frustum, available | yes | Builder test at ±1 h of both boundaries; browser `followAcrossStretchesChecks` at -30/-19/+19/+30 days: 247/247 vertices in view at both sizes (`docs/evidence/browser-20261031T221053Z`) | passed |
| M14 | auto oracle | Earth flyby, 10,000 km/h, hourly | enter/leave within one sample of `a (m/M)^0.4` from literal GMs (909,300 km) | enter at sample 110 (analytic 109.07), leave at 291 (analytic 290.93); bodies sun, earth, sun | passed |
| M15 | auto innermost | Sun-centred scene with sun, earth and moon; probe passes the Moon | Moon stretch inside Earth's | bodies sun, earth, moon, earth; Moon stretch at hours 114-127 (oracle 113.57-126.43, Moon SOI 64,319 km) | passed |
| M16 | auto far path | Earth-centred scene, no Sun / with the Sun | uncovered (centre) / the Sun (root holds all) | `[]` / `["sun"]` | passed |
| M17 | auto GM-less body | comet `swift-tuttle` in the scene | skipped, no error | `["sun"]`, no error; the builder's GM audit test names the comet | passed |
| M18 | auto late series | planet series not loaded: resolved in `prepare`; outside the series: `out-of-span` | as stated | Builder tests (fresh module registry) | passed |
| M19 | **provider path** | `provider` + 2-day `bounds` with `"auto"`; with a list naming Earth; with id `"earth"` | builds and draws, or a named `SceneError` | `RangeError: timeUtcMs must be an integer ...`: auto at `toDefinition`, list and id at first draw. With bounds of 127 h (whole-ms step) auto builds and draws. No-`lineFixedTo` baseline draws | **Issue I-128** (the id case is older than O-050) |
| M20 | `"auto"` reserved | `addBodyFromElements({ id: "auto" })` | README: "not usable as a body id" | Accepted without error (probe) | observation O2 |
| M21 | groupMarkers | exact 22 px splits; 21.99 px joins; equal times; chaining; 5 events in 5 h at 300 px | as stated | `[1,1]`, `[2]`, `[3]`, chain of 4 at its mean, `[5]` (probe); builder layout tests at 300 and 1200 px | passed |
| M22 | groupMarkers unmeasured / empty / zero window | nothing gathered; `[]`; no throw | as stated | Builder tests | passed |
| M23 | marker reachability | each of the five events opens, by pointer and keyboard; Escape closes; isolated markers unchanged | as stated | Builder DOM tests; browser `closeMarkerChecks` at 1280x720 and 375x667: 4 events, each item inside the screen, ≥ 32 px, not overlapping, seeks its own event | passed |
| M24 | marker kinds | panel and peak members in a group | each does its own marker's action | Same `activate` closure as the single marker (code). Panel group items are exercised in the browser by the hello-scene panel fallback; peak members are reviewed in code only | passed (peak by code review) |
| M25 | Previous/Next | still steps through every event | unchanged | `navigationStops` is untouched by the diff | passed |
| M26 | picture docs | both READMEs list the pack's moons and name Uranus's five; test derived from `PICTURES` | as stated | Both passages present, matching the 13 moons. `pictureList.test.ts` reads `PICTURES` and `listedMoons()`. A new picture key changes the expected string, so the test fails until the READMEs follow | passed |
| M27 | ARCH-01/06 | no body or mission names in the rule | none | `sphereOfInfluence.ts` and `#autoStretches` name no body; the body-name check passes in `test:full` | passed |
| M28 | ARCH-02 | State and `stateOf` unchanged | unchanged | The diff touches no `core/` State code | passed |
| M29 | ARCH-05 | GM read from the one body definition | catalogue | `this.#catalogue.get(id).definition.gmKm3S2` | passed |
| M30 | PROV-01 | stretches leave provenance alone | separate | `provenanceSpans` are planned separately; no provenance field touched | passed |
| M31 | packed package | listed, auto and Moon-orbit cases | one menu object each; resolved stretches | `check:node-consumer`: 7 tests passed | passed |
| M32 | documentation | README row, API comment, CHANGELOG Unreleased with size, Design | present | All present; size line +5,956 B raw / +1,752 B gzip. Design paragraph "One path through every stretch (O-050)" covers every Drift Note | passed (see O3, O4) |

Not applicable:
- text classes (no text width or truncation in scope);
- no-colour / redirected sinks (no terminal output in scope);
- serialization round trips (stretches are not serialized past `toDefinition`).

## Finite External-Boundary Matrix

The browser run is the only external boundary: Playwright, the preview build and the static server.

| Cell | Classification |
|---|---|
| configured and actual target | The runner builds and serves its own preview build. The :5490 preview was left as it was |
| startup, discovery, reuse | One run; the runner owns its server |
| connection refused / unavailable | Not exercised: the run started normally |
| non-success response | Covered by the `public-addresses` and `public-build-assets` steps |
| redirect | Covered by `public-addresses` |
| timeout / cancellation | Step timeouts belong to the runner; none fired |
| malformed response | Not applicable: no changed parser |
| retry, cleanup, partial effects | One run, no retry (browser policy). Logs went to the scratch folder the summary names |
| secret-safe output | Not applicable: no secrets in scope |

## Workflow And Side-Effect Check Lock

The `"auto"` resolution workflow (`Scene.toDefinition` → `prepare`) runs in this order:

1. Inputs are checked in `addTrajectory`: the list goes through `planLineStretches`, and `"auto"` is stored as a flag.
2. `#checkReadouts` checks each listed body against the scene's ids.
3. When the planet series are in, `auto.now` resolves through `#deferredRead`. An `out-of-span` error is stored as `fault` and rethrown in `prepare`; any other error throws from `toDefinition`.
4. Otherwise `prepare` loads the planet series, runs `#checkPlanetSpan`, then `auto.settle` through `#planetRead`. `tracked[index]` is replaced; it is the only side effect.

The oracle for this workflow is:
- the builder's late-load tests, which show `trackedBodiesOf` and the `TrackedBodyView` input carrying the resolved list;
- the probe M16 to M19 results.

The failure case is M19: a `RangeError` that is not a `SceneError` passes through `#deferredRead` and throws from `toDefinition` for provider paths. Nothing was partly written, because the definition is never returned.

The rendering side has no persistence; the stretch list is fixed per definition.

## Gates (fresh, HEAD b32bd8fd, 2026-10-31 UTC)

Runner: `scratchpad/gates/run.sh` runs the commands in sequence. Logs are in `scratchpad/gates/*.log` and the summary in `scratchpad/gates/summary.txt`.

| Command | Time (UTC) | Result |
|---|---|---|
| `git diff --check 4fca108a..HEAD` | 22:05:37 | rc 0 |
| `npm run lint` | 22:05:37-22:05:41 | rc 0, clean |
| `npm run typecheck` | 22:05:41-22:05:49 | rc 0 |
| `npm run build` | 22:05:49-22:05:52 | rc 0 (chunk-size warning only) |
| `npm run test:full` | 22:05:52-22:07:01 | rc 0: 166 files, 2060 passed, 1 skipped; statements 91.82%, lines 94.38% |
| `npm run check:pack` | 22:07:01-22:07:16 | pass; astraeus 472 files (limit 472), 7.16 MB packed |
| `npm run check:engine-alone` | 22:07:16-22:07:36 | pass (1136 passed, 1 skipped) |
| `npm run check:node-consumer` | 22:07:36-22:07:38 | pass, 7 tests (including the O-050 one-path test) |
| `npm run check:browser` (once) | 22:10:53-22:16:06 | rc 0, 313 s: all 8 steps exit 0 with 0 error lines. Steps: smoke 234 s, smoke-public-showers, planets-phone, meteor-shower, hello-scene, hello-react, public-build-assets, public-addresses. Evidence: `docs/evidence/browser-20261031T221053Z/`; logs in `/tmp/astraeus-check-logs-Mqu8i0`. Synthetic journey readouts at desktop and phone: `followed.seen` gives 247 of 247 line vertices in view at Jupiter -30/-19/+19/+30 days, and `closeMarkers` gives a 5-member mark holding Io, Jupiter, Europa and Ganymede, each opened at 1280x720 and at 375x667 |

`npm test` (the configured test gate) is a subset of `test:full`, which ran in its place with the junit reporter. Gate runs were sequential; nothing heavy overlapped the browser run.

## Code Health

`savepoint health check O-050`, run after the full gate, saved snapshot `sha256:6685ab4efeac00b988407342969460bcd2db12fd59757830aa653523274d5204` (created). Verdict: "Code Health does not block clearance." The complexity, coverage, dependency-vulnerability, duplication and test instances (all optional) each reported "no blocking finding". This is supporting evidence only; it neither grants nor withholds `CLEAR`.

## Owner Decisions Assessed

- **Task-check waivers**, T-213 to T-217 (owner, session o050-run-20261101). These are recorded on each Task as `check_waiver`. They waive only the optional Task Checks; no acceptance criterion and not this Check. They apply.
- **Apollo 11 raw budget 4,500,000 B** (owner, recorded in T-217 Technical Evidence and in the `load-budget.mjs` comment). The budget file is unchanged since; it applies.
- **T-217 owner look** ("looks good", 2026-10-31T22:04:59Z). It is recorded as evidence, not as a structured `owner_validation.accepted_check`; that acceptance belongs to the owner against a `CLEAR` Check. I-128 is outside what the owner looked at: the synthetic journey uses samples.

No structured `exception` or `carried_forward` entries exist on O-050, so there is nothing to carry forward.

## Issues

- **I-128** (defect, medium). A provider path's line fails when it is fixed to another body: `"auto"` at build, a listed non-centre stretch at draw. The cause is non-integer provider path times (`scene.ts:943-944`) meeting the resolver's integer-ms guard. It breaks the Listed stretches and Automatic Success Conditions, and T-213 / T-216 Done When 1, for the `provider` + `bounds` form of `addTrajectory`.
  - Smallest scenario: a Sun + Earth scene, `provider` near Earth, `bounds` of 2 days, `lineFixedTo: "auto"`, then `toDefinition()`.
  - Expected: builds (or a named `SceneError`). Actual: `RangeError`.
  - Missing test: the new suites and the consumer use sampled paths only.

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-128 | Low to Medium: needs a provider path, which the probe app and demos do not use, but `lineFixedTo` is a public option on that form and any ordinary span triggers it | Medium: the scene fails to build or draw, with an unnamed error | Medium | Fix now as one narrow repair: whole-ms provider path times, which also fixes the older id case (strategic fix first). Add a regression test over id, list and auto on a provider path, then a targeted re-check |

## Code Style Review

- [x] STYLE-01 **One job per file**: the sphere of influence lives in its own pure module; span planning is shared in `pathProvenance.ts`.
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches**: the provider-path branch of `lineFixedTo` (I-128) and the peak-member group action have no test.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [ ] STYLE-06 **Handle errors at boundaries**: a non-string, non-object `lineFixedTo` now ends in `TypeError` in `lineBodies` (`app/mission.ts`) rather than `bad-trajectory` (O1).
- [x] STYLE-07 **One source of truth**: `planSpans` is shared by `provenanceSpans` and `lineFixedTo`.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: `TimelineBar.tsx` (112 lines changed) and `scene.ts` (73) in single steps; reasonable for the feature, though the long one-line JSX and `addTrajectory` statements are hard to review.

## Owner Validation Still Needed

- T-217 declares `owner_validation.required: true`. Once a later Check is `CLEAR`, the owner records acceptance (`accepted_check`). The look itself is already recorded.
- Objective closure stays with the owner, after I-128 is repaired and re-checked or owner-accepted.

## Non-blocking Observations

- **O1.** `lineFixedTo: 5` or `true` (outside the TypeScript type) now throws `TypeError: lineFixedTo.map is not a function`; at baseline it threw `bad-trajectory`. Small follow-up: refuse any non-string, non-list value in `addTrajectory` with `bad-trajectory`.
- **O2.** The README says `"auto"` "is not usable as a body id", and the API comment says "no body may carry that id". Neither is enforced: `addBodyFromElements({ id: "auto" })` is accepted, and `lineFixedTo: "auto"` then means automatic. Consider refusing the id with `bad-element`.
- **O3.** The CHANGELOG proof line says "I-124 to I-127"; I-124 (scene switch) is the next Objective. The README's worked example (line 62) still shows only `lineFixedTo: "sun"`. T-217 asked for "example lines"; the `addTrajectory` row carries the new forms.
- **O4.** The `/** A bounded trajectory the scene can draw. Nothing here names a mission. */` comment in `app/mission.ts` now sits above `LineStretch` instead of `TrackedBody`.
- **O5.** The browser follow check seeks to either side of each boundary rather than playing through at fast playback. Fast playback across the boundaries rests on the node follow test and the owner's look.
- **O6.** Chained grouping can gather a long run of markers spaced just under 22 px into one mark; the mark sits at the mean. This is acceptable for the stated case and noted for very dense timelines.
- **O7.** The hello-scene example's story panels now sit under a numbered mark (T-217 defect 2). Behaviour is correct, and the owner may want to see it on the example.
