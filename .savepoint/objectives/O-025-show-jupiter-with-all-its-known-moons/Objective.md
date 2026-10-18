---
id: O-025
title: Show Jupiter with all its known moons
status: planned
depends_on: [O-020]
release: G-005
---

# O-025: Show Jupiter with all its known moons

## Outcome

The Jupiter demo shows every known moon of Jupiter where NASA places it: Io, Europa, Ganymede and Callisto as full textured worlds with their Planetary Explorer pictures and tagged places, and every other moon as a small grey dot that becomes a small grey ball up close, named on hover, tap or zoom.

## Why

Owner, 2026-10-18 (G-005 Launch Definition of Done): "we expand Jupiter to ALL its moons, objects for the ones we have skinned, either simple labels or small grey balls (or what we think they look like) for the rest."

## Confirmed Decisions (owner, 2026-10-18)

1. Four textured moons (Io, Europa, Ganymede, Callisto) from the O-018 import (T-077); their verified coordinates and tagged places carried bit for bit (owner rule: never "corrected").
2. The rest: grey dots, a grey ball when close, names on hover, tap or zoom (owner chose over all-labelled and best-guess looks).
3. Positions exact from NASA JPL Horizons tables for every moon (owner chose over approximate published orbits); this takes the O-019 T-078 finding (mean elements fail for some moons) for Jupiter.

## Architectural Decision (owner, 2026-10-18)

8. **Moon data is core** (owner: "all this moon data will be part of the core package, unlike shower data and Apollo data which are add one for the demo"): Jupiter's moon positions (the Horizons tables), the moon list and family groups, the four textured moons' body packages and tagged places, and the ring bands belong to Astraeus's reusable core assets, usable by any experience — not to the Jupiter demo. The demo is a thin story layer on top (its window, start view, story panels). Shower meteor data and Apollo 11's mission data stay demo add-ons (owner rule, 2026-10-16). Core data still is data, never engine code (ARCH-01; `data/bodies/README.md`), each set with its source and licence (PROV-02). Owner: "User may choose to omit them for a story, but we'll model it and leave it on the shelf": the core models every moon; an experience chooses which bodies to show (for example a story may show only the big four), and the rest stay available in the catalogue ("on the shelf").
   - Planning question that follows: the core tables' time span. A core asset serves any date an experience asks for, not only the demo's year; the span (for example 1950-2050 at a step fine enough for the inner moons) is set against the load budget, with only the demo's needed span fetched at run time.

9. **Curve-fit format, no database** (owner, 2026-10-18, after a comparison of Postgres, SQLite in the browser, static tables and NASA-style curve fits: "Ok curve fit"): core moon positions ship as piecewise polynomial (Chebyshev) fits sampled from JPL Horizons, the approach of NASA's SPICE kernels, chunked by planet and time span so an experience downloads only what it needs; no Postgres or in-browser database. The first step proves the format for Jupiter: file size against raw tables, accuracy against Horizons at sample dates (metre-level target, recorded per moon), and evaluation time on a phone-class device. A local authoring store (SQLite or DuckDB) as the master copy is optional, used only if it simplifies import and checking; the browser never sees it. Small moons draw as one batch (as the showers' points do) and names appear only on hover, tap or zoom, which matter more for smoothness than the data format.

10. **Show off the curve fits on the home page** (owner, 2026-10-18, after a plain explanation of curve fits: "Sounds like a cool thing to show off on the main page"): once the format is proven, the Astraeus home page (`index.html`) gains a short section explaining it in plain words — many position "photos" versus a few short "recipes" — with a small live visual (for example one moon's path drawn from table dots and from the fitted curve, with a slider that moves through time and the measured size saving and accuracy against NASA shown beside it). Built from the real fitted data, within the home page's load budget; owner look.

11. **Planet positions as curve fits too** (owner, 2026-10-18, accepted the optimisation list): the planet position series (`planetModels` chunk, about 1.4 MB in the public build) is core data like the moons, so once the curve-fit format is proven for Jupiter's moons, Jupiter's own position and the other planets' positions move to the same format if it is smaller at equal accuracy (measured; the planet accuracy checks C-022/C-023 still pass).

## Success Conditions

1. Every moon Horizons lists for Jupiter at build time is present, with its name and source; the count and the table date are recorded and shown in the information panel and the details.
2. Positions from Horizons-sampled tables across the demo's window, checked against Horizons at sample dates (as Io was, C-022/C-023).
3. The four textured moons show their tagged places as the Planetary Explorer import defines them.
4. Small moons stay visible as dots at any distance (pixel floor), become grey balls at their real size up close, and names appear on hover, tap or zoom without cluttering the view.
5. Data size within the public load budget (tables compressed or streamed); scene performance on a phone holds (one chunk of work per frame, as the showers do).
6. Browser checks through the shared driver; full run passes; owner look.

4. **Date window** (owner, 2026-10-18): the demo starts on **4 November 2016** ("Actually, 4 Nov 2016, the day my son was born"), replacing the January 2000 start; the window runs a year so the outer moons' orbits show.
5. **Name** (owner, "yes"): "Jupiter and its moons".
6. **Moon groups panel** (owner, 2026-10-18: "97 moons is a lot, are there some logical groupings ... a sliding panel where the user can scroll through and on click touch opens an info panel"; approved "Looks good"): a sliding panel (the phone drawer on phones) listing the moons by family — the big four (Galilean, always shown with pictures), inner moons (Amalthea group), Himalia group, Ananke group, Carme group, Pasiphae group, loners (Themisto, Carpo, Valetudo and the like) — each a collapsible section with a plain one-line description and a count; named moons first, provisional designations folded into a "+N unnamed" row; tapping a group heading highlights that family's dots and orbits in the scene; tapping a moon focuses it and opens its information panel; a small search box. Group membership comes from a published source (JPL/Sheppard's moon pages) recorded with the data. Reuses the collapsible part and drawers from O-020.
7. **Faint rings** (owner, 2026-10-18: "can we also apply faint rings like in planetary explorer?"): Planetary Explorer's Jupiter ring system lifted as-is — four flat bands (halo #a0b0d0 0.105, main #d0a080 0.28, Amalthea/inner Thebe gossamer #b08060 0.065, outer Thebe gossamer #a07050 0.026; `src/entities/jupiter.ts` ringSystem, `src/features/moon/PlanetRingSystem.tsx`) — with one named deviation the owner chose ("Your look, real distances"): each band sits at the real ring's distance (halo about 1.4-1.7, main about 1.72-1.81, gossamer out to about 3.1 Jupiter radii, from a published source), so the true-scale inner moons sit in the rings they feed. Opacities and colours are live settings.

## Open Questions (to settle when this Objective is planned)

- The three Io stories are pinned to January 2000 and must move into the new window; "The most volcanic world we know" refers to Galileo's flyby "a few weeks before this scene" and needs new wording. NASA's Juno was in orbit around Jupiter on 4 November 2016 (arrived July 2016), a possible story tie-in.
- Moons discovered after 2016 still have Horizons positions for 2016 (computed from their orbits); their larger uncertainty goes in the details.

## Boundaries

**In scope:** Jupiter's moons, their data, look, names and checks.

**Out of scope:** other planets' moons and rings (O-018, O-019 beyond Jupiter); Juno or other spacecraft.
