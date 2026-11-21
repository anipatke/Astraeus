---
id: T-381
title: Reformat the code with Prettier in one mechanical commit
objective: O-093
status: done
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

Builder run (2026-11-22). Unmerged branches (`git branch --no-merged main`): only the current branch o093-units-constants-tooling; O-085 is merged, no parked branch needs the format pass.

Ran `npm run format` on the clean tree (only docs/research untracked): 728 files reformatted (the same count `prettier --list-different .` gave before), no hand edits. Not staged or committed.

| Done When item | Evidence |
|---|---|
| (a) no logic change | Scratch script (not committed) parses all 728 files at HEAD and after with typescript6 and compares ASTs: identical for all 728, 0 parse diagnostics. Plain `createPrinter()` text was not usable as the comparison because the printer reuses source text for literals and parentheses, so every file differed; the AST comparison ignores only what Prettier legitimately changes: redundant parentheses (expression and type), quote style of property names (`"a":` to `a:`), JSX text whitespace layout and `{" "}` spacing markers. |
| (b) check passes | `npm run format:check`: All matched files use Prettier code style. A second `npm run format` produced a byte-identical diff (idempotent). |
| (c) tests | `npm test` before: 313 files, 5085 passed, 2 skipped. After: 313 files, 5085 passed, 2 skipped. |
| (d) byte-identical | sha256 of packages/astraeus/tests/fixtures/scenePin.json and packages/astraeus/api-surface.lock.json equal before and after; `npm run api:lock` and `npm run api:errors` leave no git diff; README error table unchanged. |
| gates | lint, typecheck, build, `npm test` (reporter junit), `look:lock` (7.6 s, pass), `check:pack` pass, `check:engine-alone` pass (36.0 s), `build:example` pass, all on the formatted tree. |

Files changed: 728 code files (list: scratchpad list.txt, equals `git diff --name-only` minus this Task file). Proof wording: the printer comparison is an AST comparison (typescript6 parse, before at HEAD vs after), which leniently ignores JSX text whitespace layout and `{" "}` markers, redundant parentheses and property-name quote style.

Commit 2 (format commit is 3a1c4078b99a17e142afbc6f5ddaeda160cf00f1): `package.json` lint now ends `&& prettier --check --cache .`; `.git-blame-ignore-revs` (new) holds that hash with a one-line comment; `docs/agents/build.md` formatting bullet notes the lint check and `git config blame.ignoreRevsFile .git-blame-ignore-revs`.
Lint wall time with the format check, three runs: 7.98 s, 9.77 s, 6.85 s. Slowest 9.77 s is under the 15 s limit, so `tools/gate-limits.json` and the build table are unchanged; gateLimits.test.ts passes (11 tests).
Planted slip: appended `export const   plantedSlip = {a:1,b:2};` to packages/astraeus/src/core/constants.ts; `npm run lint` failed (exit 1) with `[warn] packages/astraeus/src/core/constants.ts` / Code style issues found. Reverted (file clean in git status); lint passes again.
Gates after commit-2 edits: lint pass, typecheck pass, build pass, npm test 313 files, 5085 passed, 2 skipped.
Limitations: browser tier not run.

## Drift Notes

For Design reconciliation (`tools/` row): Prettier enforced through `npm run lint`; blame-ignore file. Process note: a text-printer comparison is unusable for the no-logic-change proof; use the AST comparison.

Coordinator (orchestrate-g024-20261121): commit 1 `3a1c4078` holds Prettier output only (728 files, ASTs identical); commit 2 adds the lint format check and `.git-blame-ignore-revs`. Gates green (lint 6.9–9.8 s, typecheck, build; `npm test` 313 files, 5085 passed). `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
