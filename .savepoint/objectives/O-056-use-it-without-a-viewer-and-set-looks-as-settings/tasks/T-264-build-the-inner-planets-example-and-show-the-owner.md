---
id: T-264
title: Build the inner planets example and show the owner
objective: O-056
status: planned
depends_on: [{task: T-263, requires: clear}]
owner_validation: {required: true}
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

Pending execution.

## Drift Notes

None expected beyond the reconciliation itself.
