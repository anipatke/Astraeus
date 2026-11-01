# Astraeus public API review (before 0.8.0)

Opus reviewer, read-only, main at 7df927dd, 2026-11-01. Paths under `packages/astraeus/src/` unless stated. Probes `reload.test.ts` (F1) and `stateof.test.ts` (F6) were throwaway scratch files, not kept. Owner decisions on D1–D10 and the resulting plan: Goal G-016 and the principles in `.savepoint/Design.md` (Decisions) and `.savepoint/Guardrails.md` (Public API).

## Verdict

The core is sound: building a scene and showing it with `mount` is a small, general, well-checked API whose words are about space, not probes. Three things stand between it and "modular and consumable": (1) two viewers can't safely share a page (moon data loads once per page, F1 verified; stylesheet restyles the host's html/body; fixed element ids); (2) the two embedding paths have drifted (React can't do what mount can, I-130; start/stop errors uneven); (3) nobody has owned the API's grammar (units, spellings, time forms, add vs set differ; looks, numbers-without-a-viewer and rich plug-in features only reachable through internals or the address). No rewrite needed: written rules, checks that enforce them, about five chunks of 0.8.0 work.

## Inventory (summary)

`astraeus` root: 39 values (Scene, SceneCamera, mount, AstraeusScene, SceneError, 26 body handles, listedMoons, three scales, two accuracy constants, classifyPositionError, parseElementsBodyRecord), ~45 types. Scene: addBody, addBodyFromElements, addTrajectory, addGroup, addActivity, addEvents, addStoryPanels, setTime, setScale, setTimeline, setSwitches, setViews, stateOf, provenanceOf (+ public-in-practice missingData, toDefinition); scene.camera follow/lookAt/setReach/fitOrbit + getters. Handle: ready, unmount, time, rate, view, camera, eventZones, setTime, setRate, setView, setCamera, onChange, onEventZone. MountOptions data/onChange/address. AstraeusScene props scene, data, onReady, onError, time, rate, view, camera, onChange, onEventZone, address, className, style. 21 error codes (errors.ts:2). Published exports: `.` and `./style.css` only (matches README). Planets demo makes 65 deep imports; site draws internal App.

## Proposed principles ([D] Design.md, [G] Guardrails API-0x)

1. [G API-01] One front door: everything a host can do via the root import; no public type exposes an internal one. Violations: toDefinition returns internal ExperienceDefinition (scene.ts:781), missingData (774), SceneCamera ctor (186), RateSource unreachable, LineStretchInput/BodyId/ViewPlace/DisplaySwitchPlace not exported; node-consumer asserts internal fields. Check: API-surface lock (collectExports in astraeus-site/tools/site/api-reference.mjs) + reachable-type rule.
2. [G API-02] Same abilities on both embedding paths (one handle type). Violation: AstraeusScene has no handle/ref (I-130). Check: type test handle == Omit<MountedScene,"ready"|"unmount">; shared lifecycle suite on both paths.
3. [G API-03] Each viewer keeps its own state: no page-wide caches that skip loading, no fixed DOM ids, no styles outside the viewer root. Violations: core/bodies/moonSystem.ts:222-229, assets/pictures.ts:14, core/planetSeries.ts:25-27, app/style.css:1,16-25, 18 fixed ids (e.g. shell/AstraeusShell.tsx:414). Check: two-viewer DOM test; ban `id="` literals; CSS selector root-class test; module-level `let` allowlist.
4. [D] Verb grammar: add* appends (repeat id → duplicate-id), set* replaces, on* subscribes and returns stop, reads are properties. Violations: addStoryPanels replaces (scene.ts:445), setSwitches merges (464), repeated addActivity throws bad-activity (410). Check: table-driven call-twice test.
5. [G API-04] One word, one unit, one shape: unit in name unless unitless; `center` only; spans `{start,end}`; moments accept TimeInput; frame field `plane` with one default. Violations: MoonPositions.centre (data.ts:12), pacing {from,to} (story.ts:44), bare seconds within/ramp (45) vs refillAfterMs (group.ts:70), bare Earth radii (scene.ts:150-156, viewerLink.ts:46), panel at.utc ISO-Z only (shell/storyPanels.ts:76), paths default EQJ (scene.ts:126) vs groups ecliptic-j2000 (group.ts:58), elements record says `frame`. Check: public-type lint with shrinking allowlist.
6. [G API-05] Typed inputs, checked early: no unknown/any in public inputs; shape errors throw at the call. Violation: StoryPanelsInput.panels unknown[] (story.ts:77), checked at mount. Check: type lint.
7. [G API-06] Errors: only SceneError from src/api; one code one cause; own code for not-ready; never match message text; README error table generated. Violations: missing-data has three causes (scene.ts:647, 501, viewerLink.ts:242); data.ts:37 RangeError; scene.ts:501 startsWith on message naming non-public loadPlanetSeries(). Check: plain-throw scan; README table sync test.
8. [D] Lifecycle contract: build faults throw at mount; load faults reject ready; ready always settles; after unmount calls throw and callbacks stop; a throwing listener doesn't stop others; a mounted Scene is frozen. Violations: C-136 O1 (mount.ts:76 vs viewerLink.ts:93-97), O2 (AstraeusScene.tsx:60, viewerLink.ts:97), O5 (viewerLink.ts:227,238); post-mount edits silently ignored. Check: shared lifecycle suite.
9. [D] Engine signals, host decides, each signal stands alone. Violations: event zones only via pacing near rules (viewerLink.ts:201-203); no selection signal, camera-change signal, playing read, play/pause. Review only.
10. [G API-07] Looks and viewer controls are public settings with defaults; the address only overrides. Violations: marker/feature size, star/Milky Way brightness, Sun glow, load fade only via address (app/bodyDraw.ts:53-55) or Developer drawer; sky, desktopTextures, bodySets, sceneCenter only on internal definition (app/experienceDefinition.ts:175,180,218,220); Developer cog always shown (shell/TopBar.tsx:67). Check: every address setting maps to a public key; every key has a default.
11. [G, extends ARCH-01] No story data in the engine catalogue: Sun, planets, dwarf planets, moons only. Violation: Swift-Tuttle built in (core/bodies/swiftTuttle.ts; assets/catalogue.ts:142), used by Perseids demo. Check: catalogue kind test.
12. [D] Numbers work without a viewer: one public await, then stateOf/provenanceOf for any body incl. moons. Violation (verified): cold stateOf("jupiter") throws missing-data naming non-public loadPlanetSeries(); vitest.setup.ts preload hides it. Check: cold-start node-consumer test; one public-API test file without preload.
13. [G API-08] Honest versions and docs: peer ranges state what was tested; data packages require the engine minor they were built with; API changes update lock + CHANGELOG; README tables checked against types. Violations: data peers `>=0.1.0 <1.0.0` (e.g. astraeus-data-saturn/package.json:20); "0.2 preview" banners (README.md:5, api/index.ts:1, package.json); stale React style.css note (AstraeusScene.tsx:2 imports it); README omits address (C-136 O4); camera doc comments wrong (C-136 O3). Check: check:pack peer floor; README sync test.
14. [D] Use the front door ourselves: demos on public API; deep imports on a shrinking allowlist. Violations: planets demo 65 deep imports; site draws App. Check: extend astraeus-site/tests/packageBoundaries.test.ts with per-package counts that may only go down.

## Findings (ranked)

- F1 High, verified: moon data loads once per page (moonSystem.ts:221-229); a second scene/React rebuild gets missing chunks. Fix: incremental chunk loading + load-twice test. Non-breaking, S–M. P3.
- F2 High: React parity (I-130) + StrictMode close() early onReady (C-136 O2). Fix: AstraeusSceneHandle = Omit<MountedScene,"ready"|"unmount"> via ref and onReady(handle); keep props; fix StrictMode; hello-react restores camera. Non-breaking, M. P2, P8.
- F3 High: style.css restyles :root/html/body/#app (app/style.css:1-25), ~95 generic class rules, 18 fixed ids, Developer cog unhideable. Fix: scope under one root class, drop html/body/#app rules, useId, `developerTools` option hidden by default (site true). Behaviour change, M. P3, P10.
- F4 High: mixed units/spellings/spans/time forms/plane defaults; lookAt vs focus; views split paths/bodies over one id space. Fix with one-minor aliases: MoonPositions.center, pacing {start,end}, panel at.time: TimeInput, camera.focus(), views `objects`, withinSeconds/rampSeconds; CameraPose.distance stays. Breaking softened by aliases, M. P5.
- F5 Med-High: story panels unknown[], checked at mount, badge/sources instead of Provenance, addStoryPanels replaces. Fix: StoryPanelInput type, check at call, accept provenance, append semantics, parser into api/ or core/. Breaking only for call-twice-replace. M. P4–6.
- F6 Med-High, verified: numbers without a viewer need internal calls (loadPlanetSeries, installData). Fix: `await scene.load({ data })`, typed internal error, cold-start tests. Non-breaking, S–M. P7, P12.
- F7 Med: internals leak via Scene (toDefinition, missingData, SceneCamera ctor, undocumented getters, RateSource). Fix: `scene.check({ data })`, toDefinition internal, SceneCamera type-only, drop/expose RateSource, consumer check on public calls. Breaking for toDefinition callers (ask Voyagers, D10). S. P1, P12.
- F8 Med: lifecycle/error contract (C-136 O1, O3, O4, O5, O7). Fix: `not-mounted` code (ready rejects after early unmount; handle calls before ready/after unmount), isolated listeners, only SceneError (data.ts:37), duplicate-id for activities, freeze Scene at mount (`scene-mounted`), doc/README fixes, sorted-key camera prop compare. Breaking (new codes), S–M. P7, P8.
- F9 Med: event zones only via pacing. Fix: EventInput.withinSeconds, pacing reuses it, onEventZone reports all zones. Non-breaking, M. P9. D4.
- F10 Med: missing host controls for non-probe apps: playing/setPlaying, selected/onSelect, camera-change signal, live scale/switch setters, readouts on addBody. Non-breaking, M. P2, P9.
- F11 Med: looks only via address/Developer drawer. Fix: scene.setLook({...}) mapped 1:1 to address settings through one table read by app/address.ts. Non-breaking, M. P10.
- F12 Med: Swift-Tuttle demo data in engine. Fix: move record to showers demo via addBodyFromElements. Breaking (addBody("swift-tuttle") gone), S. P11.
- F13 Med, longer term: second plug-in contract via internal ExperienceDefinition (experienceDefinition.ts:160-220); planets demo + site depend on it. 0.8.0: shrinking allowlist only; later move planets demo onto Scene, switchers into site. L after 0.8.0. P1, P14.
- F14 Low-Med: data peers too wide, stale banners and React style note, README lacks address and error table, React peer <19.4, no engine ./package.json export. Fix: pin data peers to engine minor + check:pack, docs, D7, export ./package.json. S. P13.
- F15 Low, internal: Scene one 1,048-line class; src/api imports app/ 21×, shell/ 5×; ViewerLink four jobs. After 0.8.0: per-concern planners + assembler; parsers into api/core. L. P1, P6.

Probe-shaped? Mostly not. Small leftovers: readouts only on trajectories, zoom-out widening for Sun-centred paths, both examples probe stories, internal names like spacecraftRangeMetric. Suggest a third, non-probe example (planet tour with fitOrbit, groups, setLook) proving F10/F11.

## Suggested 0.8.0 chunks, in order

1. Rules down and enforced (S–M): principles into Design.md + Guardrails API-01..08; API-surface lock, type lint with shrinking allowlists, plain-throw ban, README sync, deep-import counts; fix O3, O4, banners, style.css note.
2. One handle, honest lifecycle (M): F2, F8, F10 playing/setPlaying + selection on both paths; shared lifecycle suite.
3. Safe in someone else's page (M): F1, F3; two-viewers test.
4. Vocabulary pass, the breaking chunk (M): F4, F5, F7, F12; one-minor aliases; one CHANGELOG migration table.
5. Headless use and settings (M): F6 (load, check), F11 (setLook), F9 if agreed, F14.
After 0.8.0: F13, F15.

Would NOT change: chained Scene builder and main names; one SceneError with stable codes; explicit data packages split per planet; pictures separate from positions; views/pacing display-only (ARCH-02); no built-in camera behaviour for zones; address off by default; time/rate/view one-way React props; one engine package; CameraPose field names.

## Open decisions (reviewer's recommendation first)

- D1 Product: (a) scene builder + full viewer + numbers without a viewer [rec]; (b) + viewer-free data entry; (c) + 3D parts for custom UIs.
- D2 Renaming: (b) listed fixes with one-minor aliases [rec]; (a) none; (c) clean break.
- D3 Group plane default: (b) make `plane` required for groups [rec]; (a) keep both; (c) switch silently (dangerous).
- D4 Event zones independent of pacing: (b) yes [rec]; (a) no.
- D5 Swift-Tuttle: (a) move to showers demo [rec]; (b) keep as sample comet.
- D6 Internal ExperienceDefinition: (a) retire over later Goals, shrinking allowlist in 0.8.0 [rec]; (b) keep two ways in.
- D7 React peer: (b) widen to <20 with CI on latest 19.x [rec]; (a) keep <19.4.
- D8 Developer drawer for outside apps: (b) hidden unless asked [rec]; (a) shown.
- D9 Several viewers per page: (a) supported [rec]; (b) documented unsupported.
- D10 Before removing toDefinition: ask the Voyagers app whether it uses it.

## Owner decisions (2026-11-01, session api-review-20261101)

D1 (a) scene builder + full viewer + numbers without a viewer. D2 (b) listed renames with aliases until 0.9.0. D3 (b) `plane` required for groups. D4 (b) event zones stand alone. D5 (a) Swift-Tuttle moves to the showers demo. D6 (a) retire the internal ExperienceDefinition way in gradually; shrinking allowlist in 0.8.0. D7 (b) React peer widened to all of 19 with a CI build on the latest 19.x. D8 (b) Developer drawer hidden unless asked. D9 (a) several viewers per page supported. D10: `toDefinition` is REMOVED in 0.8.0 (owner chose removal over a deprecation period); the Voyagers app (`/home/user/code/voyagers`, tests) and the showers app (`/home/user/code/showers`, tests and swift-tuttle by name) use it today, so 0.8.0 ships its public replacements (`scene.check`, `scene.load`, reads of what a scene holds) and a migration note. New Goal G-016 for the clean-up.
