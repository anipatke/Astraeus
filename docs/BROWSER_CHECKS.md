# Browser checks: the map

Two rules shape these checks. The owner judges how things look, on the preview, so no check takes or compares a screenshot. Automation keeps only what eyes cannot judge: crashes and console errors, shipped-data and licence rules, and numbers, credits and behaviour. Most behaviour is proved in the fast suite (`npm test`); `npm run check:browser` covers what only a real browser can show.

## Running it

`npm install` and `npx playwright-core install chromium` once, then:

| Command | Runs |
|---|---|
| `npm run check:browser` (or `-- --tier full`) | every step below; the release run |
| `npm run check:browser -- --tier quick` | the quick steps only |
| `-- --tier quick --step <name>` | the quick tier plus the named steps, in one run (repeatable) |
| `-- --step <name>` | only the named steps, whatever their tier, with no total limit; for a Task that changes a browser script |
| `-- --skip-examples` | leaves out the four packed `hello-*` steps |
| `-- --list` | prints the selected steps and their tiers and starts nothing |

An unknown tier or step exits 2 and names it. Which command a Task, a Full Objective Check and a release run is decided in the [browser policy](agents/browser-policy.md), not here. Set `PLAYWRIGHT_CORE` only to use another copy of the library.

## Where things live

- **Runner:** `packages/astraeus-site/tools/validate/run-browser.mjs` (arguments) and `runner.mjs` (servers, steps, summary). It starts its own dev server, a preview of a scratch public build for the `public` steps and one preview per packed example, and runs one browser at a time.
- **Steps and tiers:** `STEPS` in `packages/astraeus-site/tools/validate/browser-steps.mjs`; each step names its script, environment and a one-line `scene` that the summary prints. Edit steps there.
- **Time limits:** [`tools/gate-limits.json`](../tools/gate-limits.json) is the one maintained source (`browser.steps`, `browser.total` for the full tier, `browser.quickTotal`, `browser.quickLookOutTotal`). Each total is its own cap on the whole run's wall clock, set from measured runs; it is not the sum of the step limits and may be smaller or larger than that sum, because no run has every step at its limit at once. A quick run with added steps other than `look-out` adds those steps' limits to `quickLookOutTotal`; `--skip-examples` leaves the totals unchanged. The step table below and the table in [project gates](agents/build.md) are checked copies: `packages/astraeus-site/tests/gateLimits.test.ts` fails when either differs from the file. A step or total over its limit adds a `WARNING:` line and never changes the exit code; a failing step does. When a step grows past its limit, find out why before raising the number.
- **Results:** a fresh `docs/evidence/browser-<UTC stamp>/` per run (`browser-quick-…` for the quick tier, `browser-steps-…` for a `--step` run), holding `summary.txt` and each step's `results.json`. Step and server logs go to a scratch folder under the OS temp directory. A run folder no Check, Task, Issue or Design note cites may be removed at the next clean-up (retention rules: [browser policy](agents/browser-policy.md)).
- **Shared code:** `harness.mjs` (browser launch, error watch, `checkScript`) and `driver.mjs` (every user action and readout), below.

### Finding the latest run's evidence

The run's last line prints `evidence: <folder>`. Afterwards, the newest folder is `ls -td docs/evidence/browser*/ | head -1`; read its `summary.txt`. Its first line names the tier, the second the scratch log folder; then one line per step (`exit=`, seconds, limit, `error-lines=`) and a `total` line. The public-build file checks write `docs/evidence/public-build-<stamp>/` the same way (`ls -td docs/evidence/public-build-*/ | head -1`).

### Measured time

One dated measurement, kept apart from the limits: on 2026-11-22 (owner's desk machine, 16 cores, WSL2) the full tier took 310 s (`docs/evidence/browser-20261122T032627Z/`) and the quick tier 124 s (`docs/evidence/browser-quick-20261122T023312Z/`), with each step's time, in [where verification time goes](evidence/test-cost/report.md#3-browser-recorded-runs-no-new-run). A newer run's `summary.txt` supersedes it.

## Diagnosing a failure

1. Open the run's `summary.txt` and find the step with a non-zero `exit=` or `error-lines=` above 0. A `WARNING:` line alone is time, not a failure.
2. Read that step's `<step>.log` in the log folder the summary's second line names (page and console errors, the failed assertion), and its `results.json` in the evidence folder (per load or per scenario: `ok`, `failures`, what was drawn).
3. Rerun only that step: `npm run check:browser -- --step <name>`. The smoke script also narrows by environment: `ASTRAEUS_VIEWS` or `ASTRAEUS_SKIP_VIEWS` (comma lists of view ids) and `ASTRAEUS_SIZES` (`desktop`, `phone`).
4. If an interface change broke it, repair `driver.mjs`, never the script. If a change removes, loosens or moves an assertion, list each affected scenario and where it is now checked in the Task evidence, against the maps below.
5. Look at it yourself on the dev server (`npm run dev`); the made-up scenes (`?experience=synthetic-*`) load only there.

## What each class of step protects

Each step runs at desktop (1280x720) and phone (375x667, touch) size unless noted. The scripts read the canvas readouts (below) only because the harness sets `globalThis.__ASTRAEUS_DIAGNOSTICS__ = true` on every page it opens (`ASTRAEUS_DIAGNOSTICS=0` leaves it unset); a viewer without that flag writes none of them.

- **Page loads (smoke).** Every public page and demo view opens without a page or console error, with the shell up and a body, path or dot in view (stars alone do not count); every showers view draws its meteor stream (`stream-check.mjs`), also on the public build, so the shipped copy is what loads.
- **Journeys.** Behaviour a pretend page cannot show: touch, controls that fit and can be pressed, camera rules, story steps, more than one viewer on a page. Each journey's state rules that need no canvas are proved in the fast suite instead (named in the retired-scenario map).
- **Packed examples.** The four `examples/` apps, built from the packed tarballs (`tools/build-example.mjs`, once per run), work as a consumer would install them.
- **Public build files** (no browser): `npm run check:public-build` (`tools/check-public-build.mjs`) builds the scratch public site and runs `public-build-assets.mjs` (licence records, no made-up scenes, page size, required pages) and `public-addresses.mjs` (no retired links). It is not a `check:browser` step.
- **Size limits** are not browser checks: the engine's in `engine-budget.mjs` (run by `npm run check:pack`), each page's own share in `load-budget.mjs`; see Design "Size budgets are split".

| Step | Tier, script | Protects | Limit |
|------|------|------|------|
| `smoke` | quick, `browser-smoke.mjs` | every public page and demo view except the made-up journey and the made-up belt (the default shower's named view is left out: `showers` loads the same file), including `components.html` and `?experience=synthetic-probe` (probe path, its label shown, the Sun's line box fixed) | 65 s |
| `orbit-lines` | full, `browser-smoke.mjs` | `?experience=synthetic-belt` at true scale with the camera on Earth and time playing, zoomed to Earth drawn large: the screen distance from Earth's centre to its orbit line stays under 2 px at every sampled frame, desktop and phone (O-099 T-446; full tier by owner choice, 2026-11-23, so the quick tier stays quick) | 60 s |
| `synthetic-journey` | full, `browser-smoke.mjs` | the made-up 1977-to-170-AU journey, both sizes side by side: moons in the scene on their dates, Saturn's orbit line, the whole path in view and labelled when zoomed out, the phone near-Saturn sequence (side by side is the owner's choice, O-060, which makes its time depend on the machine) | 115 s |
| `smoke-public-showers` | quick, `browser-smoke.mjs` | the showers views on the scratch public build, desktop only: each shipped stream file is drawn | 15 s |
| `planets-phone` | quick, `journey-planets-phone.mjs` | phone with touch: switch Mercury to Jupiter, focus Io from the moons panel, open a place card | 20 s |
| `meteor-shower` | full, `journey-meteor-shower.mjs` | Perseids at desktop size: a paused scene stops drawing and a wheel, tap or play wakes it; play, seek (stream in view), a story panel; the switch opens the Geminids in place, with no reload | 30 s |
| `views` | full, `journey-views.mjs` | made-up `synthetic-views`: view buttons fit and clear their neighbours; a visitor switch and a host `setView` move each probe's drawn line; follow moves Earth on screen, stay holds it still | 30 s |
| `look-out` | full, `journey-look-out.mjs` | made-up `synthetic-lookout`: the camera reading from `window.astraeusHost.camera`, look-out entries offered and fitting, wheel narrows the field; sky figures, switches, labels that do not overlap, the site trace control; tapping a figure selects it; the three-step story turns the camera, traces and clears | 100 s |
| `two-viewers` | full, `journey-two-viewers.mjs` | made-up `synthetic-two-viewers`: both canvases in the window, apart and drawing; the first taken down leaves the second drawing with no console error or WebGL warning; the second survives a lost and restored context; the second taken down leaves no canvas; a page whose canvases refuse WebGL shows the short no-WebGL message inside the window, no canvas, `ready` rejected with `no-webgl` | 15 s |
| `catalogue` | full, `journey-catalogue.mjs` | `components.html`: Run buttons big enough, no sideways scroll or crossing text, one viewer at a time holding the part's words, each part's live readouts, a phone sheet closing when its button turns the camera | 10 s |
| `hello-scene` | quick, `check-hello-scene.mjs` | `examples/hello-scene`: the probe listed and picked, Focus from the first frame, anchors labelled, two events, the story panel with badge and source, the placed display switches, the 40-dot ring as one group, Earth, Moon and its orbit drawn, time set and movable | 25 s |
| `hello-react` | quick, `check-hello-scene.mjs` | `examples/hello-react`: the same readouts through the `AstraeusScene` React component | 10 s |
| `hello-planets` | quick, `check-hello-planets.mjs` | `examples/hello-planets` (plain `mount`, no data package): the Sun to Mars drawn, the page's sliders and scale button drive the viewer and overlap nothing, Earth's card names the Sun | 15 s |
| `hello-sky` | quick, `check-hello-sky.mjs` | `examples/hello-sky` (engine plus constellations tarballs): opens looking out toward Orion, the story turns, selects and traces it, the width slider keeps the direction, the card and ecliptic switch, no overlap | 35 s |

Every made-up scene on the dev page is a `Scene` built on the public API in `packages/astraeus-site/src/synthetic/`; a public build leaves the folder out (`checkNoSyntheticExperiences`). Bodiless and engine-only proofs stay in the engine's own tests (ARCH-03).

## Retired scripts, and where each scenario went

O-038 T-147 replaced every other browser script with the steps above (git history keeps them; the line-by-line maps are in the Technical Evidence of `.savepoint/objectives/O-038-*/tasks/` T-143, T-144 and T-146). Code for each: **D** a fast test (file under `tests/`, then case); **S** the smoke step; **J** a journey; **O** the owner's look on the preview. Nothing is unmapped.

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
| `browser-apollo-shell` | 30 events, Unavailable at start, one scale, labels, info wording, metric visuals | D `domApollo`, `missionScene`, `infoProvenance` ("Apollo known limitations ..."), `metricVisuals` ("gives each spacecraft's info card ..."), `rebuildComparison`, `experiences`; labels and follow fallback S |
| `browser-spike02` | six phases, camera invariance, jumps, rates, speed against range, four USNO phases | D `domApollo`, `missionScene`, `core` (clock: "keeps same-time science fixed when playback rates differ"), `infoProvenance` |
| `browser-home-curve-fits` | 325 dots, 2 pieces, slider, distance bound | D `homePage`; drawing S; phone layout O |
| `browser-showers`, `browser-public-showers` | Sun-centred scene, Object list, scales, orbits, peak, year, no CAMS, shower switch, shipped orbits | D `demoShowers`, `demoRules`, `showers`, `showersMeasured`, `rebuildComparison`, `showerSwitch`, `viewUp` ("ecliptic-up view"), `startCamera` ("the start camera (I-028)"), `publicBuild`; the swap S, J; the stream drawn (dots in view) S and J, on the public build too (`smoke-public-showers`) |
| `browser-jupiter-io`, `-jupiter-tap` | Jupiter and four moons, 111 dots, rings, places, small-moon taps | D `demoPlanets`, `jupiterIo`, `jupiterMoonsScene`, `moonOrbits` ("measures every body against Horizons ..."), `featureMarkers`, `scenePicking`; drawing S |
| `browser-moon-panel` | families, counts, big four, search, lit family, focus on a moon | D `domMoonPanel`, `moonFamilyPanel`; the moons sheet and information panel never together: D `domMoonPanel` "never show together on a wide screen"; the flight S; overlap O |
| `browser-outer-planets`, `browser-planet-switch` | switch keeps the clock; Saturn rings; Titan and Charon places; Pluto; Uranus; Mars | D `planetChoice`, `planetSystems`, `planetSwitchInner`, `demoPlanets`, `plutoOrbitLines`; the switch on a phone J |
| `browser-lite` (smoke) | every page and view loads, no errors | S (`browser-smoke.mjs`) |
| `views` and `catalogue` steps, trimmed (O-086 T-392) | view list, labels and opening view; Object list, timeline events and panel markers per view; pressed button; clock and speed across a switch; host `view` and `cause` records; catalogue entries in order, idle at open, out-of-the-box list, names, closed fold, import, add and shown lines | D `viewsJourneyState`; `viewerHostDom` "publishes the view ..."; `catalogueEntries`; fit, sizes, camera stay and follow, drawn paths and one viewer at a time stay in the steps. Each retired assertion is named in the Task evidence that retired it (O-086 T-392, O-088 T-404) |

Rows that name a file but not a case are covered by that file as a whole. Apollo's typed-date field and telemetry cards, removed from the Developer drawer in O-041 T-169, are checked by nothing now (accepted loss).

## The harness (`packages/astraeus-site/tools/validate/harness.mjs`)

Every script gets its browser from the harness, never from `chromium.launch` (the guard fails it): `launchBrowser()` (software-rendering flags), `watchErrors(page, errors, label)` (page and console errors, the lines the runner counts) and `checkScript({ name, viewports }, run)` (launch, one page per viewport, error collection, close, `results.json`, non-zero exit). The journeys use `checkScript`; the smoke script uses the two helpers and keeps its own page pattern.

## The interface driver (`packages/astraeus-site/tools/validate/driver.mjs`)

Scripts never find or operate controls themselves. Each user action and readout is one exported driver function (`import * as ui from "./driver.mjs"`; the exports are the list); when the interface changes, only the driver is edited. The settling waits (`waitUntilStable` and the waits built on it) replace fixed sleeps with a wait on the readout the sleep stood for; they return the last value at their timeout and never fail by themselves, so the assertion after them decides.

Elements are found by accessible name or role, by a stable `data-*` attribute (`data-camera-preset`, `data-related-object`, `data-scale-current`) or `data-testid`; the few controls with none of those are named once, in the `HOOK` table at the top of the driver. Camera, toggle and slider arguments are logical ids, not labels, so a renamed label changes one table.

**The guard** (`packages/astraeus-site/tools/validate/driver-guard.mjs`, run in the unit tests by `packages/astraeus-site/tests/browserDriverGuard.test.ts`, and as `node packages/astraeus-site/tools/validate/driver-guard.mjs`) fails when a script outside the driver calls `getByRole`, `getByText`, `getByLabel` (or the other `getBy*` finders except `getByTestId`), calls `click`, `fill`, `selectOption`, `press`, `focus`, `check`, `hover` or `tap` on anything, uses `keyboard.`, or calls `locator`, `querySelector`, `querySelectorAll` or `waitForSelector` with any selector other than the exceptions. **Exceptions, stated in the rule:** the scene canvas (`canvas`, `getByTestId(...)`), data-attribute readouts (a selector that begins `[data-`), and `new Array(n).fill(0)`. `mouse.move/down/up/wheel` on the canvas is not flagged (scene drags and zoom). `OPT_OUT` in the guard lists scripts exempt from the rule with a reason; it is empty.

**Outcome controls** (O-088): three tests prove that a browser run fails when it should, instead of comparing the text of its assertions. `tests/browserExitPath.test.ts` runs the real `harness.mjs` and `run-browser.mjs` and shows that a step that throws, a console error on the page, and a non-zero step result each end in a non-zero exit. `tests/browserDrawnControl.test.ts` shows that a scene with zero stream dots, or with nothing drawn, fails the run and names the stream or the scene. `tests/streamCheck.test.ts` covers the drawn-count rule case by case. What they do not see: an assertion deleted or loosened inside a step that still passes. That is a review step, not a test: the Task evidence lists each affected scenario and where it is now checked, and the Check reviews that list against the maps above.

## Scene readouts instead of pictures (T-102, TEST-03)

The canvas carries `data-*` readouts the driver reads. Each is computed in the app each frame from the same objects that are drawn; a readout shows what the scene draws, never the picture of it.

| Readout (driver function) | Attribute | Says |
|------|------|------|
| `scenePaths`, `scenePath(id)` | `data-paths` | per path line: visible, vertices, vertices in view, the share of the view they span, the box's edges (`minX`..`maxY`, and the same for the drawn line between vertices, `lineMinX`..`lineMaxY`), the major-axis angle on screen (`axisDeg`), the view's `aspect`, and for an orbit its look in force (`look`: ring, arc, end fade, zoom brightening shown; the ring's opacity now; the arc's peak) |
| `scenePoints`, `scenePointGroup(id)`, `sceneDotsInView` | `data-points` | per point group: drawn (inside its time bounds), member count, members in view (an even sample of at most 512 scaled up), the share of the view they span |
| `sceneBodies`, `sceneBody(id)` | `data-body-screen` | per body: drawn as a sphere, a marker or not at all, its radius in pixels, its centre as shares of the view, in view; for a body with a halo, the halo's width in pixels, its brightness and whether it is drawn over the dots |
| `sceneSky` | `data-sky-stars`, `-picture`, `-picture-shown`, `-star-brightness`, `-milky-way-brightness` | the star count, whether the Milky Way picture is on and shown, and the two brightness settings in force |
| `orbitLineGapsPx` | `data-orbit-line-gap` | per Sun-centred orbit line (by path id): the screen distance in pixels from its body's drawn centre to the nearest drawn segment of the line, in the frame the body is placed; null when no segment is in front of the camera |
| `sceneDrawsSomething` | (the three above) | bodies in view, dots in view and path lines in view: the readout form of "the canvas is not blank" |
