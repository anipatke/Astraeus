---
id: O-067
title: Ship the 88 constellations as a data package
status: in_progress
depends_on: [O-066]
release: G-018
priority: medium
---

# O-067: Ship the 88 constellations as a data package

## Outcome

`astraeus-data-constellations`: all 88 IAU constellations' stick figures (an openly licensed set, endpoints as HIP ids), IAU boundaries (Delporte 1930, machine-readable), names and abbreviations, each source and licence recorded once; a way to add one or many by abbreviation; small download; the planet packages' pattern (peer range, `check:pack`). An example in `examples/` traces Orion in three story steps on it.

## Why

G-018: owner chose an "Optional data package" so any app can trace any constellation without redoing the data work.

## Success Conditions

- **Licence first** (PROV-02, DATA-01): the figure set, boundary set and names are chosen by the owner from a research note, with each source's licence confirmed before any data is shipped; share-alike data is acceptable (owner decision 1); the package code stays MIT and the data licence is stated in its NOTICE and README.
- **All 88**: stick figures with ends as Hipparcos numbers where the engine's star list holds the star, and star-map positions where it does not (counted and stated); IAU boundaries (Delporte 1930) as J2000 closed outlines; IAU names and three-letter abbreviations; each source recorded once with provenance (PROV-01).
- **Add by abbreviation** (owner decision 2): the package exports a helper that turns one or many abbreviations into ready `SkyFigureInput` objects (figures, and outlines when asked), with options for `shown`, colours and listing, which the app passes to `scene.addSkyFigures`; the engine gains nothing constellation-specific (ARCH-01). Unknown abbreviations throw a clear error.
- **Package pattern**: peer range on the engine minor it was built with (API-07, `check:pack` limits, `tools/build-packages.mjs`), a small download (size stated and limited), an importer tool that rebuilds the data from the recorded sources.
- **Orion example**: an example in `examples/` on the plain mount path and the packed packages traces Orion in three story steps (O-066 steps, camera, select, trace), checked like the other examples.
- README, CHANGELOG, Design reconciled before the Full Objective Check; one `npm run check:browser` at the Full Check; the owner looks at the Orion example.

## Decisions (owner, 2026-11-10, session o067-planning-20261110)

- **Licence:** "Share-alike is fine" — a CC BY-SA (or similar share-alike) figure set is acceptable, like the engine's HYG star list.
- **How apps add them:** "Package hands back figures" — e.g. `scene.addSkyFigures(constellations(["Ori", "Tau"]))`; no engine call that knows the package.
- Planner: research first (bounded Task with a named deliverable, as O-063); the build steps are detailed after the owner chooses a source.

## Architectural Considerations

The package follows `astraeus-data-pluto`'s pattern (own `package.json` with `x-publish`, `NOTICE`, `src/index.ts`, `data/`, listed in `tools/build-packages.mjs` and `tools/check-packs.mjs`). Its helper returns public `SkyFigureInput` shapes only (API-01: imports `astraeus` types from the front door). The engine's star list holds V <= 6.5 stars with HIP ids (O-065 T-294); `unknown-star` is thrown at scene build for an id it lacks, so the package must choose ends the engine can resolve. Story data stays out of the engine (owner rule).

## Boundaries

**In scope:** the research note, the package, its import tool, provenance, the helper, the Orion example.
**Out of scope:** facts and myths (story apps own them); the Zodiac app; engine changes beyond any defect found; precession; star names.
