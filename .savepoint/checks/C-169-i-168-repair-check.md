---
id: C-169
scope: {kind: release, id: G-018}
result: NEEDS WORK
checked_by: {role: checker, session: release-0-9-0-i168-check-20261111}
executed_session: release-0-9-0-builder
checked_at: '2026-11-10T22:50:00Z'
reviewed:
  base_commit: 18fc22a7
  head_commit: 18fc22a7
  files: [packages/astraeus/src/api/planCamera.ts, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/experienceDefinition.ts, packages/astraeus/src/app/skyFigures.ts, packages/astraeus/tests/lookOutDirectionForms.test.ts, packages/astraeus/api-surface.lock.json, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, .savepoint/Design.md, .savepoint/issues/I-168-the-opening-look-out-refuses-a-sky-figure-id-that-setcamera-takes.md]
  dependencies: []
issues: [I-169]
supersedes: C-168
---

# C-169: I-168 direct repair check

**What this checks.** The direct repair of I-168 (the opening `scene.camera.lookOut(body, { direction })` refused a sky figure id that `setCamera` takes), uncommitted in the working tree on `release-0-9-0` over HEAD `18fc22a7`. No Objective owns it; scoped to the router's Goal G-018 as C-168 was. `supersedes: C-168` only because the loader wants one ID-ordered chain per scope; C-168's verdict on I-167 and I-163 stands untouched. Quick method, judged against I-168's Proof Needed and the owner's "Strategic fix first" rule.

**Independence.** This session did not plan, build or repair this work. It wrote a temporary probe test (deleted after the run; output in the session scratchpad), this record and I-169. It did not repair code, commit, push, edit the router, or read or touch `docs/prds/` or `docs/research/`.

**Verdict: NEEDS WORK.** I-168's literal Proof Needed holds for sky figure ids, but the repair states a parity it does not deliver: `setCamera` and story panel cameras also take an object id as the direction, the opening `lookOut` (now typed `SkyDirection | string`) refuses one, and the CHANGELOG and `lookOut` doc comment say "the same forms as `setCamera`" (API-07). The parity test lists today's forms rather than enforcing parity, so it would not catch this. That is the same trap I-168 named, left open for the third form, and the direction rule now lives in two places (`cameraRequestOf` for `setCamera`/panels; `SceneCamera.lookOut` + `checkLookToward` for the opening): the strategic fix is one rule for all entries. Recorded as I-169. I-168 stays open (a `verified` closure needs a `CLEAR` Check); its figure-id proof below can be reused when I-169's repair is checked.

## I-168 Proof Needed

| Probe | Expected | Actual |
|---|---|---|
| `tests/lookOutDirectionForms.test.ts` (lookOut with figure added before and after, story panel camera, `setCamera`: position and figure id accepted, unknown id refused naming it, half position refused; `setStartView` numbers only; source scan; `openingViewOf` label point; last opening call wins) | pass | 16/16 pass |
| Probe: `lookOut("earth", { direction: "ghost" })` with no figures, then build | `bad-camera` naming it at build | `bad-camera camera.lookOut: direction "ghost" is not a sky figure of the scene (none added); ...` |
| Probe: same, the call alone | accepted at the call (figures may come later) | accepted |
| Probe: `direction: 42`, `""`, `null` look, unknown key, `fovDeg: 200`, unknown body `mars` | `bad-camera` / `unknown-body` at the call | as expected, each naming the cause |
| Probe: figure id then `setStartView` / `follow` | `startToward` cleared | cleared |
| Probe: figure id, `fovDeg: 50`, definition | `startView` sky pose + `startToward: "kite"` | `{ lookOut: earth, raDeg: 0, decDeg: 0, fovDeg: 50 }`, `startToward: kite` |
| Opening view resolution | viewer turns toward the label point; `handle.camera` and share link read numbers | `openingViewOf` used for both `openingCamera` (what `handle.camera` reads before the first frame) and `initialSceneControls`; `?view=` still wins. Star-end figures: layers are filled by `prepare` before the viewer draws, so the label point is known at mount. |
| Real browser, figure-id opening | turns toward the figure | not exercised by `check:browser` (hello-sky opens with a position); the coordinator's packed-consumer run (`lookOut("earth", { direction: "Leo" })`, ra 157.46, dec 19.48, no errors) is reported, not reproduced here; the value is plausible for Leo |

Result for figure ids: **proven** (unit level plus reported browser run).

## Questions weighed

- **Parity.** Probe: `lookOut("earth", { direction: "moon" })` throws `bad-camera` at build; a story panel `camera: { lookOut: "earth", direction: "moon" }` builds; `setCamera` resolves a string direction to a body or figure (`app/sceneCamera.ts` `lookDirectionOf`; `LookOutTarget.direction` doc: "the id of an object or sky figure"). A newcomer copying a working `setCamera` call into the opening hits it. The error is clear, but the type accepts it and the docs claim parity. I-169.
- **Does the test enforce parity?** No. Each row is fed a position and a figure id; the scan checks only that a declared `direction` type contains `string`. A form one entry takes and another refuses at run time passes. I-169 asks for one shared form list driven through every entry.
- **Public surface (API-01, API-04).** `lookOut`'s `direction` widened to `SkyDirection | string` matches `LookOutTarget`; the lock is updated; the CHANGELOG covers the widening. The new public getter `SceneCamera.lookToward` is in the lock but not the CHANGELOG, and `scene.camera.pose` after a figure-id `lookOut` reads a placeholder ra 0, dec 0. Folded into I-169.
- **`openingViewOf` vs `skyViewOf`.** Both convert an EQJ unit vector to ra/dec with the same `round2` and wrap; a shared helper would hold the rounding rule once. STYLE-07 observation, not an Issue.
- **Errors.** Unknown figure id: `bad-camera` naming it, before or after `addSkyFigures` (tests and probe). Holds.

## Gates

All run fresh in this session on the working tree:

| Gate | Result |
|---|---|
| `git diff --check` | pass |
| `npm run lint` | pass (3.7 s) |
| `npm run typecheck` | pass (9 s) |
| `npm run build` | pass (2.3 s) |
| `npm test` | pass (43.8 s) |
| `npm run check:engine-alone` | pass (24.2 s) |
| `npm run check:pack` | pass (14.7 s) |
| `npm run check:node-consumer` | pass (5 s) |
| `npm run check:browser` | pass, total 308 s (limit 320 s), 12 steps exit 0, error-lines 0; evidence `docs/evidence/browser-20261110T224037Z` |

## Materiality

- I-169 (medium, API-07/API-01): the opening look-out refuses an object id that `setCamera` and story panels take; parity claimed in CHANGELOG/doc comment and test header but not enforced. Blocks `CLEAR` for this repair: the repair's own public words are inaccurate (API-07 is Required). Remediation: a direct repair under I-169 (one direction rule for every entry, or an owner decision that an opening cannot turn toward an object, stated in docs and types), then a new Check covering I-168 and I-169.

## Owner decision

Whether an opening look-out should turn toward a body (as `setCamera` does) or the docs should say it takes positions and figure ids only. The strategic rule points to the first.

## Observations (non-blocking)

- `check:browser` total 308 s against 320 s, close to the warning line (owner's preview on 5490 running alongside), as in C-168.
- No browser step opens with a figure id; the hello-sky example opens with `{ raDeg: 83.7, decDeg: 0 }`.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches** — figure before/after, unknown id, empty id, last call wins are tested.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — look-out direction rules split between `cameraRequestOf` and `SceneCamera.lookOut`/`checkLookToward`; ra/dec rounding repeated in `openingViewOf` and `skyViewOf`.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs** — 9 files, +58 / -15, plus one test.
