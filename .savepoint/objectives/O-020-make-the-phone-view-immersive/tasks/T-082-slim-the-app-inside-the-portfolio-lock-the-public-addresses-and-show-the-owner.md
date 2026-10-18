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

When the app runs inside another page (the owner's portfolio), its bar is as slim as the "Inside the portfolio" mock-up; its controls stay reachable inside the frame.

## User Check

Open the portfolio's Astraeus section: the app's bar sits slim under the story buttons; full screen shows the full layout. Then a look at every experience on a laptop and a phone.

## Done When

Revised 2026-10-18 at start, per the Planning Note (the launch line-up moved the address lock and the new picture baseline to O-024 T-093):

1. Embedded look per the approved mock-up (O-020 Decision 5): detected when the page is framed (or an address flag, decided here and recorded), slimmer bar and timeline; full screen unchanged.
2. A browser check opens each demo inside a test frame (as the portfolio's `components/astraeus/AstraeusBridge.tsx` embeds it, read-only reference) and alone, and asserts the embedded look, the shared controls still reachable, and zero console errors; added to `run-full.sh`.
3. Design.md shell section reconciled with the T-079, T-080, T-081, T-083, T-084, T-085, T-086 and T-090 Drift Notes (each reflected or recorded as non-architectural with a reason); `docs/BROWSER_CHECKS.md` updated.
4. Gates and the full run on the final tree.
5. Owner validation: the owner looks at every demo on a laptop and a phone (preview now, and the live site after merge).

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

## Owner Notes — 2026-10-18

On the local preview the owner checked the phone layout on a real phone ("2 good") and will test again on the live site after the merge ("will test in live as well later after merge").

## Planning Note — 2026-10-18

The launch line-up changed (G-005 Launch Definition of Done): three demos (Apollo, Showers, Jupiter), Earth–Moon dropped, and the old shower and Earth–Moon addresses deliberately left to break (owner). Locking the five public addresses and the new picture baseline therefore move to O-024, which sets the final addresses; when T-082 is started, its Done When is revised to the portfolio slim view and the owner's laptop-and-phone look only.
