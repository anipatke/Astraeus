---
id: T-222
title: Make the viewer usable the moment it says it is ready
objective: O-052
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-222, reason: 'Owner said "orchestrate 052" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o052-run-20261101}, recorded_at: '2026-11-01T03:49:42Z'}
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

Files read: the seven Context Files (mount.ts, viewerLink.ts, AstraeusScene.tsx, App.tsx, viewerPort.ts, viewerHostDom.test.ts, README.md), `docs/agents/verification.md`, `agent-skills/savepoint-task/SKILL.md`. Extra reads (logged): `packages/astraeus/CHANGELOG.md` head (to add the `Unreleased` entry, none existed), `tests/domSetup.ts` (helper home), `tests/hostPageDom.test.ts`, `tests/pacingDom.test.ts`, `tests/publicApi.test.ts` (each used the old act-wrapped `await handle.ready` and deadlocked under the new meaning).

Files changed: `packages/astraeus/src/api/viewerLink.ts` (new `whenAttached()`: a promise settled in `attach`, re-armed on `detach`, never settled after `close` if not attached), `src/api/mount.ts` (`ready` returns `link.whenAttached()` after `root.render`), `src/api/AstraeusScene.tsx` (`onReady` fires from `whenAttached()`; the rebuild effect calls `link.detach()` so a rebuild waits for the new viewer's attach), `README.md`, `CHANGELOG.md`, `tests/viewerHostReady.test.ts` (new), `tests/domSetup.ts` (+`drawn` helper), `tests/viewerHostDom.test.ts`, `tests/hostPageDom.test.ts`, `tests/pacingDom.test.ts`, `tests/publicApi.test.ts` (use `drawn`).

Why the old tests missed it: `await act(async () => { await handle.ready; })` flushes React effects when the act scope ends, so `host.attach` (inside App's useEffect) had run by the time any assertion ran; a real host is outside `act` and gets only what `ready` promises. The new `tests/viewerHostReady.test.ts` runs with `IS_REACT_ACT_ENVIRONMENT = false` and awaits `ready` bare. It failed against 0.7.0 source (5 of 7 failed: time/rate example, views example, whenAttached x2, onReady) and passes now.
Guard: `ready` now waits for the effects, so the old act-wrapped pattern can no longer pass (it deadlocks under act and times out); the shared `drawn(handle)` helper in `domSetup.ts` replaces it in the four suites that used it, and the bare-await file holds the host-realistic cases. Limit: no lint rule forbids writing the old pattern again; it fails by timeout instead.

### Done When -> test

| Done When | Test(s) |
|-----------|---------|
| After bare `await ready`: `time`, `rate`, `view` (with views) defined; `setTime`, `setRate`, `setView` work | viewerHostReady: "README time/rate example ...", "README views example ..." |
| Load failure still rejects `ready` | viewerHostReady: "a load failure still rejects ready ..." |
| `unmount` before attach never resolves it as usable; later calls throw `missing-data` | viewerHostReady: "unmount before the viewer is drawn ..." (mount level, unmount before render: handle unusable) and "ViewerLink.whenAttached: never resolves after close when it had not attached". Not tested at mount level for the narrow window after `root.render` and before the effect (cannot be hit deterministically); the link-level test covers that path. |
| `onReady` fires after the link attaches | viewerHostReady: "AstraeusScene: onReady fires after the link attaches" (the `time` prop has been applied as a host change and the viewer is in the page when onReady runs) |
| Tests reproduce the 0.7.0 failure first, run README examples, evidence names why existing tests missed it | Reproduced by stashing `src/api` (5 failures); README time/rate and views examples above; explanation and guard in this section |
| README wording and CHANGELOG `Unreleased` | Edited (README `handle.ready` row, `onReady` prop text, `MountedScene.ready` / `onReady` doc comments; CHANGELOG `## Unreleased`). Not testable. |

Gates run (repo root): `npm run lint`, `npm run typecheck`, `npm run build`, `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: all pass; 173 files, 2142 passed, 1 skipped. No browser run.

Limitations: an unmount between render and attach leaves `ready` pending forever (by the Done When wording, not resolved or rejected); a host awaiting it after unmounting would hang. Public type docs changed only in comments.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

Architecture delta: `ViewerLink.whenAttached()` added; `mount` `ready` and `AstraeusScene` `onReady` now mean "viewer attached". Design.md Interfaces and Data Flow: reconcile in the last step if it describes `ready` as "drawn".
