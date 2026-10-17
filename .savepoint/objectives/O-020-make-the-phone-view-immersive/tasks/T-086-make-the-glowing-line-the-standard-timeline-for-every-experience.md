---
id: T-086
title: Make the glowing line the standard timeline for every experience
objective: O-020
status: planned
depends_on: [{task: T-084, requires: clear}, {task: T-081, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Make the glowing line the standard timeline for every experience

## Outcome

Every experience's timeline is the glowing line T-084 built for the showers: the same glow, halo, played colour and cream thumb. Where an experience has no activity data, the line glows evenly; the old plain track is gone.

## User Check

Open Apollo 11, Earth–Moon and Jupiter–Io: the timeline is the same glowing line as the showers, evenly lit, the played part in the accent colour. The showers still brighten around their peak.

## Done When

1. Owner, 2026-10-18, after approving the glow on the showers: "can we make this the standard tieline, discard the old one". The shell always draws `.timeline-glow`; the plain-track styling for experiences without a rate is removed (no second look kept).
2. Generic (ARCH-01): without a rate the profile is flat at a "steady brightness" setting; with a rate it is unchanged from T-084. No experience names.
3. Steady brightness is a live setting beside the other Timeline glow settings (owner rule); the Timeline glow settings group shows for every experience, not only those with a rate. Event and panel marks stay readable on the glow.
4. Text equivalents: experiences without a rate get no activity tooltip or peak text (nothing to report); the slider's accessible name and value text are unchanged.
5. Browser checks that asserted a plain track or no glow (driver `glowCount` users in `browser-shell`, `browser-synthetic`, `browser-showers` and others) are updated through the shared driver; each scenario mapped (TEST-03); full run passes; phone and desktop pictures of a non-shower experience.
6. Owner validation: the owner looks at a non-shower experience.

## Context Files

`src/shell/timelineGlow.ts`, `src/shell/TimelineBar.tsx`, `src/shell/TimelineBar.css`, `src/app/SettingControls.tsx`, `src/app/App.tsx`, `tools/validate/driver.mjs`, browser scripts using the glow readouts, T-084's Evidence, `.savepoint/objectives/O-020-make-the-phone-view-immersive/Objective.md`.

## Design References

T-084 (glow design); Design.md shell.

## Guardrails

ARCH-01, ARCH-02, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Flat profile and steady-brightness setting; always draw the glow; remove the plain track.
2. Driver and scripts; full run; owner look.

## Boundaries

The timeline track's look only; built after T-081 merges because both edit the timeline files.

## Technical Verification

Configured gates, lite, full run, pictures. Evaluated under `agent-skills/references/check-method.md`.
