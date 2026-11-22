---
id: T-420
title: Shell and viewer share one selection
objective: O-089
status: done
depends_on: [{task: T-418, requires: clear}, {task: T-419, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-420, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T03:09:26Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: selection
planned_reads: [packages/astraeus/src/shell/selection/selection.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/experienceDefinition.ts, packages/astraeus/src/api/viewerSelection.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus/src/shell/ObjectControls.tsx, packages/astraeus/tests/setSelected.test.ts, packages/astraeus/tests/hostCallOrder.test.ts, packages/astraeus/tests/selectionCauseDom.test.ts, packages/astraeus/tests/domStorySteps.test.ts, packages/astraeus/tests/publicApiOpeningSelection.test.ts, packages/astraeus/tests/viewCameraDom.test.ts, packages/astraeus/tests/pausedRenders.test.ts]
planned_writes: [packages/astraeus/src/app/App.tsx, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/tests/domSetup.ts, packages/astraeus/tests/experiencePlugInContract.test.ts, packages/astraeus/tests/listedOrbitGroup.test.ts, packages/astraeus/tests/syntheticRing.test.ts, packages/astraeus-demo-apollo11/tests/pointsLayer.test.ts, packages/astraeus/tests/selectionOwner.test.ts]
---

# Shell and viewer share one selection

## Outcome

The selected object has one owner per viewer, the store from draft 02, created by `App` and handed to the shell. The shell reads it with `useSyncExternalStore`, the scene reads it every frame and the host link reads it through `read()`. Gone: the shell's `selectedObjectId` state, `App`'s written copy in `controls.selectedObjectId`, the `hostSelect` ref, the serial `selectRequest` prop and its `onSelectRequestApplied` and `onSelectionChange` props, and the comment that relies on effect order. Behaviour on both embedding paths is unchanged.

## User Check

None visual in this Task (draft 05 is the owner's look). Choosing an object from the menu, tapping one in the scene, a story step that selects, a host `setSelected` and a view switch that drops the object all behave as before.

## Done When

- `App` creates one store per viewer and per scene (it resets when `runtime` resets, never module-level). Its start is the id the shell opens on today: `initialObjectId(shellExperience, clock time)` from `AstraeusShell.tsx` ~58, not `initialObjectIdOf(definition)` (`App.tsx` ~365).
- `SceneControls.selectedObjectId` becomes a read-through getter of the store (`readonly` in the type, `AstraeusScene.tsx` ~184), so no copy is written and the existing readers stay as they are: `sceneFrame.ts` ~349, ~360, ~480 and the tests that read `controls().selectedObjectId` (`appScreenDom`, `viewCameraDom`). Test helpers that build their own controls with a plain value (`helpers/frameContext.ts`, `cameraChoices`, `skyTrace`) still type-check.
- The getter is an own enumerable property of the controls object (an object-literal `get`, not a prototype or `Object.defineProperty` default). O-087's draw rule finds a changed control by walking the controls with `for…in` (`controlsChanged`, `sceneFrame.ts` ~622-634), and `appScreenDom.test.ts` ~109-115 reads the controls with `toMatchObject`; a hidden getter would leave a paused scene undrawn after a selection change. A row in `selectionOwner.test.ts` (below) proves it: `Object.keys(controls())` includes `selectedObjectId` and its value follows a host `setSelected` made while the clock is paused (`controlsChanged` is private; this is the property it relies on).
- `App`:
  - `hostSetSelected` (~717) and a story panel's `select` (`markOpenPanel` ~863, the call ~882) call `selection.ask(id ?? "", quiet)`.
  - `stateNow` reads `selection.id()`.
  - One `selection.onMove` listener, subscribed for the viewer's life, publishes `host.publishSelection(stateNow(), origin === "move")` only while `hostAttached`, as `updateSelectedObject` (~732-740) does now.
  - `selectRequest`, `hostSelect`, `selectWith`, `hostSelectApplied` and `updateSelectedObject` are removed.
- `AstraeusShell`:
  - New required prop `selection`; the props `onSelectionChange`, `selectRequest` and `onSelectRequestApplied` are removed (46 props down to 44; record the count).
  - `selectedObjectId` comes from `useSyncExternalStore(selection.subscribe, selection.snapshot).id`. Every `setSelectedObjectId(x)` plus `onSelectionChange(x, origin)` pair becomes `selection.choose(x, origin)`.
  - The report effect (~538-540) and the `hostCleared` ref (~543) go (the store holds the flag). That effect runs on mount and on every change: on mount it writes the shell's opening id into `App`'s copy; after that it only repeats reports the choose paths already made, so the store's start id and `choose` replace it.
  - The host request effect (~581-597, with its effect-order comment ~581) is folded into the end of the view-switch effect (~545-579): after its own fallback and view rule, `selection.takeAsk()` applies the card rule. An ask with id `""` closes an open object card; otherwise the card opens, unless the ask is `quiet` and `pickOpensInfo(phone)` is false. No comment or behaviour depends on the order of two effects any more.
  - The first header line (~1) no longer says selection is "still kept here".
  - `SelectionOrigin` is re-exported from `selection/selection.ts`.
- `pickRequest` (a tap in the scene, which flies the camera) stays as it is: it belongs to the camera slice (PLAN.md decision 4).
- Test wiring only, per PLAN.md owner question 1. In `tests/domSetup.ts` (~204-214; about 24 test files mount through its `mountShell`) the `Host` creates a store, hands it as `selection` and fills `probe.selected` from a subscription; `MountOptions.selectRequest` keeps its shape and becomes `selection.ask(id, quiet === true)` before the first render. In `experiencePlugInContract.test.ts`, `listedOrbitGroup.test.ts`, `syntheticRing.test.ts` and `apollo11 pointsLayer.test.ts`, `onSelectionChange: noop` becomes `selection: createSelection("")` (or the opening id the case already implies). No assertion, experience, clock or other option changes. Record each file's diff lines.
- New `packages/astraeus/tests/selectionOwner.test.ts`, run on both embedding paths (`mount` and React `AstraeusScene`), one table of selection paths: menu choice, scene pick, pick from a look-out camera (`keepSky`), sky figure, event Go to, view switch that drops the object, view switch with a framing rule, story step `select` (wide and phone), host `setSelected` (id, same id, clear). For each row it checks `handle.selected`, the `onSelect` reports (count and cause), the scene's `controls().selectedObjectId`, the object picker's value and whether the card is open. Written first and green on the base, so it pins today's behaviour.
- One more case in it proves the external-store path: a `selection.ask` made outside React (no prop change) re-renders the shell's picker to the new id.
- Existing tests green unchanged (TEST-03):
  - `setSelected.test.ts`: every case on both PATHS, including "straight after ready, before the first frame, the selection holds" and the two "inside the onChange report of a view switch" cases.
  - `hostCallOrder.test.ts`.
  - `pausedRenders.test.ts` (O-087: no `App` re-render while paused; the store must not notify on reads).
  - `lifecycle.test.ts`: "onSelect: reads the opening selection …" and "sky figures take part in selection (O-066 T-299) …", both drivers.
  - `twoViewers.test.ts`: "A's visitor choosing an object is heard by A's onSelect only", the setter-table row for `setSelected` and the chips case "A's press, setSelected and setParagraphs touch A only".
  - `selectionCauseDom.test.ts` (all ROWS), `skyFigureSelect.test.ts`, `publicApiOpeningSelection.test.ts`, `viewCameraDom.test.ts`, `appScreenDom.test.ts`, `domStorySteps.test.ts` (the quiet-select cases ~155-167), `domPhone.test.ts`, `domShell.test.ts`.
- Engine size: the first-open raw total (`npm run measure:example`) rises by at most 500 B over draft 01's "after" figure and stays under the 1,838,000 B raw limit (`engine-budget.mjs` ~20). Record the figure. The headroom left after this Objective is shared with O-092 (about 900 B planned against 1,574 B left at C-208's 1,836,426 B). Over budget: park per G-024 decision 7.
- Handoff gates are focused (builder rule 7): `npm run typecheck`, ESLint and `prettier --check` on the changed files, and the Technical Verification test list. No full `npm test` or `npm run lint`.

## Context Files

- `packages/astraeus/src/shell/selection/selection.ts` (draft 02)
- `packages/astraeus/src/app/App.tsx`. After draft 01, line numbers shift, so find the parts by name: `initialSceneControls`, `stateNow`, the selection block from `hostAttached` to `updateSelectedObject`, `markOpenPanel`, the attach effect and the `<AstraeusShell>` element.
- `packages/astraeus/src/shell/AstraeusShell.tsx` (~1, ~57-63, ~211-410 `SelectionOrigin` and props, ~412-470, ~535-715, ~730-800)
- `packages/astraeus/src/app/AstraeusScene.tsx` (the `SceneControls` type around `selectedObjectId`, ~184)
- `packages/astraeus/src/api/viewerSelection.ts` (`setSelected` ~44-56) and `packages/astraeus/src/api/viewerLink.ts` (`publishSelection` ~420); read only
- `packages/astraeus/src/app/sceneFrame.ts` (`controlsChanged` ~622-634; read only)
- `packages/astraeus/tests/domSetup.ts`
- `packages/astraeus/tests/setSelected.test.ts`, `packages/astraeus/tests/selectionCauseDom.test.ts` (how both paths are driven; read only)

## Design References

`.savepoint/Design.md` under `Host calls land in order` and `Viewer interface`; `docs/architecture/viewer-interface.md` under `7. Public interface (O-079, O-080, O-081)` and `9. Module structure and contributor guide`.

## Guardrails

API-02, API-03, ARCH-02, TEST-01, TEST-02, TEST-03, STYLE-07, STYLE-10, CODE-01.

## Implementation Plan

1. Write `selectionOwner.test.ts` against the base and see it pass on both paths.
2. Wire the store into `App`: create it, make the controls getter, route `ask`, `id()` and the `onMove` publish, and delete the old selection block.
3. Wire the shell: add the prop, read it with `useSyncExternalStore`, replace the choose pairs, fold the request effect into the view-switch effect and drop the three props.
4. Migrate the test wiring (wiring lines only) and run the whole selection list above.
5. If the view-switch effect goes over complexity 20, pull its card-rule tail into a named function rather than raising the limit (CODE-01).
6. `npm run format`, the size measurement, then the focused gates.

## Boundaries

Public API, README and `api-surface.lock.json` unchanged (`AstraeusShell` is an internal export, `package.json` `x-internal-exports`). No change to `api/`, to `pickRequest`, `panelRequest`, `featureRequest`, `shelfRequest`, the camera-preset logic or the mirrored settings. No drawer change. No browser run (policy; draft 04 runs the tiers). If draft 04's run shows a browser script broke because of this Task, the fix (in `driver.mjs` only) comes back here. If keeping `setSelected.test.ts` and `hostCallOrder.test.ts` green needs a second ordering mechanism beyond `ask`/`takeAsk`, stop and report rather than adding a serial.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/selectionOwner.test.ts packages/astraeus/tests/selectionStore.test.ts packages/astraeus/tests/setSelected.test.ts packages/astraeus/tests/hostCallOrder.test.ts packages/astraeus/tests/lifecycle.test.ts packages/astraeus/tests/twoViewers.test.ts packages/astraeus/tests/selectionCauseDom.test.ts packages/astraeus/tests/skyFigureSelect.test.ts packages/astraeus/tests/publicApiOpeningSelection.test.ts packages/astraeus/tests/viewCameraDom.test.ts packages/astraeus/tests/appScreenDom.test.ts packages/astraeus/tests/domStorySteps.test.ts packages/astraeus/tests/domPhone.test.ts packages/astraeus/tests/domShell.test.ts packages/astraeus/tests/pausedRenders.test.ts packages/astraeus/tests/sceneFrame.test.ts packages/astraeus/tests/experiencePlugInContract.test.ts packages/astraeus/tests/listedOrbitGroup.test.ts packages/astraeus/tests/syntheticRing.test.ts packages/astraeus-demo-apollo11/tests/pointsLayer.test.ts`. Size: `npm run measure:example`. Handoff (builder rule 7): `npm run typecheck`; `node --require ./tools/lint/use-typescript6.cjs node_modules/eslint/bin/eslint.js <changed files>`; `npx prettier --check <changed files>`; the focused list above. No full `npm test`/`npm run lint`.

## Technical Evidence

Context: no extra reads beyond Context Files and planned_reads (`domSetup.ts` mount code read for the wiring; `tests/synthetic` not read).

Done When -> evidence:

| Done When | Proof |
|---|---|
| One store per viewer and scene, opening on `initialObjectId(shellExperience, clock time)`, not module-level | `App.tsx` `useMemo(createSelection(initialObjectId(...)), [runtime])`; `appScreenDom`, `publicApiOpeningSelection` green |
| `SceneControls.selectedObjectId` a `readonly` read-through getter; no copy written; readers unchanged | typecheck clean (no writer left); `appScreenDom`, `viewCameraDom`, `sceneFrame` green |
| Getter is an own enumerable property; paused scene sees a selection change | `selectionOwner.test.ts` "the scene's read of the selection" (both paths): `Object.keys` and `for...in` include `selectedObjectId`, value follows host `setSelected` while paused (object-literal `get` in `initialSceneControls`) |
| `App`: `hostSetSelected` and a story panel's select call `selection.ask`; `stateNow` reads `selection.id()`; one `onMove` listener publishes only while attached; old request machinery removed | `setSelected`, `hostCallOrder`, `lifecycle`, `twoViewers`, `domStorySteps` green unchanged; `selectRequest`, `hostSelect`, `selectWith`, `hostSelectApplied`, `updateSelectedObject` gone (grep) |
| `AstraeusShell`: `selection` prop, three props removed (46 -> 44), `useSyncExternalStore`, `choose` replaces every pair, report effect and `hostCleared` ref gone, ask folded into the view-switch effect (card rule in named `applyAskedCard`), header line updated, `SelectionOrigin` re-exported | typecheck; ESLint clean (complexity limit not raised); `selectionCauseDom`, `skyFigureSelect`, `domPhone`, `domShell` green |
| Test wiring only in the five shell-mounting files | diffs below |
| New `selectionOwner.test.ts`, both paths, table of 14 paths, written first and green on the base | 14 rows x 2 paths + getter row x 2 + external-store case = 31 tests; the 28 table tests were run green on the base (before any source edit) and unchanged since |
| External-store path | `selectionOwner.test.ts` "the shell reads the store, not a prop" |
| Existing tests green unchanged | focused list: 20 files, 511 passed, 1 skipped (pre-existing skip); plus all 49 files that import `domSetup`: 944 passed |
| Engine size | `npm run measure:example`: first-open total 1,826,428 B raw (523,393 gzip); T-418 base 1,826,703 B, so -275 B; limit 1,838,000 |

Test wiring diff lines (added `+` / removed `-`), no assertion, fixture, experience, clock or option change:
- `tests/domSetup.ts`: `-` import AstraeusShell; `+` import AstraeusShell, initialObjectId; `+` import createSelection, Selection; `+` MountOptions `selection?` (doc + field, new optional option to let one test drive the store; `selectRequest` keeps its shape); `-` Probe `selected: string`, `+` Probe `selection: Selection`; `-` `const selected = useRef("")`; `+` 10-line store creation in Host (opening id, `selectRequest` applied as `ask` before first render); `-` `onSelectionChange` (4 lines), `+` `selection: selection.current`; `-` `selectRequest: options.selectRequest`; `-` `selected: () => probe.selected`, `+` `selected: () => probe.selection.id()`.
- `tests/experiencePlugInContract.test.ts`, `tests/listedOrbitGroup.test.ts`, `tests/syntheticRing.test.ts`, `astraeus-demo-apollo11/tests/pointsLayer.test.ts`: each `+` one import of `createSelection`, `-` `onSelectionChange: noop,`, `+` `selection: createSelection(""),`.

Commands:
- `npm run typecheck`: clean.
- ESLint (use-typescript6) and `prettier --check` on the nine changed files: clean.
- `npx vitest run` the 20-file focused list from Technical Verification: pass (511, 1 skipped). Plus all test files importing `domSetup` (49 files): 944 passed.
- `npm run measure:example`: 1,826,428 B raw.

Behaviour notes: a story panel's select reports nothing to `onSelect` (pinned in the table, same as the base: the ask is not a move). `useSyncExternalStore` is given the snapshot as server snapshot too, because the static-markup tests render the shell on the server. The shell's effect now also depends on the ask object so a host ask for the id already selected is still taken.

Files changed: `packages/astraeus/src/app/App.tsx` (1,188 -> 1,174 lines), `src/app/AstraeusScene.tsx` (readonly), `src/shell/AstraeusShell.tsx`, the five test-wiring files, new `tests/selectionOwner.test.ts`.

Limitations: no browser run (policy). `initialObjectIdOf` in `experienceDefinition.ts` is now unused by `App` (still covered by `experiencesContract.test.ts`); left in place. If `runtime` changes, the store restarts but the controls object (built once, as before) still reads the first store; `runtime` never changes within a mounted App today.

## Drift Notes

Expected:
- Design `Host calls land in order` describes the host selection order through the shell's request.
- Design `Viewer interface` and note section 9 say selection lives in the shell.

Reconciled in draft 04.

Found while building: `initialObjectIdOf` (`experienceDefinition.ts`) has no caller in `src` now; non-architectural, candidate for removal in draft 04's reconciliation. `domSetup.ts` `MountOptions.selection` is new test wiring.

## Coordinator (gates)

Combined gate on T-418..T-420: typecheck clean; `npm run lint` clean; `npm test` 328 files, 5423 passed, 2 skipped, 1 failed: `packageBoundaries.test.ts` ARCH-03 deep-import count, astraeus-demo-apollo11 126 up from 125 (the builder's new `astraeus/shell/selection/selection` import in `pointsLayer.test.ts`). Coordinator repair (the count may only go down, so the fix is not a raise): `AstraeusShell.tsx` re-exports `createSelection` beside the existing `SelectionOrigin` type re-export (whoever renders the shell needs its store), and `pointsLayer.test.ts` imports it from the `astraeus/shell/AstraeusShell` line it already used (count back to 125). Rerun: typecheck clean; ESLint + Prettier clean on both files; vitest `packageBoundaries`, `pointsLayer`, `selectionOwner`, `interfaceHeaders` 4 files, 101 passed. First-open engine 1,826,428 B raw / 523,393 B gzip (builder's measure; the re-export adds no code already in the bundle).

Set done by the orchestrating session after these gates (owner: "I mark them as they pass", O-038; G-024 decision 7; owner 2026-11-22 "carry on orchestrating G-024").
