---
id: I-198
title: The workflow parity test passes when a gate step is switched off, a push filter is added, or ci.yml runs npm publish
type: defect
status: open
source:
  kind: check
  check: C-208
  actor: {role: checker, session: check-o091-20261122}
  at: '2026-11-22T02:37:39Z'
tasks: [T-416]
checks: [C-208]
guardrail_ids: [TEST-01]
severity: low
history:
  - at: '2026-11-22T02:37:39Z'
    actor: {role: checker, session: check-o091-20261122}
    kind: observed
    note: 'C-208 planted copies of the real workflows in a scratch mirror and ran workflowParity.test.ts against them. These passed (not caught): `if: false` on the ci.yml lint step; `continue-on-error: true` on the ci.yml test step; `continue-on-error: true` on the publish.yml packed-examples browser step; `if: false` on the ci.yml gates job; `paths-ignore` or `branches-ignore` under ci.yml `on.push`; a second ci.yml job running `npm publish`. These were caught: a changed gate, removed check:three-newest, differing SHA, tag ref, id-token on the ci job, and an extra step in the gates job.'
    check: C-208
---

# The workflow parity test passes when a gate step is switched off, a push filter is added, or ci.yml runs npm publish

## Problem

T-416's Outcome says `npm test` fails when the push/PR workflow stops running exactly the Task gates, or when the release workflow stops running a promised check before publishing. Its Done When rule 6 says no workflow `run` contains `npm publish`. `packages/astraeus-site/tests/workflowParity.test.ts` reads only each step's `run` text:

- `runs()` (line ~37) ignores the step and job keys `if` and `continue-on-error`. A gate can be skipped (`if: false`), or its failure ignored (`continue-on-error: true`), and the rules still pass. In ci.yml that means CI stays green on a failing gate, which defeats Objective success condition 1 ("a planted failure turns it red"). In publish.yml a release would publish after a failed check.
- `"ci triggers"` (line 54) rejects only `paths` and `branches` under `on.push`. `paths-ignore`, `branches-ignore` and `tags` filters pass, but the invariant is that every push runs CI.
- `"publish step is guarded"` (line 94) scans only `publish.yml`, so an `npm publish` in any ci.yml job passes. Rule 6 says "no workflow".

Smallest repro: in a copy of ci.yml, add `if: false` under `- name: lint`, then run the test against it. It passes.

## Proof Needed

Add one planted copy to the existing table for each case: a gate or check step, and its job, with `if` or `continue-on-error`, in ci.yml and in publish.yml; `paths-ignore` and `branches-ignore` under ci.yml `on.push`; and `npm publish` in a ci.yml job. Each plant must fail, naming the problem. The real files must stay clean, and the existing plants must keep passing.

## Repair Routing

Direct repair under this Issue, inside O-091 (it is T-416's test). It touches only `workflowParity.test.ts`. A fresh Full Objective re-check of O-091 then verifies it.
