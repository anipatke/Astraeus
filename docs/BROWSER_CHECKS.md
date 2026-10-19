# Browser checks: what runs, what moved, where each scenario is covered

Owner direction, 2026-10-17: "One 10sec visual inspection beats 40mins of auto browser checks." Automation keeps only what eyes cannot judge: crashes and console errors on every page, shipped-data and licence rules, and numbers, credits and behaviour a picture cannot show.

Owner decision, 2026-10-18 (T-102, "can we bin the whole screenshots thing", chose "All of it"): **browser checks never take, save or compare screenshots.** The picture baseline, the before-and-after comparison and the contact sheet are gone from the full run, and no script writes a picture file. Looks are judged by the owner on the preview. Where a check used to count coloured pixels to prove something is drawn, it reads the scene's own readouts through the driver (see "Scene readouts" below).

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

**Checks that name a scale, and the comet orbit (I-036, I-037; the pixel part superseded by T-102 and I-040).** A script that loads an address with `scale=<id>` uses `loadAddress` from the driver, which throws unless the experience offers that scale and it is the one in force (`assertScaleInUse`; `tests/browserDriverScale.test.ts` pins the rule). `browser-orbit-look.mjs` loads Earth-Moon with `scale=readable-scale` and asserts `currentScale` before checking the look. In `browser-showers.mjs` the comet orbit is proved from the line itself, the scene's path readout (I-040), in the Sun Overview at the window start (and fewer vertices in view with the camera pulled in on the Sun) and in the Whole orbit preset at the peak.

**Scenario map for the move (T-083, TEST-03).** Every pass/fail scenario is unchanged. Three equivalent substitutions: (1) the scripts' "compact camera picker" branch (`.object-camera-picker`, a native select on phones) is gone from the app since T-079 (no such element exists in `src`), so the branch could never run; the button branch, which the scripts always took, is the driver's `chooseCamera`, and callers pass the preset id the button carries in `data-camera-preset` instead of its label. Evidence JSON that echoed the label (`browser-spike02`, `browser-spike03` camera lists) now echoes the id. (2) `browser-sky`'s "Camera mode" native-select branch was likewise unreachable and is gone; its button requests (`/^Overview$/`, `/^Focus /`, `/^Follow /`, the Scale toggle) are the driver's `pressFirstControlNow("overview" | "focus" | "follow" | "scale")`, so Apollo, whose overview preset is labelled "Earth–Moon overview", now also presses its overview (one more probe than before). `on-request/browser-marker-existing` likewise presses Apollo's overview. (3) `browser-synthetic` clicks the window band at a point computed from the band's box measured at click time, not from the box measured earlier in the run (the layout does not move in between). `tools/validate/shellScale.mjs` is folded into the driver.

**Phone drawers, collapsible Sources and the shared control look (T-081, TEST-03).** Two new scripts in the full run: `browser-phone.mjs` (Done When 8: portrait 390x844 and landscape 844x390, Apollo and Jupiter-Io; opens and closes each drawer by tap and by touch swipe, a scene drag never opens a drawer, an information sheet opens with Sources closed then open and a swipe dismisses it, a story panel's Sources start closed and it never covers Play, 44 px targets, the live layout settings, reduced motion, zero errors) and `browser-controls.mjs` (Done When 7: computed font, colour, background, border and height of every showing control, same kind compared with same kind, and one baseline per row, at 1440x900 and 390x844). The driver gained the drawer and swipe functions and `controlStyles`. Existing scenarios were not removed; three were changed to follow the interface and each keeps its assertion:

| Scenario | Now | Where it is still asserted |
|----------|-----|------|
| The information panel's provenance detail names its sources, limits, accuracy and notes (`browser-shell`, `-showers`, `-jupiter-io`, `-public-showers`, `-sky`, `-synthetic*`, `-spike03`) | Sources is its own collapsible section inside the provenance block; the driver's `openProvenance` opens the badge detail and the Sources section, and `provenanceDetail` reads the whole provenance block, so the text those scripts read is the same text, now opened with the same single driver call | the same scripts, unchanged; the closed-by-default state itself in `browser-phone` ("Sources start closed", then "one tap opens Sources") |
| A story panel has at least one source line (`browser-story-panels`) | the lines sit in a closed `details`; `storyPanelSources` counts them while closed | `browser-story-panels` (unchanged calls), and `browser-phone` opens the section and reads it |
| The Events list rows, context and "Inside" lines (`browser-shell`, `-showers`, `-synthetic`, `-spike03`) | on a larger screen unchanged (`details` under the Events summary); on a phone the same rows sit in the timeline drawer, and `toggleEventList`, `openEventList`, `pickEventRow` and `eventListText` use the drawer's handle there | the same scripts at desktop sizes; `browser-phone` ("the events list is in the drawer", rows pressed on a phone through the driver) |

## The three tiers

| Tier | When | Command | Time |
|------|------|---------|------|
| Lite | Task handoff, Quick Task Checks | `node tools/validate/browser-lite.mjs` (dev server, fresh `ASTRAEUS_EVIDENCE_DIR`), plus the area's own script if you touched one | about 1.5 min |
| Full | Full Objective Checks, before a release or merge | `tools/validate/run-full.sh` (starts its own servers and evidence directory; three lanes; no picture steps) | see the last run below |
| On request | Changing the code the script measures | `node tools/validate/on-request/<script>.mjs` | each 1 to 2 min |

The full run takes no pictures (T-102): there is no baseline, comparison or contact sheet. The owner looks at the preview.

**The app inside another page (T-082, O-020 Decision 5).** New script `browser-embedded.mjs`, in the full run (lane B). It opens a stand-in for the portfolio page (driver `openInPortfolioFrame`: an iframe of the portfolio's size, as `main-portfolio/components/astraeus/AstraeusBridge.tsx` embeds it: full width, 660 px high from 1024 px wide, 580 from 768, 460 on a phone) and each demo alone, at a laptop (1280x800) and a phone (390x844): Apollo 11, Showers (Perseids default and `&shower=geminids`), Earth-Moon (until T-093 removes it) and Jupiter-Io. Asserts: framed the shell is flagged embedded and alone it is not; framed desktop controls are 30 px against 36 alone, the top bar and timeline are slimmer and closer to the edge; a phone frame keeps 44 px targets and a slimmer timeline; Play and Pause, the speed picker, the object list, the Events list (Apollo) and the Developer cog all work inside the frame; no sideways scroll; zero console errors. The stand-in is served by a route on the app's own port under `127.0.0.1` (another origin), and the browser is launched with `FRAMING_BROWSER_ARGS` because current Chromium blocks a local app framed by another origin as a local-network request. Driver additions: `openInPortfolioFrame`, `embeddedLook`, `PORTFOLIO_FRAME_HEIGHT`, `FRAMING_BROWSER_ARGS`. No existing scenario was removed or changed.

## In the full run

`browser-lite`, `browser-phone`, `browser-controls`, `browser-embedded`, `public-build-assets` (the licence and shipped-data gate), `browser-public-showers`, `browser-spike02` (Apollo telemetry numbers), `browser-spike03`, `browser-shell`, `browser-anchor-labels`, `browser-synthetic`, `-ring`, `-listed`, `browser-view-link`, `browser-earth-moon`, `browser-jupiter-io`, `browser-orbit-motion` (arc head stays on its body through seeks and fast playback, no chords), `browser-orbit-look` (orbit-line toggles, slider and reset change the look the scene reports), `browser-story-panels`, and the two trimmed scripts below. Last measured run: see the Task T-071 evidence.

## Trimmed in place

| Script | Before | Now | Scenario no longer repeated, and where it is still asserted |
|--------|--------|-----|-----|
| `browser-showers.mjs` (Perseids, Geminids) | every scenario at desktop and phone | desktop runs everything; phone runs the plain load, the peak (stream drawn, details, GMN credit, member count, clump and not-shown statements), zoomed-out and window details | phone start and end stream drawn, rate rising to the peak, Sun-Earth, bodies and labels, whole orbit, crossing, year sweep, loop, ecliptic flat: desktop run (same scene geometry; the phone layout is the part that differs, and it is checked once) |
| `browser-showers.mjs`, `-public-showers`, `-lite`, `-story-panels`, `-view-link`, `-controls`, `-sky` addresses (O-024 T-091) | `?experience=shower-perseids` and `?experience=shower-geminids` | `?experience=showers` (the Perseids) and `?experience=showers&shower=geminids`; the old addresses are removed with no redirect and open the default experience (asserted at the end of `browser-showers`) | every prior scenario unchanged, per shower. New: `checkSwitch` (both sizes, each shower in turn, so both directions): the top-bar switch named Shower, its options, switching opens the other shower with the old view and time dropped and only the chosen shower's orbit file requested, and switching back; the plain address opens the first shower, an unknown one the same. Driver: `experienceSwitchState`, `chooseSwitchOption` |
| `browser-sky.mjs` | Apollo, Perseids at both sizes (6 combinations; Earth-Moon removed in O-024 T-093) | Apollo at both sizes (2 combinations) | Perseids sky (any size): one shared sky component (`SkyView`), covered by the Apollo runs; canvas drawing on the phone by `browser-lite` (the scene reports something drawn) |

## Moved to on request (`tools/validate/on-request/`)

| Script | Why not in the full run | Where its scenarios are covered now |
|--------|-------------------------|--------------------------------------|
| `browser-sun.mjs` | A look check: halo size and brightness, live sliders | Look: the owner on the preview; the halo's width, brightness and whether it is drawn over or behind the disc are read from the scene's body readout. Settings parsing and limits: `tests/sunLook.test.ts`. Mounts and console errors: lite. "No stray Sun in other experiences": lite opens each (a stray halo is a look the owner judges on the preview). Run it after changing the Sun's look |
| `browser-synthetic-belt.mjs` | Dots drawn in a made-up belt | Lite opens it at both sizes (the scene reports something drawn, panel, no errors); camera reach rules: `tests/experienceDefinition.test.ts`, `tests/compositions.test.ts` |
| `browser-synthetic-eccentric.mjs` | Marker rule, solar-system scale and framing of a made-up orbit; precision | Marker rule: `tests/bodyMarkers.test.ts`; the experience loads in lite; precision: the `browser-precision.mjs` method. Run it after changing marker or framing code |
| `browser-marker-existing.mjs` | Measurement only (records which bodies draw as markers, asserts only that views mount) | Mounts: lite; look: the owner on the preview |
| `browser-precision.mjs` | Measurement of floating-origin wobble in pixels | Run after changing the camera, floating origin or scale code |

## Archived (`tools/archive/validate/`, one-off tools of finished work)

`conversion-proof.mjs` and `anchor-consistency.mjs` audited the Apollo 11 anchor data (Spike 02, O-002) and read only committed data; `capture-apollo-compare.mjs` shot a one-off comparison. Nothing imports them. The two strings in `tools/apollo11/config.json` and `data/apollo11/normalised/anchors.json` that name `tools/validate/anchor-consistency.mjs` are data text and were left unchanged to keep that data byte-identical.

Superseded briefs `docs/ASTRAEUS_SPIKE_02_BRIEF.md`, `..._03_BRIEF.md`, `..._03_METRIC_VISUALS_BRIEF.md` and `..._04_BRIEF.md` moved to `docs/archive/`; links in the docs that cite them were updated.

## Not asserted any more by automation

Nothing else was dropped, except the pixel statistics listed under "Scene readouts" as having no readout. The picture tools `capture-experience-pictures.mjs`, `diff-screenshots.mjs`, `contact-sheet.mjs` and `capture-site-pictures.mjs` (home page and README pictures; the owner supplies card pictures) moved to `tools/archive/validate/` (T-102); the O-017 baseline directory stays as history and nothing references it.

## Unit test moved out of the default run

The 30,000-member frame-time assertions in `tests/listedOrbitGroup.test.ts` flaked twice under load. They run only with `ASTRAEUS_PERF=1 npm test -- listedOrbitGroup`; the fill itself (30,000 finite positions) and the bit-identical output test still run by default.

## Scene readouts instead of pictures (T-102, TEST-03)

The canvas carries `data-*` readouts the driver reads (`tools/validate/driver.mjs`). Each is computed in the app each frame from the same objects that are drawn; a readout shows what the scene draws, never the picture of it.

| Readout (driver function) | Attribute | Says |
|------|------|------|
| `scenePaths`, `scenePath(id)` (I-040, extended) | `data-paths` | per path line: visible, vertices, vertices in view, the share of the view they span, the box's edges (`minX`..`maxY`, and the same for the drawn line between vertices, `lineMinX`..`lineMaxY`), the major-axis angle on screen (`axisDeg`), the view's `aspect`, and for an orbit its look in force (`look`: ring, arc, end fade, zoom brightening shown; the ring's opacity now; the arc's peak) |
| `scenePoints`, `scenePointGroup(id)`, `sceneDotsInView` | `data-points` | per point group: drawn (inside its time bounds), member count, members in view (an even sample of at most 512 scaled up), the share of the view they span |
| `sceneBodies`, `sceneBody(id)` | `data-body-screen` | per body: drawn as a sphere, a marker or not at all, its radius in pixels, its centre as shares of the view, in view; for a body with a halo, the halo's width in pixels, its brightness and whether it is drawn over the dots |
| `sceneSky` | `data-sky-stars`, `-picture`, `-picture-shown`, `-star-brightness`, `-milky-way-brightness` | the star count, whether the Milky Way picture is on and shown, and the two brightness settings in force |
| `sceneDrawsSomething` | (the three above) | bodies in view, dots in view and path lines in view: the readout form of "the canvas is not blank" |

**The guard** also fails any script that calls `.screenshot(`; the driver's `sceneCanvasPng` and `sceneOnlyPng` are gone.

Every assertion that counted pixels, and what reads it now. A threshold was kept where the meaning carries over; where a count of coloured pixels became a count of drawn dots or path vertices, the floor is a count of those and was calibrated on the run recorded in the Task evidence.

| Script and scenario | Was | Now |
|------|------|------|
| `browser-lite` canvas draws | more than 200 non-black pixels | `sceneDrawsSomething`: a body, dots or a path in view |
| `browser-jupiter-io` four presets each frame something drawn | more than 300 non-black pixels | `sceneDrawsSomething`: a body or path in view |
| `browser-jupiter-io` Jupiter is drawn in the overview | more than 800 non-black pixels | `sceneBody("jupiter")`: a sphere in view of more than 5 px radius |
| `browser-orbit-look` each toggle changes the picture; a brighter ring lights more | sums of canvas brightness | `scenePath(...).look`: the layer reads on, then off, then on; the ring's opacity rises with the slider |
| `browser-sky` stars drawn against `?sky=off`; the picture lights pixels the stars do not; `?milkyway=on` draws it | bright and lit pixel counts, five comparisons | `sceneSky`: `?sky=off` reports no stars; the default reports every star at a brightness above zero; the picture reads shown with it on and not shown with it off |
| `browser-synthetic-listed` dots drawn in True and Readable | pixels near the group's colour | `sceneDotsInView`: more than 20 members in view |
| `browser-showers` stream dots visible (start, peak, end, zoomed out, plain load, year start, middle and end, after the loop wrap) | stream-coloured pixels | `scenePointGroup("<shower>-stream").inView` (the group is found by id, so no colour test) |
| `browser-showers` loop off: stream gone past the end | stream pixels fall to under 70% | the group's members in view fall to under 70% (and `drawn` reads false past the bounds) |
| `browser-showers` plain load is not a close-up of the Sun | stream pixels under 30% of the area | `sceneBody("sun").radiusPx` under a quarter of the view's height |
| `browser-showers` planets' orbit lines drawn around the Sun | tan pixels | `scenePath("<planet>-orbit")` visible with vertices in view, for the four planets |
| `browser-showers` Earth's path drawn once the camera is brought in; the path runs on both sides of Earth | blue pixels, left and right of the middle | `scenePath("earth-path")`: all its vertices in view and spanning over 10% of the view; the drawn line runs both sides of the middle (Earth is focused there) |
| `browser-showers` Earth visible under the solar-system scale; stays in view while followed | bright pixel counts | `sceneBody("earth")`: radius in pixels at least three times the true-scale radius, a sphere in view; and in view near the middle in the three followed frames |
| `browser-showers` each body's marker beside its label | bright pixels near the label | `sceneBody(id)` drawn in view with its centre within 24 px of where the marker stands beside the label |
| `browser-showers` ecliptic flat | blue pixels fitted to an ellipse | `scenePath("earth-path")`: whole path in view; `axisDeg` within 8 degrees of horizontal; height under half the width (aspect applied); with celestial north up it is tilted |
| `browser-showers` Earth drawn at the year's start, middle and end | its label or more than 100 blue pixels | its label or more than 10 path vertices in view |
| `browser-synthetic-belt` (on request) belt dots; Sun and the two paths in the Sun view; Sun and Earth at the middle of the view; Earth's path through Earth | pixel families by colour | `sceneDotsInView`, `sceneBody("sun")`, `scenePath("earth-path")` and `("far-marker-path")`; bodies within 8 px of the middle; the path's box containing the middle |
| `browser-synthetic-eccentric` (on request) Earth's marker visible, absent at threshold 0; the whole orbit framed and still drawn zoomed out | near-white pixels round a scene-graph probe; pink pixel box | `sceneBody("earth").as === "marker"` in view; `scenePath("eccentric-path")` all vertices in view with its box inside the view; vertices still in view zoomed out |
| `browser-sun` (on request) halo wider than with `?sunglow=0` and over the dots; size 0 removes it; bigger and brighter is drawn; the Sun visible at every zoom step; the disc fills the middle at the closest zoom | warm-white pixels round the Sun; bright pixels in a window | `sceneBody("sun").glow` (width, brightness, over the dots); the Sun drawn at the middle of the view at each step; at the closest zoom a sphere of over 60 px radius with the halo behind it |
| `browser-sun` the disc shows texture, not a flat wash; not washed to white | luminance spread and mean of the middle | **dropped:** the texture and its tone are a look with no scene readout; the owner judges them on the preview. The halo going behind a big disc, the mechanism that keeps the disc from washing out, is read instead |

Screenshots taken only to keep a picture (every other `screenshot` call in the scripts, 27 of them, and the `ASTRAEUS_SCREENSHOT`, `ASTRAEUS_INFO_SCREENSHOTS` and `ASTRAEUS_METRIC_SCREENSHOTS` options of `browser-shell`) were removed with nothing replacing them: no assertion read them.

## Jupiter and its moons (O-025 T-098)

`browser-jupiter-io.mjs` now opens Jupiter with its four mapped moons and the 111 small moons. Changed scenarios and where each prior assertion went:

| Before | Now | Where the prior assertion is |
|--------|-----|------------------------------|
| Mounted bodies `jupiter,io`, one composition loop, object list Jupiter, Io, sky | `jupiter,io,europa,ganymede,callisto`, Io's loop as before plus 114 batched orbit lines (`data-body-set-orbits`), those five and the sky | same script |
| Io's details state the mean-element figure (9,388 km), "approximate demonstration" and the source's warning | Io's details state Horizons and the fits' 0.0994 m | the mean-element record and its 9,388 km figure: `tests/jupiterIo.test.ts` ("kept as the record: the mean-element model ..."); Io against Horizons through the resolver: same file ("is placed where Horizons puts it") |

New (driver: `bodySetReadout`, `pointAtScene`, `tapScene`, `bodySetNameShown`, `bodySetNamesShown`, toggle `moon-orbits`, sliders `ring-*-opacity`): every catalogued moon drawn (111 + 4), no names before asking, a dot's name on hover (desktop) or tap (phone), the smallest moon a ball far wider than its dot and named up close, the four ring bands drawn at the NSSDC radii in the donor's look and taking the live opacity (`data-ring-bands`, driver `ringReadout`; desktop), one distinct orbit colour per family, and (owner defect, 2026-10-18) five irregular moons including S/2021 J 7 each on its own orbit line at a close view (`data-body-set-orbit-gaps`: on-screen distance from each in-view moon to its own drawn line). Phone-class frame time: `on-request/probe-phone-frames.mjs` (CPU throttled through DevTools).

## Earth–Moon removed (O-024 T-093, TEST-03)

The Earth–Moon demo, its story file and `browser-earth-moon.mjs` are gone (owner, 2026-10-18: "Drop earth and moon, it's covered by Apollo"). Where each scenario now lives:

| Scenario that used `?experience=earth-moon` | Now asserted in |
|------|------|
| Scale toggle name, readouts identical under True and Readable, toggle tooltip, the ⓘ explanation | `browser-shell.mjs`, on `?experience=synthetic` (made-up demo: Earth, Moon, both scales; dev server only) |
| Orbit-look toggles and ring opacity, desktop True and Readable, phone | `browser-orbit-look.mjs`, on `?experience=synthetic` |
| Orbit motion (head gap, arc segment) | `browser-orbit-motion.mjs`: Jupiter–Io and `?experience=synthetic` |
| Four camera presets each frame something drawn; Earth/Moon info panels, Moon phase readout | `browser-jupiter-io.mjs` (presets); Apollo's Earth and Moon rows in `browser-spike02.mjs` and `browser-shell.mjs`; `tests/experiences.test.ts` (Earth and Moon readouts) |
| Embedded in the portfolio frame | `browser-embedded.mjs`: Apollo 11, Perseids, Geminids, Jupiter–Io |
| Story panels (3) | removed with the story; `browser-story-panels.mjs` covers the remaining stories |
| Sky; no stray Sun; marker rule | `browser-sky.mjs` (Apollo, Perseids); `on-request/browser-sun.mjs`, `on-request/browser-marker-existing.mjs` without Earth–Moon |
| Home page links | `browser-lite.mjs` and `tests/homePage.test.ts` now expect three addresses |
| Page-size limit for the address | removed from `load-budget.mjs` and the README table |
