---
id: C-190
scope: {kind: objective, id: O-078}
result: CLEAR
checked_by: {role: checker, session: check-o078-20261120}
executed_session: exec-t324-20261120
checked_at: '2026-11-20T20:44:29Z'
health_snapshot: sha256:5c2696b789efe9d7fee3a1ae36464d27dc98b72cd31b185bb516334c590a67dd
reviewed:
  base_commit: a597cedd
  head_commit: 45e15819
  files: [packages/astraeus/src/api/group.ts, packages/astraeus/src/api/groupLookInput.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/api/viewerHandle.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus/src/api/viewerLooks.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/PointsView.ts, packages/astraeus/src/app/SceneLabels.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/viewerPort.ts, packages/astraeus/tests/groupLookHandle.test.ts, packages/astraeus/tests/groupLookRender.test.ts, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/tests/twoViewers.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus/api-surface.lock.json, docs/architecture/groups-and-time.md]
  dependencies: []
issues: []
supersedes: null
---

# C-190: O-078 Full Objective Check

Fresh session; I did not plan or build O-078 (planner plan-g022-20261120, executor exec-t324-20261120). Scope: O-078 and its one Task T-324 (done; Task Check waived by the owner, waiver recorded on the Task). Diff: `git diff a597cedd..HEAD` (HEAD 45e15819), tree clean apart from untracked `docs/research/`.

**Result: CLEAR.** Every Success Condition is proven, Design is reconciled, all gates pass.

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (browser runner only; ran once, below)
- [x] Workflow And Side-Effect Check Lock (no persistence or artifacts; one host call then one frame stage)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (n/a: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. O-078 Success Conditions SC1-SC9; Guardrails API-01..07, ARCH-02, ARCH-03, TEST-01..04; gates in `docs/agents/build.md`.
2. Entry points: `ViewerHandle.setGroupLook` / `groupLook` via `mount` and the `AstraeusScene` ref (shared `viewerHandleOf`); internal path `ViewerLink` -> `ViewerLooks` -> `checkedGroupLook` -> `ViewerControl` (`App.tsx` map per runtime) -> `SceneControls.groupLooks` -> frame stage `applyGroupLooks` (in `placeViews`, before `place`) -> `PointsView.setLook` (both materials) and `SceneLabelLayer.setColor`.
3. Relied-on behaviour: `runFrame` runs every animation frame and `readDrawInputs` compares `state.wakes` (`sceneFrame.ts:445`), so a paused viewer draws after a wake.
4. Matrix below. 5. Admission: supported public calls only.

## Coverage Matrix

| # | Cell | Result | Evidence |
|---|---|---|---|
| A1 | colour only / size only / both / `{}` / `{color: undefined}` | pass | `groupLookHandle.test.ts` "sets the colour only, ..."; probe: `undefined` field keeps value |
| A2 | bad id: unknown, body, `""`, number, `toString`, `__proto__` | pass | handle test "throws bad-group naming the id ..."; probe: `toString`/`__proto__` -> `bad-group` |
| A3 | bad values: non-hex, 4/8-digit hex, padded hex, number colour, 0, -0, negative, NaN, Infinity, text, boxed Number, unknown field | pass | handle test table (10 rows) plus probe; each `bad-group`, look unchanged |
| A4 | not an object: undefined, null, string, number, array | pass | `bad-group` (test + probe) |
| A4b | non-plain objects: Map, Date | observation | accepted as `{}` (no change); see Observations |
| A5 | boundaries: `Number.MIN_VALUE`, 1e9, upper-case hex, frozen and null-prototype input | pass | probe: accepted, read back as given |
| R1 | read-back own look / defaults / non-group / before ready / after unmount | pass | handle tests; returned object is a copy (probe: mutating it changes nothing) |
| R2 | call order, last wins, immediate read | pass | handle test "lands in call order ..." |
| D1 | GPU and CPU path carry the look next frame; geometry, material, program version, fills, positions unchanged | pass | `groupLookRender.test.ts` it.each (2 rows); code: `PointsView.setLook` touches only `color`/`size` |
| D2 | path switch keeps look | pass | render test "a group that switches way of drawing ..." |
| D3 | paused viewer draws it | pass | render test asserts `wakes` +1 once; `runFrame`/`readDrawInputs` read wakes every frame (`sceneFrame.ts:445-462`) |
| P1 | presentation only: no onChange/onSelect, time and `scene.groups` unchanged; two viewers isolated | pass | handle test "is presentation only ..."; `twoViewers.test.ts` setter row |
| L1 | label colour follows; other labels untouched; recreated label layer re-coloured next frame | pass | render label test; probe (fresh `SceneLabelLayer` takes the live colour on the next `applyGroupLooks`) |
| N1 | no call: exactly as before | pass | render test "without any setGroupLook ..."; empty map returns early; full suite green |
| B1 | rebuilt viewer starts from new scene's looks | pass | handle test (AstraeusScene); map is `useMemo([runtime])` |
| T1 | 25 calls / 126,000 dots timing recorded | pass (measurement) | this run's full gate: median 0.037 ms, worst 2.773 ms over 20 runs (Node v24.16.0, machine busy); Chromium figure is the executor's recorded headless probe (calls median 0.1 ms) |
| DOC | README row + example, CHANGELOG 0.9.4 proposed, doc comments, API lock, no version bump | pass | diff; `apiSurface`/`apiRules`/README sync tests in the full gate |
| DES | Design reconciliation | pass | `docs/architecture/groups-and-time.md` "Live group looks" matches the code; linked from Design.md "Groups and the `points` layer" |

Probe: temporary `packages/astraeus/tests/zz-o078-check-probe.test.ts` (public `mount`/`Scene`, plus `SceneLabelLayer`/`applyGroupLooks`), 2/2 pass; deleted after the run.

## Acceptance Classification

SC1-SC9: **Proven**. T-324 Done When: proven; waiver present (TEST-04). Guardrails API-01 (lock + CHANGELOG), API-02 (both paths, lifecycle suite), API-03 (map per viewer), API-04 (`dotSizePx`), API-05 (only `SceneError` `bad-group`/`not-mounted`), API-07, ARCH-02 (material values only), ARCH-03 (made-up groups): satisfied.

## Gates

Run fresh on 45e15819, 2026-11-20 20:35-20:44Z, Node v24.16.0.

| Gate | Result |
|---|---|
| `npm run test:full` | exit 0; 267 files, 4104 passed, 2 skipped; 74.6 s |
| `npm run lint` / `typecheck` / `build` | exit 0 each |
| `npm run check:engine-alone` | exit 0; 196 files, 2998 passed, 2 skipped; 27.9 s |
| `npm run check:pack` | exit 0; astraeus packed 7.31 MB / 8.0, unpacked 9.47 MB / 9.5 |
| `npm run check:node-consumer` | exit 0; 12 tests |
| `npm run measure:example` | exit 0; first open 1,777,808 B raw, 511,446 B gzip (0.9.3: 1,775,354 / 510,719; +2,454 / +727) |
| `git diff --check a597cedd..HEAD` | clean |
| `savepoint health check O-078` | snapshot `sha256:5c2696b7...` created; "Code Health does not block clearance"; five optional instances, no finding |
| `npm run check:browser` (once) | exit 0; 12 steps, all exit 0, error-lines 0; evidence `docs/evidence/browser-20261120T203845Z/` |

## Issues And Materiality

No Issues; no materiality actions required.

## Observations (non-blocking)

- `setGroupLook(id, new Map())` or a `Date` is accepted as `{}` and changes nothing, though SC1 says "not a plain object -> bad-group". Same check as `checkedLook` (`setLook`), TypeScript rejects both, and no state changes, so no credible consequence.
- `check:browser` printed time WARNINGs (total 337 s / 320; hello-sky 23 s / 15); time never fails the gate; the run followed the other gates on a busy machine.
- astraeus unpacked size has 0.03 MB headroom (9.47 / 9.5).
- The Chromium timing probe was scratch and is not in the repo; the timing is evidence, not a threshold.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** (shared `HEX`, `DEFAULT_POINT_SIZE_PX`)
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**

## Owner Validation Still Needed

None required by the Objective. The owner may judge the dimmed look on `localhost:5490`. Closing O-078 is the owner's decision.
