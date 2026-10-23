---
id: C-112
scope: {kind: objective, id: O-041}
result: NEEDS WORK
checked_by: {role: checker, session: o041-full-check-20261024}
executed_session: o041-run-20261024
checked_at: '2026-10-23T22:20:00Z'
health_snapshot: sha256:3b6c4d5a355e19911dbbce27bf0e9512923228b7a7fb7fa1e58bf456489cc456
reviewed:
  base_commit: c7e003f1
  head_commit: 6ae9fc58
  files: [packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/story.ts, packages/astraeus/src/api/switches.ts, packages/astraeus/src/api/time.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/api/errors.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/displaySwitches.ts, packages/astraeus/src/app/openClock.ts, packages/astraeus/src/app/trackedMetrics.ts, packages/astraeus/src/app/experienceDefinition.ts, packages/astraeus/src/app/skyModel.ts, packages/astraeus/src/core/provenance.ts, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/shell/DisplaySwitches.tsx, packages/astraeus/src/shell/TopBar.tsx, packages/astraeus/src/shell/TopBar.css, packages/astraeus/src/shell/TimelineBar.css, packages/astraeus/src/shell/phone.css, packages/astraeus/src/shell/experience.ts, packages/astraeus/src/shell/topBarIcons.tsx, packages/astraeus/src/synthetic/syntheticDefinition.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus-demo-apollo11/src/experiences/apollo11/apollo11Scene.ts, packages/astraeus-demo-apollo11/src/experiences/apollo11/apollo11Definition.ts, packages/astraeus-demo-apollo11/package.json, packages/astraeus-demo-apollo11/tests/rebuildComparison.test.ts, packages/astraeus-demo-apollo11/tests/support.ts, packages/astraeus-site/src/main.tsx, packages/astraeus-site/tests/packageBoundaries.test.ts, packages/astraeus-site/tools/site/api-reference.mjs, packages/astraeus-site/tools/validate/check-hello-scene.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/load-budget.mjs, packages/astraeus-site/tools/validate/run-browser.mjs, examples/hello-scene/src/main.js, docs/BROWSER_CHECKS.md, .savepoint/Design.md]
  dependencies: []
issues: [I-082]
supersedes: null
---

# C-112: O-041 Full Objective Check

This is the mandatory Full Objective Check for O-041 (Rebuild the Apollo 11 story on the public API), covering T-166, T-167, T-168, T-169 and T-170. The session is independent: it did not plan, build, coordinate or look at any of this work before, and it did no repairs. Diff baseline: `git diff main...o041-apollo-public-api` (`c7e003f1..6ae9fc58`, 9 commits, 65 non-record files, +2,823/-1,120). The tree was clean at the start apart from the untracked `docs/prds/` and `docs/research/`, which belong to other projects and were not read. Times are `date -u`.

**Verdict: NEEDS WORK.** Every gate passes fresh, including the single `npm run check:browser`, and the health snapshot does not block clearance. The new public calls, the no-timeline mode, the display switches, the boundary rule, the comparison test and the packed example all hold under independent probes. One reproducible defect was introduced by T-169 and keeps this from CLEAR: both Apollo spacecraft descriptions show leftover code text (`" + "`) on the info cards of the site's default demo (I-082, low). The fix is one line plus a regression assertion.

## Owner Context (as given to this Check)

- Per-step Task Checks are waived. T-166, T-167, T-168, T-169 and T-170 each carry a `check_waiver` naming the Task, the reason, the owner actor and the time (TEST-04 satisfied; this Check does not stand in for them).
- The coordinator marked T-166 to T-170 `done` under the owner's standing run rules (Decision 8).
- Owner look at the rebuilt Apollo on `localhost:5490` (2026-10-24): "looks cool, no need for Sky in drop downs though". The Sky item was then unlisted (T-169, `skyModel.ts` `listed: false`).

## Prior Owner Decisions (carry-forward assessment)

This is the first Check on O-041. No structured `exception` or `owner_validation.accepted_check` exists on the Objective or its Tasks, so there is no `carried_forward` list to append to. The owner decisions on record:

| Decision | Scope | Status |
|---|---|---|
| Decisions 1-11 (Objective) | what may change | applied as the judging rule below |
| `check_waiver` T-166 to T-170 | optional Task Checks | applies (Task Checks only; the Objective Check is not waived) |
| T-169 owner look "looks cool ..." | Apollo look | given in prose only; T-169 has `owner_validation: {required: true}` with no structured acceptance (see Owner Validation Still Needed) |
| Sky unlisted (owner's look remark) | object drop-downs | applied to **every** experience, not only Apollo (see Owner Validation Still Needed) |

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (no lanes were used; this is not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: this is the first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock (frozen)

1. **Criteria.** The six O-041 Success Conditions; Decisions 1-11 as the allowed-change rule; each Task's Done When (T-166: 8 items, T-167: 6, T-168: 5, T-169: 9, T-170: 8). Guardrails ARCH-01 to ARCH-05, PROV-01, PROV-02, TEST-01 to TEST-04, CODE-01 and STYLE-01 to STYLE-10 (advisory). Release gates are AGENTS.md's full gate list.
2. **Changed files and public entry points.** The `reviewed.files` above. Public entry `packages/astraeus/src/api/index.ts`: `Scene.addBody` (`description`, `color`, `knownLimitations`), `addTrajectory` (`anchors`, `description`, `knownLimitations`, `readouts`), `addEvents`, `addStoryPanels`, `setTimeline` (span, or `{ none }`), `setScale(…, { only })`, `setSwitches`, `stateOf`, `camera.lookAt`, `toDefinition`, and the types `AnchorInput`, `ReadoutInput`, `EventInput`, `AddEventsOptions`, `TimelineInput`, `StoryPanelsInput`, `SwitchesInput`, `Provenance`, `ProvenanceSourceType`. The new `SceneError` codes are `bad-anchor`, `bad-readout`, `bad-event`, `bad-panels`, `bad-timeline`, `bad-switch` and `bad-body`.
3. **Runtime relied on.** `App.tsx` (`openClock`, switch start state, `displaySwitchItems`), `AstraeusShell`/`TopBar`/`DisplaySwitches` rendering, `createReadoutMetrics`, `parseStoryPanels`, `catalogueItem`, the site's `main.tsx` Apollo path, `examples/hello-scene` from the packed tarball, `load-budget.mjs` and `api-reference.mjs`.
4. **Matrix axes.** Public surfaces, input shape, state and transitions (clock modes, switch state, camera opening), boundaries (anchor and `stateOf` edges, timeline edges), sequences (repeated calls, failed then retried calls), representations (definition, rendered `/api`, browser readouts). Text-width and Unicode classes are **not applicable**: no criterion covers truncation or text width. Environment/output sinks are **not applicable** beyond the desktop/phone viewports: no CLI output is in scope.
5. **Issue admission.** Supported paths only: public calls, the site's Apollo default page and the packed example. Dependency internals (three, R3F, the TypeScript compiler API) and theoretical states are out.

## Coverage Matrix

Probe harness (independent of the repository tests, written for this Check): `<scratchpad>/probe/o041.probe.test.ts`, run with `npx vitest run --config <scratchpad>/probe/vitest.probe.config.ts` (8 cases passed, all results logged). The `/api` grouping was rendered with `<scratchpad>/probe/api-sections.mjs`.

| # | Row (criterion) | Normal | Boundary | Malformed / missing | Bypass / sequence | Result |
|---|---|---|---|---|---|---|
| 1 | Anchors (T-166 1, 5) | labelled, sorted (repo `publicApiPaths` "become labelled dots") | anchor exactly at path start and at end: accepted; end + 1 ms: `bad-anchor` (probe) | not a list, empty id, duplicate, NaN time: `bad-anchor` (probe and repo) | anchor array mutated after the call: the stored times stay the validated ones (probe) | passed |
| 2 | Readouts (T-166 1, 5, 6) | range, speed, altitude and distance values equal an independent oracle: range 12,649.1106 = hypot(12000, 4000, 0); altitude = range − 6,371; speed 0.62650 = hypot(0.3, 0.55) (probe) | outside the path bounds: no rows (probe) | null spec, unknown kind, `altitude` without `above`, uncatalogued body: `bad-readout`; a body not in the scene: `bad-readout` at `toDefinition` (probe) | readouts list mutated after validation: the bogus kind gives no row and no crash (observation O3) | passed |
| 3 | `addBody` provenance, description, colour, limits (T-166 2; Decision 11) | catalogue provenance and limits; Apollo's Earth `#9fd8ff` and Moon `#ded7cc` (probe) | `[]` limits allowed; 4-digit hex refused | `"red"`, `"#abcd"`, `[""]`: `bad-body` (probe) | limits array mutated after the call keeps an empty line (observation O3) | passed |
| 4 | `Provenance` export, metrics file move (T-166 3, 4) | `api/index.ts` exports both types; `src/experiences/apollo11/` is gone (`ls`: only `settingsFields.ts`, `showers`) | n/a | n/a | engine-alone gate passes with no demo present | passed |
| 5 | Events (T-167 1) | sorted across calls with provenance (repo) | duplicate id across two calls: `bad-event` (probe) | not a list: `bad-event`; bad time: `bad-time` (the documented shared code) | a failing batch leaves the scene with no events (atomic, probe) | passed |
| 6 | Story panels (T-167 1) | by utc, event and anchor (repo) | n/a | `null`, `panels` not a list, unknown event: `bad-panels` at build, never a raw TypeError (probe) | checked late, at `toDefinition`, as documented | passed |
| 7 | Timeline (T-167 1, 2; Decision 6) | span, rates, opening rate (repo) | `setTime` exactly at the span end: accepted; 1 h before the start: `bad-timeline` (probe) | `null`, start = end, empty rates, NaN rate: `bad-timeline` (probe) | `rate` −5 and a rate outside `rates` are accepted (observation O4; Apollo's own 3,600 is outside its rates, so this is by design) | passed |
| 8 | No timeline frozen / running (Decision 6) | frozen: `playing:false`, clock paused at the moment; running: plays at 120 (probe through `openClock`); the shell draws no bar on wide or phone (repo `publicApiStory` "no timeline") | `at` beats `setTime` (probe +3,600,000 ms) | `rates` given with `none` are ignored silently (observation O4) | a copied-link time on a frozen scene seeks and stays paused (probe) | passed |
| 9 | Scale only, lookAt, camera menu, stateOf (T-167 1, 3) | `focus-<id>`/`follow-<id>` for every body and path; Apollo 9 items (probe) | `stateOf` at the path end: allowed; end + 1 ms: `bad-time` | `stateOf("moon")`, `lookAt("nope")`: `unknown-body` | last of follow/lookAt wins (repo) | passed |
| 10 | hello-scene story (T-168) | every new call used; built from the tarball (`build:example` pass) | n/a | n/a | browser step HELLO_STORY=1: 3 anchors, 2 events, panel `half-lap`, Focus preset, desktop and phone (`browser-20261023T221627Z/hello-scene`); `hello-react` still opens following (`follow-probe`) | passed |
| 11 | Display switches (T-170) | each place and start (repo `displaySwitches`, 25 cases); browser: orbit lines on the bar, labels in the panel, each toggles the scene readout off and back on, Milky Way starts off, panel clear of the cog and timeline at 1280x720 and 375x667 | `{}` places nothing | array, unknown name, `undefined` value, `on:"yes"`: `bad-switch` (probe) | a failing call keeps the earlier setting (atomic, probe); Apollo and the other demos place none | passed |
| 12 | Boundary rule (T-169 1; SC 1) | Apollo `src` imports only `astraeus` (one import line, `apollo11Scene.ts:6`) | n/a | made-up offences: deep entry, `astraeus/app/App`, another package (repo) | relative imports stay under the existing direction rule | passed |
| 13 | Scene builder, Developer extras gone (T-169 2, 3) | `main.tsx` uses `buildApollo11Scene().toDefinition()`; `MissionPanel.tsx`, `DebugControls.tsx` gone | n/a | n/a | **mission note text in both spacecraft descriptions carries leftover code `" + "`** (probe; I-082) | **Issue** |
| 14 | Comparison test (T-169 4; SC 2) | 14 cases; each difference named with its Decision | Moon label priority 99 vs 90; composition id `scene` vs `earth-moon` (see O1) | n/a | the description case checks only fragments, so I-082 passes it | passed (with I-082 as its gap) |
| 15 | Demo tests rewritten, driver repaired (T-169 5, 6) | dropped cases named with reasons; driver functions removed and mapped in `docs/BROWSER_CHECKS.md` | n/a | n/a | driver guard test passes | passed |
| 16 | Load budget (T-169 7) | fresh public build in check:browser: Apollo 4,338,049 / 2,809,507 B against 4,370,000 / 2,900,000 | Perseids 10,078,005 raw against 10,080,000 (1,995 B left), 7,026,234 gzip against 7,040,000 | n/a | no limit changed in O-041 | passed (O2) |
| 17 | Design reconciliation (T-169 8) | an O-041 block accounts for each drift note of T-166 to T-170 | n/a | n/a | the Sky unlisting is not in Design (non-architectural; O6) | passed |
| 18 | Every new export documented and on `/api` (SC 4) | doc-comment test passes; Story and Provenance sections added | n/a | n/a | `SwitchesInput` falls into "Other exports" (rendered page: Other = `SwitchesInput`, `BodyRef`); still on `/api` (O5) | passed |
| 19 | Existing demos unchanged by default (T-170 4; Decision 10) | browser smoke on every page and demo view, desktop and phone, 0 error lines | n/a | n/a | the Sky drop-down entry is gone everywhere (owner remark; O6) | passed |

### Finite External-Boundary Matrix

| Cell | Classification |
|---|---|
| Configured vs actual target | check:browser's runner started its own dev, preview, example and scratch public-build servers; it did not use the owner's 5490/5491/5497. Passed |
| Startup / reuse order | runner owned; all 8 steps ran in order. Passed |
| Refusal / unavailable dependency | not applicable: no new network or server dependency in O-041 |
| Success / non-success response | step exit codes all 0; `public-build-assets` ok true |
| Redirect | not applicable: no new address handling |
| Timeout / cancellation | not applicable: no new timeouts; the run took 111 s |
| Malformed response | not applicable: data is bundled JSON already covered by `apollo11Reconstruction` (30 tests pass) |
| Retry / cleanup / partial effects | the runner kept only `summary.txt` and each `results.json` under `docs/evidence/browser-20261023T221627Z/`; logs are in `/tmp/astraeus-check-logs-uNfnDY`. Passed |
| Secret-safe failure output | not applicable: no secrets |

### Workflow And Side-Effect Check Lock

| Order | Operation | Side effect | Failure timing / owner / final state | Oracle |
|---|---|---|---|---|
| 1 | `Scene` calls (`addBody`, `addTrajectory`, `addEvents`, `setSwitches`, `setTimeline`) | private fields updated | validation runs before any write; a failing call throws `SceneError` and leaves the earlier state (probe: failed events batch, failed trajectory retried, failed switches call) | probe values |
| 2 | `toDefinition` | builds the definition; parses panels; checks readout bodies and the timeline edge | throws `SceneError` before returning; nothing is mounted | probe codes |
| 3 | `openClock` | clock seek / play | `playing:false` leaves it paused, including after a link seek | probe snapshots |
| 4 | `App` initial controls | switch start state and address overrides | address still wins (repo `displaySwitches` "starts orbit lines off only when asked …") | repo test |
| 5 | site `main.tsx` | dynamic import of `apollo11Scene` | import or build failure surfaces in the smoke step (0 errors) | browser smoke |

No persistence, transactions or temporary files are added by O-041. The evidence folder is the runner's own.

### Matrix Completion Lock

Every cell above is classified. The one Issue (row 13) was followed by completing every other row. The acceptance classification below matches the matrix.

## Adversarial Pass

- **Bypassing validation through another path.** `addBody(id-string)` and `addBody(BodyRef)` share `checkBodyLook`. Panels are parsed only at `toDefinition`, and `mount` and `AstraeusScene` both go through `prepareScene → toDefinition` (O-040). There is no path into the definition that skips the checks. Arrays are kept by reference, so mutating one after the call can slip an empty limit line through (O3). That is not a supported path.
- **Transitions.** follow → lookAt → follow: the last wins (repo). Frozen clock with a link time: stays paused. A switch toggled from the bar and then from a Developer layer button: the two stay in step (repo, and the browser toggles).
- **Mode changes.** The address `?labels=` / `?sky=` overrides the story's start (T-170 notes, repo test). Turning labels on also clears a story's `showLabel:false` hiding (builder limitation, O7).
- **Boundaries and numbers.** Edges are exact at start and end for anchors, `stateOf` and `setTime`. Non-finite rates are refused. A negative opening rate is accepted (O4).
- **Independent oracles.** The readout values were checked against hand-computed hypot and radius values, not the code's own helpers. The Apollo text was checked against the regex `/"\s*\+\s*"/`, not against the comparison test's fragments. That is how I-082 was found.

## Acceptance Classification

| Criterion | Class |
|---|---|
| SC1 boundary rule, proved on a made-up offence | Proven |
| SC2 comparison test | Proven. It records two minor differences not covered by a Decision, both sent to the owner (O1) |
| SC3 engine names no Apollo code | Proven |
| SC4 docs, `/api`, ARCH-03 tests, no timeline frozen and running | Proven (O5) |
| SC5 hello-scene from the packed tarball passes its browser step | Proven |
| SC6 owner look before the Check; gates pass with one check:browser | Proven. The look was given in prose (see Owner Validation) |
| T-166 1-8, T-167 1-6, T-168 1-5, T-170 1-8 | Proven |
| T-169 1, 2, 4-9 | Proven |
| T-169 3 (mission notes in the descriptions) / O-041 Outcome (looks as today apart from Decisions) | **Issue (I-082)** |

## Gates (fresh, this session, head 6ae9fc58)

| Gate | Result | Time (UTC) |
|---|---|---|
| `npm run lint` | pass | 22:13:10-22:13:13 |
| `npm run typecheck` | pass | 22:13:13-22:13:17 |
| `npm run build` | pass (existing chunk-size warning only) | 22:13:17-22:13:19 |
| `npm run test:full` | pass: 124 files, 1,655 passed, 1 skipped; coverage statements 74.62%, branches 72.95%, functions 75.72%, lines 77.22%; `junit.xml` and `coverage/coverage-final.json` written | 22:13:19-22:14:23 |
| `npm run check:engine-alone` | pass (13.8 s) | 22:14:23-22:14:37 |
| `npm run check:pack` | pass; astraeus 7.01 MB packed (limit 8.0), 423 files (limit 450) | 22:14:37-22:14:52 |
| `npm run build:example` | pass (both examples) | 22:14:52-22:14:59 |
| `savepoint health check O-041` | snapshot created; "Code Health does not block clearance" | after test:full |
| `npm run check:browser` (run once, no screenshots) | pass, all 8 steps exit 0, 0 error lines: smoke 41 s, smoke-public-showers 13 s, planets-phone 9 s, meteor-shower 20 s, hello-scene 12 s, hello-react 4 s, public-build-assets 2 s (ok true), public-addresses 0 s; 111 s total | 22:16:26-22:18:17 |
| `git diff --check main...HEAD` | clean | |

Browser evidence: `docs/evidence/browser-20261023T221627Z/` (summary.txt plus a results.json for each browser step). Step and server logs are in `/tmp/astraeus-check-logs-uNfnDY`. The public build and `public-build-assets` ran inside check:browser, on its scratch public build.

## Code Health Evidence

Snapshot `sha256:3b6c4d5a355e19911dbbce27bf0e9512923228b7a7fb7fa1e58bf456489cc456` (official, created after `test:full`). Verdict: does not block clearance. Every instance (complexity/lizard, coverage/vitest-v8, dependency_vulnerabilities/osv, duplication/jscpd, tests/vitest-junit) is optional, reported only, and has no finding. Coverage is still under G-011's 80% aim; that work belongs to O-043, not here. This is supporting evidence only.

## File Reality

Every file the five Tasks name exists, or is recorded as deleted: `MissionPanel.tsx`, `DebugControls.tsx`, `apolloMetrics.ts`, `earthMoonMetrics.ts`, `apollo11.ts`, `apollo11Definition.tsx` and `src/experiences/apollo11/spacecraftMetrics.ts` (git mv to `app/trackedMetrics.ts`). The cited evidence folders `docs/evidence/browser-20261023T212529Z-hello-scene/` and `browser-20261023T213403Z-hello-scene/` exist, each with summary.txt and results.json. The T-169 capture test was deleted after it wrote the fixture, which is recorded. No phantom files.

## Issues

### I-082: Apollo spacecraft descriptions show a stray quote and plus sign

- Violates T-169 Done When 3 and the O-041 Outcome. TEST-01 evidence is inadequate.
- Scenario: `buildApollo11Scene().toDefinition()`, then the Columbia or Eagle `description`. Or, on the site, open either spacecraft's info card.
- Expected: `"… round dots are NASA source anchors. The marker is drawn larger …"`. Actual: `"… anchors. \"\n  + \"The marker is drawn larger …"`.
- Source: `packages/astraeus-demo-apollo11/src/experiences/apollo11/apollo11Scene.ts:150-151`. Shown by `packages/astraeus/src/shell/InfoPanel.tsx:44`.
- Missing test: `rebuildComparison.test.ts` checks the description with `toContain` fragments only.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-082 | High: anyone who opens a spacecraft card on the default demo sees it | Low: cosmetic text on two cards; no data, state or provenance is wrong | Low | Fix now as a direct repair under I-082 (rewrite the constant as one plain string, add a regression assertion), then one targeted re-check. No browser run is needed |

## Code Style Review

- [x] STYLE-01 **One job per file**: the new files `story.ts`, `switches.ts`, `time.ts`, `openClock.ts`, `displaySwitches.ts` and `DisplaySwitches.tsx` each hold one concern.
- [ ] STYLE-02 **One job per function**: `Scene.toDefinition` (`scene.ts`) still builds objects, metrics, clock, composition and data loading in one long object literal, and several one-line `addTrajectory`/`addBody` statements carry many conditional spreads. It stays under CODE-01.
- [x] STYLE-03 **Test branches**: each error code and edge has tests; the probes found no untested branch with a supported consequence.
- [x] STYLE-04 **Types document intent**: `ReadoutInput`, `TimelineInput` and `SwitchesInput` are discriminated or keyed types.
- [x] STYLE-05 **Build only what is needed**: calls are limited to Apollo's needs (Decision 1). The dead `positionDiscrepancies`/`journey` builders are noted under O8.
- [x] STYLE-06 **Handle errors at boundaries**: every public input is validated and surfaces as `SceneError`.
- [x] STYLE-07 **One source of truth**: the switches derive from the Developer state rather than holding a copy.
- [x] STYLE-08 **Comments explain why**.
- [x] STYLE-09 **Content lives in data**: Apollo text is in the demo package. The notes are code constants in `apollo11Scene.ts`, as before.
- [ ] STYLE-10 **Small diffs**: one Objective touches 65 files (+2.8k/-1.1k) across engine, demo, site and example. That is expected for a rebuild in place, but it is not small.

## Observations (non-blocking)

- **O1. Two comparison differences not covered by a Decision.** The Moon's label priority is 99, not 90 (generic `100 − order added`). Its effect is nil: the label order Earth > Moon > spacecraft (80) is unchanged, and `SceneLabels.ts:77` only compares priorities. The composition id is `scene`, not `earth-moon`; no code reads a composition id outside error messages (`compositions.ts`, `experienceDefinition.ts:297`). Both need the owner's acceptance, or a public option.
- **O2. Perseids page headroom.** 1,995 B raw is left (10,078,005 of 10,080,000). O-041's shell additions grew it from 10,073,636 at C-111. The gzip headroom is 13,766 B. The next Objective that adds shell code will probably break it, so the owner should decide early whether to trim or raise.
- **O3. Arrays kept by reference.** `readouts` and `knownLimitations` are stored as given. Mutating them after the call bypasses validation: an empty limit line appears, and a bogus readout kind is silently dropped. A defensive copy would close this. It is not a supported path.
- **O4. Lenient timeline values.** `setTimeline` accepts a negative opening `rate`, and with `{ none: true }` silently ignores `rates`. Neither is promised either way.
- **O5. `/api` placement.** `SwitchesInput` is listed under "Other exports", not with `setSwitches`. It is on `/api` as SC4 requires, but probably not where it was meant to go. `BodyRef` is also under Other, but it is shown with the Bodies list.
- **O6. Sky unlisted everywhere.** `skyModel.ts` sets `listed: false` for all experiences, not only Apollo. The Sky card can no longer be opened from a list, and Design does not mention it (non-architectural).
- **O7. Labels switch on.** Turning labels on clears any `showLabel: false` a story set (the builder recorded this limitation).
- **O8. Engine leftovers with no users.** `TrackedBody.positionDiscrepancies` and `discrepancyAt` (`app/mission.ts:21-36`, used only by `spacecraftDiscrepancyMetric`), `MissionConfig.journey` (`mission.ts:44-53`), `journeyProgressMetric` (`app/metricReadouts.ts:10`) and `spacecraftDiscrepancyMetric` (`app/trackedMetrics.ts:120`) are referenced nowhere in `src`, `tools` or `tests`. Design names them as a later clean-up.
- **O9. README/CHANGELOG.** Decision 11's `addBody` `color`/`knownLimitations` and the `bad-body` code are in the doc comments and on `/api`, but not in `packages/astraeus/README.md` (`addBody(body, { orbit?, description? })`) or `CHANGELOG.md`. The CHANGELOG also says "no existing call changes", while `camera.follow` now opens on `follow-<id>` instead of `follow-target`, the Sky list entry is gone, and `addBody` objects now carry catalogue provenance and limits. No criterion requires these entries.
- **O10. Load-time probe.** `buildApollo11Scene` builds a second probe scene to read the post-TLI peak speed. That costs about 6 ms (probe), which is negligible.

## Owner Validation Still Needed

1. **I-082.** Repair it, then a targeted re-check of this lock (convergence: this is the initial Check).
2. **T-169 owner acceptance.** T-169 declares `owner_validation: {required: true}`. The look ("looks cool …") is recorded in prose, but there is no structured `owner_validation.accepted_check`. The owner should record acceptance against the re-check that clears I-082.
3. **O1.** Accept the Moon label priority 99 and composition id `scene`, or ask for options.
4. **O6.** Confirm the Sky item should be unlisted in every experience, not only Apollo.
5. **O2.** Decide on Perseids headroom (trim or raise) before more shell code lands.
