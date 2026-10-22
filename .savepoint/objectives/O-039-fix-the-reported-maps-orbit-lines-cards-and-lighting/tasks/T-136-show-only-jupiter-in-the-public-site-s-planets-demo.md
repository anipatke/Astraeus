---
id: T-136
title: Show only Jupiter in the public site's planets demo
objective: O-039
status: done
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

Lane build (worktree lane-t136); router not touched.

Per criterion:
- Planet lists follow `__PUBLIC_BUILD__` (`src/main.tsx`): the public build's globs name only `jupiter.json` and `systems/jupiter.ts`. Public build contains no other planet's system chunk or settings (`planets.ok: true`, matches empty). A local build (`npm run build`) still emits all nine planet system chunks and the nine-planet glob is unchanged.
- One planet, no switcher: `choosePlanet` already returns a one-option switcher for one entry, and `TopBar` hides a switcher with 1 option (`options.length > 1`), so no change to `planetChoice.ts`. Any `&planet=` value falls to the default/first, i.e. Jupiter (tests/planetChoice.test.ts).
- `tools/validate/public-build-assets.mjs` gains `checkOnlyPublicPlanets` + `proveOnlyPublicPlanets` (fails on another planet's map/system chunk file or `system: "<planet>"` settings text; self-proof wired into the CLI result). `tests/publicBuild.test.ts` covers it.
- Node test for the one-planet choice: new `tests/planetChoice.test.ts`.
- Owner verdict: pending.

Public page sizes (`node tools/validate/public-build-assets.mjs dist`, load-budget, raw / gzip bytes), before (baseline of this branch) -> after:
- index.html 399,236 / 352,149 -> unchanged
- assets.html 630,527 / 493,237 -> unchanged
- Apollo 4,200,536 / 2,768,082 -> 4,190,181 / 2,765,999
- planets jupiter 6,787,312 / 4,662,366 -> 6,776,965 / 4,660,298
- planets saturn, uranus, neptune, pluto, mercury, venus, earth, mars: 23,344,130; 4,109,969; 4,404,340; 3,844,724; 2,935,744; 2,950,508; 4,209,352; 2,793,211 raw before -> no longer in a public build (their page sets are not held against it)
- showers 9,764,902 / 6,791,223 -> 9,754,551 / 6,789,160; geminids 12,249,375 / 7,597,433 -> 12,239,024 / 7,595,370
- whole build 202 files 52,079,128 / 42,044,384 -> 101 files 25,793,015 / 17,170,452

Commands (from the lane directory): `ASTRAEUS_PUBLIC_BUILD=1 flock /tmp/astraeus-build.lock npm run build` then `node tools/validate/public-build-assets.mjs dist` (exit 0, `ok: true`) both before the edits and after; `npm run lint` pass; `npm run typecheck` pass; `flock /tmp/astraeus-build.lock npm run build` pass; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` 94 files, 1296 passed, 1 skipped (run before adding two `.d.mts` declarations; the two focused files re-run after: 25 passed). No browser scripts, screenshots or servers.

Deviations from the plan (for the owner):
1. `src/main.tsx` alone could not keep the other planets' maps out: the body catalogue (`src/assets/catalogue.ts` -> `planetSystemMaps.ts`) imports Saturn/Uranus/Neptune/Pluto and moon maps eagerly. Added `PLANETS_DEMO_ONLY_TEXTURES` in `vite.config.ts`: in a public build those 13 maps resolve to the 1x1 placeholder (same alias route as `LOCAL_ONLY_TEXTURES`). Local builds unaffected.
2. `tools/validate/load-budget.mjs` (a Context File, not a planned write) now exports `PUBLIC_PLANETS = ["jupiter"]` and `NON_PUBLIC_PLANET_FILES`; `PAGES` holds only Jupiter's planet view, since the other eight page sets would fail "not in the build" on a Jupiter-only build. Their limits stay in `ALL_PAGES` for local reference. Also edited the two `.d.mts` declaration files.
3. Not removed: the `<planet>-moons.js` curve-fit index chunks (core body records in `src/core/bodies/planetMoons.ts` lazy-load them; never fetched by the public page, still in `dist`) and the Mercury/Venus/Mars/Earth maps (catalogue bodies). Removing them needs a core change (ARCH-01), so it is left for the owner to decide. The whole-build limit (`BUILD_LIMIT`) was not lowered; it could now be tightened.
4. `planetChoice.ts` needed no change.

Limitations: the public preview was not run (no servers); `?planet=mars` opening Jupiter is proved by the node test of `choosePlanet`, not in a browser.

Owner look on preview: pending. Look at: build the public site (`ASTRAEUS_PUBLIC_BUILD=1 npm run build`) and serve `dist/` on localhost:5490: `/app.html?experience=planets` shows Jupiter and its moons with no planet switcher; `/app.html?experience=planets&planet=mars` also opens Jupiter. Then on a normal local preview (localhost:5490, `npm run build` or the dev server) the planets demo still shows the Mercury-to-Pluto switcher and every planet's map.

## Drift Notes

Deferred to T-137.
