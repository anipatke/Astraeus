---
id: I-085
title: The npm publishing workflow uses actions that GitHub is retiring
type: other
status: in_progress
source:
  kind: report
  actor: {role: owner, session: improvements-intake-20261024}
  at: '2026-10-24T02:47:47Z'
severity: medium
history:
  - at: '2026-10-24T02:47:47Z'
    actor: {role: planner, session: improvements-intake-20261024}
    kind: observed
    note: 'Owner, 2026-10-24: "can we add the fixes as issues, and iterate through and fix them with agents" (after "no more demos, here on in only improvements").'
  - at: '2026-10-24T04:00:00Z'
    actor: {role: executor, session: repair-builder-I-085}
    kind: repair_attempted
    note: 'publish.yml: actions/checkout v4 to v7 and actions/setup-node v4 to v7 (latest majors, 7.0.1 and 7.1.0; both action.yml declare using node24). Runner kept at ubuntu-latest (already Ubuntu 24.04; nothing in the workflow depends on OS specifics; the workflow sets Node 24 for the job itself). Only workflow in .github/workflows. docs/RELEASING.md unchanged (no step changes). Verified: YAML parses; @action-validator/cli passes; npm run lint and typecheck pass. Unverified: a real run. The branch is not pushed, so the manual dry run (Actions, Run workflow, publishes nothing) is owed after the coordinator pushes; confirm no Node 20 deprecation annotation appears.'
  - at: '2026-10-24T03:50:00Z'
    actor: {role: checker, session: c117-improvements-check-20261024}
    kind: rechecked
    note: 'C-117: file repair proven (publish.yml parses; actions/checkout@v7 and actions/setup-node@v7 action.yml both declare using node24). Not verified: the real manual dry run, which needs a push; outside C-117. Issue stays in_progress until that run passes.'
    check: C-117
---

# I-085: The npm publishing workflow uses actions that GitHub is retiring

## Summary

The v0.2.0 publish run (GitHub Actions run 40054374088, 2026-10-24) passed but warned: `actions/checkout@v4` and `actions/setup-node@v4` target Node.js 20, which is deprecated and being forced onto Node 24; and the `ubuntu-latest` label moves to Ubuntu 26 from 2026-10-19. A future release could break without warning.

## Evidence

`gh run view 40054374088` annotations; `.github/workflows/publish.yml` lines 17-23 (`runs-on: ubuntu-latest`, `actions/checkout@v4`, `actions/setup-node@v4`, `node-version: 24`).

## Proof Needed

The workflow uses action versions that run on Node 24 natively (current majors of checkout and setup-node) and a pinned or confirmed runner image; a manual dry-run of the publish workflow (Actions, publish, Run workflow; publishes nothing) passes with no deprecation annotation, or the remaining annotation is named with why it stays. `docs/RELEASING.md` updated if any step changes.
