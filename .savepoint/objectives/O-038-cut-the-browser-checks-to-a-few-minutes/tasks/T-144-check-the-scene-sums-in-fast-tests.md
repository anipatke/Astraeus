---
id: T-144
title: Check the scene sums in fast tests
objective: O-038
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o038-planning-20261023}
lane: scene
---

# Check the scene sums in fast tests

## Outcome

What the engine browser scripts and the six on-request number checks prove about the scene is proven by fast node tests against the plain scene modules (the per-frame stages, placement, framing, labels, picking, sky and lighting): the made-up scene and its ring and listed variants, orbit and trail looks, orbit arcs moving with time, the twelve anchor labels, tap and hover picking, the sky staying fixed under camera changes, the Sun halo, the sphere-to-marker swap, whole-orbit framing and position precision far from the Sun.

## User Check

None on screen. Run `npm test` and see the new scene tests pass.

## Done When

- Each behaviour scenario in `browser-synthetic`, `browser-synthetic-ring`, `browser-synthetic-listed`, `browser-orbit-look`, `browser-orbit-motion`, `browser-anchor-labels`, `browser-tap-focus` and the on-request `browser-sky`, `browser-sun`, `browser-precision`, `browser-synthetic-belt`, `browser-synthetic-eccentric`, `browser-marker-existing` is listed in Technical Evidence with the test file and case that now proves it, or "draws: smoke check", or "looks: owner's look on the preview". `probe-phone-frames` is listed as a retired measuring tool.
- Existing tests are reused where they already prove a scenario (named exactly, TEST-03); new cases go in the matching existing test file where one exists (for example `tests/sceneFrame.test.ts`, `tests/sky.test.ts`, `tests/sunLook.test.ts`, `tests/scenePicking.test.ts`).
- Precision: the Float32-in, Float64-projection experiment at 1 AU and at 50 AU runs as a node test on the same coordinates the renderer is given, with the same limits the scripts recorded.
- Scripts are not deleted here. The fast suite stays about a minute or less (time recorded). Configured gates pass.

## Context Files

`tools/validate/browser-synthetic.mjs`, `tools/validate/browser-synthetic-ring.mjs`, `tools/validate/browser-synthetic-listed.mjs`, `tools/validate/browser-orbit-look.mjs`, `tools/validate/browser-orbit-motion.mjs`, `tools/validate/browser-anchor-labels.mjs`, `tools/validate/browser-tap-focus.mjs`, `tools/validate/on-request/browser-sky.mjs`, `tools/validate/on-request/browser-sun.mjs`, `tools/validate/on-request/browser-precision.mjs`, `tools/validate/on-request/browser-synthetic-belt.mjs`, `tools/validate/on-request/browser-synthetic-eccentric.mjs`, `tools/validate/on-request/browser-marker-existing.mjs`, `tools/validate/on-request/probe-phone-frames.mjs`, `src/app/sceneFrame.ts`, `src/app/sceneFraming.ts`, `src/app/scenePicking.ts`, `src/app/AnchorLabels.ts`, `src/app/sceneSky.ts`, `src/app/bodyDraw.ts`, `src/app/floatingOrigin.ts`, `src/app/renderCoordinates.ts`, `tests/sceneFrame.test.ts`, `tests/scenePicking.test.ts`, `tests/sky.test.ts`, `tests/sunLook.test.ts`, `tests/orbitLook.test.ts`.

## Design References

Design: Current Technical State, precision at 1 AU (T-045); Tap to focus (O-022); The sky (T-051, T-053); the `src/app/` row.

## Guardrails

ARCH-02, ARCH-03, CODE-02, TEST-01, TEST-03; STYLE rules as listed in `.savepoint/Guardrails.md`.

## Implementation Plan

1. For each script, list its assertions; find the module that computes each value.
2. Reuse an existing test where it already proves the value; otherwise add a case against the module.
3. Where a value is only computed inside the React scene component, not a plain module, record it as smoke or owner-look rather than moving code; if a scenario matters and cannot be reached without moving code, stop and return REPLAN REQUIRED naming it.
4. Record the scenario map and suite time.

## Boundaries

No change to what visitors see or to scene code beyond exporting an existing value for a test. No browser runs, no script deletion, no doc edits. No screenshots.

## Technical Verification

Focused `npx vitest run <files>` while building; configured gates at hand-off. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None expected.
