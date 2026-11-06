---
id: T-269
objective: O-059
title: Let any app put its own picker in the top bar
status: planned
depends_on: [{task: T-268, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o059-planning-20261106}
---

# Let any app put its own picker in the top bar

## Outcome

An app can offer a choice in the viewer's top bar and phone drawer and hear what the visitor picks; the viewer does nothing else, and the host decides what happens.

## User Check

Read the README entry; a test picks an option and the host hears it.

## Done When

The same ability works on `mount` and React (API-02), keeps two viewers apart (API-03), and the private `switcher` address behaviour is no longer the only way; a host can keep the clock time across a choice using public calls; lock, README and CHANGELOG are updated. Apply `docs/agents/verification.md` for evidence.

## Context Files

`docs/architecture/o059-public-forms.md`, `packages/astraeus/src/shell/SwitchControl.tsx`, `packages/astraeus/src/shell/TopBar.tsx`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/listSwitch.ts`, `packages/astraeus/src/api/viewerHandle.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-02, API-03, API-04, API-06, ARCH-01, ARCH-03, TEST-01.

## Implementation Plan

1. Add the public picker setting and its signal. 2. Draw it through the existing control. 3. Run the shared lifecycle suite on both paths. 4. Lock, README, CHANGELOG.

## Boundaries

The signal only: no navigation built into the engine. The site moves onto it in a later step.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone` and `npm run check:pack`. No browser run: the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas; deferred Design notes go to the final step of this Objective, named here as the integration Task.
