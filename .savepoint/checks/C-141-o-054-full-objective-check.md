---
id: C-141
scope: {kind: objective, id: O-054}
result: NEEDS WORK
checked_by: {role: checker, session: o054-check-20261101}
executed_session: o054-run-20261101
checked_at: '2026-11-01T09:58:00Z'
health_snapshot: sha256:192714891e88029e6557ca9ce55e2170f89aeec4cd9e9220dcafcd1a48c81a5c
reviewed:
  base_commit: bd9d771f
  head_commit: ad3d724b
  files: [packages/astraeus/src/api/viewerHandle.ts, packages/astraeus/src/api/listeners.ts, packages/astraeus/src/api/sceneFreeze.ts, packages/astraeus/src/api/viewerSelection.ts, packages/astraeus/src/api/viewerCamera.ts, packages/astraeus/src/api/viewerClock.ts, packages/astraeus/src/api/viewerZones.ts, packages/astraeus/src/api/viewerViews.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus/src/api/mount.ts, packages/astraeus/src/api/AstraeusScene.tsx, packages/astraeus/src/api/prepared.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/planCamera.ts, packages/astraeus/src/api/planGroups.ts, packages/astraeus/src/api/data.ts, packages/astraeus/src/api/pathProvenance.ts, packages/astraeus/src/api/sunOrbit.ts, packages/astraeus/src/api/errors.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/viewerPort.ts, packages/astraeus/src/core/planetModels.ts, packages/astraeus/src/core/planetSeries.ts, packages/astraeus/src/core/sunCentredSources.ts, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/tests/listeners.test.ts, packages/astraeus/tests/viewerHandleType.test.ts, packages/astraeus/tests/viewerHostDom.test.ts, packages/astraeus/tests/viewerHostReady.test.ts, packages/astraeus/tests/viewerLinkPin.test.ts, packages/astraeus/tests/hostCameraDom.test.ts, packages/astraeus/tests/errorRule.test.ts, packages/astraeus-site/tests/allowlistGrowth.test.ts, packages/astraeus-site/tests/apiErrors.allowlist.json, packages/astraeus-site/tests/apiTypeLint.allowlist.json, packages/astraeus/api-surface.lock.json, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, examples/hello-react/src/main.jsx, .savepoint/Design.md]
  dependencies: []
issues: [I-137, I-138]
supersedes: null
---

# C-141: O-054 Full Objective Check

This is the mandatory integration Check for O-054, "Give React and plain apps the same handle" (G-016). Its scope is the diff `main..ad3d724b`: 11 commits, T-240 to T-249 plus the T-249 follow-up, 55 files, +1800/-204. It covers all ten Tasks. Each is `done` with an owner Task-check waiver (`o054-run-20261101`). The waivers are not technical clearance, and this Check reviews every Task.

**Independence.** This session did not plan, build, coordinate or repair O-054. It is not a lane: `git rev-parse --git-dir` and `--git-common-dir` both print `.git`.

It wrote only:

- gate outputs (`coverage/`, `junit.xml`, `dist/`, scratch folders)
- one official health snapshot
- one browser evidence folder, `docs/evidence/browser-20261101T094527Z/`
- temporary probe test files under `packages/astraeus/tests/zz*`, each removed after use
- three planted source edits, each restored with `git checkout --` and confirmed by `git diff --quiet -- packages`
- this record, I-137 and I-138

It did not touch `docs/prds/`, `docs/research/`, the three modified G-012/G-013/G-014 `Release.md` files or the router, and it committed nothing. Probe sources and logs are in the checker scratchpad: `zzC054probe.final.test.ts`, `zzC054real.test.ts`, `full1.log`, `full2.log`, `browser.log`.

**Verdict: NEEDS WORK.** Every gate passes: lint, typecheck, build, `test:full` twice, engine-alone, pack, node and React consumers, the hello-react build and the one `check:browser`. Success Conditions 1, 2, 3, 5, 6, 8, 9 and 10 are proven, and 4 holds in behaviour. Two Issues remain:

- **I-137 (medium).** `onSelect` reports `cause: "visitor"` when time drops the selection. This happens when a host `setTime` or playback runs past a path's samples. The `playback` cause promised in the doc comments is never produced. This affects Success Condition 7 (selection signal).
- **I-138 (low).** The listener-loop scan does not cover the new `viewerSelection.ts` part, and no test makes an `onSelect` listener throw. A planted loop bypass passes the whole suite. This affects Success Condition 4 and T-244's "a named test or scan fails if one does".

## Owner Decisions

No owner acceptance or exception exists on O-054 or its Tasks, and every Task has `owner_validation: {required: false}`, so nothing carries forward. The owner's 2026-11-01 choices are design decisions, and this Check applies them as requirements:

- the nine planned decisions
- allowlistGrowth counted per finding group (T-241)
- mount hides only the `not-mounted` rejection of `ready`

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advice only; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Criteria.** O-054 Success Conditions 1 to 10, the planned decisions, and every Done When of T-240 to T-249. Guardrails API-01, API-02, API-04, API-05, API-07, ARCH-02, TEST-01, TEST-03, CODE-01 and CODE-02. Release gates: the full gate, `check:engine-alone`, `check:pack`, `check:node-consumer`, `check:react-consumer`, the hello-react build from the tarball, and one `check:browser`.
2. **Entry points.** `mount` (`MountedScene` = `ViewerHandle` + `ready` + `unmount`) and `AstraeusScene` (`ref`, `onReady(handle)` and the existing props). Every handle member: `time`, `rate`, `playing`, `view`, `camera`, `eventZones`, `selected`, `setTime`, `setRate`, `setPlaying`, `setView`, `setCamera`, `onChange`, `onEventZone`, `onSelect`, `onCameraChange`. The `Scene`/`SceneCamera` mutators. The new codes `not-mounted`, `scene-mounted` and `bad-data`, and `duplicate-id` for activities.
3. **Relied-on runtime.** `ViewerLink` attach, detach, close, reopen and whenAttached. `App.tsx`'s host attach, its 100 ms publish interval and the selection publish. The `AstraeusShell` selection effects. `prepareScene`. React 19 StrictMode effect replay and `useImperativeHandle`.
4. **Matrix axes.** The two paths (mount, React) crossed with the states before ready, ready, after unmount, rebuild/remount and StrictMode, and with each new input changed alone. Each listener set crossed with a throwing listener. Selection causes visitor, host and playback crossed with what moved them (menu, view switch, time). Camera gap timing (inside the gap, paused). Freeze crossed with every mutator. Errors crossed with the four F8 sites. Not applicable: text classes, redirected or no-colour output and serialization (the scope has no text rendering or CLI), and network boundaries apart from `check:react-consumer`'s registry install.
5. **Admission boundary.** An Issue needs a supported public path: a real `Scene` built through the public API, or the handle on either path. Test-only fakes support probes but cannot found an Issue alone.

## Coverage Matrix

| # | Cell | Evidence | Result |
|---|---|---|---|
| 1 | SC1 one handle type, drift fails typecheck | `viewerHandleType.test.ts` (`expectTypeOf` Omit equality, ref and onReady types); planted break A (removed `onSelect` from `viewerHandleOf`): `tsc --noEmit` gives `TS2741 Property 'onSelect' is missing ... 'ViewerHandle'`, and `lifecycle.test.ts` fails 8+ cases | Proven |
| 2 | SC1 React gets the same object via ref and onReady, across a rebuild | `viewerHostDom` "AstraeusScene hands React apps the handle"; probe P5 `expect(ref.current).toBe(handle)` after a new `scene` prop | Proven |
| 3 | SC2 `ready` rejects `not-mounted` on an unmount before the load, and after the load but before attach | `lifecycle.test.ts` both paths; unhandled-rejection trio (only `not-mounted` is hidden; a load failure stays observable) | Proven |
| 4 | SC2 every read is undefined and every call throws `not-mounted` before ready and after unmount; `missing-data` keeps only its data causes | lifecycle member table (its completeness test catches a missing member, break A); `grep '"missing-data"' src/api` shows only `planBodies.ts:145` and `scene.ts:332` (data causes) | Proven |
| 5 | SC3 StrictMode: onReady once, after attach; the handle works | `lifecycle` and `viewerHostReady` StrictMode cases; probe P5b: under StrictMode, `onSelect`, `onCameraChange` and `setPlaying` through the ref all work after the replay | Proven |
| 6 | SC4 throwing listener: onChange, onEventZone | `listeners.test.ts`, lifecycle both paths | Proven |
| 7 | SC4 throwing listener: onCameraChange | lifecycle camera case (`reportError` called 4 times) | Proven |
| 8 | SC4 throwing listener: onSelect | Checker probe P7 (real scene) passes: the next listener hears the pick and `reportError` gets the error. No repo test covers it, and planted break B (a loop bypassing `callListeners` in `viewerSelection.ts`) passes `listeners.test.ts` + `lifecycle.test.ts` (42/42) and the whole suite (the only failures are 3 unrelated `packagePacks` cases, which pass on a clean re-run) | **Issue I-138** |
| 9 | SC5 every mutator frozen; reads answer; remount; a failed build stays editable | lifecycle table test over `Scene.prototype`/`SceneCamera.prototype`; planted break C (dropped `#editable()` from `setSwitches`): it fails with `scene.setSwitches: expected 'bad-switch' to be 'scene-mounted'` | Proven |
| 10 | SC6 F8 errors; the three O-054 allowlist entries removed | `errorRule.test.ts`; `grep -c O-054 *.allowlist.json` gives 0 in all 5 files; `sunOrbit.ts:147` matches by `instanceof`; the remaining `startsWith` in `scene.ts:332` is O-056's, by the T-240 Boundaries | Proven |
| 11 | SC7 playing/setPlaying on both paths, each alone, leave and return | lifecycle setPlaying case on both paths; `viewerHostDom` play button in step; P5 mount: unmount then remount the same scene, the old handle is not-mounted and the new one pauses | Proven |
| 12 | SC7 selected/onSelect: visitor pick, view drop by host or visitor, opening read, stop, unmount | `viewerHostDom` 5 cases; lifecycle both paths; P5 rebuild (listeners kept, no spurious report at re-attach) | Proven |
| 13 | SC7 onSelect cause when **time** drops the selection | P1 (made-up, host `setTime`): `[{survey-marker,visitor},{earth,visitor}]`, expected `host`. P2 (playback): `{earth,visitor}`, expected `playback`. **P6 (real Scene + real prepareScene, a path of 30 minutes on a 100-day timeline)**: `[{"object":"pa","cause":"visitor"},{"object":"earth","cause":"visitor"}]`, expected `host` | **Issue I-137** |
| 14 | SC7 onCameraChange: reports only on change, the opening pose not reported, ~10/s | lifecycle, `viewerLinkPin` (each field alone, easing with fake timers), `hostCameraDom` DOM ease and settle | Proven |
| 15 | Camera gap: a change inside the 80 ms gap is reported later, also when paused | P4: paused, host publish reports az 10; 10 ms later az 20 plus a host publish is skipped; the next 100 ms tick reports 20; nothing more over 1 s. The `App.tsx` interval publishes every 100 ms whether playing or not (`App.tsx:378-386`), and 80 < 100 | Proven |
| 16 | SC8 one lifecycle suite, every listed case, both paths | `lifecycle.test.ts` `describe.each([mount, AstraeusScene])` + StrictMode; no `it.todo` left | Proven |
| 17 | React rebuild: onReady fires for the new build and the host's call sticks | P3: `setPlaying(false)` inside the second `onReady` gives `playing === false` after it settles | Proven |
| 18 | SC9 hello-react restores the camera through the handle and builds from the tarball | `main.jsx` diff; `hostCameraDom` React case; `node tools/build-example.mjs hello-react` exit 0 (`astraeus-0.7.0.tgz`); browser step `hello-react` exit 0 | Proven |
| 19 | SC10 lock, README error table and rows, CHANGELOG migration, Design | `apiSurface`/`apiRules` pass inside `test:full`; CHANGELOG Unreleased opens with the O-054 migration paragraph; Design "One handle, one lifecycle (O-054)" accounts for every T-240..T-248 drift note | Proven |
| 20 | SC10 gates | see Gates | Proven |

**External boundary** (`check:react-consumer` registry install): the configured and actual target is the npm registry. The install succeeded: `newest React 19.x is react 19.3.1`, installed 19.3.1, server render passes. Unavailable-network, timeout and malformed-response cells are not exercised; that is not applicable here because they belong to the tool's O-053 scope, unchanged here.

**Workflow lock (mount).** In order:

1. `prepareScene`: a build fault throws synchronously and the scene stays editable.
2. `markMounted`.
3. Load: a fault rejects `ready` and stays unhandled when unawaited.
4. `root.render`, then `whenAttached`: a `close` first rejects with `not-mounted`, which is marked handled.
5. `unmount`: `link.close` clears all four listener sets, then `root.unmount`. A second call does nothing.

The independent oracle is the lifecycle suite plus probes P3 and P5. No partial side effect escapes.

## Adversarial Pass

- **Bypass.** `Object.create(viewerHandleOf(link))` hides handle members from `Object.keys` and spread on the mount handle. Destructuring and the prototype getters work. This is an observation, not an Issue: the type is honest.
- **Revived transitions.** StrictMode reopen, rebuild, and unmount then remount all pass (P3, P5).
- **Cause correctness across representations.** `onChange` and `onEventZone` name `host` for `setTime`. `onSelect` names `visitor` for the same `setTime` (I-137).
- **Guard self-tests.** Break A was caught by the type and the table, and break C by the mutator table. Break B was **not caught** (I-138).

## Gates

| Command | Result |
|---|---|
| `npm run lint` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 (chunk-size warning only) |
| `npm run test:full` #1 (09:34:49Z start) | 190 files, 2328 passed, 1 skipped; Lines 94.68%; exit 0 |
| `npm run test:full` #2 | 190 files, 2328 passed, 1 skipped; Lines 94.68%; exit 0. No flaky case in either run |
| `git diff --check main...HEAD` | clean |
| `npm run check:engine-alone` | pass in 17.7 s |
| `npm run check:pack` | pass (17.2 s) |
| `npm run check:node-consumer` | pass |
| `npm run check:react-consumer` | pass; react 19.3.1 installed and newest |
| `node tools/build-example.mjs hello-react` | exit 0, built from `astraeus-0.7.0.tgz` |
| `npm run check:browser` (once, 09:45:27-09:51:18Z, HEAD ad3d724b) | exit 0. Smoke, smoke-public-showers, planets-phone, meteor-shower, views, hello-scene, hello-react, public-build-assets and public-addresses all `exit=0`, `error-lines=0`. Evidence `docs/evidence/browser-20261101T094527Z/`; logs `/tmp/astraeus-check-logs-UMKoLW` |

## Code Health

`savepoint health check O-054` ran after the second `test:full` and gave snapshot `sha256:192714891e88029e6557ca9ce55e2170f89aeec4cd9e9220dcafcd1a48c81a5c` (created). Verdict: "Code Health does not block clearance". Complexity, coverage, dependency vulnerabilities, duplication and tests are all optional and report no blocking finding. This is supporting evidence only.

## File Reality

Every file named in the Tasks' evidence and drift notes exists: `viewerHandle.ts`, `listeners.ts`, `sceneFreeze.ts`, `viewerSelection.ts`, `lifecycle.test.ts`, `listeners.test.ts`, `viewerHandleType.test.ts`, `errorRule.test.ts`. `NoFullTurnError` is in `core/sunCentredSources.ts` and `PlanetFitsUncoveredError` in `core/planetSeries.ts`. There are no phantom files.

## Issues

- **I-137** (T-247; SC7). Violated: the documented `onSelect` `cause` meaning (`viewerHandle.ts:38`, `viewerSelection.ts:11`) and API-02/ARCH-02 signal honesty. Reproduction: P6 above. Cause: `App.tsx:369-377`, where `selectionCause` is only `visitor` or `host` and is set only by `hostSetView`, together with the time-driven fallback in `AstraeusShell.tsx:250-258`. Missing tests: there is no time-driven drop case.
- **I-138** (T-244, T-247; SC4). Violated: T-244 Done When, "a named test or scan fails if one does", for the new part. The scan's fixed file list is at `listeners.test.ts:93`. Reproduction: break B. Missing tests: no throwing `onSelect` case.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-137 | Medium. It needs a path shorter than the timeline, which is common for probe scenes, including the repo's own test scenes | Medium. A host that uses `cause` to tell a visitor's choice from an automatic change (for example, to open its own panel only on a visitor pick) acts wrongly, and `playback` never arrives | Medium | Fix now. It is a small, general fix: derive the selection cause from what moved the clock or the view. Combine with I-138 |
| I-138 | Low. The code is correct today | Low-Medium. A future regression in listener isolation for `onSelect` would ship unnoticed | Low | Combine with the I-137 repair: a rule-based scan over every `viewer*.ts` part, plus a throwing `onSelect` case |

## Things Judged (Coordinator's List)

- **Fixed microtask or timer waits on React commits in other DOM tests (the T-249 grep).** Observation, not an Issue. Most of them run inside `act`, which flushes React work, so the hop count races nothing. The out-of-`act` real-timer waits (for example `viewerHostReady.test.ts:146`) first await an event-driven promise (`onReady`) and use the 20 ms only as a "nothing more happened" window. A slow machine there would make the test miss a second call (a false pass), not fail it. Two `test:full` runs and the planted-break suite run had zero flakes in these files. No O-054 criterion covers the reliability of other tests. A later tidy-up could replace the negative windows with event counts.
- **Camera 80 ms gap and 100 ms tick.** Proven safe (row 15). A change skipped inside the gap is reported by the next tick, also when paused, because the interval publishes regardless of play state. A pose that changes and then reverts inside the gap is, correctly, not reported.
- **Selection `cause`.** The host `setView` drop gives `host` (correct, `viewerHostDom`), and the visitor view drop gives `visitor` (correct). Drops caused by time are wrong (I-137).
- **`timeUtcMs` beside the allowlisted `time` fields.** Observation. `SelectionChange.timeUtcMs` follows API-04. `ViewerChange.time` and `EventZoneChange.time` stay on the allowlist, `removedBy: O-057`. Choosing the compliant name over growing the allowlist is right under the shrink-only rule. The handle carries two spellings of the same moment until O-057 renames the old ones, so O-057 should rename to `timeUtcMs` to converge.

## Observations (non-blocking)

- O1. The mount handle's members live on its prototype, so `Object.keys(handle)` and `{...handle}` show only `ready` and `unmount`. This is honest by type. A README note could help hosts that spread the handle.
- O2. The `packagePacks.test.ts` cases failed once during the planted-break-B whole-suite run (one took 204 s). They passed on a clean re-run and in both `test:full` runs. This looks like load or timing during that run, not O-054.
- O3. The T-249 drift note on `ready`'s no-op catch is resolved by the owner decision and pinned by the unhandled-rejection trio. A mutation that marks every rejection handled fails it (builder's claim, consistent with the code reviewed).

## Owner Validation Still Needed

None required by the Tasks. O-054 closes only after I-137 and I-138 are resolved, through repair and a re-check or by owner acceptance, and a current Objective Check.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches**: the time-driven selection drop and the throwing `onSelect` listener are untested branches (I-137, I-138).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth**: the listener scan keeps its own fixed list of parts (`listeners.test.ts:93`) instead of deriving it, so it drifted when `viewerSelection.ts` was added.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
