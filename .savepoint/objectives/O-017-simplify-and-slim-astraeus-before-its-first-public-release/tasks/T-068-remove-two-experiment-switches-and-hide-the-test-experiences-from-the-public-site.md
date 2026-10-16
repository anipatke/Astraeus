---
id: T-068
title: Remove two experiment switches and hide the test experiences from the public site
objective: O-017
status: planned
depends_on: [{task: T-066, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o017-plan-20261017}
---

# Remove two experiment switches and hide the test experiences from the public site

## Outcome

The lighting comparison and the Milky Way picture choice are gone, with their comparison scripts, and the made-up test experiences are not in the public build while still opening on the dev server.

## User Check

On the public preview, `?experience=synthetic` (or any made-up experience) shows the default experience instead, and the demos look unchanged. On the dev server the made-up experiences still open.

## Done When

1. `?lighting=single-sun` and `src/app/lighting.ts`'s second method are removed; the default lighting is unchanged (before/after pictures match).
2. `?skymap=` and the second Milky Way source are removed: one picture source remains (the current default), with its recorded licence; `tests/skyPicture.test.ts` and `tests/jupiterIo.test.ts` updated.
3. `tools/validate/browser-lighting.mjs` and `tools/validate/browser-sky-map.mjs` removed; their pass/fail scenarios, if any, mapped to remaining scripts or stated as comparison-only.
4. Made-up experiences (`src/synthetic/*`, the `synthetic*` keys in `src/main.tsx`) are excluded from the public build (`ASTRAEUS_PUBLIC_BUILD=1`), proven by the public-build validator or a test; the dev server still mounts them and their browser scripts still pass.
5. The sky "up" direction, orbit quality and timeline span switches stay.
6. Gates: typecheck, tests, both builds, validator, lite browser check; plus `browser-sky.mjs` and the synthetic scripts, zero console errors, fresh evidence directory.

## Context Files

`src/app/lighting.ts`, `src/app/AstraeusScene.tsx`, `src/assets/sky.ts`, `src/app/SkyView.ts`, `src/app/skyModel.ts`, `src/main.tsx`, `vite.config.ts`, `tools/validate/public-build-assets.mjs`, `tools/validate/browser-lighting.mjs`, `tools/validate/browser-sky-map.mjs`, `tests/skyPicture.test.ts`, `tests/jupiterIo.test.ts`.

## Design References

Design.md "The sky", lighting, "Public site and launch".

## Guardrails

ARCH-01, ARCH-03, PROV-02, TEST-01, TEST-03.

## Implementation Plan

1. Remove the lighting method and its switch.
2. Remove the sky map choice.
3. Exclude made-up experiences from the public entry; prove it.
4. Remove the two comparison scripts.

## Boundaries

No visual change to any real experience.

## Technical Verification

Configured gates, lite browser check, touched full scripts. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Design.md lighting and sky paragraphs need reconciling (Task 7).
