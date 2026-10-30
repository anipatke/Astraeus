---
id: C-124
scope: {kind: objective, id: O-046}
result: NEEDS WORK
checked_by: {role: checker, session: o046-full-check-20261030}
executed_session: o046-run-20261030
checked_at: '2026-10-30T21:33:14Z'
health_snapshot: sha256:98974d016ffe3ae5985a9a545ddc163f13ceffa9ea18e83795c5edd2bc7e26e7
reviewed:
  base_commit: 608ea79b
  head_commit: 0d0fd4ca
  files: [.savepoint/Design.md, .savepoint/Guardrails.md, AGENTS.md, docs/BROWSER_CHECKS.md, docs/architecture/reconciliation-history.md, docs/architecture/state-and-assets.md, packages/astraeus-demo-apollo11/src/experiences/apollo11/apollo11Scene.ts, packages/astraeus-site/src/main.tsx, packages/astraeus-site/tools/site/api-reference.mjs, packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus-site/tools/validate/public-build-assets.mjs, packages/astraeus/CHANGELOG.md, packages/astraeus/README.md, packages/astraeus/src/api/activity.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/app/TrackedBodyView.ts, packages/astraeus/src/app/mission.ts, packages/astraeus/src/app/pathRules.ts, packages/astraeus/src/app/sceneDebug.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/core/scalePolicy.ts, packages/astraeus/src/synthetic/syntheticProbeDefinition.ts, packages/astraeus/tests/nameCheck.test.ts, packages/astraeus/tests/publicApiPathLabels.test.ts, packages/astraeus/tests/publicApiSunOrbits.test.ts, packages/astraeus/tests/publicApiSunPaths.test.ts, tools/check-node-consumer.mjs]
  dependencies: []
issues: [I-108, I-109]
supersedes: null
unmet: [T-193-browser-case-label-visible, O-046-SC-Proof-check-browser, O-046-SC-Documentation-README-example, G-013-docs-match-package]
---

# C-124: O-046 Full Objective Check

This is the Full Objective Check of O-046, "Draw a spacecraft path across the solar system". It covers T-189 to T-194. All six are `done`, and each has an owner Task-check waiver from session o046-run-20261030. A waiver is not CLEAR, and this Check reviews every Task.

**Independence.** This session did not plan, build or coordinate any O-046 work. It started from the coordinator's Next line, "Check O-046". It wrote only these things:
- gate outputs (`coverage/`, `junit.xml`, `dist/`, example builds);
- the official health snapshot;
- the browser run folder `docs/evidence/browser-20261030T212928Z/`;
- throwaway probes in its scratchpad;
- I-108, I-109 and this record.

**Baseline.** HEAD `0d0fd4ca` on `o046-sun-paths`, compared with `608ea79b` (the plan commit on main). Not a worktree lane: `git-dir` and `git-common-dir` are both `.git`. Untracked `docs/prds/` and `docs/research/` were not read or touched. Times are UTC.

**Verdict: NEEDS WORK.** Every engine behaviour is proven by fresh gates and independent probes:
- Sun-centred paths;
- `lineFixedTo` with any body;
- the ecliptic `plane`;
- `solarSystemScale`;
- label reach and `labelReach`;
- the centre default;
- the ARCH-06 name check.

Every gate passes except the one browser run. Two Issues block:

- **I-108 (Medium).** `npm run check:browser` fails. The new Sun-centred probe case finds the probe's label not shown at phone size. The run T-193 cites predates the owner-look fixture fix, so the case was never run against the corrected fixture.
- **I-109 (Low).** The new README example says its line runs "from inside Earth's orbit to Earth" and "out from 0.6 AU to 1.1 AU". Its samples actually end 1.49 AU from the Sun and 2.0 AU from Earth.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature in this scope; no lanes used; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: this is the first Check of O-046)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Requirements.**
   - The O-046 Success Conditions: SC-SunPaths (I-096), SC-LineFixedTo, SC-Frame (I-097), SC-Scale (I-098), SC-Labels (I-100), SC-Proof and SC-Documentation.
   - The Done When and Boundaries of T-189 to T-194.
   - These owner decisions, which were checked as built and not re-argued:
     - a line fixed per path, to any body (`lineFixedTo`);
     - all three side findings joined;
     - one owner look ("OK", T-193);
     - a `labelReach` option, with Apollo 11 keeping 4 (T-192);
     - the `addTrajectory` `center` defaulting to the scene centre (T-193);
     - codification through ARCH-06 and the name check over `src/api` (T-194).
   - Guardrails: ARCH-01 to ARCH-06, PROV-01, TEST-01 to TEST-04 and STYLE-*. Project rule: Strategic fix first.
   - Gates: lint, typecheck, build, `test:full`, `check:engine-alone`, `check:pack`, `check:node-consumer`, `measure:example`, one `check:browser`, and `savepoint health check`.
2. **Files and entry points.** The files are listed in `reviewed.files`. The public entry points are:
   - `Scene.addTrajectory`, with the new options `lineFixedTo`, `plane` and `labelReach`, and the changed `center` default;
   - `Scene.addBody` and `addBodyFromElements` with `labelReach`;
   - `Scene.setScale` and the new root export `solarSystemScale`;
   - `Scene.stateOf`, and `Scene.toDefinition` (scale choices, label reach, `lineFixedTo` validation).

   The viewer path is `TrackedBodyView.update`, `#remap` and `#relative`, `relativeTrailKm(…, against)` and `sceneOffsetKm`. Other changed parts:
   - `data-paths` now includes tracked paths;
   - the dev fixture `synthetic-probe`;
   - the README, CHANGELOG, API reference list and the packed consumer.
3. **Relied-on runtime.** The scene resolver (`createSceneResolver(adapter, catalogueOf(definition))`, as `App.tsx:106` builds it), the orb adapter's `eclipticJ2000ToEqjMatrix`, `createSolarSystemScale`, `SceneLabels` label layout, and the browser harness and driver.
4. **Matrix.** The axes are listed below; each not-applicable cell gives its reason.
5. **Materiality boundary.** An Issue must break a Success Condition, a Done When, a Guardrail or a gate through a supported path. Supported paths are the public API in Node or under `mount`, the published README and API reference, and the project's browser gate.

## Acceptance Invariants And Coverage Matrix

**Harness.** `<scratchpad>/chk/harness/probe.test.ts` (10 cases), `probe2.test.ts` and `probe3.test.ts` run under Vitest against the source at HEAD. Results are in `out.json`, `out2.json` and `out3.json`.

**Independent oracles:**
- my own ecliptic-to-equatorial rotation, using the IAU obliquity of 23.4392911 degrees;
- `createStateResolver(...).stateOf(body, t, centre)` for planet places;
- `bodyAbsolute` for the km-to-render mapping;
- hand arithmetic for the README samples.

| # | Rule | Cells | Evidence | Result |
|---|---|---|---|---|
| 1 | A Sun-first scene accepts a path, and `toDefinition` lists it | With and without enlargement; path added before or after bodies | Repo test, plus M3 and M6 | Proven |
| 2 | A line against the Sun is still while time plays in a Sun-centred scene | Default `lineFixedTo` and explicit `"sun"`; display times day 10 and day 150 | M3: first-vertex shift 0 in both; marker at sample time equals `bodyAbsolute(sample)` exactly | Proven |
| 3 | `lineFixedTo: "sun"` in an Earth-first scene gives a Sun-fixed line | Display times day 40 and day 100 | M4: the line moves by the Sun's offset from Earth (23 304.9775 against 23 304.9777, rel. 1e-8); vertex 0 matches `sample + sunFromEarth(t)` (rel. 2e-8); marker at a sample time sits on the line; the default line in the same scene moves by 0 | Proven |
| 4 | `lineFixedTo` must name a body the finished scene holds, else `bad-trajectory` naming the field | Not in the scene (mars); unknown id; number 42; empty string; another path's id; moon added after the path; moon in an Earth scene; an elements body | M5: the first five throw `bad-trajectory ... lineFixedTo names "x"`; moon-after and moon-in-scene build with finite vertices; an elements body draws finite with the scene catalogue resolver (`probe2`) | Proven |
| 5 | Earth-centred scenes are unchanged: default output is bit-identical and Apollo 11 keeps its labels | `rebuildComparison.test.ts`, `packages/astraeus-demo-apollo11/tests/paths.test.ts`, hello-scene browser step | Full gate green (146 files); `apollo11Scene.ts` adds only `labelReach: 4`; `relativeTrailKm` returns its input when native equals against (repo test); browser `hello-scene` and `hello-react` pass | Proven |
| 6 | `plane: "ecliptic-j2000"` rotates positions and velocities once at entry, so `stateOf` and drawing agree | Sampled with velocity; provider; default; `"EQJ"`; bad values | M7: `stateOf` matches my independent rotation (pos. rel. 8e-8, vel. 1.6e-8, the obliquity-constant difference); marker equals `bodyAbsolute(stateOf)` exactly; provider rotates the same and `orientation` passes through (`[0,0,0,1]`, the documented limit); `null`, `"eqj"`, `"galactic"` throw `bad-trajectory`; 2-vector and NaN input reach the State checks (`bad-trajectory ... exactly three coordinates`, `... finite`) | Proven |
| 7 | `solarSystemScale` is accepted only in a Sun-centred scene with an enlarged body; true scale is offered second unless `only` | Sun with enlarge, `only`, without enlarge, `enlarge: 1`; Earth-first with an enlarged moon; empty; true and readable in each scene kind; bogus id; undefined | M8: `["solar-system","true-scale"]`, `["solar-system"]`, `bad-scale` (no enlargement; Earth-first), `empty-scene` (empty), the earlier choices unchanged for true and readable, and the error names all three scales. `enlarge: 1` counts as enlarged (as before for the viewer's choice) | Proven |
| 8 | One label-reach rule for bodies and paths, plus a per-item `labelReach` | Earth scene (500), `setReach(2000)`, fitted, Sun-centred, own 4, own 7 in a Sun scene; bad 0, -1, NaN, Infinity, "5", null; addBody bad | M9: body and path agree in every scene kind (500/500, 2000/2000, none/none, none/none); own value wins; every bad value throws `bad-trajectory` or `bad-body` naming `labelReach` | Proven |
| 9 | The path label is visible in the viewer (browser case) | Desktop and phone | Run `browser-20261030T212928Z`: desktop passes; phone fails "the probe path's label is not shown" | **Issue I-108** |
| 10 | The `center` default is the scene's first catalogued body | Sun first; path before sun; path before mars; no body; Earth first; explicit centre before bodies; bad `labelReach` on a deferred path; id clash with a later body; readouts after the rebuild | M6: sun, sun, mars, earth, earth, earth (explicit wins); the `labelReach` error is raised at `addTrajectory`; `duplicate-id` on `addBody("sun")`; objects `sun,p` | Proven |
| 11 | Path frame and line rule are documented (README rows, doc comments, API reference) | `addTrajectory`, `addBody`, `setScale`, `setReach`, `stateOf` rows; `TrajectorySampleInput`, `lineFixedTo`, `plane`, `labelReach` comments; `api-reference.mjs` | Read against the code: they match | Proven |
| 12 | The README example shows a correct Sun-centred path | The example run unchanged | M1: the centre is the Sun and the scale choices are right, but its prose and comment are false: it ends 1.487 AU from the Sun and 2.01 AU from Earth | **Issue I-109** |
| 13 | CHANGELOG Unreleased covers every public change | `plane`; Sun-centred paths plus `lineFixedTo`; the centre-default behaviour change (stated as one, with the `center: "earth"` workaround); `solarSystemScale`; example; path label reach; `labelReach` | Read | Proven (see observation 4 on one wording change) |
| 14 | The packed package consumer works | `check:node-consumer` builds the Sun-centred case | 3 tests pass | Proven |
| 15 | ARCH-06: the name check covers `src/api`; a planted offence is caught; a stale allowlist entry fails | Glob, folder test, planted `src/api/Planted.ts`, stale test | `nameCheck.test.ts` green in the full gate; the diff reviewed | Proven (see observation 1 on granularity) |
| 16 | Design is reconciled for every drift note | T-189 to T-194 drift notes | `Design.md` "Paths across the solar system" and the `src/api` name-check line; `state-and-assets.md`; reconciliation history O-046 entry (T-174 clause marked superseded); the T-193 centre default is reflected | Proven |
| 17 | The owner look is recorded | T-193 | "OK" recorded in the evidence prose; `owner_validation` frontmatter is still `{required: true}` with no `accepted_check` | Owner action still needed (observation 3) |

**Not applicable.**
- Text-class, serialization and redirected-output axes: the scope holds no text width, serialization or CLI output.
- State-machine transitions: there are none beyond the build-order sequences, which are covered in rows 4 and 10.

**Finite external-boundary matrix.** The browser runner (`run-browser.mjs`) is the external boundary.
- It starts its own dev, preview and example servers and leaves the owner's `localhost:5490` alone.
- Each step reported its exit code, and the summary was written. Logs went to `/tmp/astraeus-check-logs-4QgHVC`.
- The failure output names the case and holds no secrets.
- Timeout, redirect and retry cells are not applicable: no retry exists, and the run finished in 118 s.

**Workflow lock.** No persistence or transaction workflows are in scope. The one multi-step path is `addTrajectory` → `#defaulted` → `#register` rebuild → `toDefinition` validation. It is covered in rows 4 and 10:
- a failure at `addTrajectory` is raised there;
- a `lineFixedTo` failure is deferred to `toDefinition` by design, so a body added later is accepted;
- a duplicate id is caught at `addBody`.

## Adversarial Pass

- **Bypass by build order.** A path added before any body is rebuilt when the first body arrives. A path with an explicit centre is not rebuilt. The first body added through `addBodyFromElements` leaves the Earth fallback, as documented.
- **Cache staleness in `#remap`.** A line fixed to a body other than the scene centre is remapped whenever the time changes. A line against the centre is remapped on a policy or centre change only. M3 and M4 prove both against the oracle.
- **Two consumers of the same State.** The marker, `stateOf` and readouts all read the stored, rotated trajectory. The marker equals `stateOf` exactly (row 6).
- **Oracle independence.** Rotations, planet places and the README arithmetic were computed outside the code under test. The browser result came from a fresh run, not the cited earlier one.

## Gates (fresh, 2026-10-30 21:24 to 21:31 UTC, HEAD 0d0fd4ca)

| Gate | Result |
|---|---|
| `npm run lint` | pass (exit 0) |
| `npm run typecheck` | pass |
| `npm run build` | pass (chunk-size warning only) |
| `npm run test:full` | 146 files passed; 1910 passed, 1 skipped; statements 91.55%, lines 94.18% |
| `npm run check:engine-alone` | pass, 18.3 s |
| `npm run check:pack` | pass, 12.4 s |
| `npm run check:node-consumer` | pass, 3 tests |
| `npm run measure:example` | first-open 1,594,922 raw / 453,687 gzip |
| `git diff --check 608ea79b..HEAD` | 2 warnings: blank line at end of `T-192-...md` and `tests/publicApiSunPaths.test.ts` (advisory) |
| `npm run check:browser` (run once) | **FAILED**: `smoke` exit 1 (synthetic-probe phone: label not shown); the other 7 steps exit 0; 0 error lines; 118 s; folder `docs/evidence/browser-20261030T212928Z` |

## Code Health

`savepoint health check O-046 .` was run after the full gate. Snapshot `sha256:98974d016ffe3ae5985a9a545ddc163f13ceffa9ea18e83795c5edd2bc7e26e7` was created. The verdict was "Code Health does not block clearance".
- Complexity, duplication and dependency vulnerabilities: no finding.
- Coverage and tests: reported "stale", although `test:full` had just written both reports. This is a collection or staleness statement and not a code finding. All instances are optional and non-blocking.

## Issues

- **I-108**: the browser gate fails on the probe label at phone size. It breaks T-193 Done When ("its label is visible") and SC-Proof (one `npm run check:browser` with a Sun-centred path case). The release gate fails.
- **I-109**: the README probe example's prose and comment do not match its samples. It breaks SC-Documentation (a README example showing a Sun-centred path), T-193 (README complete for the Objective) and G-013 ("the docs match the package").

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-108 | High: it fails on every run at phone size with the corrected fixture | Medium: the engine draws correctly and the label is hidden by the designed label layout, but the Objective's required browser proof is red and the phone label is unproven | Medium | Fix now: confirm the cause, then adjust the case's view or seek, or the fixture, without dropping the phone check; then one fresh `check:browser` in the re-check |
| I-109 | High: any reader who copies the example sees it | Low: data and prose only; the engine places the samples correctly. But it repeats the "missed Earth" confusion the owner hit | Low | Combine with the I-108 repair: make the prose match, or derive the samples from Earth's place as the fixture does, and add a test that checks the claim |

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth**: `src/synthetic/syntheticProbeDefinition.ts:13` defines its own `OBLIQUITY` constant. T-190 asked for no second copy of the obliquity. The copy is in a dev fixture, not the State path.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: two files end with a blank line (`git diff --check`). Otherwise the diff is focused: 44 files, but 28 of them are records, docs or evidence.

## Owner Validation Still Needed

- T-193 has `owner_validation: {required: true}`. The owner's "OK" (2026-10-30) is recorded only in the evidence prose. Closure Rules need a structured `accepted_check: C-###` acceptance. The owner records it against the Check that clears O-046, not this one.

## Non-blocking Observations

1. **ARCH-06 granularity.** The name check allowlists whole files. `src/api/scene.ts` is now allowlisted for its Earth fallback, so a reintroduced `input.center ?? "earth"` in that same file would still pass. That was the trap ARCH-06 cites. Under the Strategic fix first rule, the planner could consider a line-level or count-limited allowlist. This is not a violation of T-194 as written.
2. **The dev fixture's path passes 0.15 AU from the Sun at day 60.** Its straight line joins two nearly opposite points. That is acceptable for a made-up fixture (it is not a trajectory claim), but worth knowing when adjusting I-108's seek times.
3. **T-193 is `done` while its owner acceptance is unrecorded.** See Owner Validation Still Needed.
4. **Unlisted wording change.** `src/api/activity.ts` changed an error-message example from "meteors per hour" to "events per hour" for the name check. It is user-visible text, not an API change, and is not in the CHANGELOG. Optional.
5. **The README example test does not check the example's claim.** `tests/publicApiSunPaths.test.ts` "builds the README example" asserts only the scale choices. The Proof Needed of I-109 covers this.
6. **Source Issues.** I-096, I-097, I-098 and I-100 are already `resolved`, and their behaviour is proven above. I-099 stays open, outside scope.

## Next

Remediation is a direct repair under I-108 and I-109. No Task is reopened, because every T-189 to T-194 stays `done`. The re-check uses this scope lock: matrix rows 9 and 12 plus the repaired paths, and one fresh `npm run check:browser`.
