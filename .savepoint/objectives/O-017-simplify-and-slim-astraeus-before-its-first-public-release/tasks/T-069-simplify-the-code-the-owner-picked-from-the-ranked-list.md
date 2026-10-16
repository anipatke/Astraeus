---
id: T-069
title: Simplify the code the owner picked from the ranked list
objective: O-017
status: planned
depends_on: [{task: T-066, requires: accepted}, {task: T-067, requires: clear}, {task: T-068, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o017-plan-20261017}
---

# Simplify the code the owner picked from the ranked list

## Outcome

Every candidate the owner ticked in `docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md` is simplified with behaviour unchanged, and the complexity and duplication signals for those files fall.

## User Check

The ranked list shows each ticked candidate marked done with its before and after figures. The demos look and behave as before.

## Done When

1. Each ticked candidate is done or returned to the owner with a reason; nothing outside the ticked list is restructured.
2. For each: behaviour-preserving (existing tests pass unchanged, or a changed test is listed with the reason), the code-health figure for that function or file recorded before and after.
3. If `LayeredRender` in `src/app/AstraeusScene.tsx` is ticked, it is split into named parts with one job each and the file's responsibilities are separated (STYLE-01, STYLE-02); scene behaviour is proven unchanged by the before/after pictures and the full scene scripts it touches.
4. No engine contract changes (`State`, `Trajectory`, `Provenance`, `TimelineEvent`, `ScalePolicy`); a needed change returns REPLAN REQUIRED.
5. Gates: typecheck, tests, both builds, validator, lite browser check, plus the full scripts for each area touched, zero console errors, fresh evidence directory.

## Context Files

`docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md`, `src/app/AstraeusScene.tsx`, `src/app/experienceDefinition.ts`, `src/experiences/showers/showerDefinition.ts`, `.savepoint/health/config.json`. Further files are exactly those named in the ticked rows; log each as a planned read.

## Design References

Design.md Components/Codebase Map and the sections for each touched area.

## Guardrails

ARCH-01, ARCH-02, ARCH-04, TEST-01, TEST-03, STYLE-01, STYLE-02, STYLE-07, STYLE-10, CODE-01.

## Implementation Plan

1. Take the ticked rows in order of risk, smallest first.
2. One commit-sized change per candidate, gates between them.
3. Record before and after figures per candidate.

## Boundaries

Only ticked candidates; no new features; no contract changes.

## Technical Verification

Configured gates, lite check, full scripts for touched areas, before/after pictures. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Components map and any restructured section (Task 7).
