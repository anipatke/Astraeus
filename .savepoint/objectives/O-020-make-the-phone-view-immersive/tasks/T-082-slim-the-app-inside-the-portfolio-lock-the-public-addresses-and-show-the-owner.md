---
id: T-082
title: Slim the app inside the portfolio, lock the public addresses and show the owner
objective: O-020
status: planned
depends_on: [{task: T-081, requires: clear}, {task: T-086, requires: clear}, {task: T-090, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o017-orchestrator-check-20261017}
---

# Slim the app inside the portfolio, lock the public addresses and show the owner

## Outcome

When the app runs inside another page (the owner's portfolio), its bar is as slim as the "Inside the portfolio" mock-up; the five public experience addresses are locked by a check; the new layout's pictures become the baseline after the owner's look.

## User Check

Open the portfolio's Astraeus section: the app's bar sits slim under the story buttons; full screen shows the full layout. Then a look at every experience on a laptop and a phone.

## Done When

1. Embedded look per the approved mock-up (O-020 Decision 5): detected when the page is framed (or an address flag, decided here and recorded), slimmer bar and timeline; full screen unchanged.
2. A browser check opens `app.html`, `?experience=shower-perseids`, `shower-geminids`, `earth-moon` and `jupiter-io` (the portfolio's addresses) inside a test frame and alone, and asserts each opens its experience with zero console errors; added to `run-full.sh`.
3. Every experience at desktop and phone sizes compared with the O-017 baseline; each difference listed as an intended layout change; after the owner's look, a new baseline directory is approved and `run-full.sh` points to it.
4. Design.md shell section reconciled with T-079 to T-082 Drift Notes; `docs/BROWSER_CHECKS.md` updated.
5. Gates and the full run on the final tree.
6. Owner validation: the owner looks on a laptop and a phone (the live site after merge, or a preview).

## Context Files

`src/shell/AstraeusShell.tsx`, the shell stylesheets, `tools/validate/run-full.sh`, `docs/BROWSER_CHECKS.md`, `docs/evidence/o017-baseline-20261017/README.md`, `.savepoint/Design.md`, `.savepoint/objectives/O-020-make-the-phone-view-immersive/Objective.md`.

## Design References

Design.md shell; the approved mock-ups https://claude.ai/artifact/Akgz8SgcZBq1jCy15aPqoS.

## Guardrails

ARCH-01, ARCH-02, TEST-01, TEST-03.

## Implementation Plan

1. Embedded detection and slim styles.
2. Address check; pictures; Design reconciliation.
3. Owner look; new baseline.

## Boundaries

No new features; desktop and phone layouts as built by T-079 to T-081.

## Technical Verification

Configured gates, lite, the address check, pictures, full run. Evaluated under `agent-skills/references/check-method.md`.
