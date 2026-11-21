---
id: T-328
title: Agree the bar and panel rules before building
objective: O-079
status: done
depends_on: []
check_waiver: {task: T-328, reason: 'Owner said "orchestrate 79": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o079-20261121}, recorded_at: '2026-11-21T00:35:01Z'}
owner_validation: {required: true}
planned_by: {role: planner, session: plan-g023-20261121}
---

# Agree the bar and panel rules before building

## Outcome

A decision note, `docs/architecture/viewer-interface.md`, that settles the reset of the whole viewer interface and the public interface for the whole of G-023, confirmed by the owner, so the build Tasks implement a design instead of discovering one.

## User Check

The owner reads the note's plain-language summary (a few sentences, one picture of the screen areas on desktop and phone, and the list of behaviour changes) and confirms it, or asks for changes.

## Done When

The note contains, each with evidence from today's code (file and line):

1. **Inventory and verdicts.** Every interface part (bar controls, object/event/window cards, story panels and steps, moons sheet, switch panel, scale explanation, controls drawer, timeline and its drawer, developer drawer and settings, panel load boundary, loading and error states the viewer owns, labels and markers where they measure interface areas) with where it sits on desktop and phone and a keep-or-rebuild verdict.
2. **Screen areas.** Named areas for desktop and phone, one description of what changes on a phone (replacing the current screen-size rules, each listed), and the embedded-viewer case.
3. **Look.** The look settings (colours, spacing, text sizes, radius, motion) with values taken from the design board's chosen layout and today's shared settings; every hand-typed colour and size mapped to a setting or dropped; which looks become public settings (API-06); the drift check (what it scans, what it allows).
4. **Bar.** The item kinds, priorities, labels and where each may live; the fit rule as a pure function of measured widths with worked cases at 360, 390, 430, 768 and 1280 px; desktop overflow.
5. **Panels.** Every panel, card, sheet and drawer mapped to an area; the close rules as one table; an inventory of every current rule it replaces.
6. **Behaviour changes.** Every deliberate change from today, for the owner.
7. **Public interface** for O-079, O-080 and O-081: inputs (About, story buttons, panels, tile), scene setters, handle reads, setters and signals, React parity, error codes, verb grammar, and the host-content mechanism (for example the engine handing the host an element to fill versus content as data) chosen with its trade-offs against Design "Good guest" and API-01..07.
8. **Build order and migration.** The order of the build Tasks (confirming or correcting this Objective's split), and the existing tests, baselines and browser-driver helpers that change, by name.
9. **Module structure and contributor guide.** The folder and module layout of the new interface (one job per module: areas, look, bar rule, panel rule, one module per part), each module's job and what it must not do, how to add a bar item or a panel, and how the drift check works; written so someone new can pick it up.
10. **Shared look.** Which look settings are public (with defaults and ranges, API-06) and how host content in panels and the tile uses them (for example documented CSS custom properties under the viewer's root class); the basic interface parts stay internal.
11. **Story-component shelf.** The first components and which Objective builds each (expected: filter chips, explainer panel, colour key and custom panel in O-080; readout tile and chart in O-081), with each one's data, events and placement; the one contract every shelf component follows (how an app picks and adds it, gives and updates its data, hears its events, its bar button and panel through the bar and panel rules, its look from the shared look); the custom panel for anything not on the shelf (this is the host-content mechanism of item 7); pick-by-import packaging (each component its own import from `astraeus`, how unused ones stay out of an app's download, and the test that proves it); Belt and Meteor Showers mapped onto the shelf as worked examples; and the public catalogue page (where it sits on the site beside the assets page, the entry format: what it is, suggested uses by story job, a live example on a synthetic scene, the import and add lines; where entry text lives so it has one source; and the test that fails when a shelf component has no entry). The basic interface parts get a short "what you get out of the box" section on the same page.

Owner confirmation recorded.

## Context Files

- `.savepoint/releases/G-023-one-bar-for-story-apps-for-0-9-5/Release.md`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/Objective.md`
- `.savepoint/objectives/O-080-story-buttons-and-panels-in-the-bar/Objective.md`
- `.savepoint/objectives/O-081-info-tile-the-app-fills/Objective.md`
- `.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)`
- `.savepoint/Design.md` under `Good guest`
- `.savepoint/Design.md` under `Host-page behaviour`
- `.savepoint/Design.md` under `Views of one scene`
- `.savepoint/Design.md` under `Headless use and looks as settings`
- `packages/astraeus/src/shell/AstraeusShell.tsx`
- `packages/astraeus/src/shell/TopBar.tsx`
- `packages/astraeus/src/shell/ObjectControls.tsx`
- `packages/astraeus/src/shell/ScaleControl.tsx`
- `packages/astraeus/src/shell/DisplaySwitches.tsx`
- `packages/astraeus/src/shell/SwitchControl.tsx`
- `packages/astraeus/src/shell/ControlsDrawer.tsx`
- `packages/astraeus/src/shell/InfoPanel.tsx`
- `packages/astraeus/src/shell/StoryPanelView.tsx`
- `packages/astraeus/src/shell/MoonFamilyPanel.tsx`
- `packages/astraeus/src/shell/useStoryPanels.ts`
- `packages/astraeus/src/shell/useDrawers.ts`
- `packages/astraeus/src/shell/phoneLayout.ts`
- `packages/astraeus/src/shell/TimelineBar.tsx`
- `packages/astraeus/src/app/PanelLoadBoundary.tsx`
- `packages/astraeus/src/shell/bootLoader.ts`
- `packages/astraeus/src/shell/style.css`
- `packages/astraeus/src/shell/controls.css`
- `packages/astraeus/src/shell/TopBar.css`
- `packages/astraeus/src/shell/TimelineBar.css`
- `packages/astraeus/src/shell/phone.css`
- `packages/astraeus/src/shell/embedded.css`
- `packages/astraeus/src/app/style.css`
- `packages/astraeus/src/app/DeveloperSettings.tsx`
- `packages/astraeus/src/app/developerPanels.tsx`
- `packages/astraeus/src/app/FeatureMarkers.ts`
- `packages/astraeus/src/api/scene.ts`
- `packages/astraeus/src/api/viewerHandle.ts`
- `packages/astraeus/src/api/look.ts`
- `packages/astraeus/src/api/pickerInput.ts`
- `packages/astraeus/src/api/views.ts`
- `packages/astraeus/src/api/story.ts`
- `packages/astraeus/src/api/errors.ts`

## Design References

Design "Public API shape (G-016, owner 2026-11-01)", "Good guest", "Host-page behaviour", "Views of one scene", "Headless use and looks as settings", "One handle, one lifecycle". Reference look: the design board's "Chosen layout — Belt with its real content" row.

## Guardrails

ARCH-01, ARCH-02, API-01, API-02, API-03, API-04, API-05, API-06, STYLE-05, STYLE-07, STYLE-09.

## Implementation Plan

1. Inventory every interface part and its placement and conditions on desktop and phone.
2. Inventory the stylesheets: colours, sizes and screen-size rules, by file and line.
3. Inventory every rule that closes one panel when another opens.
4. Draft the areas, the look settings and the drift check.
5. Draft the bar items and fit rule; work the five widths by hand.
6. Draft the panel areas and close table; list behaviour changes.
7. Draft the public interface for all three Objectives; compare host-content options; recommend one.
8. Confirm or correct the build order; list the migration.
9. Write the note with a short plain summary and one diagram; ask the owner to confirm; record the answer.

## Boundaries

A note only: no production code, no test changes. Return REPLAN REQUIRED if the inventory shows the Objective's Task split is wrong.

## Technical Verification

Reviewed by the planner before the build Tasks start; owner confirmation recorded. Evaluated later under `agent-skills/references/check-method.md` as part of the Full Objective Check.

## Technical Evidence

Extra reads (logged before reading; builder session t328-builder-20261121):

- `.savepoint/objectives/O-079-*/tasks/T-325,T-326,T-327,T-329,T-330,T-331` Outcome and Done When only: to confirm the build order (Done When 8).
- `packages/astraeus/src/shell/{Collapsible,topBarIcons,useDrawerSwipe,useSwipeToDismiss,useZoomThrough,viewerKeys}.tsx/ts` and `shell/TimelineBar.tsx` grep only: inventory of parts the listed files import (Done When 1).
- `packages/astraeus/src/api/switches.ts` header lines: switch places (Done When 4, 7).
- `packages/astraeus/package.json` `exports` and `sideEffects`; `tools/build-example.mjs`, `tools/measure-example.mjs`, `tools/look-lock.mjs` headers: pick-by-import packaging and its bundle test (Done When 11), computed-look baseline (Done When 8).
- `packages/astraeus-site/index.html` nav line and `assets.html` head: where the catalogue page sits (Done When 11).
- `packages/astraeus-site/tools/validate/driver.mjs` exported function names and HOOK lines; `grep -l` of tests naming shell classes: migration list (Done When 8).
- Outside repos, read only (coordinator brief, worked examples for Done When 11): `/home/user/code/belt/src/site/page.ts`, `src/site/influencePanel.ts`, `src/site/emptinessPanel.ts`, `data/influence.json`, `data/emptiness.json`, `data/site.json`; `/home/user/code/showers/src/site/page.ts`, `src/site/showerPicker.ts`.
- Also read for line evidence (same reason, Done When 1-3): `packages/astraeus/src/app/App.tsx` line 790 (grep for `role=`), `src/api/story.ts` lines 79-120, `.savepoint/config.yml` quality_gates, `docs/agents/verification.md`.

Files changed: `docs/architecture/viewer-interface.md` (new, the decision note); this Task (lifecycle, evidence); `O-079/Objective.md` (`planned` -> `in_progress`). No production code, test, baseline or outside-repo file changed (`git status --short`: only these plus the pre-existing untracked `docs/research/`).

Per-criterion outcome (Done When; sections of the note):

1. Inventory and verdicts: section 1, 33 parts with file:line, desktop/phone placement, keep or rebuild. Met.
2. Screen areas: section 2, nine named areas, the one phone description (`areas/screen.ts`, viewer-size based), the 17 rules it replaces (16 `@media` plus `PHONE_QUERY`), and embedded viewers. Met.
3. Look: section 3, tokens with values from the design board (panel .88, text #f0e6da, accent #e8b06a, pills, segmented tabs) and today's shared settings (`style.css:16-26`); all 60 distinct colour literals mapped by value; sizes mapped to scales; public set is in section 10; drift check is in section 9. Met. Limitation: sizes are mapped by scale rule, not as a per-occurrence table.
4. Bar: section 4, item kinds, priorities, labels and allowed places; the fit rule as a 7-step pure ladder; worked cases at 360, 390, 430 (phone) and 768, 1280 (wide) on Belt's real labels; wide overflow menu. Met. Limitation: widths are estimates (7 / 7.4 px per character); the build measures real widths.
5. Panels: section 5, place model, close-rule table (11 rows), and the inventory of 12 replaced rules. Met.
6. Behaviour changes: summary list (11 items) plus section 6 mapping each to code. Met.
7. Public interface: section 7, `setAbout`/`about`/`handle.setAbout`, `shortLabel`, `LookInput.interface`, shelf factories, `scene.addParts`, `handle.part(x)` typed controls, errors `bad-about`/`bad-part`, verb grammar, React parity; host-content options (a)/(b)/(c) compared, recommending data for shelf blocks plus element handover for `customBlock`. Met.
8. Build order and migration: section 8, with a correction: swap T-326 and T-329 (the panel rule before the bar). Not REPLAN: the split stands, only the order changes. Tests, baseline and driver helpers are listed by name. Met, pending the planner's acceptance of the order change.
9. Module structure and contributor guide: section 9. Met.
10. Shared look: section 10, public fields with defaults and ranges (API-06, no address parameter), documented `--astraeus-*` properties, basic parts internal. Met.
11. Shelf: section 11, eight parts by Objective; data, events and placement; one contract; custom panel; pick-by-import with `tools/check-shelf-split.mjs` proof and a CSS fallback; Belt and Meteor Showers worked examples; catalogue page `components.html` with the entry format, one-source text, and the `shelfCatalogue.test.ts` completeness test; an out-of-the-box section. Met.
12. Owner confirmation recorded: **pending**. The builder could not ask the owner; the coordinator relays the summary.

Commands run: `savepoint resume` (after the start edits, and after these). Configured gates not run: the change is a Markdown note and Savepoint records only, with no code, test or build input touched.

Limitations: the design board could not be opened; its values came from the coordinator brief. The owner choices listed at the end of the note are open. Line citations were checked by grep for the cited values; any remaining line drift is cosmetic.

## Drift Notes

- Build order: the note recommends T-330 -> T-329 -> T-326 -> T-331 -> T-325 -> T-327 (T-326 and T-329 swapped in `depends_on`). Planner to apply or reject; deferred to T-327's Design reconciliation if accepted.
- New public names for Design.md ("Public API shape" and a new viewer-interface section): `setAbout`, `addParts`, `handle.part`, `LookInput.interface`, `bad-about`, `bad-part`. Reconciled in T-327.

### Owner confirmation (2026-11-21T00:58:03Z, session orchestrate-o079-20261121)

Presented as artifacts: summary page https://claude.ai/artifact/3staLLQkLnGJdsMftV7DK8 and the design board's catalogue and prototypes (https://claude.ai/artifact/8ETT4wvvUHZxKYRW5X7jsk, artboards Catalogue, ResetDesktop, ResetPhone). Owner choices: fit order "Title shrinks first (Recommended)"; chips "Light up straight away (Recommended)"; layout "Viewer's own size (Recommended)". Owner: "confirmed, start building". Build order change accepted with the confirmation (the summary page listed it): T-330 → T-329 → T-326 → T-331 → T-325 → T-327. owner_validation stays open until the Full Objective Check gives a Check id to record against.

Coordinator marked done (owner: "confirmed, start building"); owner_validation acceptance is recorded against the Full Objective Check id when it exists.
