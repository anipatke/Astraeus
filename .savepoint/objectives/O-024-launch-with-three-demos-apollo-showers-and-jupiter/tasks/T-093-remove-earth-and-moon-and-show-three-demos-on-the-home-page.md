---
id: T-093
title: Remove Earth and Moon and show three demos on the home page
objective: O-024
status: planned
depends_on: [{task: T-091, requires: clear}, {task: T-092, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Remove Earth and Moon and show three demos on the home page

## Outcome

The Earth–Moon demo is gone; the home page shelf, the catalogue links, page titles and docs show three demos (Apollo 11, Showers, Jupiter); the public addresses are locked for the three; a new picture baseline is taken.

## User Check

Open the home page: three demo cards that open Apollo 11, Showers and Jupiter; nothing links to Earth–Moon or the old shower addresses.

## Done When

1. Owner, 2026-10-18 (O-024 Decisions 2 and 4): "Drop earth and moon, it's covered by Apollo"; its experience, its story file (`data/stories/earth-moon/`) and its checks are removed; old addresses are not redirected. Engine parts it used stay.
2. Home page shelf (three cards, owner's screenshots for Apollo and the showers; the Jupiter card picture is a placeholder until O-025), page titles, catalogue links, README and docs updated; no dangling links (a check scans the built pages).
3. The public addresses (moved here from T-082): `app.html` (Apollo 11), the Showers address from T-091 and the Jupiter address are listed in one place and checked by the full run.
4. Browser scripts that used Earth–Moon move to Apollo 11 or another demo where the scenario still needs a two-scale experience (for example the scale toggle and ⓘ, the orbit-look check); each mapped (TEST-03).
5. New picture baseline for the three demos (owner decision needed to replace the O-017 baseline, asked at the owner look); contact sheet.
6. Full run passes; owner validation: the owner opens the home page and each demo.

## Context Files

`src/experiences/earth-moon/earthMoonExplorer.ts`, `src/main.tsx`, `index.html`, `data/stories/earth-moon/panels.json`, `tools/validate/browser-earth-moon.mjs`, `tools/validate/browser-orbit-look.mjs`, `tools/validate/capture-experience-pictures.mjs`, `tools/validate/run-full.sh`, `tools/validate/load-budget.mjs`, `docs/BROWSER_CHECKS.md`, `README.md`, `.savepoint/objectives/O-024-launch-with-three-demos-apollo-showers-and-jupiter/Objective.md`.

## Design References

O-024; G-005 Launch Definition of Done.

## Guardrails

ARCH-01, TEST-01, TEST-03, PROV-01.

## Implementation Plan

1. Remove Earth–Moon; move scenarios.
2. Home page and links; address list; baseline; full run.

## Boundaries

The line-up, links and baseline; the Jupiter demo's content is O-025.

## Technical Verification

Configured gates, lite, full run, contact sheet. Evaluated under `agent-skills/references/check-method.md`.
