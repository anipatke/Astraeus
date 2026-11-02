---
id: T-250
title: Put two viewers on one page in one test
objective: O-055
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o055-planning-20261102}
---

# Put two viewers on one page in one test

## Outcome

One test file puts two viewers in one document over every pairing of the two embedding paths and proves what already holds (each handle drives only its own viewer; unmounting one leaves the other), with named placeholders for the cases later O-055 steps fill (O-055 Success Condition 1; API-03; O-053 Boundaries put the two-viewer test in O-055).

## User Check

Not owner-facing: the change is a test. The owner sees the result at the end of the Objective.

## Done When

- New `packages/astraeus/tests/twoViewers.test.ts` (happy-dom, the 3D scene mocked as in `lifecycle.test.ts`, React commits through `flushSync` as there) defines one adapter per path (`mount`; `AstraeusScene` in its own React root) with the same shape (open into its own element, get the handle, wait for ready or `onReady`, unmount), and runs every case through `describe.each` over the three pairings: `mount` + `mount`, `AstraeusScene` + `AstraeusScene`, `mount` + `AstraeusScene`. Waits use real signals (`ready`, `onReady`, a `waitFor` on the DOM or a listener call), never a fixed count of microtasks or timers (O-054 lesson).
- Cases that pass now, each named: after both are ready, `setTime`, `setRate`, `setView`, `setPlaying` and `setCamera` on viewer A change A's reads and leave B's unchanged, and A's `onChange` / `onSelect` / `onCameraChange` listeners hear only A (the call list comes from one table, so a new setter joins it); unmounting A leaves B's handle working and B's DOM in place; mounting A again beside B works.
- A case that lists every element `id` in the document and fails on a repeat, written now and marked `it.fails` (or `it.todo` if `it.fails` cannot express it) until the ids step makes it pass; its name says T-254 fixes it.
- Named `it.todo` placeholders, per pairing, for: two scenes of the same planet's moons at different years both get their moons (T-251); each viewer draws only its own data packages' pictures (T-252); `developerTools` on one viewer and off on the other (T-253); Escape closes only the panel of the viewer it was pressed in, and the loading cover is not touched by an outside host's viewer (T-255).
- **Nothing public moved:** `git diff --exit-code -- packages/astraeus/api-surface.lock.json` is empty; `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts` passes; no source change unless a case exposes a small isolation bug inside `src/api/` (fix it, record it, add one CHANGELOG line); a larger one returns REPLAN REQUIRED.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/tests/lifecycle.test.ts`, `packages/astraeus/tests/viewerHostReady.test.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`, `packages/astraeus/src/api/viewerHandle.ts`, `.savepoint/Design.md` under `Interfaces and Data Flow` (the "One handle, one lifecycle (O-054" paragraph).

## Design References

`.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-055 Objective under `Success Conditions` and `Architectural Considerations`; `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F1, F3).

## Guardrails

API-02, API-03, TEST-01, TEST-03, STYLE-02, STYLE-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Lift the two adapters' shape from `lifecycle.test.ts` (reuse its helpers if they can be shared without changing that file's cases).
3. Write the setter table and the independence, unmount and remount cases over the three pairings.
4. Write the id-repeat case (expected to fail until the ids step) and the placeholders.
5. Gates.

## Boundaries

Tests only, plus the small isolation fixes a case exposes. No new public member. Do not edit `docs/prds/`, `docs/research/` or the G-012 to G-014 `Release.md` files.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here; T-258 reconciles them into Design.md.
