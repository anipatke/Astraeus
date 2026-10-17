---
id: T-079
title: Slim the top bar into one compact row of icons
objective: O-020
status: planned
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
