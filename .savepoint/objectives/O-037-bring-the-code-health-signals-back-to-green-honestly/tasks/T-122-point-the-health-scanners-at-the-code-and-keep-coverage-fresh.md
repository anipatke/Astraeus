---
id: T-122
title: Point the health scanners at the code and keep coverage fresh
objective: O-037
status: done
check_waiver:
  task: T-122
  reason: Owner waived the optional Task Check for O-037 ('dont run full checks until the final objective check'); the Full Objective Check covers it.
  actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
  recorded_at: '2026-10-21T10:15:32Z'
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o037-planning-20261021}
planned_reads: [.savepoint/health/config.json, vite.config.ts, package.json, .savepoint/config.yml, AGENTS.md, vitest.setup.ts]
planned_writes: [.savepoint/health/config.json, vite.config.ts, package.json, AGENTS.md]
---

# Point the health scanners at the code and keep coverage fresh

## Outcome

The duplication and complexity scanners skip evidence, fixtures, data and retired code; coverage counts `src` and the non-browser tools and nothing else; a named full gate writes a fresh coverage report so the health check never reads a stale one.

## User Check

Run `npm run test:full`, then open the health board and refresh: coverage shows today's date, not 16 October. The report's duplication list names no file under `docs/evidence`.

## Done When

1. `.savepoint/health/config.json`: the duplication and complexity instances exclude `docs/evidence/**`, `tests/fixtures/**`, `data/**`, `tools/archive/**`, `tools/import/*.json`, `tools/import/.horizons-cache/**` and `coverage/**`, in both the `exclusions` list and the tool arguments (`--ignore` for jscpd, `-x` for lizard), so the two agree. Record the before and after totals from a scratch run of each tool (not `savepoint health check`, which only a Full Objective Check runs).
2. `vite.config.ts` `test.coverage`: `include` is `src/**/*.{ts,tsx}`, `tools/apollo11/**/*.ts`, `tools/import/**/*.{ts,mjs}`, `tools/data/**/*.mjs`, `tools/site/**/*.mjs`; `exclude` adds `src/main.tsx`, `**/*.d.ts`, `**/*.d.mts`; reporters stay `json` plus a text summary. O-037 Confirmed Decision 2.
3. `package.json` gains `test:full`: Vitest with `--coverage` and the same JUnit reporter and output file as the test gate. The fast `test` script is unchanged.
4. AGENTS.md's Build section lists `npm run test:full` as the full gate for Full Objective Checks and migration or platform-sensitive hand-offs, and states in one line what each health scanner measures and excludes.
5. Evidence: a scratch coverage run with the new scope, its headline figure and the ten least-covered files, recorded in Technical Evidence as the baseline the later Tasks move.
6. Gates: `npm run typecheck`, `npm run build`, `npm test`, then `npm run test:full` once to prove it writes `coverage/coverage-final.json` and `junit.xml`.

## Context Files

`.savepoint/health/config.json`, `vite.config.ts`, `package.json`, `.savepoint/config.yml`, `AGENTS.md`, `vitest.setup.ts`, `agent-skills/references/check-method.md` (the Collect Code Health Evidence section only).

## Design References

Design: Components/Codebase Map rows for `tools/validate/` and `tests/`. O-037 Why (coverage and duplication causes), Confirmed Decision 2, Planned Technical Decisions on scope and the full gate.

## Guardrails

TEST-01, TEST-03; CODE-01; STYLE-07.

## Implementation Plan

1. Re-run jscpd and lizard into a scratch folder with the current arguments; record the totals.
2. Add the exclusions to the config file's lists and arguments; re-run into scratch; record the new totals and confirm no code file left the scan.
3. Set the coverage include and exclude lists; add `test:full`; run it; record the figure and the least-covered files.
4. Write the AGENTS.md Build lines.
5. Gates.

## Boundaries

No source changes; no evidence deletion (that is the pruning Task); no `savepoint health check` or `savepoint health setup` run (human-only).

## Technical Verification

Scratch scanner runs before and after; `npm run test:full` output; handoff gates per AGENTS.md's Verification Policy. The Full Objective Check reads the fresh coverage report this Task's gate writes.

## Technical Evidence

Built 2026-10-21 by builder session; Task Check waived by owner (see `check_waiver`); evidence routes to the Full Objective Check.

1. Scanner config (`.savepoint/health/config.json`): complexity and duplication gain the seven exclusions in both `exclusions` and args (`-x '*/docs/evidence/*'` etc. for lizard, extended `--ignore` for jscpd). Scratch runs with the config's own args into the scratchpad (no repo writes):
   - jscpd before: 3881 sources, 6437 clones, 270495 duplicated lines, 46.16%. After: 442 sources, 86 clones, 1023 duplicated lines, 1.63% (1.25% of tokens).
   - lizard before: 5872 CSV rows. After: 5500; no row under docs/evidence, tests/fixtures, data or tools/archive; remaining rows are src (1534), tests (2446), tools (1502), config files and 11 under `.claude` (not excluded; not in the plan).
2. `vite.config.ts` `test.coverage`: provider v8, reporters json + text-summary, include and exclude lists exactly as specified.
3. `package.json` `test:full` = `vitest run --coverage --reporter=default --reporter=junit --outputFile.junit=junit.xml`; `test` unchanged.
4. AGENTS.md Build section: full-gate line and one-line scanner scope line added.
5. Coverage scope proof only (owner run rule: no full coverage gate before the final check): `vitest run --coverage --coverage.reportsDirectory=<scratch> tests/sceneCamera.test.ts` passed and reported over the new include scope (11018 statements, 8906 lines across src and the non-browser tools; 7.06% lines from one test file). The full-suite baseline figure, the ten least-covered files and the first `npm run test:full` (writing `coverage/coverage-final.json` and `junit.xml`) are deferred to the Full Objective Check, where `savepoint health check` also takes the official snapshot (not run here).
6. Gates: `npm run typecheck` clean; `npm run build` ok (chunk-size warning only); `npm test` with junit: 92 files, 1282 passed, 1 skipped.

Files changed: .savepoint/health/config.json, vite.config.ts, package.json, AGENTS.md, this Task file.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.

Coordinator, 2026-10-21: marked done on the owner's instruction ("Mark tasks done as you progress") after typecheck, build and test passed. The first npm run test:full and the official health snapshot are owed at the O-037 Full Objective Check.
