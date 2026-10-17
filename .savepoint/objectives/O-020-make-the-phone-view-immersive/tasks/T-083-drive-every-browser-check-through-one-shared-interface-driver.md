---
id: T-083
title: Drive every browser check through one shared interface driver
objective: O-020
status: planned
depends_on: [{task: T-079, requires: clear}, {task: T-080, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o017-orchestrator-check-20261017}
---

# Drive every browser check through one shared interface driver

## Outcome

Every browser check script talks to the app through one shared driver module (set the scale, play, pause, step to the next or previous event, pick a body, open info, open a story panel, set the speed, seek, open and close a drawer, read the time). Only the driver knows what the buttons look like, so an interface change edits one file, not every script.

## User Check

Change a button's look in one place and only the driver needs updating; the full run still passes.

## Done When

1. Owner, 2026-10-17, on T-079 touching 17 browser scripts for one top-bar change: "if this is meant to be re-usable set of assets...why it it updating so many files, feels like a terrible design", then "yes add that step PLEASE". The cause: each script finds and clicks interface elements itself, by visible text, with the same code copied across scripts.
2. A driver module under `tools/validate/` (building on T-079's `shellScale.mjs` and `harness/`), one function per user action and per readout listed in the Outcome, finding elements by accessible name or a stable `data-testid` only, never by visible text or layout.
3. Every script in `tools/validate/` and `tools/validate/on-request/` uses the driver for every interface interaction; a test or lint step fails if a script outside the driver calls `getByRole`, `getByText`, `locator(...)` on shell controls, or `page.click` on them (scene canvas and data-attribute readouts excepted, stated in the rule).
4. No scenario lost: each script's pass/fail scenarios are unchanged, the trimmed full run passes, and a probe proves the point: renaming one control's visible label touches only the driver and the full run still passes.
5. AGENTS.md project rule "Browser regression maintenance" gains one line: browser scripts interact with the interface only through the shared driver.
6. Gates and the full run on the final tree.

## Context Files

`tools/validate/` (all scripts), `tools/validate/shellScale.mjs`, `tools/validate/harness/`, `tools/validate/run-full.sh`, `docs/BROWSER_CHECKS.md`, `AGENTS.md` (project rules section only).

## Design References

Design.md validation tooling; `docs/BROWSER_CHECKS.md`.

## Guardrails

TEST-01, TEST-03, STYLE-01, STYLE-07 (one source of truth).

## Implementation Plan

1. Inventory every interface interaction across the scripts; design the driver's functions.
2. Move scripts onto it, one area at a time, running each script after its move.
3. The guard against direct interaction; the rename probe; the full run.

## Boundaries

Test tooling only; no app or engine change except adding a `data-testid` where an accessible name is ambiguous.

## Technical Verification

Configured gates, the guard, the rename probe, the full run. Evaluated under `agent-skills/references/check-method.md`.
