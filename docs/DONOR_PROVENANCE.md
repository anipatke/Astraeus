# Donor provenance (Spike 01)

Donor: the owner's local checkout `/home/user/code/planetary-explorer` (read only; never edited).

## Adapted source

| Astraeus file | Donor source | What was kept / dropped |
|---|---|---|
| `src/app/AtmosphereGlow.tsx` | `src/features/moon/AtmosphereGlow.tsx`, `src/entities/earth.ts` (atmosphere values) | Rim shader and Earth atmosphere parameters kept; `layer` prop added. |
| `src/app/useBodyTexture.ts` | `src/features/moon/usePlanetTexture.ts` | Safe loader, sRGB colour space, max anisotropy kept; viewport variants and store dropped. |
| `src/app/BodyMesh.tsx` | `MoonMesh.tsx`, `CompanionMoon.tsx`, `src/entities/{earth,moon}.ts` | Sphere (64 segments) and material colour/roughness/metalness kept; drag/auto-spin rotation, hotspots, halo, store dropped. |
| `src/app/CameraController.tsx` | `useGestures.ts`, `CameraController.tsx` | Drag sensitivities, wheel/pinch zoom and tweened focus idea kept; rebuilt as an orbit camera around a focus target. Donor mesh rotation by drag is not used. |
| `src/app/AstraeusScene.tsx` (named `EarthMoonScene.tsx` until O-014; the trail line is now drawn by `PathView.ts`) | `OrbitalTrail.tsx` (line colour `#f0e6da`) | Circular `lineLoop` replaced by a sampled open trajectory line. |

Donor lighting values (now carried by the Earth and Moon visual records in `src/assets/bodies/`; Earth ambient 0.45 / directional 1.8, Moon 0.15 / 1.4) were changed to a restrained fill (Earth ambient 0.18, Moon 0.08, directional unchanged) so the day/night boundary and lunar phase read. This is a tuning choice, not a donor value.

## Texture assets (local application assets, not for redistribution)

- `src/assets/textures/earth-2k.jpg` ← `public/textures/earth-2k.jpg`
- `src/assets/textures/moon-orig-2k.jpg` ← `public/textures/moon-orig-2k.jpg`

The donor `public/textures/README.md` documents sources and licences for other bodies but has **no source or licence entry for the Earth or the original Moon texture** (its Moon section lists only `moon-2k.jpg`/`moon-4k.jpg`). Provenance is **unresolved**. These files are used only inside this local application. They must not be placed in a public package, published, or treated as redistributable until the owner establishes their origin and licence. The 4k Moon texture (~15 MB, also unattributed) was not copied.

Owner decision, 2026-10-06: the owner states both textures are publicly available and approved committing them to the public GitHub repository. A donor history check on 2026-10-06 found:

- `earth-2k.jpg` (SHA-256 prefix `228deba2e4b60014`, identical to the donor file) was added in donor commit `e65e305` (2026-04-12). The donor task note records it as a "NASA Blue Marble equirectangular texture (2048×1024)". The file is actually 4096×2048. NASA Blue Marble imagery is generally free to reuse with NASA credit. The exact Blue Marble product and URL were not recorded.
- `moon-orig-2k.jpg` (`2764ba6535ea0481`, identical) has been in the donor since its first commit, `dab0c05` (2026-04-09), originally named `moon-2k.jpg`. No source was ever recorded. In donor task 53.1 it was replaced as "misregistered" by the public-domain NASA CGI Moon Kit (SVS 4720, LROC WAC), then restored for better pole quality (`ab23531`). Its origin is still unknown. A documented, public-domain swap-in already exists: the donor's `moon-lroc-2k.jpg` (SVS 4720).

No `LICENSE*` file was found at the donor checkout root, and a grep of its `package.json` found no `license` field. No redistribution rights are claimed for donor code either.

## Texture orientation

The equirectangular Three.js sphere puts texture-centre longitude 0 on mesh +X, longitude 90°E on -Z and the pole on +Y, which is the same fixed conversion as EQJ → render. Visual checks (India/Asia shape and terminator at 2026-04-01 12:00 UTC; near-side maria and Tycho at full Moon) show no extra yaw is needed, so `textureYawRad` in the Earth and Moon visual records (`src/assets/bodies/`) is 0.

## Spike 03 — UI shell extraction candidates (T-016, 2026-10-07)

Source audit: `docs/PLANETARY_EXPLORER_UI_AUDIT.md`. The donor remains read only. **Code licence unresolved; any adapted donor code stays local-use only.** This audit does not establish redistribution rights or change the earlier texture decisions. No donor code or new assets were copied in T-016. The following sources are selected for pattern adaptation in later Tasks; this is not yet a ledger of completed code adaptations.

All donor paths below are relative to `/home/user/code/planetary-explorer`.

| Donor sources selected for adaptation | Planned Astraeus use |
|---|---|
| `src/features/moon/ControlBar.tsx` | Compact labelled actions, selected state and visible focus in `src/shell/ObjectControls.tsx` / timeline chrome |
| `src/features/intro/MobileGlobeMenu.tsx` | Semantic object buttons and touch target pattern only; no intro content, globes or textures |
| `src/features/hotspots/useHotspotSelection.ts`, `src/features/hotspots/HotspotAutoRotate.tsx`, `src/features/moon/CameraController.tsx` | Smooth focus/zoom and interruption intent in existing `src/app/CameraController.tsx`; no mesh rotation or outer-zoom mapping |
| `src/features/moon/useGestures.ts`, `src/features/moon/GestureLayer.tsx` | Canvas-only pointer/wheel/pinch interaction and cleanup; refine existing orbit gestures |
| `src/features/hotspots/HotspotMarker.tsx`, `src/features/hotspots/HotspotLayer.tsx` | Projected overlay, visibility and selected-marker patterns for generic labels; no category/ring dispatch, registry or drei requirement |
| `src/features/hotspots/BottomSheet.tsx`, `src/features/hotspots/SidePanel.tsx`, `src/features/hotspots/InfoPanelRouter.tsx` | On-demand responsive `src/shell/InfoPanel.tsx`, shared content and improved focus handling |
| `src/features/hotspots/useSwipeToDismiss.ts` | Optional handle-only sheet dismissal with Close/Escape alternatives, if implemented |
| `src/features/hotspots/BodyOverviewDetails.tsx` | Title/description/fact hierarchy; no donor facts, hardcoded Earth comparisons or encyclopaedia structure |
| `src/shared/components/Badge.tsx` | Compact textual provenance disclosure, adapted to a labelled button |
| `src/app/globals.css`, `.savepoint/visual-identity.md` | Palette, heading/data contrast, restrained spacing/motion in `src/shell/style.css`; no scanlines or font asset copying |
| `src/app/store.ts` | Explicit selection/exclusive panel-state pattern only, implemented through app-owned React state; no copied global store |

Tailwind, zustand and drei are not adopted for this spike. Font names are visual references with fallbacks; adding actual font assets requires their own source/licence record. Later Tasks must update this section with files actually adapted and any additional sources.

## Spike 03 — implemented pattern adaptations (T-020, 2026-10-10)

The following records the patterns used by the Astraeus shell. They are interaction and layout adaptations informed by the source audit, not copied donor components or cleared third-party code. The donor remains read only; code licence remains unresolved and any future adapted donor code remains local-use only.

| Audited donor pattern | Astraeus adaptation | Astraeus files |
|---|---|---|
| Compact control bar and semantic mobile selection | Labelled object and camera controls; small-screen camera mode uses a native select; active state remains explicit | `src/shell/ObjectControls.tsx`, `src/shell/style.css` |
| Tweened hotspot selection and camera framing | Experience-configured overview/focus/follow requests handled by the app camera controller; UI changes do not alter simulation time or physical readouts | `src/shell/ObjectControls.tsx`, `src/shell/AstraeusShell.tsx`, `src/app/CameraController.tsx` |
| Projected markers and restrained visual hierarchy | Generic configured scene labels and concise timeline event context, with selected/focus states kept named | `src/app/AnchorLabels.ts`, `src/shell/TimelineBar.tsx`, `src/shell/style.css` |
| Responsive side panel / bottom sheet | One shared object/event/provenance panel; mobile sheet is bounded above the persistent timeline and can be closed explicitly | `src/shell/InfoPanel.tsx`, `src/shell/AstraeusShell.tsx`, `src/shell/style.css` |
| Object overview facts and status badge | Configured descriptions and live Metric Visuals; textual provenance status opens source, accuracy, notes and limitations | `src/shell/InfoPanel.tsx`, `src/shell/ProvenanceBadge.tsx`, `src/shell/MetricVisual.tsx`, `src/shell/metrics.ts` |
| Donor palette, focus treatment and state ownership | Scoped shell CSS, visible focus styles and React-owned selection/panel state; no new global store or UI dependency | `src/shell/style.css`, `src/shell/AstraeusShell.tsx` |

No Planetary Explorer source file or asset was copied in T-020. The adaptation record does not grant publication or redistribution rights.

## Spike 04 — planet textures (T-048, 2026-10-12)

Copied unchanged from the donor `public/textures/` (read only) into `src/assets/textures/`:

| Astraeus file | Donor file | Source recorded in the donor README | Licence recorded |
|---|---|---|---|
| `mercury-2k.jpg` (2048x1024) | `mercury-2k.jpg` | Solar System Scope, `https://www.solarsystemscope.com/textures/download/2k_mercury.jpg` | CC BY 4.0 |
| `venus-2k.jpg` (2048x1024) | `venus-2k.jpg` | Solar System Scope Venus surface, `.../2k_venus_surface.jpg` | CC BY 4.0 |
| `mars-2k.jpg` (2048x1024) | `mars-2k.jpg` | Solar System Scope, derived locally by the donor from `8k_mars.jpg` | CC BY 4.0 |

The licence is the donor README's statement ("CC BY 4.0 per the Solar System Scope textures page"); the Solar System Scope page itself was not opened in T-048, so the access date in each `AssetLicence` (2026-10-12) is the date the donor record was read. The credit line each texture carries is "Solar System Scope (solarsystemscope.com/textures), CC BY 4.0, based on NASA elevation and imagery data"; the README notes the textures are based on NASA data with colour tuning and possible gap-filling. The Mars 2K file is a derivative of the 8K original (resized by the donor). The donor's balanced Venus (`venus-2k-balanced.jpg`, derived from USGS/NASA Magellan data) was not used.

**Jupiter has no texture.** The donor's `jupiter-2k.jpg` and `jupiter-4k.jpg` have no source or licence entry in its texture README (the only mention is the size-exception table). Jupiter is therefore drawn flat in the donor's material colour `#d4a97a` (roughness 0.85, metalness 0). A Jupiter texture awaits a sourced and licensed map. Because the licence is recorded, none of the three planet textures is declared local-only, so a public build may include them.

## Spike 04 — Sun texture (T-038, 2026-10-16)

`src/assets/textures/sun-2k.jpg` (2048x1024, 822 KB) is the Solar System Scope Sun map, https://www.solarsystemscope.com/textures/download/2k_sun.jpg, downloaded 2026-10-16 and copied unchanged. It is from the same set, under the same licence, as the Mercury, Venus and Mars maps above, and this time the textures page itself (https://www.solarsystemscope.com/textures/) was opened and read: it states "Distributed under Attribution 4.0 International license: You may use, adapt, and share these textures for any purpose, even commercially" (CC BY 4.0), and lists the set as based on NASA imagery. Credit line carried by the asset (`SUN_TEXTURE_LICENCE` in `src/assets/bodies/sun.ts`, checked by `textureRightsProblem`): "Sun texture: Solar System Scope (solarsystemscope.com/textures), CC BY 4.0, based on NASA imagery data". The texture is not declared local-only, so a public build includes it. It is drawn unlit on an emissive sphere at the Sun's true radius; its orientation (`textureYawRad` 0) is a visual stand-in, the real solar rotation axis and longitude are not modelled, and the Sun's information says so. The map is a stylised render, not a calibrated image.

## Spike 04 — Io texture (T-049, 2026-10-12)

`src/assets/textures/io-2k.jpg` (2048x1024) is the donor's `public/textures/io-2k.jpg`, copied unchanged (read only). The donor `public/textures/README.md` (Galilean Moons section, read 2026-10-12) records: source USGS Astrogeology Io Galileo SSI Global Color Merge Mosaic 1km (`https://astrogeology.usgs.gov/search/map/io_galileo_ssi_global_color_merge_mosaic_1km`, endpoint `Io_Galileo_SSI_Global_Mosaic_ClrMerge_1km.tif`), credit USGS Astrogeology Science Center and NASA/JPL Galileo and Voyager missions, licence "public domain; source lists no use constraints". The 2048x1024 JPEG is the donor's Lanczos resize of the 11445x5723 TIFF, with no synthetic detail. The USGS page itself was not opened in T-049, so the licence is the donor's statement of it and the access date (2026-10-12) is the date the donor record was read. Limitations the README records: mixed native resolution, visible mosaic boundaries, interpolated polar coverage, enhanced colours; a historical composite, not a current Juno map. Because the licence is recorded, the texture is not local-only and a public build may include it. The donor's flat colour `#d4b840` (`src/entities/io.ts`) is the material colour. `textureYawRad` is 0: the raster runs east-positive from -180 to +180 with 0 at the centre, like the Earth and Moon maps, and Io's tidal-lock +X axis (the sub-Jupiter point) is longitude 0; the alignment is judged by eye in the owner's look, not measured.

## Spike 04 — the sky: Milky Way image and star catalogue (T-053, 2026-10-13)

Neither source comes from the donor; both are recorded here because they are third-party material that Astraeus draws.

**Milky Way image, committed (rework 2026-10-14).** `src/assets/textures/milky-way-left.jpg` and `milky-way-right.jpg` (two 3000x3000 halves, about 3.7 MB together) are "The Milky Way panorama" (ESO eso0932a), credit **ESO/S. Brunier**, https://www.eso.org/public/images/eso0932a/, licence **CC BY 4.0** (https://www.eso.org/public/outreach/copyright/; credit stays with the image, changes are indicated, no implied ESO endorsement). Changes: ESO's largest version, the 6000x3000 "Fullsize Original" TIFF (https://cdn.eso.org/images/original/eso0932a.tif, 27.7 MB, fetched 2026-10-14; the large JPEG has the same 6000x3000 pixels), was cut into a left and a right half and each re-encoded as a progressive JPEG (quality 78, metadata stripped); no resampling, no other change. This replaces the first build's 4096x2048 downscale (about 11 px/deg; now 16.7 px/deg, the most the source has). The asset licence record is `MILKY_WAY_LICENCE` in `src/assets/sky.ts`, attached to both `MILKY_WAY_TILES` and checked by `textureRightsProblem` (PROV-02). The picture is equirectangular and galactic, longitude 0 at the centre and increasing leftwards, and is placed into the J2000 frame by a mesh in two sections (one per half), with the IAU 1958 galactic pole carried to J2000 (north pole RA 192.8594812065348, Dec +27.12825118085622, longitude of the north celestial pole 122.9319185680026; Astropy `galactic.py`, citing Blaauw et al. 1960). The rotation is exact to the constants (the galactic centre lands at RA 266.405, Dec -28.936 within 0.001 deg). The picture itself is a photographic mosaic and agrees with the true galactic frame only to a few degrees; see the T-053 evidence for the measurement. The picture can be switched off (`sky.milkyWay`, `?milkyway=off`) while the catalogue stars stay.

**Yale Bright Star Catalogue, fetched, never committed.** Owner decision (T-051 data terms): the catalogue's terms are not established as public domain, so nothing from it is committed or shipped. `tools/data/fetch-stars.mjs` downloads https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz (Hoffleit and Warren, ADC/NSSDC 1991, "5th Revised Ed., Preliminary Version"; ReadMe at the same path), keeps V <= 6.5 (8,404 of 9,110 records) with J2000 RA/Dec, V and B-V, and writes `data/local/yale-bsc-v65.json` with a provenance header. `data/local/` is git-ignored, the fetch tool needs a non-browser User-Agent (the site serves a bot-challenge page to browser-like agents), and the production build never reads that path. `tools/validate/public-build-assets.mjs` proves no file under `data/local/` (by hash, by text window or by path) reaches a public build. Without the file the sky draws the Milky Way only and the Sky item in the information panel says the stars are not fetched.
