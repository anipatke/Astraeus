---
id: T-070
title: Set a load-size budget for every page and trim the weight
objective: O-017
status: planned
depends_on: [{task: T-066, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o017-plan-20261017}
---

# Set a load-size budget for every page and trim the weight

## Outcome

The public build fails if any page's first load grows past its stated limit, and the obvious weight (pictures, stream data files) is trimmed without visible change.

## User Check

The assets page or README states each page's first-load size and its limit. The demos look the same.

## Done When

1. A measurement of first-load bytes per page (index, assets, app with each real experience) from the public build, compressed and uncompressed, using Task 1's before numbers as the baseline.
2. Easy wins applied where they do not change what is drawn: picture re-compression or resizing within PROV-02 (licence records updated if the file changes), stream data files in a leaner format or compression, anything else the measurement shows; each with before and after bytes.
3. A budget test (in `tools/validate/public-build-assets.mjs` or a new test beside it) with one limit per page, set from the post-trim measurement plus a stated headroom, failing the build when exceeded; a mutation probe shows it fails.
4. Before/after pictures of the affected experiences match (Task 1's tool).
5. Page heading (owner, 2026-10-17: "Update the page heading as part of this cleanup"): `app.html`'s `<title>` no longer says "Astraeus Earth–Moon spike". It reads "Astraeus" until an experience opens, then "<experience label> · Astraeus", taken from the experience definition's own label so the shell names no experience (ARCH-01); a test or browser assertion covers both.
6. Gates: typecheck, tests, both builds, validator with the budget, lite browser check, plus the public-showers script.

## Context Files

`app.html`, `vite.config.ts`, `tools/validate/public-build-assets.mjs`, `tests/publicBuild.test.ts`, `src/assets/textures/earth-bmng-july-4k.jpg`, `src/assets/licence.ts`, `data/stories/perseids/gmn-iau-7.json`, `src/experiences/showers/measuredOrbits.ts`, `docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md`.

## Design References

Design.md "Public site and launch", "Texture rights", the lazy planet series.

## Guardrails

PROV-02, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Measure.
2. Trim the largest safe items.
3. Add the budget and prove it fails when exceeded.

## Boundaries

No visual change; no phone frame-rate or start-up work (O-017 decision 5).

## Technical Verification

Configured gates, budget mutation probe, before/after pictures. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Design "Public site and launch" gains the budget (Task 7).
