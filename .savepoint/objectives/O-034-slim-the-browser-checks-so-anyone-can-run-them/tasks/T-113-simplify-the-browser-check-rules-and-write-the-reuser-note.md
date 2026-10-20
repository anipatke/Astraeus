---
id: T-113
title: Simplify the browser-check rules and write the reuser note
objective: O-034
status: done
check_waiver:
  task: T-113
  reason: Owner skips per-Task checks for O-034; one Full Objective Check at the end.
  actor: {role: owner, session: o034-run-20261020}
  recorded_at: '2026-10-20T10:37:06Z'
depends_on: [{task: T-111, requires: clear}, {task: T-112, requires: clear}]
owner_validation: {required: true, accepted_check: C-090, accepted_by: {role: owner, session: o034-run-20261020}}
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

Owner waiver: per-Task Check waived for O-034 (check_waiver in frontmatter); the Full Objective Check covers this Task.

Criteria:
1. Met. AGENTS.md Astraeus Project Rules: the tiers rule is one "Browser checks" rule (engine set at the Full Objective Check when scene, camera, controls or UI changed; demo set only when that demo or its checks changed or before a release; never run a set twice for one change; no per-Task browser runs unless the Task builds the checks). Screenshots, regression-maintenance and driver rules kept, shortened. No mention of run-full.sh, lite/touched/full tiers or the donor PLAYWRIGHT_CORE path remains in AGENTS.md; managed block untouched.
2. Met. docs/BROWSER_CHECKS.md rewritten (205 to about 90 lines): engine set and demo sets with what each script asserts, on-request list, dropped list with reasons (from T-111 and T-112 evidence), driver table, guard, scene readouts.
3. Met. README.md "Running the checks" (install, browser install, npm test, check:engine, check:demo).
4. Met. Design.md: tools/validate/ Codebase Map row rewritten from the T-110, T-111, T-112 drift notes; src/synthetic row gains the T-111 anchors and panels; the stale "Current browser validation" paragraph replaced by a pointer. T-110 drift (run-full.sh removal, playwright.mjs, runner) reflected; T-111 (shell/layout/jupiter-tap, sky to on-request, scene= in summary) reflected; T-112 (smoke step, STORY_ONLY, set lists, 390 s/248 s) reflected. No drift note left unaccounted for.
5. Cited, not rerun (owner: no reruns): engine 275 s (docs/evidence/engine-20261020T092052Z); apollo 227 s, jupiter 248 s, showers 390 s (T-112 runs). driver.mjs is unchanged since the T-111 commit (git status clean), so the engine run still stands; the final Full Objective Check reruns the engine set once. Showers and Jupiter are over the 240 s aim; owner accepted at T-112.
6. Gates: typecheck clean; build ok; npm test 79 files, 1143 passed, 1 skipped. Owner validation open: read the rule and the note.


## Drift Notes

This step is the O-034 integration and Design reconciliation Task.

Repair for I-047 (coordinator, 2026-10-20T10:43:49Z): `docs/BROWSER_CHECKS.md` "Dropped, with reasons" now names the four groups (Apollo anchor labels moved to the made-up scene, demo view links moved, the Jupiter-Io orbit-motion run dropped, sky demo and phone runs dropped on the move to on-request) and says the Apollo-only shell cases are kept in `browser-apollo-shell`. Also fixed the Design.md `src/synthetic/syntheticDefinition.ts` row (the T-111 note had become a third cell; C-089 observation). Documentation only; no script or browser run.

Owner read the new browser-check rule and the "Running the checks" note and said "Ok" (2026-10-20); closed through the coordinator on 2026-10-20T10:46:03Z, accepted against C-090 (CLEAR, supersedes C-089).
