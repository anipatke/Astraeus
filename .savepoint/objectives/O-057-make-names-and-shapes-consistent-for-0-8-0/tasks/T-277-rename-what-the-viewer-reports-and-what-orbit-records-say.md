---
id: T-277
objective: O-057
title: Rename what the viewer reports and what orbit records say
status: planned
depends_on: [{task: T-276, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o057-planning-20261107}
---

# Rename what the viewer reports and what orbit records say

## Outcome

The reported time carries its unit and stored orbit records say `plane`, so no `removedBy: O-057` type-lint entry is left except story panels.

## User Check

A test reads `handle.timeUtcMs`; a record with `frame` is refused naming `plane`.

## Done When

`ViewerHandle.timeUtcMs`, `ViewerChange.timeUtcMs` and `EventZoneChange.timeUtcMs` on both embedding paths, with the React `time` prop and `setTime` unchanged as inputs; `ElementsBodyRecord.plane`, with `parseElementsBodyRecord` naming the replacement for `frame`; its `accuracy` validity dates follow API-04; the rest of the `apiTypeLint` breaks are cleared; demos, examples, the site and tests are moved over; the lock is regenerated.

## Context Files

`.savepoint/objectives/O-057-make-names-and-shapes-consistent-for-0-8-0/Objective.md`, `packages/astraeus/src/api/viewerHandle.ts`, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/api/viewerZones.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`, `packages/astraeus/src/core/elementsBody.ts`, `packages/astraeus-site/tests/apiTypeLint.allowlist.json`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-02, API-04, API-05, TEST-01, TEST-02.

## Implementation Plan

1. Rename the three reads and move the callers. 2. Rename the record field and add the refusal. 3. Work through what is left on the lint list. 4. Regenerate the lock.

## Boundaries

Only `ElementsBodyRecord` changes: other files with a `frame` key (ephemerides, orbit fits, generated paths) are internal data and stay. Renamed reads get no throwing stand-in; the migration table covers them.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone` and `npm run check:pack`. No browser run: the one `npm run check:browser` belongs to the last step. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read and changed, limitations.

## Drift Notes

Record architecture deltas for the last step of this Objective, which reconciles them in Design.
