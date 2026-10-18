---
id: T-095
title: Cut what every page downloads — fetch the Milky Way only when shown, and let browsers keep the site's files
objective: O-024
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Cut what every page downloads — fetch the Milky Way only when shown, and let browsers keep the site's files

## Outcome

Demo pages no longer download the Milky Way pictures unless a viewer switches them on, and returning visitors load the site's hashed files from their browser's cache instead of asking again.

## User Check

Open any demo with the browser's network panel: no `milky-way-*` pictures unless the Milky Way picture is switched on; reload: hashed files come from the cache.

## Done When

1. Owner, 2026-10-18 (accepted the optimisation list, "Yea"): the Milky Way pictures (two tiles, about 3.7 MB) are fetched only when the picture is first shown (Developer setting or `?milkyway=` address); switching on fetches and shows them; switching off keeps them for the session; the sky looks the same as today in both states.
2. `vercel.json` sends long-lived immutable caching for content-hashed files under `/assets/` (for example `Cache-Control: public, max-age=31536000, immutable`) and keeps the HTML pages revalidating, so a new release is picked up at once.
3. The public load budget's per-page totals drop by the Milky Way pictures (limits lowered to the new sizes); the picture check is unchanged (the picture is off in the baseline).
4. Browser checks through the shared driver: no Milky Way request with the picture off, one when switched on; the caching rule is checked by reading `vercel.json` in a unit test.
5. Gates and full run pass.

## Context Files

`src/app/SkyView.ts`, `src/assets/sky.ts`, `src/app/App.tsx`, `vercel.json`, `tools/validate/load-budget.mjs`, `tools/validate/driver.mjs`, `tools/validate/browser-sky.mjs`, `.savepoint/objectives/O-024-launch-with-three-demos-apollo-showers-and-jupiter/Objective.md`.

## Design References

Design.md sky and public site sections.

## Guardrails

ARCH-02, TEST-01, TEST-03, PROV-02.

## Implementation Plan

1. Lazy Milky Way tiles in `SkyView`.
2. Caching headers; load budget; checks; full run.

## Boundaries

The Milky Way loading and the caching headers only; picture quality unchanged.

## Technical Verification

Configured gates, sky script, full run. Evaluated under `agent-skills/references/check-method.md`.
