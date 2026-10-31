---
id: C-129
scope: {kind: objective, id: O-048}
result: CLEAR
checked_by: {role: checker, session: o048-check-20261031}
executed_session: o048-run-20261031
checked_at: '2026-10-31T09:13:00Z'
health_snapshot: sha256:825f1f2cbd7804a3e76c179477b4c5320aca1127c91c69d3b0d8eda250f60fc6
reviewed:
  base_commit: 4b7a940a
  head_commit: 2813d8ca
  files: [.savepoint/Design.md, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/story.ts, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/LayeredRender.tsx, packages/astraeus/src/app/OrbitSetView.ts, packages/astraeus/src/app/SceneLabels.ts, packages/astraeus/src/app/SkyView.ts, packages/astraeus/src/assets/bodies/jupiter.ts, packages/astraeus/src/assets/bodies/outerPlanetCatalogues.ts, packages/astraeus/src/assets/bodies/outerPlanetRings.ts, packages/astraeus/src/assets/bodies/planetSystemMaps.ts, packages/astraeus/src/assets/compositions.ts, packages/astraeus/src/assets/visual.ts, packages/astraeus/src/core/bodies/io.ts, packages/astraeus/src/core/bodies/jupiterMoons.ts, packages/astraeus/src/core/bodies/moon.ts, packages/astraeus/src/core/bodies/moonSystem.ts, packages/astraeus/src/core/bodies/outerPlanetData.ts, packages/astraeus/src/core/bodies/outerPlanetRingData.ts, packages/astraeus/src/core/bodies/planetMoons.ts, packages/astraeus/src/core/body.ts, packages/astraeus/src/core/events.ts, packages/astraeus/src/core/satelliteMeanElements.ts, packages/astraeus/src/core/siderealPeriod.ts, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/synthetic/syntheticJourneyScene.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus/tests/logDepth.test.ts, packages/astraeus/tests/moonOrbitLines.test.ts, packages/astraeus/tests/publicApi.test.ts, packages/astraeus/tests/publicApiRings.test.ts, packages/astraeus/tests/publicApiStory.test.ts, packages/astraeus/tests/sceneLabelsHysteresis.test.ts, packages/astraeus-demo-planets/src/experiences/planets/planetDefinition.ts, packages/astraeus-demo-planets/src/experiences/planets/planetSettings.ts, packages/astraeus-demo-planets/src/experiences/planets/systems/jupiter.ts, packages/astraeus-demo-planets/src/experiences/planets/systems/saturn.ts, packages/astraeus-demo-planets/src/experiences/planets/systems/uranus.ts, packages/astraeus-demo-planets/src/experiences/planets/systems/neptune.ts, packages/astraeus-demo-planets/tests/demoPlanets.test.ts, packages/astraeus-demo-planets/tests/jupiterMoonsScene.test.ts, packages/astraeus-demo-planets/tests/planetDefinition.test.ts, packages/astraeus-demo-planets/tests/planetSystems.test.ts, packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus-site/tools/validate/load-budget.mjs, tools/check-node-consumer.mjs, tools/check-packs.mjs]
  dependencies: []
issues: []
supersedes: null
---

# C-129: O-048 Full Objective Check

Mandatory Full Objective Check of O-048 ("Keep near planets visible and show their rings", T-204 to T-209; Issues I-117 to I-121).

**Independence.** This session did not plan, build, repair or coordinate O-048. It wrote only gate outputs (`coverage/`, `junit.xml`, `dist/`, example builds), two health snapshots (the official one is recorded above), the browser run folder `docs/evidence/browser-20261031T090631Z/`, one throwaway probe test (copied into `packages/astraeus/tests/`, run after the first full gate, then deleted; the full gate was rerun afterwards), this record, and resolution entries on I-117 to I-121.

**Baseline.** Branch `o048-near-planets-rings`, plan commit `4b7a940a` to HEAD `2813d8ca` (c1ea9363, aec2198b, 216b9159, 005b4a94, 23fbfdb9, 2813d8ca), 49 non-record source/test/doc files. Not a lane (`git-dir` = `git-common-dir` = `.git`). `docs/prds/` and `docs/research/` not read or touched. Times UTC; Node v24.16.0.

**Verdict: CLEAR.** All five fixes are in the code, tested on made-up scenes, proven by an independent probe and a fresh browser run, and the owner's GPU look passed. No Issues. One criterion is partly unverified but not material (T-204 frame-time before/after; see row 3 and Owner Decisions).

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

1. Criteria: O-048 Success Conditions (depth precision, rings by default, every moon's orbit line, Go to frames the event's object, steady labels, proof, documentation); each Task's Done When (T-204 to T-209); Guardrails ARCH-01 to ARCH-06, PROV-01, PROV-02, TEST-01 to TEST-04; gates: lint, typecheck, build, `test:full`, `check:engine-alone`, `check:pack`, `check:node-consumer`, one `check:browser`, `git diff --check`, Code Health.
2. Entry points: the `Canvas` renderer set-up (`AstraeusScene.tsx`), every custom shader in `src/app`, the catalogue visuals (`catalogue.get(id).visual.rings`), `Scene.addBody(id, { orbit: true })` and `toDefinition` composition paths, `Scene.addEvents([{ object }])` and `toDefinition`, the shell's timeline Go to / Previous / Next (`seekToEvent`), `SceneLabelLayer.update`, the synthetic journey, the packed package.
3. Relied-on runtime: three.js log-depth chunks and the renderer capability flag; the shell's Focus preset (`focusPresetFor`, `availableObjectById`); the moon mean-element records (`data/orbits/*.json`) and their `periodRule`; the browser driver readouts (`data-depth-mode`, `data-rings`, `data-body-screen`, `data-paths`).
4. Matrix below. Not applicable: text classes (labels are placed, not truncated or measured as text); output sinks (no CLI); serialization round trip (definitions are in-memory).
5. Admission: a supported public-API or viewer path, a named criterion or guardrail, a credible consequence for an app on the public API.

## Coverage Matrix

| # | Row (criterion) | Cells | Result | Evidence |
|---|---|---|---|---|
| 1 | Log depth engine-wide (T-204) | renderer flag; per-scene vs engine-wide | Proven | `AstraeusScene.tsx` Canvas `gl={{ antialias: true, logarithmicDepthBuffer: true }}` (the only Canvas); `logDepth.test.ts` "the Canvas asks for it"; browser run reads `data-depth-mode` = `logarithmic` desktop and phone |
| 2 | Every custom shader carries log depth (T-204) | ShaderMaterial in `src/app`; RawShaderMaterial; `onBeforeCompile` patches; allowlist; shaders outside `src/app` | Proven | Repo grep: custom shaders exist only in `src/app` (`OrbitSetView`, `SkyView`, `PointsView`, `KeplerPoints`, `dotMaterial`). `OrbitSetView` includes `common` + four logdepth chunks; `SkyView` allowlisted with reason and the test enforces `depthTest: false` per material; patches keep stock chunks (replace only `void main() {` / `begin_vertex`, before `logdepthbuf_vertex`). Guard test fails on a missing chunk or RawShaderMaterial |
| 3 | Depth set-up and cost (T-204) | I-117 scene near/far/mode; frame-time before/after; REPLAN trigger | Proven (set-up); **Unverified, non-material** (cost) | Set-up test prints near 22.567, far 5.7e7, ratio > 1e6, mode logarithmic. Cost: only "after" headless numbers exist (this run 21 fps desktop / 51 fps phone near Saturn; builder's 5 / 43), no "before" and no GPU figure. Headless software GL cannot show the log-depth cost and swings 4x between runs, so the missing before figure would prove nothing; the Objective's actual rule is "REPLAN if a measured cost is unacceptable", no shader failed to carry log depth, and the owner's GPU look passed. Not admitted as an Issue; listed as an owner decision |
| 4 | Near Saturn draws with whole-path reach (O-048 Proof, I-117) | desktop; phone; rings in scene; moon orbit lines | Proven | Fresh `check:browser` smoke, synthetic-journey: Saturn `sphere`, radiusPx 702.7 / 659.0, rings 10 bands, europa/ganymede/titan orbit lines present, depth logarithmic. GPU: owner look 2026-10-31T09:02:19Z ("Looks good, run final check") recorded in T-209 |
| 5 | Rings in the one catalogue definition (T-205, I-118) | each of the four ringed planets; every other catalogue body; source recorded; scene override absent; demos unchanged | Proven | Probe over every `catalogue.ids()`: rings present exactly for jupiter, saturn, uranus, neptune, `rings.body` matches, sources non-empty; a plain `addBody(saturn)` scene has no rings override (catalogue supplies them). Demo diff only removes `rings:` of the same constants (`JUPITER_RINGS`, `SATURN_RINGS`, ...) and the `visualOverrides` line, so demos draw the same bands. `publicApiRings.test.ts` asserts NSSDC sources. Packed: `check:node-consumer` reads Saturn bands > 0, Mars none |
| 6 | Ring provenance (PROV-01/02) | info-card display | Proven (as scoped) | RingSystem `sources` carry NSSDC fact sheets; PROV-02 concerns textures; no ring card added (stated reason in T-205, no new UI in scope) |
| 7 | First-download size (T-205) | measured before/after | Proven | +8,692 raw / +2,751 gzip after the ring/moon-list split (T-205 evidence); browser load budget this run: Apollo 11 page 4,460,925 B raw (limit 4,470,000, owner-raised) / 2,829,833 gzip (2,900,000) |
| 8 | Any moon's orbit line by one rule (T-206, I-119) | every catalogued moon; Moon and Io unchanged; period oracle; no-period moon; planet absent; unknown id; planet Sun orbit unaffected | Proven | Probe over every catalogue body with a non-Sun parent: 14 moons draw one lap equal to `orbitPeriodDays`; each within 0.5% of an independent published sidereal-period table (Moon 27.3217, Io 1.7691, Europa 3.5512, Ganymede 7.1546, Callisto 16.6890, Mimas 0.9424, Enceladus 1.3702, Tethys 1.8878, Dione 2.7369, Rhea 4.5175 vs 4.5182, Titan 15.9454, Iapetus 79.331 vs 79.322, Triton 5.8769, Charon 6.3872). Moon keeps the fading look, others `endFadeOn: false` (Io's look). Phobos, Deimos: `no-orbit` at `addBody`; Titan without Saturn: `no-orbit` naming saturn at `toDefinition`; `addBody(sun).addBody(saturn,{orbit})` still takes the Sun-orbit path. `ORBITS` list removed (no name list left in `scene.ts`) |
| 9 | Refusal point for a moon without a period (T-206 Done When "at `toDefinition`") | where it throws; message | Proven in substance | The code throws the same `no-orbit` earlier, at `addBody`, like every other `no-orbit` refusal of `#register`; README, CHANGELOG and Design say `addBody`. Failing earlier is strictly stronger for the caller and loses nothing. The message states the rule ("any catalogued moon whose data give a period about its planet"), not "phobos has no period" specifically (observation 2). Not admitted as an Issue |
| 10 | OrbitSetView reuse (T-206) | reuse or stated reason | Proven | Stated reason (per-frame osculating sampling in the app layer vs one static span at `toDefinition`), reflected in Design |
| 11 | Event `object` validated (T-207, I-120) | absent; body; trajectory; body added after `addEvents`; catalogued but not in scene; unknown id; empty; number; null | Proven | Probe: trajectory and late-added body accepted; `moon` not in scene and `ghost` give `bad-event` naming event and id at `toDefinition`; `""`, `5`, `null` give `bad-event` at `addEvents` |
| 12 | Go to / Previous / Next frame it (T-207) | event row with object; without; Next; Previous; Next again; clock time | Proven | Existing test (row press: plain no camera request, flyby `{focus, moon}`, selected, clock at event). Probe through `.timeline-previous` / `.timeline-next`: `{focus, moon}` then `{focus, probe}` (selected probe) then `{focus, moon}`, clock exactly at each event. `goToStop` routes through `seekToEvent` |
| 13 | ARCH-02 / ARCH-06 for framing (T-207) | State changed?; default body? | Proven | `seekToEvent` only seeks (existing) and activates `focusPresetFor` the event's own object; no fallback body; object unavailable at the event time only seeks |
| 14 | Steady labels (T-208, I-121) | crossing with jitter; margin 0 reproduction; selected label; labels off; non-candidates | Proven | `sceneLabelsHysteresis.test.ts` (margin 0 reproduces 3 changes; with 14 px at most 2 per crossing); code: hidden-by-overlap needs `LABEL_PADDING_PX + LABEL_REAPPEAR_MARGIN_PX`, constants in one place; selected label is placed first (`SELECTED_PRIORITY`) into an empty `occupied`, so the margin never delays it; non-candidates are dropped from memory. Layout only (ARCH-02) |
| 15 | Journey fixture and checks (T-209, ARCH-01) | made-up names; rings default; moons beyond Io; events with objects; node consumer | Proven | `syntheticJourneyScene.ts` adds `orbit: true` on Europa, Ganymede, Titan and `object` on both passes, made-up names only; `check:node-consumer` 5/5 incl. Titan 15.945 d about Saturn and rings |
| 16 | Docs and Design (O-048 Documentation, Project Rule deferred reconciliation) | README rows; CHANGELOG Unreleased; API reference; every drift note | Proven | README `addBody` and `addEvents` rows; five CHANGELOG lines; Design.md Interfaces and Data Flow paragraph "Near planets and rings (O-048)" covers each T-204..T-208 drift note; T-209's budget raise marked non-architectural with reason |

## Finite External-Boundary Matrix

| Boundary | Cell | Result |
|---|---|---|
| Browser runner (`check:browser`) | configured vs actual target, startup and reuse, success | Pass: 8 steps, dev + preview + example servers started by the runner, exit 0 each, `docs/evidence/browser-20261031T090631Z/summary.txt` |
| Browser runner | non-success, timeout, cleanup, secret-safe output | Not applicable: no failure path changed by O-048 (only a new case inside `journeyChecks`) |
| Packed package (node consumer, pack) | success; file-count limit | Pass; astraeus 464 files at the 464 limit (observation 1) |
| GPU | real hardware | Owner look only (no automated GPU in this environment) |

## Workflow And Side-Effect Check Lock

O-048 adds no persistence, transaction or artifact workflow. The only multi-step path is Go to: (1) `seek(event.timeUtcMs)` (clock), (2) resolve the event's object at the event time, (3) `activatePreset(focus)` (selection + camera request), (4) info update. Failure owner: an object unavailable at the event time stops after (1), as documented. Oracle: the shell's camera request log and clock (rows 12, 13).

## Gates (fresh, HEAD 2813d8ca, 2026-10-31 UTC)

| Gate | Result |
|---|---|
| `npm run lint`, `typecheck`, `build` | pass (build: the existing chunk-size warning only) |
| `npm run test:full` | pass, 159 files, 2006 passed, 1 skipped; statements 91.69%, branches 86.36%, lines 94.29% (run twice: once before the probe, once after it was deleted so the health reports are fresh; same result) |
| `npm run check:engine-alone` | pass (19.6 s) |
| `npm run check:pack` | pass; astraeus 7.13 MB packed, 464 files (limit 464) |
| `npm run check:node-consumer` | pass 5/5 |
| `npm run check:browser` | pass, run ONCE, 09:06:31Z to 09:10:06Z, no other browser job in parallel: smoke (9 views x 2 sizes), smoke-public-showers, planets-phone, meteor-shower, hello-scene, hello-react, public-build-assets, public-addresses; evidence `docs/evidence/browser-20261031T090631Z/`. No screenshots |
| `git diff --check 4b7a940a..HEAD` | one trailing space in the T-206 record (`Body-set layer reuse: stated in Drift. `); no code whitespace errors (observation 4) |
| Independent probe | 5/5 pass (rows 5, 8, 11, 12); file deleted |

## Code Health

`savepoint health check O-048 .` after the rerun full gate: snapshot `sha256:825f1f2cbd7804a3e76c179477b4c5320aca1127c91c69d3b0d8eda250f60fc6` (created), "Code Health does not block clearance"; complexity, coverage, vulnerabilities, duplication and tests all "no finding". An earlier snapshot this session (`sha256:0fc3bc1d...`) reported coverage and tests stale because the throwaway probe was written into `tests/` after the first full run; it is superseded by the rerun and not used as evidence.

## Owner Decisions Assessed

No structured `owner_validation.accepted_check` or `exception` on O-048 yet, so no `carried_forward` entries. Recorded decisions stand, scope unchanged: six Task-check waivers (T-204..T-209, owner "orchestrate O48"); owner GPU look 2026-10-31T09:02:19Z; Apollo 11 raw load budget 4,450,000 to 4,470,000 B (measured 4,460,925 B this run, inside it).

## Issues

None. No materiality actions are required.

## Code Style Review

- [x] STYLE-01 **One job per file** — ring data and the period rule moved to their own small files.
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries** — event `object` checked at `addEvents` (shape) and `toDefinition` (presence).
- [x] STYLE-07 **One source of truth** — `ORBITS` name list and demo ring attachments removed; Moon month from `MOON_SIDEREAL_PERIOD_DAYS`.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data** — periods read from `data/orbits/*.json` by each record's own `periodRule`.
- [x] STYLE-10 **Small diffs**

## Owner Validation Still Needed

T-209 (`owner_validation.required: true`): the owner may record `accepted_check: C-129` and set T-209 done. O-048 then closes when the owner accepts the outcome (its frontmatter still says `status: planned`; it was never moved to `in_progress`). The owner may also choose whether a GPU frame-time measurement of log depth is wanted as follow-up (row 3).

## Non-blocking Observations

1. `check:pack`: the astraeus file count is exactly at its limit (464 of 464); the next added source file fails the gate and will need another raise. The Apollo 11 raw budget has 9,075 B of headroom.
2. The `no-orbit` message for a moon without a period states the general rule; naming the moon's missing period ("phobos: no mean-element record") would be clearer.
3. Headless frames-per-second near Saturn varies about 4x between runs (5 vs 21 desktop), so `nearSaturnChecks`' figure is only a sanity number, as its comment says.
4. Trailing whitespace in the T-206 record (record text only).
5. `planetSettings.ts` comment now reads "the positions, moon list, pictures come from" (lost its "and").
