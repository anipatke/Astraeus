---
id: T-063
title: Re-shoot the site pictures from the public build
objective: O-016
status: planned
depends_on: [{task: T-060, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o016-plan-20261016}
---

# Re-shoot the site pictures from the public build

## Outcome

Every picture on the front page, assets page and README is captured from the public build (HYG stars, ESO Milky Way, credited Moon and Earth, GMN Perseids), so it shows exactly what visitors will see.

## User Check

Open the front page, the assets page and the README on GitHub. Every picture matches the live public demo, and none shows Yale stars or CAMS data.

## Done When

1. A capture script builds with ASTRAEUS_PUBLIC_BUILD=1, serves it, and captures each site picture (including the Perseids year GIF) at the owner's preferred angles (oblique Perseids with planet and comet orbits; the Apollo figure of eight), using startView values where set.
2. The pictures are replaced in site/, site/readme/ and public/share/ at similar sizes. The old no-sky fallbacks are removed if unused.
3. A list of every picture with its capture command and time is recorded in the evidence.

## Context Files

`index.html`, `assets.html`, `README.md`, `vercel.json`, `vite.config.ts`.

## Design References

Public build.

## Guardrails

PROV-02, TEST-01.

## Implementation Plan

1. List every image the pages and README reference.
2. Write the capture script against the public build.
3. Capture, compare with the old images, and replace them.

## Boundaries

Pictures only: no page wording changes except alt text.

## Technical Verification

Build, and the capture script's own log. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None yet.
