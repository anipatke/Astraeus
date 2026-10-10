---
id: T-026
title: Prove the plug-in point with a small made-up experience
objective: O-008
status: planned
depends_on: [{task: T-025, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: g004-plan-2026-10-10}
---

# Prove the plug-in point with a small made-up experience

## Outcome

A minimal synthetic experience mounts through the same plug-in contract as Apollo, contract-level tests and a browser smoke prove it, the generic name check covers app code, and `Design.md` is reconciled for O-008.

## Astraeus Hypothesis

- **Capability tested:** reuse of the app and shell with an experience that is not Apollo.
- **Contract reused:** the T-025 plug-in contract, `ExperienceConfig`, `Trajectory`, `Provenance`, `TimelineEvent`.
- **Gap or hypothesis:** the plug-in contract still hides Apollo assumptions (required anchors, Earth–Moon overview, spacecraft wording) that only a second experience reveals.
- **Generic change:** none expected; any needed fix to generic code is recorded and returned as REPLAN REQUIRED if it is more than a contract correction.
- **Perseids-independent evidence:** this Task is that evidence (ARCH-03).

## User Check

Open the app with the synthetic experience selected (the evidence names how) and see its own objects, events and labels in the same shell; confirm Apollo still opens normally.

## Done When

1. A synthetic experience fixture (for example one illustrative object on a simple trajectory with two events) lives outside generic code and uses only the plug-in contract.
2. Contract-level tests mount or assemble both Apollo and the synthetic experience through the same entry and assert the shell receives each one's configuration.
3. An automated name check fails if `apollo`, `columbia`, `eagle`, `perseid` or `meteor` appear in `src/core/`, `src/shell/` or generic `src/app/` code.
4. A headless browser smoke loads the synthetic experience with zero console errors and writes to a fresh run directory; Apollo browser scripts still pass.
5. `.savepoint/Design.md` describes the plug-in boundary and accounts for every Drift Note deferred from T-024 and T-025.

## Context Files

`docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md`, `.savepoint/objectives/O-008-audit-the-fit-and-make-experiences-pluggable/Objective.md`, `.savepoint/Design.md`, `src/main.tsx`, `src/app/App.tsx`, `src/mission/apollo11.ts`, `src/shell/experience.ts`, `src/core/sampledTrajectory.ts`, `src/core/provenance.ts`, `tests/metricVisuals.test.ts`, `tests/controls.test.ts`, `tools/validate/browser-shell.mjs`.

## Design References

Design: Components/Codebase Map, Interfaces and Data Flow, Current Technical State.

## Guardrails

ARCH-01, ARCH-03, PROV-01, TEST-01, TEST-03, STYLE-05, STYLE-09.

## Implementation Plan

1. Confirm T-025's contract is in place; return REPLAN REQUIRED if not.
2. Write the synthetic fixture with `illustrative` provenance.
3. Add contract tests for both experiences and the extended name check.
4. Add the browser smoke and run all browser scripts.
5. Reconcile Design and deferred Drift Notes.

## Boundaries

No Perseids data, no particle provider, no timeline spans, no core changes.

## Technical Verification

Handoff runs `npm run typecheck`, `npm run build`, `npm test` and all browser scripts. The Full Objective Check for O-008 follows per `agent-skills/references/check-method.md`; owner validation confirms the synthetic experience is visibly distinct from Apollo in the same shell.

## Technical Evidence

Pending execution.

## Drift Notes

Record any Apollo assumption the synthetic experience exposed.
