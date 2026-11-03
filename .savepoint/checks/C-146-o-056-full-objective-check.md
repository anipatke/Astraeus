---
id: C-146
scope: {kind: objective, id: O-056}
result: NEEDS WORK
checked_by: {role: checker, session: o056-check-20261103}
executed_session: o056-run-20261103
checked_at: '2026-11-03T11:04:00Z'
health_snapshot: sha256:175b784cfdef03e9a8ba3024e3f2cebdce4aa965dfbb3725639806cf573caf5d
reviewed:
  base_commit: 43157c80
  head_commit: 180535a4
  files: [packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/look.ts, packages/astraeus/src/api/lookInput.ts, packages/astraeus/src/api/sceneReads.ts, packages/astraeus/src/api/viewerLooks.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus/src/api/viewerClock.ts, packages/astraeus/src/api/viewerHandle.ts, packages/astraeus/src/api/viewerZones.ts, packages/astraeus/src/api/story.ts, packages/astraeus/src/api/prepared.ts, packages/astraeus/src/api/mount.ts, packages/astraeus/src/app/look.ts, packages/astraeus/src/app/liveLook.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/viewerPort.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/core/pacing.ts, packages/astraeus/src/core/planetSeries.ts, packages/astraeus/src/core/bodies/moonSystem.ts, packages/astraeus-site/tests/allowlistGrowth.test.ts, packages/astraeus-site/tests/apiSettings.allowlist.json, packages/astraeus-site/tools/validate/check-hello-planets.mjs, examples/hello-planets/src/main.js, examples/hello-planets/index.html, tools/check-node-consumer.mjs, vitest.config.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, .savepoint/Design.md]
  dependencies: []
issues: [I-142]
supersedes: null
---

# C-146: O-056 Full Objective Check

Full Objective Check of O-056, "Use it without a viewer and set looks as settings" (T-259 to T-264). The diff is `main...HEAD`: base 43157c80 (the O-056 plan commit on main), head 180535a4, six commits 282ce7ea..180535a4, 89 files, +2699/-417.

**Verdict: NEEDS WORK.** One Issue, I-142: the one `npm run check:browser` fails at `public-build-assets`. The API reference page (`api/index.html`, built from the public entry's doc comments) grew from 94,439 to 118,927 bytes raw. Its limit is 100,000 raw. Everything else holds. All eight Success Conditions are met on independent evidence, and every other gate passes: two `test:full` runs, lint, typecheck, build, engine-alone, pack, node-consumer, react-consumer, build:example, and every other browser step, including the new `hello-planets` step.

**Independence.** This session did not plan, build, coordinate or look at any O-056 step. It treated the Task evidence, drift notes and the owner-look note as claims. It is not a lane: `git rev-parse --git-dir` equals `--git-common-dir`, and the branch is `o056-headless-looks` on the main checkout.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature of this scope; ignored)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: initial Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock (frozen)

1. **Criteria and rules.** O-056 Success Conditions 1 to 8. Each Task's Done When, T-259 to T-264. Guardrails API-01 to API-06, ARCH-02, ARCH-03, ARCH-06, TEST-01, TEST-03, CODE-01 and PROV-01 (T-264). Release gates: the full gate (`docs/agents/build.md`), `check:engine-alone`, `check:pack`, `check:node-consumer`, `check:react-consumer`, `build:example`, and one `check:browser`. The owner decision of 2026-11-03 on `allowlistGrowth` (the `public` section is not counted; `addressOnly` keeps the rule) is in force.
2. **Changed files and entry points.** `Scene.load`, `Scene.check`, `Scene.setLook` and the reads `bodies`, `paths`, `groups`, `events`, `panels`, `views`, `scales` and `timeline`. `ViewerHandle` `look`/`setLook`, `scale`/`setScale` and `switches`/`setSwitch`, and `ViewerChange.scale`/`look`/`switches`. `AddBodyOptions.readouts`. `EventInput.withinSeconds`, with `onEventZone`/`eventZones` without pacing. `LookInput`, `SunGlowLook`, `LookRead`, `SceneLoadOptions` and the `Scene*Read` types. The address-to-look table `app/look.ts`. The example `examples/hello-planets`. The files are listed in `reviewed.files`.
3. **Relied-on orchestration.** `prepareScene` (shared by `mount` and `AstraeusScene`), `assembleScene`, `definition.prepare()` (planet series plus the moon-system store), `addressSearch` (the address door), `ViewerLink` publish and attach, the App's `stateNow` and `presentationOf`, `core/pacing.ts` zones, `tools/build-example.mjs`, and the site `load-budget.mjs` (the step that failed).
4. **Matrix axes.** Public surfaces; input shape (normal, empty, missing, wrong type, non-finite, nested, mutation after the call); state (cold vs loaded, editable vs mounted, before ready / after unmount); boundaries (each look range at min, max and just beyond); representations (definition vs public read; address vs `setLook` vs live set); embedding paths (`mount`, React). Not applicable: text classes (no width or truncation in scope), redirected or no-colour sinks (no CLI output in scope).
5. **Admission boundary.** Supported public paths only (`import ... from "astraeus"`, a data package's `dataSource`, the packed tarball, the documented address parameters). Any gate in item 1 failing is admitted.

## Coverage Matrix

Evidence key: **G** = the Objective's own tests, run in both `test:full` runs. **P** = this Check's independent probes, `docs/evidence/check-o056-20261103/` (`warm.test.ts`, `cold.test.ts`; 63 of 63 passed; results in `probe-results.txt`). **B** = the browser run `docs/evidence/browser-20261103T105219Z`. **N** = `check:node-consumer` on the packed package.

| # | Row (SC) | Cells | Result | Evidence |
|---|---|---|---|---|
| 1 | Cold `stateOf` before load (SC1) | planet (mars, venus, saturn), fitted moon (io), earth/moon (built-in tables) | pass: planets and Io throw `missing-data` naming `scene.load`, with no internal name; Earth and Moon answer (compact built-in models, as on main) | P cold rows 1-5; G `tests/cold/sceneLoad.test.ts`; N "cold start" |
| 2 | `load` then reads (SC1) | planet, Sun, Earth, Moon, Io; `provenanceOf` for each | pass. Independent oracle: Mars to Sun distance on 2026-03-01 inside perihelion/aphelion; Io 4.0e5-4.5e5 km | P cold "load then every body"; G cold; N on the packed `dataSource` (`file:` chunk read) |
| 3 | `load` refusals (SC1) | package not passed (titan), out-of-span (1945), empty scene, twice, frozen | pass. Messages name no internal; the titan message names `mount(...)`, not `scene.load` (observation O4) | P cold; G cold refusals |
| 4 | `check` vs `mount` (SC2) | 9 build-fault codes; check loads nothing and does not freeze | pass. `check` = `toDefinition(data)`, the same synchronous call `prepareScene` makes before `markMounted`; `bad-element` is mount-only (not a scene fault) | G `sceneCheck.test.ts` (check = mount = prepareScene, by name/code/message); code read `prepared.ts:13-17`, `scene.ts` `check` |
| 5 | Reads (SC3) | each of 8 reads; frozen list and items; fresh per read; mounted scene; order; `withinSeconds` echoed; `scales` with `only`; timeline from `setTimeline`; moon reads before load | pass | G `sceneReads.test.ts` (22); P "scene reads" (4 rows) |
| 6 | Reads are built from plans, not `ExperienceDefinition` (SC3) | code read | pass. Getters forward to `BodyPlan.reads`, `pathReads`, `GroupPlan.reads`, `StoryPlan.eventReads`/`panelReads`, `ViewPlan.read`, `TimelinePlan.read`; none calls `assembleScene` | `scene.ts` getters |
| 7 | Migration table (SC3) | outside reads in Voyagers/showers | pass. CHANGELOG Unreleased "From `toDefinition` to public reads", 17 rows | `packages/astraeus/CHANGELOG.md` |
| 8 | `setLook` input classes (SC4) | 25 rows: empty, null, array, number, unknown key, each range min/max/just beyond, NaN, Infinity, string, nested non-object/null/unknown, undefined value | pass: `bad-look` exactly where expected | P "setLook input classes"; G `look.test.ts` |
| 9 | `setLook` semantics (SC4) | caller mutation after the call; replace-whole; frozen after mount | pass | P rows; G `look.test.ts` |
| 10 | Address over set look over default, per parameter (SC4) | all 10 parameters; `sky=on` cannot undo `skyVisible:false` (off-only); garbage ignored | pass | P "resolveLook precedence" (11 rows); G `look.test.ts` |
| 11 | One table read through the address door (SC4) | no look reader parses the address | pass. The `*FromSearch` readers are gone; `App` gets `search` only from `addressSearch(address)` (`App.tsx:234`); `resolveLook(definition.look, search)` | code read; `addressRule.test.ts` in G |
| 12 | `addressOnly` empty; allowlist rule (SC4, owner decision) | `apiSettings.allowlist.json` `addressOnly: []`; `public` uncounted; `addressOnly` growth still fails | pass | file read; G `allowlistGrowth.test.ts` table cases |
| 13 | Live host controls on both paths (SC4, SC5) | not-mounted before ready / after unmount; set then read; bad codes (`bad-look`, `bad-scale`, `bad-switch`); cause `host`; visitor change heard as `visitor`; A does not change B | pass | G `lifecycle.test.ts` (both paths), `twoViewers.test.ts` SETTERS, `viewerLinkPin.test.ts`, `viewerHostDom.test.ts`; B hello-planets (slider -> sky star brightness 0.4; scale button changes scale) |
| 14 | `addBody` readouts (SC5) | range readout on a body card; bad readout; named body absent | pass | G `publicApiPaths.test.ts` "body readouts"; B hello-planets ("Earth's card names the Sun") |
| 15 | Event zones (SC6) | own zone without pacing; rule zone; rule plus own `withinSeconds` (own wins, one zone, pacing uses it); event with neither (no zone); inclusive edges and one ms past; bad values 0, -1, NaN, Infinity, "5", null; tiny positive | pass. Oracle: plain interval arithmetic | P "event zones" (11 rows); G `eventZonesDom.test.ts` (with the view filter) |
| 16 | Zones stay presentation (SC6, ARCH-02) | code read | pass. Zones feed the host report and pacing only; no State path reads them | `core/pacing.ts`, `App.tsx` `stateNow` |
| 17 | Example (SC7) | packed tarball; no data package; `fitOrbit(mars)`; sliders via `handle.setLook`; scale switch; Earth distance readout; 1280x720 and 375x667 with no overlap | pass | B `hello-planets` exit 0 at both sizes (`results.json`: scale solar-system -> true-scale, stars 0.4); `build:example` pass; code read |
| 18 | Surface and docs (SC8) | lock diff additions only; README tables; CHANGELOG; `api:errors` | pass. Lock diff removes no member; the only `-` line is the `SceneErrorCode` union gaining `bad-look` | `git diff` of `api-surface.lock.json`; G `apiSurface`, `apiRules` |
| 19 | Design reconciled (SC8) | every Task's Drift Notes accounted for | pass, with two factual slips (observation O2) | Design.md O-056 paragraph and "Drift accounting for O-056" |
| 20 | Owner look before the Check (SC8) | recorded | pass. T-264 Technical Evidence, 2026-11-03T10:45:35Z, "looks right" | T-264 |
| 21 | Release gates | each gate in scope item 1 | **Issue I-142**: `check:browser` `public-build-assets` fails on the API page budget; all others pass | see Gates |

## Finite External-Boundary Matrix

| Cell | Classification |
|---|---|
| Configured vs actual target | Node `fetch` refuses `file:` chunk URLs, so `moonSystem.ts` reads them through `process.getBuiltinModule("node:fs/promises")` only for `file:` URLs; a browser keeps `fetch`. Proven on the packed package by N, which uses the package's own `dataSource`. |
| Unavailable dependency | A runtime with no `getBuiltinModule` throws a plain error naming the chunk. It surfaces through `load`'s rejection; there is no supported runtime of that kind. Not applicable beyond that. |
| Non-success response | HTTP non-ok path unchanged from main. |
| Timeout / cancellation | Not in scope: no new network call. The happy-dom teardown abort is pre-existing (observation O1). |
| Browser runner | One run, 10:52:19-10:58:24Z, 10 steps: 9 exit 0, `public-build-assets` exit 1 (I-142). |

## Workflow And Side-Effect Lock

| Order | Operation | Side effect | Failure owner and final state | Oracle |
|---|---|---|---|---|
| 1 | `scene.check(data)` | none (no load, no freeze) | throws the SceneError; scene still editable | G sceneCheck "leaves it editable"; P |
| 2 | `scene.load(data)` | `toDefinition(data).prepare()`: planet series and moon store filled (shared, module-level) | rejects `missing-data` / `out-of-span` / build code; partial loads stay cached; a second call is harmless | G cold "twice", refusals; P |
| 3 | `mount` after `load` | re-uses the loaded store | as before O-056 | G `moonLoadTwice.test.ts` (O-055) |
| 4 | `handle.setLook/Scale/Switch` | live controls changed, then `publish(..., "host")` | before ready / after unmount: `not-mounted`, nothing changed; bad value: thrown before any change (`checkedLook`, scale and switch checks run first) | `viewerLooks.ts` order; G lifecycle |

## Adversarial Pass

- **Bypass validation:** the live `setLook` checks through the same `checkedLook` as `Scene.setLook`, and the address path parses through the same table ranges. No third entry exists; `api/lookInput.ts` imports the ranges from `app/look.ts`.
- **Transitions:** a frozen scene refuses `setLook` (`scene-mounted`), and the reads answer after mount. A live `setLook` replaces the whole look and wins over the address, as documented on the handle.
- **Representation switch:** `LookRead` handed back to `setLook` (what the example does) is a valid `LookInput`; hello-planets B passes.
- **Unexpected values:** covered in rows 8 and 15. No unhandled exception.

## Gates

| Command | Result | Time (UTC) |
|---|---|---|
| `npm run lint` | pass | 10:46:44Z run |
| `npm run typecheck` | pass | same run |
| `npm run build` | pass | same run |
| `npm run test:full` (1) | pass: 207 files, 2605 passed, 2 skipped | ended 10:48:05Z |
| `npm run test:full` (2) | pass: 207 files, 2605 passed, 2 skipped; coverage 92.78% statements, 87.98% branches, 95.01% lines | 10:48:16-10:49:22Z |
| `npm run check:engine-alone` | pass (23.4 s) | 10:51:09-10:51:33Z |
| `npm run check:pack` | pass | 10:51:33-10:51:47Z |
| `npm run check:node-consumer` | pass (includes the O-056 cold-start case) | 10:51:47-10:51:55Z |
| `npm run check:react-consumer` | pass (react 19.3.1) | 10:51:55-10:52:01Z |
| `npm run build:example` | pass (hello-scene, hello-react, hello-planets) | 10:52:01-10:52:10Z |
| `npm run check:browser` (once) | **FAIL**: `public-build-assets` exit 1 (`api/index.html` 118,927 raw > 100,000). The other 9 steps pass. Evidence `docs/evidence/browser-20261103T105219Z/`, logs `/tmp/astraeus-check-logs-AcyxuZ` | 10:52:19-10:58:24Z |
| `git diff --check main...HEAD` | one trailing space, `packages/astraeus/tests/eventZonesDom.test.ts:262` (observation O5) | |

The browser run was not repeated (browser policy: one run per Objective Check). The cause was confirmed by direct measurement: `buildApiPage()` gives 94,439 bytes on main and 118,927 on HEAD.

## Code Health

`savepoint health check O-056`, run after the full gate: snapshot `sha256:175b784cfdef03e9a8ba3024e3f2cebdce4aa965dfbb3725639806cf573caf5d` (created). Verdict: "Code Health does not block clearance." Complexity (lizard), duplication (jscpd) and dependency vulnerabilities (osv): no finding. Coverage and tests: reported **stale**. That is a collection statement, not a finding: the reports are from the second `test:full` (10:49:22Z), and since then the tree gained only the browser evidence folder and this Check's evidence. No health signal is admitted as an Issue.

## Items Examined On Their Merits

1. **"Unhandled Errors" and the happy-dom `DOMException [AbortError]` from `teardownWindow`. Not an O-056 defect; pre-existing.** In both `test:full` runs here the stack prints right after `packages/astraeus-site/tests/loadingCoverChain.test.ts`, with all tests passing and no "Unhandled Errors" block. Run alone, that file prints the AbortError 12 of 12 times on HEAD and 12 of 12 on main (temporary worktree at 43157c80, removed after). That test was added by the O-055 I-141 repair (009554b0, on main), and the stack is happy-dom aborting a pending `fetch` at window teardown. The "Unhandled Errors" block did not reproduce in 24 isolated runs or in either full run. The star-catalogue `fetch` is unconditional on main as well (`App.tsx` `loadStarCatalogue`), so O-056's "sky built while hidden" change does not add it. Observation O1.
2. **API-04 `{ start, end }` vs the public-type lint. Observation, not an Issue.** The `timeline` read is flat (`windowStartUtcMs` / `windowEndUtcMs`). T-260's Done When asks for spans as `{ start, end }`, but no read shape satisfies both that wording and API-04's own named check (the lint refuses unitless `start`/`end` numbers and any `start*`/`end*` pair, `tools/api-rules.mjs:91`). The lint passes. The conflict lies in the rule pair, not in the implementation. Design records it as a "known tension for O-057 to settle". O-057's outcome already covers "spans ... follow API-04", and 0.8.0 ships only after O-057. Observation O3.
3. **Drift Notes and their reconciliation.** Every Drift Note of T-259 to T-263 has an entry in Design.md "Drift accounting for O-056 T-259 to T-263", either reflected in the new O-056 paragraph or marked non-architectural with a reason. T-264 has none. Two factual slips are in observation O2. The T-262 note on the `mover` cause was left for the Check. It is real but narrow: `#mover` takes the cause of the last published reading, so a look, scale or switch change can now be the cause a later selection drop names, if no clock or view publish comes between them. No O-056 criterion promises selection causes. Observation O6.
4. **Success Conditions:** 1 to 8 met (matrix rows 1-20). The one failure is the release gate in row 21.

## Issues

| Issue | Rule | Scenario | Expected / actual |
|---|---|---|---|
| I-142 | Release gate `check:browser` (`public-build-assets` load budget), TEST-01 | `npm run check:browser` on 180535a4 | `api/index.html` within 100,000 raw / 30,000 gzip; actual 118,927 raw (gzip 26,965). Main 94,439. `load-budget.mjs:41`. No fast test measures the page. |

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-142 | High (deterministic; every public build) | Low to Medium (one static doc page about 19% over; gzip within limit; the gate is red, so release and Objective closure are blocked) | Medium | Fix now. Either the owner records a new limit for the larger API page, or the page is trimmed. Then add the fast-suite size test from I-142 Proof Needed so the next growth fails `npm test`. One `check:browser` re-run in the re-check. |

## Observations (non-blocking)

- **O1.** The happy-dom AbortError printed by `loadingCoverChain.test.ts` has existed since O-055 and comes from a fetch left pending at teardown. It is worth a small follow-up (stub or await the star-catalogue fetch in that test) so real unhandled errors are not hidden by noise. It is outside O-056.
- **O2.** The Design.md codebase map's tests row says O-056 "added" `sunLook.test.ts` and `eventZonesDom.test.ts`, but both exist on main; O-056 changed them. The O-056 paragraph lists `camera.reach` and `camera.fitted` among "the scene reads", but they are existing members.
- **O3.** The API-04 span wording vs the lint (item 2) should be settled when O-057 is planned, by fixing the rule pair rather than the read alone.
- **O4.** A cold `scene.load()` without a needed package rejects with "titan needs the astraeus-data-saturn package: install it and pass it as mount(element, scene, { data: [...] })". That is accurate, but it names `mount` to a caller of `load`.
- **O5.** One trailing space at `packages/astraeus/tests/eventZonesDom.test.ts:262` (`git diff --check`).
- **O6.** The selection-drop cause after a paused look, scale or switch change (item 3, T-262 note). It sits next to the existing I-137.
- **O7.** T-264's User Check named a Milky Way slider, which the example leaves out because it installs no data package. The reason is stated in code, README and CHANGELOG, and the owner looked and said "looks right". The `glow` and `glow-size` sliders are moved by the browser step but only the star slider's effect is asserted.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: T-262 (9e3936a5) is 31 files, +589/-76, for the live controls (seam, link, clock, handle, `App.tsx`, tests). Each file belongs to the one seam, but the diff is large.

## Closure

- `NEEDS WORK`: remediation is a direct repair under I-142 (issue-capture.md), which the coordinator or owner routes. Every owned Task keeps `status: done`.
- Owner decisions on O-056: no structured `exception` or `owner_validation.accepted_check` is recorded. The Task-check waivers on T-259 to T-264 are waivers, not exceptions. The 2026-11-03 `allowlistGrowth` decision is a rule change already in the code; it is reflected, not carried forward here.
- Owner validation still needed: T-264 declares `owner_validation.required: true`. Its look is recorded in Technical Evidence, but the structured acceptance (`accepted_check`) can only name a Check that clears. If the I-142 repair changes no example or look, the look needs no repeat.

## What This Run Wrote

- This record, and `.savepoint/issues/I-142-the-api-reference-page-is-over-its-load-budget-after-o-056-s-doc-comments.md`.
- `docs/evidence/check-o056-20261103/`: the probe files, the probe results and gate time notes.
- `docs/evidence/browser-20261103T105219Z/` (the one browser run).
- One official health snapshot.
- The usual gate outputs (`coverage/`, `junit.xml`, `dist/`, `examples/*/dist`).

A temporary worktree of main was made for the baseline comparisons and removed. Nothing was committed. The router, `docs/prds/` and `docs/research/` were not touched, and no implementation file was edited.
