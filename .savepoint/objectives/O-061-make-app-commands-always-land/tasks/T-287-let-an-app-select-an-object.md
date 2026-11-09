---
id: T-287
title: Let an app select an object
objective: O-061
status: done
depends_on: [{task: T-285, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: voyagers-review-20261110}
check_waiver: {task: T-287, reason: 'Owner said "orchestrate O-061" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o061-run-20261110}, recorded_at: '2026-11-09T20:44:20Z'}
---

# Let an app select an object

## Outcome

The viewer handle gains one call that selects an object the showing view shows, or clears the selection, on `mount` and React alike; `onSelect` reports it with `cause: "host"`; a bad id throws one named `SceneError` code; it follows the order rule.

## User Check

None on screen beyond the end-of-Objective owner look.

## Done When

Name and shape follow the existing setters (`setView`, `setScale`): proposed `setSelected(id: string | undefined)`, with `bad-selection` for an unknown or hidden id; the executor confirms no clash in the API lock before using them. Tests on both paths (lifecycle suite): select, clear, hidden id, unknown id, before `ready` (`not-mounted`), straight after `ready`, `onSelect` cause. API lock, README table (generated error table), CHANGELOG updated in the same change; the `selected` doc no longer says the host cannot select.

## Context Files

`packages/astraeus/src/api/viewerHandle.ts`, `packages/astraeus/src/api/viewerSelection.ts`, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/src/api/errors.ts`, `packages/astraeus/tests/selectionCauseDom.test.ts`, `packages/astraeus/tests/lifecycle.test.ts`, `packages/astraeus/README.md` (handle table, error table), `packages/astraeus/CHANGELOG.md`.

## Design References

`.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-02, API-04, API-05, API-07, ARCH-02, TEST-01, STYLE-05.

## Implementation Plan

1. Add the call to the handle type and the host seam, checked as `setCamera` checks its id.
2. Report through `onSelect` with `cause: "host"`.
3. Add the error code, lock, README rows and CHANGELOG.
4. Tests on both paths; run the gates.

## Boundaries

No `setCamera({ select })` variant: selection stays its own call (modular over consumer-shaped). Opening the info panel follows existing selection behaviour.

## Technical Verification

`npm run check:gates` (lint, typecheck, build, `npm run test:full`, engine-alone, pack, node and react consumer checks); browser scripts only at the Full Objective Check (`npm run check:browser`). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Executor: Sonnet builder, 2026-11-10. No extra reads beyond Context Files, T-285's README order rule and `hostCameraRequest` code (`App.tsx`, `sceneCamera.ts`), `AstraeusShell.tsx` (selection effects), `lifecycle.test.ts`/`twoViewers.test.ts` member tables, `migrationTable.test.ts`, `tools/api-surface.mjs` via `npm run api:lock`.

API: `setSelected(id: string | undefined): void` on `ViewerHandle` (so `mount` and `AstraeusScene`, one type, API-02). New `SceneError` code `bad-selection` (no clash: grepped `errors.ts`; one cause, API-05). Validation uses `control.cameraTargets()` (the objects the showing view shows), as `setCamera` does.

Mechanism (same ordered host path as T-285): `ViewerLink.setSelected` validates, calls `control.setSelected` (App: sets `controls.selectedObjectId` at once so `selected` reads it, keeps the request in `hostSelect`, and raises a `selectRequest` state) then `#afterHost()` publishes with `cause: "host"`. The shell applies `selectRequest` in an effect placed after its view-switch effect (same commit), so it wins over the view's fallback or framing; while a host request is pending `updateSelectedObject` ignores the shell's older choice. A host clear sets `hostCleared` so the shell's fallback does not re-pick an object.

Behaviour choices: re-selecting the selected id reports nothing (publish only reports a change); the object's card opens as a visitor's menu choice opens it (`setInfo({kind:"object"})`, also on a phone) but the camera does not move (Boundaries: no `setCamera({select})`); revised after the coordinator's question, the first build opened no card; a host clear stays cleared until a visitor, a host call or a view rule selects again, and closes the object card; an object hidden by time only (not by the view) is accepted like `setCamera` accepts it, and the shell then drops it as it drops a visitor's choice.

Found and fixed on the way (same cause class as I-150): `ViewerLink.publish` handed the rest of an outer publish (zones, selection) the older reading when an `onChange` listener made a host call that published inside it, so a `setSelected` inside the view-switch report was then reported over by a stale `pa host`. `publish` now re-reads when a nested publish happened.

| Done When | Test (`packages/astraeus/tests/setSelected.test.ts`, each on `mount` and `AstraeusScene`) |
|---|---|
| Name and shape follow `setView`/`setScale`; `bad-selection`; no clash | typecheck + `api:lock`; `lifecycle.test.ts` member table, `twoViewers.test.ts` setter row (`setSelected`, hears selects, other viewer unchanged) |
| select | "selects a shown object and reports it once with cause host" |
| clear | "clears the selection (selected undefined, onSelect without an object, cause host) and it stays cleared" |
| re-select same id | "selecting the object already selected reports nothing" |
| hidden id | "an object the showing view hides throws bad-selection; allowed again in the view that shows it" |
| unknown id, empty, non-string | "%s throws bad-selection and changes nothing" for unknown id, empty id, number, null, object |
| before `ready` (`not-mounted`) | "mount: before ready" case; `lifecycle.test.ts` CALLS row `setSelected` (before ready and after unmount, both paths) |
| after unmount | "after unmount throws not-mounted" (id and undefined) |
| straight after `ready` | "straight after ready, before the first frame, the selection holds" |
| inside an `onChange` view switch | "holds over the view's own framing" (view b's rule would select pb; host's earth wins, last report is host) and "a clear holds too" |
| Info panel follows existing selection behaviour | "opens the selected object's card as a visitor's menu choice does, and a clear closes it" (checks `.info-panel` shows Probe A, then is gone) |
| `onSelect` cause | cause `host` asserted in the select, clear, straight-after-ready and view-switch cases |
| API lock, README table (generated error table), CHANGELOG | `npm run api:lock`, `npm run api:errors` run; README handle table row, Selection paragraph, `bad-selection` row; CHANGELOG "Unreleased (0.8.1)"; the `selected` doc no longer says the host cannot select |
| migration table | no row needed: `ViewerHandle` is new since 0.7.0 and `MountedScene` is already in `WIDENED`; `migrationTable.test.ts` unchanged (a trial `WIDENED` row for `ViewerHandle` failed "each entry is a real difference" and was removed) |

Files changed: `src/api/{errors,viewerHandle,viewerLink,viewerSelection}.ts`, `src/app/{App.tsx,viewerPort.ts}`, `src/shell/AstraeusShell.tsx` (new `selectRequest` prop, `selectionLost` helper to stay under the complexity limit), `api-surface.lock.json`, `README.md`, `CHANGELOG.md`, tests: new `tests/setSelected.test.ts`, edited `tests/lifecycle.test.ts`, `tests/twoViewers.test.ts`, `tests/helpers/viewerPresentation.ts` (fake control gains `setSelected`).

Commands: `npx vitest run tests/setSelected.test.ts` 29 passed; `npm run check:gates` all 9 gates passed (lint, typecheck, build, test, test:full, engine-alone, pack, node-consumer, react-consumer), total 175 s, 0 over limit. `check:browser` not run (by instruction).

Limits: no browser look (selection only exercised through the real shell with the 3D canvas stubbed); a host-selected object that is hidden by time alone is accepted then dropped by the shell, not rejected.

## Drift Notes

Reconcile the new call into Design.md (Public API shape) before the Full Objective Check: `ViewerHandle` gains `setSelected(id | undefined)` and the error code `bad-selection`; `selected` is no longer read-only; and `ViewerLink.publish` re-reads state after a nested host-call publish (order rule extends to host calls made inside any `onChange` report).
