---
id: T-211
title: Let addBody take any listed moon
objective: O-049
status: planned
depends_on: [{task: T-210, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: probe-feedback-3-20261031}
---

# Let addBody take any listed moon

## Outcome

`scene.addBody(id)` resolves every moon in the slim table as a catalogue body by one rule, drawn from its data package's fit set, with `{ orbit: true }` drawing one lap about its planet; the existing detailed moons are unchanged (I-122).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- One rule turns a slim-table entry into a body definition (label, mean radius with source, parent, `requires` its data package, `orbitPeriodDays`, grey sphere unless the picture pack has a picture); the detailed definitions (Io, Europa, Ganymede, Callisto, Phobos, Deimos, Saturn's seven, Triton, Charon) win where they exist. No moon id appears in the rule.
- Its position binds through the planet's moon system (`moonSystem.ts` `mappedMoon`/`binding`) only when the scene adds it, so an unused moon costs nothing at runtime.
- `addBody("miranda")` in a made-up Sun-first scene with Uranus and `astraeus-data-uranus` builds a definition; `{ orbit: true }` gives a span of its period; without the data package, or outside its span, it fails as today (`missing-data`, `out-of-span`); a moon without a period refuses `{ orbit: true }` with `no-orbit`.
- The `unknown-body` message stays readable with hundreds of moons (names the planets and how to list moons, not every id); `catalogue`/`bodies` listing in `src/api/bodies.ts` includes the listed moons with `requires`.
- README `addBody` row and the `astraeus-data-uranus` README line ("no ready-made moon bodies yet"); CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/bodies.ts`, `packages/astraeus/src/core/bodies/index.ts`, `packages/astraeus/src/core/bodies/planetMoons.ts`, `packages/astraeus/src/core/bodies/moonSystem.ts`, `packages/astraeus/src/core/body.ts`, `packages/astraeus/tests/moonOrbitLines.test.ts`, `packages/astraeus/README.md`, `packages/astraeus-data-uranus/README.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-03, ARCH-05, ARCH-06, PROV-01, PROV-02, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Confirm the slim table from the previous step exists; return REPLAN REQUIRED if not.
3. Add the rule and lazy binding; keep detailed moons first.
4. Errors and listing; tests on made-up scenes; README, CHANGELOG.

## Boundaries

No new pictures, looks or data; no change to the detailed moons.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run in this step. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
