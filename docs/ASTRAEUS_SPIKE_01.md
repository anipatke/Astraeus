# Astraeus Spike 01 — Design note

Status: implemented and validated by the executor on 2026-10-06. This is evidence for the owner and for the independent Full Objective Check; it is not a Check and claims no `CLEAR`. Requirement record: [`ASTRAEUS_SPIKE_01_ADDENDUM.md`](ASTRAEUS_SPIKE_01_ADDENDUM.md). Provider research and fixtures: [`ASTRONOMY_VALIDATION.md`](ASTRONOMY_VALIDATION.md). Donor reuse and asset provenance: [`DONOR_PROVENANCE.md`](DONOR_PROVENANCE.md).

## What was proven

```text
absolute UTC time → scientific State (EQJ, km, Float64) → ScalePolicy → floating origin → render axes → Three.js
```

Each arrow is a separate function with no upstream mutation. Switching policy, rotating the camera, spinning the Earth mesh or rebasing the origin never changes scientific time, position, orientation or Sun direction (tests and browser readouts below).

## Architecture implemented

| Layer | Files | Owns |
|---|---|---|
| Scientific core (no React/Three.js/Orb types) | `src/core/clock.ts`, `body.ts`, `state.ts`, `trajectory.ts`, `moonTrajectory.ts`, `referenceCenters.ts`, `bodyOrientation.ts`, `illumination.ts`, `scalePolicy.ts` | UTC clock, body radii, State, trajectories, centers, orientation, Sun geometry, scale mapping |
| Provider boundary | `src/core/astronomyAdapter.ts` | The only importer of `@lizard-isana/orb`; converts to Astraeus `Float64Array` EQJ km |
| Rendering-side maths | `src/app/renderCoordinates.ts`, `floatingOrigin.ts`, `sceneLayout.ts`, `orbitPath.ts` | EQJ→render axes, Float64 origin subtraction, placement/orientation of the hierarchy, sampled open orbit path |
| Presentation (adapted donor) | `BodyMesh.tsx`, `AtmosphereGlow.tsx`, `useBodyTexture.ts`, `CameraController.tsx`, `EarthMoonScene.tsx` | Spheres, rim shader, textures, orbit camera, one directional light per body |
| Debug UI | `App.tsx`, `DebugControls.tsx`, `DebugOverlay.tsx` | Play/pause/seek/rate/scrub, scale toggle, optional diagnostics overlay |

There is no monolithic Simulation: the clock, trajectory, policy and origin are independent objects, and `App` only wires them to a canvas. `EarthMoonScene` can be reused inside another Three.js scene because it holds no global store.

## Library choice

`@lizard-isana/orb` 3.1.1 alone, behind the adapter. Its truncated Meeus-style lunar series, structured frame transforms (IAU 2006 precession, IAU 2000B nutation, GMST82) and EPV00 Earth/Sun states met every fixture target, so no second dependency was added. Astronomy Engine was evaluated and rejected as an extra dependency (no uncovered need). Orb's Kepler propagator was reviewed and deliberately not used for the Moon: it is unperturbed two-body motion, not a lunar ephemeris. Full comparison: `ASTRONOMY_VALIDATION.md`.

## Conventions

- **Units:** kilometres, km/s (velocity omitted — see Deferred), seconds, radians; time is integer UTC Unix milliseconds. Positions are `Float64Array`.
- **Frame:** EQJ, right-handed mean-equatorial J2000. +X mean equinox, +Z north celestial pole.
- **Centers:** named in State (`earth` or `sun`), never in a body definition. Moon/Sun = Earth/Sun + Moon/Earth at the same time and frame; Sun/Earth is the negated Earth/Sun vector. Mismatched time or frame is rejected.
- **Quaternion:** `[x,y,z,w]`, Hamilton, mapping body-local axes into EQJ. Earth local axes are Orb's ECEF axes (+X lon 0 at the equator, +Y 90°E, +Z north). Moon local +X points at Earth, +Z is the local orbit normal, +Y completes the basis.
- **Render axes:** EQJ `(x,y,z)` → Three.js `(x,z,-y)`, preserving handedness. Quaternions and light directions use the same conversion. Texture-facing yaw offsets are presentation-only and are currently 0.
- **Scale:** TrueScale divides positions and radii by Earth's 6371 km. ReadableScale divides positions by the same value and multiplies distance by 0.1; radii are unchanged, so the radius ratio matches the physical 1737.4/6371. Size exaggeration was not implemented.
- **Floating origin:** `renderPosition = scaledAbsolute − scaledCameraOrigin`, subtracted in Float64 before narrowing to Float32. The origin rebases when the target drifts more than 1 Earth radius (scaled) from it and is independent of the policy.

## Accuracy

Measured against JPL Horizons DE441, geometric Earth-centred vectors, no light-time correction (eight archived samples, re-run on final integrated code on 2026-10-06; the temporary measuring test was removed afterwards):

| Target | Max angular error | Max range error | Target |
|---|---:|---:|---|
| Moon (301) | 0.0708 arcmin (2024-01-22) | 6.385 km (2025-06-01) | ≤ 2 arcmin, ≤ 100 km |
| Sun (10) | ≈ 0.0001 arcmin (0.008 arcsec) | 1.373 km | ≤ 1 arcmin, ≤ 100 km (sanity) |

- **Supported measured range:** 2022-06-01 to 2025-06-01 UTC, eight samples. These are sample maxima, not bounds. The seek field accepts 1900–2100 (the EPV00 validity window); outside the sampled years no quantified accuracy claim is made, and no lunar-distance-in-km guarantee is claimed beyond the samples.
- **Recurrence:** Moon positions one sidereal month (27.321659606 d) apart differ by 0.295° and 656 km; tests allow 0.6° and 1,500 km (roughly double the observed residual, and not an ephemeris target). Exact closure is not expected: the orbit is perturbed and its sidereal and anomalistic periods differ.
- **Phase:** USNO 2024 phase events and four 2026 USNO events give geometric illuminated fractions within 0.01 (2024) and 0.03 (2026) of the ideal value. This is a geometric, geocentric estimate, not an observed topocentric phase.
- **Time:** UTC → TT inside `AstroInstant`; Orb's legacy Moon routine applies its own `delta_t()` approximation to its `Date` input. `dut1 = 0`, no polar motion; JavaScript `Date` cannot express a leap-second label. Earth orientation is date-based and visually credible, not an IERS solution (GMST82 matches the SOFA validation value to ≈1.3e-12 rad).

## Addendum changes

| Change | Decision | Reason and architecture consequence |
|---|---|---|
| `positionKm` as `Float64Array`, real km | Adopted | Core and tests use only Float64 km; render narrowing is isolated to the last step. |
| Explicit Scientific → ScalePolicy → Floating origin pipeline | Adopted | Origin is its own module and tests/browser prove invariance to policy and rebasing. |
| `TrueScale` / `ReadableScale` behind `mapPosition`/`mapRadius` | Adopted | Both read identical State; overlay rows other than render values are byte-identical across the toggle. |
| ReadableScale size exaggeration | Deferred | Optional in the addendum; distance compression alone keeps the original radius-ratio criterion. The interface can accept it later. |
| Provider evaluation including orb.js 3.x | Adopted | Orb selected; Astronomy Engine rejected as unnecessary. |
| orb.js behind an adapter, not in the public API | Adopted | Only `astronomyAdapter.ts` imports it. A sampled/Horizons/mission provider can implement the same interface later; none were built. |
| Orientation as scientific State quaternion | Adopted | Earth from Orb's ECEF→EQJ transform; Moon from the Earth-facing direction and orbit normal. Mesh spin is not used. |
| Sun geometry and phase from lighting geometry | Adopted | Core derives physical body→Sun vectors before compression; one directional light per body; no phase animation. |
| Explicit Moon/Earth, Earth/Sun, Moon/Sun centers | Adopted | `referenceCenters.ts`; no rotating frames, no frame framework. |
| Kepler propagation | Rejected | Not a lunar ephemeris. |
| Optional velocity (`velocityKmS`) | Deferred | Not needed by any rendering or orientation requirement; the field is optional in State. |
| Libration, eclipses, barycentre, SPICE, N-body | Excluded by the addendum | Not implemented or claimed. |

## Orientation and illumination approximations

- Earth: sidereal phase and axis come from Orb's frame transform at the requested UTC (IAU 2006/2000B/GMST82, `dut1 = 0`). No polar motion.
- Moon: zero-libration tidal lock. The near-side axis was within 0.01° of the Earth direction on five test dates (2020–2031) because it is constructed from that direction; this validates the construction, not real libration.
- The Moon's pole is the instantaneous orbit normal, not the IAU lunar pole, so cartographic texture alignment is a visual check, not a guarantee.
- Illumination is directional light along the physical body→Sun vector, with a restrained ambient fill (Earth 0.18, Moon 0.08) so terminators and phases read. There is no shadow or eclipse occlusion.

## Donor reuse and application-specific code

Reused with changes (details in `DONOR_PROVENANCE.md`): atmosphere rim shader and Earth atmosphere parameters, texture loader (sRGB, anisotropy), sphere and material settings, gesture sensitivities, tweened focus, and the orbit-line colour. Not reused: the donor store, drag-driven mesh rotation, the arbitrary accumulated orbit angle, the circular `lineLoop` trail, the nested Earth-in-Moon hierarchy.

Application-specific: the whole core, adapter, floating origin, scene layout, sampled open path, orbit camera with Float64 focus, debug controls and overlay, and the layered-pass lighting used to give each body its own Sun direction.

## Discovered problems and risks

1. **Texture provenance is unresolved.** The donor README has no source or licence for the Earth or original Moon textures. They are local-only; do not publish or package them.
2. **No donor code licence was found**, so no redistribution right is claimed for adapted code.
3. **Browser checks are manual.** They used headless Chromium on SwiftShader (software GL) through `playwright-core` borrowed from the donor checkout. Frame rate and GPU precision are not representative, and the script is not part of the repo (see Validation).
4. **Accuracy is measured on eight samples in 2022–2025 only.** Wider claims need more fixtures.
5. **Moon pole/near-side orientation is approximate**; there is no libration and the texture alignment was judged by eye.
6. **ReadableScale hides physical truth by design**; the overlay is the guard. TrueScale framing at the default Earth focus shows Earth as a few pixels (about 63 Earth radii across the scene); close inspection requires zooming.
7. **Bundle is 1.07 MB minified** (Three.js plus textures are separate assets); Vite warns above 500 kB. Not addressed in a spike.
8. **Tooling:** `@vitejs/plugin-react@4` does not support Vite 8, so the built-in JSX transform is used. Orb ships an SGP4 module whose notice is preserved in `licenses/` although Astraeus never calls it.

## Recommended next spike

Provide a second trajectory source that returns the same `State`/`Trajectory` contract (for example a sampled or Horizons-derived Moon or a mission trajectory) and render it unchanged. Choose it from actual storytelling needs. Before that, add a committed browser test configuration if repeatable visual regression matters, and resolve texture provenance.

## Validation (2026-10-06, final integrated code)

Gates: `npm run typecheck` clean; `npm run build` built (chunk-size warning only); `npm test` 4 files, 58 tests passed. Lint is not configured.

Browser run (dev server on `localhost:5199`, 1280×800, headless Chromium, no page or console errors):

- **Seek and determinism:** the same requested timestamp (2024-01-18 03:52 UTC) at 1×, 1 hour/s, 1 day/s and 7 days/s, paused, gave identical distance, Moon position, both orientations, both Sun directions and lit fraction.
- **Invalid input:** `2024-02-30 00:00` showed "That calendar date or time does not exist." and left time unchanged.
- **Scale policy:** at 2024-01-25 17:54 UTC only Scale policy, Rendered distance and Moon local differed (6.2940 vs 62.9404 scene units, ratio 10); origin and every scientific row were identical.
- **Phases at USNO dates (readable scale, Moon focus):** 2024-01-04 03:30 → 50.1 % lit (last quarter); 01-11 11:57 → 0.2 % (new, near-black disc); 01-18 03:52 → 50.1 % (first quarter, half-lit); 01-25 17:54 → 99.8 % (full). A 2026-04-01 12:00 UTC Earth view shows a day/night boundary and an open orbit path.
- **Rebasing during playback at 7 days/s, Moon focus:** both policies produced eight different origins over about four seconds; Moon-local stayed within about 0.75 scene units under ReadableScale (threshold 1) and rebased to 0 under TrueScale, whose origins reached about 62 units. No discontinuity was seen in sampled frames; continuous motion was not recorded on video.
- **Drag and zoom during playback (1 day/s):** time advanced 2024-02-16T14:33:39.840Z → 2024-02-18T14:33:39.840Z while dragging and zooming.
- **Close Moon focus:** after ten wheel steps the Moon disc stayed centred with Moon local ≈ (−0.70, 0.07, −0.09).

Reproduction inputs: seek values and button sequences as listed above; the overlay rows are the readouts. The driver script lived in the session scratchpad and is not committed.

Not verified: donor comparison was visual only (the donor app was not run; Earth and Moon appearance, rim atmosphere and colour were judged consistent by eye, not pixel-compared); texture orientation was judged at 2026-04-01 12:00 UTC and the full Moon in T-002; GPU rendering; continuous (video) smoothness; any date outside the fixtures.
