---
id: O-018
title: Bring Planetary Explorer's mapped moons into Astraeus
status: planned
depends_on: [O-017]
release: G-005
---

# O-018: Bring Planetary Explorer's mapped moons into Astraeus

## Outcome

Astraeus can take any body Planetary Explorer has already built (its surface map, its tagged surface features, its feature categories and its overview facts) and show it as a globe with those features marked, selectable and explained. The means to do this is reusable at any time for any of Planetary Explorer's 24 bodies. The first release uses it for every moon Planetary Explorer has mapped, and the assets catalogue lists each one. The deploy waits for this Objective and O-017.

## Why

Owner, 2026-10-17: "we have each moon already mapped built and tagged with interesting features (and the means to do so) as part of planetary explorer. this was effort, I want to re-use this anytime", and "update the catalogue". Planetary Explorer (the owner's own earlier project) holds, per body: a map with a recorded source (`public/textures/README.md`, `CREDITS.md`), a feature list of 8 to 32 named places with latitude, longitude, type, category, description, tags and details (`data/<body>-features.json`, coordinates from the USGS Gazetteer of Planetary Nomenclature), category colours and camera settings (`src/entities/<body>.ts`), overview facts with sources (`data/body-overviews.json`), each map's coordinate convention and control checks (the README notes), and the hotspot interface that places, filters and opens them (`src/features/hotspots/`). Rebuilding any of it would repeat that effort.

## Success Conditions

1. **Reuse rights recorded.** The owner's statement that Planetary Explorer is their own work and that its data, maps and code may be reused and published in Astraeus is recorded (owner decision, below) in `docs/DONOR_PROVENANCE.md`, replacing the "code licence unresolved; local use only" note for what this Objective uses. Third-party map and fact sources keep their own credits (PROV-02).
2. **A body package format.** One data package per body: map file and licence record, the map's coordinate convention (east or west positive, longitude range, any offset, as in the donor's README notes), features, categories with colours, overview facts and their sources. It is story or asset data, never engine code (ARCH-01).
3. **An importer: "the means to do so".** A committed tool reads a Planetary Explorer body (`src/entities/<body>.ts`, `data/<body>-features.json`, `data/body-overviews.json`, the texture and its README entry) and writes the Astraeus package, converting coordinates by the recorded convention. It works for every one of the 24 donor bodies (a dry run lists each body and what it would write), records the donor commit it read, and refuses a map with no recorded source. Running it again with an unchanged donor produces identical output.
4. **Surface features on a globe: a generic capability.** Any globe body can carry features: markers placed by latitude and longitude, hidden on the far side, coloured by category, filterable by category, selectable to open the information panel with the feature's description, details, tags and source, and a focus that turns the globe to face a feature. Proven first on a made-up body with made-up features (ARCH-03). No body names in `src/core/` or the shell. The story-panel and info-panel parts already ported from Planetary Explorer are reused, not duplicated (STYLE-07).
5. **Every mapped moon ships.** Imported through the tool: Europa, Ganymede, Callisto, Io, Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus, Triton and Charon with all their features (about 190 in all), plus the Moon. Each map at a true 2:1 size within the load budget (Charon re-derived from the full USGS 2017 mosaic; Dione and Triton resized; Ganymede's 180-degree re-centring recorded), with an `AssetLicence` record.
6. **A Moons experience.** Each moon is a globe the viewer can rotate and zoom, with its features, its parent planet, size and overview facts. How the globes are arranged (a row, a grid, or by parent) is a presentation choice settled at planning and labelled illustrative, not an orbit (PROV-01). Io keeps its existing real orbit in Jupiter–Io and gains its features there too.
7. **Feature positions are right.** For each moon, at least two control features from the donor's README notes or the USGS Gazetteer land on the matching spot of the rendered map (an independent check, not the importer's own conversion), recorded with screenshots.
8. **Pictures and features load only when used.** No other experience gets heavier; O-017's load-size budget passes with a stated limit for the Moons page.
9. **The catalogue is updated.** `assets.html` lists each shipped moon map and its feature source (USGS Gazetteer) under Surface pictures and Credits; the "Traced, not in the app yet" section and the wish list shrink to match; `tests/assetsPageCredits.test.ts` checks each new row against its licence record.
10. **Checks.** Configured gates, the lite browser check, a browser check for the Moons experience and for feature selection at desktop and phone sizes with zero console errors, the public build with the asset validator, and the owner's look.

## Architectural Considerations

- Body definition rule (ARCH-05): a moon shown as a globe without a real orbit must not pretend to have one. Planning settles whether each moon is a catalogued body with an illustrative fixed placement or the globes sit outside scientific State as presentation (ARCH-02); the choice is recorded and labelled.
- Surface coordinates are a body-fixed frame. Feature placement uses the body's existing orientation where one exists (the Moon, Io) so features stay on the right spot as the body turns.
- Donor code is adapted to Astraeus's contracts (no Zustand store, no donor registry); data is imported, not hand-copied.
- The donor repository stays read-only; the importer reads it, never writes it.

## Owner Decisions — 2026-10-17

1. **Scope:** every moon Planetary Explorer has mapped, as globes you can spin, with their tagged features. Superseded in part the same day: the owner then directed that the donor data be enriched with real orbits and correct positions, and that the launch wait for them; that work is O-019, which builds on this Objective.
2. **Reuse:** Planetary Explorer's maps, features, categories, facts and the means of building them are to be reused, at any time, for any body ("this was effort, I want to re-use this anytime").
3. **Planetary Explorer is the owner's own work; its data and code may be reused and published in Astraeus.** Confirmed by the owner in chat, 2026-10-17 ("thats right"). This replaces the earlier "code licence unresolved; local use only" note; O-018 records it in `docs/DONOR_PROVENANCE.md`.
4. **Order:** after O-017 (simplify), before the deploy.
5. **Update the catalogue** with every shipped moon.

## Boundaries

**In scope:**
- The importer and package format for any donor body; the generic surface-feature capability; the moons, their features, the Moons experience; the catalogue; tests and checks.

**Out of scope:**
- Real orbital positions, orientations and parent planets for the new moons (O-019); shipping the planets Saturn, Uranus, Neptune, Pluto or Ceres and the rings in this release (the importer supports them; shipping them is a later choice); Phobos and Deimos and small moons (no global maps); Uranus's five main moons (no maps in the donor); Ceres's untraced colouring; the donor's missions, satellites and intro screens.
