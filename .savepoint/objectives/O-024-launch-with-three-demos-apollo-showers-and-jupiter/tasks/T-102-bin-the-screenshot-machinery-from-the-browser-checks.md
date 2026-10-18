---
id: T-102
title: Bin the screenshot machinery from the browser checks
objective: O-024
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Bin the screenshot machinery from the browser checks

## Outcome

No browser check takes, saves or compares pictures any more: the picture baseline, the before-and-after comparison and the contact sheet leave the full run; scripts stop writing screenshot files; checks that counted coloured pixels to prove something is drawn read the scene directly instead. The owner judges looks on the preview.

## User Check

Run the full check: no picture steps, no PNG files written, and it is about two minutes shorter; every check still passes.

## Done When

1. Owner, 2026-10-18: "can we bin the whole screenshots thing", then chose "All of it": picture baseline, comparison, contact sheet, saved pictures and screenshots taken to look are all removed.
2. `tools/validate/run-full.sh` drops `pictures-capture`, `pictures-diff` and `contact-sheet`; `capture-experience-pictures.mjs`, `diff-screenshots.mjs` and `contact-sheet.mjs` move to `tools/archive/validate/` (or are deleted if nothing references them); `capture-site-pictures.mjs` (home page and README pictures) moves to `tools/archive/validate/` too, since the owner supplies card pictures; the O-017 baseline directory stays as history (git-ignored PNGs untouched), not referenced.
3. Every script under `tools/validate/` and `tools/validate/on-request/` stops writing screenshot files (`page.screenshot({ path })` and the like); evidence is the JSON results and logs.
4. Each assertion that counted pixels from a screenshot (for example sky "stars are drawn", showers stream and Earth-path pixel counts, orbit-look brightness, any others found) is replaced by a scene readout through the shared driver (extend the canvas `data-*` readouts, as `data-paths` from I-040 does: draw counts, point counts in view, visibility, brightness settings in force), keeping the scenario's meaning; each replacement mapped in `docs/BROWSER_CHECKS.md` (TEST-03). Where a pixel assertion has no meaningful readout, record why and drop it with the mapping.
5. AGENTS.md project rules (outside the Savepoint block): the Full tier no longer mentions the picture check or the contact sheet; a rule states browser checks never take or save screenshots and looks are judged by the owner on the preview. `docs/BROWSER_CHECKS.md` updated.
6. O-024 T-093's picture-baseline Done When is removed (a planner note in T-093).
7. Driver guard passes (scripts still reach the interface only through the driver); gates and lite pass; the full run (orchestrator's batch run) passes and is measured shorter.

## Context Files

`tools/validate/run-full.sh`, `tools/validate/driver.mjs`, `tools/validate/driver-guard.mjs`, `tools/validate/capture-experience-pictures.mjs`, `tools/validate/capture-site-pictures.mjs`, `tools/validate/contact-sheet.mjs`, `tools/validate/browser-sky.mjs`, `tools/validate/browser-showers.mjs`, `tools/validate/browser-orbit-look.mjs`, `src/app/sceneDebug.ts`, `docs/BROWSER_CHECKS.md`, `AGENTS.md`, `.savepoint/objectives/O-024-launch-with-three-demos-apollo-showers-and-jupiter/Objective.md`.

## Design References

AGENTS.md browser tiers and shared driver rules; I-040's path readout.

## Guardrails

TEST-01, TEST-03, ARCH-01.

## Implementation Plan

1. Remove the picture steps and tools; stop screenshot writes.
2. Replace pixel assertions with readouts; rules and docs.

## Boundaries

Test tooling and project rules only; no app behaviour changes beyond adding readouts.

## Technical Verification

Configured gates, lite, the touched scripts, the batch full run. Evaluated under `agent-skills/references/check-method.md`.
