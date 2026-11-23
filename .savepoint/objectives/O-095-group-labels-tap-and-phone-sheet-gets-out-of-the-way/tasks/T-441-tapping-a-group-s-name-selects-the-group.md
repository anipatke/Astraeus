---
id: T-441
title: Tapping a group's name selects the group
objective: O-095
status: planned
depends_on: []
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

Pending execution.

## Drift Notes

Record architecture deltas for reconciliation before the Full Check.
