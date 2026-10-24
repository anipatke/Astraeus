---
id: T-177
title: Fill the gaps the shower rebuild found
objective: O-042
status: planned
depends_on: [{task: T-175, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o042-replan-20261024}
---

# Fill the gaps the shower rebuild found

## Outcome

The public `Scene` covers the four things the shower rebuild (T-176) stopped on: a Sun-centred scene with enlarged bodies offers the viewer's Solar system scale (true distances, enlarged planets) as its second scale; a Sun-centred scene with planets works through `mount` and `prepareScene` without the caller loading planet series first; a group's `clump.near` can name a body added with `addBodyFromElements`; and `addGroup` takes the refill slice (`refillSliceMs`) the listed-orbit group already supports.

## User Check

None required; proven on a made-up configuration.

## Done When

- `setScale` / the scale choices offer the Solar system scale when a Sun-centred scene has an enlarged body (exact rule and name recorded in evidence and on `/api`); scenes without enlargement unchanged; Apollo and hello-scene definitions unchanged.
- A test proves a made-up Sun-centred scene with planets and `orbit: true` builds and prepares through the public path with the planet series NOT preloaded (the test does not rely on `vitest.setup.ts` preloading; say how), e.g. by drawing the orbit lines lazily in `prepare` or loading the series before they are read.
- `clump.near` accepts an elements body; `refillSliceMs` validated (`bad-group`) and passed through.
- Doc comments, README/CHANGELOG and `/api` updated; hand-off gates plus `check:engine-alone` and `check:pack` green.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/group.ts`, `packages/astraeus/src/api/sunOrbit.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/api/errors.ts`, `packages/astraeus/tests/publicApiSunOrbits.test.ts`, `packages/astraeus/tests/publicApiGroup.test.ts`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `packages/astraeus-site/tools/site/api-reference.mjs`.

## Design References

Design Components/Codebase Map (engine `src/api/`), Current Technical State O-041.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-05, CODE-01, TEST-01, TEST-02.

## Implementation Plan

1. Find how the viewer builds the Solar system scale and expose it through the public scale choice for enlarged Sun-centred scenes.
2. Make the Sun-orbit lines safe when planet series are not yet loaded, through the public mount/prepare path.
3. Let the clump name elements bodies; pass `refillSliceMs` through.
4. Made-up tests for each; docs; gates.

## Boundaries

Engine public API only; no showers demo or site change (T-176 resumes after this from its saved partial work); no new draw code.

## Technical Verification

Hand-off gates from AGENTS.md plus `npm run check:engine-alone` and `npm run check:pack`; no browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas for Design reconciliation in the showers rebuild Task (T-176).
