---
id: T-043
title: Give each body a visual record and one renderer
objective: O-014
status: done
depends_on: [{task: T-042, requires: clear}]
owner_validation: {required: true, accepted_check: C-016, accepted_by: {role: owner, session: owner-chat-o014-live-look-20261012}}
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

Executor evidence (claims for a fresh Check to verify; no Check or owner waiver recorded).

**Per criterion**
1. Catalogue: `src/assets/catalogue.ts` `createCatalogue(definitions, bindings, visuals)` builds `catalogue` from explicit imports (`BUILT_IN_BODIES`, `BUILT_IN_BINDINGS`, three visual entries). Throws on duplicate id, parented body without a source, root with one, visual without a definition (also definition without visual, source without definition, texture failing the rights rule). `definitions()`/`sources()` equal the built-in arrays and build a working resolver. Tests: `tests/assets.test.ts`.
2. Visuals: `src/assets/bodies/{sun,earth,moon}.ts`. Sun marker (9 px, `#fff1b0`; an experience's own `SunBody` colour/size still overrides, so the belt Sun is unchanged), Earth sphere (texture, `EARTH_MATERIAL`, `EARTH_ATMOSPHERE`, yaw 0, lights 0.18/1.8), Moon sphere (texture, `MOON_MATERIAL`, yaw 0, lights 0.08/1.4). The constants and `EARTH/MOON_TEXTURE_YAW_RAD` are removed from `BodyMesh.tsx`, `AtmosphereGlow.tsx`, `sceneLayout.ts` and the scene; they exist once. Values asserted in `tests/assets.test.ts`.
3. Texture rights: `src/assets/licence.ts` (`AssetLicence`, `TextureRef`, `textureRightsProblem`). `earth-2k.jpg` localOnly with reason, replacement `material-colour`; `moon-orig-2k.jpg` localOnly with reason, replacement the donor LROC public-domain map named (not copied). Files moved to `src/assets/textures/`. `tests/textureLicence.test.ts` fails neither/both/empty reason and checks both declared textures. Output gate left to the later Task, as planned.
4. BodyView: `src/app/BodyView.tsx` (React mount) over `src/app/bodyDraw.ts` (`drawnRadii`, `markerOf`, `createMarker`, `describeBody`). The scene mounts Earth and Moon as `BodyView` instances; the Sun is drawn by `BodyMarkerView` (SunCentredView.ts, replaces `SunView`) through `createMarker` from the Sun record. Tests (no React renderer in this repo, so decisions are tested through `describeBody`/`createMarker`, mounting through the browser runs): sphere with/without texture, with/without atmosphere, marker, fake spheroid whose drawn radii equal `mapRadius(equatorialRadiusKm)` and `mapRadius(polarRadiusKm)` under both policies.
5. Snapshot: `tests/fixtures/scene-placement-pre-t043.json` was generated at ea592a3 (before any change) for 5 dates x 2 policies (Earth/Moon group positions, mesh quaternions); `tests/sceneTransforms.test.ts` compares exactly (signed zero normalised because JSON drops -0). Passes.
6. `tests/layerRule.test.ts`: new case, `src/assets/` imports only `src/core/`, itself and `three`. Passes.
7. Gates and browser runs below. Owner's look pending.

**Commands run (final tree)**
- `npm run typecheck`: pass.
- `npm run build`: pass (only the existing chunk-size warning).
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 23 files, 417 tests, all pass (was 412 before; includes 5 new date cases).

**Browser validation** (headless Chromium, `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js`, vite on :5199 for the after tree, :5198 for a detached worktree at ea592a3, removed afterwards). Fresh run directory `docs/evidence/o014-t043-20261011T095118/` (results in `docs/evidence/o014-t043-20261011T095118/results.txt`, per-script `stdout.log`); no historical evidence touched.
- after: spike03 (1440x900, 1280x800, 768x1024, 390x844) pass, 0 console errors; spike02 pass; showers pass; synthetic pass; synthetic-ring pass; anchor-labels pass; shell (1280x800 and 390x844) pass; all with `"errors": []`.
- after: synthetic-belt FAILS with the known `desktop/True: Earth's path is drawn (16)` (Issue I-020, T-045). The same assertion fails identically on the before tree (`docs/evidence/o014-t043-20261011T095118/before/synthetic-belt/stdout.log`), so T-043 does not make it worse. The assertions after that point in the script therefore did not run on either tree; belt screenshots exist for both.

**Owner look (owner_validation required) - before/after screenshots**
- Before (ea592a3): `docs/evidence/o014-t043-20261011T095118/before/spike03/`, `docs/evidence/o014-t043-20261011T095118/before/synthetic-belt/`, `docs/evidence/o014-t043-20261011T095118/before/synthetic/`.
- After: `docs/evidence/o014-t043-20261011T095118/after/spike03/`, `docs/evidence/o014-t043-20261011T095118/after/synthetic-belt/`, `docs/evidence/o014-t043-20261011T095118/after/synthetic/` (same file names). Apollo default view at Spike 03 dates, close Earth, close Moon, translunar coast, spacecraft follow, mobile 390x844; belt readable/true focus, zoom in/out and the Sun view.
- Other after-tree screenshots from the remaining scripts: `docs/evidence/o014-t043-20261011T095118/after/{spike02,showers,synthetic-ring,anchor-labels,shell}/`.
- Pixel diff (`docs/evidence/o014-t043-20261011T095118/pixel-diff.json`, per-file counts of pixels differing, canvas read in Chromium): spike03 shots 0.000-0.223 % of pixels differ except `close-moon` 6.6 %; belt shots 0.006-0.068 %; synthetic 0-0.35 %. These are not zero because the app animates and swiftshader is not deterministic: the same ea592a3 tree compared with a second run of itself (`docs/evidence/o014-t043-20261011T095118/pixel-diff-baseline-noise.json`, `docs/evidence/o014-t043-20261011T095118/before-rerun/`) gives the same order of noise (close-moon 8.6 %, spacecraft-follow 0.22 %). I viewed close-moon before and after: identical look. Exact placement equality is proven by the snapshot test (criterion 5), not by pixels.
- The "six telemetry times": spike03's `browser-results.json` shots cover the default view and the scripted telemetry seeks; I did not separately enumerate six times beyond what the script captures. True/Readable on desktop and phone are covered by spike03/shell/belt.

**Extra reads (outside Context Files)**: `src/core/body.ts`, `src/core/bodies/{earth,sun,moon}.ts`, `src/core/scalePolicy.ts`, `src/core/stateResolver.ts` (signature), `tests/layerRule.test.ts`, `tests/sunCentred.test.ts`, `src/synthetic/syntheticRingDefinition.ts` (Sun record values), `src/app/AtmosphereGlow.tsx`/`BodyMesh.tsx` already listed; `tools/validate/browser-*.mjs` headers (run parameters); `.savepoint/config.yml` (gates). Reason: join types, keep the experience Sun unchanged, run the scene gate.

**Limitations**: BodyView's React mount (spheroid scale group, marker branch) is exercised in the browser only for the Earth and Moon spheres; the spheroid and marker paths of the React component are covered through the plan functions in unit tests, not by a mounted test. Pixel comparison is noisy as above. Public-build output gate not in scope. `junit.xml` was regenerated by the test gate (untracked/ignored as before).

## Drift Notes

Record architecture deltas here; the integration Task reconciles them into Design.

- `BodyView` is split: pure draw decisions in `src/app/bodyDraw.ts` (testable without a renderer) and the React mount in `src/app/BodyView.tsx` (planned as `BodyView.ts`). Marker creation shared by the Sun item. Deferred to T-050 for Design.md reconciliation.
- `SunView` is replaced by `BodyMarkerView` in `SunCentredView.ts`; `SunBody` stays in `experienceDefinition.ts` and still overrides marker colour/size (the experience's choice); folding `SunBody` into the catalogue Sun is for T-047. `tests/sunCentred.test.ts` renamed the class (not in planned writes). Deferred to T-047/T-050.
- `AtmosphereConfig` and `BodyMaterialConfig` types moved into `src/assets/visual.ts` so `src/assets/` imports only core and three; `AtmosphereGlow`/`BodyMesh` import them from assets. `BodyMesh` now accepts an absent texture. `sceneLayout.ts` reads texture yaw from the visual records (constants removed). `docs/DONOR_PROVENANCE.md` texture paths updated.
- `createCatalogue(definitions, bindings, visuals)` takes three lists (a visual can only be "without a definition" if visuals are a separate input) instead of the design sketch's `BodyAsset[]`. Deferred to T-050.
- Fixture `tests/fixtures/scene-placement-pre-t043.json` added (not in planned writes).

## Context Log

- Started: status in_progress, stage build; router task T-043 (release G-004 unchanged).
- Build: assets layer, BodyView/bodyDraw, scene and Sun item rewired; baseline placement fixture captured at ea592a3 before editing.
- Test: stage test; 417 tests pass; browser runs in a fresh evidence directory; temporary ea592a3 worktree and both vite servers removed.
- Audit: stage audit, ready for a Check. Not done; no owner waiver or acceptance recorded.

## Completion

- 2026-10-12 — Owner accepted T-043 against C-016 after a live side-by-side look (pre-O-014 8fc6fce on :5301 vs 2d8b2dd on :5302): Apollo unchanged at the six mission moments in both scales, Sun-centred belt with the Sun at the centre and Earth on its path. Owner's words: "accept T-043, T-044". Recorded and `status: done` set by the orchestrator on the owner's direct instruction.
