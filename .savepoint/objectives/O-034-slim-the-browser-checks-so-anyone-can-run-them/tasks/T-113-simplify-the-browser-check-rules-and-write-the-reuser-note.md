---
id: T-113
title: Simplify the browser-check rules and write the reuser note
objective: O-034
status: planned
depends_on: [{task: T-111, requires: clear}, {task: T-112, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o034-planning-20261020}
planned_writes: [AGENTS.md, docs/BROWSER_CHECKS.md, README.md, .savepoint/Design.md]
---

# Simplify the browser-check rules and write the reuser note

## Outcome

The project rules on browser checks are one short rule, `docs/BROWSER_CHECKS.md` is a short map of both sets, a reuser can find how to run the checks in a few lines, and Design describes the checks as built, with measured times.

## User Check

Read the browser-check rule in AGENTS.md's Astraeus Project Rules and the "Running the checks" note: each fits on a screen and says what to run and when. Read the map: every kept, moved or dropped scenario is there.

## Done When

1. AGENTS.md's Astraeus Project Rules (outside the Savepoint-managed block only) replace the "Scene-affecting fuller gate" tiers with Confirmed Decision 4 in plain words; the "no screenshots", "shared driver" and "regression maintenance" rules are kept but shortened; references to `run-full.sh`, the lite tier and the donor `PLAYWRIGHT_CORE` path are gone.
2. `docs/BROWSER_CHECKS.md` rewritten as a short map: engine set and each demo set, script to scenarios; a "dropped" list with reasons; the moves recorded by the earlier steps.
3. A "Running the checks" section for reusers (README or `docs/`), a few lines: install, `npm test`, `npm run check:engine`, optional demo sets.
4. Design: the `tools/validate/` Codebase Map row and Current Technical State reconciled from every drift note of this Objective's Tasks, or each marked non-architectural with a reason.
5. Times measured on an idle machine, one run each: engine set under 300 s; each demo set recorded.
6. Gates: typecheck, build, test. Owner reads the rule and the note (owner validation).

## Context Files

`AGENTS.md`, `docs/BROWSER_CHECKS.md`, `README.md`, `.savepoint/Design.md`, `package.json`, `tools/validate/run-engine.mjs`, `tools/validate/run-demo.mjs`, and the Technical Evidence and Drift Notes of this Objective's earlier Tasks.

## Design References

O-034 Confirmed Decision 4 and Success Conditions 4-5; Design Components/Codebase Map.

## Guardrails

TEST-03; STYLE rules.

## Implementation Plan

1. Read the earlier Tasks' evidence and drift notes.
2. Rewrite the rule, the map and the note.
3. Reconcile Design.
4. Measure the sets; gates; ask the owner to read.

## Boundaries

Never edit the Savepoint-managed block of AGENTS.md or CLAUDE.md; no script changes beyond fixing a doc reference.

## Technical Verification

Configured gates and the measured runs; evaluated under `agent-skills/references/check-method.md`. The Full Objective Check runs the engine set and the three demo sets once each.

## Technical Evidence

Pending execution.

## Drift Notes

This step is the O-034 integration and Design reconciliation Task.
