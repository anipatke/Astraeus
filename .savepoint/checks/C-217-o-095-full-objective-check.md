---
id: C-217
scope: {kind: objective, id: O-095}
result: CLEAR
checked_by: {role: checker, session: check-o095-20261124}
executed_session: orchestrate-o095-20261124 (T-441..T-443 builders, coordinator)
checked_at: '2026-11-24T06:13:40Z'
health_snapshot: sha256:ccf035ea376d27721f56ff53ebf61f6396d91a78a0fe1c1c5eef5a0d1bf6919f
reviewed:
  base_commit: 1831066f
  head_commit: 908ccd8c
  files: [packages/astraeus/src/app/scenePicking.ts, packages/astraeus/src/shelf/actions/View.tsx, packages/astraeus/src/shelf/actions/factory.ts, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/shell/panels/panelRule.ts, packages/astraeus/src/shell/panels/usePanels.ts, packages/astraeus/tests/actionsEnabled.test.ts, packages/astraeus/tests/panelRule.test.ts, packages/astraeus/tests/scenePicking.test.ts, packages/astraeus/api-surface.lock.json, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus-site/tools/validate/browser-steps.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/journey-catalogue.mjs, docs/BROWSER_CHECKS.md, docs/architecture/viewer-interface.md, .savepoint/Design.md]
  dependencies: []
issues: []
supersedes: null
---

# C-217: O-095 Full Objective Check

Fresh session; it did not plan, build, coordinate or repair O-095. Diff `git diff main...o095-group-labels-and-phone-sheet` (`1831066f..908ccd8c`, 23 files). T-441, T-442 and T-443 are `done` with owner `check_waiver`s ("Orchestrate O-95"); this Check covers all three. The uncommitted T-388 (O-086) change and untracked `docs/evidence/*`, `docs/research` are outside this scope.

**Result: CLEAR.** Every Success Condition is proven, every gate passes, the one full-tier browser run passed all 14 steps, and Code Health does not block. No Issues opened. T-441 and T-442 declare `owner_validation.required`; the owner's look ("Both work, carry on", 2026-11-24T06:02Z at 59ce7681) is recorded in each Task's body, and their acceptance fields are for the coordinator to fill against this Check (not written here). The code reviewed for the owner's look (59ce7681) and HEAD (908ccd8c) differ only in Design/doc/Task text, so the look covers the code checked.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (browser runner only: its own dev server ports 5479+ and a scratch public build; the owner's :5490 untouched; no network-change or console errors, error-lines=0 in every step)
- [x] Workflow And Side-Effect Check Lock (n/a: pure picking, a pure reducer and a per-viewer cell write; no persistence, transactions or artifacts)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (n/a: not a feature of this scope)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (n/a: initial Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. O-095 Success Conditions SC1..SC7 in Objective order: SC1 group-label tap selects through the existing path (wide card, phone select); SC2 body labels unchanged; SC3 drag from a label orbits, only a press within `MOUSE_TAP_SLOP_PX`/`TOUCH_TAP_SLOP_PX` selects; SC4 labels out of tab order, README says so; SC5 phone + camera-turning actions button closes the open panel/sheet before the move, no-camera button leaves it, wide unchanged; SC6 `setEnabled` disable/restore, `disabled`, unknown id / non-boolean throws `bad-part` naming it; README, API lock, CHANGELOG; SC7 failing-before test per behaviour and browser checks for tap, drag, sheet closing. Task Done When lists of T-441..T-443. Guardrails ARCH-02, ARCH-03, API-01..05, API-07, TEST-01..04, CODE-01, CODE-02. Gates: `quality_gates`, `git diff --check`, `check:pack`, `check:node-consumer`, `measure:example`, health check, one browser command.
2. Entry points: `pickCandidatesOf`/`pickTarget`/`hoverTarget` (via `sceneFrame` and `scenePointer.onTap` -> `onPickObject` -> shell `pickObject`); `reducePanels` `cameraTurned`, `usePanels.cameraTurned`, the `AstraeusShell` `panelRuntime` wrap feeding `useShelfPanels`/`useShelfTile`; `actions()` descriptor `control.setEnabled`, `ActionsView`.
3. Relied-on: `SceneLabels.shownRects` (labels never overlap each other, `overlapsWithPadding`), `availableObjectById`, `viewerParts` link `cell` lifecycle check, `controls.css` `button:disabled`.
4. Out of scope: dots inside a group, label keyboard focus, an opt-out for sheet closing, a note under a button, restyling, story panels' own camera.
5. Admission: a reproducible break of SC1..SC7 or a named Guardrail through a supported host or visitor path.

## Coverage matrix

Independent probe: a temporary `packages/astraeus/tests/zzCheckC217Probe.test.ts` (13 cases, all pass, removed afterwards, tree verified clean), plus a mutation run (main's `scenePicking.ts` and `actions/factory.ts` restored temporarily, then `git checkout HEAD` back): the new `scenePicking` case and both `actionsEnabled` cases fail on main (3 failed, 25 passed), so each is failing-before.

| Row | Cells | Result |
|---|---|---|
| SC1 picking | group label (non-body, shown rect) -> label-only candidate, radius 0; spacecraft label same; non-body with no shown rect -> no candidate; label edge exact (x=300) hits, 1 px outside misses; just below the rect misses (no tolerance growth for labels); mouse hover over the group label brightens, touch never hovers | Pass |
| SC1 selection path | `onTap` -> `onPickObject(id)` -> `pickObject` -> `availableObjectById` -> `activatePreset` + `pickOpensInfo(phone)` (code read, no new selection code, ARCH-02); browser: desktop `tapSelected dust-belt, cardOpened true`, phone `tapSelected dust-belt, cardOpened false` | Pass |
| SC2 body labels | existing `scenePicking.test.ts` cases unchanged and passing; probe: body disc centre and body label still pick the body; body drawn `as: none` keeps its label-only target; labels cannot overlap each other (`SceneLabels` padding), so a group name never shadows a body name | Pass |
| SC3 drag vs tap | `TapTracker` unchanged; probe at exact slop (tap) and slop + 0.5 px (drag) for mouse and touch from a label point; browser: drag from the group label moved the other names, selection unchanged, no card, at both sizes | Pass |
| SC4 tab order | label spans are `aria-hidden`, no tabindex (`shell/Label.ts`); README line under "Bodies and paths" | Pass |
| SC5 panel rule | phone: left = about, card, moons, tile, `shelf:x` each closes, story/popup kept; phone developer-only state unchanged (identity); wide: identity for every left; dispatched before `moveCamera` in the wrap; disabled button returns before `moveCamera`, so no close; browser `catalogue`: no-camera "wide" keeps panel, "lantern" closes it on phone, keeps it on desktop | Pass |
| SC6 setEnabled | off/on; off twice then on once restores (no duplicate ids); on when already on is a no-op; two viewers of one block descriptor keep separate state (API-03); disabled button cannot take focus and a dispatched click neither moves nor reports; refusals: `""`, `null`, `7`, case-mismatched `"A"`, `"nope"` -> `bad-part` naming `actionId`; `0`, `1`, `null`, `"true"`, `undefined`, `"no"` -> `bad-part` naming `enabled`; state unchanged after refusals; API lock entry `setEnabled(actionId: string, enabled: boolean): void`; CHANGELOG 0.11.0 Added + Breaking "None" | Pass |
| SC7 tests and browser | failing-before proven by the mutation run (picking, setEnabled) and by the absent `cameraTurned` action (panelRule cases cannot type-check on main); browser checks pass at the project's standard sizes 1280x720 / 375x667 (see observations) | Pass |

## Adversarial pass

- Bypass: a sky figure id reaching `pickTarget` through the object path still lands in `pickObject`'s `skyFigureById` branch first, so selection is the same either way. A listed object outside its time window has no shown label, and `pickObject` ignores it if reached.
- Every non-body listed object with a shown name (spacecraft, comet, path) is now a tap target. That follows the Objective's stated general rule ("any listed object with a shown label") and Design.md now says so; the shell already accepts these ids.
- The wrap only replaces `moveCamera` when the host runtime has one, and it is memoised on `[shelfRuntime, cameraTurned]` (`cameraTurned` is a stable `useCallback`), so the shelf panels do not rebuild each render.

## Gates (this session, branch at 908ccd8c, uncommitted T-388 change outside scope)

| Gate | Start (UTC) | Result | Time |
|---|---|---|---|
| `git diff --check main...HEAD` | 06:03Z | clean | - |
| `npm run typecheck` | 2026-11-24T06:03:44Z | pass | 7 s |
| `npm run lint` | 06:03:51Z | pass | 7 s |
| `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` | 06:03:59Z | 341 files, 5524 passed, 2 skipped | 39 s |
| `npm run build` | 06:04:38Z | pass | 6 s |
| `npm run check:pack` | 06:04:44Z | pass (engine 1,832,711 B raw / 525,589 B gzip, limits 1,838,000 / 527,000) | 21 s |
| `npm run check:node-consumer` | 06:05:05Z | pass, 12 tests | 7 s |
| `npm run measure:example` | 06:05:12Z | pass, first-open 1,832,711 B raw / 525,589 B gzip | 7 s |
| `npm test` (rerun after the mutation probe touched source mtimes, so the health junit is current) | 06:06:15Z | 341 files, 5524 passed, 2 skipped | 38 s |
| `savepoint health check O-095` | 06:06:53Z | snapshot `sha256:ccf035ea…f6919f`, "does not block clearance" | - |
| `npm run check:browser` (full tier, once) | 06:07:08Z-06:13:26Z | exit 0, 14/14 steps, error-lines 0, total 377 s / limit 450 s; evidence `docs/evidence/browser-20261124T060708Z` | 377 s |

`npm test` is the Full Objective Check test gate per `docs/agents/verification.md` and `docs/agents/build.md` (O-094 T-424, owner tick P04); `test:full` (coverage) is for release or the owner's ask, so it was not run. The full browser tier is a superset of what the browser policy requires for this diff (quick + `look-out` for `src/shell/`, `synthetic-journey` and `orbit-lines` for `browser-smoke.mjs`/`shell/panels/`, `catalogue` for `src/shelf/` and `journey-catalogue.mjs`, the packed examples for the API lock change); the coordinator asked for the full tier and it ran once.

Browser step times: smoke 47 s/65, orbit-lines 57 s/60, synthetic-journey 72 s/115, smoke-public-showers 6/15, planets-phone 9/20, meteor-shower 19/30, views 18/30, look-out 72/100, two-viewers 9/15, catalogue 7/10, hello-scene 13/25, hello-react 3/10, hello-planets 4/15, hello-sky 22/35. `orbit-lines` `groupLabel`: desktop `{dragMovedCamera: true, tapSelected: dust-belt, cardOpened: true}` (load 30.4 s), phone `{… cardOpened: false}` (26 s).

## Code Health

Snapshot `sha256:ccf035ea376d27721f56ff53ebf61f6396d91a78a0fe1c1c5eef5a0d1bf6919f` (official, created): does not block clearance. Complexity, duplication, dependency vulnerabilities, tests: no finding. Coverage: stale (expected; `test:full` not run at an Objective Check). An earlier snapshot `sha256:7feb2129…` in this session also reported tests stale because the mutation probe had just rewritten two source files' mtimes; it is superseded by the recorded one after a fresh `npm test`, not used as evidence.

## File reality

Every file named in the three Tasks' evidence and drift notes exists at HEAD. T-442's planned `App.tsx` was not changed (the wrap is in `shell/AstraeusShell.tsx`, recorded in its evidence); T-443's planned `shelfParts.test.ts` was replaced by the new `actionsEnabled.test.ts` (happy-dom), recorded with its reason. No phantom files.

## Design reconciliation

T-441 drift (label of any listed object is a tap target), T-442 drift (shell wraps `moveCamera`, `cameraTurned`) and T-443 drift (`ActionsControl.setEnabled` in viewer-interface section 11 and the parts table) are each reflected: `.savepoint/Design.md` Viewer interface paragraph, `docs/architecture/viewer-interface.md` close table row, control list and actions row (908ccd8c).

## Guardrails

ARCH-02 (picker hands an id to the selection module; the rule reads panel state only), ARCH-03 (made-up belt, made-up catalogue scene, synthetic picking frames), API-01 (lock + CHANGELOG same change), API-02 (control comes from the descriptor, same on both paths), API-03 (per-viewer cell; probe), API-04/05 (typed, early `bad-part` `SceneError`), API-07 (README has no ActionsControl table to sync), TEST-01..03 (named cases above), TEST-04 (waivers on all three Tasks), CODE-01 (lint pass), CODE-02 (no new per-frame stage; `pickCandidatesOf` already a stage): satisfied.

## Issues

None. No materiality actions are required.

## Observations (non-blocking)

1. `orbit-lines` ran 57 s against its 60 s limit (the builder's proof run was 56 s). The group-label check added to it leaves about 3 s of room; a slower host will print the WARNING line. Consider giving the group-label check its own slot or revisiting the limit with a measured reason.
2. The group-label browser check lives in a full-tier step, so a later Full Objective Check that does not touch `browser-smoke.mjs` or orbit-line paths will not exercise it; the fast suite holds the picking rule.
3. The Objective named 1440x900 / 390x844; the steps run at the project's standard 1280x720 / 375x667. Both pairs sit in the same wide/phone layout classes the behaviour depends on, so this is not a gap in proof.
4. The `AstraeusShell` `moveCamera` wrap has no unit test; it is proven only by the `catalogue` browser step.
5. The engine's first-open gzip is 525,589 B against a 527,000 B limit (about 1.4 KB left).
6. The existing `scenePicking.test.ts` case name "…a tracked non-catalogue subject or orbit line not" still passes (its fixture has no label rects for them), but under the new rule such a subject's shown name is a target; the name now reads narrower than the behaviour.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — `driver.mjs` `dragFromLabel` repeats `labelCentre`'s rect evaluation inline instead of calling it.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
