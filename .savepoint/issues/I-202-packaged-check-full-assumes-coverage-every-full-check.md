---
id: I-202
title: Packaged check-full reference assumes coverage on every Full Check
type: drift
status: open
source:
  kind: report
  actor: {role: executor, session: orchestrate-g024-20261122}
  at: '2026-11-22T04:31:46Z'
tasks: [T-424]
checks: []
guardrail_ids: []
severity: low
history:
  - at: '2026-11-22T04:31:46Z'
    actor: {role: executor, session: orchestrate-g024-20261122}
    kind: observed
    note: 'T-424 drift note: after O-094 (owner P04) a Full Objective Check runs npm test, not test:full, so coverage is refreshed only at release. agent-skills/references/check-full.md "Collect Code Health Evidence" still assumes the full gate writes coverage. That file is Savepoint-managed (packaged skills), so it is not edited here.'
---

# Packaged check-full reference assumes coverage on every Full Check

## Problem

`agent-skills/references/check-full.md` ("Collect Code Health Evidence") expects the Full Check's full gate to have written fresh coverage before `savepoint health check`. In Astraeus, coverage now runs at release or on the owner's ask (O-094, docs/agents/verification.md), so a checker following the reference may look for coverage the gate no longer makes.

## Proof Needed

The packaged reference says coverage is optional or project-scheduled (a stale coverage line is recorded, never required), or Savepoint offers a project setting for it; an Astraeus Full Check following it does not need `test:full`.

## Repair Routing

Suggestion for the packaged Savepoint skills (upstream); the project's own rule already lives in docs/agents/verification.md.
