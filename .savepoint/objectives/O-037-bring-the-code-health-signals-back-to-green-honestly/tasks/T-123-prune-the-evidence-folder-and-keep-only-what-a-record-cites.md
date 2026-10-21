---
id: T-123
title: Prune the evidence folder and keep only what a record cites
objective: O-037
status: in_progress
stage: audit
depends_on: []
owner_validation: {required: false}
check_waiver:
  task: T-123
  reason: Owner waived the optional Task Check for O-037 ('dont run full checks until the final objective check'); the Full Objective Check covers it.
  actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
  recorded_at: '2026-10-21T10:40:00Z'
planned_by: {role: planner, session: o037-planning-20261021}
planned_reads: [docs/evidence, .savepoint/checks, .savepoint/objectives, .savepoint/issues, .savepoint/Design.md, tools/validate/runner.mjs, .gitignore, AGENTS.md, docs/BROWSER_CHECKS.md]
planned_writes: [docs/evidence, tools/validate/runner.mjs, .gitignore, AGENTS.md, docs/BROWSER_CHECKS.md]
---

# Prune the evidence folder and keep only what a record cites

## Outcome

`docs/evidence` holds only the run folders a Check, Task, Issue or Design note names, with no screenshots; from now on a browser run commits `summary.txt` and each step's `results.json` and writes its logs outside the repository.

## User Check

`ls docs/evidence | wc -l` is about 60, not 291; `find docs/evidence -name '*.png' | wc -l` is 0; `git ls-files docs/evidence | wc -l` is a few hundred, not 4,045. Run `npm run check:engine`: the new folder holds a summary and results files only, and the console prints where the logs went.

## Done When

1. A script or recorded command lists every `docs/evidence/<folder>` path cited anywhere under `.savepoint/` and in `.savepoint/Design.md`, `docs/*.md` and `README.md`; the list (232 cited paths at planning time) is saved in the Task evidence before anything is removed.
2. Every run folder not on that list is removed with `git rm -r`; every `.png`, `.jpg` and `.gif` under `docs/evidence` is deleted, tracked or not (owner, 2026-10-18: no screenshots by anyone; O-037 Confirmed Decision 1). Cited folders keep their files, so each record's link still resolves.
3. `tools/validate/runner.mjs` writes step logs, `dev-server.log` and `preview-server.log` to a scratch folder (`os.tmpdir()`-based, path printed in the summary) and keeps only `summary.txt` and each step's `results.json` under `docs/evidence/<set>-<stamp>/`. The summary line still carries the error-line count it read from the log.
4. `.gitignore` ignores `docs/evidence/**/*.log`, `*.err`, `*.out` and `docs/evidence/**/*.mjs` as a backstop.
5. AGENTS.md's Astraeus Project Rules gain one retention rule: a run keeps its summary and results in the repository, logs go to scratch, and a run folder no record cites may be removed at the next clean-up; the "Historical evidence preservation" rule is reworded to match. `docs/BROWSER_CHECKS.md` states the same in its running note.
6. Gates: `npm run typecheck`, `npm run build`, `npm test` (including `tests/browserDriverGuard.test.ts`). One `npm run check:engine` run at hand-off, allowed because this Task changes the runner (AGENTS.md browser rule), proves the new folder shape. No demo set runs.

## Context Files

`tools/validate/runner.mjs`, `tools/validate/run-engine.mjs`, `.gitignore`, `AGENTS.md`, `docs/BROWSER_CHECKS.md`, `.savepoint/checks/` (grep only), `.savepoint/Design.md` (grep only).

## Design References

Design: Components/Codebase Map row for `tools/validate/`. O-037 Why (evidence growth), Confirmed Decision 1, Planned Technical Decisions on runner retention.

## Guardrails

TEST-01, TEST-03; STYLE-07, STYLE-09.

## Implementation Plan

1. Build the cited-path list; save it.
2. Delete pictures; `git rm -r` the uncited folders; confirm every cited path still exists.
3. Change the runner's log destination; keep summary and results in place.
4. `.gitignore`, AGENTS.md rule, `docs/BROWSER_CHECKS.md` note.
5. Gates, then one engine run.

## Boundaries

No deletion of a cited folder, whatever its size; no change to what the scripts assert; no screenshots; no edit to any Check record.

## Technical Verification

The saved cited-path list and a post-deletion existence check over it; the engine run's folder listing; handoff gates per AGENTS.md's Verification Policy.

## Technical Evidence

Built 2026-10-21 by the T-123 builder; deletion run by the owner (owner action, 2026-10-21) with scratchpad prune-evidence.sh --apply from the builder's lists.
- Cited-path list: `docs/evidence/T-123-cited-paths.txt` is NOT written (a write into docs/evidence was denied in the builder session); the lists are `keep2.txt` (267) and `del2.txt` (24) in the session scratchpad. Matching: name in any record/`docs/*.md`/AGENTS.md, glob citations (c052-*, o017-t068-*-...Z, o020-t084-*, o019-t078-*, spike02*, ...), truncated-prefix citations, and test/src references (tests/homePage.test.ts, tests/moonOrbits.test.ts).
- Before: 291 entries, 2.6 GB, 4,045 tracked files, 16,090 pictures (23 tracked). Delete list: 24 uncited entries (85 MB, 166 tracked files). After: 260 entries, 35 MB, 3,861 tracked files, 4 .gif files remain (o016-t063-20261016T120425Z old/new/rev2 and o016-t063-capture-20261016T161406Z/pictures/readme), left for the owner to decide, since the script missed .gif and deleting is outside this step's authority. `map-audit-20261021/` added by the coordinator and kept.
- Criterion 1/2: 24 uncited removed, all pictures removed (O-037 Confirmed Decision 1). Post-deletion existence check over the keep list: 8 cited names are gone because they held only pictures: o015-t062-20261016T121016Z, o016-t064-20261016T161100Z, o017-cards-v2-20261017, o017-t067-public-showers-20261016T220609Z, o017-t067-showers-20261016T215051Z, o017-t074-card-sources-20261017, o020-repair-showers-053144-d, o020-repair-showers-053144-e. About 21 picture links in `.savepoint` records no longer resolve (accepted by Confirmed Decision 1; no Check record edited).
- Criterion 3: `tools/validate/runner.mjs` writes step logs, dev-server/preview-server/public-build logs to `mkdtemp(os.tmpdir()/astraeus-check-logs-*)`; summary.txt carries `logs: <path>` and the per-step error-line count; results files still go to the evidence folder. Node-level proof: `runSet("t123-dryrun", [])` printed the logs path, left only summary.txt in the run folder (that dry-run folder was then removed). No browser set ran; first real run is the Full Objective Check.
- Criterion 4: `.gitignore` ignores docs/evidence/**/*.log, *.err, *.out, *.mjs. Criterion 5: AGENTS.md retention rule added and preservation rule reworded; docs/BROWSER_CHECKS.md Running section updated.
- Criterion 6: gates below; the engine run is deferred to the Full Objective Check per the owner's run rule.


## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
