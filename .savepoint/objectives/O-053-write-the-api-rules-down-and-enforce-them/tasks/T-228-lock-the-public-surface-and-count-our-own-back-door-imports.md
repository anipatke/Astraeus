---
id: T-228
title: Lock the public surface and count our own back-door imports
objective: O-053
status: planned
depends_on: []
owner_validation: {required: false}
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

Pending execution: per check, the planted break that made it fail and the clean pass; allowlist entries with reasons; files read/changed; gates.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
