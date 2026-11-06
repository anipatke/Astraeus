---
id: T-273
objective: O-059
title: Check everything together and show the owner
status: planned
depends_on: [{task: T-272, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o059-planning-20261106}
---

# Check everything together and show the owner

## Outcome

The public features, demos and site are reconciled in the Design and docs, the size limits hold, and the owner has judged the look.

## User Check

Open `localhost:5490`: Apollo, a shower, Jupiter with its moon panel and places, and another planet, at 375x667 and 1280x720, look as they did.

## Done When

Design describes the implemented reality, with every deferred drift note accounted for; the Objective's Success Conditions are each evidenced; the API reference page is within its limit in `load-budget.mjs`; the owner's words on the look are recorded after the integration evidence. Apply `docs/agents/verification.md` for evidence.

## Context Files

`docs/architecture/o059-public-forms.md`, `.savepoint/Design.md` under `Components/Codebase Map`, `docs/architecture/state-and-assets.md` under `Experience plug-in boundary`, `docs/agents/browser-policy.md`, `docs/BROWSER_CHECKS.md`, `packages/astraeus-site/tools/validate/load-budget.mjs`, `packages/astraeus/CHANGELOG.md`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-07, ARCH-03, TEST-01, TEST-03.

## Implementation Plan

1. Reconcile Design and account for each drift note. 2. Build the public site and measure page budgets. 3. Start the preview and hand the owner the addresses. 4. Record the owner's look.

## Boundaries

Fix-ups for what this finds only; a new gap becomes an Issue.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:pack`. Owner look on `localhost:5490`. No browser run: the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas; deferred Design notes go to the final step of this Objective, named here as the integration Task.
