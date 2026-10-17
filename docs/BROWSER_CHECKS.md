# Browser checks: what runs, what moved, where each scenario is covered

Owner direction, 2026-10-17: "One 10sec visual inspection beats 40mins of auto browser checks." Automation keeps only what eyes cannot judge: crashes and console errors on every page, shipped-data and licence rules, numbers and credits a picture cannot show, and a pixel comparison against the before pictures. The look is judged by the contact sheet.

Environment for every command: `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js`.

## The interface driver (`tools/validate/driver.mjs`)

Owner direction, 2026-10-17, after one top-bar change touched 17 scripts: scripts do not know what the interface looks like. Every browser script drives the app through `driver.mjs` (`import * as ui from "./driver.mjs"`), which has one function per user action and per readout. When a button's label, icon or place changes, the driver is the only file edited.

| Area | Functions (all take `page` first) |
|------|------|
| Shell, time | `waitForShell`, `timelineText`, `pageText`, `pressKey`, `seekRange`, `seekTo`, `seekToFraction`, `seekToUtcText`, `setUtc`, `clockText`, `clockIso`, `clockMs`, `waitForClock` |
| Playback | `pausePlayback`, `ensurePaused`, `playPlayback`, `ensurePlaying`, `continuePlayback`, `isPlaying`, `waitUntilPlaying`, `setSpeed`, `speed` |
| Events, windows | `nextEvent`, `previousEvent`, `hasNextEvent`, `toggleEventList`, `openEventList`, `closeEventList`, `eventRows`, `pickEventRow`, `eventContextText`, `windowParts`, `glowCount`, `glowText`, `glowGradients`, `glowTooltipAt`, `goToWindowPeak`, `goToNamedWindowPeak` |
| Bodies, information | `pickBody`, `pickedBody`, `bodyOptions`, `bodyOptionCount`, `bodyOptionInfo`, `waitForBodyAvailability`, `openInfo`, `closeInfo`, `infoPanel`, `infoText`, `openProvenance`, `provenanceDetailText`, `pressRelatedObject`, `selectOrbit` |
| Camera | `chooseCamera(page, presetId)` (for example `"overview"`, `"focus-columbia"`, `"follow-moon"`, `"whole-orbit"`), `pickBodyWithCamera`, `cameraOffered`, `cameraActive` |
| Drawer | `toggleDeveloper`, `openDeveloper`, `closeDeveloper`, `developerOpen`, `pressToggle(id)`, `toggleOn(id)`, `setSlider(id)`, `dragSlider(id)`, `sliderReadout(id)`, `missionPanel`, `metric`, `copyViewLink`, `frameRate` |
| Story panels | `storyPanel`, `storyMarkers`, `openStoryPanel`, `closeStoryPanel`, `pressSceneStoryMarker`, `openStoryPanelIds` |
| Scale | `chooseScale`, `currentScale`, `scaleOptions`, `offersScale`, `scaleMenu` (the isolated menu harness) |

Elements are found by accessible name or role, by a stable `data-*` attribute (`data-camera-preset`, `data-related-object`, `data-scale-current`) or `data-testid`; the few controls with none of those (the Events summary, the information panel, a few readout containers) are named once, in the `HOOK` table at the top of the driver. Camera, toggle and slider arguments are logical ids, not labels, so a renamed label changes one table.

**The guard** (`tools/validate/driver-guard.mjs`, run in the unit tests by `tests/browserDriverGuard.test.ts`, and as `node tools/validate/driver-guard.mjs`) fails when a script outside the driver calls `getByRole`, `getByText`, `getByLabel` (or the other `getBy*` finders except `getByTestId`), calls `click`, `fill`, `selectOption`, `press`, `focus`, `check`, `hover` or `tap` on anything, uses `keyboard.`, or calls `locator`, `querySelector`, `querySelectorAll` or `waitForSelector` with any selector other than the exceptions. **Exceptions, stated in the rule:** the scene canvas (`canvas`, `getByTestId(...)`), data-attribute readouts (a selector that begins `[data-`), and `new Array(n).fill(0)`. `mouse.move/down/up/wheel` on the canvas is not flagged (scene drags and zoom). `OPT_OUT` in the guard lists scripts exempt from the rule with a reason; it is empty.

**Adding a script, or moving one onto the driver.** Replace each flagged line with the driver function that does the thing; when none exists, add one to `driver.mjs` (one function, named for the user action) and use it. A script merged from another branch is brought in line the same way before it runs in the full run (for example `browser-orbit-look.mjs` from I-035: orbit-look toggles become `pressToggle`/`setSlider` entries in the driver's `TOGGLES` and `SLIDERS` tables).

**Checks that name a scale, and the comet orbit (I-036, I-037).** A script that loads an address with `scale=<id>` uses `loadAddress` from the driver, which throws unless the experience offers that scale and it is the one in force (`assertScaleInUse`; `tests/browserDriverScale.test.ts` pins the rule). `browser-orbit-look.mjs` loads Earth-Moon with `scale=readable-scale` and asserts `currentScale` before checking the look. In `browser-showers.mjs` the comet orbit is proved from the scene alone (`ui.sceneCanvasPng`, the timeline bar blacked out) by the `orbit` colour test in `pathPixels` (the lavender the I-035 look draws): in the Sun Overview at the window start (more than 100 pixels, and under a quarter of that with the camera pulled in on the Sun so the orbit is out of view), and in the Whole orbit preset at the peak (more than 150). The Overview at the peak is recorded, not asserted: the line lies under the dense stream and the Sun's glow there.

**Scenario map for the move (T-083, TEST-03).** Every pass/fail scenario is unchanged. Three equivalent substitutions: (1) the scripts' "compact camera picker" branch (`.object-camera-picker`, a native select on phones) is gone from the app since T-079 (no such element exists in `src`), so the branch could never run; the button branch, which the scripts always took, is the driver's `chooseCamera`, and callers pass the preset id the button carries in `data-camera-preset` instead of its label. Evidence JSON that echoed the label (`browser-spike02`, `browser-spike03` camera lists) now echoes the id. (2) `browser-sky`'s "Camera mode" native-select branch was likewise unreachable and is gone; its button requests (`/^Overview$/`, `/^Focus /`, `/^Follow /`, the Scale toggle) are the driver's `pressFirstControlNow("overview" | "focus" | "follow" | "scale")`, so Apollo, whose overview preset is labelled "Earth–Moon overview", now also presses its overview (one more probe than before). `on-request/browser-marker-existing` likewise presses Apollo's overview. (3) `browser-synthetic` clicks the window band at a point computed from the band's box measured at click time, not from the box measured earlier in the run (the layout does not move in between). `tools/validate/shellScale.mjs` is folded into the driver.

## The three tiers

| Tier | When | Command | Time |
|------|------|---------|------|
| Lite | Task handoff, Quick Task Checks | `node tools/validate/browser-lite.mjs` (dev server, fresh `ASTRAEUS_EVIDENCE_DIR`), plus the area's own script if you touched one | about 1.5 min |
| Full | Full Objective Checks, before a release or merge | `tools/validate/run-full.sh` (starts its own servers and evidence directory; three lanes) | see the last run below |
| On request | Changing the code the script measures | `node tools/validate/on-request/<script>.mjs` | each 1 to 2 min |

The full run also takes the pictures from the public build, compares them with the before set, and writes `contact-sheet.png` (before beside after, desktop and phone, with the differing-pixel figure). Look at that one page for about 10 seconds.

## In the full run

`browser-lite`, `public-build-assets` (the licence and shipped-data gate), `browser-public-showers`, `capture-experience-pictures` + `diff-screenshots` + `contact-sheet`, `browser-spike02` (Apollo telemetry numbers), `browser-spike03`, `browser-shell`, `browser-anchor-labels`, `browser-synthetic`, `-ring`, `-listed`, `browser-view-link`, `browser-earth-moon`, `browser-jupiter-io`, `browser-orbit-motion` (arc head stays on its body through seeks and fast playback, no chords), `browser-orbit-look` (orbit-line toggles, slider and reset change the picture), `browser-story-panels`, and the two trimmed scripts below. Last measured run: see the Task T-071 evidence.

## Trimmed in place

| Script | Before | Now | Scenario no longer repeated, and where it is still asserted |
|--------|--------|-----|-----|
| `browser-showers.mjs` (Perseids, Geminids) | every scenario at desktop and phone | desktop runs everything; phone runs the plain load, the peak (stream drawn, details, GMN credit, member count, clump and not-shown statements), zoomed-out and window details | phone start and end stream drawn, rate rising to the peak, Sun-Earth, bodies and labels, whole orbit, crossing, year sweep, loop, ecliptic flat: desktop run (same scene geometry; the phone layout is the part that differs, and it is checked once) |
| `browser-sky.mjs` | Apollo, Earth-Moon, Perseids at both sizes (6 combinations) | Apollo at both sizes (2 combinations) | Earth-Moon and Perseids sky (any size): one shared sky component (`SkyView`), covered by the Apollo runs; canvas drawing on the phone by `browser-lite` and the pictures |

## Moved to on request (`tools/validate/on-request/`)

| Script | Why not in the full run | Where its scenarios are covered now |
|--------|-------------------------|--------------------------------------|
| `browser-sun.mjs` | A look check: halo size and brightness, live sliders | Look: contact sheet (the Perseids picture shows the Sun). Settings parsing and limits: `tests/sunLook.test.ts`. Mounts and console errors: lite. "No stray Sun in other experiences": lite opens each (a stray halo is a picture difference). Run it after changing the Sun's look |
| `browser-synthetic-belt.mjs` | Dots drawn in a made-up belt | Lite opens it at both sizes (canvas lit, panel, no errors); camera reach rules: `tests/experienceDefinition.test.ts`, `tests/compositions.test.ts` |
| `browser-synthetic-eccentric.mjs` | Marker rule, solar-system scale and framing of a made-up orbit; precision | Marker rule: `tests/bodyMarkers.test.ts`; the experience loads in lite; precision: the `browser-precision.mjs` method. Run it after changing marker or framing code |
| `browser-marker-existing.mjs` | Measurement only (records screenshots, asserts only that views mount) | Mounts: lite; look: pictures |
| `browser-precision.mjs` | Measurement of floating-origin wobble in pixels | Run after changing the camera, floating origin or scale code |

## Archived (`tools/archive/validate/`, one-off tools of finished work)

`conversion-proof.mjs` and `anchor-consistency.mjs` audited the Apollo 11 anchor data (Spike 02, O-002) and read only committed data; `capture-apollo-compare.mjs` shot a one-off comparison. Nothing imports them. The two strings in `tools/apollo11/config.json` and `data/apollo11/normalised/anchors.json` that name `tools/validate/anchor-consistency.mjs` are data text and were left unchanged to keep that data byte-identical.

Superseded briefs `docs/ASTRAEUS_SPIKE_02_BRIEF.md`, `..._03_BRIEF.md`, `..._03_METRIC_VISUALS_BRIEF.md` and `..._04_BRIEF.md` moved to `docs/archive/`; links in the docs that cite them were updated.

## Not asserted any more by automation

Nothing else was dropped. `capture-site-pictures.mjs` stays (it makes the site and README pictures).

## Unit test moved out of the default run

The 30,000-member frame-time assertions in `tests/listedOrbitGroup.test.ts` flaked twice under load. They run only with `ASTRAEUS_PERF=1 npm test -- listedOrbitGroup`; the fill itself (30,000 finite positions) and the bit-identical output test still run by default.
