---
id: T-157
title: Give each demo its own licences and credits
objective: O-035
status: planned
depends_on: [{task: T-156, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o035-planning-20261023}
---

# Give each demo its own licences and credits

## Outcome

Each demo package carries the licences and credits for its own data (Apollo reconstruction sources, GMN CC BY 4.0, story pictures), the engine carries those for core data and libraries, and the site's assets page and the public-build licence gate gather them from the packages, with the same visible credits as today.

## User Check

None on screen beyond the assets page reading the same (the owner's look is the last step).

## Done When

- Each package has its licence and credit records beside its data (files moved, not reworded); the engine's `licenses/` keeps the third-party library licences it ships (ERFA, orb.js, sgp4) if those belong to engine code.
- The assets page (`assets.html`, `tools/site/assets-sections.mjs`) and `tools/validate/public-build-assets.mjs` find credits and licences from the packages; their output (the credit list and the gate's result) is the same as before, compared and recorded.
- A fast test proves a made-up demo package with its own credit record is picked up by the site's credit gathering without a site code change (ARCH-03); existing credit tests (`tests/assetsPageCredits.test.ts`, `tests/assetsSections.test.ts`) still pass (named, TEST-03).
- Configured gates pass; public build, `public-build-assets` and the load budget pass. No browser runs.

## Context Files

`src/assets/licence.ts` (new path), `tools/site/assets-sections.mjs`, `tools/validate/public-build-assets.mjs`, `tests/assetsPageCredits.test.ts`, `tests/assetsSections.test.ts`, the `licenses/` folder, and the previous steps' Technical Evidence.

## Design References

Design: Public site and launch (O-016); Measured orbits: GMN only; texture provenance (PROV-02).

## Guardrails

PROV-01, PROV-02, ARCH-01, ARCH-03, TEST-01, TEST-03.

## Implementation Plan

1. List every licence and credit record and which package's data it covers.
2. Move each next to its data; teach the site's gathering to read the packages.
3. Compare the assets page credit list and the gate result before and after.
4. Test with a made-up demo; gates.

## Boundaries

No wording or licence change; no data change. No browser runs, no screenshots.

## Technical Verification

Focused tests; configured gates and public build checks at hand-off. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Note for Design: credits and licences live with each package. Reconciled in the last step.
