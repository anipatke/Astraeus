---
id: T-099
title: Browse Jupiter's moons by family in a sliding panel
objective: O-025
status: in_progress
stage: audit
depends_on: [{task: T-098, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o020-orchestrator-20261018}
check_waiver:
    task: T-099
    reason: "Owner waived the optional Task Check for O-025 ('Skip, one check at the end'); the Full Objective Check covers it."
    actor:
        role: owner
        session: o025-run-20261019
    recorded_at: "2026-10-19T00:00:00Z"
---

# Browse Jupiter's moons by family in a sliding panel

## Outcome

A sliding panel (the phone drawer on phones) lists Jupiter's moons by family: the big four at the top with pictures, then each family as a folding section with a plain one-line description and a count, named moons first and unnamed ones folded away; tapping a family lights it up in the scene, tapping a moon focuses it and opens its information panel, and a search box finds a moon by name.

## User Check

Open the panel, open the Carme group, tap its heading to see the family light up far from Jupiter, tap a moon to fly to it and read its information; search for "Himalia".

## Done When

1. O-025 Decision 6 (owner: "a sliding panel where the user can scroll through and on click touch opens an info panel, but 97 is a lot to scroll through"; approved "Looks good").
2. Families and descriptions come from T-097's core data; descriptions are plain words (O-015 voice); counts are live from the data.
3. Folding sections reuse the shared `Collapsible` (T-090) and the phone drawer (T-081); shared control styles; 44 px targets on phones; keyboard and screen-reader accessible.
4. Tapping a family heading highlights that family's dots (and orbits if drawn) in the scene; tapping again or another family clears or moves it; the highlight colour is a live setting.
5. Tapping a moon focuses the camera on it (the same focus as the object picker) and opens its information panel; the information panel shows the moon's family, size, discovery and sources.
6. Search filters by name or designation as the viewer types.
7. Generic: the panel works for any planet's moon families in core data (ARCH-01), so the post-launch planets reuse it.
8. Browser checks through the shared driver; full run passes; owner look on laptop and phone.

## Context Files

`src/shell/Collapsible.tsx`, `src/shell/ControlsDrawer.tsx`, `src/shell/InfoPanel.tsx`, `src/shell/AstraeusShell.tsx`, `src/shell/controls.css`, `src/assets/catalogue.ts`, `tools/validate/driver.mjs`, `.savepoint/objectives/O-025-show-jupiter-with-all-its-known-moons/Objective.md`.

## Design References

O-025 Decision 6; O-020 shell parts.

## Guardrails

ARCH-01, ARCH-02, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Panel with families, folding, search.
2. Family highlight; moon tap to focus and inform; checks.

## Boundaries

The panel and its links to the scene; tap-in-the-scene focus is O-022.

## Technical Verification

Configured gates, a new panel browser check, full run. Evaluated under `agent-skills/references/check-method.md`.

## Evidence (builder, 2026-10-19)

Browser checks deferred to the Full Objective Check (owner, 2026-10-19). None were run: no browser-lite, area script, run-full or headless Chromium.

Per criterion:
1. Decision 6 panel built: `src/shell/MoonFamilyPanel.tsx` (a sheet sliding in from the left beside a "Jupiter moons" button on wide screens; a section of the top drawer on phones). Big four at the top with pictures (each moon's own map as a round crop), then folding families, search box.
2. Families, labels, descriptions and counts come from `data/moons/jupiter.json` via `src/assets/moonCatalogue.ts` (parser extended with `named`, `discoveryYear`, `sourceIds`, catalogue `sources`); counts are `family.moons.length`. Tested in `tests/moonFamilyPanel.test.ts`.
3. Folds reuse `Collapsible` (two additive props: `remember`, `onOpenChange`); phone uses the existing `ControlsDrawer`; buttons are `ui-row` and the search input is styled in `controls.css`; 44 px comes from the shared `--control-height`; real buttons with `aria-expanded`, a labelled search box and an `aria-live` results group. 44 px is asserted in `browser-moon-panel.mjs`, not run.
4. Opening a family fold (or pressing the big four heading) sets `BodySetLook.highlightFamily`; `BodySetView` colours that family's dots and balls with `highlightColor` (per-vertex and per-instance colours); `OrbitSetView` takes the highlight colour and `highlightOrbitGain` for its lines; Io's own loop also takes the colour. Closing the lit family clears it; opening another moves it. Colour and orbit brightness are live sliders in Developer > Moon orbits by family. Readouts: `data-body-set-highlight`, `data-body-set-lit`.
5. A moon row calls the shell's `chooseMoon` (the same `focusPresetFor` focus as the object picker, then opens the info panel). The 111 small moons are now unlisted objects of the experience (`listed: false`), so the picker is unchanged. The info panel shows Family, Size, Found and Sources from `moonFacts` (new optional `ExperienceObject.facts`).
6. Search filters on name, id or designation as typed, ignoring case and punctuation (`searchMoons`).
7. Generic: the shell takes `ExperienceConfig.moonFamilies` (plain data); nothing in it names Jupiter; only `src/experiences/jupiter-io/jupiterIo.ts` builds the list.
8. Browser check written, not run: `tools/validate/browser-moon-panel.mjs` (through `driver.mjs`; new driver functions in its "moon panel" section; added to `run-full.sh` and `docs/BROWSER_CHECKS.md`). Full run and owner look on laptop and phone are for the O-025 Full Objective Check.

Gates (run 2026-10-19, sandbox clock `date -u`: Mon Oct 19 10:57:14 UTC 2026): `npm run typecheck` passed; `npm run build` passed (existing chunk-size warning only); `npm test` 75 files, 1104 passed, 1 skipped (includes the driver guard test and the new `tests/moonFamilyPanel.test.ts`); `git diff --check` clean.

Files changed: `src/shell/MoonFamilyPanel.tsx` (new), `src/shell/moonFamilies.ts` (new), `src/shell/AstraeusShell.tsx`, `src/shell/Collapsible.tsx`, `src/shell/experience.ts`, `src/shell/infoModel.ts`, `src/shell/style.css`, `src/shell/controls.css`, `src/assets/moonCatalogue.ts`, `src/app/bodySet.ts`, `src/app/BodySetView.ts`, `src/app/OrbitSetView.ts`, `src/app/AstraeusScene.tsx`, `src/app/sceneBodySets.ts`, `src/app/App.tsx`, `src/experiences/jupiter-io/jupiterIo.ts`, `tests/moonFamilyPanel.test.ts` (new), `tools/validate/driver.mjs`, `tools/validate/browser-moon-panel.mjs` (new), `tools/validate/run-full.sh`, `docs/BROWSER_CHECKS.md`.

Extra reads beyond the Context Files (needed to wire the scene): `src/app/App.tsx`, `AstraeusScene.tsx`, `BodySetView.ts`, `OrbitSetView.ts`, `bodySet.ts`, `sceneBodySets.ts`, `sceneTargets.ts`, `src/shell/{experience,infoModel,objectModel,TopBar,ObjectControls}.ts*`, `style.css`, `phone.css`, `src/experiences/jupiter-io/jupiterIo.ts`, `src/assets/moonCatalogue.ts`, `data/moons/jupiter.json`, `tests/jupiterMoonsScene.test.ts`, `docs/BROWSER_CHECKS.md`, `tools/validate/run-full.sh`, `browser-jupiter-io.mjs`: to find where the highlight and the moon objects plug in.

Limitations and notes: nothing was seen in a browser. Placement of the left sheet and its button (bottom left above the timeline) may overlap the information panel on short screens; the pictures are crops of the equirectangular maps (a look the owner should judge); highlight makes dots a colour but not larger (one dot size per batch); the featured heading lights the big four's orbit lines only (they are full bodies, no dots). Drift note: none against Design; `.savepoint/Design.md` was not edited (the Jupiter/Io paragraph drift is already noted on O-025).
