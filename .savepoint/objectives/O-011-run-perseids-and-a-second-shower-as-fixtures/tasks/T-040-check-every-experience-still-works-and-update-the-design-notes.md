---
id: T-040
title: Check every experience still works and update the design notes
objective: O-011
status: planned
depends_on: [{task: T-039, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o011-plan-2026-10-11}
planned_reads: [.savepoint/Design.md, tools/validate/browser-spike02.mjs, tools/validate/browser-spike03.mjs, tools/validate/browser-shell.mjs, tools/validate/browser-anchor-labels.mjs, tools/validate/browser-synthetic.mjs, tools/validate/browser-synthetic-ring.mjs, tools/validate/browser-showers.mjs]
planned_writes: [.savepoint/Design.md]
---

# Check every experience still works and update the design notes

## Outcome

Apollo, the made-up experiences, the made-up belt, Perseids and Geminids all pass every browser script at mobile and desktop sizes with zero console errors, in fresh run directories. Configured gates pass. Every drift note from T-036 to T-039 is reconciled into Design, and the owner's final visual judgement is recorded.

## Astraeus Hypothesis

- **Capability tested:** cross-experience regression, the brief's rule 6. Apollo passing alone is not evidence of reuse.
- **Contract reused:** every browser script under `tools/validate/` and the configured gates.
- **Gap or hypothesis:** that the window repair, camera reach and shower builder changed no existing behaviour.
- **Generic change:** none. A regression found here is captured and repaired under its owning Task or as an Issue.
- **Perseids-independent evidence:** the synthetic, ring and belt runs alongside the shower runs.

## User Check

Look at Apollo, the made-up window, the made-up belt, Perseids and Geminids at desktop and phone sizes, using the screenshots or the running app. Say whether each still looks right.

## Done When

1. Configured typecheck, build and test gates pass fresh; record command, time and counts.
2. Every browser script passes with zero console errors, writing to `docs/evidence/o011-integration-<date>/` (no overwriting of earlier evidence). The list covers spike02, spike03, shell, anchor-labels, synthetic, synthetic-ring (with the belt) and showers (Perseids and Geminids), at mobile and desktop sizes where each script supports them.
3. Every prior browser scenario that an O-011 Task changed is mapped to its current assertion (browser-regression rule); deferred coverage is closed.
4. Design.md is reconciled. Each drift note from T-036 to T-039 is reflected or stated as non-architectural with a reason. The camera-reach deferred notes (T-024/T-025, T-028) are closed or updated. The Geminids PASS or FINDING is recorded in Current Technical State. GAP-5 (radiant marker) stays recorded as open.
5. Owner visual judgement is recorded per experience.

## Context Files

`.savepoint/objectives/O-011-run-perseids-and-a-second-shower-as-fixtures/Objective.md`, `.savepoint/Design.md`, the O-011 Task files (T-036 to T-039), `tools/validate/browser-spike02.mjs`, `tools/validate/browser-spike03.mjs`, `tools/validate/browser-shell.mjs`, `tools/validate/browser-anchor-labels.mjs`, `tools/validate/browser-synthetic.mjs`, `tools/validate/browser-synthetic-ring.mjs`, `tools/validate/browser-showers.mjs`.

## Design References

Design: all sections touched by T-036 to T-039.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, PROV-01, TEST-01, TEST-03.

## Implementation Plan

1. Confirm T-036 to T-039 are complete with evidence; return REPLAN REQUIRED if one is missing.
2. Run the gates and every browser script into one fresh run directory.
3. Map changed scenarios; close any deferred coverage.
4. Reconcile Design.md from the drift notes.
5. Ask the owner to look; record the judgement.

## Boundaries

No new features. No findings note (O-012). Repairs found here go through their owning Task or an Issue, not silently into this one.

## Technical Verification

Full configured gates and every browser script, fresh, as the evidence the Full Objective Check needs. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None expected; this Task reconciles the others.
