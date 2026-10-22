# Browser checks: the map

Two rules shape these checks. The owner judges how things look, on the preview, so no check takes or compares a screenshot. Automation keeps only what eyes cannot judge: crashes and console errors, shipped-data and licence rules, and numbers, credits and behaviour.

## Running them

`npm install`, then `npm run check:engine` (the engine set) or `npm run check:demo -- <apollo|showers|planets>` (one demo's set). Each writes `summary.txt` and each step's results files to a fresh `docs/evidence/<set>-<UTC time>/`; step and server logs go to a scratch folder under the OS temp directory, whose path the summary prints. A run folder no record cites may be removed at the next clean-up. Set `PLAYWRIGHT_CORE` only to use another copy of the library. Set membership is the list at the top of `tools/validate/run-engine.mjs` and `run-demo.mjs`.

## The quick check (`npm run check:browser`, O-038 T-145, about 45 s)

One browser at a time into `docs/evidence/browser-<UTC time>/`: `smoke` (`browser-smoke.mjs`: every public page and demo view at desktop and phone size, fails on a page or console error, a missing shell or a scene reporting nothing in view; the made-up scenes are not loaded), `planets-phone` (`journey-planets-phone.mjs`: switch Mercury to Jupiter, focus Io from the moons panel, open a place card, at 375x667 touch), `meteor-shower` (`journey-meteor-shower.mjs`: Perseids play, seek, a story panel opens), then the no-browser `public-build-assets` and `public-addresses` on a scratch public build. Old sets below stay until the last step of O-038. Measured: `browser-20261022T201927Z` 46 s, `browser-20261022T202014Z` 42 s, `browser-20261022T202056Z` 41 s.

## Engine set (`npm run check:engine`, 16 steps, 275 s)

Runs on the made-up scenes (`?experience=synthetic`, `synthetic-ring`, `synthetic-listed`), so it needs no demo. Measured in `docs/evidence/engine-20261020T092052Z`.

| Script | Asserts |
|--------|---------|
| `browser-shell` | events list and next/previous, marker availability, camera presets, name tags not overlapping, information and provenance sections, both scales, drag and zoom, developer panel |
| `browser-synthetic`, `-ring`, `-listed` | the made-up scene, its ring and its listed-bodies variants draw and behave; no console errors |
| `browser-orbit-look` | orbit and trail layers switch and brighten (read from path readouts) |
| `browser-controls` | drawers, information panel, Sources, story panel at laptop and phone size |
| `browser-phone` | phone layout in portrait and landscape, drawers, information sheet, reduced motion |
| `browser-layout` | viewport fit at three sizes, touch targets, info sheet clears the timeline, keyboard focus |
| `browser-embedded` | the framed (embedded) page |
| `browser-anchor-labels` | twelve labelled anchors, toggle, follow |
| `browser-tap-focus` | drag, pinch, hover, body and name-tag taps (O-022) |
| `browser-view-link` | copied view link restores the view; refused clipboard; bad link |
| `browser-orbit-motion` | orbit arcs move with time |
| `browser-scale-menu` | the scale menu on its own harness page |
| `public-build-assets`, `public-addresses` | on a public build: licence records, no made-up scenes, page size, no retired links |

## Demo sets (`npm run check:demo -- <name>`)

Each starts with a `smoke` step (`browser-lite`, one demo, desktop and phone). Run one only when that demo or its checks changed, or before a release.

| Demo | Steps | Time | Run |
|------|-------|------|-----|
| apollo | smoke, `browser-apollo-shell` (provenance wording, 30 events, mission metrics, no scale control), `browser-spike02` (True/Readable telemetry pairs, camera invariance, event jumps, USNO phases), `browser-home-curve-fits`, `browser-story-panels` (Apollo) | 227 s | `demo-apollo-20261020T102339Z` |
| showers | smoke, `browser-showers` Perseids (orbits, Earth path, bodies, year) and Geminids (light, desktop), `browser-public-showers`, `browser-story-panels` (showers) | 390 s | `demo-showers-20261020T102729Z` |
| planets (was jupiter; `jupiter` still works as an alias) | smoke (Jupiter view + catalogue page), `browser-jupiter-io` (presets, places, orbit lines), `browser-moon-panel`, `browser-jupiter-tap` (small-moon dots), `browser-story-panels` (Jupiter), then O-033: `browser-outer-planets` (switch from Jupiter keeps the clock, Saturn rings and moons panel, a place on Titan and on Charon, Pluto and Charon drawn, Uranus rings and no mapped moon; desktop and phone), `browser-planet-switch` (Mercury to Mars in the switch, Phobos and Deimos in the Object list, a Mars place pressed; desktop and phone) | 248 s before O-033; not yet measured with the two new scripts | `demo-jupiter-20261020T101926Z` (old set) |

## On request (`tools/validate/on-request/`)

Run only when you change what they measure: `browser-sky` (stars and Milky Way; moved here 2026-10-20), `browser-precision`, `browser-sun`, `browser-synthetic-belt`, `browser-synthetic-eccentric`, `browser-marker-existing`, `probe-phone-frames`.

## Dropped, with reasons (O-034)

Dropped to bring the sets under about 5 minutes. The generic code is covered by the engine set.

- Phone, controls, embedded and tap-focus runs on Apollo, Showers and Jupiter-Io: the made-up scene runs the same code. Jupiter's small-moon dot case lives in `browser-jupiter-tap`.
- `browser-spike03`: its generic cases became `browser-layout` and `browser-shell`; the Apollo-only ones are in `browser-apollo-shell`.
- Kept, not dropped: the Apollo-only shell cases (30 events, Unavailable-at-start, Observed badge, mission readout stability, UTC field) are still asserted in `browser-apollo-shell` (Apollo set).
- `browser-anchor-labels`: moved from Apollo's 40 anchors to the made-up scene's 12 (`?experience=synthetic`, desktop and phone). Apollo's own anchor labels are no longer checked; the labelling code is the same.
- `browser-view-link`: the Perseids and default (Apollo) runs moved to the made-up scene; the link code is generic.
- `browser-orbit-motion`: the Jupiter-Io run dropped; the made-up run exercises the same arc code.
- `browser-sky`: the Apollo and Perseids runs and the phone-size pass dropped when it moved to on-request (owner, 2026-10-20); it now runs the made-up scene at desktop size, on request.
- Repeats: tap-focus on `synthetic-ring`; phone-size passes of `-ring` and `-listed` (`browser-phone` owns phone layout).
- Jupiter-Io: 375x667 and 1280x720 passes; "every place within 75 degrees shown from some side" became "some places seen" with 2 sides (3 on phone); known-place presses cut to Loki Patera and Galileo Regio; phone checks 2 of 5 moons.
- spike02: phone event jumps, playback rates, speed, USNO phases (desktop only); the 30-sample 100x follow track became a speed read at 3 paused times with a negative probe.
- Showers: Perseids start-pass Earth-path checks; Venus and Mars panel and provenance; Geminids phone pass, loop-off, removed-switch and tail checks (Perseids owns them); long waits scaled to 60 percent.
- Smoke no longer loads every experience, only the set's own.
- Earlier trims (O-017, O-024, O-025): screenshots, contact sheet and `browser-earth-moon` (owner, 2026-10-18); the older one-off tools (`tools/archive/validate/`) were deleted in O-037 and live in git history.
- Not cut yet: Showers (390 s) and the planets set (248 s before O-033's two scripts) are over the 240 s aim; owner accepted them as they are.

## The harness (`tools/validate/harness.mjs`)

Every script gets its browser from the harness, never from `chromium.launch` (the guard fails it): `launchBrowser()` (software-rendering flags), `watchErrors(page, errors, label)` (page and console errors, the lines the runner counts) and `checkScript({ name, viewports }, run)` (launch, one page per viewport, error collection, close, `results.json`, non-zero exit). `browser-shell` and `browser-scale-menu` use `checkScript`; the other scripts use the two helpers and keep their own page pattern.

## The interface driver (`tools/validate/driver.mjs`)

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
| Scale | `chooseScale`, `currentScale`, `scaleOptions`, `offersScale`, `scaleMenu` (the isolated menu harness) |


Elements are found by accessible name or role, by a stable `data-*` attribute (`data-camera-preset`, `data-related-object`, `data-scale-current`) or `data-testid`; the few controls with none of those (the Events summary, the information panel, a few readout containers) are named once, in the `HOOK` table at the top of the driver. Camera, toggle and slider arguments are logical ids, not labels, so a renamed label changes one table.

**The guard** (`tools/validate/driver-guard.mjs`, run in the unit tests by `tests/browserDriverGuard.test.ts`, and as `node tools/validate/driver-guard.mjs`) fails when a script outside the driver calls `getByRole`, `getByText`, `getByLabel` (or the other `getBy*` finders except `getByTestId`), calls `click`, `fill`, `selectOption`, `press`, `focus`, `check`, `hover` or `tap` on anything, uses `keyboard.`, or calls `locator`, `querySelector`, `querySelectorAll` or `waitForSelector` with any selector other than the exceptions. **Exceptions, stated in the rule:** the scene canvas (`canvas`, `getByTestId(...)`), data-attribute readouts (a selector that begins `[data-`), and `new Array(n).fill(0)`. `mouse.move/down/up/wheel` on the canvas is not flagged (scene drags and zoom). `OPT_OUT` in the guard lists scripts exempt from the rule with a reason; it is empty.

## Scene readouts instead of pictures (T-102, TEST-03)

The canvas carries `data-*` readouts the driver reads (`tools/validate/driver.mjs`). Each is computed in the app each frame from the same objects that are drawn; a readout shows what the scene draws, never the picture of it.

| Readout (driver function) | Attribute | Says |
|------|------|------|
| `scenePaths`, `scenePath(id)` (I-040, extended) | `data-paths` | per path line: visible, vertices, vertices in view, the share of the view they span, the box's edges (`minX`..`maxY`, and the same for the drawn line between vertices, `lineMinX`..`lineMaxY`), the major-axis angle on screen (`axisDeg`), the view's `aspect`, and for an orbit its look in force (`look`: ring, arc, end fade, zoom brightening shown; the ring's opacity now; the arc's peak) |
| `scenePoints`, `scenePointGroup(id)`, `sceneDotsInView` | `data-points` | per point group: drawn (inside its time bounds), member count, members in view (an even sample of at most 512 scaled up), the share of the view they span |
| `sceneBodies`, `sceneBody(id)` | `data-body-screen` | per body: drawn as a sphere, a marker or not at all, its radius in pixels, its centre as shares of the view, in view; for a body with a halo, the halo's width in pixels, its brightness and whether it is drawn over the dots |
| `sceneSky` | `data-sky-stars`, `-picture`, `-picture-shown`, `-star-brightness`, `-milky-way-brightness` | the star count, whether the Milky Way picture is on and shown, and the two brightness settings in force |
| `sceneDrawsSomething` | (the three above) | bodies in view, dots in view and path lines in view: the readout form of "the canvas is not blank" |

