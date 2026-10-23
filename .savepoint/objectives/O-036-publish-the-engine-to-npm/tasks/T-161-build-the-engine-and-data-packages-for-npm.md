---
id: T-161
title: Build the engine and data packages for npm
objective: O-036
status: planned
depends_on: [{task: T-160, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o036-planning-20261023}
---

# Build the engine and data packages for npm

## Outcome

`astraeus` builds to compiled JavaScript with types and packs small; a new `astraeus-data` package carries the moon positions and full pictures; a standing fast check packs both and fails on unexpected contents or sizes.

## User Check

Run the pack check from the repository root and see both packages listed with their sizes under the limits.

## Done When

- An engine build command (named in the decision note) writes compiled ESM and `.d.ts` to the package's output folder; `package.json` points `exports`, `types` and `files` at it, with version `0.1.0`, licence, repository, keywords and the dependency/peer split the note decided.
- `packages/astraeus-data/` holds the data the note moved (with `git mv`), its own `package.json` (version `0.1.0`), README and licences; the engine finds it when installed and offers only what it has when it is not (no invented data, DATA-01).
- The demos and the site still build and behave the same (they may keep using source); public build file list and load budget unchanged.
- A root script (for example `npm run check:pack`) runs the build and `npm pack --dry-run --json` for both packages and fails on files outside an allow-list or sizes above the note's limits; it is fast, in the configured gates or the test suite, and documented.
- Configured gates and `npm run check:engine-alone` pass. No browser runs.

## Context Files

`docs/NPM_PACKAGING.md`, `packages/astraeus/package.json`, `package.json`, `tsconfig.json`, `tools/check-engine-alone.mjs`, `packages/astraeus/data/ephemerides/README.md`, `packages/astraeus-site/vite.config.ts`, and the previous steps' Technical Evidence.

## Design References

Design: Components/Codebase Map; Public site and launch (O-016); Current Technical State (O-035).

## Guardrails

ARCH-04, PROV-01, PROV-02, DATA-01, TEST-01, TEST-03.

## Implementation Plan

1. Add the build; point the manifest at its output.
2. Create `astraeus-data` and move the data with `git mv`; teach the engine to find it.
3. Add the pack check; record sizes.
4. Gates, engine-alone, public build and load budget.

## Boundaries

No API changes beyond what packaging needs; no example app or docs (next step); no publishing (`npm publish` is never run). If the data move changes what the demos or the public site show, stop and report.

## Technical Verification

Configured gates, `npm run check:engine-alone`, the new pack check, public build and load budget at hand-off. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None yet.
