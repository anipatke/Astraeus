---
id: T-108
title: Show a pointing hand and brighter name on laptop hover
objective: O-022
status: planned
depends_on: [{task: T-107, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o022-planning-20261020}
planned_writes: [src/app/scenePicking.ts, tests/scenePicking.test.ts, src/app/SceneLabels.ts, src/app/BodySetLabels.ts, src/app/AstraeusScene.tsx, src/app/App.tsx, src/shell/style.css]
---

# Show a pointing hand and brighter name on laptop hover

## Outcome

With a mouse, hovering over anything tappable (a planet, moon, the Sun, or its name tag) turns the cursor into a pointing hand and brightens that object's name tag gently. The brightening amount is a live slider in the Developer panel. Touch input shows no hover.

## User Check

On the preview at laptop size: move the mouse over the Moon and its tag in Apollo 11, and over Io and a small Jupiter moon: the hand appears and the tag brightens; off them the arrow returns. Drag the brightness slider in the Developer panel and see the change live.

## Done When

1. Hover uses the same picking module and candidates as the tap (one hit rule), mouse only.
2. Over a target the canvas cursor is `pointer`; elsewhere the default; a drag in progress keeps the drag cursor behaviour unchanged.
3. The hovered target's label brightens by a factor from a live setting (`hoverBrightness` or similar) shown as a slider in the Developer panel's display group, with a default the owner can tune (owner rule: tune looks via settings). Body-set hover naming still works and uses the same brightening.
4. The canvas exposes `data-pick-hover` (hovered id or empty) for the browser driver.
5. Unit tests: hover resolves the same target as a tap at the same point; touch pointer type yields no hover; setting default and limits are validated.
6. Gates: `npm run typecheck`, `npm run build`, `npm test`; the lite browser check passes with zero console errors.

## Context Files

`src/app/scenePicking.ts`, `tests/scenePicking.test.ts`, `src/app/SceneLabels.ts`, `src/app/BodySetLabels.ts`, `src/app/AstraeusScene.tsx`, `src/app/App.tsx`, `src/app/SettingControls.tsx`, `src/shell/Label.tsx`, `src/shell/style.css`.

## Design References

Design: "Shell layout (O-020)" (Developer panel); O-022 Confirmed Decision 3 and Planned Technical Decisions.

## Guardrails

ARCH-01, ARCH-02, TEST-01, TEST-03; STYLE rules.

## Implementation Plan

1. Reuse the first step's picking on mouse `pointermove` (throttled to the frame).
2. Set the canvas cursor and a hovered class or style on the label element.
3. Add the brightness setting and slider; feed it to the label style.
4. Add `data-pick-hover`; tests; gates and lite check.

## Boundaries

No change to what is tappable or to tap behaviour; no phone hover; no new browser scripts (third step).

## Technical Verification

Focused unit tests while iterating; at handoff the configured gates plus the lite browser check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record Design deltas here for reconciliation by T-109.
