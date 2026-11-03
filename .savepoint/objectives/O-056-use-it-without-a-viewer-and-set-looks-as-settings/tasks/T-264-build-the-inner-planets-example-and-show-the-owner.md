---
id: T-264
title: Build the inner planets example and show the owner
objective: O-056
status: done
depends_on: [{task: T-263, requires: clear}]
owner_validation: {required: true}
check_waiver: {task: T-264, reason: 'Owner said "Orchestrate o56" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o056-run-20261103}, recorded_at: '2026-11-03T10:45:35Z'}
planned_by: {role: planner, session: o056-planning-20261103}
---

# Build the inner planets example and show the owner

## Outcome

A third, non-probe example app proves the new settings and controls for any app, the notes and Design describe what O-056 built, and the owner has looked at the example (O-056 Success Conditions 7 and 8; owner decision 3).

## User Check

On `localhost:5490` (the owner's preview; see `docs/agents/browser-policy.md` for how the example is served there), open the inner planets example at 375x667 and 1280x720: the Sun to Mars fill the view; the app's own sliders change star brightness, Milky Way and Sun glow live; the scale switch changes scale; a planet's info card shows its distance from the Sun; nothing overlaps.

## Done When

- New `examples/hello-planets/` (Vite, plain `mount`, no React, no data package), consuming the packed `astraeus` tarball like `examples/hello-scene`: a Sun-centred scene of the Sun, Mercury, Venus, Earth and Mars with orbit lines, `camera.fitOrbit`, `scene.setLook` defaults, a "distance from Sun" readout on Earth (or Mars), and host UI (its own sliders and a scale switch) driving `handle.setLook` and `handle.setScale`. No probe, path or mission name. Phone layout from the first build; no overlap at 375x667 or 1280x720.
- `npm run build:example` builds it; a smoke step for it joins the existing example step in `check:browser` (not run here; the Full Objective Check runs it once). Its first download stays inside the engine budget (`tools/validate/engine-budget.mjs` unchanged).
- README: short sections for `scene.load` / `scene.check`, the scene reads, `LookInput` with the address-override table, the new handle members and event zones; the CHANGELOG (Unreleased) is complete for O-056, including the `toDefinition` migration table from the reads step.
- Design reconciled: `.savepoint/Design.md` gets one O-056 paragraph in `Interfaces and Data Flow` (load and check, reads, looks and the one table, live controls, event zones, the example), the codebase map lists `examples/hello-planets` and new test files, the `O-053 checks` drift line about the `public` settings map is updated, and every O-056 step's Drift Notes is accounted for as reflected or non-architectural with a reason (AGENTS.md "Deferred Design reconciliation").
- Owner validation recorded after the owner looks.
- **Surface:** `npm run api:lock` regenerated and the lock diff limited to the members this step adds; CHANGELOG (Unreleased) and the README API tables updated in the same change; `apiSurface`, `apiRules` and `allowlistGrowth` tests pass (no allowlist group grows).
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`examples/hello-scene/` (its `package.json`, `index.html` and `src/` files; list them first), `tools/build-example.mjs`, `packages/astraeus-site/tools/validate/run-browser.mjs`, `docs/BROWSER_CHECKS.md`, `docs/agents/browser-policy.md`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md` (or the root CHANGELOG; locate it), `.savepoint/Design.md`, every earlier O-056 step file (Drift Notes and Technical Evidence only).

## Design References

`.savepoint/Design.md` under `Components/Codebase Map`, `Interfaces and Data Flow` and `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-02, API-04, API-05, API-06, ARCH-02, ARCH-03, ARCH-06, TEST-01, TEST-03, STYLE-02, STYLE-07, STYLE-10, CODE-01, PROV-01.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Copy the `hello-scene` structure; build the scene and the host controls.
3. Wire `build:example` and the browser step.
4. README, CHANGELOG, Design reconciliation.
5. Gates, `npm run build:example`; hand to the coordinator for the owner look.

## Boundaries

Do not edit `docs/prds/`, `docs/research/` or the G-012 to G-014 `Release.md` files. No renames of existing members and no removal of `toDefinition` (O-057). No change to the existing examples beyond shared build wiring. No screenshots (owner).

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus the named `check:*` scripts. No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`. Also `npm run check:pack` and `npm run build:example`.

## Technical Evidence

Per criterion:
- New `examples/hello-planets/` (Vite, plain `mount`, no React, no data package, packed tarball): met. Sun, Mercury, Venus, Earth, Mars with `orbit: true` and `enlarge: 60`, `solarSystemScale`, `camera.fitOrbit(mars)`, `scene.setLook` defaults, a `range` readout (distance from the Sun) on Earth; three sliders (star brightness, Sun glow brightness, Sun glow size) and a scale button drive `handle.setLook` / `handle.setScale`. The controls are a strip under the viewer (flex column), so nothing overlaps by construction; narrow screens use a two-column grid. No Milky Way slider: the picture needs `astraeus-data`, absent here (stated in code comment, README, CHANGELOG).
- `npm run build:example` builds it (EXAMPLES in `tools/build-example.mjs`); browser step `hello-planets` added to `run-browser.mjs`, port list in `runner.mjs`, script `check-hello-planets.mjs`, driver functions `setHostSlider`, `pressHostButton`, `hostControlText`, `hostControlsFit`. The whole suite was NOT run. The one new script was run once alone against a preview on port 5483 at 1280x720 and 375x667: ok, no errors (stars slider read back 0.4 from the sky, scale solar-system to true-scale, no overlap, Earth card names the Sun). Engine budget: `node tools/measure-example.mjs` (hello-scene) first-open 1,685,581 raw / 484,411 gzip, under 1,735,000 / 497,000; `engine-budget.mjs` unchanged.
- README ("Your own controls" section plus pointers; `scene.load`, `scene.check`, reads, `LookInput` with address table, handle members, event zones were already in from T-259..T-263) and CHANGELOG (Unreleased has an entry per step and the `toDefinition` migration table): met.
- Design: one O-056 paragraph in Interfaces and Data Flow, map rows (`examples/hello-planets`, new tests), the `public` settings map drift line and "Allowlist growth" bullet updated, and a drift accounting list covering T-259..T-263 (reflected or non-architectural with reasons; API-04 vs lint named as a tension for O-057): met.
- Owner validation: NOT recorded; pending the owner look (coordinator).
- Surface: no public API change in this step, so `api:lock` not regenerated (apiSurface test passes in `npm test`).
- Gates (all pass): `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` (207 files, 2605 passed, 2 skipped), `npm run check:pack` (pass), `npm run build:example` (all three examples built).

Files read beyond Context Files: `docs/architecture` none; `packages/astraeus-site/tools/validate/harness.mjs`, `runner.mjs`, `driver.mjs` (sections) to wire the step; `docs/agents/build.md`, `docs/BROWSER_CHECKS.md` (edited).
Files changed: examples/hello-planets/{.gitignore,package.json,index.html,src/main.js}; tools/build-example.mjs; packages/astraeus-site/tools/validate/{run-browser.mjs,runner.mjs,driver.mjs,check-hello-planets.mjs}; packages/astraeus/{README.md,CHANGELOG.md}; .savepoint/Design.md; docs/BROWSER_CHECKS.md; docs/agents/build.md; this Task file.

Showing the owner (coordinator): `cd /home/user/code/Astraeus && node tools/build-example.mjs hello-planets && npx vite preview examples/hello-planets --port 5490 --strictPort --host localhost` then open http://localhost:5490/ (or use another free port; 5490 is the owner's preview port, stop whatever holds it first). Check at 375x667 and 1280x720.

Limitations: the preview I started on port 5483 for the single script run could not be stopped by me (kill was denied); it may still be running (`pgrep -af "vite preview examples/hello-planets"`). The look itself is unjudged (owner). The hello-planets first download was not measured against any budget (none exists for it).
- Owner look (2026-11-03T10:45:35Z, session o056-run-20261103): the owner was given http://localhost:5490/ (`vite preview examples/hello-planets`, built from dbbaaa45 plus this step's work) to check at 375x667 and 1280x720 — five bodies with orbit lines filling the view, the three sliders acting live, the scale button, Earth's distance-from-Sun readout, no overlaps — and answered "looks right".

## Drift Notes

None beyond the reconciliation itself; the browser step needed `runner.mjs` EXAMPLE_NAMES and four driver helpers, noted in the Technical Evidence.
