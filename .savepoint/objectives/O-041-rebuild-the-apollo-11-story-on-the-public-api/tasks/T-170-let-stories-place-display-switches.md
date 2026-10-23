---
id: T-170
title: Let stories place display switches
objective: O-041
status: planned
depends_on: [{task: T-168, requires: clear}]
owner_validation: {required: false}
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

Pending execution.

## Drift Notes

Record the switch placement field and shared switch state for Design reconciliation in the Apollo rebuild Task.
