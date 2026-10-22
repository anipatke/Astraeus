---
id: T-143
title: Check the screen parts in fast tests with a pretend page
objective: O-038
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o038-planning-20261023}
lane: dom
planned_writes: [package.json, package-lock.json, tests/domSetup.ts]
check_waiver:
    task: T-143
    reason: 'owner asked for one full fresh check at the end of O-038 instead; quote: "orchestrate the delivery of O-38. ask clrifying questions front, one full (new) chek at the end"'
    actor:
        role: owner
        session: owner-run-rules
    recorded_at: "2026-10-23T00:00:00Z"
---

# Check the screen parts in fast tests with a pretend page

## Outcome

The fast suite can open the app's screen parts on a light pretend page (happy-dom) and press them. Every behaviour scenario that the shell browser scripts prove is now proven by a fast test instead: drawers, the information panel and Sources, the story panel contract, the events list with next and previous, camera presets offered, the scale menu, view links (copy, refused clipboard, bad link), the embedded page, phone and reduced-motion behaviour, touch-target sizes and keyboard focus.

## User Check

None on screen. Run `npm test` and see the new pretend-page test files pass in the normal fast run.

## Done When

- `happy-dom` is a dev dependency; files that need it opt in with `// @vitest-environment happy-dom`; `vite.config.ts` keeps `environment: "node"` for everything else.
- A small shared helper (`tests/domSetup.ts`) mounts a shell part with a made-up experience (ARCH-03) and returns it for presses and reads.
- Each behaviour scenario in `browser-shell`, `browser-controls`, `browser-phone`, `browser-layout`, `browser-embedded`, `browser-scale-menu`, `browser-view-link` and the generic part of `browser-story-panels` is listed in Technical Evidence with the test file and case that now proves it, or marked "layout/overlap: owner's look on the preview" or "draws: smoke check". Nothing left unlisted. This list is what the last step of this Objective copies into `docs/BROWSER_CHECKS.md`.
- The browser scripts themselves are not deleted here.
- The whole fast suite still runs in about a minute or less (time recorded before and after). Configured gates pass.

## Context Files

`tools/validate/browser-shell.mjs`, `tools/validate/browser-controls.mjs`, `tools/validate/browser-phone.mjs`, `tools/validate/browser-layout.mjs`, `tools/validate/browser-embedded.mjs`, `tools/validate/browser-scale-menu.mjs`, `tools/validate/browser-view-link.mjs`, `tools/validate/browser-story-panels.mjs`, `tools/validate/driver.mjs`, `src/shell/AstraeusShell.tsx`, `src/shell/useDrawers.ts`, `src/shell/InfoPanel.tsx`, `src/shell/StoryPanelView.tsx`, `src/shell/ScaleControl.tsx`, `src/shell/TimelineBar.tsx`, `src/shell/embedded.ts`, `src/app/viewLink.ts`, `vite.config.ts`, `vitest.setup.ts`, `tests/controls.test.ts`, `tests/phoneLayout.test.ts`, `docs/BROWSER_CHECKS.md`.

## Design References

Design: Components/Codebase Map rows for `src/shell/` and `tools/validate/`; Story panels (O-015).

## Guardrails

ARCH-01, ARCH-03, TEST-01, TEST-03, CODE-01; STYLE rules as listed in `.savepoint/Guardrails.md`.

## Implementation Plan

1. Add happy-dom and prove one shell part mounts and responds to a press under it. If the shell cannot mount without a WebGL canvas, mount the parts around the canvas instead; if neither works, stop and return REPLAN REQUIRED with what blocked it.
2. Write the shared mount helper.
3. Go script by script: copy each behaviour assertion into a fast test against the same component or model; skip pure "it draws" or pixel-position assertions and mark them as smoke or owner-look.
4. Record the scenario map and the suite time.

## Boundaries

No change to what visitors see. No browser runs. No deleting scripts or editing `docs/BROWSER_CHECKS.md` (the last step does both). No screenshots.

## Technical Verification

Focused `npx vitest run <files>` while building; configured gates at hand-off (AGENTS.md Verification Policy). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built in lane `lane-t143`. Task Check waived (see `check_waiver`); the Full Objective Check covers this.

**What was built.** `happy-dom` is a dev dependency (`package.json`, lock). Five test files opt in with `// @vitest-environment happy-dom`; `vite.config.ts` still says `environment: "node"`. `tests/domSetup.ts` mounts the real `AstraeusShell` on the made-up experience (ARCH-03) with a real `SimulationClock` on a fake monotonic source, and offers `press`, `pressKey`, `change`, `swipe`, `touchDrag`, `selectObject`, `advance`, `requestPanel`. The shell needs no WebGL canvas (`children: null`), so no REPLAN. New files: `tests/domShell.test.ts` (13 cases), `domPhone.test.ts` (23), `domStory.test.ts` (13), `domEmbedded.test.ts` (9), `domMenuAndLink.test.ts` (11) = 69 cases.

**Edits outside `planned_writes` (for the Full Check to see).** (1) `vitest.setup.ts`: folders now resolved with `node:path` instead of `new URL(..., import.meta.url).pathname`, because under happy-dom Vite rewrites that form into a web asset address and the setup file failed; behaviour under node is the same. (2) `src/app/viewLink.ts` gains `shareViewLink` (address write plus clipboard copy, moved out of `App.tsx` unchanged) and `App.tsx` calls it, so Copy view link can be tested without the WebGL scene. No visible change. No extra reads beyond the Context Files, except `src/shell/Collapsible.tsx`, `TopBar.tsx`, `ObjectControls.tsx`, `ControlsDrawer.tsx`, `useDrawerSwipe.ts`, `useSwipeToDismiss.ts`, `useStoryPanels.ts`, `Sources.tsx`, `ProvenanceBadge.tsx`, `src/app/DeveloperSettings.tsx` / `App.tsx` (view link and developer folds), `src/synthetic/syntheticDefinition.ts`, `tools/validate/harness/scale-menu.tsx`, `src/shell/{controls,phone,embedded}.css` (the parts the tests mount or read).

**Gates (lane, 2026-10-23).** `npm run lint` pass; `npm run typecheck` pass; `flock /tmp/astraeus-build.lock npm run build` pass (chunk-size warning only); `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 104 files, 1408 passed, 1 skipped. Suite time (vitest Duration; other lanes were running at the same time): before 44.5 s (99 files, 1339 tests; 49 s wall), after 38.1 s (43 s wall). No browser run, no screenshot, no `test:full`, no health check.

**Scenario map** (kind: D = proven by a fast test in the file named; O = layout/overlap: owner's look on the preview; S = draws: smoke check; CSS = proven by reading the stylesheet in `domEmbedded`/`domPhone`). 84 scenario lines, none unlisted.

browser-shell.mjs
- S1 developer panel starts closed, opens, closes: D `domShell` "the developer cog".
- S2 Events list: two rows, pick a row names it in the context line, Next moves to the second: D `domShell` "events" (lists the two, opens and closes the Events list, moves back with Previous).
- S3 a timeline marker's label shows on focus: O (the marker is a button named "Go to ..." in `domShell`; showing the label is the stylesheet).
- S4 marker available through the whole timeline: D `domShell` "offers the marker through the whole timeline".
- S5 camera presets focus/follow/overview asked and marked active: D `domShell` "offers Overview, Focus and Follow".
- S6 the marker's name tag shows in focus/follow and hides in overview: S (scene labels; T-144 scene tests / engine set).
- S7 visible name tags never overlap: O.
- S8 information panel for the marker (Metric Visuals, provenance badge, Known limitations/Sources/Accuracy, "Not a real object"), Escape closes: D `domShell` "information, provenance and Sources".
- S9 an event's information opens from the Events list and closes: D `domShell` "opens an event's information".
- S10 both scales: names, identical readouts, tooltip, About the scales closed/open/closed: D `domShell` "the two scales".
- S11 follow the marker, drag and zoom move the camera: S.
- S12 developer panel: metric visuals fit a phone portrait: O.
- S13 developer panel: advanced readouts list (one): S (app-owned developer tools, needs the app).

browser-controls.mjs
- C1 controls of one kind and variant share one look (dropdowns above all): O (computed styles need the stylesheet).
- C2 control height 36 px desktop / 44 px phone: CSS `domEmbedded` "the sizes the stylesheets promise".
- C3 one font family, weight and size across dropdowns, buttons and rows: CSS `domEmbedded` "draws every control from the one shared size and font" (the computed result is O).
- C4 controls in one row share a baseline: O.
- C5 the states exist and show controls: start, top drawer with both dropdowns, timeline drawer, information panel, Sources open, story panel: D `domPhone` (drawers, info sheet, Sources, story panel) and `domShell` (object list and speed picker present).

browser-phone.mjs
- P1 only pill, cog and two-line timeline show; pill names the pick; both drawers start closed: D `domPhone` "the phone shows only its small chrome".
- P2 the chrome fits the screen, no horizontal scroll, chrome share of height: O.
- P3 top drawer opens/closes by tap on pill and handle; swipe down and up; Escape; object list hidden while closed; tapping the list leaves it open (owner bug 2026-10-18); a pick closes it: D `domPhone` "the top drawer".
- P4 top drawer leaves part of the scene: O.
- P5 timeline drawer opens/closes by tap and swipes; shows the events context and Up next: D `domPhone` "the timeline drawer".
- P6 timeline drawer grows the timeline, stays on screen, no sideways scroll: O.
- P7 speed slider drives the playback speed: D `domPhone` "drives the playback speed from its slider".
- P8 opening one drawer closes the other: D `domPhone` "shares the screen".
- P9 time and playing state survive the drawers: D `domPhone` "keeps the time and the playing state".
- P10 a drag on the scene opens no drawer: D `domPhone` "a drag on the scene opens no drawer".
- P11 information sheet: pill follows the pick, opening closes the top drawer, Sources closed with lines in the page, one tap opens, swipe down dismisses: D `domPhone` "the information sheet".
- P12 the sheet sits above the timeline, clear of Play, below the top row: O.
- P13 story panel on a phone: Sources closed, lines present, one tap opens: D `domPhone` "a story panel on a phone".
- P14 story panel never covers Play, also with the timeline drawer open: O.
- P15 touch targets at least 44 px: CSS `domEmbedded` (control height, handles, slider) plus O for the measured result.
- P16 developer groups: first open, others closed, one press folds, remembered after reload: D `domPhone` "the developer folds" (fold, one press, remembered). The group count (3 to 8), first-open default and 44 px headings are built by the app: S / O.
- P17 settings: live controls for the five phone sliders: S (app developer panel). The animation setting reaching the drawers: D `domPhone` "hands the animation setting to the drawers"; the swipe-distance setting: D `domPhone` "uses the swipe distance setting".
- P18 reduced motion removes the drawer animation; drawers still work: D `domPhone` "removes the drawer animation under reduced motion" (stylesheet rule) and "mounts and opens a drawer with reduced motion asked for".
- P19 the stylesheet respects all four safe-area insets: D `domPhone` (same case as P18).
- P20 zero console and page errors: S (plus React would log act/prop warnings in the fast run, none seen).

browser-layout.mjs
- L1 every shell part fits the viewport at laptop, tablet and mobile: O.
- L2 toolbar does not overlap the developer toggle: O.
- L3 primary controls at least 44 px on tablet and mobile: CSS `domEmbedded`; measured result O.
- L4 the information sheet clears the timeline on a phone: O.
- L5 the developer panel receives taps across its panel and scrolls to its end: O.
- L6 keyboard focus is visible: CSS `domEmbedded` "visible keyboard focus ring"; every primary control is a button or select that Tab reaches: D `domShell` "keyboard focus and touch sizes".
- L7 the marker's information includes Metric Visuals: D `domShell` (same case as S8).
- L8 zero console and page errors: S.

browser-embedded.mjs
- E1 framed: shell flagged embedded; alone: not: D `domEmbedded` "flags the shell embedded".
- E2 the frame picks phone or laptop layout by its own width: D `domEmbedded` "picks the phone or the laptop layout".
- E3 framed bars and controls slimmer (30 px laptop, 44 px phone kept): CSS `domEmbedded` "slims a framed laptop"; the measured gap is O.
- E4 alone keeps 36 px controls: CSS `domEmbedded` "gives controls 36 px".
- E5 Play/Pause, speed picker, object list, Events list and Developer cog work in the frame (laptop and phone): D `domEmbedded` "keeps the shared controls working".
- E6 no sideways scroll, bars inside the frame: O.
- E7 zero console errors: S.

browser-scale-menu.mjs (all D `domMenuAndLink` "the scale menu")
- M1 closed by default. M2 opens on press and on ArrowDown. M3 focus lands on the current scale. M4 ArrowDown/ArrowUp wrap, Home/End. M5 Escape closes and returns focus. M6 Enter chooses, closes, button name tracks the choice. M7 an outside press closes; the third scale is chosen by name.

browser-view-link.mjs (all D `domMenuAndLink` "Copy view link" unless noted)
- V1 link carries view, time, scale and up. V2 the link is on the clipboard. V3 the address holds the view. V4 dragging moved the camera: S. V5 a fresh page restores the same view: D round trip through the address (`shareViewLink` then `viewFromSearch`); the camera landing there on load is S. V6 clipboard refused: link shown in a selectable field with the note. V7 a malformed link opens normally. V8 zero console errors: S.

browser-story-panels.mjs, generic part (D `domStory` unless noted; Apollo, Perseids, Geminids and Jupiter-Io panel wording and order are demo data, kept by `tests/storyStoriesAllDemos.test.ts` and `tests/storyPanels.test.ts`)
- G1 a timeline marker per panel. G2 forward playback opens the first panel by itself and holds playback (Continue shown, badge). G3 playback resumes on its own after the pause. G4 Continue resumes early. G5 scrubbing and stepping past markers opens nothing. G6 timeline markers open their panel, one at a time, and seek. G7 a scene marker's request opens its panel (the marker's drawing is S). G8 Escape and the close button close it; closing a held panel lets playback go on. G9 panels open in time order as playback reaches each. G10 pause length 0 opens without pausing; the live sliders in the developer panel are S. G11 auto-open off: playback crosses silently, markers still open panels. G12 details and sources fold into one closed section, one tap opens, another folds it. G13 phone sheet: swipe down dismisses, a short drag keeps it: D `domPhone`. G14 phone sheet size and position, and the screenshots the script took: O (no screenshots by rule). G15 the Geminids activity view keeps its two panels: demo data, not generic; left to the Geminids/showers set. G16 zero console errors: S.

(Counts: shell 13, controls 5, phone 20, layout 8, embedded 7, scale menu 7, view link 8, story 16 = 84.)

**Not proven here, by design:** every O and S line above. Nothing is left unlisted. Browser scripts are untouched.

Marked done by the coordinator at 2026-10-22T20:20:08Z on the owner's authority (2026-10-23, asked "Should I mark each step finished as it passes its tests": "I mark them as they pass"). Merged to o038-browser-checks as e36293f2 together with T-144; combined run there: typecheck pass, `npm test` 104 files, 1416 passed, 1 skipped, 34.5 s (37 s wall). Outside planned_writes (recorded above): `vitest.setup.ts` path fix and `shareViewLink` moved unchanged from `src/app/App.tsx` to `src/app/viewLink.ts`.

## Drift Notes

Note for Design: the fast suite now has an opt-in pretend page. Reconciled in the last step of this Objective.
