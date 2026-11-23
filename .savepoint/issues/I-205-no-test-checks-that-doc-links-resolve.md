---
id: I-205
title: No test checks that doc links resolve
type: guardrail
status: resolved
source:
  kind: report
  actor: {role: executor, session: orchestrate-g024-20261122}
  at: '2026-11-22T07:40:00Z'
tasks: [T-440]
checks: [C-213]
guardrail_ids: [ARCH-06]
severity: low
history:
  - at: '2026-11-22T07:40:00Z'
    actor: {role: executor, session: orchestrate-g024-20261122}
    kind: observed
    note: 'O-090 T-440: a throwaway script checked 167 relative links across the O-090-edited Markdown; 12 fixture links in docs/ASTRONOMY_VALIDATION.md (`../tests/fixtures/…`) were broken on main and were repaired by hand. No test would have caught them. Also seen: the title of packages/astraeus/tests/planetMoonSystems.test.ts:228 says "within a kilometre" while it asserts under 1.5 km (docs follow the assertion).'
  - at: '2026-11-22T06:50:00Z'
    actor: {role: executor, session: orchestrate-g024-20261122}
    kind: observed
    note: 'C-213 observation: Design "Host calls land in order" cites an engine README section "Host calls" that does not exist (the rule is the "Order rule" paragraph under "The handle: lifecycle, time and events"); pre-existing on main. The doc-link test could also check quoted section names.'
  - at: "2026-11-23T09:43:01Z"
    actor:
      role: owner
      session: board-owner
    kind: owner_decision
    note: Moved from open to in_progress by the owner from the board.
  - at: "2026-11-23T09:43:03Z"
    actor:
      role: owner
      session: board-owner
    kind: owner_decision
    note: Resolved by the owner from the board.
resolution:
  disposition: accepted
  actor:
    role: owner
    session: board-owner
  at: "2026-11-23T09:43:03Z"
  reason: Resolved by the owner from the board.
---

# No test checks that doc links resolve

## Problem

Relative links and `#anchor` links in the root README, `docs/`, `.savepoint/Design.md` and the engine README are checked only by hand. O-090 found 12 links in `docs/ASTRONOMY_VALIDATION.md` that had been broken since the fixtures moved. Separately, a test title in `planetMoonSystems.test.ts:228` claims a 1 km bound but asserts 1.5 km.

## Proof Needed

A fast test (unit tier) that walks the current guides (root README, `docs/*.md`, `docs/agents/*.md`, `docs/architecture/*.md`, `.savepoint/Design.md`, `packages/*/README.md`) and fails on a relative link whose file or heading anchor does not exist; red on a planted broken link, green on the repo. The `planetMoonSystems.test.ts:228` title states the bound it asserts. Design's "Host calls land in order" names the real engine README section.
