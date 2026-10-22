---
id: T-146
title: Check each demo's own rules in fast tests
objective: O-038
status: done
depends_on: [{task: T-143, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o038-planning-20261023}
lane: demos
check_waiver:
  task: T-146
  reason: 'owner asked for one full fresh check at the end of O-038 instead. Owner quote: "orchestrate the delivery of O-38. ask clrifying questions front, one full (new) chek at the end"'
  actor: {role: owner, session: o038-orchestration-20261023}
  recorded_at: '2026-10-23T00:00:00Z'
---

# Check each demo's own rules in fast tests

## Outcome

What the Apollo, showers and planets browser scripts prove beyond "it opens" is proven by fast tests: Apollo's provenance wording, 30 events, mission readouts, true and readable telemetry pairs, event jumps and home curve fits; the showers' orbits, Earth path, bodies, year, public shower rules and story panels; the planets' presets, places, orbit lines, moon panel, small-moon dots, planet switch keeping the clock, Saturn rings, places on Titan and Charon, Uranus rings, and Mercury to Mars in the switch.

## User Check

None on screen. Run `npm test` and see the new demo tests pass.

## Done When

- Each behaviour scenario in `browser-apollo-shell`, `browser-spike02`, `browser-home-curve-fits`, `browser-showers`, `browser-public-showers`, `browser-jupiter-io`, `browser-moon-panel`, `browser-jupiter-tap`, `browser-outer-planets`, `browser-planet-switch` and the demo parts of `browser-story-panels` is listed in Technical Evidence with the test file and case that now proves it, or "journey" (Planets on a phone, Play a meteor shower), "draws: smoke check", or "looks: owner's look on the preview".
- Screen-level demo proofs (moon panel, story panels, mission panel) use the pretend-page helper from the screen-parts step.
- Existing demo tests are reused and named exactly where they already prove a scenario (TEST-03).
- Scripts are not deleted here. The fast suite stays about a minute or less (time recorded). Configured gates pass.

## Context Files

`tools/validate/browser-apollo-shell.mjs`, `tools/validate/browser-spike02.mjs`, `tools/validate/browser-home-curve-fits.mjs`, `tools/validate/browser-showers.mjs`, `tools/validate/browser-public-showers.mjs`, `tools/validate/browser-jupiter-io.mjs`, `tools/validate/browser-moon-panel.mjs`, `tools/validate/browser-jupiter-tap.mjs`, `tools/validate/browser-outer-planets.mjs`, `tools/validate/browser-planet-switch.mjs`, `tools/validate/browser-story-panels.mjs`, `tests/domSetup.ts`, `src/shell/MoonFamilyPanel.tsx`, `src/shell/moonFamilies.ts`, `src/shell/storyPanels.ts`, `tests/apollo11Reconstruction.test.ts`, `tests/showers.test.ts`, `tests/jupiterIo.test.ts`, `tests/moonFamilyPanel.test.ts`, `tests/planetSwitchInner.test.ts`, `tests/storyStoriesAllDemos.test.ts`.

## Design References

Design: Shower builder (T-038, T-039, T-055); Story panels (O-015); the `src/experiences/` row.

## Guardrails

ARCH-01, ARCH-04, TEST-01, TEST-03; STYLE rules as listed in `.savepoint/Guardrails.md`.

## Implementation Plan

1. Confirm the pretend-page helper exists; if not, return REPLAN REQUIRED.
2. Demo by demo, list each script's assertions, reuse existing tests, add cases where missing.
3. Leave the two journeys' scenarios to the browser command; mark them "journey".
4. Record the scenario map and suite time.

## Boundaries

No change to what visitors see or to demo data. No browser runs, no script deletion, no doc edits. No screenshots.

## Technical Verification

Focused `npx vitest run <files>` while building; configured gates at hand-off. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built in lane `lane-t146`. Task Check waived (see `check_waiver`); the Full Objective Check covers this. No browser run, no screenshot, no `test:full`, no health check, no script deleted, no dependency or source change.

**What was built (tests only).** `tests/domApollo.test.ts` (20 cases), `tests/domMoonPanel.test.ts` (7), `tests/domDemoStories.test.ts` (8), `tests/demoShowers.test.ts` (24: 12 cases run on each real shower file), `tests/demoPlanets.test.ts` (8), `tests/demoRules.test.ts` (16) = 83 cases. The three `dom*` files opt in with `// @vitest-environment happy-dom` and use `tests/domSetup.ts`; the moon panel is mounted directly (the app, not the shell, holds the lit family). Extra reads beyond Context Files: `src/shell/Collapsible.tsx`, `StoryPanelView.tsx`, `src/experiences/showers/{showerActivity,showerBasics,showerPaths}.ts`, `src/experiences/apollo11/{apolloMetrics,apollo11}.ts`, `tests/{missionScene,metricVisuals,infoProvenance,showers,showersMeasured,bodyMarkers,planetSystems,planetSwitchInner,domStory,domShell}.test.ts` (to name existing cases). Edits outside planned scope: none.

**Gates (lane, 2026-10-23).** `npm run lint` pass; `npm run typecheck` pass; `flock /tmp/astraeus-build.lock npm run build` pass (chunk-size warning only); `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 110 files, 1499 passed, 1 skipped; vitest Duration 29.7 s (other lanes were running). The lane base was 104 files, 1416 passed, 34.5 s (T-143 and T-144 merged), so the 83 new cases cost no visible time.

**Scenario map.** D = proven by a fast test (file "case"); J = journey (Planets on a phone, Play a meteor shower); S = draws: smoke check; O = looks: owner's look on the preview. New files are `demoApollo`-style names above; existing tests are named exactly.

browser-apollo-shell.mjs
- A1 developer panel closed at start, no mission panel until opened: D `domShell` "the developer cog" (generic); the Apollo mission panel mounts only with Developer on: S.
- A2 30 events listed (Developer and timeline the same list); picking a row names it; next moves on; the first marker's label shows: D `domApollo` "are the mission's thirty, listed on the screen as many rows, and the same list the timeline markers use" and "each row jumps the clock to its event's time, and the context line names it"; the label showing on focus is stylesheet: O.
- A3 Columbia unavailable ("Unavailable", disabled) before its trajectory: D `missionScene` "provides configured camera labels and marks objects unavailable outside their trajectory bounds"; "omits current-position rows outside bounds and shows each vehicle only while it is sampled".
- A4 scene labels shown in focus/follow and hidden in overview; no overlap: S and O. Range/speed readouts fixed while camera modes change: D `missionScene` "shell object selection and overview, focus, and follow requests leave State identical at a fixed time" and `domApollo` "read the same whichever camera preset is chosen: ...".
- A5 follow Columbia/Eagle presets exist and are chosen: D `domApollo` (same case, preset ids); `experiencePlugIn` "hands the shell its own objects".
- A6 info panel for Columbia/Eagle/Moon: Metric Visuals, provenance badge, Known limitations/Sources/Accuracy, wording "Smoothed joins", "Burn cutoffs", "translunar injection", "Landing site", "no libration": D `infoProvenance` "cover smoothed joins and burn cutoff residuals for each vehicle, quoting the validation figures", "covers the accepted post-TLI speed limitation ...", "covers Eagle's landing-site offset at touchdown and lift-off"; `stateResolver` (Moon "no libration"); `domApollo` "columbia/eagle/moon states its limitations and carries a status"; `domShell` "information, provenance and Sources". Escape closes: `domShell`.
- A7 an event opens as Observed: D `infoProvenance` "gives every event its title, time and source status".
- A8 one scale: no scale control, no explanation button, True in force: D `experiences` "declares the Earth–Moon composition and the two original scale choices" (True only) and `domApollo` "offers True only, so the shell has no scale control and no explanation button". The True/Readable pair (toggle name, identical readouts, tooltip, About the scales) on the made-up scene: `domShell` "the two scales" (moved there by T-143).
- A9 mission panel (developer): toggles and UTC field present: S (app-owned developer tools). Four instrument metrics, Earth–Moon distance numeric-only, lunar illumination as a band: D `metricVisuals` "keeps Earth–Moon distance numeric-only and lunar illumination as a band without a lit side".
- A10 per-vehicle speed arc ("peak at NASA source anchors"), range bar ("Moon now ... km"), relative-distance/altitude/uncertainty/coordinates metrics, Eagle altitude wording, journey progress, Moon position three readings, radar view with its label: D `metricVisuals` "tops each speed gauge at the vehicle's peak speed ...", "marks the Moon on a range bar only when ...", "measures the spacecraft–Moon gap and altitude ...", "reads each segment's published discrepancy ...", "measures journey progress from the first to the last event", "metric visuals mounted, updated and removed leave State identical at a fixed time" (renders `MissionTelemetry`, asserts "Moon now" and the peak wording), `describe "coordinate radar view"`.
- A11 metric visuals fit a phone portrait: O. A12 follow fallback to overview at the timeline end, drag and wheel: S. A13 advanced readouts list (one), zero console errors: S.

browser-spike02.mjs
- B1 six mission phases: spacecraft readouts present at True: D `domApollo` "%s: the vehicle's range, speed and Moon gap read as finite numbers at %s" (six cases); the pairs under True and Readable: `infoProvenance` "leaves State and every info readout identical under True and Readable through the shell's choice".
- B2 camera presets leave UTC and readouts unchanged (desktop and phone select): D `domApollo` "read the same whichever camera preset is chosen: ..." and `missionScene` "shell object selection and overview, focus, and follow requests leave State identical at a fixed time"; the phone's Camera select: `domPhone` (object picker).
- B3 30 events, same list in Developer and timeline, each jump lands on its UTC: D `domApollo` (A2 cases) and `missionScene` "jumps to every listed event exactly and rejects unknown ids".
- B4 four playback rates measure within 0.5x to 1.5x: D `missionScene` "offers 1×, 100×, 1,000× and 10,000× on top of the existing speeds", "yields the same State at T whether reached by seek, jump or 10,000× playback"; `core` (clock). The wall-clock measuring itself was a machine-load probe: O.
- B5 speed readout against the range's rate of change at three times, with the negative probe: D `domApollo` "at %s matches the range's rate of change one simulated minute later, within 8 percent, and a wrong expectation is rejected" (three cases).
- B6 four USNO phase dates within one point: D `domApollo` "%s is %s percent lit within one point" (four cases); `experiences` "matches the lunar illumination the scene's own readout uses".
- B7 zero console and page errors: S.

browser-home-curve-fits.mjs
- H1 section renders 325 table dots, 2 pieces, the measured figures: D `homePage` "draws Io's real fitted pieces: the page holds the committed coefficients, 2 of Io's and 1 of Jupiter's" and the 325-dot count in the same file; drawing in the page: S.
- H2 the slider moves hours, Io's distance within 400,000 to 445,000 km, recipe marker: D `homePage` (the 400,000 to 445,000 km bound and the slider positions in the same file); the marker's on-screen move: S.
- H3 phone first: no sideways scroll, nothing past the edge, 44 px slider, 12 px text, columns, no overlaps: O (layout).
- H4 zero console errors: S. (Retired with the script by T-147; the home page is its own page, not a demo.)

browser-showers.mjs (every shower file; D rows run on both real files in `demoShowers`)
- W1 Sun-centred scene, mounted bodies, six declared paths, no other parent: D `demoShowers` "is a Sun-centred scene of the Sun, Earth, the four planets and its own parent, with six declared paths and no other shower's parent"; `experiences` "mounts the Sun, Earth, the planets and the comet about the Sun, with no Moon anywhere".
- W2 Object list: stream once, bodies listed, orbit lines out of the list, related buttons, no Moon/Apollo, one stream group: D `demoShowers` "lists the stream once and every mounted body, keeps every orbit line out of the Object list but offers each from its body, and has no Moon or Apollo item"; `experiences` "leaves every orbit line out of the Object list but offers each from its body".
- W3 scales true and solar-system, Earth's factor stated: D `demoShowers` "offers True and Solar-system scale, and states Earth's and every planet's factor in the Solar-system scale"; the enlarged Earth drawn (radius px): S; `bodyMarkers` "under the solar-system scale an enlarged planet stays a sphere at distances where the true-scale one is a marker".
- W4 comet's orbit drawn in Overview/at peak, Earth's path at the peak, whole-orbit preset framing, planet orbit lines drawn: D `longOrbitPaths` ("puts every vertex of the orbit inside a 45 degree, 16:10 view ..."), `sunCentred` ("Earth's path and the Sun are placed through centre composition"), `showers` "draws the parent's whole orbit deliberately by eccentric anomaly and not through the planet loop" and "puts the parent's own periapsis where the sweep finds it", `demoShowers` ("offers Focus parent, Whole orbit, Focus stream and Follow Earth ..."); the lines and the follow framing on screen: S.
- W5 planet orbit panels with the planet's provenance; Jupiter's passes the compared range: D `demoShowers` "gives each planet's orbit the planet's position provenance and the compared range, and Jupiter's orbit says it passes it".
- W6 body labels at some zoom, markers at True scale / bodies at solar-system scale, the Sun's label off but still listed: D `demoShowers` ("offers Focus parent ... and the Sun's label follows the settings while the Sun stays listed"), `demoRules` "%s mounts the Sun, lists it and selects it, and starts with its name tag off", `showers` "show every label unless the settings file says otherwise, and keep the object listed and selectable", "start from the objects' own settings and take ?labels= over them"; `demoRules` "each mounted body has a drawn size, a marker far off and a sphere close up"; labels on screen: S.
- W7 peak instant at the published solar longitude (within 0.3 deg): D `showers` "pins the published 2019-2020 values: Geminids 4-17 December 2019 (IMO 2019), Perseids ... peaks at the IAU MDC solar longitudes"; `solarLongitudeConvention`. The rate readout highest at the peak: D `demoShowers` "reads the rate highest at the peak, above the start and the end, and says so outside the activity window"; `showers` "uses the same samples for the rate readout and the window curve, peaking at the published rate".
- W8 not fetched: stream still listed, GMN fetch command, no removed flag, bodies still drawn: D `demoShowers` "when the orbits are absent, still lists the stream and says so with the GMN fetch command; in a public build ..." and `showers` "says how to fetch the GMN months when they are not on this machine".
- W9 frame rate readout: retired measurement: O.
- W10 loop wraps and stays in the window, dots after the wrap, loop off runs past the end and the stream is gone: D `showers` "wraps past the end to the same phase inside the window, and stops mattering when paused", "wraps backwards at a negative rate, and without wrapping the clock runs on past the end", "draws the stream at the first and last instants of the window, and nothing past the end (the cause of the disappearing stream)", "is off for an experience that does not ask, and on when the shower settings turn it on"; dots drawn: S.
- W11 ecliptic flat / celestial north up: D `showers` "keeps the camera's up at celestial north unless the settings ask for the ecliptic"; `viewUp`; `demoShowers` "opens where the settings say: the declared view and up direction"; the shape on screen: S.
- W12 year span about 365 days from the settings' year start, peak inside, glow and peak mark, settings rate, dots drawn across the year, outside-window wording: D `demoShowers` "spans about a year from the settings' year start, mid-way through the peak, with the settings' playback rate and its activity glow and peak mark"; `showers` "is one year centred on the peak for a year, ...", "starts the year at the settings' year start when given: ...", "is the activity window unless the settings ask for a year"; `showersYearHorizons`; dots: S.
- W13 span=activity timeline: D `showers` "is the activity window unless the settings ask for a year".
- W14 quality sets: counts, rule sentence, both counts, cited rule, provenance count, set buttons and switch to reliable: D `showers` "counts both sets and selects the reliable one in file order", "keeps a record that sits exactly on the thresholds, and cuts one just outside", "draws the chosen set, says which, with its count and the cited rule, and offers the other for comparison"; `demoShowers` (alternates); the pressed state after the switch: S.
- W15 removed switches (no source buttons, ?source=cams ignored, no CAMS file requested): D `showers` "is the GMN for both showers, named with its months and licence in the settings, and offers no source switch", "refuses a settings file that still names CAMS, with a named error"; `demoShowers` "cites the Global Meteor Network ... names no CAMS source, offers no source switch ...". The request log: S.
- W16 up toggle default ecliptic, switching without reload, switching back: D `showers` (up-direction case above); the live toggle and no reload: S.
- W17 shower switch (named Shower, active, other offered, other's file not requested until chosen, address keeps experience and other settings, drops view and time, streams swap, switching back): D `showerChoice` "opens the lowest order by default and lists every shower in order", "opens the requested shower, and the default for an unknown one", "builds the switch address keeping other settings but dropping the old view and time"; the file request log and the live swap: J (Play a meteor shower) / S.
- W18 plain load shows the stream (over 50 dots) and is not a Sun close-up; opens at look.startView: D `demoShowers` ("opens where the settings say ..."); `startCamera`; the dots and the Sun's size on screen: S.
- W19 stream details: radiant RA/Dec/J2000/source, Illustrative badge, GMN credit (licence, months, both papers, counts), no CAMS source, member count equals the file's, position along each orbit illustrative, the clump a model with fraction/width/parent, a band at the parent's phase, parts that miss Earth not shown, no invented spread: D `demoShowers` "reads the radiant from the settings ...", "marks the stream illustrative and states its parts ...", "cites the Global Meteor Network with licence, months, both papers and counts, ..."; `showersMeasured` "is drawn from the GMN file by the builder, with the source, licence and counts in the panel, ...".
- W20 one stream group, listed once, glow label and peak rate, smooth gradient brightest at the peak, tooltip, live brightness, slim timeline line: D `demoShowers` (W12), `timeline` "timeline activity glow (T-084)" cases; the gradient on screen and the height: S / O.
- W21 Focus stream preset, details shown: D `demoShowers` ("offers Focus parent, Whole orbit, Focus stream ..."); the flight and the panel opening: S.
- W22 stream visible at start, peak, end and zoomed out; rate readout shown: S (dots in view); the rate itself: W7.
- W23 window details open: D `experiencePlugIn` "mounts one window through ExperienceConfig.windows, inside the timeline"; `domShell` (timeline window).
- W24 Apollo is the default, removed `?experience=` names open the default, plain Showers address opens the first shower, unknown shower opens the first, synthetic-ring still mounts: D `showerChoice` ("opens the requested shower, and the default for an unknown one"), `experiences`, `experienceDefinition` (page titles, defaults), `syntheticRing`; the address handling in the app: S.

browser-public-showers.mjs
- PS1 stream from the shipped copy, no data/local file, no CAMS file served, one group: D `showers` "says in plain words that a production build has no orbits, without a fetch command"; `publicBuild`; `showersMeasured` "holds the files the settings name, CC BY 4.0, with the two citations, hashes and the counts, and parses as the builder's input"; the request log: S.
- PS2 panel counts the shipped orbits and carries the GMN credit and no CAMS source: D `demoShowers` "cites the Global Meteor Network ... and counts the shipped orbits it draws" (built from the shipped file). No source switch, orbit-set switch still offered: D `demoShowers` (alternates), `showers`.
- PS3 shipped file blocked: absence message without fetch command: D `showers` (same production-build case) and `demoShowers` (absent case). Zero console errors: S.

browser-jupiter-io.mjs
- J1 Jupiter and four mapped moons mounted, centre Jupiter, per-body lighting, Io's loop drawn, object list, no other experience's content, True scale only and no scale control: D `demoPlanets` "mounts Jupiter and its four mapped moons about Jupiter, in True scale only, with Io's loop the one drawn path"; `jupiterIo` "lights Jupiter and Io each along its own Sun direction", "is mounted by a composition with Jupiter as the natural centre and a loop of one period".
- J2 every small moon drawn in one batch, 111 dots, one orbit line per moon, a colour per family, no wall of names: D `demoPlanets` "draws every other catalogued moon as one batch of dots, with one orbit colour for each family"; `moonFamilyPanel` "lists every catalogued moon once, under its family, with counts from the data"; `jupiterMoonsScene` "draws all 115 catalogued moons: the four mapped ones as bodies, the other 111 as one body set"; the dots in view and the names: S.
- J3 hover/tap on a dot picks it: D `scenePicking` "hits a sub-pixel body within the pointer's tolerance, more generously for touch"; the name tag on screen: S.
- J4 Io moves between two dates (readouts differ, label moves), each moon sits on its orbit line: D `jupiterIo` "stays within the ellipse the elements describe and is Jupiter-centred only", "is placed where Horizons puts it: the resolver's Io is within 2 m of Horizons at the 2016 fixture dates"; `moonOrbits`; on screen: S.
- J5 smallest moon a ball wider than its dot up close, named there: S (drawing) / O.
- J6 four ring bands at the published radii and colours, one scale, live opacity: D `planetSystems` "Saturn's, Uranus's and Neptune's rings come from the NSSDC fact sheets, with a look from the donor, and Pluto has none"; `jupiterMoonsScene` "are the four Planetary Explorer bands at the NSSDC radii, drawn through the experience's overrides" and "take live colour and opacity per band, and refuse bad data"; `demoPlanets` Saturn rings case.
- J7 four presets frame something drawn, bodies spheres in view: D `experiencePlugIn`; `planetOpeningFraming`; on screen: S.
- J8 Io/Jupiter panels: distance from Jupiter, Io position, readings change in six hours: D `jupiterIo`; Jupiter's missing texture stated, Io's Horizons source and 0.0994 m: D `demoPlanets` "states Jupiter's missing texture and Io's source and the fits' figure".
- J9 tagged places on the four moons (all shown from some side, facing side only, named on hover, opened on press with description and details, selected while open, 44 px target, name fits, no collision): D `demoPlanets` "carries the tagged places of the four mapped moons only, each with its name, description and details, shown as Reconstructed"; `featureMarkers` "shows the near side at the middle of the screen and hides the far side", "names the place, its kind and body, its description and details, and carries the provenance"; `planetDefinition` "the planet places rule (I-048)"; layout: O.

browser-moon-panel.mjs
- M1 families in data order with live counts; summary states total and list date: D `domMoonPanel` "lists every family in the data's order, each heading carrying its live count", "states the total and the list date in its summary line"; `moonFamilyPanel` "states the total and the Horizons list date from the data, ... (I-045)".
- M2 big four on top with four pictures: D `domMoonPanel` "shows the big four on top with four pictures".
- M3 family opens to its plain description, named moons first, unnamed folded into a count, rows 44 px on a phone: D `domMoonPanel` "opens a family to its plain description, named moons first and the rest folded into a count"; `moonFamilyPanel` "puts named moons first and folds provisional designations apart"; 44 px rows: CSS / O.
- M4 opening a family lights exactly its moons in the scene, another moves the light, closing clears: D `domMoonPanel` "lights a family when it opens, moves the light to another, and clears it when the lit one closes"; `moonFamilyPanel` "brightens only the lit family's orbit lines, by a live setting, unless a family gain is set"; the lit dots: S.
- M5 tapping a moon focuses the camera and opens information with family, size, discovery, sources, list date; Jupiter's information states the total: D `domMoonPanel` "hands a pressed moon to the shell, which focuses it and opens its information"; `moonFamilyPanel` "makes every listed moon an object the shell can select, with family, size, discovery and sources in its information", "states a moon's facts from the data"; the flight: S.
- M6 search by name and designation as typed, nothing listed for a non-match, a found moon flies to it: D `domMoonPanel` "finds a moon by name and by designation as it is typed, and says when nothing matches"; `moonFamilyPanel` "searches by name or designation as the viewer types, ignoring case and punctuation".
- M7 no two panels overlap and all on screen at four sizes, moons sheet and information never together: O for the overlap; the exclusivity: `AstraeusShell` sets info and story closed when moons open (read, not asserted by a new case): S.

browser-jupiter-tap.mjs
- T1 first tap on a small moon's dot picks it; listed moon focused through the picker, unlisted keeps the list's choice; information sheet stays shut: D `scenePicking` "pickTarget" cases and `clickOpensInfo`; the unlisted-moon list rule: `moonFamilyPanel` ("makes every listed moon an object the shell can select ..."); the pointer path: S.

browser-outer-planets.mjs
- O1 the switch offers the four outer planets: D `planetChoice` "lists every planet and opens the requested one in a local build"; `planetSystems` "builds its view from its settings file and system alone" (four cases).
- O2 switching Jupiter to Saturn keeps the clock time: D `planetSystems` "the switch keeps the clock time for planets, and the camera view is the new planet's own" and "the switch carries the clock's time now, not the time the address was opened with (I-051)".
- O3 Saturn rings at the fact sheet's radii and bands the data file's; moon families listed: D `demoPlanets` "Saturn draws its ring bands at the fact sheet's radii and lists its moon families in the data's order"; drawn: S.
- O4 places on Titan and Charon open their information: D `demoPlanets` "puts a tagged place on Titan and on Charon, with the name and description the information shows"; `planetSystems` "shows its own surface places by the planet places rule ..."; opening on press: S.
- O5 Pluto draws Pluto and Charon as spheres: D `demoPlanets` "Pluto's view mounts Pluto and Charon, ..."; `plutoOrbitLines`, `planetOpeningFraming` "Pluto opens with Pluto and Charon in view at phone and desktop aspect".
- O6 Uranus draws its rings and every moon as a dot, no mapped moon: D `demoPlanets` (same case); `planetSystems` "a planet with no mapped moon (Uranus) builds with only the planet's presets".

browser-planet-switch.mjs
- X1 switch lists Mercury to Mars, Mercury open: D `planetChoice` "lists every planet ..."; `planetSwitchInner` "open on their own planet with its own objects".
- X2 Mars's view lists Mars, Phobos, Deimos: D `planetSwitchInner` (same case) and `demoPlanets` "Mars's view lists Mars, Phobos and Deimos and shows only Mars's own places, ...".
- X3 only Mars's own places show; tagged place opens with its name and "Reconstructed"; no marker overlaps a panel: D `planetSwitchInner` "carry the tagged places of the existing packages untouched (...)", `demoPlanets` (same Mars case); on screen and overlap: S / O.

browser-story-panels.mjs, demo parts (generic part: T-143, `domStory`)
- SP1 Apollo: seven panels in mission order on their anchors and objects, sourced, Observed; each opens in order as playback reaches it: D `storyPanels` "gives the first demo story seven sourced panels, in mission order, that sit on its own anchors and objects"; `domDemoStories` "Apollo 11 story panels" (marker per panel; each panel with badge, body, sources, one fold); order on playback is generic: `storyPanels` "opens a panel when playing time crosses it", `domStory` "opens the panels in time order as playback reaches each, one at a time".
- SP2 Apollo scene marker on Eagle shared by every panel naming it (I-031): D `storyMarkers` "draws one marker per object, carrying every panel that names it in time order", "reaches every panel on the object from the scene: each press moves to the next, wrapping round", "never stack two markers on one object, and every Apollo 11 panel has a scene marker".
- SP3 Apollo phone shots of longer panels: O (no screenshots by rule); the phone sheet's behaviour: `domPhone` "a story panel on a phone".
- SP4 Perseids: a marker per panel, panels carried by the shower file open in order with badge, source line and details: D `domDemoStories` "Perseids story panels"; `showers` "lets any shower file carry inline panels with no code, resolving event times and objects", "reads a panels file by the path the settings name"; `storyStoriesAllDemos` ("carries three sourced panels, in time order, on its own objects and inside its own timeline").
- SP5 Geminids, Earth–Moon and Jupiter–Io stories (T-089): three sourced panels each in time order, badge, one folded section of details: D `storyStoriesAllDemos` (three cases per demo), `domDemoStories` ("Geminids story panels", "Jupiter story panels"), `storyPanels` "warm, plain words with every figure kept in details (T-088 Done When 2-4)" cases.
- SP6 Geminids activity view (span=activity) keeps the two December panels and leaves out the Phaethon one: D `storyStoriesAllDemos` "opens the Geminids Earth panel at the shower's peak, and keeps the two December panels in the narrowed (activity) view"; `showers` "leaves out panels outside a narrowed (activity) span without throwing, but still rejects ones outside the full year".
- SP7 live story settings sliders in Developer: S (generic part: `domStory` for the two settings).

Carried over from T-144: item 42 (Sun label off in Perseids, still selectable) is D `demoShowers` / `demoRules` (above); item 43 (no stray Sun in other demos) is D `demoRules` "%s mounts no Sun and lists none" (Apollo, Jupiter, Mercury, Venus, Earth, Mars) with the per-shower body lists in `demoShowers` W1; item 53 per-demo marker rule is D `demoRules` "each mounted body has a drawn size, a marker far off and a sphere close up" (both showers, Apollo, Jupiter and four inner planets); the rule itself `bodyMarkers`. From T-143: G15 (Geminids activity view) is SP6.

**Summary.** About 120 scenario lines over the 11 scripts; every one is mapped to a fast test, S (smoke check), O (owner's look), or J (the two journeys). None unmapped. One weaker mapping the Full Check may want to look at: M7 (the exclusivity of the moons sheet and the information panel is a shell rule in `AstraeusShell.tsx` that I read but did not add a case for; it needs the app holding the lit family). Several rows name a test file without a case where the file as a whole covers the row (`viewUp`, `startCamera`, `publicBuild`, `moonOrbits`, `core`, `clickOpensInfo`).

Needed Issues or Tasks: none.

Marked done by the coordinator at 2026-10-22T20:32:21Z on the owner's authority (2026-10-23, asked "Should I mark each step finished as it passes its tests": "I mark them as they pass"). Merged to o038-browser-checks as 9a450717; combined run there: `npm test` 110 files, 1499 passed, 1 skipped, 30.3 s. Row M7 (moons sheet and info panel never together) is file-level only; handed to T-147 to prove with a case or map explicitly.

## Drift Notes

None. The demo tests only read what the builders and data files make; nothing in `src/` changed.
