---
id: C-170
scope: {kind: release, id: G-018}
result: CLEAR
checked_by: {role: checker, session: release-0-9-0-i169-recheck-20261111}
executed_session: release-0-9-0-builder
checked_at: '2026-11-10T23:50:00Z'
reviewed:
  base_commit: 18fc22a7
  head_commit: 18fc22a7
  files: [packages/astraeus/src/api/cameraRequest.ts, packages/astraeus/src/api/planCamera.ts, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/viewerCamera.ts, packages/astraeus/src/api/viewerHandle.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/CameraController.tsx, packages/astraeus/src/app/experienceDefinition.ts, packages/astraeus/src/app/lookOut.ts, packages/astraeus/src/app/sceneCamera.ts, packages/astraeus/src/core/startView.ts, packages/astraeus/tests/lookOutDirectionForms.test.ts, packages/astraeus/tests/hostCameraDom.test.ts, packages/astraeus/tests/sceneCamera.test.ts, packages/astraeus/tests/apiImports.test.ts, packages/astraeus/api-surface.lock.json, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, .savepoint/Design.md]
  dependencies: []
issues: []
supersedes: C-169
---

# C-170: I-168 and I-169 repair re-check

**What this checks.** The reworked direct repair of I-168 and I-169 (uncommitted on `release-0-9-0` over HEAD `18fc22a7`) after C-169 found NEEDS WORK and the owner chose "one shared rule": the opening `scene.camera.lookOut` accepts and resolves look-out directions through the same rule and runtime path as `setCamera` and story panel cameras. Quick method, re-check of C-169's scope lock (I-168 and I-169 Proof Needed, C-169's questions), same scope and `supersedes` chain as C-169.

**Independence.** This session did not plan, build or repair this work and did not run C-169. It wrote two temporary probe tests (deleted after the run), this record and the Issue closures. No code repaired, nothing committed or pushed, router untouched, `docs/prds/` and `docs/research/` not read or touched.

**Closure map.** I-168: closed `verified`. I-169: closed `verified`. No owner decision (acceptance or exception) is recorded on this scope, so none is carried forward.

## Proof Needed

| Item (frozen cell) | Expected | Actual |
|---|---|---|
| One shape rule (I-169) | the opening look runs the same check as `setCamera` | `SceneCamera.lookOut` passes `{ ...look, lookOut: id }` to `cameraRequestOf`; `validateSkyLook` deleted; the only extra guard is the `look` envelope (non-object, or a `lookOut` key smuggled in). Scan test fails if any other `src/api` file calls `validateSkyPosition`/`validateSkyDirection`. |
| One id check (I-169) | same check and wording | `setCamera`'s inline id check extracted to `checkCameraIds`/`checkToward` (`api/cameraRequest.ts`); `viewerCamera.ts` uses it; the opening runs `checkToward` at build (`checkOpeningLook`) against the opening view's objects plus groups (App's `experienceWithGroups` adds groups) and all sky figures. |
| One runtime path (I-168, I-169) | the opening turns as `setCamera` does | An id opening is kept as a `LookOutRequest` in `startView`; `initialSceneControls` runs the same `aimAtFigure` as App's `setCamera`; `openFirstFrame` runs `applyLookOut` for both id and numeric sky openings (numeric converted to the same request). `openingViewOf`, `startToward`, `lookToward` removed. |
| Parity test drives every entry with one form list (I-169) | divergence fails | `lookOutDirectionForms.test.ts`: 12 shared FORMS through `setCamera` (reference) and three ENTRIES (lookOut figure before/after, story panel); each must match the reference's accept/refuse; the reference's accepted set is pinned. Because every entry now calls `cameraRequestOf`, a new form added there reaches all entries; a form added to FORMS is driven through every entry. |
| Positions, figure ids, object ids; unknown id named (I-168, I-169) | accepted / `bad-camera` naming it | test rows pass; probes: `direction: "sun"` with no Sun added refused at build naming the opening view's objects; `null`, `NaN`, `focus` key refused at the call; `{ raDeg: 370 }` opens at 10, flat `raDeg: -10` at 350 (wrap kept); `undefined` look opens at 0, 0, fov 60. |
| Hidden object refused as on `setCamera` | `bad-camera` at build | test row passes (view hiding `pb`). |
| `scene.camera.pose` / `handle.camera` (I-169) | no false direction, or documented | `pose` is undefined after an id `lookOut`; `handle.camera` reads undefined after `ready` until the first frame (DOM test asserts it after `ready` resolves). Documented on `SceneCamera.lookOut`, `pose`, `ViewerCamera.camera`, `ViewerHandle.camera`, README and CHANGELOG. The type was already `CameraPose \| undefined`; position and orbit openings are unchanged, so existing callers are unaffected. |
| Public surface vs HEAD (API-01, API-07) | only the widening, documented | `api-surface.lock.json` diff is the one `lookOut` signature line (`SkyDirection \| string`); `lookToward` is gone; CHANGELOG states the widening and "No other public surface changes". |
| Real browser | no regressions | `check:browser` passes (below). An id opening is not a browser step; the coordinator's packed-consumer run (`"Leo"` ra 157.46 dec 19.48; `"sun"` ra 358.88 dec -0.49 on 2027-03-20, desktop and phone) is reported, not reproduced. Both values are plausible (Leo's label region; the Sun near the March equinox point). |

All Proof Needed items: **proven**.

## Questions weighed

- **`app/viewHiding` in the `apiImports` allow list.** Acceptable: it reuses the viewer's one hiding rule so the opening check sees the same objects `setCamera` does, rather than a second copy (STYLE-07), and the reason is recorded.
- **Shortened doc comments.** Still complete: forms, defaults, error timing, and the undefined pose are stated.
- **History timestamps.** Builder entries on I-168/I-169 (`2026-11-11T09:40Z`, `10:32Z`, and I-168's source `09:00Z`) are local time (UTC+11) labelled UTC; actual UTC at this check is about 2026-11-10T23:50Z, so they read as future. Not corrected here (another actor's entries). This record's entries use true UTC and so sort before them. Observation for the owner.

## Gates

All run fresh in this session on the working tree:

| Gate | Result |
|---|---|
| `git diff --check` | pass |
| `npm run lint` | pass (4 s) |
| `npm run typecheck` | pass (7 s) |
| `npm run build` | pass (2 s) |
| `npm test` | pass, 249 files, 3716 passed, 2 skipped (45 s) |
| `npm run check:engine-alone` | pass (21 s) |
| `npm run check:pack` | pass (18 s) |
| `npm run check:node-consumer` | pass (5 s) |
| `npm run check:browser` | pass, 12 steps exit 0, error-lines 0, total 305 s (limit 320 s); evidence `docs/evidence/browser-20261110T233644Z` |

## Materiality

No Issues; no materiality actions required.

## Observations (non-blocking)

- A malformed look-out direction id (`""` or the body itself) gives a doubled message, `camera.lookOut: camera.lookOut: ... or a pose from camera; give ...` (`lookOutOf` in `api/cameraRequest.ts` re-wraps the `SceneError` from `lookDirection` because it is caught as a `RangeError`). Pre-existing in `setCamera` at HEAD, now shared; code and cause are right.
- `SceneCamera.lookOut` reads the raw `raDeg`/`decDeg` back from the look after `cameraRequestOf` has checked it (to keep a numeric pose). Not a second check, and the wrap probe shows the same result, but it is a second read of the shape.
- `checkOpeningLook` checks the direction id but not whether the opening view hides the body looked out from (`setCamera` refuses a hidden body). Same as HEAD for position openings; outside this lock.
- `check:browser` 305 s against 320 s, close to the warning line, as in C-168 and C-169.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches** — 12 forms × 4 entries, hidden object, last call wins, host request still wins, undefined pose before the first frame.
- [x] STYLE-04 **Types document intent** — `OpeningView = CameraView | LookOutRequest`.
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** — one shape rule, one id check, one runtime path; the default fov is now `SKY_OPENING_FOV_DEG`. Minor raw re-read noted above.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs** — 19 files, +158 / -57, plus one test file; net removal of the I-168 first-pass mechanism.
