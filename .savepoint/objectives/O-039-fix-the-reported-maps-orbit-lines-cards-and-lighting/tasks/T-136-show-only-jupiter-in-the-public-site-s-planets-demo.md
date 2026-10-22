---
id: T-136
title: Show only Jupiter in the public site's planets demo
objective: O-039
status: planned
check_waiver:
  task: T-136
  reason: "Owner skipped the optional Task Check for the O-039 overnight run ('Skip them, one big check at the end'); the Full Objective Check covers it."
  actor: {role: owner, session: 8d73d3f8}
  recorded_at: '2026-10-22T10:40:06Z'
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o039-planning-20261022}
lane: public
planned_reads: [src/main.tsx, vite.config.ts, src/experiences/planets/planetChoice.ts, tools/validate/public-build-assets.mjs, tools/validate/load-budget.mjs, tests/publicBuild.test.ts, data/planets/jupiter.json]
planned_writes: [src/main.tsx, src/experiences/planets/planetChoice.ts, tools/validate/public-build-assets.mjs, tests/publicBuild.test.ts, tests/planetChoice.test.ts]
---

# Show only Jupiter in the public site's planets demo

## Outcome

A public build's planets demo offers Jupiter alone, with no planet switcher, and the other eight planets' settings, maps and moon data are left out of the public bundle; a local build keeps the full Mercury-to-Pluto switcher (owner, 2026-10-22).

## User Check

Locally, the planets demo still switches between all nine planets. After `ASTRAEUS_PUBLIC_BUILD=1 npm run build` and a preview of `dist/`, the planets demo shows Jupiter with no switcher, and `?experience=planets&planet=mars` opens Jupiter.

## Done When

- In `src/main.tsx`, the planet settings and system lists follow `__PUBLIC_BUILD__`, so a public build only lists Jupiter and Vite drops the other planets' imports; local builds are unchanged.
- With a single planet the switcher is not shown; any `&planet=` value opens Jupiter.
- `tools/validate/public-build-assets.mjs` (node, no browser) fails if a public build contains another planet's map or settings file; `tests/publicBuild.test.ts` covers it. The public page size from `load-budget.mjs` is recorded before and after.
- A node test covers the one-planet choice. Configured gates pass. Owner verdict recorded.

## Context Files

`src/main.tsx`, `vite.config.ts`, `src/experiences/planets/planetChoice.ts`, `tools/validate/public-build-assets.mjs`, `tools/validate/load-budget.mjs`, `tests/publicBuild.test.ts`, `data/planets/jupiter.json`.

## Design References

Design: Components/Codebase Map rows for `src/main.tsx`, `data/planets/` and `tools/validate/`.

## Guardrails

ARCH-01, STYLE-07, STYLE-09, STYLE-10.

## Implementation Plan

1. Confirm how `__PUBLIC_BUILD__` already hides the made-up scenes and follow the same pattern for the planet lists, written so Vite can drop the unused globs.
2. Hide the switcher when one planet is listed.
3. Extend the public-build file check and its test; record page sizes.
4. Ask the owner to try both builds.

## Boundaries

No deploy (owner's own action); no change to the Apollo or Showers demos; Jupiter's own moons stay as they are. No browser sets.

## Technical Verification

Focused node tests; configured gates plus a public build at handoff; owner's look. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Deferred to T-137.
