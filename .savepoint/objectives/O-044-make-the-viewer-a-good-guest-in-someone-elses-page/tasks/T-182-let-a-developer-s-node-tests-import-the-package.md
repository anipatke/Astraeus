---
id: T-182
title: Let a developer's Node tests import the package
objective: O-044
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: g012-planning-20261026}
check_waiver:
  task: T-182
  reason: 'Owner said \"orchestrate O44\"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.'
  actor: {role: owner, session: o044-run-20261028}
  recorded_at: '2026-10-28T10:38:00Z'
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

Partly done; blocked on the stylesheet import (criterion 3), reported to the coordinator.

- Consumer check: new `tools/check-node-consumer.mjs` (`npm run check:node-consumer`) builds and packs `astraeus`, unpacks the tarball into a scratch consumer with linked peers and Vitest, runs one Node-environment test (`new Scene().addBody(sun).addBody(earth).toDefinition()`, no inline setting). Before: `TypeError: Module ".../astraeus/data/orbits/callisto.json" needs an import attribute of "type: json"`. After the JSON fix: `TypeError: Unknown file extension ".css" for .../astraeus/src/app/style.css` (the import in `api/mount.ts`). Vitest's own CSS handling does not cover a package under node_modules (Node loads it, not Vite). Not moved, per the Task. Check is therefore still red (criterion 1 unmet after-state).
- JSON: all six files now use `with { type: "json" }`; the named `{ rotation as x }` imports in planetMoons.ts and jupiterMoons.ts became default imports read as `x.rotation` (Node allows only the default export of JSON). tsc keeps the attribute in the output (dist/io.js checked). Criterion 2 met.
- Gates: lint, typecheck, build, npm test (142 files, 1865 passed, 1 skipped), check:engine-alone, check:pack all pass.
- measure:example first-open total: before 1588223 raw / 454200 gzip; after 1588120 / 454079 (noise).
- Options for the CSS blocker (owner): (a) accept `test.server.deps.inline: [/astraeus/]` in the consumer's Vitest config and document it; (b) give the package a second entry without the stylesheet (e.g. `astraeus/core`) and keep `astraeus` as is; (c) load the stylesheet lazily inside `mount()` (`await import("./style.css")`), which changes the root-only user path (showers R2); (d) a `node` export condition pointing at a build of the root without the CSS import.

- Owner decision: actor owner, session o044-run-20261028, 2026-10-28, via the coordinator's question, chose option (d) "Node-only copy without CSS (Recommended)": a `node` export condition on the root entry pointing at a build without the stylesheet import; browser/Vite consumers resolve as today.
- Option (d) built: `tools/build-packages.mjs` `writeNodeCopy` (generated, not hand-kept) writes `x.node.js` twins of every compiled file that imports a `.css` file or transitively imports one (api/mount, api/AstraeusScene, shell/*, app/* ...), with the stylesheet lines removed and imports of twins pointed at twins. `packages/astraeus/package.json` x-publish exports: `types`, then `node: ./src/api/index.node.js`, then `import` (bundlers do not use `node`, so they keep index.js). Twins are in the tarball (check:pack allow-list accepts them).
- Consumer check after (d): `npm run check:node-consumer` passes (1 test: definition.composition defined, clock.startUtcMs a number). Before: the JSON error, then the `.css` error, both recorded above. Final gates rerun: lint, typecheck, build, npm test (142 files, 1865 passed, 1 skipped), check:engine-alone, check:pack pass; measure:example first-open 1588120 raw / 454079 gzip (unchanged from the post-JSON figure; baseline 1588223 / 454200).
- Unverified: a jsdom/happy-dom consumer also takes the `node` condition and so renders without engine CSS; not exercised.

## Drift Notes

- The package export map gained a `node` condition (CSS-free `*.node.js` twins generated by the build). Deferred to T-184 (O-044 integration step): Design.md (package build and publish) and the astraeus README must mention it, or the integration Task states why not architectural.

Defer Design notes to T-184 (the O-044 integration step), named in the note.
