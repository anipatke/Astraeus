---
id: T-327
title: Show the new bar in the site's demos
objective: O-079
status: in_progress
stage: audit
depends_on: [{task: T-332, requires: clear}]
check_waiver: {task: T-327, reason: 'Owner said "orchestrate 79": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o079-20261121}, recorded_at: '2026-11-21T00:35:01Z'}
owner_validation: {required: true}
planned_by: {role: planner, session: plan-g023-20261121}
---

# Show the new bar in the site's demos

## Outcome

Every demo on the site sets an About from its existing name and credits, so the owner can judge the one bar and About on desktop and phone at localhost:5490; Design.md describes the bar, About and phone row as built.

## User Check

On localhost:5490, open each demo at 1280×720 and 375×667: the bar shows the demo's title (or "i" on a tight phone row), the switch tabs and the menu; About lists the demo's credits and ends with "Built with Astraeus" and the version; nothing overlaps. The owner records the result.

## Done When

Each demo calls `setAbout` with its title, a short title where the full one is long, and its credits with source links taken from the existing credit records (one source of truth, no copied text where a record can be read); a site test asserts each demo has an About; the browser journeys pass at both sizes under the browser policy; Design.md is reconciled for every drift note from T-328, T-330, T-326, T-329, T-331 and T-325 (each reflected or marked non-architectural with a reason) before the Full Objective Check; owner validation recorded. Apply `docs/agents/verification.md`.

## Context Files

- `.savepoint/objectives/O-079-one-bar-with-title-and-about/Objective.md`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-325-give-the-bar-a-title-that-opens-about.md` under `Drift Notes`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-326-put-the-phone-s-controls-in-one-bar-row.md` under `Drift Notes`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-329-place-every-panel-by-one-rule.md` under `Drift Notes`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-330-set-up-the-screen-areas-and-one-shared-look.md` under `Drift Notes`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-331-rebuild-the-timeline-on-the-new-layout.md` under `Drift Notes`
- `docs/architecture/viewer-interface.md`
- `.savepoint/Design.md` under `Components/Codebase Map`
- `.savepoint/Design.md` under `Host-page behaviour`
- `packages/astraeus-site/src/main.tsx`
- `packages/astraeus-site/src/pageTitle.ts`
- `packages/astraeus-site/tools/site/package-credits.mjs`
- `packages/astraeus-site/tools/validate/journey-planets-phone.mjs`
- `docs/agents/browser-policy.md`

## Design References

Design "Components/Codebase Map" (site row), "Host-page behaviour", "Public API shape (G-016, owner 2026-11-01)" (use the front door ourselves).

## Guardrails

ARCH-01, PROV-01, API-01, TEST-01, TEST-03, STYLE-07, STYLE-09.

## Implementation Plan

1. Find where each demo's name and credits already live (page title, package credits); build each demo's About from them in the site, not in the engine (story data never bundled into the engine).
2. Call `setAbout` on every demo scene in `main.tsx`; add short titles where the full name would crowd the phone row.
3. Site test: every demo scene has an About with at least one credit.
4. Run the browser journeys at 1280×720 and 375×667, one browser job at a time.
5. Reconcile Design.md (bar, About, phone row, short labels, any embedded finding) and the decision note from the drift notes of T-330, T-326, T-329, T-331, T-325 and T-332, and confirm the old stylesheets and placement code are gone and the contributor guide matches the code.
6. Ask the owner to judge the demos on localhost:5490 and record the result.

## Boundaries

No engine changes beyond fixes the demos reveal (report them; return REPLAN REQUIRED if they are material), no outside apps, no version bump.

## Technical Verification

Configured gates, the site tests and the browser journeys under the browser policy; owner validation on localhost:5490. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Builder session orchestrate-o079-20261121 (Opus, coordinator-dispatched), 2026-11-21. Started at `stage: build`; no browser runs (the coordinator runs the preview and the one browser check at the Full Check).

### Extra reads (beyond Context Files)

- `agent-skills/savepoint-task/SKILL.md`, `docs/agents/verification.md` (skill Read section).
- Drift Notes of T-328 and T-332 (named by the coordinator as part of this reconciliation; T-332 depends on this Task's reconciliation).
- `.savepoint/Design.md` "Good guest" and "Public API shape (G-016, owner 2026-11-01)" (Design Reference; Good guest (5) and (6) describe replaced behaviour: `useDrawers`, `shell/style.css`, `--ui-*`). Design lines found by `grep` for replaced names (pill, `useDrawers`, `--timeline-space`, `shell/style.css`, `--ui-`).
- `packages/astraeus/README.md` "Interface modules" (contributor-guide pointer the Task asks to confirm).
- `packages/astraeus/src/api/aboutInput.ts`, `src/api/sceneReads.ts` (`SceneBodyRead.texture`), `src/assets/licence.ts`, `src/api/data.ts` (`DataSource.pictures`), `packages/astraeus-data/src/pictures.ts` head, `src/core/provenance.ts`: to find the credit records a scene exposes.
- `packages/astraeus-demo-*/credits/CREDITS.md`, `packages/astraeus-site/tests/{assetsPageCredits,demoScenes,storyStoriesAllDemos,syntheticScenes,demoRules,pageTitle}.test.ts` heads: how demos are built in site tests.
- Fact checks by `grep` for the Design and note text: `shell/panels/panelRule.ts` `PanelState`, `usePanels.ts` signature, `areas/screen.ts` header, `areas/Area.tsx`, `look/look.css` layers, `app/FeatureMarkers.ts` `FEATURE_OCCLUDER_SELECTOR`, `app/style.css` imports, `phoneLayout.ts`, `parts/timeline/timeline.css` container rule.
- Not read: `tools/validate/journey-planets-phone.mjs` and `docs/agents/browser-policy.md` (no browser run in this session; the journeys are the coordinator's).

### Part A: demos

- `packages/astraeus-site/src/demoAbout.ts` (new): `demoAbout({ scene, data, label, shortLabel?, credits? })` returns the About. Title: the demo's label, the same value `pageTitle` reads (product name "Astraeus" from `PAGE_TITLE` when the scene declares none: the made-up scenes). `shortTitle`: the short label when it differs. Credits, deduplicated by text: (1) the demo package's own credit lines from its `credits/CREDITS.md` text (each `- ` line, its trailing `<url>` as the link); (2) the licence record of every picture the viewer can draw for the scene: `Scene.bodies[].texture.licence`, else the `DataSource.pictures[<body id>]` record, then the data's `milky-way` picture; text is the record's `attribution` (the credit line the licence asks for) else `source, licence`, url is the record's `url`. No title or credit text is written in the site.
- `packages/astraeus-site/src/main.tsx`: `Built` gains `shortLabel` and `credits`; each demo branch loads its package's credit file through the package's declared entry, beside its other chunks (`import("astraeus-demo-<name>/credits/CREDITS.md?raw")`, so a demo downloads only its own), and planets pass `shortLabel: settings.label` (e.g. "Jupiter and Io" / "Jupiter"); `show()` calls `built.scene.setAbout(demoAbout(built))` before `mount`, so every scene the site mounts (made-up dev scenes included) has an About.
- `packages/astraeus-demo-{apollo11,planets,showers}/package.json`: `exports` gains `"./credits/*": "./credits/*"`. A first version globbed `../../astraeus-demo-*/credits/CREDITS.md`, which `packageBoundaries.test.ts` (ARCH-03) rightly refused (only `data/*` globs into a demo); the declared entry is the package-boundary way, so no boundary rule was relaxed.
- `packages/astraeus-demo-{apollo11,planets,showers}/credits/CREDITS.md`: each credit line gains its source link (`<https://...>`), taken from the existing records: Apollo mission report NTRS 19700008096 (the citation the Apollo provenance names), Planetary Explorer (planetary-explorer.anipatke.com, named in the line), GMN `globalmeteornetwork.org/data/`, IAU MDC and AMS calendar URLs from the showers' provenance records. Header line says the site reads these lines. Story data stays in the demo packages; nothing in the engine changed.
- Test `packages/astraeus-site/tests/demoAbout.test.ts` (new, 5 cases): every demo built with the entry's builders (Apollo, every `data/planets/*.json`, every `data/showers/*.json`, and the eight made-up scenes built without a fetch) gets a title equal to its label (or "Astraeus") and at least one credit, every link http(s), and `scene.setAbout` accepts it and reads it back; the entry source calls `built.scene.setAbout(demoAbout(built))` and loads each package's credit file into `credits`; demos are built once (`beforeAll`, 60 s; building every planet three times overran the 5 s default in the full run); Jupiter's short title is "Jupiter", Mercury has none; the package lines come first word for word and every package line has an https link; Earth's picture credit is its record's attribution and url. `synthetic-journey` is not built in the test (it needs `journeyData`), but it goes through the same `show()` call.
- Provenance `sources` were tried as credits and rejected: they are per-panel citations (20+ long lines for Apollo), already shown in each panel and card.

### Part B: Design reconciliation

| Drift note | Outcome |
|---|---|
| T-328 build order | Non-architectural: the order was applied (owner confirmation) and the note's §8 records it. |
| T-328 new public names | Reflected for O-079's names (`setAbout`, `scene.about`, `handle.about`/`setAbout`, `bad-about`, `shortLabel`, `LookInput.interface`) in Design "Viewer interface" (About, Look). `addParts`, `handle.part`, `bad-part` are O-080's and not built: non-architectural here, Design gains them when O-080 builds them. |
| T-330 1 extra tokens/layers | Note §3 "As built" lists them; T-332 2 removed `-sheet`. Internal values, not architecture (Design names the look module only). |
| T-330 2 `data-phone` kept | Reflected: Design "Viewer interface" (Areas, Kept on purpose); note §2 as built. |
| T-330 3 screen fallback | Reflected: Design Areas; note §2 as built. |
| T-330 4 44 px through `data-phone` | Note §2 as built. Non-architectural (a sizing detail). |
| T-330 5 embedded tokens | Note §2 "Embedded viewers" as built. Non-architectural. |
| T-330 6 drift check scope | Note §9 drift check (cqw/cqh, `@container` not scanned); the `dvh` caps moved to `cqh` (T-332 4), reflected in Design Host-page behaviour. |
| T-330 7 containers | Reflected: Design Areas (`astraeus-viewer`, `astraeus-timeline`, `astraeus-developer`); note §2. |
| T-330 8 areas unused yet / window timeline space | Superseded: T-329/T-326 occupy the areas; T-331 removed the measure. Reflected in Design Areas ("nothing measures the timeline"). |
| T-330 9 `PHONE_QUERY` re-export, `animationMs` | Non-architectural: a test-import convenience; `PhoneLayoutSettings.animationMs` still exists as the Developer slider field, fed from `interface.motionMs` (one value, `--astraeus-motion`). |
| T-330 10 radii | Note §3 as built. Non-architectural (look detail). |
| T-330 11 CHANGELOG | Non-architectural: the coordinator opened the 0.9.5 section. |
| T-329 1 panel modules, `PopupContext`, standalone | Reflected: Design map and "Viewer interface" (Panels); note §5 and §9. |
| T-329 2 mirrors | Reflected: Design Panels; note §5 as built. |
| T-329 3 render by wide area name, no `sheet` element | Note §2 as built. Non-architectural beyond Design's phone grid line. |
| T-329 4 Developer no Escape | Note §5 as built. Non-architectural (unchanged behaviour). |
| T-329 5 cog in bar area temporarily | Superseded by T-326 (cog in the bar row, `DeveloperToggle.tsx`, in the Design map). |
| T-329 6 `--timeline-space` row | Superseded by T-331 1; reflected (Design Areas, Host-page behaviour). |
| T-329 7 layers | Superseded by T-332 2; note §3 as built. |
| T-329 8 events list as `details` pop-up | Non-architectural: an implementation of "one pop-up" through the rule. |
| T-329 9 `dvh` caps | Superseded by T-332 4 (`cqh`); reflected in Design Host-page behaviour. |
| T-329 10 embedded padding | Non-architectural (styling). |
| T-329 11 not done: view switch story drop, shelf | Note §5 as built (still derived in `useStoryPanels`); shelf is O-080. |
| T-326 1 bar modules | Reflected: Design map and Bar; note §9 tree. |
| T-326 2 title place phone only | Superseded by T-325 5; the final rule (wide bar no title without an About) reflected in Design About and note §4 as built. |
| T-326 3 ghost measuring | Reflected briefly in Design Bar ("measured on a hidden ghost row"); note §4 as built. |
| T-326 4 compact switch native select | Reflected: Design Bar; note §4 as built. |
| T-326 5 outside press closes wide ⋯ | Reflected: Design Panels close table; note §4 as built. |
| T-326 6 menu in the grid | Non-architectural (CSS placement inside the `menu` area). |
| T-326 7 priorities | Note §4 as built. Non-architectural. |
| T-326 8 `data-phone` | As T-330 2. |
| T-326 9 occluder list | Reflected as deliberate: Design "Kept on purpose"; note §1 marks the `[data-area]` selector not done in O-079. |
| T-326 10 embedded | Non-architectural (styling). |
| T-326 11 worked totals off by one gap | Fixed in note §4: 1280 total 1180 (11 items, 10 gaps), with Developer 1222; 768 steps 928, 886, 844, 692. Conclusions unchanged. |
| T-326 12 pack size | Superseded by T-332 (owner decisions); engine 9.47 MB. Non-architectural. |
| T-331 1 no timeline space | Reflected: Design Areas and Host-page behaviour. |
| T-331 2 phone grid, caps | Reflected: Design Areas (phone grid); caps `cqh` (T-332 4). |
| T-331 3 container breakpoint | Reflected: 876 px (coordinator), Design Areas and note §2 as built. |
| T-331 4 embedded phone margin | Non-architectural (styling). |
| T-331 5 layer leftovers | Superseded by T-332 2. |
| T-331 6 not changed: occluders, `data-phone`, `data-timeline-hidden` | Occluders and `data-phone` reflected (Kept on purpose); `data-timeline-hidden` non-architectural (test hook kept). |
| T-325 1 About modules | Reflected: Design map and About; note §9 tree (About panel flat in `shell/`). |
| T-325 2 definition and link | Reflected: Design About (`ViewerPort.aboutNow`/`watchAbout`, link holds the live About). |
| T-325 3 `AboutRead` dropped | Reflected: Design About (frozen copy); note §7 code block and as-built line. |
| T-325 4 panel rule `about` occupant | Reflected: Design Panels; note §5 as built. |
| T-325 5 title place button | Reflected: Design About; note §4 as built. |
| T-325 6 panel reuses `info-panel` classes | Non-architectural (styling reuse; occluder list applies unchanged). |
| T-325 7 version JSON import | Reflected: Design About (`app/engineVersion.ts`). Bundling detail non-architectural. |
| T-325 8 not done: site demos | Done in this Task (Part A). |
| T-325 coordinator: wide bar no title without About | Reflected: Design About; note §4 as built. |
| T-332 1 stylesheet layout | Reflected: Design map; note §9 tree as built, with the per-part split recorded as not done. |
| T-332 2 layers | Note §3 as built. |
| T-332 3 blur | Note §3 as built. Non-architectural. |
| T-332 4 phone limits `cqh` | Reflected: Design Host-page behaviour; note §2 as built. |
| T-332 5 leftover check | Reflected: Design Look; note §9 "Add styles"; README Interface modules. |
| T-332 6 one stylesheet entry | Reflected: Design map, Good guest (6), Look; note §9 tree and "Add styles"; README. |
| T-332 7 API page `ownMembers` | Non-architectural: a site tool rendering rule. |
| T-332 8 dead classes, `journeyProgressMetric` | Non-architectural; reconciliation history is history and was not edited. |

Design.md headings changed: "Components/Codebase Map" (engine row `src/shell/` and About modules; site row `demoAbout.ts`), "Good guest" ((5) `useDrawers` → `usePanels`; (6) one stylesheet entry, `--astraeus-*`), "Host-page behaviour" (layout from the viewer, `cqh` limits, no timeline measure), new "Viewer interface" (areas, look, bar, panels, About, kept on purpose), linking the note.

`docs/architecture/viewer-interface.md`: status line (confirmed and built); §1 occluder row (not done); §2 `data-phone`, as built (fallback, phone grid, `auto` row, containers, 876 px, `cqh`, 44 px), embedded as built; §3 extra tokens; §4 as built (title rule, native select, entries, ghost row, outside press) and corrected wide totals; §5 as built (`PopupContext`, standalone, mirrors, `about`, view-switch story drop); §7 `AboutRead` dropped; §9 tree as built (`app/style.css` entry, flat parts, `selection/` and per-part split not done), "Add styles", drift-check units.

`packages/astraeus/README.md` "Interface modules": the panel rule exists (`shell/panels/`), the one stylesheet entry and leftover check, the title place with About and a wide bar's title.

Old code gone (grep over `packages/astraeus/src`, no hits): `TopBar.css`, `shell/style.css`, `TimelineBar.css`, `TopBar`, `useDrawers`, `useTimelineSpace`, `usePhone`, `controls-pill`, `--timeline-space`, `--shell-timeline-space`, `var(--ui-`, `shell-top`, `layer-sheet`; no `.css` file directly under `src/shell/`; the only CSS imports are `api/mount.ts` and `api/AstraeusScene.tsx` → `app/style.css`, which `@import`s `look`, `areas`, `parts/timeline`, `bar`, `parts/{controls,parts,phone,embedded}`. Remaining `window.innerWidth/innerHeight` reads are the camera drag gestures (`app/CameraController.tsx`) and texture size choice (`app/bodyDraw.ts`), not interface placement. `@media` only in `areas.css`; `@container` in `timeline.css` (876 px) and `app/style.css` (developer 700 px). `ControlsDrawer.tsx` remains as the phone menu drawer's container (used by `BarMenu.tsx`), not the old pill.

### Commands (final run, after the last code change)

`npm run lint` 0; `npm run typecheck` 0; `npm run build` 0; `npm test` 0 (279 files, 4331 passed, 2 skipped); `npm run check:engine-alone` 0; `npm run check:pack` 0 (engine packed 7.32 MB, unpacked 9.47 MB, limit 9.5). API reference page `dist/api/index.html` 42,577 B gzip (cap 46,000; no public API change in this Task). Earlier run: `npm test` failed twice (boundary glob, test timeout), both fixed as above.

### Done When

| Criterion | Outcome |
|---|---|
| Each demo calls `setAbout` with its title | Met: `show()` sets `demoAbout(built)` on every mounted scene; `demoAbout.test.ts` over Apollo, nine planets, two showers and eight made-up scenes. |
| A short title where the full one is long | Met: planets give the planet name ("Jupiter and Io" → "Jupiter", "Mars, Phobos and Deimos" → "Mars"); Apollo 11, Perseids, Geminids, Mercury, Venus have short titles already. |
| Credits with source links from the existing credit records, no copied text | Met: package `credits/CREDITS.md` lines (now carrying their links) and picture licence records read through `Scene.bodies` and `DataSource.pictures`; no credit or title text in the site. |
| A site test asserts each demo has an About | Met: `packages/astraeus-site/tests/demoAbout.test.ts` (5 cases). |
| Browser journeys pass at both sizes | Pending, coordinator (no browser runs in this builder session by instruction). |
| Design.md reconciled for every drift note (T-328, T-330, T-329, T-326, T-331, T-325, T-332) | Met: table above; Design headings and note sections listed. |
| Old stylesheets and placement code gone; contributor guide matches | Met: grep evidence above; note §9 and README "Interface modules" updated to the code. |
| Owner validation recorded | Pending, coordinator. |

### Limitations

- No browser run: the About's look on 375×667 and 1280×720 (long credit lines such as the Milky Way and Planetary Explorer records in the panel) is unseen; the owner judges it on localhost:5490.
- The made-up dev scenes have no title of their own and show "Astraeus" (the page heading's fallback); their credits are picture records only.
- The engine's star catalogue credit (HYG) is not in any demo's About: it is not exposed through the public API; "Built with Astraeus" stands for the engine.
- Deviations left open in the note, for a later Objective: the `[data-area]` occluder selector, the `selection/` folder and the per-part folder split.

## Drift Notes

This Task is the deferred Design reconciliation point for T-330, T-326, T-329, T-331, T-325 and T-332 (AGENTS.md project rule).
