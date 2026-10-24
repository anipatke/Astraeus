---
id: I-033
title: Add a lite browser check tier for everyday changes
type: guardrail
status: resolved
source:
  kind: report
  actor: {role: checker, session: o011-orchestrator-check-20261017-morning}
  at: '2026-10-17T09:15:00Z'
resolution:
  disposition: accepted
  actor: {role: owner, session: improvements-intake-20261024}
  at: '2026-10-24T02:51:07Z'
  reason: 'Owner, 2026-10-24: "Yes, close all seven" after the triage. Proof met per C-052, then superseded by the single npm run check:browser (O-038).'
history:
  - at: '2026-10-17T09:15:00Z'
    actor: {role: checker, session: o011-orchestrator-check-20261017-morning}
    kind: observed
    note: 'Owner, 2026-10-17, during the O-011/O-012 full gate: "i feel like we need a lite version of browser checks, this is too heavy". The project rule "Scene-affecting fuller gate" (AGENTS.md, Astraeus Project Rules) runs all 22 browser scripts for any rendering, camera, control or UI change; the full run takes about 25 to 38 minutes. Proposed, not adopted: a lite tier for Task handoff and Quick Checks, keep the full run for Full Objective Checks and releases. Changing the project rule is an owner decision.'
  - at: '2026-10-17T09:25:00Z'
    actor: {role: owner, session: owner-chat-20261017}
    kind: owner_decision
    note: 'Owner approved the lite tier ("yes"), 2026-10-17. Recorded on direct instruction. AGENTS.md project rule "Scene-affecting fuller gate" now names a lite tier (tools/validate/browser-lite.mjs) for Task handoff and Quick Checks, and the full set for Full Objective Checks and before a release or merge.'
  - at: '2026-10-17T09:35:00Z'
    actor: {role: checker, session: o011-orchestrator-check-20261017-morning}
    kind: observed
    note: 'Second step, after the merge: cut the full run toward about 15 minutes without losing coverage. Timing from night-check-20261016T152607Z: browser-showers geminids 6m24s and perseids 5m38s (each repeats every scenario at phone size), browser-sky 4m46s (re-opens every experience); the ten scripts under 1m15s could run two at a time. Phone layout moves to the lite pass. Owner: "i dont want to wait an hour for tests for every small change".'
  - at: '2026-10-17T07:15:00Z'
    actor: {role: executor, session: o011-orchestrator-check-20261017-morning}
    kind: repair_attempted
    note: 'Step 1: tools/validate/browser-lite.mjs written by a builder session; first run by the orchestrator against the dev server (localhost:5302, working tree on 94ee998): exit 0, 26/26 loads passed (11 experiences discovered from src/main.tsx and data/showers, desktop and phone, plus index and assets pages) in 83 seconds; evidence docs/evidence/lite-first-run-20261016T194738Z/. Not yet shown to fail on a broken tree (no negative probe run); O-017 task 6 owns proving it and step 2 (trimming the full run). Issue stays open.'
  - at: '2026-10-24T02:51:07Z'
    actor: {role: owner, session: improvements-intake-20261024}
    kind: owner_decision
    note: 'Owner, 2026-10-24: "Yes, close all seven" after the triage. Proof met per C-052, then superseded by the single npm run check:browser (O-038).'
---

# I-033: Add a lite browser check tier for everyday changes

## Summary

Every scene-affecting change currently runs all 22 headless browser scripts, about 25 to 38 minutes on this machine. The owner finds this too heavy for everyday work.

## Evidence

Full gate runs: `docs/evidence/night-check-20261016T152607Z/summary.txt` (15:26 to 16:04 UTC, 38 minutes), `docs/evidence/objective-check-20261016T190443Z/summary.txt`.

## Proof Needed

1. A lite browser script (one pass that opens every experience once at desktop and phone sizes, asserts it loads, draws a non-empty canvas, its panels open and no console errors) that finishes in about 5 minutes or less.
2. The project rule in AGENTS.md states which work runs the lite tier (Task handoff, Quick Checks) and which runs the full set (Full Objective Checks, before a release), approved by the owner.
3. The lite script passes on the current tree, with its run recorded in a fresh evidence directory.
