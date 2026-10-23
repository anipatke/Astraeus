---
id: T-152
title: Load only the chosen shower's story
objective: O-030
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o030-planning-20261023}
check_waiver:
    task: T-152
    reason: 'owner chose no per-step checks, one Full Objective Check at the end of O-030; quote: "Same as O-031 (Recommended)"'
    actor:
        role: owner
        session: owner-run-rules
    recorded_at: "2026-10-23T02:22:17Z"
---

# Load only the chosen shower's story

## Outcome

The Showers page fetches only the chosen shower's story panels file, the way the planets already do; the other demos' story files are no longer in the showers' download.

## User Check

None on screen (the story panels look and behave as before). Read the before and after sizes in Technical Evidence.

## Done When

- `src/experiences/showers/showerDefinition.ts` no longer holds the eager `PANEL_FILES` glob; the shower's panels arrive through the entry's lazy `STORY_PANELS` (as the planets' do) and are validated as today (a missing or broken panels file still fails with the same `ShowerSettingsError` wording).
- A fast test proves a shower is built from the panels it is handed and that a made-up shower gains panels from settings alone (ARCH-03); existing story tests still pass (named, TEST-03).
- Public build: the showers page set in `tools/validate/load-budget.mjs` lists the chosen shower's panels chunk instead of the eager ones; before and after sizes recorded; limits lowered where the page got lighter.
- Configured gates pass; the public build and `node tools/validate/load-budget.mjs <dist>` pass. No browser runs.

## Context Files

`src/main.tsx`, `src/experiences/showers/showerDefinition.ts`, `src/experiences/showers/showerSettings.ts`, `src/shell/storyPanels.ts`, `tools/validate/load-budget.mjs`, `tests/showers.test.ts`, `tests/storyStoriesAllDemos.test.ts`, `tests/demoShowers.test.ts`.

## Design References

Design: Shower builder (T-038, T-039, T-055); Story panels (O-015); Public site and launch (O-016).

## Guardrails

ARCH-01, ARCH-03, TEST-01, TEST-03; STYLE rules as listed in `.savepoint/Guardrails.md`.

## Implementation Plan

1. Measure the showers page set on the public build.
2. Move the panels lookup to the entry's lazy glob and pass the panels into the shower builder.
3. Tests, rebuild, measure, update the load budget.

## Boundaries

No change to what visitors see or to story data. The in-place switch is the next step; do not change `SwitchControl` here. No browser runs, no screenshots.

## Technical Verification

Focused `npx vitest run` while building; configured gates, public build and load-budget check at hand-off. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

```yaml
check_waiver:
  task: T-152
  reason: owner chose no per-step checks, one Full Objective Check at the end
  actor: {role: owner, session: coordinator-20261023}
  recorded_at: '2026-10-23T02:22:17Z'
```
Owner quote (2026-10-23, coordinator session): "Same as O-031 (Recommended)".

Changed: `src/experiences/showers/showerDefinition.ts` (eager `PANEL_FILES` glob removed; `buildShowerDefinition(settings, load, set, panelsFile?)` and `showerStoryPanels(..., panelsFile?)` take the loaded file; new `loadShowerPanelsFile(settings, lookup)` raises the same `ShowerSettingsError` wording for a path naming no file), `src/main.tsx` (showers branch loads the chosen panels beside the orbits through the existing lazy `STORY_PANELS`), `tools/validate/load-budget.mjs` (`storyPanels` page option adds the chosen story's panels chunk, found through the app script's lazy map; `panels.js` dropped from `SHOWER_COMMON`; limits lowered), `tests/helpers/shippedPanels.ts` (new), tests `showers`, `domDemoStories`, `storyStoriesAllDemos`, `showersYearHorizons` (pass the shipped panels).

Per criterion:
1. No eager glob; lazy lookup; same error wording: met (tests: "loads only the panels file the settings name, and says so when the project has none", moved from the old "path to no file" case).
2. Test that a shower is built from the panels it is handed and a made-up shower gains panels from settings alone (ARCH-03): met, `tests/showers.test.ts` "builds a shower from the panels it is handed..."; existing story tests pass (`storyStoriesAllDemos`, `demoShowers`, `domDemoStories`, `showers`).
3. Load budget (public build, 2026-10-23): perseids page 9,965,936 B raw / 6,995,644 gzip (24 files) -> 9,944,191 / 6,987,339 (20 files); geminids page 12,450,409 / 7,801,854 -> 12,430,767 / 7,794,282. Limits lowered 10,090,000/7,050,000 -> 10,070,000/7,040,000 and 12,700,000/7,900,000 -> 12,680,000/7,890,000. Met.
4. Gates: lint 2.8 s, typecheck 4.1 s, build (under flock) 0.9 s, `npm test` 33 s (1514 passed, 1 skipped), public build plus `node tools/validate/load-budget.mjs` all ok. No browser runs.

Extra reads: `tests/helpers/measuredOrbits.ts` (helper style), `src/experiences/planets/planetDefinition.ts` (how planets take panels), `docs/BROWSER_CHECKS.md` (build command grep), `package.json`, `vite.config.ts` (public-build switch). 

Limitations: the load-budget self-tests were not extended for the new `storyPanels` option; behaviour in the browser not run (owner rule). A path with no loaded file passed straight to the builder yields no panels (the entry raises the error first).


## Drift Notes

Note for Design: showers load their story lazily. Reconciled in the last step of this Objective.

## Owner Decision

Marked done by the coordinator at 2026-10-23T02:22:57Z under the owner's run rule for O-030, "Same as O-031 (Recommended)" (2026-10-23), which carries O-038's "I mark them as they pass". Gates passed at hand-off; coordinator re-ran typecheck and the showers/story tests (106 passed).
