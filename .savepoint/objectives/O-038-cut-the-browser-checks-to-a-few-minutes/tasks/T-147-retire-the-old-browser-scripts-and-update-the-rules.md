---
id: T-147
title: Retire the old browser scripts and update the rules
objective: O-038
status: planned
depends_on: [{task: T-143, requires: clear}, {task: T-144, requires: clear}, {task: T-146, requires: clear}, {task: T-145, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o038-planning-20261023}
lane: close
---

# Retire the old browser scripts and update the rules

## Outcome

Only the smoke check and the two journeys remain as browser scripts. Every other browser script, the on-request folder and the engine and demo set commands are deleted (git history keeps them). `docs/BROWSER_CHECKS.md` maps every scenario of every retired script to its new home, and the project rules say: run `npm run check:browser` once at a Full Objective Check; no per-Task browser runs; no demo sets.

## User Check

Read the new short `docs/BROWSER_CHECKS.md` and the browser lines in AGENTS.md's Astraeus Project Rules; say whether they read right.

## Done When

- Retired scripts, `run-engine.mjs`, `run-demo.mjs`, `tools/validate/on-request/` and the scale-menu harness page (if nothing else uses it) are deleted; `check:engine` and `check:demo` are removed from `package.json`; nothing else imports them (search recorded).
- `docs/BROWSER_CHECKS.md` holds: how to run the one command, the smoke and journey contents, the driver and readouts sections kept, and a retired-scripts table mapping each scenario to a test file and case, "smoke", a journey, or "owner's look on the preview", with nothing unmapped (built from the three earlier steps' evidence).
- AGENTS.md (outside the Savepoint block): the Build section's browser line and the Browser checks rules name only `npm run check:browser`, once per Full Objective Check, no per-Task runs, no demo sets. `agent-skills/references/check-method.md` is checked for set names; if it names none, record "no change needed"; if it does, record an Issue suggestion rather than editing the packaged skill.
- Design.md reconciles the drift notes from the screen-parts and browser-command steps (pretend page; one browser command), and the browser lines in the `tools/validate/` row and Current Technical State.
- The fast suite time and one fresh `npm run check:browser` time are recorded, the latter only if scripts changed since the three timed runs; otherwise those runs are reused (one run per change rule). Configured gates pass.

## Context Files

`docs/BROWSER_CHECKS.md`, `AGENTS.md`, `CLAUDE.md`, `package.json`, `tools/validate/runner.mjs`, `tools/validate/run-browser.mjs`, `tools/validate/driver-guard.mjs`, `tests/browserDriverGuard.test.ts`, `agent-skills/references/check-method.md`, `.savepoint/Design.md`, plus the Technical Evidence of this Objective's four earlier steps.

## Design References

Design: the `tools/validate/` row; Current Technical State, browser validation paragraph.

## Guardrails

TEST-01, TEST-03; AGENTS.md Astraeus Project Rules on browser regression maintenance and historical evidence preservation (cited run folders stay).

## Implementation Plan

1. Gather the four earlier scenario maps; find any scenario none of them covers and stop with REPLAN REQUIRED if one cannot be mapped.
2. Delete the retired files and set commands; fix imports and the driver guard's file list.
3. Rewrite `docs/BROWSER_CHECKS.md` with the mapping table.
4. Update the AGENTS.md project rules and Build lines; check `check-method.md`.
5. Reconcile Design.md.
6. Run gates; ask the owner to read the new rules.

## Boundaries

No change to what visitors see. Cited evidence folders under `docs/evidence/` stay. No editing of packaged skills. No screenshots.

## Technical Verification

Configured gates at hand-off; browser run reuse per the one-run-per-change rule. The Full Objective Check runs `npm run check:browser` once. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Reconciles the screen-parts and browser-command drift notes into Design.md.
