---
id: T-417
title: First runs on GitHub, green and with a planted failure red
objective: O-091
status: planned
depends_on: [{task: T-416, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-417, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T23:30:07Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: proof
planned_reads: [.github/workflows/ci.yml, .github/workflows/publish.yml, docs/agents/build.md]
planned_writes: []
---

# First runs on GitHub, green and with a planted failure red

## Outcome

The new workflows are proved where they actually run: the `ci` workflow is green on Node 22 and 24 for the O-091 branch, a planted failing test turns it red, and a manual dry run of the release workflow on the branch is green through its new steps and ends in the dry-run publish. Run by the **coordinator** (git pushes and `gh` are coordinator actions; Sonnet builders do not push). Nothing is published.

## User Check

The owner can open the Actions tab and see: one green `ci` run on the branch, one red `ci` run on the throwaway branch (then deleted), and one green manual `publish` run (dry run).

## Done When

Owner rule (G-024 orchestration, recorded before this run): no throwaway failing-test branch push and no GitHub release-workflow run, not even a dry run (owner: never publish or release from an agent session). CI is proven by the next normal push of `main`.

1. **After the merge** (the coordinator pushes `main` under the standing orchestration rules): `gh run list --workflow ci.yml --branch main --limit 1`, then `gh run watch <id> --exit-status`. Both matrix jobs green; record the run URL, each job's duration, Node/npm versions from the version step and each gate step's time (`gh run view <id> --json jobs`) in this Task and the Objective's closing note.
2. **Red proof** is the local evidence only: draft 04's parity test proves each rule with a planted copy, and draft 01's evidence shows the workflow runs `npm test` with a failing exit code ending the job. The GitHub red run is recorded as not run, by owner rule.
3. **Release dry run** is recorded as not run, by owner rule; draft 02's local run of the release steps is the evidence.
4. If the post-merge `main` run is red, record the step and log excerpt and report to the owner (one repair round, then stop).

## Context Files

- `.github/workflows/ci.yml`, `.github/workflows/publish.yml` (to know the step names)
- `docs/agents/build.md` (the CI bullet draft 04 wrote)

## Design References

None.

## Guardrails

SEC-01; project rule: never `npm publish`, never `tools/publish-packages.mjs` without `--dry-run`. A manual workflow run is the dry-run branch by construction (`publish.yml` publish step); never create a GitHub release or a `v*` tag.

## Implementation Plan

As Done When, in order. `gh auth status` first; if `gh` is not authenticated, stop and ask the owner.

## Boundaries

No file edits on the O-091 branch (evidence lives in this Task's record). No release, no tag, no `--tag` publish path. Throwaway branch deleted. No re-run loops: a red green-run is diagnosed before any retry (owner memory "Stop when checks don't converge").

## Technical Verification

`gh run view` outputs for the three runs (URLs, conclusions, job times) recorded.

## Technical Evidence

Pending execution.

## Drift Notes

None yet.
