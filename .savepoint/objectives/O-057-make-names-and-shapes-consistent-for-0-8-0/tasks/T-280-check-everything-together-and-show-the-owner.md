---
id: T-280
objective: O-057
title: Check everything together and show the owner
status: planned
depends_on: [{task: T-279, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o057-planning-20261107}
---

# Check everything together and show the owner

## Outcome

0.8.0 has one migration table, up-to-date docs and a reconciled Design, and the whole package is proved together before the Full Objective Check.

## User Check

On `localhost:5490` at 375x667 and 1280x720, open the demos and site and read the story panels, badges included. Read the migration table in the CHANGELOG.

## Done When

One CHANGELOG migration table covers every 0.8.0 change, with Voyagers and showers notes (`toDefinition` replacements, `swift-tuttle`, every rename), each row checked against the lock; README and API reference are regenerated and within limits; `Public API shape` is reconciled, including the T-260 span tension, and every drift note from this Objective is accounted for; `apiTypeLint` breaks and `apiOutsideTypes` entries are empty; the examples build; `npm run check:browser` passes once; the owner approves the look. Apply `docs/agents/verification.md`.

## Context Files

`.savepoint/objectives/O-057-make-names-and-shapes-consistent-for-0-8-0/Objective.md`, `packages/astraeus/CHANGELOG.md`, `packages/astraeus/README.md`, `.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)`, `docs/BROWSER_CHECKS.md`, `docs/agents/browser-policy.md`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-04, API-07, TEST-01, TEST-03.

## Implementation Plan

1. Compare the 0.7.0 surface with the lock and write the table. 2. Regenerate docs. 3. Reconcile Design and the drift notes. 4. Run the full gates, then `npm run check:browser` once. 5. Ask for the owner look.

## Boundaries

No publishing, no version bump (the release does that), and no changes inside the Voyagers or showers apps.

## Technical Verification

`npm run test:full`, `npm run check:engine-alone`, `npm run check:pack`, `npm run check:react-consumer`, then one `npm run check:browser`; the Full Objective Check reuses that browser run unless code changes after it. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read and changed, limitations.

## Drift Notes

Record architecture deltas for the last step of this Objective, which reconciles them in Design.
