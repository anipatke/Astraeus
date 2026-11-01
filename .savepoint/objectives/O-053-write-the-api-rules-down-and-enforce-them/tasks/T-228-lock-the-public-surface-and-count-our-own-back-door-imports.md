---
id: T-228
title: Lock the public surface and count our own back-door imports
objective: O-053
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-228, reason: 'Owner said "orchestrate 053" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o053-run-20261101}, recorded_at: '2026-11-01T05:26:52Z'}
planned_by: {role: planner, session: api-review-20261101}
---

# Lock the public surface and count our own back-door imports

## Outcome

A change to what `astraeus` (or any published package) exposes fails a test unless the checked-in lock is updated with it, no public type quietly exposes an internal one, and the in-repo demos and site cannot add new deep imports into the engine (Guardrails API-01; Design "Public API shape", front door; O-053 "API-surface lock", "Front door for our own code").

## User Check

Not owner-facing; the owner sees the result at the end of the Objective.

## Done When

- A script generates a lock of the root exports of `astraeus` (each value and type, kind and signature text) using `collectExports` from `packages/astraeus-site/tools/site/api-reference.mjs`, plus each published package's `exports` map; the lock is checked in; a test fails when the current surface differs from the lock, naming the difference and how to regenerate.
- A reachable-type check fails when a type reachable from the root export is declared outside `packages/astraeus/src/api/`, with an allowlist (one entry per type, reason, finding, Objective expected to remove it). Today's entries include the internal `ExperienceDefinition` through `toDefinition` (O-057) and the unexported input types the review names (`LineStretchInput`, `BodyId`, `ViewPlace`, `DisplaySwitchPlace`) if reachable but unexported.
- `packages/astraeus-site/tests/packageBoundaries.test.ts` counts deep imports into the engine (anything other than `"astraeus"` and `"astraeus/style.css"`) per workspace package and fails when a count rises; a count that falls must be lowered in the same change (counts may only go down).
- Each check shown failing on a planted break (an added export, a new deep import, an internal type made reachable) and passing on the tree, recorded in evidence.
- A short note in `packages/astraeus/README.md` "What counts as internal" says the surface is locked and changes are listed in the CHANGELOG.

## Context Files

`.savepoint/Guardrails.md` under `Public API`, `.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)`, `docs/architecture/api-review-2026-11-01.md`, `packages/astraeus-site/tools/site/api-reference.mjs`, `packages/astraeus-site/tests/apiReference.test.ts`, `packages/astraeus-site/tests/packageBoundaries.test.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/package.json`, `packages/astraeus/README.md`.

## Design References

`.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)`.

## Guardrails

API-01, TEST-01, TEST-02, TEST-03, STYLE-07; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Lock generator script and lock file; sync test.
3. Reachable-type check with its allowlist as data.
4. Deep-import counts in packageBoundaries.
5. Planted-break proofs; README note.

## Boundaries

No public API change; do not fix allowlisted breaks (later Objectives).

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`), plus `check:pack` where the check needs packed output. No browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Files changed: `tools/api-surface.mjs` and `tools/api-surface.d.mts` (new: lock generator, surface compare, outside-api type walker), `package.json` (script `api:lock`), `packages/astraeus/api-surface.lock.json` (new, generated), `packages/astraeus-site/tests/apiSurface.test.ts` (new), `packages/astraeus-site/tests/apiOutsideTypes.allowlist.json` (new, data), `packages/astraeus-site/tests/packageBoundaries.test.ts` (deep-import counts), `packages/astraeus/README.md` ("What counts as internal").
Files read: all Context Files plus `tools/` listing and `packages/*/package.json` manifests (published = not `private`); no extra reads beyond those.

Per Done When:
- Lock: `npm run api:lock` writes the root exports (kind, signature, constructors, members; via `collectExports`) and the exports map of each published package (8 non-private packages: the engine, astraeus-data and six planet data packages; 83 root exports) to `packages/astraeus/api-surface.lock.json`; deterministic (two runs byte-identical); `apiSurface.test.ts` "matches the checked-in lock" names each difference and the regenerate command.
- Reachable-type check: `outsideApiTypes()` (compiler walk of exports, members, signatures, type arguments, unions, bases, plus written type names so erased aliases like `BodyId` are found) lists 24 entries; allowlist data file has one entry each with reason, finding and Objective (all O-057). Includes ExperienceDefinition (F7), BodyId, ViewPlace, DisplaySwitchPlace (and DisplaySwitchId, ViewerChangeCause), and LineStretchInput / TrajectoryBase (declared in api/, unexported). A stale entry also fails, so the list can only shrink.
- Deep imports: `packageBoundaries.test.ts` `deepImportCounts` per workspace package (engine excluded, `astraeus/style.css` allowed): apollo11 129, planets 123, showers 68, site 94, data packages 0; a rise fails, a fall fails until the recorded count is lowered.
- Planted breaks (all reverted, tree clean after):
  1. added `export const plantedExport` to `src/api/index.ts`: `apiSurface.test.ts` failed with "The public surface changed ... run `npm run api:lock`: expected [ 'added root export plantedExport' ] to deeply equal []".
  2. type-only import of internal `Trajectory` exposed via `export type PlantedLeak` in `src/api/index.ts`: failed with "not allowed: Trajectory (packages/astraeus/src/core/trajectory.ts); declare it in packages/astraeus/src/api/ ..." (the lock test also failed, as expected).
  3. `packages/astraeus-demo-planets/src/plant.ts` with `import "astraeus/core/clock"`: failed with "astraeus-demo-planets: 124 deep imports into astraeus, up from 123 ...".
  Clean tree: all pass. Made-up-tree tests also cover removed/changed exports, a stale allowlist entry, and a count that falls.
- README: "What counts as internal" now says the surface is locked and changes are listed in the CHANGELOG.

Gates (npm): `npm run lint` pass (one complexity error in my first draft of the walker was fixed by splitting it); `npm run typecheck` pass; `npm run build` pass; `npm test` 180 files, 2210 passed, 1 skipped, 0 failed. No browser run, no check:pack (the lock is not in the packed `files`).

Limits: the type walk does not descend into types declared outside `src/api/` (it records them), so types only reachable through ExperienceDefinition are not listed. Deep-import counts include tests and tools, not just `src/`.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- The Done When says the lock covers "each published package's `exports` map"; published is read as `private` not true in package.json. The lock file lives at `packages/astraeus/api-surface.lock.json` (outside the packed `files`), the generator in `tools/api-surface.mjs`. Both are tooling, not architecture; no Design.md change needed beyond naming them in O-053's reconciliation.
