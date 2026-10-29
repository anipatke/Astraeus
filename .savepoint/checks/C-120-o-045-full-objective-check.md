---
id: C-120
scope: {kind: objective, id: O-045}
result: NEEDS WORK
checked_by: {role: checker, session: o045-full-check-20261029}
executed_session: o045-run-20261028
checked_at: '2026-10-29T10:36:00Z'
health_snapshot: sha256:36b41ea7e563dfa86168f054f29b7ed664f22aeb3af85cce382319f083f296bb
reviewed:
  base_commit: 3e999c38
  head_commit: 40a65cc0
  files: [.savepoint/Design.md, packages/astraeus-demo-showers/tests/rebuildComparison.test.ts, packages/astraeus/CHANGELOG.md, packages/astraeus/README.md, packages/astraeus/src/api/group.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/story.ts, packages/astraeus/src/api/sunOrbit.ts, packages/astraeus/src/app/experienceDefinition.ts, packages/astraeus/src/app/sceneContentsHooks.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/sceneFraming.ts, packages/astraeus/src/core/bodies/swiftTuttle.ts, packages/astraeus/src/core/elementsBody.ts, packages/astraeus/src/core/provenance.ts, packages/astraeus/src/shell/experience.ts, packages/astraeus/src/shell/infoModel.ts, packages/astraeus/tests/fitOrbit.test.ts, packages/astraeus/tests/publicApiStory.test.ts, packages/astraeus/tests/publicApiSunOrbits.test.ts, packages/astraeus/tests/stateOfBodies.test.ts, tools/check-node-consumer.mjs]
  dependencies: []
issues: [I-094]
supersedes: null
unmet: [O-045-SC-Documentation, T-188-README-claims-match-code]
---

# C-120: O-045 Full Objective Check

Full Objective Check of O-045, "Answer what outside sites had to compute themselves" (T-185, T-186, T-187, T-188; all `done`, each with an owner-recorded Task-check waiver from session o045-run-20261028; waivers are not CLEAR and this Check covers every Task).

**Independence.** This session did not plan, build or coordinate any O-045 work; it started from the coordinator's request with the Next line "Record the Objective O-045 integration Check." It wrote only gate outputs (`coverage/`, `junit.xml`, package `dist/` folders, example builds), the official health snapshot, the browser run folder `docs/evidence/browser-20261029T102724Z/`, throwaway probes in its scratchpad, I-094 and this record.

**Baseline.** HEAD `40a65cc0` on `o045-answers`; diff `3e999c38..HEAD` (4 commits, 29 files, +560/-53). Not a worktree lane (`git-dir` = `git-common-dir` = `.git`). The tree held the uncommitted owner trial in `packages/astraeus/src/app/SkyView.ts` (I-026), outside O-045: not reviewed, not modified, not counted, but present while the gates and the browser run ran (all pass with it). Untracked `docs/prds/` and `docs/research/` were not read or touched. Times UTC.

**Verdict: NEEDS WORK.** Every behaviour Success Condition (position query, accuracy, orbit fitting, provenance alignment, card parity, proof) is proven by fresh gates and independent probes, and every gate passed, including `check:browser` 8/8. One documentation Issue blocks: the README `stateOf` row and its doc comment promise velocity for any body, but catalogue and elements bodies return position only (I-094, Low materiality, a two-sentence direct repair). Unmet: the Documentation Success Condition and T-188's "every README claim matches the code at this commit".

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature here; no lanes used; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first Check of O-045; no prior Checks, Issues or owner exceptions on this scope)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Requirements tested.** O-045 Success Conditions: SC-Position, SC-Accuracy, SC-Fit, SC-Provenance, SC-Card, SC-Documentation, SC-Proof (owner decisions 2026-10-28). Each Task's Done When and Boundaries (T-185 to T-188). Guardrails named by the Tasks: ARCH-01, ARCH-02, ARCH-03, TEST-01, TEST-02, TEST-03, TEST-04, STYLE-*. Release gates: hand-off gates, `npm run test:full`, `check:engine-alone`, `check:pack`, `check:node-consumer`, `measure:example`, `check:browser` once. Design reconciliation of every deferred Drift Note (T-188).
2. **Changed files and entry points.** The files in `reviewed.files` plus the `.savepoint` records. Public entry points: `Scene.stateOf`, `Scene.provenanceOf`, `SceneCamera.fitOrbit` / `fitted` / `setReach`, `Scene.addEvents` (`EventInput.provenance`), `GroupInput.provenance` doc, root exports `APPROXIMATE_LIMIT_FRACTION`, `INDICATIVE_LIMIT_FRACTION`, `classifyPositionError`, `parseElementsBodyRecord`, `AccuracyClassification`, `Provenance.accuracyClass` / `maxErrorFraction`, `ProvenanceSourceType "modelled"`; viewer paths `liveReach` (per frame in `stepAndPoseCamera`, pointer limits in `useScenePointer`), `infoView` event cards, `createMetrics` card rows; the packed package via `check:node-consumer`.
3. **Relied-on runtime.** The catalogue state sources and `createStateResolver` (the viewer's resolver, `App.tsx:106` built from `catalogueOf(definition)`); the planet series loader (`core/planetSeries.ts`); the camera step and clamp (`stepCameraTarget`, `focusLimits`); `bodyMetrics`; `createProvenance` validation.
4. **Matrix axes** below; not-applicable cells carry a reason.
5. **Materiality boundary.** An Issue must violate a Success Condition, a Done When or Boundary, a Guardrail or a gate through a supported path (the public API in Node or under `mount`/`AstraeusScene`, the published README and API reference). Real-browser resize of a fitted scene is not separately driven (no demo uses `fitOrbit`; browser policy allows one run, which covers the shared per-frame path).

## Acceptance Invariants And Coverage Matrix

Probe harness: `<scratchpad>/probe/probe.test.ts` (19 tests, all pass) and `probe2.test.ts` (no planet series), run with Vitest against the source at HEAD; independent oracle is the viewer's own resolver (`createSceneResolver(adapter, catalogueOf(definition)).stateOf(id, t, parent)`) and hand-computed figures.

| # | Requirement (general rule) | Cells | Evidence | Result |
|---|---|---|---|---|
| SC-Position / T-185.1 | `stateOf(id, t)` gives the State the viewer draws for every body kind; unknown id `unknown-body`; only a path refuses a date (`bad-time`) | earth, moon, mars, jupiter, io, swift-tuttle, elements body, sun; ISO vs Date input; unknown id; catalogued but not added (`saturn`); `NaN` and `"garbage"` time; elements body far outside its compared window (2090); path inside / 1 ms before start; planet before series load | Probe: position difference 0 km for all seven bodies vs the viewer resolver, centre = catalogue parent; sun at origin; ISO = Date; `nope` and `saturn` → `unknown-body`; NaN/garbage → `bad-time`; 2090 answered; path interpolates, 1 ms early → `bad-time` "outside the path" (message unchanged). Without the series, `earth` answers and `mars` → `missing-data`. `stateOfBodies.test.ts` (3 tests) and `publicApiStory.test.ts` green in the gate. Velocity: see I-094 | Proven (position, errors); documentation Issue I-094 |
| SC-Position (group members) | Group members addressable by id | n/a: group members are not addressable by id in the API (only the group id, which has no single State); owner wording "if addressable" | Code: `stateOf` consults `#tracked` and `#bodies` only | Not applicable |
| SC-Accuracy / T-185.2 | `provenanceOf` returns the card's position provenance; class and fraction for Swift-Tuttle and elements bodies only | swift-tuttle; elements approximate; elements indicative; earth; moon; path; unknown id; frozen | `stateOfBodies.test.ts` (Swift-Tuttle 0.00857, indicative 0.05, earth none, `mars` unknown). Probe: approximate record → `{approximate, 0.01}`; moon none; path returns its own (`modelled`); frozen; equals the card object's provenance. `SWIFT_TUTTLE_MAX_ERROR_FRACTION = 0.00857` (`swiftTuttle.ts:47`). Field doc says "the largest difference found, or the limit of the class"; README/CHANGELOG/Design say the elements figure is an upper bound, not measured | Proven |
| SC-Accuracy / T-185.3 | Root exports of the limits, classifier, parser and type | import from root on a made-up record; boundaries 0.005/0.03/0.2; bad id | `api/index.ts:14`; `stateOfBodies.test.ts` "classify a comparison and parse a record"; packed-package `classifyPositionError(0.005)` in `check:node-consumer` | Proven |
| T-185.4 | Node consumer exercises `stateOf` and `provenanceOf` | packed tarball | `tools/check-node-consumer.mjs` second test; fresh run 2 tests pass | Proven |
| SC-Fit / T-186.1 | `fitOrbit` takes a body or id circling the Sun; others `bad-camera` naming it; not in scene `unknown-body`; chains; later of `setReach`/`fitOrbit` wins | id; BodyRef; planet; built-in comet; elements body; moon; sun; orbit-line id; unknown; fit→reach; reach→fit; labels after each | `fitOrbit.test.ts` (8 tests). Probe: `sun` → `bad-camera`, unknown → `unknown-body`, `sun-orbit-zed` refused; `fitOrbit("earth").setReach(900)` → label limit 900 and fixed reach; then `fitOrbit` again → label limit unset and no `maxFocusDistance` | Proven |
| SC-Fit / T-186.2 | Reach = 1.1 × farthest Sun distance / sin(narrower half FOV); far = 2.5 × reach | 390×844 vs showers rule 1.1·Q/sin(atan((390/844)·tan 22.5°)); 1280×800 vs /sin 22.5°; aspect 1; aspect 0 guard; readable scale; Earth, Jupiter (planet-series path), Swift-Tuttle, made-up a 3.1 e 0.62 | Probe: phone ratio to the showers rule 1.0000013 (0.997 vs the sin 10.8° approximation); wide within 1e-4; far = 2.5 × reach; square equals wide; aspect 0 finite; readable finite. Farthest: Earth 1.01673 AU, Jupiter 5.4539 AU, Swift-Tuttle Q 51.22 AU — all match published aphelia | Proven |
| SC-Fit / T-186.3 | Re-fits on canvas shape change; opening view unchanged | aspect 1.6 vs 390/844 through `stepCameraTarget`; per-frame source (`camera.aspect`) and pointer source (`clientWidth/clientHeight`); default opening distance; scene with a body beyond the fitted orbit | `fitOrbit.test.ts` re-fit and opening tests; code: `sceneFrame.ts` `liveReach(..., camera.aspect)` every frame and `poseCamera` far from it; `sceneContentsHooks.ts` pointer limits recomputed per call. Default overview (2.4 × span) sits inside the fit (≥ 2.87 × Q). A scene whose span exceeds the fitted orbit opens clamped nearer — documented (see Observations) | Proven (with documented clamp) |
| SC-Fit (label/UI) / T-186.4 | No collision or overlap at 375×667 / 1280×720 | n/a: no markup or CSS changed in O-045 (diff has no `.tsx`/`.css` under `shell/` or `app/` except logic files) | diff stat | Not applicable |
| SC-Provenance / T-187.1 | `"modelled"` handled wherever source types are listed, validated or shown; word matches the panel badge | type; `SOURCE_TYPES`; `PROVENANCE_STATUS`; `BADGE_LABELS`; demo packages; `ProvenanceBadge` | grep of source-type literals across packages and examples finds only `provenance.ts` lists and `infoModel.ts` record (TypeScript `Record` enforces it); `ProvenanceBadge.tsx` renders `data-source-type` generically; probe `PROVENANCE_STATUS.modelled === BADGE_LABELS.modelled` ("Modelled") | Proven |
| SC-Provenance / T-187.2 | Per-event provenance wins; fallback to the batch; malformed per-event/batch `bad-event` naming the event; no partial write | own; none; second batch replaces fallback but not own; malformed per-event; malformed batch; state after a refused call | `publicApiStory.test.ts` new case. Probe: a → Observed, b → Modelled; malformed `c` → `bad-event ... event "c"`; events unchanged after both refusals; later batch `reconstructed` applies to a, b keeps Modelled | Proven |
| SC-Provenance / T-187.3 | `GroupInput.provenance` documents the card's "illustrative" type, the accuracy line and the appended note | doc text vs `listedOrbitGroup.ts:210-245` | Strings match verbatim (`PHASE_NOTE`, accuracy template) | Proven |
| SC-Card / T-187.4 | Elements body card shows a live "Distance from Sun" row like Swift-Tuttle; Swift-Tuttle unchanged | value vs oracle; time change; row shape; Sun card; showers rebuild | Probe: row value equals the resolver's Sun distance exactly; changes over two months; same keys as Swift-Tuttle's row; Sun lists "Distance to Earth / 109P/Swift-Tuttle / Zed". `publicApiSunOrbits.test.ts` new case; `rebuildComparison.test.ts` keeps Perseids rows equal, Geminids gains the Phaethon row and the Sun's "Distance to Phaethon" (named in CHANGELOG) | Proven |
| SC-Documentation / T-188 | README, doc comments, CHANGELOG describe every O-045 addition, claims match code | each README row/example; CHANGELOG entries; API reference test | Rows for `provenanceOf`, `fitOrbit`, limits/classifier/parser, `addEvents`, `addBodyFromElements`, `addGroup` match code (checked line by line against `scene.ts`, `sunOrbit.ts`, `sceneFraming.ts`, `story.ts`, `listedOrbitGroup.ts`); `apiReference.test.ts` green. **Fails:** `stateOf` row (README:65) and doc comment (`scene.ts:381-383`) promise velocity for any body; six of seven body kinds return none (I-094) | Issue |
| T-188 Design | Every deferred Drift Note reflected or marked non-architectural | T-185 (bad-time scope, class-limit fraction, message, rebuild test, Provenance fields), T-186 (CameraReach.fitOrbit/liveReach, label limit, opening clamp), T-187 (rebuild test, batch validation, modelled, group card) | `Design.md` new "Answers for sites (O-045)" paragraph covers each architectural note; test-fixture edits marked non-architectural with reason in T-188 evidence | Proven |
| SC-Proof / ARCH-03 | Each new call proven on a made-up configuration | `rock`, `made-up-comet`, made-up events/models | `stateOfBodies.test.ts`, `fitOrbit.test.ts`, `publicApiStory.test.ts`, `publicApiSunOrbits.test.ts` all use invented records | Proven |
| ARCH-01 / ARCH-04 | No dataset names in core/shell; layer rule | new core code (`provenance.ts`, `elementsBody.ts`) | Diff adds no mission/shower names to `src/core` or `src/shell`; core imports unchanged; `check:engine-alone` pass | Proven |
| ARCH-02 | Scientific State never depends on presentation | `fitOrbit` reads State, never writes it | `farthestSunDistanceKm` reads sources; camera code consumes it | Proven |

### Finite External-Boundary Matrix

| Cell | Classification |
|---|---|
| Configured vs actual target | Planet series: `stateOf` relies on the module-global series; before load → `missing-data`, after → answers (probe2 / probe). Browser runner: `check:browser` against its own servers, 8/8 |
| Startup, discovery, reuse | `fitOrbit` farthest distance is lazy and memoised (`#fitFarthestKm`); the viewer draws only after `prepare` loads the series, so the planet path reads loaded data. Catalogue sources cached per scene (`#sources`) |
| Unavailable dependency | Series absent: `stateOf` → `missing-data`; `fitOrbit` farthest before load throws a plain Error (unreachable through `mount`, which loads first; observation) |
| Success / non-success, redirect, timeout, malformed response, retry | Not applicable: no network or subprocess in O-045 code |
| Secret-safe failure output | Not applicable: messages contain ids and dates only |

### Workflow And Side-Effect Check Lock

| Order | Operation | Side effect | Failure timing / owner / final state | Oracle |
|---|---|---|---|---|
| 1 | `addEvents` merge events (`eventsOf`) | none until assignment | throws before any write; scene unchanged | probe: event list unchanged after refusal |
| 2 | validate per-event provenance | none | `bad-event` before any write | probe |
| 3 | validate batch provenance | none | `bad-event` before any write | probe |
| 4 | assign events, own map, batch | scene state | after all validation | probe: later batch replaces fallback only |
| — | `fitOrbit` / `setReach` | `#fit` / `#reach` (mutually clearing) | validation before write | probe and `fitOrbit.test.ts` |

No persistence, artifacts or cleanup in scope.

## Adversarial Pass

- Bypass of `stateOf` validation by another entry: `provenanceOf` and `stateOf` share the same membership rule (`#tracked` or `#bodies`); a catalogued body not added is refused (probe `saturn`).
- Representation switch: readable scale reach is finite and scaled by the same `scaleLength` the placement uses.
- Boundary aspect: 0 and non-positive aspects fall back to 1; aspect 1 gives both halves equal.
- Supplied provenance with bogus `accuracyClass: "bogus"` / `maxErrorFraction: -3` is accepted by `createProvenance` (observation; fields are optional and not in any Done When validation rule).
- Independence of tests: probes use the viewer resolver and published aphelia, not the implementation's own formula.

## Gates (fresh, 2026-10-29, sequential)

- `npm run lint` clean; `npm run typecheck` clean; `npm run build` ok (site, chunk-size warning only).
- `npm test` (junit): 144 files, 1886 passed, 1 skipped.
- `npm run test:full`: 144 files, 1886 passed, 1 skipped; coverage statements 91.66%, branches 85.98%, functions 91.93%, lines 94.3%.
- `npm run check:engine-alone`: pass in 20.1 s (962 passed, 1 skipped).
- `npm run check:pack`: pass; `astraeus` 444 files (limit 450), 7.04 MB packed (limit 8.0), 8.88 MB unpacked (limit 9.5); all eight packages under limits.
- `npm run check:node-consumer`: pass (2 tests, incl. `stateOf("earth")`, `provenanceOf`, `classifyPositionError` on the packed package).
- `npm run measure:example`: first-open 1,592,391 B raw / 453,563 B gzip; on-demand DeveloperSettings, MoonFamilyPanel, planetModels.
- `git diff --check 3e999c38..HEAD`: clean.
- `npm run check:browser` (once, 10:27:24-10:29:17 UTC): 8/8 steps exit 0, 0 error lines (smoke, smoke-public-showers, planets-phone, meteor-shower, hello-scene, hello-react, public-build-assets, public-addresses); evidence `docs/evidence/browser-20261029T102724Z/`. No screenshots.

## Code Health

`savepoint health check O-045` after the full gate: snapshot `sha256:36b41ea7e563dfa86168f054f29b7ed664f22aeb3af85cce382319f083f296bb` (created). Verdict: "Code Health does not block clearance." Complexity, coverage, dependency vulnerabilities, duplication and tests: reported only, no finding. Supporting evidence only.

## Verify File Reality

Every file named in the four Tasks' evidence and drift notes exists at HEAD (`tests/stateOfBodies.test.ts`, `tests/fitOrbit.test.ts`, `tests/publicApiSunOrbits.test.ts`, `tests/publicApiStory.test.ts`, `src/api/sunOrbit.ts`, `src/app/sceneFrame.ts`, `src/app/sceneContentsHooks.ts`, `rebuildComparison.test.ts`, `tools/check-node-consumer.mjs`). T-187 evidence says `BADGE_LABEL`; the constant is `BADGE_LABELS` (`storyPanels.ts:149`) — a typo, not a phantom.

## Issues

- **I-094** — `stateOf` is documented as giving velocity for every body, but most bodies return none. Violates T-188 Done When "every README claim matches the code" and SC-Documentation. Scenario, file/line evidence and proof needed in the Issue.

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-094 | Medium — a site reading the README for a body's speed hits it; the type marks velocity optional | Low — `undefined`, not a wrong number; positions are correct | Low | Fix now: direct doc repair of README:65 and the `stateOf` doc comment (or add velocity with a test); then a targeted re-check |

## Owner Validation

None required for any O-045 Task (`owner_validation.required: false`; owner chose no extra look, 2026-10-28).

## Closure

Not closable: I-094 is open and linked. All four Tasks are already `done` and keep that status; remediation is a direct repair under I-094 (issue-capture.md, Out-Of-Scope Repair), then a re-check superseding this record.

## Observations (non-blocking)

1. **Opening clamp with fitOrbit.** A scene whose span exceeds the fitted orbit (for example Sun + Neptune with `fitOrbit("earth")`) opens nearer than without the call, because the opening distance is clamped to the fitted limit. The SC says "not the opening view"; the builder kept the existing clamp rule (as for `setReach`) and documented it in README, CHANGELOG and Design. The owner may want to confirm this reading.
2. **CHANGELOG entry outside O-045.** "Fix (O-045 follow-up to O-044). `setTimeline({ none: true })` ... opens on the current time" describes behaviour already in `spanOf` before `3e999c38` (no O-045 code change); accurate, but labelled as an O-045 fix and outside T-188's "no docs for features outside O-045".
3. **Error message names an internal call.** `stateOf("mars")` before the series load says "await loadPlanetSeries()", which is not a root export; in plain Node a planet can never answer (documented in README).
4. **New provenance fields are not validated.** `createProvenance` accepts any `accuracyClass` / `maxErrorFraction` from a caller.
5. **`fitOrbit` without the Sun at the focus.** The fit is a camera-to-focus distance; in a scene not centred on the Sun it does not frame the orbit. Allowed by the API; doc could say the fit assumes the Sun is the focus.
6. **TEST-03 detail.** T-185 evidence names `publicApiStory.test.ts` for unchanged trajectory behaviour without case names; independently re-proved here by probe.
7. **`fitOrbit` farthest before the series load** throws a plain Error rather than a `SceneError`; unreachable through `mount`/`AstraeusScene`.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — `sceneFraming.ts` adds `CAMERA_FOV_DEG = 45` and `FAR_PER_REACH = 2.5`, while `AstraeusScene.tsx:154` keeps `fov: 45` and `scene.ts` `viewEntries` keeps `reach * 2.5`; `liveReach` uses the constant rather than the live `camera.fov`.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — `scene.ts` `#bodyObject` packs the new label-limit condition into one ~350-character line; otherwise the diff is small and focused.
