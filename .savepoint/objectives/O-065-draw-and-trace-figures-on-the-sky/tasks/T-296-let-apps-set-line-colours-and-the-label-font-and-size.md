---
id: T-296
title: Let apps set line colours and the label font and size
objective: O-065
status: done
depends_on: [{task: T-295, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-296, reason: 'Owner said "orchestrate O65" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o065-run-20261110}, recorded_at: '2026-11-10T03:16:41Z'}
planned_by: {role: planner, session: o065-planning-20261110}
---

# Let apps set line colours and the label font and size

## Outcome

An app sets the colour of sky figures, boundaries, the ecliptic, the equator and traced and faded lines, and one label font and size for every label in the viewer, as looks with defaults it can change live; a figure can set its own colours, font and size; the Developer drawer shows them.

## User Check

None for the owner at this step; the owner looks in the last step.

## Done When

- `LookInput` and `LookRead` gain a sky-lines look (figure, label, boundary, ecliptic, equator, traced and faded colours, as CSS colour strings) and a labels look (`fontFamily`, `sizePx`) with documented defaults; the defaults keep today's label look unchanged (a test pins the current label style).
- The look table (`app/look.ts`) gains a colour kind and a font kind with checks (a colour the browser cannot parse, or an empty font, throws `bad-look` at `setLook`, API-04, API-05); these looks have no page-address parameter (owner-confirmed planner default; API-06 mapping test updated to say so).
- A figure's own `color`, `labelColor`, `labelFont` and `labelSizePx` (added to the previous step's input) override the defaults; the label look applies to body, path and sky labels alike (owner decision 2) through one CSS variable route, not per-label code paths (STYLE-07).
- `handle.setLook` changes them live on both paths (API-02, `tests/lifecycle.test.ts`); the Developer drawer shows a colour input and a font field and size slider for them (only with `developerTools`).
- Phone first: label size range keeps labels readable and the collision rule intact at 375x667 and 1280x720.
- API lock, README and CHANGELOG updated (API-01, API-07).

## Context Files

`packages/astraeus/src/app/look.ts`, `packages/astraeus/src/api/look.ts`, `packages/astraeus/src/app/liveLook.ts`, `packages/astraeus/src/app/DeveloperSettings.tsx`, `packages/astraeus/src/app/SettingControls.tsx`, `packages/astraeus/src/app/SceneLabels.ts`, `packages/astraeus/src/app/AnchorLabels.ts`, `packages/astraeus/src/shell/Label.tsx`, `packages/astraeus/src/shell/style.css`, `packages/astraeus/src/app/style.css`, `packages/astraeus/src/app/SkyView.ts`, `packages/astraeus/tests/look.test.ts`, `packages/astraeus/tests/lifecycle.test.ts`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `.savepoint/objectives/O-065-draw-and-trace-figures-on-the-sky/Objective.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (Headless use and looks as settings, O-056) and under `Decisions` (Public API shape, G-016).

## Guardrails

API-01, API-02, API-03, API-04, API-05, API-06, API-07, ARCH-02, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Confirm the previous step's figures and reference lines exist; return REPLAN REQUIRED if not.
2. Add the colour and font kinds to the look table; extend `LookInput`, `LookRead` and their checks.
3. Route the label font and size through CSS variables on the viewer root (API-03: within the root class only).
4. Wire colours into the sky drawing; per-figure overrides.
5. Developer drawer controls; live `setLook`; tests; lock, README, CHANGELOG.

## Boundaries

No address parameters for these looks; no star size look; no star emphasis; no tracing (next step).

## Technical Verification

Focused Vitest runs while building; hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, plus `npm run check:pack` and `npm run check:node-consumer`; no browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Executed 2026-11-10 by the builder (checker is a later fresh session; the optional Task Check is waived).

Extra reads (not in Context Files, each for the stated reason): `packages/astraeus/src/app/skyFigures.ts`, `SkyFiguresView.ts` (where the fixed colours lived, T-295's drift pointers); `src/api/lookInput.ts`, `src/api/planSkyFigures.ts`, `src/api/skyFigureInput.ts` (where setLook and the figure input are checked); `src/app/App.tsx`, `AstraeusScene.tsx`, `sceneFrame.ts`, `sceneContentsHooks.ts`, `src/shell/AstraeusShell.tsx`, `src/shell/phone.css` (the controls, the frame and the root element the CSS variables go on); `tests/apiImports.test.ts`, `tools/api-rules.mjs` (the api-to-app import rule and the API-06 mapping).

Per criterion:
- Sky-lines and labels looks: `LookInput`/`LookRead` gain `skyLines` {figure, label, boundary, ecliptic, equator, traced, faded} (defaults `#8fb4ff`, `#cfe0ff`, `#5f7a9c`, `#e0b25a`, `#7fd1b9`, `#ffd166`, `#44546d`, stated once in `DEFAULT_SKY_COLOURS`, `app/skyFigures.ts`, replacing `SKY_LINE_COLOURS`) and `labels` {fontFamily `inherit`, sizePx 12, range 8 to 24}. Defaults keep today's label look: `tests/skyLooks.test.ts` pins `{ inherit, 12 }`, and the computed-look lock is unchanged for existing elements.
- Look table: kinds `colour` and `font` added (`app/look.ts`), checked by `core/lookValues.ts` (`isCssColour`, `isFontFamily`, no browser needed); a bad one throws `bad-look` at `setLook` (tests/skyLooks.test.ts, tests/lifecycle.test.ts). Fields have `param: null` (no page-address parameter); `tests/look.test.ts` (API-06 mapping) now has cases for all nine with `param: null` and proves the address cannot reach them.
- Per-figure override: `SkyFigureInput` gains `color`, `labelColor`, `labelFont`, `labelSizePx` (checked, `bad-sky-figure`); a figure with its own `color` is drawn as its own line set, so a live look change leaves it alone; label font/size/colour sit on its label element. One CSS-variable route: the viewer root carries `--label-font` and `--label-size` (set only when not default); `.astraeus-label` and `.anchor-label` read them (phone.css too), so body, path, sky, body-set and anchor labels all follow; a figure's own values set the same variables on its label (no per-label code path).
- Live on both paths: `handle.setLook` (tests/lifecycle.test.ts, mount and AstraeusScene drivers) and the Developer drawer (Labels fold: size slider, font field, "Sky line colours" group of seven colour inputs, shown only with `developerTools`; tests/developerSettingsDom.test.ts).
- Phone first: size range 8 to 24 px, default unchanged; the collision rule is untouched (same layout code, labels still measured by `getBoundingClientRect`). Not looked at in a browser (waived by the run rules).
- API lock regenerated (`node tools/api-surface.mjs`), README and CHANGELOG updated.

Gates (repo root): `npm run lint` pass, `npm run typecheck` pass, `npm run build` pass, `npm run check:pack` pass (14.6 s), `npm run check:node-consumer` pass. `npm test`: 3502 pass, 1 FAIL: `packages/astraeus-site/tests/apiReference.test.ts` "keeps the generated page within the api/index.html raw and gzip limits": the generated API page is 40,719 B gzip against the limit 40,000 in `packages/astraeus-site/tools/validate/load-budget.mjs` (it was 39,927 before this step). The new public fields (nine looks, four figure fields, two types) cost about 792 B gzip; trimming doc text cannot recover that. Raising the limit is an owner decision (I-142 records the earlier ones), so it is NOT changed; the owner must approve a new gzip limit or another way.

Regenerated `tests/fixtures/computed-look.baseline.json` (`npm run look:lock`): the Developer drawer gained rows; no existing element row changed.


## Drift Notes

Record architecture deltas; Design is reconciled in the last step of this Objective.

- Sky label colour: the first step coloured each name like its line; there is now one `skyLines.label` colour (default `#cfe0ff`) for every sky name, and a figure's `labelColor` overrides it. Design.md to say so at reconciliation.
- New contract fields: `SceneControls.skyColours` and `SceneControls.labelStyle` (live), `AstraeusShell` prop `labelStyle` (CSS variables on the root), `SkyLabelSpec` carries the figure's own `color`/`font`/`sizePx`, `SkyLabelFrame.labelColor`, `SkyFigureLayer` carries `color`/`labelColor`/`labelFont`/`labelSizePx`. `SkyFiguresView.place(camera, switches, colours)` takes the colours; its group is now named `sky-lines` (the line sets keep `sky-figures`, `sky-boundaries`, `sky-ecliptic`, `sky-celestial-equator`, and `sky-figures:<id>` for an own-colour figure).
- Value checks live in `src/core/lookValues.ts` (colour: hex, names, comma-form rgb/rgba/hsl/hsla only, because the line painter reads those; font: non-blank without `;{}`; `LABEL_SIZE_LIMITS`), because `src/api` may import only core helpers (apiImports rule; no allowlist grew).
- `traced` and `faded` colours are defined and readable here; tracing (T-297) uses them.
- Developer drawer font field is uncontrolled (shows the font at open; a host `setLook` while it is open does not rewrite the text).
- Not covered by a test: the viewer root's `--label-size` after a live `setLook` in a rendered DOM (React renders after the call; the drawer and handle reads are tested).

Coordinator, 2026-11-10: the API reference page measured 40,719 B gzip against the 40,000 limit; owner chose "Raise to 44 KB" (room for the rest of 0.9.0); `packages/astraeus-site/tools/validate/load-budget.mjs` api/index.html gzipLimit 40,000 -> 44,000 with that reason. `npm test` re-run from the repo root: 3503 passed, 2 skipped, 0 failed. Gates now all pass.
