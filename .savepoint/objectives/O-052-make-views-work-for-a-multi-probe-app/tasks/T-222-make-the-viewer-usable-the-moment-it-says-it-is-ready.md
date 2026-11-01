---
id: T-222
title: Make the viewer usable the moment it says it is ready
objective: O-052
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: voyagers-feedback-20261101}
---

# Make the viewer usable the moment it says it is ready

## Outcome

`mount`'s `ready` resolves only once the host link is attached, and `AstraeusScene`'s `onReady` fires at the same point, so every handle read and call works straight after `await ready` (O-052 "Ready means usable").

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- After `await mounted.ready` (no `act`, no extra frame): `time`, `rate` and, in a scene with views, `view` are defined; `setTime`, `setRate`, `setView` work. A load failure still rejects `ready`; `unmount` before attach never resolves it as usable and later calls throw `missing-data` as today.
- `AstraeusScene` `onReady` fires after the link attaches (a host may call its `time`/`rate`/`view` props' effects or read `onChange` from then).
- Tests reproduce the 0.7.0 failure first (host-style `await ready` then `setTime` threw `missing-data`), then pass; they run the README's `mount` examples (time/rate and views) as written. Evidence names why the existing `viewerHostDom` tests missed it (`await act(async () => { await handle.ready; })` flushes effects) and the guard added so the pattern cannot hide this again.
- README wording for `ready`/`onReady` matches; CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/tests/viewerHostDom.test.ts`, `packages/astraeus/README.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, TEST-01, TEST-03, TEST-04, CODE-01; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Write the failing host-style test first.
3. Give `ViewerLink` a way to signal attachment (for example a promise settled in `attach`); `mount` chains `ready` on it after render, `AstraeusScene` calls `onReady` from it.
4. Tests for README examples, unmount-before-attach and load failure; README and CHANGELOG.

## Boundaries

No change to the handle's shape or error codes; no address or camera work (later steps).

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, gates, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
