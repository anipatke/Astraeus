---
id: T-413
title: Task gates run on every push and pull request
objective: O-091
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-413, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T23:30:07Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: ci
planned_reads: [.github/workflows/publish.yml, .savepoint/config.yml, package.json, docs/agents/build.md]
planned_writes: [.github/workflows/ci.yml]
---

# Task gates run on every push and pull request

## Outcome

A new GitHub Actions workflow runs the project's Task gates (`quality_gates` in `.savepoint/config.yml`: lint, typecheck, build, test) on every push to any branch and on every pull request, on Node 22 and Node 24, so a red change is visible without depending on the author's machine (AH-36: Claude F-18, Gemini PKG-03, Codex release table).

## User Check

None visual. After the next push, the repository's Actions tab shows a `ci` run with two jobs (Node 22, Node 24), both green (the GitHub proof is draft 05's).

## Done When

- New `.github/workflows/ci.yml`, workflow `name: ci`:
  - `on:` `push` (all branches) and `pull_request`; no `paths` filter (every push).
  - `permissions: contents: read` at workflow level; nothing else (no `id-token`).
  - `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`.
  - One job `gates`, `runs-on: ubuntu-latest`, `timeout-minutes: 30`, `strategy.matrix.node: [22, 24]` with `fail-fast: false` (PLAN.md decision 2: `package.json:7` promises `>=22.12`; O-085 made Node 22 green).
  - Steps in this order: checkout; setup-node with `node-version: ${{ matrix.node }}` and `cache: npm`; print `node --version` and `npm --version`; `npm ci`; then the four `quality_gates` commands **verbatim** from `.savepoint/config.yml:6–9` (`npm run lint`, `npm run typecheck`, `npm run build`, `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`), one step each, each step `name:` the gate key (`lint`, `typecheck`, `build`, `test`).
  - Actions referenced the way PLAN.md decision 3 sets (default: `actions/checkout` and `actions/setup-node` pinned to a full 40-character commit SHA, with the tag as a trailing comment, e.g. `uses: actions/checkout@<sha> # v7.x.y`; the SHA is the one the tag points at, looked up with `git ls-remote https://github.com/actions/checkout refs/tags/v7*` and recorded in Technical Evidence). If the owner answers "major tags" (PLAN.md owner question 1), use `@v7` as `publish.yml` does.
  - A header comment (as `publish.yml:1–3` has) saying what runs, that the gate list is `quality_gates` and that `workflowParity.test.ts` (draft 04) keeps them equal.
- No browser step, no network-dependent check (`check:react-consumer`, `build:example`) in this workflow: those are release-workflow and Full-Check gates (PLAN.md decision 1).
- Local proof, from a fresh clone (the closest stand-in for a runner; `act` is not installed): `git clone --no-local <repo> <scratch>/ci-clone`, `git -C <scratch>/ci-clone checkout <this branch>`, then in the clone, for Node 22 and again for Node 24 (`source ~/.nvm/nvm.sh; nvm use 22` / `nvm use 24`): `npm ci` and the four commands exactly as the workflow lists them. Both pass; times and the Node/npm versions recorded. A failure that appears only in the clone (a test that needs a git-ignored file, such as a cache under `tools/import/`) is recorded and reported as REPLAN REQUIRED with the file named, not worked around in the workflow.
- The YAML parses: `node -e` with the `yaml` package if draft 04 has added it, otherwise `python3 -c 'import sys,yaml; yaml.safe_load(open(sys.argv[1]))' .github/workflows/ci.yml` (record which); `actionlint` if it is on the PATH (record "not available" otherwise).
- Gates per `docs/agents/verification.md`.

## Context Files

- `.github/workflows/publish.yml` (whole; 49 lines: style, header comment, setup-node use)
- `.savepoint/config.yml` (`quality_gates`, lines 5–11)
- `package.json` (`engines`, lines 6–8; `scripts`)
- `docs/agents/build.md` (first bullet, hand-off gates)

## Design References

`.savepoint/Design.md` under `Current Technical State` (gate times and limits paragraph) for the expected gate times.

## Guardrails

SEC-01 (no token or secret; the workflow needs none), STYLE-07 (the gate list has one source: `quality_gates`; the test in draft 04 enforces it), STYLE-05, STYLE-10.

## Implementation Plan

1. Look up the action SHAs for the tags `publish.yml` uses (`v7`): `git ls-remote https://github.com/actions/checkout 'refs/tags/v7*'` and the same for `setup-node`; take the newest `v7.x.y` tag's commit (peeled `^{}` line for annotated tags).
2. Write `ci.yml` as above.
3. Fresh-clone runs on Node 22 and 24; record.
4. Parse check; gates.

## Boundaries

Only `.github/workflows/ci.yml`. No change to `publish.yml` (draft 02), to any gate script, test or `package.json`, and no docs (draft 04). Do not push or trigger anything on GitHub (draft 05, coordinator). Do not add caching beyond `setup-node`'s `cache: npm`, artifacts, or a coverage job (`test:full` stays a Full-Check gate).

## Technical Verification

Fresh-clone gate runs on Node 22 and Node 24 as in Done When; YAML parse; handoff `quality_gates` in the working checkout. No browser run.

## Technical Evidence

SHAs (`git ls-remote https://github.com/actions/<name> 'refs/tags/v7*'`; lightweight tags, no peeled lines): actions/checkout v7.0.1 = 3d3c42e5aac5ba805825da76410c181273ba90b1 (v7.0.0 = 9c091bb2...); actions/setup-node v7.1.0 = 949feb2413d6458794dcd2491c4babbbce0c15c1 (v7.0.0 = 82076278...). T-414's Task file had no recorded SHAs at the time; same values should be used there. Extra reads: .savepoint/objectives/O-091*/tasks/T-414*.md (grep for SHAs, concurrency check).

| Done When | Evidence |
|---|---|
| ci.yml, name ci, push (all branches, no paths) + pull_request | python3 yaml parse: on = {push: None, pull_request: None} |
| permissions contents: read only; concurrency group ci-${{ github.ref }} cancel-in-progress | file lines 9-15; parsed OK |
| job gates, ubuntu-latest, 30 min, matrix node [22, 24], fail-fast false | parsed strategy {'fail-fast': False, 'matrix': {'node': [22, 24]}} |
| Steps order: checkout, setup-node (cache npm), versions, npm ci, lint, typecheck, build, test verbatim | file read back; commands copied from config.yml:6-9 |
| SHA pins with tag comment | see SHAs above |
| Header comment | ci.yml lines 1-3 |
| No browser / network step | none in file |
| Fresh-clone proof (git clone --no-local, checkout o091-ci-every-push; clone has HEAD without the uncommitted ci.yml, which does not affect the gates) | Node v22.23.5 / npm 10.9.9: npm ci 6s, lint 16s, typecheck 7s, build 4s, test 35s, all rc=0, 324 files, 5316 passed, 3 skipped. Node v24.16.0 / npm 12.2.1: ci 6s, lint 15s, typecheck 7s, build 3s, test 34s, all rc=0, same counts |
| YAML parses | python3 `yaml.safe_load` (PyYAML; draft 04 has not added the yaml package here); actionlint not available |
| Gates in working checkout | see Gate line below |

Files changed: .github/workflows/ci.yml (new); this Task file.
Limitations: no GitHub run (draft 05's). PyYAML reads `on` as key True; irrelevant to GitHub.

Gate line (working checkout, under flock): lint 0, typecheck 0, build 0, test pass: 5319 passed, 2 skipped (5321; count differs from the clone because sibling builders add tests concurrently).

## Drift Notes

None. Design reconciliation for CI (a sentence under `Current Technical State`) is draft 04's to propose.

## Coordinator (gates)

Set done by the orchestrating session after the combined handoff gates passed with T-413, T-414 and T-415 together (owner: "I mark them as they pass", O-038; G-024 decision 7; owner 2026-11-22 "I am remote now, add park the check and move on"): lint and Prettier clean, typecheck clean, `npm test` 324 files, 5319 passed, 2 skipped; `npm run check:pack` pass, engine 1,836,378 B raw (cap 1,838,000).
