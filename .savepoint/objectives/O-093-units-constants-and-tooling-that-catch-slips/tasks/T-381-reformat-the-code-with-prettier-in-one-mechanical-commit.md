---
id: T-381
title: Reformat the code with Prettier in one mechanical commit
objective: O-093
status: planned
depends_on: [{task: T-379, requires: clear}, {task: T-380, requires: clear}]
check_waiver: {task: T-381, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T19:19:52Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: format
planned_reads: [.prettierrc.json, .prettierignore, tools/gate-limits.json, docs/agents/build.md]
---

# Reformat the code with Prettier in one mechanical commit

## Outcome

Every code file in Prettier's scope is reformatted in one commit that holds nothing but Prettier's output, and from the next commit on `npm run lint` fails on unformatted code, so later diffs show only real changes (AH-44; Release.md decision 7: "Prettier, one commit", kept separate from logic changes).

`planned_writes` is left out on purpose: the reformat rewrites every file that `npx prettier --list-different .` names (draft 10 recorded the list, several hundred files across all packages and `tools/`). This Task runs last, alone, with no other Task open.

## User Check

None visual. `git show --stat <format commit>` lists only code files in Prettier's scope; `npm run lint` passes, and fails on a planted badly formatted line.

## Done When

- Before starting, the coordinator lists unmerged branches (`git branch --no-merged main`) and records them; for each parked branch (O-085 at least, if still parked) the plan's Decision 1 applies, and the branch names are written into the evidence so the owner knows which need the format pass.
- Commit 1 (the coordinator commits it with an explicit file list): the output of `npm run format` on a clean tree at the head of this branch, and nothing else. Proof it has no logic change, all recorded: (a) a scratch script (not committed) parses every changed file before and after with `typescript6` and compares `ts.createPrinter()` output with comments removed: identical for every file; (b) `npx prettier --check .` passes; (c) `npm test` passes with the same number of passing tests as just before the reformat; (d) `tests/fixtures/scenePin.json`, `api-surface.lock.json` and the README error table are byte-identical.
- Commit 2: `lint` script becomes the current ESLint command followed by `&& prettier --check --cache .`; `.git-blame-ignore-revs` (new) holds commit 1's full hash with a one-line comment; `docs/agents/build.md` notes `git config blame.ignoreRevsFile .git-blame-ignore-revs` for local blame. Lint wall time with the format check is measured three times; if the slowest is over 15 s, raise `tools/gate-limits.json` `lint` and the build guide's table together to the measured slowest plus the usual room, with the measurements quoted (a test keeps the two in step).
- Planted slip: a scratch edit that adds badly formatted code to one engine module makes `npm run lint` fail; reverted; output recorded.
- Gates per `docs/agents/verification.md`, plus `npm run check:engine-alone`, `npm run check:pack`, `npm run build:example` (draft 10's dry run proved them on the same tree).

## Context Files

- `.prettierrc.json`, `.prettierignore`
- `package.json` (`scripts.lint`)
- `tools/gate-limits.json`, `docs/agents/build.md` (gate table, lint and formatting bullets)
- Draft 10's Technical Evidence (file list, dry-run results)

## Design References

`.savepoint/Design.md` under `Components/Codebase Map` (the `tools/` row).

## Guardrails

STYLE-10, TEST-01, TEST-03, CODE-01.

## Implementation Plan

1. Confirm the tree is clean and every other O-093 Task is done; list unmerged parked branches.
2. `npm run format`; run the four proofs; the coordinator commits the output alone.
3. Wire the check into `lint`; add `.git-blame-ignore-revs`; measure lint; adjust the limit only on measurement; commit.
4. Plant and revert a formatting slip; run gates and the extra checks.

## Boundaries

Commit 1 holds no hand edit of any kind; if Prettier's output breaks anything, stop, revert the reformat, and report (draft 10 should have caught it; the fix belongs in a check, not in the reformat). No change to `.prettierrc.json` or `.prettierignore` in this Task. No formatting of JSON, Markdown, HTML or YAML.

## Technical Verification

The four proofs above; `quality_gates`; `npm run check:engine-alone`; `npm run check:pack`; `npm run build:example`. The Full Objective Check runs the browser tier (the site's catalogue page shows source lines).

## Technical Evidence

Pending execution.

## Drift Notes

For Design reconciliation (`tools/` row): Prettier enforced through `npm run lint`; blame-ignore file.
