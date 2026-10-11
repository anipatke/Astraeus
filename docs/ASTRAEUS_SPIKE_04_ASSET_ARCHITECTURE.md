# Astraeus Spike 04 — Reusable Asset Architecture

Design-phase deliverable for the owner's brief of 2026-10-11 ("Spike 04: Reusable Asset Architecture"). This is a review and a proposal. **No production code was changed.** It stops at the design review gate; the decisions in section F need the owner's answer before any implementation Task is planned.

Evidence basis: a targeted read of `src/core/`, `src/app/`, `src/shell/`, `src/mission/`, `src/showers/`, `src/synthetic/`, the Savepoint Design and Objective records, the Spike 04 brief, gap audit and Perseids reference, the T-038 replan handoff and the stopped T-041 session, the pinned `@lizard-isana/orb` 3.1.1 package, and the read-only donor `/home/user/code/planetary-explorer`. The configured gates were run at the start of the review: typecheck, build and 379 tests in 19 files pass on the current (uncommitted) `spike-04` tree.

Vocabulary used below: **State** is the frozen scientific record in `src/core/state.ts` (body, centre, UTC time, EQJ km position, optional velocity, orientation). **Centre** is the body a position is measured from. **Scene centre** is the body the rendering treats as its zero before the floating origin. **Experience** is one story mounted through `ExperienceDefinition`.

---

## Summary

The three layers the brief asks for already exist in outline: `src/core/` is the scientific engine, `src/app/` is the rendering and composition layer, `src/shell/` is the viewer chrome, and `src/mission/` and `src/showers/` are experiences. The `Trajectory → State` contract is sufficient and should not change. The scientific core needs widening, not replacing.

What is missing is the **asset library** in the middle: Earth, Moon and Sun are not defined once. Their identity, physical constants, state source, visual configuration and provenance are spread across eleven files and hard-wired into one scene component that is still called `EarthMoonScene`. The scene centre is Earth by construction; everything Sun-centred is composed back to Earth by three separate call sites. A fourth body cannot be added without editing generic code. That is the single structural cause of the paused Perseids work going sideways.

The proposal is therefore narrow:

1. **Widen three core contracts** (`CenterId` open to any catalogued body; a `StateResolver` that composes any body to any centre through the parent chain; a third `ScalePolicy` for solar-system distances).
2. **Introduce one new layer, `src/assets/`,** holding a body catalogue (definition + state source + visual + provenance per body) and named compositions (Earth–Moon, Sun–Earth, …).
3. **Generalise the scene** from "Earth and Moon plus optional layers" to "the bodies of a composition plus optional layers", with the scene centre as data.
4. **Leave the shell, the clock, the providers, groups, windows, events, provenance and the Apollo reconstruction untouched.**

Everything else in the brief (registry, lifecycle, R3F compatibility, texture provenance) is handled by plain TypeScript modules and data, not a framework. Section C gives the contracts; section D assembles the three target experiences from them; section E gives a seven-step migration that keeps every validated Spike 01–03 behaviour as the regression baseline.

---

## A. Architecture assessment

### A.1 The eight review questions

**What already provides reusable scientific state?**
`SimulationClock` (absolute UTC ms), `createState`/`createCenteredPosition` (frozen, validated, EQJ km), `Trajectory` (`stateAt(time, center)`), `SampledTrajectory` (bounded Hermite/linear), `MoonTrajectory` (Orb lunar series), `earthStateAt` (EPV00 Earth about the Sun, with ECEF orientation), `createTwoBodyTrajectory` (Keplerian elements about the Sun), `createOrbitGroup`/`PointGroup` (populations, batch fill), `composeCenteredPositions`/`inverseCenteredPosition` (centre change), `directionToSun`/`lunarIlluminatedFraction` (illumination geometry), `TimelineEvent`, `TimelineWindow`/`rateAt`, `Provenance`. All framework-free, all tested against archived Horizons/USNO/SOFA references. **This is the engine. It is good and it stays.**

**What reusable rendering primitives exist?**
`BodyMesh` (sphere + textured standard material), `AtmosphereGlow` (rim shader), `useBodyTexture` (safe sRGB loader), `TrackedBodyView` (marker, travelled/future path, anchor sprites), `PointsView` (batched dots with two-fill blending), `PathView`/`SunView` (sampled line, screen-sized marker), `FloatingOrigin`, `eqjToRenderVector/Quaternion`, the orbit camera (`CameraController.tsx`), `SceneLabelLayer`, `AnchorLabelLayer`, `FrameStats`. The pipeline *State → ScalePolicy → render axes → floating origin → GPU* is uniform across all of them. **These are the visual primitives. They stay; three of them need their fixed "Earth is the centre" assumption replaced by a parameter.**

**How are celestial bodies currently defined and instantiated?**
There is no single definition. For Earth: radius in `src/core/body.ts`; state in `referenceCenters.ts`; orientation in `bodyOrientation.ts`; material in `BodyMesh.tsx`; atmosphere in `AtmosphereGlow.tsx`; texture import, render layer, light intensities and mount in `EarthMoonScene.tsx`; texture yaw in `sceneLayout.ts`; provenance in `ephemerisProvenance.ts`; shell item (label, description) in each experience; the id `"earth"` as a literal in `CameraController.tsx`, `EarthMoonScene.tsx`, `App.tsx`, `experienceDefinition.ts` and three experiences. The Moon is the same, plus the orbit path in `orbitPath.ts`. The Sun exists twice: as a lighting direction, and (from the stopped T-041 session) as a `SunBody` marker type. **This spread is the central finding.**

**How are trajectories and reference centres handled?**
Well, in the core: `CenterId` is a closed union `"earth" | "moon" | "sun"`, every `State` names its centre, and composition is explicit and checked. Less well downstream: the scene assumes the Earth centre, so `trackedAbsolute` throws for anything not Earth-centred, `PointsView` and `SunCentredView` each call `sunPositionFromEarthAt` themselves to shift Sun-centred data to Earth, and `MoonTrajectory` recentres itself to the Sun inside `stateAt`. There is no one place that answers "where is body X relative to body Y at time t". **The closed `CenterId` and the three ad-hoc recentring sites are the two contract gaps.**

**How tightly are components coupled to the Apollo experience?**
Loosely, thanks to O-008. `src/core/` and `src/shell/` carry no mission names (enforced by `tests/experienceDefinition.test.ts`). `App` takes a definition and never imports an experience. The residual coupling is to the *Earth–Moon scene shape*, not to Apollo: `createObjectMetrics`, `MissionPanel` and `DebugControls` still speak of spacecraft and the Moon; `focusLimits`/`defaultDistance` branch on `"earth"`/`"moon"`; the overview request is hard-wired to Earth. **Apollo coupling is solved; Earth–Moon coupling is not.**

**What reusable assets can be recovered from Planetary Explorer?**
Patterns and data, not code (the donor code licence is unresolved, see `docs/DONOR_PROVENANCE.md`). Worth recovering: the `PlanetConfig` shape (material, atmosphere, ring bands, texture variants per viewport) as the model for `VisualAsset`; Saturn's ring band table with real km edges; the procedural ring-disc texture technique (`SaturnRingMesh.tsx`); the star-field idea; and above all the **texture files with recorded CC BY 4.0 or public-domain provenance** (Mercury, Venus, Mars, Saturn, Jupiter, the Galilean and Saturnian moons, Triton, LROC Moon). Earth and the original Moon texture remain unattributed in the donor. The donor's registry (`planetRegistry.ts`) is the right *idea* (explicit map, no discovery) and the wrong *content* (hotspots, missions, display spin rates, scene-unit radii).

**What limitations did the paused Perseids implementation expose?**
Recorded in the T-038 replan handoff and the T-041 plan: (1) no drawable Sun and no Earth-orbit line, so no frame of reference; (2) the scene cannot be Sun-centred, only Earth-centred with Sun-centred data composed back; (3) the Moon could not be left out without also losing Earth; (4) camera reach and the far plane were scene constants (fixed in T-037); (5) `ScalePolicy` has no solar-system mode; (6) planet paths had to come from somewhere, and the first attempt was a planet-specific orbit model in core (removed). Every one of these is an *asset or composition* gap. None is a State, Trajectory or provider gap. The shower builder itself (`src/showers/`) is sound experience-layer code and needs only to swap its Earth-centred composition for a Sun-centred one.

**Does the `Trajectory → State` contract remain sufficient?**
Yes. Single bodies: `Trajectory.stateAt(t, center)`. Populations: `PointGroup.fillPositionsKm(t, out)` plus `stateAt(index, t)`. Paths: sampling a `Trajectory`. Orientation: inside `State`. Nothing in the three target experiences needs more than these. The one refinement is that a `Trajectory` should declare its **native centre** (the one it computes in) so a resolver can compose from it, rather than each trajectory deciding which centres to offer.

### A.2 Component classification

**KEEP** — satisfies the revised vision as is.

| Component | Note |
|---|---|
| `src/core/clock.ts`, `state.ts` (semantics), `trajectory.ts`, `sampledTrajectory.ts`, `events.ts`, `timeWindow.ts`, `provenance.ts`, `pointGroup.ts`, `orbitGroup.ts`, `bodyOrientation.ts`, `illumination.ts` | Framework-free, validated, generic |
| `src/core/astronomyAdapter.ts` | The only Orb import for ephemerides; grows, does not change shape |
| `src/core/twoBodyAdapter.ts` | The only Orb import for Kepler maths |
| `src/app/floatingOrigin.ts`, `renderCoordinates.ts`, `BodyMesh.tsx`, `AtmosphereGlow.tsx`, `useBodyTexture.ts`, `SceneLabels.ts`, `AnchorLabels.ts`, `frameStats.ts`, `FrameRateSection.tsx`, `DebugOverlay.tsx` | Rendering primitives and diagnostics |
| `src/app/CameraController.tsx` | Orbit camera, gestures, tweened focus; takes a `FocusId`, not a body |
| `src/app/PointsView.ts`, `TrackedBodyView.ts`, `SunCentredView.ts` (`PathView`) | Keep; one parameter each (section A.3) |
| `src/shell/*` | Entirely generic (section 6 review) |
| `src/synthetic/*`, `tests/*`, `tools/validate/*` | Fixtures and gates |
| `tools/apollo11/`, `data/apollo11/` | Offline reconstruction, untouched |

**ADAPT** — reusable with targeted change.

| Component | Change |
|---|---|
| `src/core/body.ts` | `Body` becomes `CelestialBodyDefinition` (adds label, GM, parent, orientation model, dimension provenance). `CenterId` opens to any catalogued body. `EARTH`/`MOON` constants move to the catalogue |
| `src/core/state.ts` | `assertCenterId` validates against the catalogue, not a literal list. The "Earth/Moon need orientation" check reads a flag on the definition |
| `src/core/referenceCenters.ts` | `earthStateAt`/`sunPositionFromEarthAt` become the Earth and Sun providers in the catalogue; composition helpers stay; a new `StateResolver` sits on top |
| `src/core/moonTrajectory.ts` | Keep the Earth-centred computation and orientation; drop the Sun recentring branch (the resolver does it) |
| `src/core/sunCentredSources.ts` | `createTwoBodyTrajectory` takes a centre (any catalogued body with a GM), not Sun only; `createEarthSunTrajectory` folds into the Earth provider; `samplePathKm` stays |
| `src/core/scalePolicy.ts` | `id` union opens; add `SolarSystemScalePolicy` (true distances, per-body radius exaggeration declared by the experience) |
| `src/app/experienceDefinition.ts` | Adds `composition` and `sceneCenter`; `SunBody` folds into a body asset with a marker visual; `sceneLayers: "earth-moon"` kept as an alias for one migration step, then retired |
| `src/app/EarthMoonScene.tsx` | Becomes `AstraeusScene`: mounts one `BodyView` per composition member; scene centre from the definition; focus/limit defaults from body definitions |
| `src/app/sceneLayout.ts` | `placeBodies` for N bodies from resolver output; texture yaw moves to each visual asset |
| `src/app/orbitPath.ts` | The Moon-only path becomes a declared `PathLayer` on the Earth–Moon composition (same `samplePathKm` the Sun-centred paths use) |
| `src/app/mission.ts` | `TrackedBody` stays generic; `MissionConfig` moves to Apollo; `trackedAbsolute` resolves through the scene centre |
| `src/app/metricReadouts.ts` | Split: generic body metrics (distance, altitude, coordinates, phase) into the asset layer; spacecraft wording to Apollo |
| `src/app/ephemerisProvenance.ts` | Becomes the `provenance` field of the Earth and Moon catalogue entries |
| `src/shell/scaleModel.ts` | Scale choices come from the experience (O-011 already decided this) |
| `src/main.tsx` | Unchanged shape; definitions import the catalogue |

**EXPERIENCE-SPECIFIC** — belongs outside the engine (and already is, or should move).

| Component | Note |
|---|---|
| `src/mission/apollo11.ts`, `apollo11Definition.tsx`, `src/app/MissionPanel.tsx`, `DebugControls.tsx` | Apollo content and developer panels; move the last two beside the definition |
| `src/showers/*`, `data/showers/*` | Shower builder and settings; stays paused, needs only a composition swap when resumed |
| `src/synthetic/*` | Fixtures proving generic capability; stays |

**RETIRE** — no longer needed once the above lands.

| Component | Replaced by |
|---|---|
| `MoonTrajectory.stateAt(…, "sun")` self-recentring | `StateResolver` |
| `SunBody` as a distinct declaration type | Sun as a catalogue body with `visual.kind: "marker"` |
| `PointsView`/`SunCentredView` private `sunPositionFromEarthAt` offsets | `StateResolver.offsetKm(from, to, t)` |
| `EARTH_LAYER`/`MOON_LAYER` literal render passes | Per-body light (section B.4), after a measured check |
| `sceneLayers: "earth-moon"` | `composition: earthMoonSystem` |
| The literal `"earth"` overview target and the `"earth"`/`"moon"` branches in `focusLimits`, `defaultDistance`, `focusRadius` | `sceneCenter` and body-definition radii |

Nothing in `src/core/` is retired. No dependency is added or removed.

### A.3 Coupling findings, by file

These are the exact places the revised vision trips over. Each is small.

| File:lines | Finding |
|---|---|
| `src/core/body.ts:2` | `CenterId` is closed. Jupiter's moons, Saturn's rings and a Mars-centred experience are impossible without editing core |
| `src/core/state.ts:81` | `createState` requires orientation for the literal ids `earth` and `moon` |
| `src/core/moonTrajectory.ts:17-39` | The trajectory recentres itself; a third centre means editing the trajectory |
| `src/core/sunCentredSources.ts:12-14, 47, 66` | Keplerian provider is Sun-only; `GM[center]` in the two-body adapter knows only Sun, Earth, Moon |
| `src/core/illumination.ts:35` | `lunarIlluminatedFraction` checks literal body ids; the geometry is generic |
| `src/app/EarthMoonScene.tsx:46-51, 212, 225-227, 258, 341-359` | Earth and Moon textures, layers, lights, path and mount are literal; overview focuses `"earth"`; Earth is `[0,0,0]` by construction |
| `src/app/EarthMoonScene.tsx:375-390` | Focus limits and default distances branch on `"earth"`/`"moon"` |
| `src/app/sceneLayout.ts:16-22, 75-91` | `SceneHierarchy` has exactly an Earth and a Moon group |
| `src/app/sceneLayout.ts:95` | `trackedAbsolute` rejects any centre but Earth |
| `src/app/PointsView.ts:16-21`, `SunCentredView.ts:27-29` | Each composes Sun-centred data to Earth on its own |
| `src/app/orbitPath.ts:37` | The orbit path samples with centre `"earth"` and is Moon-specific by name |
| `src/app/experienceDefinition.ts:19` | `ExperienceRuntime` hands every experience a `MoonTrajectory` |
| `src/app/metricReadouts.ts` | Metrics factory reads the Moon even for experiences without one (known gap, Design.md) |
| `src/core/astronomyAdapter.ts` | Moon, Earth, Sun only. Orb 3.1.1 ships VSOP87A for the eight planets (`orb-planet.js`, heliocentric ecliptic J2000 in AU) and it is not yet adapted |

### A.4 Gaps against the revised vision

1. **No body catalogue.** (Cause of A.3 rows 1–13.)
2. **No state resolver.** Shared bodies at the same time are consistent today only because every caller happens to use the same adapter instance; nothing guarantees one evaluation per body per frame, and `MoonTrajectory.stateAt` calls the lunar series three times per frame for orientation.
3. **No planet ephemeris adapted,** although the library has one.
4. **No planet orientation model.** Earth uses the ECEF transform; the Moon uses the approximate tidal lock; nothing exists for other bodies (IAU pole/prime-meridian models are the standard answer and are data).
5. **No solar-system scale policy.** (Planned in O-011, not built.)
6. **No composition concept.** The scene is one shape with optional layers.
7. **Texture provenance is not a field.** It is a markdown note; the library should make it data on each visual asset so an unattributed texture cannot be mistaken for a cleared one.
8. **Rings and atmospheres beyond Earth's** have no primitive (donor has a ring disc pattern to adapt).
9. **Precision at AU scale is unmeasured.** The stopped T-041 session left an empty evidence file. The numbers say the floating origin is load-bearing: 1 AU is about 2.35 × 10⁴ Earth radii, and Float32 has 24 bits of mantissa, so a body left 1 AU from the GPU origin is placed to about 1.4 × 10⁻³ units, roughly 9 km. That is visible jitter on a true-scale Earth. Because the origin rebases onto the focused object (threshold one Earth radius), a *focused* Earth is always near the origin and only distant markers carry the coarse placement. This has to be measured on the belt, not assumed.

---

## B. Proposed architecture

### B.1 The three layers on the existing tree

```
 ┌──────────────────────────────────────────────────────────────────────────┐
 │ Layer 3 — Experience / Story            src/experiences/* (today: mission/, showers/, synthetic/) │
 │   ExperienceDefinition = composition + sceneCenter + layers + data        │
 │   Apollo: tracked spacecraft, events, panels   Perseids: stream, window    │
 │   Owns: which assets, extra trajectories, events, windows, presets,       │
 │         timeline, visibility, visual overrides, copy                      │
 ├──────────────────────────────────────────────────────────────────────────┤
 │ Layer 2 — Asset Library                 src/assets/  (new)  +  src/app/ (rendering) │
 │   catalogue: { sun, earth, moon, mars, … }  each = definition + provider  │
 │                                               + visual + provenance       │
 │   compositions: earthMoonSystem, sunEarthSystem, jupiterSystem, …         │
 │   renderers: BodyView (mesh/marker/atmosphere/rings), PathView,           │
 │              PointsView, TrackedBodyView, labels, camera, floating origin │
 ├──────────────────────────────────────────────────────────────────────────┤
 │ Layer 1 — Scientific Engine             src/core/ (unchanged shape)       │
 │   SimulationClock · State/CenteredPosition (EQJ km, UTC ms)               │
 │   Trajectory.stateAt · PointGroup.fillPositionsKm · samplePathKm          │
 │   StateResolver (parent-chain composition, one evaluation per body/time)  │
 │   AstronomyAdapter (Orb: Luna, EPV00, VSOP87A, frames) · TwoBodyAdapter   │
 │   bodyOrientation (ECEF, tidal lock, IAU models) · illumination · scale   │
 │   events · windows · provenance                                           │
 └──────────────────────────────────────────────────────────────────────────┘
                 ▲ data flows up: State never depends on anything above
```

Dependency rule (enforceable with the existing name-check test pattern): Layer 1 imports nothing from Layers 2–3. Layer 2 imports Layer 1 and Three.js/R3F. Layer 3 imports both and is the only place with mission, shower or dataset names. `src/shell/` is a sibling of Layer 2 that consumes `ExperienceConfig` and never scientific types beyond `ClockSnapshot`, events and windows (as today).

### B.2 Responsibilities

**Layer 1 — Scientific engine.** Time; the `State` contract; every state source; the **resolver** that composes any catalogued body to any catalogued centre at one time; orientation models; illumination geometry; scale policies as pure functions on kilometres; provenance, events, windows. Determinism: the same UTC millisecond and the same catalogue give bit-identical State in every experience, because there is one adapter instance and one resolver per scene.

**Layer 2 — Asset library.** The catalogue (what a body *is*, where its state comes from, what it *looks like*, where that came from); compositions (which bodies travel together and which is the natural centre); the renderers that turn State into Three.js objects through the existing pipeline. The library never computes astronomy; it calls Layer 1. A composition never instantiates its own providers; it names catalogue ids, so two compositions that both contain Earth share one Earth.

**Layer 3 — Experience.** Picks a composition and a scene centre; adds its own `Trajectory`s, groups, paths, events, windows, camera presets, scale choices, visual overrides (colour, marker size, exaggeration factor, visibility) and all copy. It cannot supply a state source for a catalogued body: `ExperienceDefinition` has no field for it, and the resolver takes bodies from the catalogue only. That is how "the experience layer must not override the physical states of standard objects" is made structural rather than a rule.

### B.3 Data flow per frame

```
clock.now() ──► t
                │
                ▼
   StateResolver.stateOf(bodyId, t, sceneCenter)  ── memo per (body, t) ──► State (EQJ km)
                │                                   (parent chain: moon→earth→sun, composed)
                ▼
   ScalePolicy.mapPosition / mapRadius(bodyId)     ── presentation only ──► scaled Float64
                │
                ▼
   eqjToRenderVector / eqjToRenderQuaternion       ── fixed axis swap
                │
                ▼
   FloatingOrigin.toLocal                          ── Float64 subtraction, then GPU Float32
                │
                ▼
   BodyView / PathView / PointsView / TrackedBodyView / labels / camera
```

Nothing new is inserted into the pipeline. The change is that the first box is one resolver instead of five call sites, and `sceneCenter` is a parameter instead of the literal Earth.

### B.4 Lighting

Today each of Earth and Moon has its own directional light on its own render layer, aimed along its own physical Sun direction, drawn in separate passes. That is correct and validated (USNO phases), but it does not scale: Three.js has 32 layers and the pass count grows per body. With a composition of N bodies the plan is one `BodyView` per body, each owning a directional light aimed along `directionToSun(body, sun)` from the resolver, still on its own layer, **up to a measured limit**, with the pass loop generalised over the composition. Switching to a single point light at the Sun's scaled position is simpler and physically right under uniform scaling, but it changes Spike 01's validated rendering and is deferred until the planets step, where it is measured against the current illuminated-fraction evidence (section E, step 6). This is listed as Decision 4.

### B.5 What is deliberately *not* proposed

Challenged as complexity without demonstrated benefit:

- **A plugin or discovery framework.** The catalogue is an explicit `Map` built from imports; experiences are an explicit map in `main.tsx`. Adding a body or an experience is one import line. The donor's registry proves this is enough for 24 bodies.
- **An abstract scene graph or entity system.** Three.js already is one. Compositions are lists of ids.
- **A general asset loader.** `useBodyTexture` plus a `TextureRef` with provenance covers textures; nothing else is loaded.
- **Dependency injection for the adapter.** One `AstronomyAdapter` instance is created in `App` and handed down, as today.
- **The imperative `Astraeus.Scene` API** from the Idea. The composition object *is* the framework-free description it would wrap; the R3F mount is the only consumer for now. Building the API before a second consumer exists is speculative.
- **A story DSL, chapters, narration.** Out of scope; `ExperienceDefinition` is data plus factories and stays so.
- **N-body, perturbations, SPICE.** Providers stay behind `Trajectory`; VSOP87A for planets and the existing lunar series are the accuracy tier, documented as such.
- **Re-architecting `PointGroup`, windows, events, provenance or the shell.** No evidence they need it.

---

## C. Asset contracts

TypeScript sketches, deliberately small. Names follow the brief's illustrative ones where they do not clash with existing exports; existing names are kept where the contract already exists. `readonly` and validation omitted for brevity; every factory validates and freezes like today's.

### C.1 CelestialBodyDefinition (`src/core/body.ts`)

```ts
export type BodyId = string;                  // open, as today
export type CenterId = BodyId;                // OPENED: any body the catalogue knows (Decision 1)

/** Scientific identity only. Lives in src/core/, knows nothing of providers, textures or licences. */
export interface CelestialBodyDefinition {
  id: BodyId;
  label: string;
  /** Volumetric mean radius; what every scale policy maps and every sphere defaults to. */
  radiusKm: number;
  /** Optional spheroid dimensions for bodies whose flattening is visible (Jupiter 6.5 %, Saturn 9.8 %). */
  equatorialRadiusKm?: number;
  polarRadiusKm?: number;
  /** Gravitational parameter, km³/s²; present on anything that can be a two-body centre. */
  gmKm3S2?: number;
  /** The one centre this body's own provider computes in; absent only for the root (Sun). */
  parentId?: BodyId;
  /** Which orientation model fills State.orientation; `none` means null orientation is valid. */
  orientation: "ecef" | "tidal-lock" | "iau-rotation" | "none";
  /** Per-body accuracy record: what is claimed, over which dates, and what is known to be off. Never affects State. */
  accuracy: {
    dimensions: Provenance;                     // NSSDC fact sheet, IAU WG report
    position: Provenance;                       // the ephemeris record (today's EARTH_EPHEMERIS etc.)
    validUtc: TimeBounds;                       // dates the position model is validated over
    orientationLimitations: readonly string[];  // e.g. the Moon's 254 km / 8.4° landing-site offset (no libration)
  };
}
```

Where the definitions live, and who validates against them (corrected after the adversarial review, Addendum 1, finding 1): the definitions are **core data** in `src/core/bodies/`, and the resolver in `src/core/` takes a `readonly CelestialBodyDefinition[]` when it is created. `createCenteredPosition` keeps only the checks it can make alone (non-empty ids, EQJ frame, and the self-centre rule below); the resolver is where an unknown body or centre is rejected, because that is the only place composition happens.

**Self-centre rule (Addendum 2, issue 1), one rule for every body.** A body measured from itself is a valid State: position exactly `[0, 0, 0]`, velocity absent or exactly zero, orientation from the body's own provider. `createCenteredPosition` today throws on `body === center` (`src/core/state.ts:62`); it changes to accept that case only when the position (and velocity, if given) is exactly zero, and to throw otherwise. The resolver's `stateOf(b, t, b)` returns that State for every catalogued body, Sun included, so an Earth-centred scene gets Earth at zero and a Sun-centred scene gets the Sun at zero through the same call. Tests: constructor accepts the zero self-state and rejects a non-zero one; resolver self-state is zero with the provider's orientation for Earth, Moon, Sun and a fake body. `createState`'s orientation rule reads `definition.orientation !== "none"` through the resolver's definition set. Nothing in `src/core/` imports `src/assets/`.

### C.2 StateProvider / Trajectory (`src/core/trajectory.ts`, unchanged) and StateResolver (new, `src/core/stateResolver.ts`)

```ts
// Unchanged. A provider computes in ONE centre, its native one.
export interface Trajectory {
  body: BodyId;
  bounds?: TimeBounds;
  /** `center` defaults to, and for catalogue providers is restricted to, the body's parentId. */
  stateAt(timeUtcMs: number, center?: CenterId): State;
}

/** One evaluation per (body, time); composes along the parent chain. */
export interface StateResolver {
  /** State of `body` measured from `center`, both catalogued. Throws if either is unknown. */
  stateOf(body: BodyId, timeUtcMs: number, center: CenterId): State;
  /** Vector from `center` to `from`'s centre, for shifting externally computed positions (groups, paths). */
  offsetKm(from: CenterId, center: CenterId, timeUtcMs: number): Float64Array;
  /** The one Sun position everything is lit by. */
  sunFrom(center: CenterId, timeUtcMs: number): CenteredPosition;
}

/** Core: binds a definition to the Trajectory that computes it. Provider-neutral: `AstronomyAdapter` is the engine's own interface. */
export interface StateSourceBinding {
  body: BodyId;
  create(adapter: AstronomyAdapter): Trajectory;
}

export function createStateResolver(
  definitions: readonly CelestialBodyDefinition[],
  bindings: readonly StateSourceBinding[],
  adapter: AstronomyAdapter,
): StateResolver;
```

**Native-centre contract (made explicit after Addendum 1, finding 3).** A catalogued provider computes in exactly one centre, its definition's `parentId`; `stateAt(t, c)` with any other `c` throws, as `SampledTrajectory` already does ("holds center"). The root body (Sun) has no provider: `stateOf("sun", t, x)` is `inverseCenteredPosition(stateOf(x, t, "sun"))`; `stateOf("sun", t, "sun")` is the zero self-state by the universal self-centre rule in C.1, not a Sun exception. All recentring is the resolver's job and nobody else's. This *is* a behavioural change for `MoonTrajectory`, whose `stateAt(t, "sun")` branch currently recentres itself; its only callers are three cases in `tests/metricVisuals.test.ts` (no production caller). The branch stays until step 3, when those tests are retargeted at the resolver and the branch is removed with a named test proving the resolver's Moon-from-Sun equals the old branch to 1e-9 km at the archived Horizons dates.

Algorithm: `stateOf(body, t, center)` walks `body → parent → … → root` collecting each provider's native State, and likewise for `center`, then composes with the existing `composeCenteredPositions`/`inverseCenteredPosition` through the common ancestor. Orientation comes from the body's own provider and is carried through composition unchanged, exactly as `recenterMoon` does today.

**What guarantees consistency across experiences (clarified after Addendum 1, finding 2).** Two things, and only these: identical definitions and bindings (module constants), and one adapter implementation. A resolver is created per scene mount; its per-time memo is a performance measure (one lunar-series call per frame instead of three) and an in-frame consistency measure, not the cross-experience guarantee. The test for the guarantee therefore mounts two different experiences against two separately created resolvers from the same constants and compares bytes.

### C.3 VisualAsset (`src/assets/visual.ts`)

```ts
/** Imagery rights are not scientific provenance; they get their own record (Addendum 1, finding 8). */
export interface AssetLicence {
  source: string;                               // product name, e.g. "NASA SVS 4720 CGI Moon Kit"
  url: string;
  licence: string;                              // "public domain", "CC BY 4.0", …
  attribution?: string;                         // the credit line the licence requires
  accessed: string;                             // ISO date
}

export interface TextureRef {
  url: string;                                  // Vite asset import
  widthPx: number; heightPx: number;
  /** Rights for public distribution. Required unless the texture is declared local-only below. */
  licence?: AssetLicence;
  /** Declares an unlicensed texture as local-only on purpose: why, and what the public build shows instead. */
  localOnly?: { reason: string; publicReplacement: "material-colour" | { url: string; licence: AssetLicence } };
}

export interface BodyVisual {
  kind: "sphere" | "marker";                    // the Sun at 1 AU is a marker until a star renderer exists
  texture?: TextureRef;                          // sphere only; absent = flat colour
  material: { color: string; roughness: number; metalness: number; emissive?: string };
  /** Presentation-only yaw aligning the image to the body-fixed axes (today's *_TEXTURE_YAW_RAD). */
  textureYawRad?: number;
  atmosphere?: AtmosphereConfig;                 // existing type
  rings?: { innerKm: number; outerKm: number; bands: RingBand[]; provenance: Provenance };
  marker?: { sizePx: number };                   // marker kind, and the fallback when a sphere is sub-pixel
  light?: { ambient: number; directional: number };
}
```

Visuals are data; the renderer (`BodyView`) is one component that reads them. Rings reuse the donor's band-disc technique with radii in **km**, mapped through the scale policy like everything else, so Saturn's rings are to scale in true scale and follow the body's exaggeration in solar-system scale. A sphere whose definition carries equatorial and polar radii is drawn as a spheroid whose two radii are **each mapped independently** through `ScalePolicy.mapRadius` (Final review, correction 3): under True scale the drawn equatorial and polar radii are the actual ones, not the mean radius stretched by a ratio (Jupiter's mean and equatorial radii differ by about 2.2 %). With only `radiusKm` it is a sphere of the mapped mean radius. The mean radius stays the value every metric, focus limit and label distance uses. Test: a made-up spheroid body's drawn radii equal `mapRadius(equatorialRadiusKm)` and `mapRadius(polarRadiusKm)` under each policy.

**Enforcing texture rights (Addendum 1, finding 8; made consistent in Addendum 2, issue 2).** Two classes of texture, two gates, neither contradicting the other:

- *Metadata gate (unit test, every build).* Every texture the catalogue references has **either** a `licence` **or** a `localOnly` declaration with a reason and a public replacement. Neither, or both, fails. Today exactly two textures are `localOnly`: `earth-2k.jpg` (Blue Marble product not identified) and `moon-orig-2k.jpg` (origin unknown; public replacement the donor's LROC map, public domain). The test passes from day one because those two are declared, not missing.
- *Output gate (public build only, `ASTRAEUS_PUBLIC_BUILD=1`).* Substitution happens at the **import**, not at display time: a Vite alias maps each local-only asset module to its declared replacement (or to a 1×1 placeholder when the replacement is the material colour), so the original bytes never enter the bundle even if some code path imports the module without drawing it. `tools/validate/public-build-assets.mjs` then hashes every file under `dist/` and fails if any hash matches a local-only source file. It tests the emitted output, not the metadata.

A normal local build is unchanged and keeps the owner's accepted textures.

### C.4 AssetRegistry / Catalogue (`src/assets/catalogue.ts`)

Three records joined by id, each living where its dependencies allow (Addendum 1, findings 1, 5 and 9):

```ts
// src/core/bodies/earth.ts   — scientific definition + state binding (core; no React, Three or assets)
export const EARTH_DEFINITION: CelestialBodyDefinition = { id: "earth", parentId: "sun", radiusKm: 6371.0, … };
export const EARTH_SOURCE: StateSourceBinding = { body: "earth", create: (adapter) => earthTrajectory(adapter) };

// src/assets/bodies/earth.ts — appearance (assets; imports core)
export const EARTH_VISUAL: BodyVisual = { kind: "sphere", texture: { url: earthTexture, …, licence: undefined }, material: EARTH_MATERIAL, atmosphere: EARTH_ATMOSPHERE };

// src/assets/catalogue.ts    — the join
/** `source` is absent for the root body only (Final review, correction 1); createCatalogue throws if any body with a parentId lacks one, or the root has one. */
export interface BodyAsset { definition: CelestialBodyDefinition; source?: StateSourceBinding; visual: BodyVisual }
export interface BodyCatalogue {
  get(id: BodyId): BodyAsset;                   // throws on unknown
  has(id: BodyId): boolean;
  ids(): readonly BodyId[];
  /** The core inputs a resolver needs, so App can build one without the visuals. */
  definitions(): readonly CelestialBodyDefinition[];
  sources(): readonly StateSourceBinding[];
}
export const catalogue: BodyCatalogue = createCatalogue([sun, earth, moon /* , mars, jupiter, … later */]);
```

Explicit, import-built, no discovery. The Sun has a definition and a visual but no source binding, by the root rule in C.2. The binding takes the engine's own `AstronomyAdapter` interface, which is already provider-neutral (Orb is behind `createOrbAstronomyAdapter`); what is body-enumerated is the adapter's method list, and the planets add one method, `planetPositionFromSunKm(planet, t)`, not eight.

### C.5 SystemComposition (`src/assets/compositions.ts`)

```ts
export interface SystemComposition {
  id: string;
  /** Catalogue ids, in draw order. Parents of every member are included automatically by the resolver. */
  bodies: readonly BodyId[];
  /** Natural centre; an experience may choose another sceneCenter from `bodies`. */
  defaultCenter: BodyId;
  /** Paths drawn by default, each sampled from the catalogue provider over a span rule. */
  paths?: readonly { body: BodyId; spanMs: number; samples?: number }[];
}

export const earthMoonSystem: SystemComposition = { id: "earth-moon", bodies: ["earth", "moon"], defaultCenter: "earth", paths: [{ body: "moon", spanMs: SIDEREAL_MONTH_MS }] };
export const sunEarthSystem:  SystemComposition = { id: "sun-earth", bodies: ["sun", "earth"], defaultCenter: "sun", paths: [{ body: "earth", spanMs: YEAR_MS }] };
```

A composition holds ids only, so it *cannot* create a second Earth. Two compositions mounted in one scene would share the resolver's memo; the brief's "no duplicate or conflicting states" is satisfied by construction.

### C.6 ExperienceConfig / ExperienceDefinition (`src/app/experienceDefinition.ts`, extended)

```ts
export interface ExperienceDefinition {
  experience: ExperienceConfig;                 // shell contract, unchanged
  clock: { startUtcMs: number; rate: number };
  composition: SystemComposition;               // NEW: replaces sceneLayers "earth-moon"
  /** Which catalogued body sits at the scene's zero. Presentation only (ARCH-02). */
  sceneCenter?: BodyId;                         // NEW: defaults to composition.defaultCenter
  /** Per-body presentation overrides; cannot touch state. */
  visualOverrides?: Partial<Record<BodyId, Partial<BodyVisual> & { exaggeration?: number; visible?: boolean }>>;
  scaleChoices?: readonly ScaleId[];            // from O-011's plan; default ["true-scale", "readable-scale"]
  camera?: CameraReach;                          // existing (T-037)
  trackedBodies?: readonly TrackedBody[];       // existing; centre = any catalogued body
  groups?: readonly GroupLayer[];               // existing
  paths?: readonly PathLayer[];                 // existing; source = any Trajectory; see path semantics below
  createMetrics: (runtime: ExperienceRuntime) => MetricsFor;
  developerSections?: readonly DeveloperSection[];
}

export interface ExperienceRuntime {
  clock: SimulationClock;
  resolver: StateResolver;                      // replaces `moon: MoonTrajectory`
  catalogue: BodyCatalogue;
}
```

**Path semantics (Addendum 1, finding 6; sharpened in Addendum 2, issue 3).** A path is a line through a state source's positions at sample times. Two different things can be meant, and they are not interchangeable:

- A **co-moving orbit**: the shape a body traces about a centre, carried along with that centre. The samples are expressed about the centre at their own times, and the whole line is drawn at the centre's position at the *clock* time. This preserves the orbit's shape and loses the samples' inertial history, which is what an orbit illustration wants (the Moon's monthly loop travelling with Earth; a comet's loop about the Sun seen from Earth). It is today's behaviour for every existing path.
- A **trail**: where the body was. Two frames exist and the final review (correction 2) made the distinction precise:
  - *relative* trail: each sample is the body's position **relative to the scene centre at the sample's own time**. It is what an observer riding the scene centre saw, and it is today's `TrackedBodyView` (Apollo's track stays attached to Earth in the Earth-centred scene, the Spike 02 regression baseline).
  - *inertial* trail: each sample is expressed in the **common root frame** (Sun-centred EQJ) at its own time and then offset by the scene centre's position **at the display time**. It is the actual path through space, drawn where those points are now relative to the centre. Apollo's track seen this way from Earth drifts away as Earth moves on; seen from the Sun it is the stretched helix along Earth's orbit.

```ts
export type PathLayer =
  | { kind: "orbit"; source: Trajectory; span: TimeBounds; samples?: number;
      /** Centre the orbit is co-moving with. Defaults to the source's native centre. */
      center?: CenterId; object: ExperienceObject; color: string }
  | { kind: "trail"; frame: "relative" | "inertial"; source: Trajectory; span: TimeBounds; samples?: number;
      object: ExperienceObject; color: string };
```

All three use only the source's native states and the resolver's `offsetKm(from, to, time)`, so a non-catalogued source such as an Apollo `SampledTrajectory` (native centre Earth) works through the same rule: relative trail in an Earth-centred scene is the samples as they are; inertial trail is sample + Earth-from-Sun at the sample time, minus scene-centre-from-Sun at the display time. `TrackedBodyView` is a relative trail by definition and keeps that behaviour. Tests: on a made-up two-body source, an orbit path's vertices are invariant under a change of scene centre up to one rigid translation; the Earth–Moon composition's Moon orbit path equals today's `sampleOrbitPath` output; Columbia as a relative trail in a Sun-centred scene equals sample + Earth-from-Sun at each sample time; and the review's test, **a moving scene centre with an object stationary in the root frame**: its inertial trail collapses to one point, while its relative trail mirrors the centre's own motion.

### C.7 The brief's cross-cutting questions

| Question | Answer |
|---|---|
| Asset identity and references | A `BodyId` string, unique in the catalogue; experiences reference by id, never by instance |
| Shared instances vs scene instances | Scientific: one provider per body per adapter, memoised in the resolver (shared). Visual: one `BodyView` per body per mounted scene (instance). A body is never mounted twice in one scene |
| Parent / reference-centre relationships | `parentId` on the definition; the resolver walks the chain; `CenterId` is any catalogued body |
| Units and coordinates | Unchanged: km, km/s, UTC ms, EQJ (J2000 equatorial) for every State; providers convert at the adapter boundary (VSOP87A ecliptic AU → EQJ km inside the adapter); render axes swap once in `renderCoordinates.ts` |
| Time synchronisation | One `SimulationClock`; `t` is read once per frame and passed down; the resolver memo is keyed by `t` |
| Asset dependencies | Implicit through `parentId` (Moon needs Earth needs Sun); the resolver includes parents automatically; no other dependency kind |
| Visual configuration and overrides | `BodyVisual` on the asset; `visualOverrides` on the experience, shallow-merged, presentation-only |
| True vs readable scale | `ScalePolicy` unchanged in contract; third policy `solar-system` with `mapRadius(radiusKm, bodyId)` reading the experience's exaggeration factor; every policy states its factor for the info panel (O-011 decision) |
| Texture loading and provenance | `TextureRef` carries dimensions and either an `AssetLicence` or a `localOnly` declaration; the loader is the existing safe loader; the metadata gate runs in every build and the output gate in public builds (C.3) |
| Ownership and lifecycle | Catalogue and compositions are module constants (immutable). Adapter, resolver and clock are created by `App` per mount and disposed with it. Views are created in `useMemo` and disposed in effects, as today |
| Integration with existing Three.js scenes | `BodyView`/`PathView`/`PointsView` are plain `three` objects (`Group`) added via `<primitive>`; a non-R3F host can `scene.add(view.group)` and call `sync`/`place` itself |
| React Three Fiber compatibility | The scene stays an R3F `Canvas` with one `useFrame`; nothing in Layers 1–2 imports React except the two small components already there (`BodyMesh`, `AtmosphereGlow`) |

---

## D. Worked examples

### D.1 Experience A — Earth–Moon Explorer

```ts
export const earthMoonExplorer: ExperienceDefinition = {
  composition: earthMoonSystem,                     // Earth, Moon, Moon's monthly path
  // sceneCenter defaults to "earth"
  clock: { startUtcMs: Date.UTC(2026, 0, 1), rate: 3_600 },
  experience: {
    objects: [catalogueItem("earth"), catalogueItem("moon")],   // label, description, provenance from the asset
    cameraPresets: [overview(), focus("earth"), focus("moon"), follow("moon")],
    events: [], window: { startUtcMs: …, endUtcMs: … }, rates: [1, 60, 3_600, 86_400],
  },
  createMetrics: ({ resolver }) => bodyMetrics(resolver, ["earth", "moon"]),  // distance, phase, coordinates
};
```

Everything on screen comes from the catalogue. The experience supplies dates, presets and copy. This is the Spike 01 scene reassembled from parts; its Spike 01 browser evidence (phases, rotation, scale switch) is the acceptance baseline.

### D.2 Experience B — Apollo 11

```ts
export const apollo11Definition: ExperienceDefinition = {
  composition: earthMoonSystem,                     // EXACTLY the same two assets
  clock: { startUtcMs: apollo11Mission.window.startUtcMs, rate: 3_600 },
  trackedBodies: apollo11Mission.bodies,            // Columbia, Eagle: SampledTrajectory, centre "earth"
  experience: apollo11Experience,                   // 30 events, journey, presets, provenance, limitations
  createMetrics: ({ resolver }) => apolloMetrics(apollo11Mission.bodies, resolver),
  developerSections: [ /* unchanged */ ],
};
```

Apollo adds trajectories, events and panels. It does not name Earth's radius, texture or provider; it cannot, because `ExperienceDefinition` has no field for them. The Apollo reconstruction pipeline and data are untouched. Regression baseline: `browser-spike02.mjs` (six telemetry pairs, 30 events, follow continuity) must pass unchanged.

### D.3 Experience C — Perseids

```ts
export function buildShowerDefinition(settings: ShowerSettings): ExperienceDefinition {
  return {
    composition: sunEarthSystem,                    // Sun and Earth; NO Moon, NO Earth–Moon scene
    sceneCenter: "sun",
    scaleChoices: ["true-scale", "solar-system"],
    visualOverrides: { earth: { exaggeration: 400 } },   // stated in Earth's info panel
    camera: { maxFocusDistance: 400_000, far: 1_000_000 },
    groups: [createStreamLayer(settings)],          // createOrbitGroup, centre "sun" — existing
    paths: [
      parentOrbitPath(settings),                    // createTwoBodyTrajectory about "sun" — existing
      // The planets' paths are added once the planet providers exist (step 6); the slice is Sun–Earth only.
    ],
    experience: { objects: [catalogueItem("sun"), catalogueItem("earth"), streamItem, …], windows: [activity], presets: [overview(), follow("earth")], … },
    clock: { startUtcMs: activity.startUtcMs, rate: 86_400 },
    createMetrics: ({ resolver }) => showerMetrics(settings, resolver),
  };
}
```

The shower builder already exists (`src/showers/showerDefinition.ts`) and changes in exactly two places in the slice: `sceneLayers: ["earth-moon", "points"]` becomes `composition: sunEarthSystem, sceneCenter: "sun"`, and the Earth/Moon objects become catalogue items. The planets' paths (O-011 success condition 8) are a third, later change once step 6 supplies planet providers; until then the Perseids scene shows the Sun, Earth and its path, the parent orbit and the stream. No Apollo assumption is inherited because nothing in the definition references the Earth–Moon composition, tracked bodies or the Moon. The Geminids remain a settings file.

### D.4 What the three have in common

| | A | B | C |
|---|---|---|---|
| Earth asset | catalogue | catalogue | catalogue |
| Earth state at t | `resolver.stateOf("earth", t, c)` | same | same (c = sun) |
| Moon asset | catalogue | catalogue | absent |
| Sun | lights the scene | lights the scene | drawn, lights, is the centre |
| Experience-owned | dates, presets | spacecraft, events, panels | stream, window, parent orbit, paths |
| New code in Layer 1 or 2 | none | none | none |

---

## E. Migration plan

Incremental; each step leaves every browser script green and ends with a Savepoint handoff. Steps 1–5 are the vertical slice the brief asks for. Steps 6–7 are the path to a full textured Solar System and are listed so the slice is seen to lead there, not to commit to them now.

| Step | Change | Proof (independent of any experience) | Preserves |
|---|---|---|---|
| **1. Catalogue and resolver** | `CelestialBodyDefinition`; `src/assets/bodies/{sun,earth,moon}.ts`; `createCatalogue`; `createStateResolver`; `CenterId` opened; self-centre rule in `createCenteredPosition`; `MoonTrajectory` **keeps** its Sun branch until step 3; `earthStateAt`/`sunPositionFromEarthAt` become providers | Resolver tests: Moon-from-Sun equals today's `recenterMoon` to 1e-9 km at the archived Horizons dates; one lunar call per (body, t); unknown id rejected; self-state zero for every body; a fake 4-body chain (A→B→C→root) composes both ways | All existing core tests unchanged; Apollo scene unchanged (it still calls the old functions until step 3) |
| **2. Visual assets** | `BodyVisual`, `TextureRef`; move `EARTH_MATERIAL`, `EARTH_ATMOSPHERE`, texture imports, yaw, lights, `ephemerisProvenance` into the three asset files; `BodyView` (sphere or marker) replacing the inline Earth/Moon JSX and `SunView` | Test: every catalogued texture has a licence or a `localOnly` declaration, never neither or both; `BodyView` mounts from a made-up asset with no texture; snapshot of Earth/Moon positions and quaternions equals the pre-step values at the Spike 01 dates | `browser-spike03.mjs` screenshots (visual compare by owner) |
| **3. Composition and scene centre** | `SystemComposition`; `ExperienceDefinition.composition` and `sceneCenter`; `AstraeusScene` (renamed `EarthMoonScene`) mounts N `BodyView`s, overview targets `sceneCenter`, focus limits read body radii; `trackedAbsolute`, `PointsView`, `PathView` take offsets from the resolver; `orbitPath` becomes the Earth–Moon composition's declared path; `MoonTrajectory`'s Sun branch removed and its three test callers retargeted | Made-up composition of three fake bodies with a non-Earth centre renders, focuses and labels each; Sun-centred belt renders with `sceneCenter: "sun"`; **invariance tests, stated precisely:** (i) for every (body, t, c), `resolver.stateOf(body, t, c)` is byte-identical whatever the experience's `sceneCenter`, `visualOverrides`, scale policy or camera; (ii) round trip: `stateOf(moon, t, sun) − stateOf(earth, t, sun)` equals `stateOf(moon, t, earth)` within 1e-6 km, and `stateOf(sun, t, earth)` equals `−stateOf(earth, t, sun)` exactly; (iii) two experiences mounted with separately created resolvers from the same constants give identical bytes; path tests for both readings in C.6 | `browser-spike02.mjs`, `browser-shell.mjs`, `browser-anchor-labels.mjs`, `browser-synthetic*.mjs` all green; Apollo pixel-identical at the six telemetry times (owner look) |
| **4. Solar-system scale** | `SolarSystemScalePolicy` (true distances, radius × declared factor); `scaleChoices` on the definition; shell choices from the experience | Policy tests (positions unchanged vs true scale; radius factor applied; factor shown in info); belt at 2.5 AU visible | True/Readable byte-identical for Apollo |
| **5. The three experiences** | Earth–Moon Explorer definition (new, small); Apollo rewired to `composition`; shower builder rewired to `sunEarthSystem` + `sceneCenter: "sun"` (Sun, Earth, Earth's path, parent orbit, stream; **no planet paths yet**); `src/mission/` → `src/experiences/apollo11/` (Decision 3); public-build texture exclusion | Plug-in contract tests extended; name check extended to `src/assets/`; new `browser-earth-moon.mjs`; Perseids script shows Sun, Earth's path, stream, follow-Earth; precision at 1 AU measured and recorded (jitter in px over 60 frames at true scale, both centres); public build contains no unlicensed texture | Everything above |
| **6. Planets and one real satellite system** | `planetPositionFromSunKm` on the adapter (VSOP87A); `iauRotation.ts` with IAU WG pole/W data; catalogue entries for the planets with the donor's licensed textures; **Jupiter + Io composition** (Io from published mean elements about Jupiter's GM through `createTwoBodyTrajectory`, `reconstructed` provenance) as the non-Earth architecture stress test (Addendum 1, finding 9); per-body light loop over the composition, then the measured one-Sun-light comparison (Decision 4); Perseids gains the planets' paths | Planet positions vs Horizons samples (new fixtures, same method as `ASTRONOMY_VALIDATION.md`); IAU rotation vs published sub-Earth longitude; Io-from-Sun round trip through Jupiter (arithmetic); **Io physics (Addendum 2, issue 4):** Io's Jupiter-centred position vs JPL Horizons (target 501, centre 500@599, geometric vectors) at no fewer than six dates spanning the validated range, with the maximum error recorded; the provisional acceptance line is one Io diameter (3,643 km), chosen because an error smaller than the body is invisible at any framing that shows it; inside the line Io's record is `ephemeris`-tier approximate with the figure stated, outside it Io is classified an *approximate demonstration* (`reconstructed`, the figure in `knownLimitations`) and the architecture test still counts; Jupiter-centred scene renders, focuses, labels and lights both bodies; illuminated fraction unchanged under the lighting change; spheroid Jupiter drawn from equatorial/polar radii | Earth–Moon lighting evidence; O-011's remaining Tasks resume after this step |
| 7. Rings, remaining moons, full system | Ring disc primitive from donor pattern with km radii; Saturn system; `solarSystem` composition | Saturn rings and atmosphere under the solar-system exaggeration factor (the per-body factor is proven on non-spherical visuals here, not only on Earth) | — |

### E.1 Risks

| Risk | Likelihood / impact | Mitigation |
|---|---|---|
| Precision at AU scale: Float32 narrowing after the floating origin shows jitter on Earth-radius-sized bodies 1 AU from the origin | Medium / high for Perseids | Measure in step 3 on the belt (empty evidence from T-041 is the gap). The floating origin rebases on the *focus*, so a focused Earth at 1 AU is near the origin; the Sun marker far away jitters harmlessly. Record the figures |
| Opening `CenterId` weakens a type guard that caught bugs at compile time | Medium / low | The resolver rejects any body or centre outside its definition set; tests for unknown ids there. `createCenteredPosition` checks only what it can on its own |
| Scene rename and `src/mission/` move produce a large diff that hides regressions | High / medium | Do the move as its own commit with zero behaviour change, gates green before and after (STYLE-10) |
| Per-body render layers hit the 32-layer limit before the full system | Certain at step 7 / low now | Decision 4 is taken with evidence at step 6, before it bites |
| Texture provenance: Earth and original Moon textures remain unattributed | Known / low (owner accepted local and GitHub use on 2026-10-06) | Both declared `localOnly` with the LROC Moon map (public domain) as the Moon's public replacement and the material colour as Earth's until a Blue Marble product is identified (Decision 5) |
| VSOP87A accuracy: Orb ships a truncated ("short") coefficient set whose error grows away from J2000 and is not stated by the package | Low / low | Measured against Horizons fixtures at the dates the experiences use, exactly as the Moon was; documented as the planet tier with its measured maxima |
| Orientation models for planets are approximate (IAU 2015 report, no nutation terms) | Low / low | Stated per body in `knownLimitations`, as the Moon's tidal lock is today |
| Lunar series three-call orientation moves into the resolver memo: behaviour identical, but a subtle change | Low / medium | Step 1 test compares the quaternion to the current value to 1e-12 at the archived dates |

### E.2 Dependencies

- Step 1 before everything. Steps 2 and 4 are independent of each other and of 3 (worktree lanes possible). Step 3 needs 1 and 2. Step 5 needs 1–4. Step 6 needs 5. O-011's paused Tasks (T-038 Perseids, T-039 Geminids, T-040 regression) resume after step 6, because O-011's success condition 8 names the planets' paths; the owner may instead relax that condition and resume after step 5. O-012 (findings) after that.
- No new npm dependency in steps 1–7. VSOP87A and the Kepler propagator are in the pinned Orb package already.

### E.3 Acceptance criteria for the slice (steps 1–5)

1. Earth is defined once: `createCatalogue` throws on a duplicate id; `createStateResolver` throws on a duplicate definition or binding; and a dependency test asserts that no module under `src/assets/`, `src/app/`, `src/shell/` or `src/experiences/` exports a `CelestialBodyDefinition` or a `StateSourceBinding`, so bodies can only be referenced by id through the catalogue.
2. `resolver.stateOf(b, t, c)` returns the same bytes for every experience at the same `t` (two experiences, two separately created resolvers from the same constants), and the round-trip identities in step 3 hold within 1e-6 km.
3. Changing `visualOverrides`, `sceneCenter`, scale policy or camera changes no `stateOf(b, t, c)` result for any `c` (ARCH-02 test, existing pattern).
4. Earth–Moon Explorer, Apollo and the Sun-centred belt each render with zero console errors at 1280×800 and 390×844, in fresh evidence directories.
5. `browser-spike02.mjs` passes on Apollo without modification.
6. The shower builder mounts Perseids on `sunEarthSystem` with the Sun drawn, Earth on its path, and no Moon, through the existing `points` and path layers; its only code change is the composition swap and catalogue items.
7. Name check: no mission, shower, dataset or planet name in `src/core/`, `src/shell/`, generic `src/app/`; `src/assets/` may name bodies (they are the assets) but never an experience.
8. A measured precision record at 1 AU exists in `docs/evidence/`.

---

## F. Decisions requiring owner approval

Each is a genuine trade-off. The recommendation is first.

**Decision 1 — Open `CenterId` to any catalogued body.**
*Recommended:* `CenterId = BodyId`, validated against the catalogue at runtime. Pro: Jupiter's moons, Saturn's rings, a Mars-centred experience and the resolver all need it; one change now instead of one per planet. Con: a compile-time guard becomes a runtime check.
*Alternative:* keep the closed union and append planets as they arrive. Pro: no type change. Con: every new centre edits `src/core/body.ts` and `state.ts`, and groups about a planet stay impossible until then.

**Decision 2 — Planet ephemeris tier.**
*Recommended:* VSOP87A through the existing Orb package (its truncated series, heliocentric ecliptic J2000 converted to EQJ in the adapter), validated against Horizons fixtures like the Moon. Pro: no new dependency, dated positions, the same validation method already in use. Con: the package does not state the truncation's accuracy, so it must be measured; and no velocities (speed readouts for planets stay "not modelled" unless differenced).
*Alternative:* JPL approximate Keplerian elements with secular rates (a data table, 1800–2050, arcminute-class) through `createTwoBodyTrajectory`. Pro: pure data, velocities for free. Con: visibly less accurate, and it makes the two-body adapter the planets' ephemeris, which it is not.

**Decision 3 — Rename and move now or later.**
*Recommended:* in step 3 rename `EarthMoonScene` to `AstraeusScene`; in step 5 move `src/mission/` to `src/experiences/apollo11/` and `src/showers/` to `src/experiences/showers/`, each as a behaviour-free commit. Pro: the tree then says what the architecture says; browser scripts and docs updated once. Con: a wide diff and every evidence path in Design.md to re-point.
*Alternative:* defer all renames to O-012 or later. Pro: smaller Tasks. Con: the name `EarthMoonScene` keeps inviting Earth-centred assumptions in new code.

**Decision 4 — Lighting model (deferred to step 6, but the owner should know it is coming).**
*Recommended:* keep the validated per-body directional lights through the slice; at the planets step, measure a single point light at the Sun's scaled position against the current illuminated-fraction evidence and switch only if identical within tolerance. Pro: no risk to Spike 01 evidence now. Con: the 32-layer ceiling remains until then.
*Alternative:* switch in step 2. Pro: simpler scene immediately. Con: changes validated rendering without a planet-scale reason yet.

**Decision 5 — Texture provenance as a hard rule.**
*Recommended:* every `TextureRef` needs a licence record, or an explicit local-only declaration naming its public replacement (as revised in Addendum 2); the current Earth and original Moon textures get the declaration, and the Moon may be swapped for the donor's public-domain LROC map when the owner wishes. Pro: makes PROV-01 apply to imagery as it does to data. Con: the current Moon look changes if swapped (the owner previously preferred the original's poles).
*Alternative:* keep provenance in markdown only. Pro: nothing changes. Con: an unattributed texture can enter the library unnoticed.

**Decision 6 — Where this work lives in Savepoint.**
*Recommended:* a new Objective in the current Goal G-004, "Build the asset catalogue and prove it on Earth, Moon and Sun" (steps 1–5), placed before O-011's remaining Tasks; O-011 is re-planned to resume on top of it (T-041's partial Sun and path work becomes the seed of the Sun asset and the path layer, kept with a record). Pro: finished O-011 work stays counted; the brief's "architecture-first" ordering is explicit in the records. Con: O-011 stays open longer.
*Alternative:* rework O-011 in place again. Pro: one Objective. Con: O-011 has been re-scoped twice already and would be carrying an architecture change under a fixture title.

**Decision 7 — The Earth–Moon Explorer as a real experience.**
*Recommended:* build it (D.1) as a small shipped experience, since it is the cleanest proof that Apollo adds only data. Pro: a third real consumer of the Earth–Moon composition. Con: one more entry to maintain.
*Alternative:* keep it as a synthetic fixture only.

### Owner decisions — 2026-10-11

Taken in the design review session the day the brief was supplied. Decision 4 (lighting model) was not put to the owner because it is deferred to migration step 6 by design; it is recorded above so the owner knows it is coming.

| Decision | Owner's choice |
|---|---|
| 1. Reference centre | Open `CenterId` to any catalogued body, validated at runtime against the catalogue |
| 2. Planet ephemeris | The library's VSOP87A through the existing adapter, measured against JPL Horizons fixtures like the Moon |
| 3. Renames | Rename `EarthMoonScene` to `AstraeusScene` in step 3; move `src/mission/` and `src/showers/` under `src/experiences/` in step 5, each as a behaviour-free commit |
| 4. Lighting | Not asked; deferred to step 6 with a measured comparison |
| 5. Texture provenance | Every `TextureRef` requires a licence record or an explicit local-only declaration with a public replacement (wording per Addendum 2); Earth and the original Moon texture carry the declaration until resolved or swapped |
| 6. Savepoint placement | A new Objective in G-004 for the catalogue, resolver, composition, scale and the three experiences (steps 1–5), placed before O-011's remaining Tasks; O-011 is re-planned to resume on top of it, and T-041's partial Sun and path work is kept as the seed of the Sun asset and the path layer |
| 7. Earth–Moon Explorer | Built as a small real experience, not only a fixture |

The design is approved at the decision level. The next step is `savepoint-design`: plan the new Objective from section E, steps 1–5, with section E.3 as its success conditions, and record the O-011 re-plan.

---

## G. Scientific accuracy and verification (brief §4)

Categories, stated so each catalogue entry and each readout can name its own:

| Category | Examples | Provenance `sourceType` | Verified by |
|---|---|---|---|
| Physical constants and dimensions | radii, GM | `observed` (NSSDC, IAU) | source citation on the definition; one-occurrence test |
| Calculated ephemeris positions | Moon (Orb Luna), Earth/Sun (EPV00), planets (VSOP87A) | `ephemeris` | archived Horizons vectors, existing method in `docs/ASTRONOMY_VALIDATION.md` |
| Orbital propagation | Keplerian providers, groups | `illustrative` unless elements are cited, then `reconstructed` | two-body adapter tests; bound-orbit rejection |
| Approximate orientation models | Earth ECEF (no polar motion), Moon tidal lock (no libration), IAU planet rotation | `ephemeris` with `knownLimitations` | USNO phases, SOFA GMST, published sub-Earth longitudes |
| Visual approximations | exaggeration factors, marker sizes, atmosphere shells, ring opacity | stated in the info panel, never in State | ARCH-02 tests; owner look |
| Reconstructed or illustrative trajectories | Apollo samples, meteoroid streams | `reconstructed` / `illustrative` | existing reconstruction report; window provenance spans |

Rendering requirements from the brief map onto existing or planned pieces: proportionate dimensions (`mapRadius` from one `radiusKm`), textures (`TextureRef`), dated rotation and axial orientation (`State.orientation`), Sun-driven illumination (resolver `sunFrom`), rings and atmospheres (`BodyVisual`), stability across distances (floating origin, measured in step 3), independent exaggeration (`solar-system` policy with per-body factor).

---

## H. UI shell review (brief §6)

The shell is independent of scene composition. Evidence: `AstraeusShell` and its parts import only `ClockSnapshot`, `TimelineEvent`, `TimelineWindow`, `TimeBounds`, `Provenance` and `Metric`; they never import a body, a trajectory, Three.js or an experience; the name check proves no mission names. Per item:

| Capability | Verdict | Note |
|---|---|---|
| Object selection | Independent | Works on `ExperienceObject` ids with availability bounds; a catalogue body is just another object |
| Time controls | Independent | Clock callbacks only |
| Focus / follow / overview | Independent in the shell; the **app** hard-wires overview to Earth | Fixed by `sceneCenter` (step 3), no shell change |
| Camera presets | Independent | Data on the experience |
| Scale controls | Nearly | Choices are a constant list; O-011 already planned making them experience-declared (step 4) |
| Event navigation | Independent | Events and window stops |
| Provenance | Independent | Badge and panel render any `Provenance`, time-ranged through window spans |
| Information panels | Independent | Metrics arrive computed; the **metrics factory** in `src/app/` is the only Earth–Moon-flavoured piece and splits in step 5 |

Nothing in the shell is redesigned. The two app-side fixes (overview target, metrics factory) are already in the migration.

---

## I. Success criteria check (brief §9)

| # | Criterion | How the proposal meets it |
|---|---|---|
| 1 | Earth, Moon, Sun defined once | catalogue entries; one-occurrence test |
| 2 | Shared states consistent at a timestamp | one resolver, memo per (body, t) |
| 3 | Visuals customised without touching state | `visualOverrides`; ARCH-02 test |
| 4 | Different centres and compositions | `CenterId` open; `SystemComposition`; `sceneCenter` |
| 5 | Apollo consumes without owning | D.2: no field exists for owning |
| 6 | Perseids without Apollo assumptions | D.3: `sunEarthSystem`, no Moon, no tracked bodies |
| 7 | Validated functionality preserved | migration regression baseline per step |
| 8 | New experiences are data and configuration | D.4 last row: zero Layer 1–2 code for A, B, C |
| 9 | Lightweight, Three.js/R3F-friendly | plain `three` groups; no framework; no dependency |
| 10 | Credible path to a textured Solar System | steps 6–7 with VSOP87A, IAU rotation, donor textures, ring primitive |

---

## J. Non-goals reaffirmed

Not built in this spike: the full Solar System, the Perseids story, Apollo accuracy work, a rewrite of the scientific core, a plugin framework, a general scene engine, N-body, a story DSL, an npm package, a website, new dependencies. Step 7 above is a direction, not a commitment; step 6 is in scope only to the extent Gate C below requires (Decision 8).

---

## Addendum 1 — Response to the adversarial review (2026-10-11)

The owner obtained an independent adversarial review of this document (verdict: NEEDS WORK; it was written from the document and spike notes, not from the repository). Each finding was checked against the code. The sections above have been corrected in place where the review was right, each correction marked "Addendum 1, finding N". This addendum records the disposition, the interfaces that change as a result, and the approval gates the review proposed.

### Disposition of findings

| # | Finding | Checked against | Disposition |
|---|---|---|---|
| 1 | Core validation through the catalogue inverts the dependency rule | My C.1 did say `catalogue.assertBody` | **Accepted.** Definitions and bindings are core data in `src/core/bodies/`; the resolver validates against the set it is built with; `src/assets/` joins visuals on top and is never imported by core. C.1, C.2, C.4 corrected |
| 2 | "State identical whatever the scene centre" is mis-specified; one resolver per mount cannot be the cross-experience guarantee | Wording in step 3 and E.3 | **Accepted.** Replaced by three precise invariants: `stateOf(b, t, c)` independent of presentation for every `c`; round-trip identities within 1e-6 km; byte equality across separately created resolvers from the same constants. The guarantee is the shared constants and adapter; the memo is performance and in-frame consistency |
| 3 | The `Trajectory` contract changes behaviourally; the Sun root convention was contradictory | `grep` for `stateAt(…, "sun")`: the Moon's Sun branch has three test callers in `tests/metricVisuals.test.ts` and no production caller | **Accepted.** Native-centre contract, root rule and the migration path for the branch are now explicit in C.2; the three tests are retargeted in step 3 with an equality test against the old branch |
| 4 | Step 5 uses planet paths that step 6 introduces | D.3 and step 5 | **Accepted.** Step 5 is Sun–Earth only; planet paths arrive in step 6; O-011's condition 8 therefore resumes after step 6 unless the owner relaxes it (E.2) |
| 5 | `BodyAsset` bundles constants, provider, visuals and licensing | C.4 | **Accepted, with a limit.** Three records joined by id (definition and binding in core, visual in assets). No further abstraction: the join *is* the catalogue |
| 6 | Path samples need a stated transformation rule | Today's `PathView` shifts a whole Sun-centred line by the Sun's position at clock time, which is right for an orbit and undefined for a trail | **Accepted.** `PathLayer.center` with the rule "each sample to `center` at its own time; the line placed at `center` at clock time"; both readings tested |
| 7 | One mean radius is insufficient | No flattening anywhere in `src/` | **Accepted as optional fields** (`equatorialRadiusKm`, `polarRadiusKm`); the mean radius stays what scale policies map; first used by Jupiter in step 6 |
| 8 | `redistributable: false` does not keep a file out of a bundle; imagery rights are not scientific provenance | Vite statically bundles imported assets | **Accepted.** Separate `AssetLicence`; a failing test for unlicensed textures; a public build mode that substitutes them and a validator over `dist/` |
| 9 | The provider factory is Orb-specific | `src/core/astronomyAdapter.ts:7` | **Rejected in part.** `AstronomyAdapter` is the engine's own interface; Orb sits behind `createOrbAstronomyAdapter`. What is true is that its methods are body-enumerated, so the planets add one method for all eight rather than one each. No generic provider-factory abstraction is introduced |
| — | Lighting scalability is deferred | B.4 | **Agreed and already scoped**: the full-system claim is not made until Gate D; the comparison is measured in step 6 |
| — | Per-body exaggeration should be proven on rings and atmospheres | — | **Accepted**: step 7 proof names Saturn's rings and atmosphere |
| — | The Moon's 254 km / 8.4° orientation offset is a deficiency of the asset, not of each experience | `docs/ASTRAEUS_SPIKE_02.md` §7 | **Accepted.** Every definition carries an `accuracy` record (dimensions and position provenance, validated date range, orientation limitations); the Moon's names this offset and the absence of libration |
| — | VSOP87A needs validation before it is the default | Section G already said so | **Agreed**; the validation is step 6's first proof and uses the existing Horizons method |
| — | A real non-Earth planetary system is needed as the architecture stress test; four imaginary bodies prove only refactoring | Brief §7 says "do not build the complete Solar System yet" | **Accepted as a scope decision for the owner (Decision 8).** Jupiter + Io: a non-Earth, non-Sun centre, a planet GM, IAU orientation, a spheroid, licensed donor textures, through the same contracts. It is one composition, not the system |

### Interfaces that change, and why

| Interface | Change | Why | Tested by |
|---|---|---|---|
| `CenterId` | open to any id the resolver knows | Decision 1 | unknown id rejected by the resolver; round-trip identities |
| `CelestialBodyDefinition` (new, core) | replaces `Body`; adds parent, GM, orientation model, optional spheroid radii, accuracy record | one definition per body; finding 7 and the Moon-offset finding | one-occurrence test; accuracy record present for every body |
| `StateSourceBinding` (new, core) | `{ body, create(adapter) }` | finding 5 and 9: provider binding separate from visuals, through the engine's own interface | fake adapter in tests |
| `StateResolver` (new, core) | `stateOf`, `offsetKm`, `sunFrom`; native-centre and root rules | the single recentring site | invariants (i)–(iii), Moon-from-Sun equality with the removed branch |
| `Trajectory` | signature unchanged; catalogued providers restricted to their native centre | finding 3 | `SampledTrajectory` pattern ("holds center") applied to `MoonTrajectory` after its callers move |
| `AstronomyAdapter` | adds `planetPositionFromSunKm(planet, t)` (step 6) | planets | Horizons fixtures |
| `ScalePolicy` | `id` opens; `mapRadius(radiusKm, bodyId?)`; third policy | Decision in O-011 | positions unchanged vs true scale; factor applied and shown |
| `PathLayer` | tagged union `orbit` (co-moving, optional `center`) or `trail` with `frame: "relative" \| "inertial"` | finding 6, Addendum 2 issue 3, Final review correction 2 | all three readings on made-up sources; Moon orbit path equals today's; Columbia relative trail in a Sun-centred scene; stationary object under a moving centre |
| `BodyAsset.source` | optional for the root only; catalogue validates every non-root body has one | Final review correction 1 | catalogue rejects a parented body without a binding and a root with one |
| spheroid rendering | equatorial and polar radii mapped independently through `mapRadius` | Final review correction 3 | drawn radii equal the mapped actual radii under each policy |
| `TextureRef` / `AssetLicence` (new, assets) | licence record or explicit `localOnly` declaration with a public replacement | finding 8, Addendum 2 issue 2 | metadata gate (licence xor local-only); public-build output gate over `dist/` |
| `createCenteredPosition` | accepts `body === center` only with an exactly zero position | Addendum 2 issue 1 | constructor and resolver self-state tests for every body |
| `ExperienceDefinition` | adds `composition`, `sceneCenter`, `visualOverrides`, `scaleChoices`; `ExperienceRuntime.moon` becomes `resolver` + `catalogue` | the experience cannot own a body | plug-in contract tests; name check |

Unchanged: `State`, `CenteredPosition`, `SimulationClock`, `PointGroup`, `createOrbitGroup`, `TwoBodyAdapter` (GM lookup grows from the definitions), `TimelineEvent`, `TimelineWindow`, `Provenance`, every shell contract.

### Approval gates (replacing the broad criteria in section I as the acceptance structure)

| Gate | Proves | Satisfied by |
|---|---|---|
| **A — Scientific integrity** | pure core, native centres, tested transformations, no core→assets import | steps 1 and 3 tests; a dependency test that `src/core/` imports nothing outside itself and Orb |
| **B — Asset independence** | Earth and Moon defined once; Earth–Moon Explorer and Apollo give identical scientific results; no experience owns a body's dimensions, state or orientation | steps 2 and 5; E.3 items 1–3 and 5 |
| **C — Genuine composability** | Sun–Earth Perseids composition stands alone; a real planetary satellite composition proves non-Earth centres | step 5 (Perseids) and step 6 (Jupiter + Io), per Decision 8 |
| **D — Production foundations** | measured GPU precision, browser frame rate, explicit accuracy limits per body, a scalable lighting strategy, redistribution-safe textures | precision in step 3, frame rate in step 5 (O-011's 30 fps / 20,000 members target), accuracy records from step 1, lighting comparison in step 6, public build in step 5. Staged; no full-Solar-System claim before all five are met |

Gates A–C are the architecture's validity. Gate D is staged and its thresholds are the ones already recorded in O-011 and `docs/ASTRONOMY_VALIDATION.md`; new thresholds (planet positions, IAU rotation) are set when their fixtures are built, by the same method.

**Decision 8 — Jupiter + Io as the Gate C stress composition.**
*Recommended:* yes, as step 6 of the migration and a success condition of the new Objective, after the Earth–Moon–Sun slice. Pro: it is the only way to show the architecture is not "Earth–Moon with configurable names" before the full system is attempted, and it exercises a non-Sun GM, a spheroid, IAU orientation and licensed textures in one composition. Con: it widens the spike beyond the brief's Earth, Moon and Sun slice by one planet provider, one orientation model and one satellite from published elements; O-011 resumes later.
*Alternative:* keep the spike to the slice and make Jupiter + Io the first Objective of the next spike. Pro: smaller. Con: the composability claim rests on Sun–Earth and a made-up chain until then.

**Owner decision 8 — 2026-10-11.** Jupiter and Io join this spike as step 6, with the instruction to reuse elements from the sister project Planetary Explorer, which already has both bodies "albeit without the scientific grounding". Checked against the donor on the same day, the reuse is:

| Donor element | Reusable? | Terms |
|---|---|---|
| `io-2k.jpg` / `io-4k.jpg` | Yes | USGS Astrogeology Galileo SSI colour mosaic, public domain, full source, processing and projection record in the donor's texture README; becomes Io's `TextureRef` with an `AssetLicence` |
| `jupiter-2k.jpg` / `jupiter-4k.jpg` | **No, not yet** | The donor README has no Jupiter section; the file is flagged there as byte-identical to the 4k variant and "flagged for investigation". Unlicensed under this design's rule: Jupiter is drawn with its material colour (or a cleared replacement the owner supplies) until a source and licence are recorded |
| `jupiter.ts` material and atmosphere values, ring band table (halo, main, gossamer) | Yes, as data | Numbers, re-expressed in km rather than scene units; Jupiter's rings are optional for the step |
| `io.ts` material values | Yes, as data | Same |
| `PlanetConfig` shape | Pattern only | Model for `BodyVisual`; camera, categories, hotspots and display spin are not carried over |
| `SaturnRingMesh.tsx` disc technique | Pattern only | Donor code licence unresolved; reimplemented, not copied, as the existing adaptations were |
| Moon placement (`OrbitalCompanions.tsx`: scene-unit radii, decorative orbit) | **No** | This is the "without scientific grounding" part; Io's position comes from published mean elements about Jupiter's GM through `createTwoBodyTrajectory`, `reconstructed` provenance, and its orientation from the IAU model |

The scientific grounding (Jupiter from VSOP87A, Io from elements, GM, spheroid radii, IAU orientation, validity ranges) is Astraeus's, as the architecture requires; the donor supplies looks and numbers under recorded licences.

---

## Addendum 2 — Response to the re-review (2026-10-11)

The independent re-review returned CONDITIONAL APPROVAL: engine boundary, catalogue and compositions, and experience separation approved; resolver and path contracts needing minor revision; the implementation plan conditional on four targeted amendments and four stale-text fixes. All are applied in place and marked "Addendum 2".

| # | Issue | Disposition |
|---|---|---|
| 1 | A body cannot be its own centre, yet the resolver promised a zero Sun | **Fixed, one universal rule (C.1):** a self-centred State is valid when, and only when, its position is exactly zero; `createCenteredPosition` changes from rejecting `body === center` to accepting that zero case; `stateOf(b, t, b)` is that State for every body. Constructor and resolver tests named |
| 2 | The licence test would fail on day one because two textures are kept unlicensed | **Fixed (C.3):** two classes, two gates. Metadata gate: licence *or* explicit `localOnly` declaration with a public replacement, never neither or both. Output gate: public build substitutes at the import so the bytes never enter the bundle, and a validator hashes `dist/` against the local-only sources |
| 3 | Co-moving orbit versus historical trail were not distinct enough | **Fixed (C.6):** `PathLayer` is a tagged union, `orbit` (co-moving, shape preserved, history lost) or `trail` (per-sample to the scene centre at the sample time, history preserved, no relocation). Both use only native states plus the resolver's offsets, so Apollo's non-catalogued trajectories work through the same path; tests for both, including Columbia as a trail in a Sun-centred scene |
| 4 | Jupiter + Io proved arithmetic, not physics | **Fixed (step 6):** Io checked against JPL Horizons at six or more dates; acceptance line one Io diameter with the basis stated; inside the line an approximate ephemeris-tier record with the figure, outside it an explicitly classified approximate demonstration. Either outcome is recorded; the architecture test counts in both |
| — | Step 1 said the Moon's Sun branch is removed; C.2 keeps it until step 3 | Fixed: step 1 keeps it |
| — | Cross-cutting table still named `redistributable` | Fixed |
| — | Risk table placed centre validation in `createCenteredPosition` | Fixed: the resolver owns it |
| — | Acceptance criterion 1 was a text search | Fixed: duplicate-id rejection in the catalogue and resolver, plus a dependency test that only core exports definitions or bindings |

Scope is not expanded further.

---

## Final review — APPROVED with three corrections (2026-10-11)

The third independent pass approved the scientific architecture, the catalogue, scene composition, experience separation and the migration strategy, with scientific verification approved as a plan pending implementation evidence. It asked that three details be resolved during planning rather than in another design cycle. All three are applied in place and marked "Final review, correction N":

| # | Correction | Where |
|---|---|---|
| 1 | `BodyAsset.source` is optional for the root body only; the catalogue validates that every parented body has a binding and the root has none | C.4 |
| 2 | A trail is either *relative* (position from the scene centre at the sample time; today's behaviour) or *inertial* (common root frame at the sample time, offset by the scene centre at display time); test with a moving centre and a stationary object | C.6 |
| 3 | Under True scale a spheroid's equatorial and polar radii are mapped independently; the mean radius remains the metric and framing value | C.3 |

**Review status.** Approved for implementation planning. No implementation Tasks exist yet. `savepoint-design` now plans the new Objective (Decision 6) from migration steps 1–6 with Gates A–D as its success conditions, carries these three corrections into the relevant Tasks and acceptance tests, and records the O-011 re-plan.
