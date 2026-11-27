---
id: G-028
title: Ceres as a mapped globe
status: done
---

## Outcome

Ceres is a ready-made Astraeus body like Pluto: accurate positions from JPL Horizons (1950 to 2045), its IAU spin, its 469.7 km sphere, the true-grey USGS/DLR Dawn global mosaic as its picture and the 8 tagged places imported from Planetary Explorer in O-018 (Occator's bright spots, Ahuna Mons and six craters), so a host such as the belt app (`/home/user/code/belt`) can add `ceres` and fly in to a mapped, tappable globe.

## Why

Owner, 2026-11-27: "feel like we forgot we had skinned ceres and gave it intersting points too in our donor project", then "would be a neat easter egg for belts" and "new goal please proceed". Planner findings (session plan-g028-20261127): Ceres's places, categories and overview were imported by O-018 T-077 (`packages/astraeus-data/data/bodies/ceres/`), but the donor picture `ceres-2k.jpg` is marked not shippable (colour and yellow-green polar fill untraced; geometry matches the USGS/DLR Dawn FC mosaic after a 180 degree shift, `docs/DONOR_TEXTURE_INVENTORY.md` section C), Ceres has no position source in the engine, and I-032's closure (2026-10-24) filed the remainder as demo content. A host-added elements body (`addBodyFromElements`, the belt's current Ceres) draws only as a marker with no picture or spin, so places could not be placed on it.

## Decisions

Owner answers, 2026-11-27 (asked one at a time):

1. "Ceres ready-made": Ceres becomes a catalogued body with the engine's own Horizons fit and IAU rotation (pck00011: pole RA 291.418, Dec 66.764, W 170.650 + 952.1532 d), not a picture option on host-added bodies.
2. "True grey USGS map": the picture is the USGS/DLR Ceres Dawn FC Global Mosaic, untinted, credited per its "please cite authors" constraint; the donor file is not shipped.
3. "Load only when used": Ceres's position series is not in the engine's first download (engine cap headroom was about 277 B raw, 765 B gzip at 0.12.1); it is fetched only when a scene holds Ceres.

## Success Conditions

- `scene.addBody("ceres")` (with the data that carries Ceres) draws a sphere with the USGS picture at true radius, spinning per IAU, placed from the Horizons fit within the stated accuracy; the 8 places land on the features they name (owner look on localhost:5490 against Planetary Explorer).
- The engine's first-download measurement is unchanged by Ceres's data (no cap raise).
- Ceres's provenance (positions, radius, rotation, picture, places) shows on its card and in the provenance notes.

## Boundaries

**In scope:** Ceres only: fit, body definition, picture, places wiring, docs, one local proving view.

**Out of scope:** Vesta, Pallas, Hygiea or a general picture option for host-added bodies; tinting; changes in the belt app (the belt adopts it in its own repo; this Goal hands it a short note).
