---
id: T-079
title: Slim the top bar into one compact row of icons
objective: O-020
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o017-orchestrator-check-20261017}
---

# Slim the top bar into one compact row of icons

## Outcome

The panels along the top become the approved single bar: the body picker without the word "Object", Info as an info icon, Focus as a magnifying glass, Overview as an expand icon, Scale as one toggle (two scales) or a small menu (three scales), and Developer mode as a cog on its own at the top right. The Object list no longer lists orbit lines.

## User Check

Open any experience: one compact bar top left, a cog top right; every icon shows its name on hover; the showers' scale opens a three-item menu; the Object list in a shower holds bodies and the stream, no orbit lines.

## Done When

1. Matches the desktop artboard of the approved mock-ups (O-020 Decision 6) at 1440x900; each icon button keeps its current accessible name (Decision 9) and shows a tooltip.
2. Scale: experiences with two scales show one toggle button naming the current scale; three scales show a small menu (Decision 7), keyboard operable (arrow keys, Escape), closing on outside click.
3. Object list without orbit lines (O-020 Decision 4): a generic rule (an object kind or flag set in the experience definition; the shell names no experience) leaves orbit and path objects out; an orbit's source and limits stay reachable (its body's info panel or the developer panel); Apollo, Earth-Moon and Jupiter-Io lists unchanged.
4. Developer mode stays public, as the cog (Decision 5).
5. CSS for the bar lives in its own stylesheet beside its component (not appended to `src/shell/style.css`), so the timeline Task can change its own styles in parallel without conflicts.
6. Browser scripts that clicked the old text buttons are updated or confirmed unaffected (accessible names unchanged), each scenario mapped.

## Context Files

`src/shell/ObjectControls.tsx`, `src/shell/ScaleControl.tsx`, `src/shell/scaleModel.ts`, `src/shell/AstraeusShell.tsx` (developer toggle and toolbar only), `src/shell/style.css` (top bar rules only, to move out), `src/app/experienceDefinition.ts`, `src/experiences/showers/showerPaths.ts`, `.savepoint/objectives/O-020-make-the-phone-view-immersive/Objective.md`.

## Implementation Plan

1. Move the top bar's CSS into its own file; build the icon buttons and tooltips.
2. Scale toggle and menu; orbit lines out of the Object list by a generic rule.
3. Tests, browser scripts, pictures.

## Boundaries

Desktop top bar only; no timeline, drawers or phone layout (other Tasks).

## Design References

Design.md shell components and presentation (ARCH-02); the approved mock-ups https://claude.ai/artifact/Akgz8SgcZBq1jCy15aPqoS.

## Guardrails

ARCH-01 (no experience names in the shell), ARCH-02, ARCH-03, TEST-01, TEST-03 (any browser script a UI change invalidates is updated with each scenario mapped), STYLE-01, STYLE-07.

## Technical Verification

Configured gates, the lite browser check, before/after pictures against `docs/evidence/o017-baseline-20261017/` (differences are expected where the UI changes; each is listed), and the full run (`tools/validate/run-full.sh`) before handoff. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Executed in worktree lane `/home/user/code/astraeus-t079`, branch `o020-t079` from 0d917d6 (router not edited; no Tasks, Checks or Issues created). Own dev server on port 5491, stopped afterwards. Browser runs started once the machine was shared-quiet; the wait loop hit its 20-minute limit with load average 5.9 (no other headless Chromium) and proceeded.

### Per criterion

1. **Matches the desktop artboard, names kept, tooltips.** `src/shell/TopBar.tsx` (new) renders one row: body picker (no "Object" word), Info icon, Focus magnifier (and Follow crosshair icon where a follow preset exists), Overview expand icon, a divider, then Scale; `DeveloperToggle` is a cog alone at top right. Icons are the mock-up's inline SVG paths (`src/shell/topBarIcons.tsx`). Every button has `title` (tooltip) and the accessible name it had: Info "Information about <body>", camera buttons their preset label (for example "Focus Jupiter", "Jupiter–Io overview"), "Developer mode", picker "Select object". Screenshots at 1440x900: `docs/evidence/o020-t079-after-20261017-1600/jupiter-io-wide-desktop.png`, `perseids-desktop.png`, `apollo11-overview-desktop.png` (PNG files are git-ignored, on disk). The one name that changed on purpose is the Scale control's (below).
2. **Scale.** `src/shell/ScaleControl.tsx`: two scales render one toggle button, name "Scale: True. Switch to Readable", `data-scale`, `data-scale-label`, tooltip carrying the current scale's explanation and the note; one scale renders the same button held still (disabled); three or more render a menu (option B): trigger "Scale: <current>, choose another" (`aria-haspopup="menu"`, `aria-expanded`), `role="menu"` with `menuitemradio` items, each with its explanation as tooltip. Keyboard: ArrowDown/ArrowUp on the trigger open it; focus lands on the current item; ArrowUp/ArrowDown wrap, Home/End, Enter or Space choose and close, Escape closes and returns focus to the trigger, Tab closes; a pointer press outside closes. No shipped experience offers three scales today (showers: True and Solar system; Earth-Moon: True and Readable; Jupiter-Io: True only), so the menu is verified in a dev-server harness (`tools/validate/harness/scale-menu.html`) by `tools/validate/browser-scale-menu.mjs`: "scale menu ok" (picture `docs/evidence/o020-t079-menu-20261017-1600/scale-menu-open.png`). Unit tests in `tests/controls.test.ts` cover the menu, toggle and held markup.
3. **Object list without orbit lines.** Generic rule: `ExperienceObject.listed?: boolean` and `partOf?: string` (`src/shell/experience.ts`); `experienceWithGroups` (`src/app/experienceDefinition.ts`) marks a path object `listed: false` when the path's kind is "orbit" and its object names a `partOf`; the Object picker (`listedObjects`, `src/shell/objectModel.ts`) leaves unlisted objects out except the selected one. The shell names no experience (ARCH-01). The shower definition supplies `partOf` on its six orbit objects (`src/experiences/showers/showerPaths.ts`: earth-path to earth, planet orbits to the planet, parent orbit to the comet). Reachability: the selected body's bar shows an orbit-icon button per related unlisted object (named by the orbit's label, `data-related-object`); it selects the orbit and opens its info (source, limits, as before); the "Whole orbit" Focus button then appears for the parent orbit. An orbit with no `partOf` and every trail stay listed, so the Apollo, Earth-Moon, Jupiter-Io and synthetic lists are unchanged (their browser scripts pass with the same option assertions). Tests: `tests/experiences.test.ts` (six shower orbits unlisted, each part of a listed body), `tests/controls.test.ts` (listed and related selection).
4. **Developer mode public, as the cog.** `DeveloperToggle`, same class `developer-mode-toggle`, `aria-pressed`/`aria-expanded`, name "Developer mode"; scripts that click it by name pass.
5. **Own stylesheet.** `src/shell/TopBar.css`, imported by `TopBar.tsx`. Only top-bar rules left `src/shell/style.css` (`.shell-toolbar`, `.object-*`, `.scale-*`, `.developer-mode-toggle`, and their phone and tablet lines, including the short-phone rule that hides the toolbar while an info sheet is open); the shared `.provenance-detail[hidden]` line stayed in `style.css`; nothing else touched, so the timeline Task's moves do not conflict. No `style.css` additions.
6. **Browser scripts.** Helper `tools/validate/shellScale.mjs` (`chooseScale`, `currentScale`, `scaleOptions`, `offersScale`, `selectOrbit`). Scenario map:
   - Old text-button scale clicks (`getByRole("button", {name: "True"|"Readable"|"Solar system"})`) become `chooseScale`: browser-shell (Readable then True; also asserts the toggle name and data-scale), browser-showers (Solar system and True, four places), browser-spike02 (True/Readable by label), browser-spike03 (default True scale assertion, Readable/True), browser-synthetic-ring, browser-synthetic-listed, and on-request browser-precision, browser-sun, browser-synthetic-belt, browser-synthetic-eccentric, browser-marker-existing (not run, mechanical).
   - `aria-pressed` assertions on the Readable button become `currentScale` === "readable-scale".
   - `.scale-choices button[data-scale]` lists (earth-moon: true,readable; jupiter-io: true; showers: true,solar-system) become `scaleOptions` (same expected lists).
   - browser-shell "What do True and Readable scale mean?" panel (text closer / true size / drawn on top): the explanation moved to the toggle's tooltip, asserted by regex on its `title`. Reachable by hover or long-press only on a two-scale toggle; see Drift Notes.
   - browser-showers: the object list now must hold the bodies and stream and must not hold the six orbit ids; each of earth-path, mars-orbit and the parent orbit is reached from its body (related button), selected, and its `#info-panel[data-info-id]` opens; the planet-orbit and whole-orbit checks reach orbits by `selectOrbit`.
   - Phone: the old "Camera mode" select (`.object-camera-picker`) no longer exists; the icon buttons fit the phone row (44 px), so scripts' existing `compact.isVisible()` branch is false and they click the named buttons. Those branches are now dead and left in place (no scenario lost).
   - Unchanged by name: "Developer mode", "Select object", "Information about <body>", camera preset names, `.object-info-toggle`, `.developer-mode-toggle`.

### Commands and results

- `npx tsc --noEmit` clean. `npx vitest run`: 57 files, 939 passed, 1 skipped. `npm run build` built.
- Lite: `ASTRAEUS_URL=http://localhost:5491/app.html ASTRAEUS_EVIDENCE_DIR=docs/evidence/o020-t079-lite-20261017-1600 node tools/validate/browser-lite.mjs`: 26/26 loads passed (11 experiences + 2 site pages, 1440x900 and 390x844), zero console errors; results and screenshots in `docs/evidence/o020-t079-lite-20261017-1600`.
- `browser-shell`, `browser-anchor-labels`, `browser-earth-moon`, `browser-jupiter-io`, `browser-synthetic-ring`, `browser-synthetic-listed`, `browser-spike03` (includes the 44 px touch-target check on the new buttons), `browser-spike02`, and `ASTRAEUS_LIGHT=1 browser-showers` (2 of 2 showers passed): all exit 0, `"errors": []`. `browser-scale-menu`: ok. Full `run-full.sh` not run (the orchestrator runs it after merge). These scripts write their default results into tracked historical evidence folders; those writes were reverted (`git checkout docs/evidence/regression-spike01-02 docs/evidence/spike03`) and the new phone result files removed, so historical evidence is unchanged.
- Pictures: `node tools/validate/capture-experience-pictures.mjs --out docs/evidence/o020-t079-after-20261017-1600 --port 5491`: 20 pictures, 0 errors. Diff against the baseline (the PNGs are git-ignored, so the baseline set was read from `/home/user/code/Astraeus/docs/evidence/o017-baseline-20261017`): `docs/evidence/o020-t079-after-20261017-1600/diff-vs-baseline.json`.
  - Identical: `site-assets-desktop`, `site-assets-phone`; `site-index-*` differ by under 0.003 percent (max channel delta 3, noise).
  - Desktop pictures (apollo11, earth-moon, jupiter-io, geminids, perseids) differ in 2.1 to 2.8 percent of pixels: the top-left toolbar (two panels with text became one slim row of icons), and the top-right button (text "Developer mode" became a cog). Nothing else is meant to change.
  - Phone pictures differ in 17.4 to 20.8 percent: the old three stacked panels at the top (picker with Camera mode select, scale buttons, Developer mode text button) became one row plus the cog; the scene itself is not changed by this Task. Each picture was not individually viewed beyond the jupiter-io, perseids and apollo samples taken during building.

### Extra reads (outside Context Files)

- `src/shell/InfoPanel.tsx` and `src/shell/infoModel.ts`, to see how an object's source and limits reach the panel (orbit reachability); not edited.
- `tools/validate/browser-*.mjs` (and `on-request/`), `tests/controls.test.ts`, `tests/experiences.test.ts`: the scripts and tests that name the old controls (Criterion 6 requires them).
- `src/experiences/showers/showerDefinition.ts` (grep only), for the scale choices and the "Whole orbit" preset.
- The mock-ups `Main.dc.html` and `ScaleOptions.dc.html` in the scratchpad (reference only).

### Files changed

New: `src/shell/TopBar.tsx`, `src/shell/TopBar.css`, `src/shell/topBarIcons.tsx`, `tools/validate/shellScale.mjs`, `tools/validate/browser-scale-menu.mjs`, `tools/validate/harness/scale-menu.{html,tsx}`, evidence folders. Changed: `src/shell/{ObjectControls,ScaleControl,AstraeusShell,experience,objectModel,style}`, `src/app/experienceDefinition.ts`, `src/experiences/showers/showerPaths.ts`, `tests/{controls,experiences}.test.ts`, the scale-using browser scripts named above. `AstraeusShell.tsx` also gained `TopBar` and `DeveloperToggle` in place of the inline toolbar and button (toolbar and developer toggle only).

### Drift Notes (for the owner; not applied)

- No shipped experience offers three scales: the showers offer True and Solar system (Decision 7 assumed three). They therefore get the two-scale toggle ("Scale: True. Switch to Solar system"); the menu is built and tested but live only when an experience lists three ids in `scaleChoices`.
- The scale explanation panel (opened by the old "ⓘ" button) is gone: its words are now the tooltip on the toggle and on each menu item. That is hover or long-press only on a touch screen's toggle; if the owner wants it one tap away, a small explain control can return (drawer Task T-081 may be the place).
- Design.md (shell components, ARCH-02): the top bar is now `TopBar` (picker, Info, camera buttons, Scale) plus `DeveloperToggle`, with `ExperienceObject.listed` and `partOf`; the reachable-orbit rule is part of the shell/experience contract. Deferred to the integration Task that reconciles Design before the Full Objective Check.
- The phone layout here is only kept working (one row, 44 px targets, scale text hidden under 480 px); the immersive drawers are T-081. A short phone (under 680 px high) still hides the toolbar while an info sheet is open, as before.
- The browser scripts' default result files write into tracked historical evidence folders (`docs/evidence/regression-spike01-02`, `docs/evidence/spike03`); a later change could point them at the run's evidence directory.

### Repair after merge (2026-10-17)

The orchestrator's full run on the merged T-079 + T-080 tree (`docs/evidence/c060-20261017T052231Z/`) failed two scripts that touch T-079 controls. Both are script fixes; the app did not regress.

- `browser-sky.mjs` ("apollo-desktop: at least the start and two requests were checked"): the script clicked buttons named `Readable` and `True`, which T-079 replaced with one scale toggle (`Scale: <current>. Switch to <other>`). Only Overview and Focus matched, so fewer than 3 probes ran. Fix: the request list is now `/^Scale: /, Overview, Focus, Follow, /^Scale: /` (the toggle clicked twice stands in for Readable and True; every scenario kept). Solo run: exit 0, 4 probe checks (`docs/evidence/o020-repair-sky-053144*`).
- `browser-spike02.mjs` ("event lands at ... DOI ignition"): not a layout change. The same script passes alone on this tree; in the full run it read the previous event's time after a fixed 150 ms wait on the clock readout under parallel-lane load. Fix: wait (up to 5 s) for `.timeline-time` to reach the event's time before the unchanged assertion. Solo run: exit 0 (`docs/evidence/o020-repair-spike02-053144*`).

Gates: tsc clean, vitest 939 passed, build ok. Full browser run: see the T-080 repair note.

Full browser run after the repairs (`bash tools/validate/run-full.sh`, 2026-10-17): `docs/evidence/o020-repair-full2-053144/summary.txt`, every step exit 0, zero error lines. Picture difference figures (differ from the baseline by design): {"files":20,"identical":2,"maxOver16Pct":13.0982}. A first full run (`o020-repair-full-053144`) failed only `showers-perseids` at `checkLoopOff` ("Select object" stream option not enabled) while the machine was loaded by other builders (325 s versus 161 s); the same script passed solo right after (`o020-repair-showers-053144-e`) and in the second full run, so it is recorded as a load flake, not a regression (not fixed; not reproduced).

## Owner Completion — 2026-10-18

Marked done on the owner's standing instruction for O-020 ("Yes, for all clear interface steps"), after Quick Task Check C-060 CLEAR.
