---
id: T-247
title: Tell the host which object is selected
objective: O-054
status: planned
depends_on: [{task: T-246, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o054-planning-20261101}
---

# Tell the host which object is selected

## Outcome

Both paths' handle reads the selected object (the one whose information is open) and hears when it changes, as its own signal (O-054 Success Condition 7, second part; review F10).

## User Check

Not owner-facing: the change shows only to a host page's code and its tests. The owner sees the result at the end of the Objective.

## Done When

- `ViewerState` or `ViewerControl` carries the viewer's selected object id, from `App.tsx`'s existing selection (`selectedObjectId`): the object menu, a click pick, and a view switch that drops the selection all change it; a visitor's selection publishes at once with `cause: "visitor"` rather than waiting for the 100 ms tick.
- New host-link part `src/api/viewerSelection.ts` (one job, beside the four O-058 parts): `selected: string | undefined` (undefined before ready, after unmount and when nothing is selected) and `onSelect(listener)` returning a stop function, reporting `{ object?, time, cause }` (exported type name per the O-054 planned decisions) only when the selection differs from the last report; the opening selection is read, not reported. Listeners run through the O-054 listener helper.
- Named tests: a visitor picks an object and the host hears it once; a view switch that hides the selected object reports the drop; no report when nothing changed; nothing after unmount.
- The `it.todo` for `onSelect` in `lifecycle.test.ts` is a real case on both paths; the member table includes `selected` and `onSelect`.
- README handle rows list them.
- **Surface recorded:** `npm run api:lock` regenerated `packages/astraeus/api-surface.lock.json`; `packages/astraeus/CHANGELOG.md` Unreleased has one entry for this step ending in a one-line migration note for app makers (what to change in an app built on 0.7.0); `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/src/app/App.tsx` under `updateSelectedObject`, `stateNow` and the host `attach` effect, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/api/viewerViews.ts`, `packages/astraeus/tests/viewerHostDom.test.ts`, `packages/astraeus/tests/lifecycle.test.ts`, `packages/astraeus/README.md` under the `mount` API section.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-054 Objective under `Success Conditions` and `Architectural Considerations` (planned decisions); `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F10).

## Guardrails

API-01, API-02, API-05, ARCH-02, TEST-01, TEST-03, CODE-01, STYLE-01, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Read how `App.tsx` changes the selection (menu, pick, view drop) and record where the publish goes.
3. Carry the selection to the link; add `viewerSelection.ts` and wire it into `ViewerLink`'s publish after zones.
4. Add `selected` and `onSelect` to `ViewerHandle`; export the change type.
5. Tests, README rows, `npm run api:lock`, CHANGELOG (new; no migration needed), O-053 tests, gates.

## Boundaries

Read and signal only: no host setter for the selection, no new React prop, no change to what selecting does in the viewer (ARCH-02).

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read and changed, and limitations, recorded after the work lands.

## Drift Notes

Record any architecture delta here and name T-249 (Design.md reconciliation) as where it is accounted for (AGENTS.md, Deferred Design reconciliation).
