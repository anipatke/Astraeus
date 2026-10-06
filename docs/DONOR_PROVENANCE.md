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

Owner decision, 2026-10-06: the owner states both textures are publicly available and approved committing them to the public GitHub repository. Their specific source and licence are still not recorded here.

No `LICENSE*` file was found at the donor checkout root, and a grep of its `package.json` found no `license` field. No redistribution rights are claimed for donor code either.

## Texture orientation

The equirectangular Three.js sphere puts texture-centre longitude 0 on mesh +X, longitude 90°E on -Z and the pole on +Y, which is the same fixed conversion as EQJ → render. Visual checks (India/Asia shape and terminator at 2026-04-01 12:00 UTC; near-side maria and Tycho at full Moon) show no extra yaw is needed, so `EARTH_TEXTURE_YAW_RAD` and `MOON_TEXTURE_YAW_RAD` in `src/app/sceneLayout.ts` are 0.
