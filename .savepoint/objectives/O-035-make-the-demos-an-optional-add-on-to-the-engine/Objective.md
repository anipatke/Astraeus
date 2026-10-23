---
id: O-035
title: Make the demos an optional add-on to the engine
status: done
depends_on: [O-034]
release: G-010
---

# O-035: Make the demos an optional add-on to the engine

## Outcome

One repository, split inside: the engine and shell become their own package, and the Apollo 11, Showers and Jupiter-Io demos (with their data) and the public site become separate packages that use it. A developer can delete the demos and the site and still build, test and run the engine's checks.

## Why

Owner, 2026-10-20: "consider someone looking this up and wanting to re-use it, the demos should be optional maybe? I know we built them for our site", then "make option 2 the next objective" (one repository split into engine, demos and site packages). Owner chose "Checks now, demos next": O-034 first.

## Success Conditions

1. **Engine alone.** The engine package (`astraeus`) builds, type-checks and passes its tests when copied into a scratch folder without any demo or the site; one script does this and is a standing fast check.
2. **Declared entry points.** Demos and the site import the engine only through the entry points its `package.json` declares; a fast test fails any import that reaches inside another package, and the engine imports no demo or site code (ARCH-01, ARCH-04).
3. **Demo-owned data.** Each demo package holds its own code, data, tools, tests, licences and credits; planet, moon, ring and star data stay in the engine (owner, 2026-10-18); the public-build licence gate still passes.
4. **Same site.** The public site looks and behaves as before: the same pages and addresses, the load budget within its limits, `npm run check:browser` once at the Full Objective Check, and the owner's look on the preview.
5. **Same commands.** `npm run lint`, `typecheck`, `build`, `test`, `test:full` and `check:browser` still work from the repository root; the Vercel deploy builds the site as before.

## Confirmed Decisions (owner, 2026-10-23)

1. **Packages**: "Engine + a package per demo + site (Recommended)" — npm workspaces, five packages: `astraeus` (engine: `src/core`, `src/assets`, `src/app`, `src/shell`, the made-up scenes in `src/synthetic`, the planet/moon/ring/star data and their importers), `astraeus-demo-apollo11`, `astraeus-demo-showers`, `astraeus-demo-planets` (the old Jupiter-Io address stays a planets alias), and `astraeus-site` (the entry `main.tsx`, the HTML pages, site pictures, public build, browser checks and deploy wiring). Demos and site are private packages.
2. **Engine-alone proof**: "Copy without demos, build and test (Recommended)" — a script copies the engine alone into a scratch folder and runs its build and tests there; no browser step for the engine alone.
3. **Engine name**: "astraeus (Recommended)" — free on npm on 2026-10-23 (the `@astraeus` scope appears taken). Publishing stays O-036.
4. **Plan** ("Yes, write these steps (Recommended)"): four steps in sequence — moves only (committed alone), entry points and the boundary guard, demo-owned data/licences/credits, then the engine-alone check, documents, Design and the owner's look. Browser check once, at the Full Objective Check.

## Architectural Considerations

ARCH-01, ARCH-03, ARCH-04, PROV-02; planet and moon data stays core, shower and Apollo data are demo add-ons (owner decisions recorded in Design). Evidence read at planning (2026-10-23): only `src/main.tsx` imports `src/experiences/` or `src/synthetic/`; `src/core`, `src/assets`, `src/app` and `src/shell` read only core data folders (`data/bodies`, `moons`, `ephemerides`, `orbits`, `rings`, the HYG stars); demo data is `data/apollo11`, `data/showers`, `data/planets`, `data/stories/*`, `data/local` (git-ignored). `src/experiences/settingsFields.ts` is shared by the demos and names none, so it belongs to the engine. Moves use `git mv` so history follows the files.

## Boundaries

**In scope:** repository layout, package boundaries, how demos are mounted, build and deploy wiring, the documents that name paths (AGENTS.md Codebase Map and Build, `docs/BROWSER_CHECKS.md`, Design).

**Out of scope:** changing what the demos show; the engine's public API shape beyond declaring today's entry points (O-036 designs the small stable API); publishing to npm (O-036); how large data ships in an npm package (O-036).
