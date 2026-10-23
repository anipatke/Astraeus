---
id: T-170
title: Let stories place display switches
objective: O-041
status: done
depends_on: [{task: T-168, requires: clear}]
owner_validation: {required: false}
check_waiver:
  task: T-170
  reason: 'Owner chose "New step in this Apollo part (Recommended)" for placeable switches; standing rule of no per-step checks and one Full Objective Check at the end.'
  actor: {role: owner, session: o041-run-20261024}
  recorded_at: '2026-10-23T21:34:47Z'
planned_by: {role: planner, session: o041-planning-20261024}
---

# Let stories place display switches

## Outcome

A developer can choose, for each display switch (orbit lines, labels, Milky Way picture), whether visitors see it on the top bar, in a story switch panel opened from the top bar, or only in the Developer drawer, and whether it starts on or off; every switch stays in the Developer drawer as today.

## User Check

None required on its own; the owner sees it in the example and may choose to place switches on Apollo at the Apollo look.

## Done When

- A public call (e.g. `scene.setSwitches({ orbitLines: { place: "top-bar", on: true }, labels: { place: "panel" }, milkyWay: { place: "developer", on: false } })` — the builder may pick the exact name and shape, documented with its reason) with `place` one of top bar / story panel / developer only, and a starting state.
- **Orbit lines** is one switch covering the orbit ring, trailing arc and moon orbits; **labels** covers body labels and anchor labels; **Milky Way** the sky picture. Each drives the same state as its existing Developer-drawer buttons, so the two never disagree.
- Top-bar switches render as top-bar buttons (`aria-pressed`, accessible name); panel switches render in one story switch panel opened from a top-bar button; both work in the phone layout (top drawer) with no overlaps at 375x667 and 1280x720 (owner rule: panels no collisions, phone first). With no switches placed, the top bar is exactly as today.
- Existing demos (Apollo, showers, planets) and the site are unchanged by default.
- Made-up configuration tests (ARCH-03): each place, each starting state, the Developer-drawer button and the placed switch staying in step, phone layout rendering, a bad switch name or place throwing a `SceneError`.
- `examples/hello-scene` places at least the orbit-lines switch on the top bar and one switch in the panel; its browser step reads them through `packages/astraeus-site/tools/validate/driver.mjs` (any driver change mapped in `docs/BROWSER_CHECKS.md`).
- Doc comments and a place on `/api`; README and CHANGELOG mention it.
- Hand-off gates green, plus `npm run check:engine-alone`, `npm run check:pack`, `npm run build:example`.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/api/errors.ts`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/DeveloperSettings.tsx`, `packages/astraeus/src/app/experienceDefinition.ts`, `packages/astraeus/src/shell/TopBar.tsx`, `packages/astraeus/src/shell/TopBar.css`, `packages/astraeus/src/shell/AstraeusShell.tsx`, `packages/astraeus/src/shell/ControlsDrawer.tsx`, `packages/astraeus/src/shell/topBarIcons.tsx`, `packages/astraeus/src/shell/phone.css`, `examples/hello-scene/src/main.js`, `packages/astraeus-site/tools/validate/check-hello-scene.mjs`, `packages/astraeus-site/tools/validate/driver.mjs`, `packages/astraeus-site/tools/site/api-reference.mjs`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`.

## Design References

Design Interfaces and Data Flow (shell, Developer drawer), Current Technical State O-020 (phone layout), O-040.

## Guardrails

ARCH-02, ARCH-03, STYLE-06, STYLE-07, TEST-01, TEST-03, CODE-01.

## Implementation Plan

1. Lift the three switches' state so the Developer buttons and placed switches share one source.
2. Definition field for placement and starting state; Scene call over it.
3. Top-bar buttons and the story switch panel, desktop and phone.
4. Tests; hello-scene and its browser step; reference, README, CHANGELOG.

## Boundaries

Only the three switches named; no arbitrary custom panels or React hooks; no change to existing demos' looks.

## Technical Verification

Hand-off gates plus `check:engine-alone`, `check:pack`, `build:example`; the hello-scene browser step alone once if its script changes (never `check:browser`). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built by a Sonnet builder session, o041-run-20261024. Stopped at `stage: audit`; not marked done, not committed, router untouched. Optional Task Check waived (see `check_waiver`).

**Public call.** `scene.setSwitches({ orbitLines?, labels?, milkyWay? })`, each `{ place: "top-bar" | "panel" | "developer", on?: boolean }`; type `SwitchesInput` exported; later calls replace the same switch; a bad name, place or `on` throws `SceneError` code `bad-switch`. Reason for the shape: one object keyed by switch name matches the owner's example, keeps the three switches closed (no custom panels), and lets a story place one without touching the others. A placed switch the scene has nothing for (orbit lines with no orbit, Milky Way with the sky off) shows nowhere.

**Per criterion.**
1. Public call with place and starting state: `Scene.setSwitches` (`packages/astraeus/src/api/scene.ts`, `switches.ts`); `tests/displaySwitches.test.ts` "Scene.setSwitches" (each place, both starting states, replacement across calls). Met.
2. Orbit lines = ring + trailing arc + moon orbits; labels = body labels + anchor labels; Milky Way = sky picture; same state as the Developer buttons: `app/displaySwitches.ts` derives each switch from the existing Developer state (`orbitShown`, `setLook.orbitsOn`, `hiddenLabels`/`anchorLabels`, `milkyWayOn`) and writes through the same setters, so nothing is duplicated. Tests "switches and the Developer drawer share one state" (toggle writes all parts; a Developer button on one layer keeps the switch on; labels likewise). Met.
3. Top-bar buttons (`aria-pressed`, accessible name) and one panel opened from a top-bar "Switch panel" button (`aria-expanded`, Escape and outside press close it); phone drawer shows the same, a bar switch closes the drawer like the camera buttons; nothing placed draws nothing extra. Tests "the top bar and the switch panel" (draws nothing when none placed; bar button; panel; phone drawer). No-overlap at 1280x720 and 375x667: browser step `switchPanelFit` (inside window, clear of cog, timeline, info, story, pill) PASS at both sizes. Met.
4. Existing demos and site unchanged by default: `displaySwitches` is absent from their definitions, the new code paths run only when it is present (`displaySwitchItems` returns [], start-state helpers return nothing); full suite green. Met (not looked at by eye; owner judges looks on the preview).
5. Made-up configuration tests (ARCH-03): `tests/displaySwitches.test.ts`, 25 cases: each place, each starting state, Developer button and switch in step, phone layout rendering, bad name/place/on/no object throwing `bad-switch`. `domSetup.ts` `mountShell` gained a `displaySwitches` option. Met.
6. `examples/hello-scene` places orbit lines on the top bar, labels in the panel, Milky Way developer-only and off; its browser step reads them through the driver (new driver functions `displaySwitchPlaces`, `displaySwitchOn`, `toggleDisplaySwitch`, `switchPanelFit`, `visibleSceneLabelCount`; mapped in `docs/BROWSER_CHECKS.md`). Met.
7. Doc comments on `setSwitches` and `SwitchesInput`, generated onto `/api` from them; README table row; CHANGELOG entry. Met (the generated /api page was not regenerated or viewed here; the generator reads the public types, and the doc-comment test passes).
8. Gates: see below. Met.

**Commands run.** `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test` 123 files, 1658 passed, 1 skipped (includes the new 25 and the driver guard); `npm run check:engine-alone` pass (18.2 s); `npm run check:pack` pass (12.3 s); `npm run build:example` pass. hello-scene browser step alone, once: `HELLO_STORY=1 ASTRAEUS_URL=http://localhost:5496/ ASTRAEUS_EVIDENCE_DIR=docs/evidence/browser-20261023T213403Z-hello-scene node packages/astraeus-site/tools/validate/check-hello-scene.mjs` against `vite preview` of the built example: ok true at desktop and phone, no errors; evidence `docs/evidence/browser-20261023T213403Z-hello-scene/` (summary.txt, results.json). `npm run check:browser` not run; no screenshots.

**Files read** (Context Files): scene.ts, index.ts, errors.ts, App.tsx, DeveloperSettings.tsx, experienceDefinition.ts, TopBar.tsx/css, AstraeusShell.tsx, ControlsDrawer.tsx, topBarIcons.tsx, phone.css, hello-scene main.js, check-hello-scene.mjs, driver.mjs, api-reference.mjs (only searched), README, CHANGELOG. **Extra reads, logged:** `api/story.ts` (error-handling pattern for the new validator), `shell/controls.css` (button classes and pressed styling), `shell/ObjectControls.tsx` and `ScaleControl.tsx` (button and outside-press pattern to match), `assets/orbitLook.ts` (the orbit state the switch drives), `app/SceneLabels.ts` (label element hook for the browser readout), `tests/domSetup.ts` and `tests/publicApiStory.test.ts` (test patterns), `packages/astraeus-site/tools/validate/run-browser.mjs` and `harness.mjs` (how to run the step alone), `docs/BROWSER_CHECKS.md`.

**Files changed.** packages/astraeus/src: api/errors.ts, api/index.ts, api/scene.ts, api/switches.ts (new), app/App.tsx, app/experienceDefinition.ts, app/displaySwitches.ts (new), shell/AstraeusShell.tsx, shell/DisplaySwitches.tsx (new), shell/TopBar.tsx, shell/TopBar.css, shell/phone.css, shell/topBarIcons.tsx; packages/astraeus/tests/displaySwitches.test.ts (new), tests/domSetup.ts; packages/astraeus/README.md, CHANGELOG.md; examples/hello-scene/src/main.js; packages/astraeus-site/tools/validate/check-hello-scene.mjs, driver.mjs; docs/BROWSER_CHECKS.md; docs/evidence/browser-20261023T213403Z-hello-scene/ (new).

**Limitations.** Not verified: the look of the bar button, the panel and the phone grid by eye; the generated /api page; Milky Way switch toggling in a real browser (the example places it developer-only, so only its off start was read); the starting `on: false` for orbit lines and labels is covered by unit tests of the start-state helpers, not read in a browser; moon-orbit (body set) switching is covered only through the pure bindings test, no scene with body sets was run. Turning labels on also turns anchor labels on when the scene has paths, and clears any `showLabel: false` hiding.

## Drift notes (for the Apollo-rebuild Design reconciliation)
Placement field: `ExperienceDefinition.displaySwitches` (`DisplaySwitchSettings`, `app/displaySwitches.ts`), set by `Scene.setSwitches`. Shared switch state: no new store; each switch is derived from the Developer drawer's existing state (orbit look, moon-set look, hidden labels and anchor labels, Milky Way flag) by `displaySwitchItems`, and `AstraeusShell`/`TopBar` take a `displaySwitches` item list rendered by `shell/DisplaySwitches.tsx`. Start `on` is applied in `App.tsx` (`labelStart`, `startOrbitControls`, `skySettingsOf`); the address (`?labels=`, `?sky=`) still overrides it.


## Drift Notes

Record the switch placement field and shared switch state for Design reconciliation in the Apollo rebuild Task.
