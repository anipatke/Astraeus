---
id: T-246
title: Let a host pause and play the viewer
objective: O-054
status: planned
depends_on: [{task: T-245, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o054-planning-20261101}
---

# Let a host pause and play the viewer

## Outcome

Both paths' handle reads whether the viewer is playing and can pause or play it, through the same play control a visitor uses (O-054 Success Condition 7, first part; review F10).

## User Check

Not owner-facing: the change shows only to a host page's code and its tests. The owner sees the result at the end of the Objective.

## Done When

- `ViewerControl` (`src/app/viewerPort.ts`) gains `setPlaying(playing: boolean)`, attached in `src/app/App.tsx` from the viewer's existing play handler (no second clock).
- `ViewerHandle` gains `readonly playing: boolean | undefined` (undefined before ready and after unmount) and `setPlaying(playing: boolean)`; a non-boolean throws `bad-timeline`; a scene with no play control (if the visitor sees none, for example `setTimeline({ none: true })` frozen at a moment) throws `bad-timeline` naming why, matching what a visitor can do; before ready and after unmount `not-mounted`.
- `onChange` hears the change with `cause: "host"` and the new `playing`; the visitor's play button and `setPlaying` stay in step (named DOM test).
- The `it.todo` for `setPlaying` in `lifecycle.test.ts` is a real case on both paths; the member table there includes `playing` and `setPlaying`; `viewerHandleType.test.ts` passes unedited.
- README handle rows list `playing` and `setPlaying`.
- **Surface recorded:** `npm run api:lock` regenerated `packages/astraeus/api-surface.lock.json`; `packages/astraeus/CHANGELOG.md` Unreleased has one entry for this step ending in a one-line migration note for app makers (what to change in an app built on 0.7.0); `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/src/app/App.tsx` under the host `attach` effect and `setPlaying`, `packages/astraeus/src/api/viewerClock.ts`, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/tests/viewerHostDom.test.ts`, `packages/astraeus/tests/lifecycle.test.ts`, `packages/astraeus/README.md` under the `mount` API section.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-054 Objective under `Success Conditions` and `Architectural Considerations` (planned decisions); `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F10).

## Guardrails

API-01, API-02, API-05, ARCH-02, TEST-01, TEST-03, CODE-01, STYLE-01, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Confirm how the visitor's play control behaves in a frozen-time scene and match it; record what you found.
3. Extend `ViewerControl` and the attach in `App.tsx`.
4. Add `playing` and `setPlaying` to the clock part, the link and `ViewerHandle` (the shared handle helper gives React the same).
5. Tests, README rows, `npm run api:lock`, CHANGELOG (new; no migration needed), O-053 tests, gates.

## Boundaries

Play state only. No new React prop (the handle covers it). No change to pacing or rates.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read and changed, and limitations, recorded after the work lands.

## Drift Notes

Record any architecture delta here and name T-249 (Design.md reconciliation) as where it is accounted for (AGENTS.md, Deferred Design reconciliation).
