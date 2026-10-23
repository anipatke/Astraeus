---
id: T-168
title: Turn the small example into a made-up story
objective: O-041
status: planned
depends_on: [{task: T-167, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o041-planning-20261024}
---

# Turn the small example into a made-up story

## Outcome

`examples/hello-scene`, built from the packed `astraeus` tarball, shows a tiny made-up story using every new O-041 call: a made-up path with anchors, a description, known limits and readout bars, two events, one story panel, a set timeline and an opening view.

## User Check

None required (optional: the owner may look at the built example).

## Done When

- `examples/hello-scene/src/main.js` uses every call added by the two API Tasks (anchors, notes, readouts, events, panels, timeline settings, true-scale-only or a stated reason not to, `lookAt`).
- `npm run check:pack` and `npm run build:example` pass.
- The `hello-scene` browser step reads the panel, the events and the anchor count through `packages/astraeus-site/tools/validate/driver.mjs` (no direct selectors, no screenshots); `docs/BROWSER_CHECKS.md` maps the change. The step is not run per Task; it runs once in the Full Objective Check, unless the runner itself changes.
- `packages/astraeus/README.md` and `packages/astraeus/CHANGELOG.md` describe the new calls.
- Hand-off gates green.

## Context Files

`examples/hello-scene/src/main.js`, `examples/hello-scene/index.html`, `examples/hello-scene/package.json`, `tools/build-example.mjs`, `tools/check-packs.mjs`, `packages/astraeus-site/tools/validate/driver.mjs`, `docs/BROWSER_CHECKS.md`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `packages/astraeus/src/api/index.ts`.

## Design References

Design Codebase Map (`examples/hello-scene`), Current Technical State O-036 (packed example).

## Guardrails

ARCH-03, TEST-01, STYLE-05.

## Implementation Plan

1. Read the public calls from `src/api/index.ts` (not internals).
2. Grow `main.js` into the made-up story; build from the tarball.
3. Extend the browser step via `driver.mjs`; update the map.
4. README and CHANGELOG.

## Boundaries

No new example app (Decision 5); no real data.

## Technical Verification

`check:pack`, `build:example`, hand-off gates. Browser step at the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None expected.
