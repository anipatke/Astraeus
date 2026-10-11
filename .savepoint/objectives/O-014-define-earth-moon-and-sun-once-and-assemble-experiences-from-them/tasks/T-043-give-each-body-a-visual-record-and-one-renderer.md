---
id: T-043
title: Give each body a visual record and one renderer
objective: O-014
status: planned
depends_on: [{task: T-042, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o014-plan-2026-10-11}
lane: assets
planned_reads: [src/core/body.ts, src/core/bodies/index.ts, src/app/BodyMesh.tsx, src/app/AtmosphereGlow.tsx, src/app/useBodyTexture.ts, src/app/EarthMoonScene.tsx, src/app/SunCentredView.ts, src/app/sceneLayout.ts, src/app/experienceDefinition.ts, docs/DONOR_PROVENANCE.md, docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md]
planned_writes: [src/assets/visual.ts, src/assets/licence.ts, src/assets/catalogue.ts, src/assets/bodies/sun.ts, src/assets/bodies/earth.ts, src/assets/bodies/moon.ts, src/assets/textures/earth-2k.jpg, src/assets/textures/moon-orig-2k.jpg, src/app/BodyView.ts, src/app/EarthMoonScene.tsx, src/app/sceneLayout.ts, src/app/SunCentredView.ts, tests/assets.test.ts, tests/textureLicence.test.ts, tests/sceneTransforms.test.ts]
---

# Give each body a visual record and one renderer

## Outcome

Each catalogued body has a visual record (sphere or marker, material, optional texture with a licence or an explicit local-only declaration, atmosphere, texture yaw, light levels) in `src/assets/bodies/`, joined to its core definition by a catalogue that validates the join. One renderer, `BodyView`, draws any body from its record and replaces the inline Earth and Moon JSX and the special `SunView`. The scene looks the same as today at the Spike 01 and 03 dates, and the two unattributed textures are declared local-only with their public replacements.

## Astraeus Hypothesis

- **Capability tested:** that a body's appearance is data a renderer reads, independent of which body it is, and that the Sun is just a body whose visual is a marker.
- **Contract reused:** `BodyMesh`, `AtmosphereGlow`, `useBodyTexture`, `eqjToRenderQuaternion`, `ScalePolicy.mapRadius`, the render layers and lights as they are.
- **Gap:** Earth and Moon textures, materials, atmosphere, yaw, lights and mount are literals in the scene (design A.3); the Sun is a distinct `SunBody` type.
- **Generic change:** `BodyVisual`, `TextureRef`, `AssetLicence`, `BodyAsset`, `createCatalogue` (design C.3–C.4, Addendum 2 issue 2, final review correction 1); `BodyView` (sphere with optional atmosphere, or marker); spheroid drawing when a definition carries equatorial and polar radii (final review correction 3; no real spheroid body exists yet, proven on a fake one).
- **Evidence independent of any experience:** a made-up body with no texture and a made-up spheroid mount through `BodyView` in tests; Earth and Moon positions and quaternions are byte-identical to the pre-Task values at the Spike 01 dates.

## User Check

Open Apollo at the Spike 03 default view and at the six telemetry times, True and Readable scale, desktop and phone. Earth, Moon, atmosphere and lighting look as before. Open the made-up belt: the Sun marker, Earth's path and the made-up path are unchanged. Compare with the Spike 03 screenshots.

## Done When

1. `src/assets/catalogue.ts` builds from explicit imports; `createCatalogue` throws on a duplicate id, a parented body without a source, a root with one, or a visual without a definition; `definitions()` and `sources()` return exactly what the resolver needs.
2. `BodyVisual` for Sun (marker, today's size and colour), Earth (sphere, texture, `EARTH_MATERIAL`, `EARTH_ATMOSPHERE`, yaw 0, today's light levels) and Moon (sphere, texture, `MOON_MATERIAL`, yaw 0, today's light levels); the constants are removed from the scene files and exist once.
3. Texture rights: `earth-2k.jpg` and `moon-orig-2k.jpg` carry `localOnly` with a reason and a public replacement (material colour for Earth until a Blue Marble product is identified; the donor's LROC map named for the Moon but not copied in this Task). `tests/textureLicence.test.ts` fails on a texture with neither licence nor `localOnly`, or with both (PROV-02). The public-build output gate is a later Task.
4. `BodyView` draws a sphere from a record with and without a texture, an atmosphere when declared, a marker when the kind is marker, and a spheroid with independently mapped equatorial and polar radii when a definition carries them (fake body test); the Earth, Moon and Sun views in the scene are `BodyView` instances.
5. Snapshot test: Earth and Moon render positions and mesh quaternions at the Spike 01 dates equal the values recorded before the change (store them in the test).
6. `tests/layerRule.test.ts` extended: `src/assets/` imports only `src/core/` and Three.js.
7. Gates pass; every browser script passes in a fresh run directory; the owner's look is recorded separately.

## Context Files

`docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md` (C.3, C.4, Addendum 2 issue 2, Final review corrections 1 and 3), `src/core/bodies/index.ts`, `src/app/BodyMesh.tsx`, `src/app/AtmosphereGlow.tsx`, `src/app/useBodyTexture.ts`, `src/app/EarthMoonScene.tsx`, `src/app/SunCentredView.ts`, `src/app/sceneLayout.ts`, `src/app/experienceDefinition.ts`, `docs/DONOR_PROVENANCE.md`, `tests/sceneTransforms.test.ts`.

## Design References

Design: Components/Codebase Map (`src/app/`); Current Technical State (Spike 01 rendering, texture provenance). Design document C.3, C.4, E step 2, Gate B.

## Guardrails

ARCH-02, ARCH-03, ARCH-04, ARCH-05, PROV-01, PROV-02, TEST-01, TEST-03, STYLE-01, STYLE-07, STYLE-09, STYLE-10.

## Implementation Plan

1. Confirm the core Task's catalogue inputs exist (`definitions`, `sources`); REPLAN REQUIRED if not.
2. Write `src/assets/visual.ts` and `licence.ts`; move the Earth/Moon visual constants and texture imports into `src/assets/bodies/`; move the texture files under `src/assets/textures/`.
3. Write `createCatalogue` with the validations above.
4. Write `BodyView` (a `three` `Group` with sync/place like the other views, plus the React mount for the sphere material); draw the Sun from a marker record and delete `SunView`.
5. Replace the inline Earth/Moon JSX in the scene with `BodyView` mounts; keep the render layers and per-body lights as they are.
6. Tests, gates, browser scripts, owner look.

## Boundaries

No composition or scene-centre change (next Task). No planet visuals. No texture swap: the LROC map is named, not copied. No lighting change. `EarthMoonScene` keeps its name until the scene Task.

## Technical Verification

Focused tests during iteration; handoff runs the gates and every browser script (scene-affecting fuller gate). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here; the integration Task reconciles them into Design.
