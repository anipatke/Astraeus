---
id: T-441
title: Tapping a group's name selects the group
objective: O-095
status: done
depends_on: []
check_waiver: {task: T-441, reason: 'Owner said "Orchestrate O-95" (2026-11-24): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o095-20261124}, recorded_at: '2026-11-24T05:54:06Z'}
owner_validation: {required: true}
planned_by: {role: planner, session: plan-g025-20261122}
planned_reads: [packages/astraeus/src/app/scenePicking.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/scenePointer.ts, packages/astraeus/tests/scenePicking.test.ts]
planned_writes: [packages/astraeus/src/app/scenePicking.ts, packages/astraeus/tests/scenePicking.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
---

# Tapping a group's name selects the group

## Outcome

A tap or click on a point group's shown label selects that group with exactly the result of choosing it from the object list on that screen size (belt #33): on a wide screen its card opens, on a phone it selects as a phone list choice does. Body labels behave exactly as before. A drag that starts on a label still orbits or pans.

## User Check

Run `npm run preview:owner` and open the made-up preview scene with a point group (or the belt app against a local build) on `localhost:5490`. At desktop width click a group's name: its card opens as from the object list. At phone width tap a group's name: it selects as a phone list choice does. Drag starting on a name: the camera turns and nothing is selected. Click a body's name: unchanged.

## Done When

- `pickCandidatesOf` makes every listed object with a shown label a tap target: a non-body object (today skipped because `bodyIdFor` returns null) becomes a label-only candidate, so a group label returns the group's id. No hit-testing of dots inside a group.
- The id travels the existing path (`onPickObject` → the shell's selection module); no new selection code. If the shell refuses a group id from a tap, return REPLAN REQUIRED naming where.
- `tests/scenePicking.test.ts` gains a case that fails before the change (a group label rect picked returns the group id; outside it, null) and the existing body-label and tap-slop cases pass unchanged (builders keep fixtures).
- A browser check at 1440x900 and 390x844: group-label click opens its card on desktop, tap selects on a phone, and a drag starting on a label moves the camera without selecting. Put it in the existing step that covers taps (BROWSER_CHECKS scenario `browser-tap-focus`) per the browser policy; one browser job at a time.
- README states labels are tap targets and stay out of the tab order (the object list is the keyboard path). CHANGELOG `Fixed` entry in the open 0.11.0 section (open it if none).
- Configured gates pass; record evidence under `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/app/scenePicking.ts`
- `packages/astraeus/src/app/scenePointer.ts`
- `packages/astraeus/src/app/sceneFrame.ts` (the `pickCandidatesOf` call near the end of the frame)
- `packages/astraeus/tests/scenePicking.test.ts`
- `docs/BROWSER_CHECKS.md`
- `docs/agents/browser-policy.md`
- `packages/astraeus/CHANGELOG.md` (top section only)

## Design References

`.savepoint/Design.md` under `Viewer interface` and `Host calls land in order`.

## Guardrails

ARCH-02, ARCH-03, API-03, TEST-01, TEST-02, TEST-03, CODE-02.

## Implementation Plan

1. Confirm a group id from the object list selects through the same path `onPickObject` uses (`app/App.tsx` `requestPick` → the shell); if not, REPLAN REQUIRED.
2. Write the failing picking case.
3. Change `pickCandidatesOf` to keep non-body objects with a shown label as label-only candidates.
4. Add the browser check at both sizes in the existing tap step.
5. README and CHANGELOG.

## Boundaries

No dots-in-group hit-testing, no label keyboard focus, no change to body-label behaviour, no restyling.

## Technical Verification

Focused `scenePicking` tests while iterating; the configured build and test gates and the touched browser step at handoff. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Reads beyond Context Files: `packages/astraeus/src/shell/AstraeusShell.tsx` `pickObject` (step 1, confirm the shell takes a group id), `packages/astraeus/src/app/App.tsx` `requestPick`; `packages/astraeus-site/tools/validate/browser-smoke.mjs` and `driver.mjs` (the `browser-tap-focus` scenario's taps are the smoke script, "taps S"; there is no separate script).

Step 1: `requestPick` sets a pick request; the shell's `pickObject` accepts any listed object (`availableObjectById`), the same path as the list. A group is a listed object, so no REPLAN.

| Done When | Evidence |
|---|---|
| Non-body listed object with a shown label is a label-only candidate | `pickCandidatesOf` in `scenePicking.ts`: the `body === null` skip is gone, a non-body has no screen so only its label answers. |
| Id travels the existing path | No new selection code; `onPickObject` -> `requestPick` -> `pickObject` unchanged. |
| New picking case, existing cases unchanged | `scenePicking.test.ts` "makes the shown name of a listed non-body object (a point group) a label-only target": group id inside the rect, null outside and below. Red before: the group had no candidate (the `probe` object returned null). Existing cases pass unchanged. |
| Browser check at 1440x900 and 390x844 | Written, NOT proven: `groupLabelChecks` in `browser-smoke.mjs` (new driver helpers `dragFromLabel`, `labelCentre`), run on the made-up belt view ("Dust belt" group, `dust-belt`, label shown at the opening view), i.e. the `orbit-lines` step, since the quick smoke skips the belt. Two runs failed (1: wrong readout, `astraeusHost.camera` absent in this scene; 2: the group's own label sits at the Sun, the turn's pivot, so it never moved). Readout changed to the other shown names; third run not made (time box). |
| README and CHANGELOG | README line under "Bodies and paths"; `packages/astraeus/CHANGELOG.md` Fixed entry in 0.11.0. |
| Gates | See below. |

Commands: `npm run typecheck` clean; eslint (use-typescript6) and prettier clean on scenePicking.ts, scenePicking.test.ts, browser-smoke.mjs, driver.mjs; `npx vitest run` scenePicking, skyFigureSelect, apiImports, packageBoundaries, browserDriverGuard: 5 files, 61 tests passed.

Limitations: browser check unproven (above). The label-only rule also makes any other listed non-body object's shown name (spacecraft, comet) a tap target; the shell already accepts those ids.

Coordinator browser proof (2026-11-24, owner chose "Run it now" after the builder's third run was blocked): `npm run check:browser -- --step orbit-lines` exit 0, 56 s (limit 60 s), evidence `docs/evidence/browser-steps-20261124T060019Z/orbit-lines/results.json`: desktop `groupLabel` {dragMovedCamera: true, tapSelected: "dust-belt", cardOpened: true}; phone {dragMovedCamera: true, tapSelected: "dust-belt", cardOpened: false}. The step is now 4 s under its limit.

## Drift Notes

None. (Design.md `Viewer interface`: a shown label of any listed object, not only bodies, is a tap target; reconcile in the Design pass if that sentence names bodies only.)

Marked done by the coordinator under the owner's "Orchestrate O-95" (2026-11-24) after the wave gate passed (`npm run typecheck`, `npm run lint`, `npm test` 341 files 5524 passed 2 skipped, `npm run build`). Owner looked on localhost:5490 (`npm run preview:owner`, branch o095-group-labels-and-phone-sheet at 59ce7681, 2026-11-24T06:02Z) and said "Both work, carry on". The acceptance fields are filled in once the Full Objective Check has an id.
