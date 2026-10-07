# Donor provenance (Spike 01)

Donor: the owner's local checkout `/home/user/code/planetary-explorer` (read only; never edited).

## Adapted source

| Astraeus file | Donor source | What was kept / dropped |
|---|---|---|
| `src/app/AtmosphereGlow.tsx` | `src/features/moon/AtmosphereGlow.tsx`, `src/entities/earth.ts` (atmosphere values) | Rim shader and Earth atmosphere parameters kept; `layer` prop added. |
| `src/app/useBodyTexture.ts` | `src/features/moon/usePlanetTexture.ts` | Safe loader, sRGB colour space, max anisotropy kept; viewport variants and store dropped. |
| `src/app/BodyMesh.tsx` | `MoonMesh.tsx`, `CompanionMoon.tsx`, `src/entities/{earth,moon}.ts` | Sphere (64 segments) and material colour/roughness/metalness kept; drag/auto-spin rotation, hotspots, halo, store dropped. |
| `src/app/CameraController.tsx` | `useGestures.ts`, `CameraController.tsx` | Drag sensitivities, wheel/pinch zoom and tweened focus idea kept; rebuilt as an orbit camera around a focus target. Donor mesh rotation by drag is not used. |
| `src/app/EarthMoonScene.tsx` | `OrbitalTrail.tsx` (line colour `#f0e6da`) | Circular `lineLoop` replaced by a sampled open trajectory line. |

Donor lighting values (Earth ambient 0.45 / directional 1.8, Moon 0.15 / 1.4) were changed to a restrained fill (Earth ambient 0.18, Moon 0.08, directional unchanged) so the day/night boundary and lunar phase read. This is a tuning choice, not a donor value.

## Texture assets (local application assets, not for redistribution)

- `src/app/assets/textures/earth-2k.jpg` ← `public/textures/earth-2k.jpg`
- `src/app/assets/textures/moon-orig-2k.jpg` ← `public/textures/moon-orig-2k.jpg`

The donor `public/textures/README.md` documents sources and licences for other bodies but has **no source or licence entry for the Earth or the original Moon texture** (its Moon section lists only `moon-2k.jpg`/`moon-4k.jpg`). Provenance is **unresolved**. These files are used only inside this local application. They must not be placed in a public package, published, or treated as redistributable until the owner establishes their origin and licence. The 4k Moon texture (~15 MB, also unattributed) was not copied.

Owner decision, 2026-10-06: the owner states both textures are publicly available and approved committing them to the public GitHub repository. A donor history check on 2026-10-06 found:

- `earth-2k.jpg` (SHA-256 prefix `228deba2e4b60014`, identical to the donor file) was added in donor commit `e65e305` (2026-04-12). The donor task note records it as a "NASA Blue Marble equirectangular texture (2048×1024)". The file is actually 4096×2048. NASA Blue Marble imagery is generally free to reuse with NASA credit. The exact Blue Marble product and URL were not recorded.
- `moon-orig-2k.jpg` (`2764ba6535ea0481`, identical) has been in the donor since its first commit, `dab0c05` (2026-04-09), originally named `moon-2k.jpg`. No source was ever recorded. In donor task 53.1 it was replaced as "misregistered" by the public-domain NASA CGI Moon Kit (SVS 4720, LROC WAC), then restored for better pole quality (`ab23531`). Its origin is still unknown. A documented, public-domain swap-in already exists: the donor's `moon-lroc-2k.jpg` (SVS 4720).

No `LICENSE*` file was found at the donor checkout root, and a grep of its `package.json` found no `license` field. No redistribution rights are claimed for donor code either.

## Texture orientation

The equirectangular Three.js sphere puts texture-centre longitude 0 on mesh +X, longitude 90°E on -Z and the pole on +Y, which is the same fixed conversion as EQJ → render. Visual checks (India/Asia shape and terminator at 2026-04-01 12:00 UTC; near-side maria and Tycho at full Moon) show no extra yaw is needed, so `EARTH_TEXTURE_YAW_RAD` and `MOON_TEXTURE_YAW_RAD` in `src/app/sceneLayout.ts` are 0.

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
