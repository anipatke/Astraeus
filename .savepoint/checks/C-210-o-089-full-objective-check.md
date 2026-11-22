---
id: C-210
scope: {kind: objective, id: O-089}
result: CLEAR
checked_by: {role: checker, session: check-o089-20261122}
executed_session: orchestrate-g024-20261121 / orchestrate-g024-20261122 (T-418..T-421 builders, coordinator)
checked_at: '2026-11-22T03:49:38Z'
health_snapshot: sha256:602a54fe6a42fb042f67c1ea27ae207ddeb0eacefe9740a3e4d26c71e7c19561
reviewed:
  base_commit: fcde39b5
  head_commit: 1f7bb85c
  files: [packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/DeveloperDrawer.tsx, packages/astraeus/src/app/developerPanels.tsx, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/shell/selection/selection.ts, packages/astraeus/tests/developerDrawerFolds.test.ts, packages/astraeus/tests/selectionOwner.test.ts, packages/astraeus/tests/selectionStore.test.ts, packages/astraeus/tests/domSetup.ts, packages/astraeus/tests/experiencePlugInContract.test.ts, packages/astraeus/tests/listedOrbitGroup.test.ts, packages/astraeus/tests/syntheticRing.test.ts, packages/astraeus-demo-apollo11/tests/pointsLayer.test.ts, packages/astraeus/tests/firstOpenGraph.test.ts, packages/astraeus/tests/interfaceHeaders.test.ts, tools/owner-preview.mjs, package.json, docs/architecture/viewer-interface.md, docs/agents/browser-policy.md, .savepoint/Design.md]
  dependencies: []
issues: []
supersedes: null
---

# C-210: O-089 Full Objective Check

Fresh session; it did not plan, build or repair any O-089 work or I-201. Diff `fcde39b5..1f7bb85c` (`main` = `fcde39b5`). T-418..T-421 are `done`, each with an owner `check_waiver`. T-422 (owner look, `owner_validation.required`) is `in_progress`/`audit` with the owner's answer recorded. I-201 (direct repair on this branch) is verified here. I-200 is a pre-existing backlog defect, out of scope.

**Result: CLEAR.** The developer drawer is one on-demand component (`App.tsx` 1,574 -> 1,174 lines; first open 9,723 B raw smaller). The selection has one per-viewer owner (`shell/selection/selection.ts`), read with `useSyncExternalStore`. The serial `selectRequest`, `onSelectRequestApplied`, `onSelectionChange`, the shell's selection state, `App`'s written copy and the effect-order comment are gone. Behaviour is unchanged: this session re-ran both characterisation tables on the base in a scratch worktree and they pass there (60/60). Every gate is green, and the pattern is written down. No Issues.

## Scope lock

1. Criteria: the Objective's 4 success conditions and Decisions (engine size budget, own-enumerable getter, test-wiring-only rule), the Done When of T-418..T-421, T-422's owner answer, and I-201's Proof Needed. Guardrails: API-02, API-03, ARCH-02, ARCH-03 (deep-import count), TEST-01, TEST-02, TEST-03, TEST-04, CODE-01, STYLE (advisory). Gates: `quality_gates`, the full gate, the `docs/agents/build.md` gates, the browser tier from the policy, and Code Health.
2. Changed files: `reviewed.files`. Entry points: `mount` and React `AstraeusScene` (both embedding paths), `ViewerHandle.setSelected`/`onSelect`/`read()`, story-panel select, the shell's choose paths, the Developer drawer, and `npm run preview:owner`.
3. Relied-on runtime: `controlsChanged` `for…in` (`sceneFrame.ts:622`), the static-markup render of the shell, the dynamic-import boundary (`firstOpenGraph`), and the packed first-open chunk measurement.
4. Matrix below. Not applicable: text classes, serialisation and output sinks (no text or format surface changed).
5. Admission: reproducible through a supported path, inside the T-418..T-422 / I-201 scope, and with a credible consequence.

## Coverage matrix

| # | Criterion / cell | Result | Evidence (this session) |
|---|---|---|---|
| 1 | SC1: drawer in its own component, `App` shorter by that amount | Proven | `DeveloperDrawer.tsx` (504 lines) holds the header, eight folds, `ViewLinkGroup`, the readout hook and `copyViewLink`. `developerPanels.tsx` is a single `lazy(() => import("./DeveloperDrawer"))`. `wc -l App.tsx` is 1,574 at the base and 1,174 now. `firstOpenGraph` (8) passes: the drawer is not in the first-open graph and is reached only through a dynamic import. |
| 2 | Drawer behaviour unchanged (folds, order, default fold, test ids, copy button, one control per fold reaches the controls, frame stats stop on close) | Proven | `developerDrawerFolds.test.ts` (30) passes on head. **Independently re-run on base `fcde39b5`** in a scratch `git worktree` (since removed), the same file unchanged: 30/30 pass. The table pins the same behaviour before and after the move. |
| 3 | SC2: one owner outside React state, read through `useSyncExternalStore`; serial prop and mirror gone | Proven | `AstraeusShell.tsx` reads `useSyncExternalStore(selection.subscribe, selection.snapshot, selection.snapshot)`. Every `setSelectedObjectId`/`onSelectionChange` pair is now `selection.choose`. The three props, `hostSelect`, `selectWith`, `hostSelectApplied`, `updateSelectedObject` and the request effect are gone (grep). There is no writer of `selectedObjectId` left in `packages`/`tools` (grep), and `readonly` in `SceneControls` enforces it. |
| 4 | Store contract (node): notify/move split, snapshot identity, order rule, host-cleared flag, independence | Proven | `selectionStore.test.ts` (16). My own probes, not in the suite: three rapid asks (last wins, one pending, last `quiet`); `choose` ignored until `takeAsk`; clear -> `choose("")` keeps the flag, a real id clears it; re-entrancy (a mover that asks, a subscriber that unsubscribes during notify); reads never notify; a frozen, stable snapshot; a no-op `choose` of the same id. All 4 probes pass. |
| 5 | Host-call order (host `setSelected` is the last word over the fallback and the view rule) | Proven | `applyAskedCard(selection.takeAsk(), …)` runs last in the one view-switch effect, whose deps include the ask object. `hostCallOrder.test.ts` (26) and `setSelected.test.ts` (29: before the first frame, inside a view switch's `onChange`) pass, and neither file changed in the diff. Read against the base `updateSelectedObject`: the semantics are equivalent (ignore the shell while an ask waits; publish only on a real change while attached). |
| 6 | Own-enumerable `selectedObjectId` getter (O-087 draw rule) | Proven | An object-literal `get` in `initialSceneControls` (`App.tsx:334`). `selectionOwner.test.ts` "the scene's read of the selection" (both paths): `Object.keys` and `for…in` include it, and it follows a host `setSelected` made while paused. My probe: the descriptor is `enumerable`, and a spread copy carries the live value. `controlsChanged` compares `live[key]` per `for…in` key, so a change is seen. `pausedRenders.test.ts` (6) passes. |
| 7 | Selection paths unchanged on both mounts (menu, pick, phone pick, keepSky, sky figure, Go to, view drops, framing rule, story select wide/phone, host id/same/clear) | Proven | `selectionOwner.test.ts` (31) passes on head. **Independently re-run on base** (the table and getter rows; the one external-store case needs `createSelection`, so it was dropped for the base run): 30/30 pass. The external-store case passes on head. |
| 8 | SC3: `lifecycle`, `twoViewers`, `hostCallOrder`, phone and shell DOM tests green on both mounts | Proven | `test:full` 328 files, 5424 passed, 2 skipped. Includes `lifecycle` (73, both drivers), `twoViewers` (101), `hostCallOrder` (26), `domPhone` (23), `domShell` (13), `selectionCauseDom`, `skyFigureSelect`, `publicApiOpeningSelection`, `domStorySteps`. |
| 9 | Five test-wiring files change only the props handed to `AstraeusShell` | Proven, with one observation | Diff read. `domSetup.ts`: store creation (opening on `initialObjectId`, as the shell did), `selectRequest` -> `ask` before the first render, a new optional `MountOptions.selection`, and the probe reads `selection.id()`. The four static-markup files each change `onSelectionChange: noop` -> `selection: createSelection("")`, plus one import. No assertion or fixture changed. See observation 1: `""` renders with no selection where the shell used to open on its first object. The Task text explicitly allowed `createSelection("")`. |
| 10 | ARCH-03 deep-import count may only go down | Proven | `packageBoundaries.test.ts` (8) passes. `pointsLayer.test.ts` imports `createSelection` from the existing `astraeus/shell/AstraeusShell` line (re-export), not a new deep path. |
| 11 | API-02 / public API unchanged | Proven | `apiSurface.test.ts` (10) passes. There is no change to `api/`, the README, `api-surface.lock.json` or `packages/astraeus/package.json`. `AstraeusShell` is internal. |
| 12 | API-03 per-viewer state | Proven | `createSelection` keeps no module state. `useMemo(…, [runtime])` per viewer. `twoViewers` green. A rebuild in `AstraeusScene` unmounts `App` (`setDefinition(undefined)`), so the controls object and the store are always made together (see observation 3). |
| 13 | Engine size: T-418 lowers first open; T-420 adds at most 500 B; under 1,838,000 B raw | Proven | `check:pack`: 1,826,428 B raw / 523,400 B gzip (limits 1,838,000 / 527,000). `measure:example`: first-open total 1,826,428 raw; `DeveloperDrawer` chunk 24,898 B on demand. The C-208 base was 1,836,426, so headroom is now 11,572 B raw. |
| 14 | CODE-01 complexity | Proven | `npm run lint` is clean. The card rule is pulled out as `applyAskedCard`, and the limit was not raised. |
| 15 | SC4: slice pattern in `viewer-interface.md` | Proven | The new subsection has 8 steps. I checked them against the code (factory, `useMemo` per runtime, the three-argument `useSyncExternalStore`, ask/`takeAsk` last in the effect, the getter, `onMove` publish, the tests, size). The tree and the "not done in O-079" sentence are corrected. |
| 16 | Design reconciliation with the T-418..T-420 drift notes | Proven | `Design.md` Host calls land in order (now through `selection.ask`), Viewer interface (Selection bullet), Good guest (3) (`DeveloperDrawer.tsx`). The T-421 evidence accounts for every drift note. `initialObjectIdOf` is recorded as non-architectural (dead in `src`, still tested). |
| 17 | T-422 owner look | Owner answer recorded | The owner said "check steps look good otherwise" (2026-11-22T03:42:37Z). The one difference, Focus after Overview, was reproduced identically on `fcde39b5` by the coordinator and logged as I-200 by owner choice. It is out of scope and was not re-verified here. |
| 18 | I-201 Proof Needed | Proven (verified) | See below. |

**Browser tier.** The policy requires the **full** tier because the diff touches `packages/astraeus/src/shell/`. It already ran once, green, on `4727f062`: `docs/evidence/browser-20261122T032627Z/`, 12 steps, all exit 0, error-lines 0, 310 s (limit 450). `git diff --stat 4727f062..HEAD` shows only `.savepoint` records, `Design.md`, `viewer-interface.md`, `browser-policy.md`, one `package.json` script (`preview:owner`) and `tools/owner-preview.mjs`. Nothing in `packages/` changed, and the runner does not reference `owner-preview` (grep). The run is reused under "never run it twice for one change".

**External boundary (I-201 tool).** Configured target = actual target (`--port 5490 --strictPort`). Startup and reuse: the pid file and SIGTERM stop the earlier supervisor, which kills its child. A port held by a foreign server fails with a clear message and exit 1 (read). Restart on a HEAD or branch change uses `--force`. A git error mid-operation skips the tick. Timeout, redirect and secrets: not applicable (a local dev server, no credentials).

## I-201 verification

Proof Needed: one command; running it twice leaves one server; a branch or commit switch restarts it with a fresh cache and the page loads afterwards; the browser policy rule exists.

- Code read: `tools/owner-preview.mjs` meets each clause. The policy bullet is present in `docs/agents/browser-policy.md`.
- Independent run, git-state-neutral: I copied the tool unchanged except for port 5591 and the pid-file name into a scratch git repo, with a stand-in `vite` that serves its pid and whether `--force` was passed. Results:
  - First start: served.
  - Second start: "stopped the earlier preview", and one server was left (the new pid).
  - An empty commit: "the checkout changed … restarting", a new server with `force=true`.
  - A branch switch: restarted again.
  - SIGTERM to the supervisor: the child stopped and the pid file was removed.
- The owner's live preview (supervisor pid 1769728, vite 1777192) was never touched. It answers `200` on `http://localhost:5490/app.html` at the end of this Check.

Resolved as `verified` by this Check.

## Gates (this session, head 1f7bb85c, 2026-11-22T03:44:21Z..03:46:43Z)

| Gate | Result |
|---|---|
| `npm run typecheck` | pass (7 s) |
| `npm run lint` (ESLint + Prettier) | pass (10 s) |
| `npm run build` | pass (3 s) |
| `npm run test:full` | 328 files, 5424 passed, 2 skipped; coverage 93.47% statements / 90.01% branches; 50 s |
| `npm run check:engine-alone` | typecheck, lint and test pass; 32.2 s |
| `npm run check:pack` | pass; engine 1,826,428 B raw / 523,400 B gzip; 24 s |
| `npm run check:node-consumer` | 12 passed |
| `npm run measure:example` | first-open 1,826,428 B raw / 523,400 B gzip |
| `npm run check:public-build` | pass; `docs/evidence/public-build-20261122T034639Z` |
| `git diff --check fcde39b5..HEAD` | clean |
| Browser, full tier | reused: `docs/evidence/browser-20261122T032627Z/` (above) |
| `savepoint health check O-089` | snapshot above (created): "Code Health does not block clearance". Complexity, duplication and vulnerabilities: no finding. Coverage and tests instances say "stale". They are optional, and this is a collection statement, not a finding (as in C-205..C-208). |

## Materiality

No Issues; no materiality actions are required.

## Observations (non-blocking)

1. The four static-markup tests (`experiencePlugInContract`, `listedOrbitGroup`, `syntheticRing`, apollo11 `pointsLayer`) hand `createSelection("")`. Before, the shell opened on `initialObjectId(...)`. My probe rendered the synthetic shell both ways. The `""` markup lacks the selected object's `selected` option, its "Information about …" label, its Focus button and its bar ghosts, so those tests' negative "no mission names" scans read about 640 fewer characters. All their assertions still hold. The Task allowed `""`. `createSelection(initialObjectId(definition.experience, clock time))`, as `domSetup.ts` does, would restore the old render if wanted.
2. `owner-preview.mjs`: if two checkout changes were seen on successive 2 s polls before the old vite exited, `restartServer` would register two `startServer`s. The second would fail on `--strictPort` and shut the supervisor down, leaving one orphan server. This is unlikely, since vite exits quickly on SIGTERM. A SIGKILL to the supervisor also orphans vite. POSIX-only, as the repair notes say.
3. `App` keeps `controls` in a `useRef` built once, and the store is in `useMemo([runtime])`. If `runtime` changed inside one mounted `App`, the getter would read the first store. Today that cannot happen: `AstraeusScene` unmounts `App` on a rebuild, and `mount` builds once. The T-420 limitation records it.
4. The `act(...)` warnings on stderr in `selectionOwner.test.ts` follow the existing `setSelected.test.ts` pattern (166 such lines across the suite).
5. T-421's figures say the shell has 44 props, where its Task text expected "46 … now". 44 is right (3 removed, 1 added). `viewer-interface.md` has a double blank line before the new subsection (docs are not Prettier-formatted).

## Owner validation still needed

- T-422 declares `owner_validation.required`. The owner's answer is recorded. Owner acceptance (`owner_validation: {required: true, accepted_check: C-210, …}`) and `status: done` are the owner's to record.
- Then the Objective can close: every Task done, this Check current, and no open material Issue linked to it (I-201 is resolved; I-200 is backlog, not linked to this Check).

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock (`owner-preview.mjs`: stop earlier -> wait -> pid file -> start -> poll -> restart; each step exercised in the scratch run)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; not evaluated)
- [x] Perform The Adversarial Pass (re-entrancy, rapid asks, paused draw, rebuild, spread copy, base re-run of both tables)
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality (every file named in the T-418..T-421 evidence and I-201 exists; T-421's 17 named paths present)
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Code Style Review

- [x] STYLE-01 **One job per file** (`DeveloperDrawer.tsx` and `selection.ts` each have one job, stated in a header)
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent** (`readonly selectedObjectId`, `Selection` interface)
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** (the selection now has one owner; `SelectionOrigin` defined once and re-exported)
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs** (most added lines are tests and Task records; `App` net -400)
