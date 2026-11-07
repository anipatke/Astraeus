---
id: T-282
objective: O-060
title: Stop the fast tests repeating their setup
status: done
depends_on: [{task: T-281, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o060-planning-20261107}
check_waiver: {task: T-282, reason: 'Owner said "orchestrate o60" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o060-run-20261107}, recorded_at: '2026-11-07T07:48:14Z'}
---

# Stop the fast tests repeating their setup

## Outcome

The fast tests share setup they repeat today, aiming for about 30 s for `npm test`, with the same number of tests.

## User Check

Compare the before and after times in the Task's evidence.

## Done When

The longest-running files that set the run's length are measured first on an idle machine. The compiler analysis in `tools/api-surface.mjs` and `tools/api-rules.mjs`, created separately by `apiRules`, `apiSurface`, `apiReference` and `migrationTable` tests, runs once per run or is shown not to matter. The package build in `packagePacks.test.ts` repeats no work that gives no extra protection. Other shared setup (`vitest.setup.ts`, Apollo `reconstruct` runs, showers data loads) is treated the same way where it shortens the run; the determinism proof that runs `reconstruct` twice stays. `npm test` and `test:full` run at least 3,282 passed tests, and coverage is not lower. `pastTheEntry` also catches a path given in parts, and the planted ring test uses a scratch folder rather than `astraeus-data-pluto/dist` (C-153 observations), each with a planted case. Every change is measured; one that does not shorten the run is reverted.

## Context Files

`.savepoint/objectives/O-060-make-the-checks-faster-with-the-same-protection/Objective.md`, `vitest.config.ts`, `packages/astraeus/vitest.setup.ts`, `tools/api-surface.mjs`, `tools/api-rules.mjs`, `packages/astraeus-site/tests/apiRules.test.ts`, `packages/astraeus-site/tests/apiSurface.test.ts`, `packages/astraeus-site/tests/apiReference.test.ts`, `packages/astraeus-site/tests/migrationTable.test.ts`, `packages/astraeus-site/tests/packagePacks.test.ts`, `tools/check-packs.mjs`, `packages/astraeus-demo-apollo11/tests/apollo11Reconstruction.test.ts`.

## Design References

`O-053 checks (Guardrails API-01 to API-07)`, `Current Technical State`.

## Guardrails

TEST-01, TEST-02, TEST-03, API-01, STYLE-05, STYLE-10.

## Implementation Plan

1. Measure which files set the run's length. 2. Share the compiler analysis. 3. Trim the pack build overlap. 4. Treat other setup by measured gain. 5. Make the two tidy-ups.

## Boundaries

No test removed or merged, no tolerance loosened, no change to what a test proves, no engine change. Each Vitest file runs isolated, so a shared step must be real, such as global setup, and a stale result must not pass: a change to the source must still fail the rule checks. About 30 s is an aim; report the measured result.

## Technical Verification

Focused tests while iterating; at hand-off the configured gates, `npm run test:full`, `npm run check:engine-alone` and `npm run check:pack`. No browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Session: builder, 2026-11-07, branch o060-faster-checks. Task Check waived by the owner's plan (handed off at audit; no waiver record written by the builder). No browser run. Extra reads: none beyond Context Files, plus `docs/agents/verification.md` and `build.md` (skill Read list).

Done When to proof:

| Done When item | Proof |
|---|---|
| Longest files measured first, idle machine | Per-file durations from a `--reporter=json` run (below); whole-run wall clock `npm test` 40.7 s and 41.2 s (idle, 16 cores, 3286 passed at start). Run-length setters: apollo11Reconstruction (26.8 s alone, ends last), packagePacks (20.3 s alone, 14.4 s of it the build-and-pack test), then pointsLookAhead 14.6, sceneInputCopies 10.2, showersMeasured 10.1, keplerShader 9.8, computedLook 9.4 (loaded). Sum of file time 191 s over 16 cores. |
| Compiler analysis once per run or shown not to matter | Measured in one Node process, idle: currentSurface 709 ms first, 432 ms second; publicTypeBreaks 375; errorBreaks 422; addressParameters 518; outsideApiTypes 357; about 2.8 s CPU in total across four test files, none on the critical path (apiRules 5.5 s, apiSurface 1.9 s as files). Shown not to matter; no global setup added, so no stale-result risk and nothing to plant. |
| Package build repeats no work without extra protection | `buildPackage` of all eight takes 1.4 s in total; the 14 s is `npm pack --dry-run` (saturn 5.2 s, jupiter 2.4, uranus 1.7, data 1.0, neptune 1.0, astraeus 0.7). Only the one build-and-pack test packs all eight; the planted tests pack one package each (0.4 to 0.7 s) and prove different things. No repeated work found. Tried running the eight packs side by side (reverted, see table). |
| Other shared setup (setup file, Apollo reconstruct, showers) treated by measured gain | Apollo: the two `reconstruct` runs (about 12 s each) are the determinism proof and stay; a second run in another file or process does not shorten the longest path (still two runs, plus a third for the other file), and no process-level runner for the Apollo tool code is installed; not changed. Setup file: 8 percent of summed time, spread over 231 files, not on the critical path; not changed. Showers loads: files of 3 to 10 s, off the critical path; not changed. |
| 3,282 or more passed; coverage not lower | `npm test` 3288 passed, 2 skipped (was 3286 at start; +2 planted cases). `test:full`: 3288 passed, 2 skipped. Coverage before and after identical: statements 12317/13238 (93.04 percent), branches 6909/7798 (88.59), functions 2993/3195 (93.67), lines 9958/10448 (95.31) (coverage-final.json compared before and after the change). |
| `pastTheEntry` catches a path given in parts | Two new planted rows in packagePacks.test.ts "planted: ... given in parts" (`join(dir, 'node_modules', 'astraeus', 'src', ...)` and `join(pkg, \`astraeus\`, "src", 'assets')`) fail on the old patterns and pass now; the real consumer checks still pass (first draft flagged `["astraeus", "astraeus-data-jupiter"]` and `"astraeus", "dist"`, narrowed to the source folders); the manifest path in parts is allowed (added assertion). |
| Planted ring test uses a scratch folder | The planted ring test now builds `mkdtempSync(tmpdir())/ring-facts-*` and removes it; it no longer writes into `astraeus-data-pluto/dist`. It still names both problems (passes). |
| Every change measured; one that does not shorten is reverted | Table below. |

Before and after, per change tried (wall clock of `npm test`, idle, three readings each):

| Change | Before | After | Outcome |
|---|---|---|---|
| Run the eight `npm pack --dry-run` side by side (`checkPacksAsync`) | packagePacks file 20.3 s alone; whole run 40.2, 40.5, 40.8 s | file 12.8 s alone; whole run 43.2, 45.8, 42.6 s | File faster, whole run slower (contention with the Apollo file on the critical path): REVERTED |
| Share compiler analysis through global setup | not built | not built | About 2.8 s CPU total off the critical path; shown not to matter |
| Apollo second run elsewhere | not built | not built | No gain on the longest path (reasoned, not trialled) |
| `pastTheEntry` parts patterns and scratch-folder ring test | whole run 40.7 s (3286 tests) | 40.2 to 40.8 s (3288 tests) | Required tidy-ups; no timing effect |

Result: `npm test` about 40.5 s before and after (aim 30 s not reached); `test:full` 72 s before (baseline) and 71.4 s after. The run is bound by the Apollo file (two `reconstruct` runs, about 26 s alone, up to 39 s under load) and the pack build; neither can be shortened without touching what is proved or the tool code.

Gates run: `npm run lint`, `npm run typecheck`, `npm run build` (pass); `npm test` x6 timing runs (pass, 3288); `npm run test:full` (pass, 3288, 71.4 s); `npm run check:engine-alone` (pass, 19.1 s); `npm run check:pack` (pass, 14.4 s). Files changed: tools/check-packs.mjs (pastTheEntry patterns and comment), packages/astraeus-site/tests/packagePacks.test.ts (two planted rows, one allowed assertion, scratch-folder ring test). No test removed.

Limitations: no real speed-up reached; Apollo reconstruct profiling failed (worker profile not written), so its inner cost split is unknown; coverage compared by statement, branch and function counts from coverage-final.json (the lines figure is from the test:full summary only). The "before" coverage file was written at 17:46 by an earlier run after T-281.

## Drift Notes

Record architecture deltas for the last step of this Objective, which reconciles them in Design.

T-282: no architecture delta. `tools/check-packs.mjs` `pastTheEntry` now also recognises a path given in parts (tool behaviour, not Design). Finding for the Objective: `npm test` is bound by the Apollo determinism pair (about 26 s) and the pack build, so the 30 s aim needs a change to that tool code or an owner decision on the determinism proof; nothing for Design.md to reflect.
