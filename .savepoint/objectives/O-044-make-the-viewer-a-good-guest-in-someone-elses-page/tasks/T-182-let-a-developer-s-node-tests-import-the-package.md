---
id: T-182
title: Let a developer's Node tests import the package
objective: O-044
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: g012-planning-20261026}
---

# Let a developer's Node tests import the package

## Outcome

A consumer's Vitest test in the Node environment imports the packed `astraeus` and builds `new Scene().addBody(sun).addBody(earth).toDefinition()` with no `test.server.deps.inline` setting. Today it fails with `ERR_IMPORT_ATTRIBUTE_MISSING` because six `src/` files import JSON without `with { type: "json" }` (showers finding E9).

## User Check

None required.

## Done When

- A repeatable check (a test or a step in an existing tool such as `tools/check-engine-alone.mjs`) installs the built package into a scratch consumer with its peers and runs one Vitest Node test as above with no inline setting; it fails before the fix (record the failure) and passes after (TEST-02).
- Every JSON import in `packages/astraeus/src/` loads in plain Node ESM: `core/bodies/jupiterData.ts`, `core/bodies/io.ts`, `core/bodies/planetMoons.ts`, `core/bodies/outerPlanetData.ts`, `core/planetModels.ts`, `core/bodies/jupiterMoons.ts`, by import attributes or by generating JS at build time; the published JS keeps working in Vite consumers (`npm run check:engine-alone`, `npm run measure:example` figures unchanged within noise).
- If the next blocker after JSON is the stylesheet import in `api/mount.ts`, the check shows whether Vitest's own CSS handling covers it; if it does not, stop and report the options (do not move the CSS import without the owner, since root-only users rely on it, showers finding R2).
- Hand-off gates plus `npm run check:engine-alone` and `npm run check:pack` green.

## Context Files

`packages/astraeus/src/core/bodies/jupiterData.ts`, `packages/astraeus/src/core/bodies/io.ts`, `packages/astraeus/src/core/bodies/planetMoons.ts`, `packages/astraeus/src/core/bodies/outerPlanetData.ts`, `packages/astraeus/src/core/planetModels.ts`, `packages/astraeus/src/core/bodies/jupiterMoons.ts`, `tsconfig.json`, `tools/build-packages.mjs`, `tools/check-engine-alone.mjs`, `packages/astraeus/src/api/mount.ts`, `docs/agents/build.md`.

## Design References

Design Components/Codebase Map (package build and publish); `docs/NPM_PACKAGING.md` only if the build output changes shape.

## Guardrails

TEST-01, TEST-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Write the consumer check; record the failure.
2. Add import attributes (TypeScript 7, `module: ESNext`, `moduleResolution: Bundler`); confirm tsc keeps them in the output; fall back to build-time JS only if it does not.
3. Rerun the check, engine-alone, pack and example measure.

## Boundaries

No change to data values or public API; no new dependency; no browser runs.

## Technical Verification

The consumer check, hand-off gates, `npm run check:engine-alone`, `npm run check:pack`, `npm run measure:example`. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Defer Design notes to T-184 (the O-044 integration step), named in the note.
