---
id: T-053
title: Put the real stars and the Milky Way behind every experience
objective: O-011
status: done
depends_on: [{task: T-051, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o011-replan-i025-2026-10-13}
lane: sky
planned_reads: [src/app/AstraeusScene.tsx, src/app/renderCoordinates.ts, src/app/floatingOrigin.ts, src/app/CameraController.tsx, src/assets/licence.ts, src/app/experienceDefinition.ts, vite.config.ts, tools/validate/public-build-assets.mjs, docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md]
planned_writes: [src/assets/sky.ts, tools/data/fetch-stars.mjs, .gitignore, src/assets/textures/milky-way.jpg, src/app/SkyView.ts, src/app/AstraeusScene.tsx, src/app/experienceDefinition.ts, tests/sky.test.ts, tools/validate/browser-sky.mjs, docs/DONOR_PROVENANCE.md]
---

# Put the real stars and the Milky Way behind every experience

## Outcome

Every experience draws a starry sky behind the scene: stars from the catalogue chosen in the research record, at their J2000 positions in the EQJ frame, sized and tinted by magnitude and colour index, plus the licensed Milky Way image, rotated into the same frame. The sky sits at infinity. It does not move with the scene centre, the floating origin or the scale policy, and it turns only with the camera. Each experience may dim or hide it; the default is on. The information panel's sky item cites both sources.

## Astraeus Hypothesis

- **Capability tested:** that a background frame layer can be shared by every experience and composition without touching State (ARCH-02) or any experience's code.
- **Contract reused:** render axes (`eqjToRenderVector`), the camera, `TextureRef`/`AssetLicence`, the public-build gate, the shell's item list.
- **Gap:** the scene has a black background; nothing places directions at infinity.
- **Generic change:** `SkyView` (stars as one points object, plus an inside-out sphere for the image), a sky asset record in `src/assets/sky.ts`, and `ExperienceDefinition.sky?: { visible?: boolean; brightness?: number }`.

## User Check

Open Perseids, Earth–Moon Explorer and Apollo. Stars and the Milky Way are behind everything. Rotating the view turns the sky; following Earth or changing scale does not shift it. Recognisable constellations (Orion, the Plough, Perseus) look right. Compare the sky around Perseus with a planetarium or star chart.

## Done When

1. Star directions: for at least five named stars (Sirius, Polaris, Betelgeuse, Vega, Algol), the drawn direction equals the catalogue RA/Dec through `eqjToRenderVector` to 1e-9 rad (independent oracle: the catalogue values).
2. The Milky Way alignment is checked: the galactic north pole and the galactic centre fall at their cited J2000 coordinates within 0.5°.
3. Invariance: changing scene centre, scale policy, floating-origin rebase or follow target changes no star's screen direction for a fixed camera orientation (test); State is untouched.
4. A made-up three-star catalogue mounts in a test first (ARCH-03); the real catalogue subset and image carry licences (PROV-02); the public-build validator passes and proves no `data/local/` content is in the build.
5. Performance: the frame rate with the sky on is recorded for Perseids and Apollo, and each stays at or above the previous figure minus 10% (recorded).
6. `browser-sky.mjs` asserts stars are drawn, the sky is fixed under a centre change, and zero console errors at both sizes; every browser script passes in a fresh run directory; the owner's look recorded separately.

## Context Files

`src/app/AstraeusScene.tsx`, `src/app/renderCoordinates.ts`, `src/app/floatingOrigin.ts`, `src/app/CameraController.tsx`, `src/assets/licence.ts`, `src/assets/catalogue.ts`, `src/app/experienceDefinition.ts`, `vite.config.ts`, `tools/validate/public-build-assets.mjs`, `docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md`.

## Design References

Design: Architecture (asset layer); Interfaces and Data Flow (render axes, floating origin); Guardrails ARCH-02, PROV-02.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, PROV-01, PROV-02, TEST-01, TEST-03, STYLE-05, STYLE-09.

## Implementation Plan

1. Confirm the research record named both sources with licences; REPLAN REQUIRED otherwise.
2. Write a committed fetch tool that downloads the Yale BSC from its source and writes the subset with a provenance header to the git-ignored `data/local/` (owner decision, T-051 replan); nothing from the catalogue is committed. Without the file, the sky draws the Milky Way only and says the stars are not fetched; tests needing real stars skip with a stated reason.
3. Write `SkyView` (camera-relative, no floating-origin offset, drawn first, depth write off).
4. Tests per Done When on a made-up catalogue first, then the real one.
5. Wire the default-on sky into the scene; add `browser-sky.mjs`; run gates, the public build and every browser script.

## Boundaries

No planet or body changes. No sky motion with time beyond the J2000 frame (no precession of the star field), stated as a limitation. No ground view.

## Technical Verification

Focused tests, configured gates, the public-build validator and every browser script in a fresh run directory. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Builder session (Sonnet), 2026-10-13. Not committed, not marked done, no Check written, no owner acceptance recorded. Owner look required (owner_validation).

### Per-criterion outcome

1. **Star directions - met.** `tests/sky.test.ts`: made-up stars and Sirius, Polaris, Betelgeuse, Vega, Algol (published J2000 values written independently in the test, trig re-derived there) match `starRenderDirection` through `eqjToRenderVector` to under 1e-9 rad (angle by atan2 of cross and dot). The Float32 GPU buffer is within 1e-6 rad (the one narrowing; 1e-9 holds for the Float64 direction the buffer is filled from). With the fetched file present: the five named stars are found in the catalogue within 2 arcsec of the published values, and the file has 8,404 stars, V <= 6.5, Sirius brightest (-1.46). Those two tests skip with a stated reason when `data/local/yale-bsc-v65.json` is absent.
2. **Milky Way alignment - the rotation is met, the picture's own registration is NOT within 0.5 deg.** Tests: `galacticToEqj(0,90)` and `(0,0)` against the cited pole (192.8594812065348, +27.12825118085622) and centre (266.405, -28.936) are within 0.5 deg (actual: about 1e-3 deg); `milkyWayUv` puts the pole on the top edge and the centre at the picture's middle; Sirius, Vega and the LMC reproduce published galactic l/b to 0.01 deg; every vertex of the picture mesh carries the picture coordinates of its own galactic position (tested against `milkyWayUv`, under 1e-3 deg). The C-027 caveat (research only checked the centre and the LMC by eye) was tested against the image itself, scratch scripts not committed: (a) cross-correlating the 626 BSC stars of V < 4.2 against local contrast in the 4096x2048 file gives one strong peak (score 434 against a median of -3.6) at an offset of about (+0.9 deg l, -1.7 deg b), but only the l -180..-90 region (Orion, Canis Major) carries it; other regions give weak, inconsistent offsets (the panorama's own stars are too faint or removed to correlate); (b) the LMC and SMC blob centroids sit about 2.5 deg and 1.2 deg off their published l, and 1.4 and 1.9 deg off in b, with different signs from (a). So the ESO panorama is a mosaic that agrees with the IAU galactic frame only to a few degrees, not 0.5 deg; it cannot be corrected by one shift. The picture's centre and plane are right to a few degrees and the stars (catalogue positions) are exact. Owner decision needed on whether a few degrees of Milky Way registration is acceptable (the panel's accuracy line says so).
3. **Invariance - met.** Test: three cameras with one orientation but different position, near and far (scene centre, rebase, scale and follow target only change where the camera is) give the same screen position for every star to 1e-6 NDC; `SkyView.follow(camera)` takes nothing but the camera; a rotation moves the probe and a translation does not; the sky modules import nothing from `src/core` except provenance (ARCH-02). Browser: with Developer mode on, after the Readable and True scales, Overview, Focus and Follow requests (or the phone's Camera mode select) the probe's screen position equals the position computed in the script from the camera orientation alone (tolerance 1e-3 NDC), for Apollo, Earth-Moon and Perseids at 1280x800 and 390x844; a drag moves it (desktop; skipped on phone where the developer panel covers the canvas, stated in the result file).
4. **Made-up catalogue first, licences, public build - met.** A made-up three-star catalogue mounts and unmounts in a test; `MILKY_WAY_TEXTURE` carries a CC BY 4.0 `AssetLicence` crediting ESO/S. Brunier (`textureRightsProblem` null); docs/DONOR_PROVENANCE.md records both sources. The public-build validator now also hashes every file under `data/local/`, searches for a text window of it in scripts and fails on any path under `data/local/`; `proveItFails` shows it failing on a made-up local file copied, embedded as text and by path alone (tests/publicBuild.test.ts), and the real public build (`ASTRAEUS_PUBLIC_BUILD=1`) passes with the fetched star file (256,817 bytes) among the sources (result in the run directory). The star data is not in `dist/` (the credit text "Hoffleit and Warren" is, as a citation).
5. **Performance - NOT met in this environment.** Headless Chromium with software GL (swiftshader), Developer-tools frame counter, `?sky=off` against the sky on, final run: Apollo desktop 35.2 -> 30.2 fps (-14%), Earth-Moon desktop 36.9 -> 31.7 (-14%), Perseids desktop 30.7 -> 24.9 (-19%); phone: Apollo 60 -> 56.5, Earth-Moon 60 -> 46.2, Perseids 48.5 -> 38.1. An ad hoc sequential run on Earth-Moon desktop gave about 35 -> 32 (-8%). The cost is one extra full-screen textured pass, which software GL pays per pixel (a first version with a per-pixel shader and an sRGB texture cost about 16-20%; the final mesh with a raw-sRGB texture and no mipmaps is cheaper). No GPU was available, so the real-device cost is unmeasured and presumably small. Only the owner's own frame counter on a real GPU settles criterion 5.
6. **Browser script - met.** `tools/validate/browser-sky.mjs` asserts: 8,404 stars drawn, more lit and bright pixels than the same view with `?sky=off`, the Sky item's provenance names the Yale catalogue and ESO/S. Brunier and counts the stars, the sky fixed under centre/scale/follow changes, the sky turning on drag, zero page and console errors, for three experiences at both sizes. The no-file path was checked separately (`no-star-file-check.json`, the data request answered as the dev server answers a missing path): 0 stars, the panel says "not fetched", no console errors. Every browser script ran in the fresh run directory below: all 13 exit 0. The owner's look is recorded separately.

### Commands run (all in /home/user/code/Astraeus, branch spike-04)

- `node tools/data/fetch-stars.mjs` -> 8,404 stars of 9,110 records, 14 skipped, `data/local/yale-bsc-v65.json` (git-ignored, `git check-ignore` confirms).
- `npm run typecheck` (exit 0), `npm run build` (exit 0), `npm test` (32 files, 587 tests, all passed; 18 in tests/sky.test.ts, one added to tests/publicBuild.test.ts), `ASTRAEUS_PUBLIC_BUILD=1 npx vite build --outDir <scratch>` then `node tools/validate/public-build-assets.mjs <scratch> <run>/public-build-assets.json` (ok: true, 9 files checked, 1 local-data file among the sources).
- Browser suite, final run, dev server on port 5199, `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js`: `browser-{sky,earth-moon,jupiter-io,lighting,precision,showers,synthetic-belt,synthetic-ring,synthetic,anchor-labels,shell,spike02,spike03}.mjs`, each with `ASTRAEUS_EVIDENCE_DIR=<run>/<name>`; exit codes and times in `<run>/logs/browser-exit.txt`. Run directory: `docs/evidence/o011-t053-20261013T100655Z-final/` (started 2026-10-13T10:06:55Z, finished 10:24:14Z). Earlier runs kept as history: `o011-t053-20261013T093257/` (first browser-sky run, per-pixel shader version, passing) and `o011-t053-20261013T094527Z/` (suite run before the three script updates below; browser-earth-moon, browser-jupiter-io and browser-showers failed there because the sky changed what they count; all others passed).
- `browser-anchor-labels.mjs` writes its results JSON to the fixed historical directory `docs/evidence/regression-spike01-02/anchor-labels/` regardless of `ASTRAEUS_EVIDENCE_DIR`; that run overwrote one committed file and added a phone file there. Both were reverted (`git checkout` and a delete) so the historical evidence is as committed; this run's anchor-labels pass is recorded only by its exit code and log in the run directory. The script's fixed output path is a standing hazard for the historical-evidence rule.
- Scratch measurements not committed: image alignment scripts, the ad hoc frame-rate comparisons, the no-file check script (its output is committed as `no-star-file-check.json`).

### Browser script changes (scenario map)

- `browser-earth-moon.mjs`, `browser-jupiter-io.mjs`: the object-list assertion now includes the sky item (`["earth","moon","sky"]`, `["jupiter","io","sky"]`); every other scenario is unchanged.
- `browser-showers.mjs`: its Perseids scenes count pixels by colour against black (amber dots, orbit lines, a bright-pixel count), so they now open with `?sky=off`; scenarios and assertions unchanged. The sky on Perseids is covered by `browser-sky.mjs` (new). Apollo and synthetic-ring mounts in that script keep the sky on and passed.
- Lighting, precision, belt, ring, synthetic, anchor-labels, shell, spike02 and spike03 passed unchanged with the sky on. No coverage is deferred to another Task.

### Files

Read (Context Files): src/app/AstraeusScene.tsx, renderCoordinates.ts, floatingOrigin.ts, CameraController.tsx (grep only for near/far and pointer events), src/assets/licence.ts, src/app/experienceDefinition.ts, vite.config.ts, tools/validate/public-build-assets.mjs, docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md. `src/assets/catalogue.ts` listed in Context Files was not needed.

Extra reads (reason): src/app/App.tsx and src/main.tsx (where the runtime and shell experience are built); src/shell/AstraeusShell.tsx, ObjectControls.tsx, InfoPanel.tsx, infoModel.ts, experience.ts (how an item is listed and what selecting it does); src/core/provenance.ts (the shape of a source citation); src/app/PointsView.ts head, FrameRateSection.tsx (house style, the fps counter); src/assets/bodies/earth.ts (how a texture is declared); tests/layerRule.test.ts and tests/nameCheck.test.ts (assets may import only core and three, generic code names no experience: this forced the split into src/assets/sky.ts and src/app/skyModel.ts), tests/publicBuild.test.ts, tests/textureLicence.test.ts; package.json, tsconfig.json, .gitignore; docs/DONOR_PROVENANCE.md tail; tools/validate/browser-showers.mjs, browser-earth-moon.mjs, browser-jupiter-io.mjs, browser-synthetic-ring.mjs (grep) and the header comment of every other script (conventions, env vars, what they count).

Changed or added: `.gitignore`, `src/assets/sky.ts` (new), `src/app/skyModel.ts` (new), `src/app/SkyView.ts` (new), `src/assets/textures/milky-way.jpg` (new, 1.5 MB), `src/app/experienceDefinition.ts`, `src/app/AstraeusScene.tsx`, `src/app/App.tsx`, `tools/data/fetch-stars.mjs` and `.d.mts` (new), `tools/validate/public-build-assets.mjs` and `.d.mts`, `tools/validate/browser-sky.mjs` (new), `browser-earth-moon.mjs`, `browser-jupiter-io.mjs`, `browser-showers.mjs`, `tests/sky.test.ts` (new), `tests/publicBuild.test.ts`, `docs/DONOR_PROVENANCE.md`, evidence directories above. Planned writes not touched: none missing. Touched beyond `planned_writes`: App.tsx, skyModel.ts, public-build-assets.*, fetch-stars.d.mts, the three browser scripts, tests/publicBuild.test.ts (advisory only).

### Still stand-ins or unverified

- The Milky Way picture's registration to the galactic frame is good to a few degrees only (criterion 2); the picture also has its own faint stars baked in, which do not coincide with the catalogue stars, so with stars on a region shows two star populations.
- Criterion 5 on a real GPU is unmeasured; software GL showed -8% to -19% on desktop (see above).
- Star sizes, tints and the picture's brightness (0.7) are first-pass choices judged only from screenshots; the owner's look decides them. Constellation shapes were not compared with a chart by me.
- The sky does not move with the clock (J2000 frame, no precession or proper motion), as the Boundaries say.
- Stars load by a runtime request to `/data/local/yale-bsc-v65.json`, served by the Vite dev server; a production or preview build never reads it, so a built copy shows the Milky Way only. A host that answers an absent path with 404 would log one network error in a built copy; the production build skips the request entirely.
- The Perseids stream drawn in front of the sky is the earlier stand-in (T-052 and T-038 own it).

### Owner look feedback (rework)

2026-10-14T09:27:33Z. Owner look on the first build, relayed by the coordinator: "stars look..grainy not a fan"; "jsut feels 'low res'"; and the request "is it possible to just have the stars and switch the milky way on/off to compare? Or yes higher res version". The owner wants both: a Milky Way on/off switch with the stars staying, and a higher-resolution picture. Rework builder session started (stage build); no commit, Check or acceptance.

### Rework evidence (2026-10-14, rework builder session, Sonnet; not committed, no Check, no acceptance)

Response to the owner look feedback above. Run directory: `docs/evidence/o011-t053-rework-20261014T093012Z/` (browser results in `browser-sky/`, `anchor-labels/`, one folder per script, logs in `logs/`; browser-sky screenshots trimmed to Apollo desktop on, Apollo desktop picture-off and pixel ratio 2, and the picture-off views for Apollo and Perseids at desktop size).

- **Milky Way switch, stars stay.** `SkySettings.milkyWay?: boolean` (default true), `?milkyway=off|on` overrides it (`?sky=off` still hides everything), and a "Milky Way picture" button in Developer mode > Display settings toggles it live (`SceneControls.showMilkyWay`, canvas attribute `data-sky-picture`). Tests in tests/sky.test.ts and browser-sky.mjs (stars drawn with the picture off, fewer lit pixels than the full sky, live toggle, `milkyway=on`, pixel-ratio-2 run).
- **Resolution.** ESO's largest version of eso0932a is 6000x3000 (the Fullsize Original TIFF has the same pixels as the large JPEG), so the ceiling is 16.7 px/deg against 11.4 before (1.46x). Cut from the TIFF into two 3000x3000 JPEG halves (quality 78, 3.7 MB committed against 1.5 MB), drawn as two mesh sections; no texture exceeds 3000 px, so no GPU-limit fallback is needed. A 60 degree view on a 1920 px screen needs about 32 px/deg, so the picture is still magnified about 2x; no larger licensed source exists.
- **Not grainy.** Mipmaps on, trilinear minification, anisotropy at the GPU maximum; picture gain 0.7 to 0.5. Stars are Gaussian cores: width at half maximum from 1.5 CSS px (faint) to 3.7 (brightest), measured in device pixels (scaled by the pixel ratio).
- **Gates.** typecheck, build, npm test (32 files, 591 tests) and the public-build validator (ok) passed (`logs/gates.log`, `public-build-assets.json`). All 13 browser scripts exit 0 with zero console errors (`logs/browser-exit.txt`). The anchor-labels script again wrote to the fixed historical directory; restored with `git checkout`, the extra file deleted, fresh result copied to `anchor-labels/`.
- **Frame rate, software GL (swiftshader, no GPU), two alternating runs each (`logs/fps-controlled.txt`):** Apollo desktop sky off 33.7/35.8, sky on 30.8/31.7, picture off 35.4/35.8; Apollo phone 60/60, 54.3/59.4, 60/60; Perseids desktop 32.8/32.3, 25.7/25.7, 27.7/31.5; Perseids phone 45.6/45.8, 38.4/36.7, 46.0/44.5. The picture is the cost in software GL; stars are near free. Single runs inside browser-sky.json are noisier and not a comparison. Real-GPU figures unmeasured.
- **Still stand-ins or unverified.** Picture registration (a few degrees); default (on), gain, star sizes and tints await the owner's look; the seam between the two halves was not inspected at pixel level; criterion 5 on a real GPU.

### Owner feedback 2

2026-10-15T07:30Z, owner look on the rework, verbatim: "stars are crisp...but could use a bit more pop? I like the idea of the milky way, we do need to find a better texture. I think there is a case to have it in our assets with the ability to have milky way on or off, still find the stars arent sharp with the mily way on, but we could find better textures later".

Owner decision (AskUserQuestion, 2026-10-15): "Off by default (Recommended)". The Milky Way picture starts switched off; `?milkyway=on` or Developer > Display settings "Milky Way picture" turns it on. The picture stays in the assets.

### Pop rework evidence (2026-10-15, builder session, Sonnet; started 07:32:37Z; stage build, then test 07:34Z, then audit; not committed, no Check, no acceptance)

- **Default picture off.** `resolveSkySettings` (src/app/skyModel.ts) and `SkyView` (`options.milkyWay ?? false`) default to false; the App toggle's initial state already follows `runtime.sky.milkyWay`, so it starts off; `?milkyway=on` still turns it on. Doc comments in src/assets/sky.ts updated. Tests: settings default, `SkyView` default off and `milkyWay: true` on.
- **Star pop.** `starAppearance`: size 1.5 + 2.9 x^0.9 (was 2.2), strength 0.3 + 0.7 x^0.55 (was 0.35 + 0.65 x^0.7), plus a fragment peak gain of 1.25 (`STAR_PEAK`, Gaussian core stays; no blur, no halo). Before to after, size px (FWHM, CSS px) / strength; core peak with the gain in brackets:
  - mag -1.5: 3.70 / 1.000 to 4.40 / 1.000 (1.250)
  - mag 0: 3.33 / 0.912 to 3.91 / 0.924 (1.156)
  - mag 2: 2.81 / 0.785 to 3.23 / 0.810 (1.013)
  - mag 4: 2.27 / 0.638 to 2.52 / 0.669 (0.837, +31% peak, +23% area)
  - mag 6: 1.68 / 0.443 to 1.74 / 0.452 (0.565, +28% peak)
  Brightest stars gain 25-30% at the core and about 20-40% in size, so about 1.5x light for the bright few hundred; faint stars stay near 1.5-1.7 px. Colour times strength stays at or below 1 in the buffer; the peak gain clamps at white for the very brightest. Deterministic values and the comparison against the first pass are in tests/sky.test.ts.
- **Browser (fresh run, own vite on port 5199, since stopped; ports 5301 and 5302 untouched).** `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js ASTRAEUS_URL=http://localhost:5199/ ASTRAEUS_EVIDENCE_DIR=<run>/<name>` for browser-sky, browser-earth-moon, browser-jupiter-io, browser-showers: all exit 0, zero console and page errors (07:34:24Z to 07:41:00Z; times in `logs/browser-exit.txt`). browser-sky.mjs was updated for the new default: the "full sky" view opens with `?milkyway=on`, the default view is asserted picture-off with every star drawn, the live toggle and the dpr2 run are unchanged. Run directory `docs/evidence/o011-t053-pop-20261015T073424Z/`. Screenshot pair, same view (Apollo desktop): `sky/apollo-desktop.png` (picture on) and `sky/apollo-desktop-picture-off.png` (the new default); the same pairs exist for Earth-Moon and Perseids and phone. browser-anchor-labels.mjs was not run; earlier evidence directories untouched.
- **Gates (07:34:03Z).** `npm run typecheck` exit 0; `npm run build` exit 0; `npm test` 32 files, 592 tests passed (23 in tests/sky.test.ts; one added for star appearance).
- **Issue captured:** I-026 "The Milky Way picture is too soft beside the catalogue stars" (searched .savepoint/issues first: no duplicate; I-024 is Jupiter's texture). Better texture is out of O-011 scope.
- **Files changed this session:** src/assets/sky.ts, src/app/skyModel.ts, src/app/SkyView.ts, tests/sky.test.ts, tools/validate/browser-sky.mjs, `.savepoint/issues/I-026-the-milky-way-picture-is-too-soft-beside-the-catalogue-stars.md` (new), this Task file, new evidence directory. No extra reads beyond the files edited and tests/sky.test.ts.
- **Stand-ins or unverified.** Whether the new star pop is enough, and the default (off), await the owner's look; frame rate not re-measured (picture off is the cheaper path per the earlier measurements); the panel text for absent stars still says "only the Milky Way is drawn", which is now untrue while the picture is off by default (cosmetic, not changed).

### Wording fix and brightness settings (2026-10-15, builder session, Sonnet; not committed, no Check, no acceptance)

- **Panel wording.** The Sky item's note when the star file is missing now reads "Stars are not drawn: the star catalogue is not fetched on this machine. Run "node tools/data/fetch-stars.mjs" to fetch it. The Milky Way picture, when switched on, is drawn without them." (true whether the picture is on or off); tests/sky.test.ts asserts the new wording and the absence of "only the Milky Way". Re-run: typecheck, build, npm test (592), browser-sky exit 0, zero errors, `docs/evidence/o011-t053-pop-20261015T073424Z/sky-wording/` (own vite on port 5199, since stopped).
- **Owner direction, 2026-10-15, verbatim:** "should just be a brightness variable, remember our vission". Looks are tuned through settings, not code edits.
- **Settings.** `SkySettings.brightness` (used by nothing else) is replaced by `starBrightness` and `milkyWayBrightness`, each 0 to 2, default 1 (src/assets/sky.ts, `resolveSkySettings` throws on a bad definition value). From the address: `?stars=1.4`, `?milkywaybrightness=0.8` (`brightnessFromSearch` in src/app/SkyView.ts); a non-number or out-of-range value is ignored with a console.warn, never thrown. The star curve is unchanged, so starBrightness 1 is the current pop; the picture's baseline gain stays 0.5 times milkyWayBrightness. Experiences set both in `experienceDefinition.sky`.
- **Live sliders.** Developer > Display settings has "Star brightness" and "Milky Way brightness" range inputs (0 to 2, step 0.05) with the current value shown beside each (`data-testid` star-brightness-value, milky-way-brightness-value) so it can be read off for a settings file. They set `SceneControls.starBrightness/milkyWayBrightness`; the scene each frame calls `SkyView.setStarBrightness/setMilkyWayBrightness`, which only write the shader uniforms (no rebuild); the canvas carries `data-sky-star-brightness` for checks. Files: src/assets/sky.ts, src/app/skyModel.ts, src/app/SkyView.ts, src/app/AstraeusScene.tsx, src/app/App.tsx, tests/sky.test.ts, tools/validate/browser-sky.mjs.
- **Tests.** Defaults, ranges (0, 2 accepted; -1, 2.01, NaN rejected), URL parsing (valid, absent, four bad values warn and return null), in-place uniform changes. npm test: 32 files, 593 tests passed. typecheck and build exit 0.
- **Browser.** browser-sky now asserts the star slider moves `data-sky-star-brightness` to 1.5 with the star count unchanged, shows its value, the Milky Way slider shows its value, and `?stars=1.4` sets 1.4, at desktop and phone for three experiences. browser-sky, earth-moon, jupiter-io, showers all exit 0, zero errors (07:52-07:55Z), `docs/evidence/o011-t053-pop-20261015T073424Z/brightness/`. browser-anchor-labels not run.
- **Unverified.** The owner's look at the sliders; Milky Way slider is asserted for its displayed value only, not the picture's pixels.

## Drift Notes

Record architecture deltas here; T-040 reconciles them. Deferred to T-040 (named here per project rules), each to be accounted as reflected in Design.md or non-architectural with a reason:

1. `ExperienceDefinition.sky?: SkySettings` ({ visible?, starBrightness?, milkyWayBrightness?, milkyWay? }), sky default on, Milky Way picture default off (owner decision 2026-10-15); `?sky=off` hides it (presentation, no State).
2. New sky layer: `src/assets/sky.ts` (EQJ and galactic frame maths, star file parse and runtime loader, licence and sources, never reads `data/local/` in a production build) and `src/app/skyModel.ts` (render-frame buffers, the picture mesh, the shell item, settings check); `SkyView` is a camera-following group on layer 0, drawn first in the first render pass, depth off, scaled to the midpoint of near and far each frame.
3. Every experience's shell list now ends with a `sky` item, appended in `App` (not in any definition) with provenance citing both sources and the stars' fetched state.
4. Local data convention: git-ignored `data/local/`, committed fetch tools under `tools/data/`, public-build validator extended to prove none of it ships (hash, text window, path).
5. Developer-mode canvas attributes `data-sky-stars` and `data-sky-probe` expose the sky for browser checks.

## Done

Task Check C-028 CLEAR, 2026-10-15T08:02Z. Owner look given in chat on 2026-10-14/15; the owner accepted in their own words ("fine at one by default"; frame rate "ok for now"; Milky Way picture off by default, a better texture later under I-026). `status: done` was set by the O-011 orchestrator under the owner's delegation ("You may mark a task Done after a satisfactory check, except tasks that need my look"), after that look. Actor {role: owner-delegate, session: o011-orchestrator-check-20261013}.
