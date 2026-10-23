# Browser checks: the map

Two rules shape these checks. The owner judges how things look, on the preview, so no check takes or compares a screenshot. Automation keeps only what eyes cannot judge: crashes and console errors, shipped-data and licence rules, and numbers, credits and behaviour. Since O-038 most behaviour is proved in the fast test suite (`npm test`, about 30 s); one short browser command covers what only a real browser can show.

## Running it

`npm install`, `npx playwright-core install chromium` once, then `npm run check:browser`. Run it once at a Full Objective Check, and not per Task. It writes `summary.txt` and each step's `results.json` to a fresh `docs/evidence/browser-<UTC time>/`; step and server logs go to a scratch folder under the OS temp directory, whose path the summary prints. A run folder no record cites may be removed at the next clean-up. Set `PLAYWRIGHT_CORE` only to use another copy of the library. The step list is at the top of `packages/astraeus-site/tools/validate/run-browser.mjs`.

## What it runs (about 1 minute, plus a few seconds for the example build)

One browser at a time:

- `smoke` (`browser-smoke.mjs`): every public page and demo view at desktop and phone size. It fails on a page or console error, a missing shell, or a scene with no body, path or dot in view (stars alone do not count). Every showers view must also draw the meteor stream: dots in view from the scene's own readout (`stream-check.mjs`, proved to fail on zero dots by `tests/streamCheck.test.ts`). The made-up scenes are not loaded.
- `smoke-public-showers` (the same script, `ASTRAEUS_VIEWS=showers`): the showers views again, on the scratch public build served by a preview, so the shipped stream copy is what loads and must be drawn.
- `planets-phone` (`journey-planets-phone.mjs`): at 375x667 with touch, switch Mercury to Jupiter, focus Io from the moons panel, open a place card.
- `meteor-shower` (`journey-meteor-shower.mjs`): Perseids at 1280x720, paused and untouched the scene stops drawing (`data-frames-drawn` stops counting; the smoke check asserts the same for Apollo 11), a wheel turn, a tap on the canvas and play draw again (O-031 T-149, I-073), then play, seek (the stream dots must be in view), a story panel opens, then the switch opens the Geminids in place (a marker on `window` survives, so no reload; the Geminids stream is drawn) (O-030 T-153).
- `hello-scene` (`check-hello-scene.mjs`, O-036 T-162): builds `examples/hello-scene` from the packed `astraeus` tarball (`tools/build-example.mjs`, once), serves it with a preview, and at 1280x720 and 375x667 reads the scene's own readouts through the driver: the probe is in the Object list and picked, the Focus preset is in force from the first frame (the example uses `lookAt`; `hello-react` still follows, so the script reads `HELLO_STORY=1`, set by the step, to choose), the probe's three anchors are labelled, the timeline lists two events, the story panel opens from its marker with its badge and source (O-041 T-168), the placed display switches (O-041 T-170: orbit lines on the top bar, labels in the switch panel, the Milky Way off in the Developer drawer only; each press changes the scene's own readout and the open panel sits inside the window clear of the cog and timeline; driver `displaySwitchPlaces`, `displaySwitchOn`, `toggleDisplaySwitch`, `switchPanelFit`, `visibleSceneLabelCount`), Earth and the Moon are drawn and in view, the Moon's orbit line (`moon-orbit` path readout) is drawn, the time starts at the one `setTime` gave and can be moved. The step adds the example's build (a few seconds) to the run.
- `hello-react` (`check-hello-scene.mjs` again, O-040 T-164): the same readouts on `examples/hello-react`, which draws the same scene through the `AstraeusScene` React component (built by the same `tools/build-example.mjs` run, previewed on the next port after `hello-scene`'s). Adds nothing to the build and a few seconds to the run.
- `public-build-assets` and `public-addresses`: no browser; run on a scratch public build (licence records, no made-up scenes, page size, no retired links).

Measured (T-145): `browser-20261022T202311Z` 44 s, `browser-20261022T202358Z` 45 s, `browser-20261022T202444Z` 46 s. With the `smoke-public-showers` step added (T-148): `browser-20261022T205738Z` 58 s (recheck C-099).

## The fast tests that replaced the old sets

Screen parts run in the fast suite on a pretend page (`happy-dom`, opted into per file with `// @vitest-environment happy-dom`; `tests/domSetup.ts` mounts the real `AstraeusShell` and offers `press`, `swipe`, `touchDrag`, `selectObject`, `advance`, `requestPanel`). Scene sums run as ordinary unit tests on the same objects the scene draws. A demo's own rules are tested against its real data files. Two things stay out of reach of a pretend page: what is drawn on the canvas (the smoke check) and how it looks (the owner, on the preview).

## Retired scripts, and where each scenario went

O-038 T-147 deleted every other browser script, `run-engine.mjs`, `run-demo.mjs`, `tools/validate/on-request/` and the scale-menu harness page; git history keeps them. Code for each: **D** a fast test (file, then case); **S** the smoke check; **J** a journey; **O** the owner's look on the preview. The line-by-line maps, 84 lines from T-143, 54 from T-144 and about 120 from T-146, are in those Tasks' Technical Evidence (`.savepoint/objectives/O-038-*/tasks/`). Test files below are under `tests/`. Nothing is unmapped.

| Retired script | Scenarios | Now |
|------|------|------|
| `browser-shell` | events list and Next; marker through the timeline; camera presets; information, provenance, Sources; both scales; developer cog | D `domShell`; name tags, drag and zoom, the advanced readouts S; overlap O |
| `browser-controls` | drawers, information panel, Sources, story panel; one look for controls, height, font, baseline | D `domPhone`, `domShell`; stylesheet sizes D `domEmbedded`; the computed look O |
| `browser-phone` | pill, cog and timeline; both drawers; speed slider; sheet; story on a phone; developer folds; reduced motion; safe areas | D `domPhone`; chrome fit and reach O |
| `browser-layout` | fit at three sizes, touch targets, focus ring, sheet clear of timeline | D `domShell` (Tab reaches buttons), `domEmbedded` (sizes, focus ring); fit and overlap O |
| `browser-embedded` | framed flag, layout by frame width, slimmer bars, shared controls | D `domEmbedded` |
| `browser-scale-menu` | menu open, keys, focus, Escape, outside press | D `domMenuAndLink` "the scale menu" |
| `browser-view-link` | link contents, clipboard, refused clipboard, bad link, restore | D `domMenuAndLink` "Copy view link"; the camera landing S |
| `browser-story-panels` (generic) | marker per panel, auto-open and pause, resume, Continue, scrub, Escape, folds, phone swipe | D `domStory`, `domPhone` "a story panel on a phone" |
| `browser-story-panels` (demos) | Apollo seven panels and scene markers; Perseids, Geminids, Jupiter panels | D `domDemoStories`, `storyPanels`, `storyMarkers`, `storyStoriesAllDemos`; phone shots O |
| `browser-synthetic`, `-ring`, `-listed` | glow, windows, rate readout, source wording, groups, panels, presets, name check, True and Readable parity | D `timeline`, `experiencePlugIn`, `syntheticRing`, `listedOrbitGroup`, `syntheticStoryAnchors`, `nameCheck`, `infoProvenance`, `sceneCamera`; frame rate `frameStats` (pacing was never asserted, O); drawing S |
| `browser-orbit-look` | four layers, ring opacity, reset, scale-independent | D `orbitLook` "reports each layer ...", "switches each layer off and back on" |
| `browser-orbit-motion` | arc head on its body, no chord, after seeks and fast play | D `orbitLook` "keeps the arc head on its body ..." |
| `browser-anchor-labels` | twelve labels, toggle, follow, off-screen hiding | D `syntheticStoryAnchors` "labels every anchor", `missionScene` `projectToScreen`; layer on screen S |
| `browser-tap-focus` | hit tolerance, nearest, drag or pinch selects nothing, hover | D `scenePicking` (pickTarget, TapTracker, hover), `sceneFrame`, `clickOpensInfo` "opens its information card on the desktop layout" and "only flies there on the phone layout"; taps S |
| `on-request/browser-sky` | stars, Milky Way, brightness, fixed under camera moves | D `sky`, `skyPicture`, `sceneFrame` (sky readouts) |
| `on-request/browser-sun` | halo, sliders, centred, camera outside the sphere | D `sunLook`, `sceneBodies` (halo order), `sceneCamera` |
| `on-request/browser-precision` | Earth within one pixel at 1 AU, 60-frame sweep | D `sceneTransforms` "position precision far from the Sun" |
| `on-request/browser-synthetic-belt`, `-eccentric`, `-marker-existing` | belt, Sun and paths, marker rule, whole 1 to 51 AU orbit framed | D `syntheticRing`, `sunCentred`, `bodyMarkers`, `longOrbitPaths`, `sceneTargets`, `demoRules` (marker rule on every demo) |
| `on-request/probe-phone-frames` | throttled frame-time probe; asserted nothing | none; retired measurement (frame pacing: owner's look) |
| `browser-apollo-shell` | 30 events, Unavailable at start, one scale, labels, info wording, metric visuals | D `domApollo`, `missionScene`, `infoProvenance` ("Apollo known limitations ..."), `metricVisuals`, `experiences`; labels and follow fallback S |
| `browser-spike02` | six phases, camera invariance, jumps, rates, speed against range, four USNO phases | D `domApollo`, `missionScene`, `core` (clock: "keeps same-time science fixed when playback rates differ"), `infoProvenance` |
| `browser-home-curve-fits` | 325 dots, 2 pieces, slider, distance bound | D `homePage`; drawing S; phone layout O |
| `browser-showers`, `browser-public-showers` | Sun-centred scene, Object list, scales, orbits, peak, year, quality sets, no CAMS, shower switch, shipped orbits | D `demoShowers`, `demoRules`, `showers`, `showersMeasured`, `showerChoice`, `viewUp` ("ecliptic-up view"), `startCamera` ("the start camera (I-028)"), `publicBuild`; the swap S, J; the stream drawn (dots in view) S and J, on the public build too (`smoke-public-showers`) |
| `browser-jupiter-io`, `-jupiter-tap` | Jupiter and four moons, 111 dots, rings, places, small-moon taps | D `demoPlanets`, `jupiterIo`, `jupiterMoonsScene`, `moonOrbits` ("measures every body against Horizons ..."), `featureMarkers`, `scenePicking`; drawing S |
| `browser-moon-panel` | families, counts, big four, search, lit family, focus on a moon | D `domMoonPanel`, `moonFamilyPanel`; the moons sheet and information panel never together: D `domMoonPanel` "never show together on a wide screen"; the flight S; overlap O |
| `browser-outer-planets`, `browser-planet-switch` | switch keeps the clock; Saturn rings; Titan and Charon places; Pluto; Uranus; Mars | D `planetChoice`, `planetSystems`, `planetSwitchInner`, `demoPlanets`, `plutoOrbitLines`; the switch on a phone J |
| `browser-lite` (smoke) | every page and view loads, no errors | S (`browser-smoke.mjs`) |

Rows that name a file but not a case are covered by that file as a whole: `viewUp` (up direction, six cases), `startCamera` (three), `publicBuild` (public-build exclusion rules), `moonOrbits` (orbit sources and measured figures), `core` (the clock and providers), `frameStats` ("FrameStats", "FrameRateSection", "fps graph geometry"), `phoneLayout` ("phone layout settings", "Sources section"), `infoProvenance` ("provenance reachability", "window information").

The old "dropped, with reasons" list of O-034 is history: its dropped cases are now either a fast test above or the owner's look.

## The harness (`packages/astraeus-site/tools/validate/harness.mjs`)

Every script gets its browser from the harness, never from `chromium.launch` (the guard fails it): `launchBrowser()` (software-rendering flags), `watchErrors(page, errors, label)` (page and console errors, the lines the runner counts) and `checkScript({ name, viewports }, run)` (launch, one page per viewport, error collection, close, `results.json`, non-zero exit). The two journeys use `checkScript`; the smoke check uses the two helpers and keeps its own page pattern.

## The interface driver (`packages/astraeus-site/tools/validate/driver.mjs`)

Scripts never find or operate controls themselves. Each user action and readout is one driver function (`import * as ui from "./driver.mjs"`); when the interface changes, only the driver is edited.
| Area | Functions (all take `page` first) |
|------|------|
| Shell, time | `waitForShell`, `timelineText`, `pageText`, `pressKey`, `seekRange`, `seekTo`, `seekToFraction`, `seekToUtcText`, `setUtc`, `clockText`, `clockIso`, `clockMs`, `waitForClock` |
| Playback | `pausePlayback`, `ensurePaused`, `playPlayback`, `ensurePlaying`, `continuePlayback`, `isPlaying`, `waitUntilPlaying`, `setSpeed`, `speed` |
| Events, windows | `nextEvent`, `previousEvent`, `hasNextEvent`, `toggleEventList`, `openEventList`, `closeEventList`, `eventRows`, `pickEventRow`, `eventContextText`, `windowParts`, `glowCount`, `glowText`, `glowGradients`, `glowTooltipAt`, `goToWindowPeak`, `goToNamedWindowPeak` |
| Bodies, information | `pickBody`, `pickedBody`, `bodyOptions`, `bodyOptionCount`, `bodyOptionInfo`, `waitForBodyAvailability`, `openInfo`, `closeInfo`, `infoPanel`, `infoText`, `openProvenance`, `provenanceDetailText`, `pressRelatedObject`, `selectOrbit` |
| Camera | `chooseCamera(page, presetId)` (for example `"overview"`, `"focus-columbia"`, `"follow-moon"`, `"whole-orbit"`), `pickBodyWithCamera`, `cameraOffered`, `cameraActive` |
| Drawer | `toggleDeveloper`, `openDeveloper`, `closeDeveloper`, `developerOpen`, `pressToggle(id)`, `toggleOn(id)`, `setSlider(id)`, `dragSlider(id)`, `sliderReadout(id)`, `missionPanel`, `metric`, `copyViewLink`, `frameRate` |
| Story panels | `storyPanel`, `storyMarkers`, `openStoryPanel`, `closeStoryPanel`, `pressSceneStoryMarker`, `openStoryPanelIds` |
| Scale | `chooseScale`, `currentScale`, `scaleOptions`, `offersScale` |


Elements are found by accessible name or role, by a stable `data-*` attribute (`data-camera-preset`, `data-related-object`, `data-scale-current`) or `data-testid`; the few controls with none of those (the Events summary, the information panel, a few readout containers) are named once, in the `HOOK` table at the top of the driver. Camera, toggle and slider arguments are logical ids, not labels, so a renamed label changes one table.

**The guard** (`packages/astraeus-site/tools/validate/driver-guard.mjs`, run in the unit tests by `packages/astraeus-site/tests/browserDriverGuard.test.ts`, and as `node packages/astraeus-site/tools/validate/driver-guard.mjs`) fails when a script outside the driver calls `getByRole`, `getByText`, `getByLabel` (or the other `getBy*` finders except `getByTestId`), calls `click`, `fill`, `selectOption`, `press`, `focus`, `check`, `hover` or `tap` on anything, uses `keyboard.`, or calls `locator`, `querySelector`, `querySelectorAll` or `waitForSelector` with any selector other than the exceptions. **Exceptions, stated in the rule:** the scene canvas (`canvas`, `getByTestId(...)`), data-attribute readouts (a selector that begins `[data-`), and `new Array(n).fill(0)`. `mouse.move/down/up/wheel` on the canvas is not flagged (scene drags and zoom). `OPT_OUT` in the guard lists scripts exempt from the rule with a reason; it is empty.

## Scene readouts instead of pictures (T-102, TEST-03)

The canvas carries `data-*` readouts the driver reads (`packages/astraeus-site/tools/validate/driver.mjs`). Each is computed in the app each frame from the same objects that are drawn; a readout shows what the scene draws, never the picture of it.

| Readout (driver function) | Attribute | Says |
|------|------|------|
| `scenePaths`, `scenePath(id)` (I-040, extended) | `data-paths` | per path line: visible, vertices, vertices in view, the share of the view they span, the box's edges (`minX`..`maxY`, and the same for the drawn line between vertices, `lineMinX`..`lineMaxY`), the major-axis angle on screen (`axisDeg`), the view's `aspect`, and for an orbit its look in force (`look`: ring, arc, end fade, zoom brightening shown; the ring's opacity now; the arc's peak) |
| `scenePoints`, `scenePointGroup(id)`, `sceneDotsInView` | `data-points` | per point group: drawn (inside its time bounds), member count, members in view (an even sample of at most 512 scaled up), the share of the view they span |
| `sceneBodies`, `sceneBody(id)` | `data-body-screen` | per body: drawn as a sphere, a marker or not at all, its radius in pixels, its centre as shares of the view, in view; for a body with a halo, the halo's width in pixels, its brightness and whether it is drawn over the dots |
| `sceneSky` | `data-sky-stars`, `-picture`, `-picture-shown`, `-star-brightness`, `-milky-way-brightness` | the star count, whether the Milky Way picture is on and shown, and the two brightness settings in force |
| `sceneDrawsSomething` | (the three above) | bodies in view, dots in view and path lines in view: the readout form of "the canvas is not blank" |

