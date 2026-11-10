---
id: T-296
title: Let apps set line colours and the label font and size
objective: O-065
status: planned
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

Pending execution.

## Drift Notes

Record architecture deltas; Design is reconciled in the last step of this Objective.
