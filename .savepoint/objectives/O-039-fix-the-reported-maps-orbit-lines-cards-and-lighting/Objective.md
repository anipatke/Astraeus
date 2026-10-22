---
id: O-039
title: Fix the reported maps, orbit lines, cards and lighting
status: in_progress
depends_on: []
release: G-007
priority: high
lanes:
  - {key: maps, title: Moon map turns and Titan places}
  - {key: venus, title: Venus map and lighting}
  - {key: pluto, title: Pluto moon orbit lines}
  - {key: cards, title: Place fact cards}
  - {key: light, title: Illuminate-all switch}
  - {key: public, title: Public site shows Jupiter only}
---

# O-039: Fix the reported maps, orbit lines, cards and lighting

## Outcome

The five defects the owner reported on the preview during O-037 are repaired: Venus draws Planetary Explorer's Magellan map with its lighting (I-054); every mapped body faces the right way in the sky and Titan's places sit on their terrain (I-057); each Pluto moon's orbit line is one round lap (I-056); place and body cards read in one font with Planetary Explorer's little fact cards (I-058); and an "illuminate all" switch in settings lights the side of every body facing the viewer, off by default (I-055).

## Why

Owner, 2026-10-22: "Plan a new Objective under G-007 ... that repairs the five open owner-reported defects, before O-038". All five were found on the localhost:5490 preview during O-037 and deferred out of it because O-037 changed nothing visitors see. The owner places this repair under G-007 as an explicit exception to the Goal's "no change to what visitors see" boundary: these changes correct what visitors see.

## Success Conditions

1. **Venus (I-054).** Venus draws the donor's USGS/NASA Magellan maps, `venus-2k-balanced.jpg` below 768 px viewport width and `venus-8k-balanced.jpg` at 768 px or wider, as the donor does (`src/entities/venus.ts`), with the donor's lighting and material (ambient 0.24, directional 1.18, emissive `#4f2e16` at 0.04). The licence record, credits and `docs/DONOR_PROVENANCE.md` name USGS/NASA Magellan, public domain. Tagged places (Maxwell Montes, Aphrodite Terra, Artemis Corona) sit on their terrain.
2. **Map turns (I-057).** The mesh's longitude-zero axis is proven on Iapetus first (its dark hemisphere leads in its orbit) by a node test and the owner's look on the preview, before any other turn changes. Then Europa, Callisto, Pluto, Tethys, Dione, Rhea, Iapetus and Titan turn by half a revolution and Ganymede by none, as `docs/evidence/map-audit-20261021/report.md` measured; one node test per changed body pins its turn and checks two or three looked-up feature longitudes land on the right map column.
3. **Titan places (I-057).** Titan's places are converted when loaded (shown longitude = 180 − stored west longitude), with `data/bodies/titan/features.json` left exactly as the donor holds it; a node test checks Xanadu, Huygens landing site and Ontario Lacus against looked-up longitudes.
4. **Pluto lines (I-056).** Each Pluto-system moon's orbit line spans exactly one true lap, its period taken from the Pluto–Charon system mass, and the four small moons' lines are drawn about the Pluto–Charon balance point so they are under 1% from round while still passing through each moon. A node test measures laps and roundness for Charon, Styx, Nix, Kerberos and Hydra and shows Titan's and Phobos's lines unchanged.
5. **Cards (I-058).** Place cards show the feature type as a badge and each detail (Fun Fact, Naming origin, Map cue and the like) as its own small boxed card, ported from the donor's `FeatureDetails.tsx`; every part of every place, moon and planet card uses the shell's one UI font, with tabular figures. A node test pins the rendered card structure and the one font rule.
6. **Illuminate all (I-055).** A switch in the settings drawer, phone and desktop layouts, with no overlaps at 375x667 and 1280x720, turns on a light from the camera for every body in every demo; off by default (true sunlight). A node test covers the light choice both ways.
7. Design.md and `docs/DONOR_PROVENANCE.md` describe the result. The owner judges Venus, Iapetus, Titan, Ganymede, the Pluto view, the cards and the switch on the preview and records the verdict.
8. **Public site shows only Jupiter.** In a public build (`ASTRAEUS_PUBLIC_BUILD=1`, `__PUBLIC_BUILD__`), the planets demo offers Jupiter alone: no planet switcher, and any `&planet=` address opens Jupiter. The other eight planets' settings, maps and moon data are not in the public bundle. A local build keeps the full Mercury-to-Pluto switcher. The public-build file check (`tools/validate/public-build-assets.mjs`, node only) fails if another planet's map or settings ship.
9. The configured gates pass (lint, typecheck, build, test) and the Full Objective Check runs `npm run test:full`.

## Architectural Considerations

- **Texture variants.** Astraeus dropped the donor's viewport variants (`useBodyTexture.ts`). Venus needs one optional desktop variant on `TextureRef` (in `src/assets/licence.ts` or `src/assets/visual.ts`, wherever `TextureRef` lives), chosen once by viewport width at 768 px like the donor's `minViewportWidth`, so phones never download the 14 MB map. Other bodies keep one map (their desktop variants are out of scope).
- **Material emissive.** Venus's donor emissive needs `BodyMaterialConfig` to carry an optional emissive colour and intensity; bodies without it render as now.
- **Map turns.** `sphere()` in `src/assets/bodies/planetSystemMaps.ts` gains a yaw argument defaulting to 0; Galilean turns live in `src/assets/bodies/galileanMoons.ts`. Markers rotate with the mesh, so a turn never moves a place relative to its terrain.
- **Titan conversion** belongs where Planetary Explorer feature data is read for display, keyed by the map record's convention, not hard-coded to Titan in shell code (ARCH-01, STYLE-09).
- **Pluto lines.** The period and line centre come from the core (`src/core/bodies/moonSystem.ts`), drawn by `src/app/OrbitSetView.ts`; the core stays presentation-free (ARCH-01, ARCH-02).
- **Cards** stay in `src/shell/InfoPanel.tsx`, `src/shell/infoModel.ts` and `src/shell/style.css` (and `phone.css` if needed); no data edits.
- **Public Jupiter only.** `src/main.tsx` already gates the made-up scenes behind `__PUBLIC_BUILD__` (defined in `vite.config.ts`); the planets demo's system list follows the same flag so Vite drops the other planets' imports from the public bundle. Experiences stay data-driven (ARCH-01): the gate chooses which planet entries exist, not per-planet code paths.
- **Illuminate all** is a setting with a live control, per the owner's tune-looks rule; the lighting choice is a plain function in `src/app/lighting.ts` / `sceneLights.ts` called from the lighting stage in `src/app/sceneFrame.ts`.

## Owner Decisions (2026-10-22)

1. Venus ships both donor maps, phone 2k and desktop 8k (owner: "Both, like the donor").
2. Titan's places are converted when loading; the donor data file is untouched (owner: "Convert when loading").
3. Pluto's moon lines are one lap drawn about the balance point (owner: "One lap, drawn round the balance point").
4. Cards port the donor's boxed fact cards in Astraeus's normal UI font, not the donor's typewriter font (owner: "Donor's boxes, Astraeus's normal font").
5. "Illuminate all" lights bodies from where the viewer looks, keeping shading (owner: "A light from where you are looking").
6. No browser sets unless the owner asks, including at the Full Objective Check; the owner judges looks on the preview (owner, 2026-10-22: "no browser sets unless I ask, I judge looks on the preview"). This overrides, for this Objective, the project rule that the engine set runs at the Full Objective Check when scene, camera, controls or UI code changed.
7. Planned under G-007 although it changes what visitors see (owner, 2026-10-22).
8. The public site's planets demo shows only Jupiter; locally every planet stays inspectable (owner, 2026-10-22: "for the demo on astraeus.anipatke.com we just leave Jupiter, but locally I want to be able to inspect them all"; added to this Objective: "Yes, add it as a step here"). Deploying is the owner's own action, outside this Objective.

## Boundaries

**In scope:**
- I-054, I-055, I-056, I-057, I-058 as stated above
- Node tests for each repair; Design.md and DONOR_PROVENANCE notes
- A viewport-chosen desktop texture variant (Venus only) and an optional material emissive
- Limiting the public build's planets demo to Jupiter

**Out of scope:**
- Desktop variants for other bodies (Mars, Mercury 8k and the like), cloud or bump layers, atmosphere shells beyond today's
- Editing donor data files (`data/bodies/*/features.json`)
- Browser sets, screenshots, visual regression (owner rules)
- O-038's browser-check reduction
