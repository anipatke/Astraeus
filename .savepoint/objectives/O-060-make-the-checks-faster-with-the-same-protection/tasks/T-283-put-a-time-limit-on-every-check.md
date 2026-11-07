---
id: T-283
objective: O-060
title: Put a time limit on every check
status: done
depends_on: [{task: T-282, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o060-planning-20261107}
check_waiver: {task: T-283, reason: 'Owner said "orchestrate o60" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o060-run-20261107}, recorded_at: '2026-11-07T08:30:00Z'}
---

# Put a time limit on every check

## Outcome

Every gate has a stated time limit that warns when passed, so slow growth is seen at once, and the gains are proved and written down.

## User Check

Read the before and after table in `docs/agents/build.md`, and see the warning line in a planted over-limit run.

## Done When

One file states each gate's time limit, set from the measured times with room for ordinary variation. `check:browser` reports each step against its limit in its summary; other gates are reported by one command that runs them and states time against limit. An overrun prints a warning and never changes the exit code, proved by a test with a planted limit. `docs/agents/build.md`, `docs/BROWSER_CHECKS.md` and Design state the new times and limits, and every drift note from this Objective is accounted for. Before and after timings for every gate, on an idle machine, are recorded. Full gates pass, with one `npm run check:browser` run.

## Context Files

`.savepoint/objectives/O-060-make-the-checks-faster-with-the-same-protection/Objective.md`, `docs/agents/build.md`, `docs/BROWSER_CHECKS.md`, `docs/agents/browser-policy.md`, `packages/astraeus-site/tools/validate/run-browser.mjs`, `package.json`, `.savepoint/config.yml`, `.savepoint/Design.md` under `Current Technical State`.

## Design References

`Current Technical State`.

## Guardrails

TEST-01, TEST-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Write the limits file. 2. Add the summary lines and the gate timing command. 3. Prove the warning. 4. Measure on an idle machine. 5. Update docs and Design. 6. Run the full gates once.

## Boundaries

A limit never fails a run on time alone. No test removed. No change to `quality_gates` commands unless needed to report time.

## Technical Verification

`npm run test:full`, `npm run check:engine-alone`, `npm run check:pack`, `npm run check:node-consumer`, `npm run check:react-consumer`, then one `npm run check:browser`; the Full Objective Check reuses that run unless code changes after it. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Session: builder, 2026-11-07, branch o060-faster-checks. Task Check waived by the owner's plan (handed off at audit; no waiver record written by the builder). Extra reads: none beyond Context Files, `agent-skills/savepoint-task/SKILL.md`, `docs/agents/verification.md`, and the T-281/T-282 Task files and `.savepoint/Design.md` headings for the drift notes.

Done When to proof:

| Done When item | Proof |
|---|---|
| One file states each gate's limit, from measured times with room | `tools/gate-limits.json` (9 gates, browser total, 10 steps). Room allowed: long gates about 1.4 to 1.6 times the slowest measured (test 41 s to 65 s; test:full 72 s to 105 s; check:browser 233 s to 320 s; smoke 123 s to 170 s), short gates several times (start-up dominated, e.g. lint 3.6 s to 15 s). Busy-machine readings seen this session: `npm test` 46 s, `check:pack` 18 s, both within limits. Test "states a positive limit ...", "covers every npm gate ... and every step in run-browser.mjs" (limit keys equal the step names parsed from run-browser.mjs) |
| `check:browser` reports each step against its limit in its summary | `runner.mjs` `runStep` adds `limit Ns` to each step line and the total line; real run `docs/evidence/browser-20261107T080721Z/summary.txt` shows every step with its limit |
| Other gates reported by one command stating time against limit | `npm run check:gates` (`tools/time-gates.mjs`), run 3 times; output lines like `test \| passed \| 41s \| limit 65s` |
| Overrun prints a warning and never changes the exit code, proved with a planted limit | `gateLimits.test.ts`: "a timed gate over a planted limit prints a warning and still passes" (limit 1 s, 1.2 s sleep, `ok` true); "the timed command exits 0 over a planted limit through the real command line"; "the browser runner summary warns past a planted total and exits 0" (planted total -1: one WARNING line, exit 0); "a failing gate still fails" (exit code follows the gate only) |
| A run within its limit prints no warning | "a timed gate within its limit prints no warning"; the same browser-runner test with total 600 prints no warning (one warning in two runs); real runs of `check:gates` and `check:browser` printed none |
| `build.md`, `BROWSER_CHECKS.md`, Design state the new times and limits | `docs/agents/build.md` (browser bullet, timed-gates bullet, before/after/limit table); `docs/BROWSER_CHECKS.md` ("What it runs" heading now about 230 s; "Time limits" table by step); `.savepoint/Design.md` Current Technical State paragraph "Gate times and limits (O-060)". Docs cannot drift silently: tests "docs/agents/build.md has a row per gate ending in its limit" and "docs/BROWSER_CHECKS.md has a row per step ending in its limit" fail if a limit differs from the file |
| Every Objective drift note accounted for | Drift table below |
| Before and after timings for every gate, idle machine | Timing table below |
| Full gates pass, one `npm run check:browser` | Gates below; browser run `browser-20261107T080721Z`, 233 s, every step exit 0, error-lines 0 |

Timing (wall clock, idle: load average 0.79 at start; before = baseline 6aad8e6a from the Objective; after = one clean `npm run check:gates` run, two further runs on a slightly busier machine in brackets):

| Gate | Before | After | Limit |
|---|---|---|---|
| lint | 3.5 s | 3.6 s (3.4, 3.4) | 15 s |
| typecheck | 5.6 s | 5.6 s | 20 s |
| build | 2.3 s | 2.4 s | 15 s |
| test | 42 s | 41 s (46, 45.7) | 65 s |
| test:full | 72 s | 72.4 s (75.3, 73) | 105 s |
| check:engine-alone | 25 s | 22.7 s (21.3, 20.3; 18.8 to 19.1 in T-282) | 40 s |
| check:pack | 14 s | 14.2 s (18.2, 18.2) | 30 s |
| check:node-consumer | 5 s | 4.6 s | 15 s |
| check:react-consumer | 9 s | 9 s (4.3, 4.4: npm cache warm) | 25 s |
| check:browser | 353 s | 233 s (231, 231, 229 in T-281) | 320 s |

T-282's 30 s aim for `npm test` was not met and is not presented as met: it stays about 41 s, bound by the Apollo determinism pair (two `reconstruct` runs, about 26 s alone) and the pack build (about 14 s). The browser target (about 230 s, owner-moved from 180 s) was met; the two synthetic-journey sizes run side by side by the owner's choice.

Drift-note accounting:

| Note | Where it is accounted for |
|---|---|
| T-281: docs say about 6 minutes | Fixed: `docs/BROWSER_CHECKS.md` heading and `docs/agents/build.md` browser bullet say about 230 s; no "6 minutes" or 340/355 s remains in docs or Design (grep) |
| T-281: BROWSER_CHECKS.md needs new driver functions and `assertion-list.mjs` | Fixed: a "Settling" row in the driver table and an assertion-list paragraph in `docs/BROWSER_CHECKS.md` |
| T-281: settle waits return the last value at timeout, the assertion decides | Reflected in `docs/BROWSER_CHECKS.md` ("Settling" row) and in Design.md Current Technical State |
| T-281: git-rebuild test does nothing in a clone without 6aad8e6a | Reflected in `docs/BROWSER_CHECKS.md` (assertion list paragraph) and Design.md Current Technical State |
| T-281: two journey sizes side by side (owner-accepted) | Reflected in `docs/agents/build.md`, `docs/BROWSER_CHECKS.md` and Design.md |
| T-282: no architecture delta; `pastTheEntry` is tool behaviour | Explicitly non-architectural: tool behaviour inside `tools/check-packs.mjs`, not a Design fact. Its finding (npm test bound by the Apollo pair and pack build, 30 s not met) is stated in `build.md` and Design.md |
| T-283 (new): limits file, `check:gates`, summary warnings | Reflected in `build.md`, `BROWSER_CHECKS.md`, Design.md |

Gates run (all pass): `npm run lint`, `npm run typecheck`, `npm run build`; `npm test` with the junit reporter (232 files, 3299 passed, 2 skipped; was 3288, +11 new cases in `gateLimits.test.ts`, none removed); `npm run test:full`, `check:engine-alone`, `check:pack`, `check:node-consumer`, `check:react-consumer` (each 3 times via `check:gates`, all passed; the first two passes of `test:full` failed only because the docs tables did not yet exist, which the new docs test correctly caught); then one `npm run check:browser`: `docs/evidence/browser-20261107T080721Z`, 233 s, every step passing. Nothing after that run changed code (only this Task file).

Files read: Context Files; `docs/agents/verification.md`, `build.md`, `browser-policy.md`; `runner.mjs`, `run-browser.mjs`; T-281 and T-282 evidence.
Files changed: new `tools/gate-limits.json`, `tools/gate-limits.mjs`, `tools/gate-limits.d.mts`, `tools/time-gates.mjs`, `tools/time-gates.d.mts`, `packages/astraeus-site/tools/validate/runner.d.mts`, `packages/astraeus-site/tests/gateLimits.test.ts`; changed `packages/astraeus-site/tools/validate/runner.mjs` (limits in the summary), `package.json` (script `check:gates`), `docs/agents/build.md`, `docs/BROWSER_CHECKS.md`, `.savepoint/Design.md`, this Task file; run folders under `docs/evidence/`. `quality_gates` commands unchanged. No test removed, no assertion changed.

Limitations: limits are set from a handful of readings on one machine and may need review on the owner's other machines or CI (a warning is the intended signal, never a failure). `check:gates` runs `test` and `test:full` both (about 3 minutes in all). The browser runner warning is proved with an empty step list and a planted total, not with a slow real step. "Idle" means load average under 0.8 at the start; WSL2 can be noisier. No Task Check run (waived).

## Drift Notes

T-283 reconciled the T-281 and T-282 drift notes in Design.md and the docs (table in Technical Evidence). New: the limits file `tools/gate-limits.json` and `npm run check:gates` are reflected in Design.md; the limits are advisory and may need review on another machine.
