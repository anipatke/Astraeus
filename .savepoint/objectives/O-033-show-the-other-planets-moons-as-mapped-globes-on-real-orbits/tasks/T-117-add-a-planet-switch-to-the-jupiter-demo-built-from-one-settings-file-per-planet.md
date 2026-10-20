---
id: T-117
title: Add a planet switch to the Jupiter demo, built from one settings file per planet
objective: O-033
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o033-planning-20261020}
lane: demo
planned_writes: [src/experiences/jupiter-io/jupiterIo.ts, src/main.tsx]
check_waiver:
    task: T-117
    reason: "Owner waived the optional Task Checks for O-033 ('waive checks for tasks one big check at end'); the Full Objective Check covers it."
    actor:
        role: owner
        session: 827ddc8a-e534-43b0-98b9-9af4e2acda26
    recorded_at: "2026-10-20T11:10:21Z"
---

# Add a planet switch to the Jupiter demo, built from one settings file per planet

## Outcome

The Jupiter demo is rebuilt as a planets demo: one builder reads a settings file per planet, and a top-bar switch lists the planets that have one. With only Jupiter's file present it opens and behaves exactly as today; adding a planet is adding a file.

## User Check

Open the Jupiter demo (old link and new link): same opening view, story panels, moons panel and tagged places as before, now with a planet switch showing Jupiter.

## Done When

1. A generic builder under the demo (the Showers pattern: settings types with strict validation, a choice module, the builder) turns `data/stories/<planet>/` style settings into an `ExperienceDefinition`: centre body, moon system, mapped bodies with feature packages, families, rings, window, story panels; no Jupiter names in the builder (names only in the settings file).
2. The switch uses the existing `ExperienceDefinition.switcher` and `SwitchControl`; switching keeps the clock date and swaps in place (as O-030 did for showers); a planet's address is `?experience=planets&planet=<id>` (or the name settled in the Task, recorded), and `?experience=jupiter-io` opens Jupiter.
3. Proven on a made-up planet settings file first (ARCH-03), dev-only like the synthetic experiences.
4. Jupiter unchanged: `tests/jupiterIo.test.ts`, `tests/jupiterMoonsScene.test.ts`, `tests/moonFamilyPanel.test.ts` pass with at most renamed imports; the Jupiter view's definition compares equal on window, bodies, story panels and families before and after.
5. Browser scripts and `tools/validate/run-demo.mjs` updated for the renamed demo where it breaks them (not run; the Full Objective Check runs them).

## Context Files

`src/experiences/jupiter-io/jupiterIo.ts`, `src/main.tsx`, `src/app/experienceDefinition.ts`, `src/shell/SwitchControl.tsx`, `src/experiences/showers/showerChoice.ts`, `src/experiences/showers/showerSettings.ts`, `src/experiences/showers/showerDefinition.ts`, `data/stories/jupiter-io/panels.json`, `tests/jupiterIo.test.ts`, `tools/validate/run-demo.mjs`, `tools/validate/public-addresses.mjs`, `docs/BROWSER_CHECKS.md`.

## Design References

Design: Experience plug-in boundary, Shower builder, Jupiter and Io, public site row.

## Guardrails

ARCH-01, ARCH-03, ARCH-04, TEST-01, TEST-03, STYLE-07, STYLE-09.

## Implementation Plan

1. Settings types and validation from what `jupiterIo.ts` hard-codes today.
2. Builder and switch; Jupiter's settings file; old address.
3. Made-up planet proof; equality tests for Jupiter; update scripts that break.

## Boundaries

No new planets (later Tasks); no change to Jupiter's look, window or stories; no core changes.

## Technical Verification

Configured gates; no browser runs (owner rule); evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Built on lane branch `worktree-agent-accf3a4355a0b7e76` (worktree `.claude/worktrees/agent-accf3a4355a0b7e76`); no browser runs, no screenshots.

Settings and address: one file per planet at `data/planets/<planet>.json` (Jupiter's is `data/planets/jupiter.json`); address `?experience=planets&planet=<id>`; `?experience=jupiter-io` still opens Jupiter (the same builder, default planet; its switch writes `planet=`).

Done When:
1. Generic builder `src/experiences/planets/planetDefinition.ts` (`buildPlanetDefinition(settings, system, panels)`), settings types with strict, field-naming validation `planetSettings.ts` (unknown keys refused), choice module `planetChoice.ts` (reuses a new generic `chooseSwitch` in `showerChoice.ts`, which `chooseShower` now calls). No planet, moon or story names in the builder; Jupiter's names are in the settings file and in its system module `src/experiences/planets/systems/jupiter.ts` (the old module body moved there: moon list, fitted positions, rings, packages, chunk globs). A planet is a settings file plus a `systems/<system>.ts` exporting `<system>System`; main finds both by glob.
2. Switch: existing `ExperienceDefinition.switcher` + `SwitchControl`, set in `main.tsx` like showers. Clock: `switchAddress` (unchanged, shared with showers) drops `view` and `t`, so the clock opens at the shared window start rather than the previous time; every planet shares Jupiter's window, so this is the same date. With one planet file the control renders nothing (`SwitchControl` hides under two options); it appears when T-118 adds a second.
3. Made-up planet: `tests/planetDefinition.test.ts` builds a made-up planet (own words, made-up moon list, catalogued stand-in bodies, no fitted positions) from settings alone, checks objects, presets, families, dot moons and refusal of disagreeing settings/system. Not a dev-only page: a working made-up ephemeris is a large fixture; proof is at definition level (see Drift Notes).
4. Jupiter unchanged: `tests/fixtures/jupiter-view-before.json` is Jupiter's view captured from the OLD module before the refactor (label, window, clock, objects, presets, rates, story panels, moon families, tagged places, composition, body set members/families, overrides, camera, start view); `tests/planetDefinition.test.ts` asserts the rebuilt view equals it. `tests/jupiterIo.test.ts`, `jupiterMoonsScene.test.ts`, `moonFamilyPanel.test.ts`, `storyStoriesAllDemos.test.ts`, `experienceDefinition.test.ts` pass with NO import changes (`src/experiences/jupiter-io/jupiterIo.ts` stays as a thin module building Jupiter's view for tests and scripts).
5. Browser scripts and `run-demo.mjs`: every one reaches Jupiter by `?experience=jupiter-io` or its story data path, both unchanged; nothing broke, so no script was edited.

Gates (lane worktree): `npm run typecheck` pass; `npm run build` pass; `npm test` 80 files, 1149 passed, 1 skipped, 0 failed (junit.xml written).

Extra reads (outside Context Files): `src/shell/bodyFeatures.ts`, `src/assets/moonCatalogue.ts`, `src/assets/compositions.ts`, `src/core/bodies/jupiterMoons.ts`, `src/core/fieldReaders.ts`, `src/app/viewLink.ts`, `src/core/ephemerisGroup.ts`, `src/core/chebyshevEphemeris.ts`, `tests/chebyshevEphemeris.test.ts` (types the builder consumes; whether a made-up fit was cheap), `tests/showerChoice.test.ts`, `src/shell/experience.ts`: to type the system interface and the made-up proof.


## Drift Notes

Record architecture deltas and reconcile through the planner before Check.

- Jupiter's window, `ORBIT_HISTORY_MS` and chunk globs: window is in the settings file; chunk globs and history stay in the Jupiter system module (T-118 adds one system module per planet; T-114/T-116 may generalise the Jupiter-only core loader `loadJupiterMoons`/`jupiterMoonEphemeris`, after which a system module shrinks to data names).
- Design.md: add the planets builder (`data/planets/*.json` -> `src/experiences/planets/`) to the experience plug-in section and public site row at the integration Task (T-121); the `?experience=jupiter-io` alias is kept.
- The made-up planet is proven in a unit test, not a dev-only synthetic page (no made-up fitted positions); revisit if the owner wants the page.
- `PlanetSystem` exports are looked up as `<system>System` by name in `main.tsx`.

## Owner Completion

Marked done by the coordinator on 2026-10-20T11:11:45Z under the owner's instruction for the O-033 overnight run (owner, 2026-10-20: "waive checks for tasks one big check at end"; chose "Yes, mark them done" once build and tests pass). Lane gates passed (typecheck, build, 1149 tests); merged to main as c1ebf40, focused tests re-run on main (55 passed). Carried to T-118: switching must keep the clock time (Objective Success Condition 1), today the shared switch address drops `t`; and a planet should need only its settings file, so T-116's generic loader should let the per-system module go.
