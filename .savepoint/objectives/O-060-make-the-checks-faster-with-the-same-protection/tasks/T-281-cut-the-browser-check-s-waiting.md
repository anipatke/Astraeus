---
id: T-281
objective: O-060
title: Cut the browser check's waiting
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o060-planning-20261107}
check_waiver: {task: T-281, reason: 'Owner said "orchestrate o60" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o060-run-20261107}, recorded_at: '2026-11-07T07:40:00Z'}
---

# Cut the browser check's waiting

## Outcome

`npm run check:browser` runs in about 230 s on an idle machine, with every assertion it had kept (target changed from 180 s by the owner; see the Objective's Owner Decisions).

## User Check

Read the run summary: the total is about 230 s and every step passed.

## Done When

A committed list holds every browser assertion at baseline commit 6aad8e6a (each error a check can raise, by script), and a test fails if one goes missing, shown by a planted case. Fixed waits in the `synthetic-journey` checks are replaced by waits on the condition they stood for, read through `driver.mjs`; a fixed wait that stays has a comment saying why. The same applies to `views` and other steps if needed to reach the target. The two `synthetic-journey` sizes run side by side inside the one job only if three runs in a row pass; otherwise they stay in sequence and the Task says why. Three consecutive runs pass, with times recorded. `npm run check:browser` is about 230 s on an idle machine.

## Context Files

`.savepoint/objectives/O-060-make-the-checks-faster-with-the-same-protection/Objective.md`, `packages/astraeus-site/tools/validate/browser-smoke.mjs`, `packages/astraeus-site/tools/validate/driver.mjs`, `packages/astraeus-site/tools/validate/harness.mjs`, `packages/astraeus-site/tools/validate/run-browser.mjs`, `packages/astraeus-site/tools/validate/journey-views.mjs`, `docs/BROWSER_CHECKS.md`, `docs/agents/browser-policy.md`.

## Design References

`Current Technical State`.

## Guardrails

TEST-01, TEST-02, TEST-03, STYLE-10.

## Implementation Plan

1. Write the assertion list and its test first. 2. Time each stage of the journey checks. 3. Replace waits, largest first. 4. Try side-by-side sizes. 5. Run three times.

## Boundaries

No assertion removed, no tolerance loosened, no view dropped, no engine change, no screenshots. If about 230 s cannot be held with the same protection, stop and report the measured time and what is left. This Task may run the browser check repeatedly because it changes the browser scripts; one run at a time.

## Technical Verification

Focused runs of the changed scripts, then three `npm run check:browser` runs; hand-off gates from `.savepoint/config.yml`. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Target moved by the owner from 180 s to about 230 s; the two `synthetic-journey` sizes stay side by side (Objective Owner Decisions). Scripts were last edited before run 1 started, so runs 1 to 3 are three consecutive runs of the final scripts, all steps passing, wall-clock seconds from each `summary.txt`.

| Step | Run 1 `browser-20261107T071542Z` | Run 2 `browser-20261107T072219Z` | Run 3 `browser-20261107T072610Z` | Baseline |
|---|---|---|---|---|
| smoke | 122 | 119 | 123 | 223 |
| smoke-public-showers | 17 | 17 | 14 | 17 |
| planets-phone | 10 | 9 | 14 | 9 |
| meteor-shower | 21 | 22 | 18 | 22 |
| views | 21 | 22 | 25 | 42 |
| hello-scene | 14 | 14 | 11 | 11 |
| hello-react | 4 | 4 | 4 | 4 |
| hello-planets | 6 | 6 | 6 | 10 |
| public-build-assets | 1 | 2 | 1 | 1 |
| public-addresses | 0 | 0 | 0 | 0 |
| total | 231 | 231 | 229 | 353 |

Side by side: the two journey sizes run in two contexts of one browser (`Promise.all` in `browser-smoke.mjs`), about 76 s wall against about 130 s in turn (alone), passing in all three runs. Machine-dependence of the pair is the owner's accepted trade.

Done When, each item to its proof:

| Done When item | Proof |
|---|---|
| Committed list of every browser assertion at 6aad8e6a, by script | `tests/fixtures/browserAssertionsBaseline.json` (158 calls, built by `tools/validate/assertion-list.mjs` from `git show 6aad8e6a:`); test "holds the baseline list" and "the committed list is what the baseline commit holds" in `tests/browserAssertions.test.ts` |
| A test fails if one goes missing, shown by a planted case | test "every baseline assertion is still in the scripts"; test "fails when an assertion is removed, loosened or dropped with its script (planted)"; a real loosened tolerance (0.002 to 0.02) in `journey-views.mjs` made it fail, then reverted |
| Fixed waits in `synthetic-journey` replaced by waits on the condition, read through `driver.mjs`; remaining fixed waits commented | `browser-smoke.mjs` journey functions use `waitForBodySettled`, `waitForPathSettled`, `waitForClockSettled`, `wheelUntilSettled` (driver.mjs); the 3 s frames-per-second window carries a comment; passing runs 1 to 3 |
| Same for `views` and other steps if needed | `journey-views.mjs` uses `waitForViewSettled`, `waitForProbePathsSettled`, `waitForBodyMoved`, `waitForBodySettled`, `waitForClockSettled`; the 2 s hold-still window carries a comment; views 42 s to 21-25 s; other steps' waits not changed |
| Two journey sizes side by side only if three runs in a row pass | runs 1 to 3 all passed with the pair; kept |
| Three consecutive runs pass, times recorded | table above |
| `npm run check:browser` about 230 s on an idle machine | 231, 231, 229 s |

Gates (`.savepoint/config.yml`): `npm run lint` passed (ESLint over `packages` and `tools` with complexity 20; the earlier crash was a bare `npx eslint` bypassing the TypeScript 6 loader `tools/lint/use-typescript6.cjs`, which the npm script supplies); `npm run typecheck` passed; `npm run build` passed; `npm test` (junit) passed, 231 files, 3286 passed, 2 skipped, including `browserAssertions` and `browserDriverGuard`.

Files read: the Context Files listed above, `agent-skills/savepoint-task/SKILL.md`, `docs/agents/verification.md`, `docs/agents/browser-policy.md`, `docs/agents/build.md`. Extra reads: none beyond these.
Files changed: `packages/astraeus-site/tools/validate/browser-smoke.mjs`, `driver.mjs`, `journey-views.mjs`; new `assertion-list.mjs`, `assertion-list.d.mts`, `packages/astraeus-site/tests/browserAssertions.test.ts`, `packages/astraeus-site/tests/fixtures/browserAssertionsBaseline.json`; run folders under `docs/evidence/`.

Limitations: the git-rebuild test does nothing in a clone without commit 6aad8e6a, where the committed list stands alone. Settle waits return the last value at their timeout instead of failing, so the original assertion decides. The remaining waits in meteor-shower, apollo and the other scripts were not reviewed or changed. No Task Check run (waived). The new times are not yet in `docs/BROWSER_CHECKS.md` or `docs/agents/build.md` (see Drift Notes).

## Drift Notes

Record architecture deltas for the last step of this Objective, which reconciles them in Design.

- Docs still say about 6 minutes (`docs/BROWSER_CHECKS.md` "What it runs", `docs/agents/build.md` browser gate); T-283 updates the new times (about 230 s). BROWSER_CHECKS.md also needs the new driver functions and `assertion-list.mjs` listed; for T-283 or the Design reconciliation.
- Settle waits (`waitUntilStable` and the helpers built on it) return the last value at timeout and never fail by themselves; the following assertion decides.
- `tests/browserAssertions.test.ts` fourth test (rebuild from git) does nothing in a clone without commit 6aad8e6a; the committed JSON stands alone there.
- The two journey sizes run side by side in the smoke step (owner-accepted, machine-dependent).
