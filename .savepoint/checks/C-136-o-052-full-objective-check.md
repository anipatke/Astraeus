---
id: C-136
scope: {kind: objective, id: O-052}
result: CLEAR
checked_by: {role: checker, session: o052-check-20261101}
executed_session: o052-run-20261101
checked_at: '2026-11-01T04:46:34Z'
health_snapshot: sha256:7146802d8cc4aab0a2116bb94724e3c6553eb8eb68665a5f4a6de03f326eb90c
reviewed:
  base_commit: 723eb3cf
  head_commit: c888350d
  files: [packages/astraeus/src/api/viewerLink.ts, packages/astraeus/src/api/mount.ts, packages/astraeus/src/api/AstraeusScene.tsx, packages/astraeus/src/api/index.ts, packages/astraeus/src/api/story.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/address.ts, packages/astraeus/src/app/viewLink.ts, packages/astraeus/src/app/viewerPort.ts, packages/astraeus/src/app/openClock.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/sceneCamera.ts, packages/astraeus/src/app/CameraController.tsx, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/core/pacing.ts, packages/astraeus/src/shell/bootLoader.ts, packages/astraeus/src/synthetic/syntheticViewsDefinition.ts, packages/astraeus-site/src/main.tsx, examples/hello-scene/src/main.js, examples/hello-react/src/main.jsx, tools/check-node-consumer.mjs, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, .savepoint/Design.md]
  dependencies: []
issues: []
supersedes: null
---

# C-136: O-052 Full Objective Check

The mandatory Full Objective Check of O-052, "Make views work for a multi-probe app" (G-015). It covers T-222 to T-227. The diff is `git diff 723eb3cf..c888350d` (plan commit to head, 58 files, +2591/-177). T-222 to T-226 are `done` under owner check waivers (`check_waiver` on each, run rules "orchestrate 052"); T-227 is `in_progress`/`audit` with a waiver and the owner look recorded ("looks good", 2026-11-01T04:36:59Z). This Check is the one technical gate.

**Independence.** This session did not plan, build, repair or coordinate O-052. It wrote only: gate outputs (`coverage/`, `junit.xml`, `dist/`, packed tarballs), one official health snapshot, one browser evidence folder `docs/evidence/browser-20261101T044028Z/`, one throwaway probe test file (copied into `packages/astraeus/tests/`, run with `npx vitest run` after `test:full` and the health snapshot, then deleted; source kept in the checker scratchpad as `zzCheckProbe.test.ts`), and this record. Not a lane (`git-dir` = `git-common-dir` = `.git`). `docs/prds/` and `docs/research/` were not read or touched. Times UTC.

**Verdict: CLEAR.** Every must of the Objective is proven by code reading, the Tasks' tests, independent probes and the gates; the replanned modularity shape (one event-zone signal, no engine camera behaviour, camera pose read and restore) is what was built. No Issue is admitted. I-130 is judged outside the acceptance criteria (below). Closure: T-227 declares `owner_validation.required`; its completion and the Objective's close are the owner's decisions.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (lanes and manifests are advice; not evaluated as findings)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: initial Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Criteria and rules.** O-052 Success Conditions: S1 Ready means usable; S2 Address handling; S3 Pacing follows views; S4 Host camera (with pose read/restore, replan 2026-11-01); S5 Event zone signal (replan: no built-in camera behaviour, no `EventInput` field, no pacing `camera` option); S6 Example; S7 Proof and docs (README, CHANGELOG Unreleased with the two 0.7.0 behaviour changes and first-download size, Design reconciled, one browser run, owner look). Each Task's Done When (T-222..T-227). Guardrails ARCH-01, ARCH-02, ARCH-03, ARCH-06, CODE-01, CODE-02, TEST-01, TEST-03, TEST-04; STYLE advisory. Project rule "Deferred Design reconciliation". Gates: `quality_gates`, `test:full`, `check:engine-alone`, `check:pack`, `check:node-consumer`, one `check:browser`.
2. **Entry points.** `mount` (`ready`, `time`, `rate`, `view`, `camera`, `eventZones`, `setTime`, `setRate`, `setView`, `setCamera`, `onChange`, `onEventZone`, `unmount`, option `address`); `AstraeusScene` props `onReady`, `camera`, `onEventZone`, `address` (plus existing `time`/`rate`/`view`); `ViewerLink` (`whenAttached`, `publish`, zone diff, camera validation); `App` `address`; `addressSearch`/`shareViewLink`; `pacedRate`, `zonesInView`, `activeEventZones`, `applyPacing`, `startPaceEase`; `CameraRequest { kind: "pose" }` in `sceneCamera`; exported types `CameraPose`, `CameraTarget`, `EventZoneChange`.
3. **Relied-on orchestration.** App's attach effect and 100 ms publish interval; `seekTo`/`changeRate`/`chooseView` handlers; `controls.cameraRequest` consumed by the frame's camera step; `controls.viewReadout` written every frame; `toDefinition` → `pacingFor` tagging zones.
4. **Matrix axes.** Below; text-class and output-sink axes not applicable (no text width or terminal output in scope).
5. **Admission boundary.** Supported public paths (`mount`, `AstraeusScene`, the site entry) with the packed package; Issues only against the criteria above.

## Coverage Matrix

| Row | Cells (normal / boundary / malformed / state / bypass) | Evidence | Result |
|-----|--------------------------------------------------------|----------|--------|
| S1 `ready` (mount) | bare `await ready` then reads and sets; views example; load failure rejects; unmount before render; unmount between render and attach | `viewerHostReady.test.ts` (IS_REACT_ACT_ENVIRONMENT false, no `act`); code `mount.ts:72-79`, `viewerLink.ts:80-108` | Passed; between-render-and-attach leaves `ready` pending (by the Done When wording; documented in `MountedScene.ready`); observation O1 |
| S1 `onReady` (React) | first open; rebuild with new scene; StrictMode first open and rebuild | `viewerHostReady` "onReady fires after the link attaches"; checker probe: StrictMode first open and rebuild, non-Strict rebuild, all fire with the viewer in the page | Passed; StrictMode code-reading note O2 |
| S1 test-pattern guard | old `act`-wrapped `await ready` now deadlocks; `drawn()` helper | T-222 evidence; four suites migrated | Passed (guard is by timeout, no lint rule; recorded limit) |
| S2 address off | every reader gets `""`; no `replaceState`; copy-link hidden; mount and React default off | `addressDom.test.ts`; `addressRule.test.ts` scan (one door); checker grep over `src/` for `location`, `history.`, `URLSearchParams`, `document.URL`: only `address.ts`, `SwitchControl.tsx` (demo switcher), `DeveloperSettings.tsx` (demo data alternates) touch the location; all parameter readers take a `search` string | Passed |
| S2 address on | today's reads; `show=` written and read back; unknown `show` falls back to `start`; site passes `address` | `addressDom.test.ts`; `startViewId` in `App.tsx`; `astraeus-site/src/main.tsx`; browser `public-addresses` step | Passed |
| S2 docs | README "Page address" table lists all 17 parameters, read/write | README lines 228-252, matched against the grep above | Passed; the top API table's `mount(...)` and `<AstraeusScene ...>` rows omit `address?` (O4) |
| S3 per-view pacing | A slows at A only, B at B only, Both at all; span in every view (also an empty view set); no views = 0.7.0; boundaries at zone edges inclusive / ±1 ms | `pacingViews.test.ts`; unchanged `pacing.test.ts`/`pacingDom.test.ts` (only `act` helper and imports changed); checker probe (independent hand-computed oracle) | Passed |
| S3 switch ease | geometric mean at half, target at 1 s, ease cleared; seek lands at once; chosen speed wins until `"auto"`; `onChange` cause `playback` | `pacingViews`/`pacingViewsDom`; checker probe (rate at 500 ms = sqrt(3600*60), at 1000 ms = 60, `ease` removed) | Passed |
| S3 validation | `near` type in no single view loads; type matching no event throws `bad-timeline` | `pacingViews.test.ts` | Passed |
| S4 `setCamera` | follow, focus, pose; pose from JSON; reordered pose keys; unknown id; hidden id; malformed (null, array, string, both keys, extra key, NaN, negative, Infinity distance); before ready / after unmount `missing-data` | `hostCameraDom.test.ts` (15 malformed cases); checker probe through `ViewerLink` (nothing sent on any rejection) | Passed |
| S4 `camera` read | plain JSON value; undefined before ready and after unmount; opening pose from ready; restore after visitor move within rounding; moving object; stay-hold escape | `hostCameraDom`, `sceneCamera.test.ts` "a pose read and restored" | Passed; doc-comment mismatch O3; stay-hold pose re-centres (documented) |
| S4 React `camera` prop | once drawn; on value change; same value new object not re-applied; errors to `onError`; independent of `time`/`view` props (own effect deps, no I-129 coupling) | `hostCameraDom`; `AstraeusScene.tsx:69-76` | Passed |
| S5 zone signal | playback enter/leave; host and visitor seeks; view switch hides/shows active zone; other view's zone silent; overlap; opening inside; no pacing; after unmount; stop function; React prop; `via` per trigger; mixed view-change + crossing in one publish reports `view` | `eventZonesDom.test.ts`, `pacing.test.ts` `activeEventZones`; checker probe for the mixed publish and a re-attach | Passed |
| S5 no engine camera | no `EventInput` field, no pacing `camera` option, no camera write from zone code | diff of `story.ts` (only `eventId` tag), `pacing.ts`, `viewerLink.ts` | Passed |
| S6 example | hello-scene: two probes, three views, pacing, `await ready`, `onEventZone` + `camera` + `setCamera`, restore on `via === "time"`; hello-react follows only (I-130); made-up data; built from packed tarballs | `examples/*`; `publishWorkflow.test.ts`; browser steps `hello-scene`, `hello-react` | Passed |
| S7 proof and docs | README rows; CHANGELOG Unreleased (two behaviour changes, size +7,027 raw / +5,773 gzip); Design paragraph; owner look recorded | files read in full for the changed sections | Passed |
| ARCH-01/06 | no body, mission or demo names in new engine code | grep over `core/pacing.ts`, `api/viewerLink.ts`, `api/mount.ts`, `api/AstraeusScene.tsx`, `app/address.ts`: none; `flyby` appears only as made-up scene data in synthetic and examples | Passed |
| ARCH-02 | pacing, views, camera, zones are presentation | zones and pace state in `SceneControls`/`ViewerLink`; no State write | Passed |
| ARCH-03 | synthetic two-probe scenes prove the capability | `pacingViews`, `eventZonesDom`, `syntheticViewsDefinition`, node consumer | Passed |
| CODE-02 | no new inline per-frame work | `applyPacing` remains in the `frameTime` stage; pose request handled in the existing camera step | Passed |

### Finite External-Boundary Matrix

The only external boundaries are the browser runner and the packed-package builds. Configured and actual target: `check:browser` starts its own servers on its own ports and left the owner's :5490 server running (verified after the run). Startup ordering, refusal, timeouts and cleanup belong to the existing runner, unchanged by this Objective (not applicable beyond the one run). No network calls added to the engine (not applicable). Secret-safe output: no secrets in scope.

### Workflow And Side-Effect Lock

| Order | Operation | Side effect | Failure | Oracle |
|-------|-----------|-------------|---------|--------|
| 1 | `mount` → `prepareScene` | none | load failure rejects `ready`, handle stays `missing-data` | `viewerHostReady` |
| 2 | `root.render(App)` | DOM | unmount first: `ready` pending, calls `missing-data` | same |
| 3 | App effect `host.attach` | link usable, `whenAttached` resolves, zone set reset | rebuild: `detach` re-arms the wait | probe rebuild cases |
| 4 | 100 ms tick / seek / view / rate | `publish` → change then zone reports | a throwing zone listener stops later listeners for that report and propagates to the caller (O5) | probe |
| 5 | `setCamera` | `controls.cameraRequest` set; consumed next frame | validation before any write: nothing sent on rejection | probe |
| 6 | copy view link (address on) | `history.replaceState`, clipboard | clipboard refusal shows the link | `addressDom` |
| 7 | `unmount` / `close` | listeners cleared, no further callbacks | — | `eventZonesDom`, `viewerHostDom` |

## Gates

All from the repo root on `o052-views-fixes` at `c888350d`, Node toolchain as installed, 2026-11-01:

| Command | Started | Result |
|---------|---------|--------|
| `git diff --check 723eb3cf..HEAD` | 04:37:41 | exit 0 |
| `npm run lint` | 04:37:41 | exit 0 |
| `npm run typecheck` | 04:37:44 | exit 0 |
| `npm run build` | 04:37:50 | exit 0 (chunk-size warning only, pre-existing) |
| `npm run test:full` (full gate; includes the configured junit test command) | 04:37:53 | exit 0; 179 files, 2202 passed, 1 skipped; coverage statements 92.06%, branches 87.11%, functions 92.39%, lines 94.53% |
| `npm run check:engine-alone` | 04:39:02 | pass in 17.7 s |
| `npm run check:pack` | 04:39:20 | pass (17.3 s); `astraeus` packed 7.18 MB (limit 8.0), unpacked 9.29 MB (limit 9.5) |
| `npm run check:node-consumer` | 04:39:38 | pass, 9 tests (incl. the O-052 two-probe views + pacing test) |
| `npm run check:browser` (one run) | 04:40:28 | exit 0, 360 s, every step error-lines=0: smoke, smoke-public-showers, planets-phone, meteor-shower, views, hello-scene, hello-react (both from the packed tarballs), public-build-assets, public-addresses; evidence `docs/evidence/browser-20261101T044028Z/` |

Checker probe (`npx vitest run tests/zzCheckProbe.test.ts`, then deleted): 9 cases. All behaviour cells passed. Three cells first failed on the probe's own oracle (strict `toBe` on `exp(log(r))` round trips, 59.999999999999986 vs 60, a pre-existing property of `pacedRate`'s log blend; and a mock that reused one definition object, which `prepareScene` never does since `toDefinition` builds a new one); corrected to `toBeCloseTo` and fresh definitions, they pass. One remaining strict-equality cell (span rate 10.000000000000002) is the same oracle precision, not a behaviour fault.

## Code Health

`savepoint health check O-052` after the full gate: snapshot `sha256:7146802d8cc4aab0a2116bb94724e3c6553eb8eb68665a5f4a6de03f326eb90c` (created). Verdict: "Code Health does not block clearance." Instances complexity (lizard), coverage (vitest v8), dependency vulnerabilities (osv-scanner), duplication (jscpd) and tests (vitest junit), all optional and reported with no finding. Supporting evidence only.

## Design Reconciliation

`.savepoint/Design.md` Interfaces and Data Flow gained the paragraph "Views fixes for a multi-probe app (O-052, G-015)". Each Drift Note:

| Drift Note | Design |
|------------|--------|
| T-222 `ViewerLink.whenAttached()`; `ready`/`onReady` mean attached | item (1) |
| T-223 `src/app/address.ts` one door, `App` `address`, mount/React option default off, site on | item (2) |
| T-223 `SceneControls.loadFadeSeconds`; `bootFadeSeconds(search)` no location read | item (2) |
| T-223 `show=` joins view-link parameters | item (2) |
| T-224 zones carry `eventId`; `pacedRate`/`applyPacing` take the view's event set; `SceneControls.pace` (`PaceView`), not State; `zonesInView` reuse | item (3) |
| T-225 `CameraRequest` `pose` kind; `ViewerControl.cameraTargets`/`readCamera`/`setCamera` | item (4) |
| T-225 stay-held camera reads as its last focus; restore re-centres; fixed-point pose a possible follow-up | item (4) |
| T-225 target-shown rule (experience objects minus `viewHidden.objects`) | item (4) |
| T-226 `ViewerState.zones`, `ViewerControl.events` (host link only); `ViewerLink` reports; no engine camera | item (5), plus T-227's `via` |

Every note is reflected; none needed a non-architectural disposition.

## Known Items Judged

- **I-130 (open), React cannot read the camera.** The Objective's Host camera must names `MountedScene.camera` as the pose source and the React `camera` prop for setting; the Example must asks for host code that moves the camera and back, which `hello-scene` does; T-227 made `hello-react` conditional ("if it stays small"). So the gap is a real parity limit of the public API but not a violated criterion. Deferring it to the owner's whole-API review (next Objective) is proportionate. Not admitted as a Check Issue.
- **`ready` pending forever after unmount before attach.** Matches T-222's Done When ("never resolves it as usable") and is documented on `MountedScene.ready`. A host that awaits `ready` after unmounting hangs instead of hearing `missing-data`; candidate for the API review (O1).
- **Pose read during a `stay` hold restores re-centred on the object.** Documented in the README `handle.camera` row and Design item (4); a `StartView` cannot express a fixed point. Acceptable as documented.
- **Opening pose before the first frame ignores the first-frame overview distance adjustment.** Recorded in T-225; the README says the pre-frame value is "the opening pose". Low impact (a pose read in the first frame's gap restores a slightly different distance). Accepted as a recorded limit.

## Issues

None admitted. No materiality actions are required.

## Observations (non-blocking)

- O1. After an early `unmount`, `ready` has two outcomes depending on timing: an unmount before loading finishes resolves `ready` (unusable handle, `mount.ts:76` `if (!open) return;`), and an unmount between render and attach leaves it pending for good (`viewerLink.ts:93`, `close` never settles the wait). The `MountedScene.ready` comment ("Never resolves if `unmount` came first") matches only the second. Both satisfy T-222's "never resolves it as usable". A single rejecting `missing-data` would be the more consumable contract; for the API review.
- O2. Under React StrictMode (development), the `[link]` effect's double invoke calls `link.close()` once, which sets `#closed` for good; `detach` then never re-arms the wait (`viewerLink.ts:93`), so after a later rebuild `whenAttached()` is already resolved and `onReady` can fire before the new viewer attaches. The probe (DOM presence as oracle) did not show a failure, and a React host has no reads in `onReady` (I-130), so the consequence is small; worth a look in the API review together with I-130.
- O3. `MountedScene.camera`'s doc comment (`mount.ts:39`) and `ViewerLink.camera` (`viewerLink.ts:162`) say it is undefined "before the first frame is drawn", but `App.readCamera` returns the opening pose from `ready` on, as the README and CHANGELOG correctly say. Doc comment drift only.
- O4. The README API table's `mount(element, scene, { data?, onChange? })` and `<AstraeusScene ... />` rows omit `address?`; the "Page address" section documents it fully.
- O5. A zone listener that throws stops later listeners for that report and propagates to the caller (the interval, a host's `setTime`, a visitor's click). `hello-scene`'s `setCamera(before)` can throw `bad-camera` if a view switch hid the saved pose's object without hiding the zone (T-227 limitation). Isolating listener errors, or a guard in the README composition, would harden it.
- O6. The packed-package proof of view-aware pacing (`check:node-consumer`) asserts only that views and pacing build; per-view rates and zone reports are proven in the source suites and the owner look, and the browser check does not assert pacing or camera motion (T-227 limitation).
- O7. The `AstraeusScene` `camera` prop compares by `JSON.stringify`, so the same pose with reordered keys re-applies once. Harmless.

## Owner Validation Still Needed

T-227 `owner_validation.required: true`: the owner's look is recorded as "looks good" (2026-11-01T04:36:59Z) and the owner decides T-227 completion and the O-052 close. Open I-130 is not linked as a blocker by this Check.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [ ] STYLE-08 **Comments explain why** — two doc comments contradict the behaviour (`mount.ts:39`, `viewerLink.ts:162`, O3).
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — `App.tsx` grew by about 100 lines across address, pacing, camera and zones; `ViewerLink` now holds clock, view, camera and zone duties (125 added lines in one class).
