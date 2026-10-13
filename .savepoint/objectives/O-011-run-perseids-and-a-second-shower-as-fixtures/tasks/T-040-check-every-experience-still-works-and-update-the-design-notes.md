---
id: T-040
title: Check every experience still works and update the design notes
objective: O-011
status: planned
depends_on: [{task: T-039, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o011-plan-2026-10-11}
planned_reads: [.savepoint/Design.md, docs/ASTRAEUS_SPIKE_04_PERSEIDS_REFERENCE.md, docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md, tools/validate/browser-spike02.mjs, tools/validate/browser-spike03.mjs, tools/validate/browser-shell.mjs, tools/validate/browser-anchor-labels.mjs, tools/validate/browser-synthetic.mjs, tools/validate/browser-synthetic-ring.mjs, tools/validate/browser-synthetic-belt.mjs, tools/validate/browser-synthetic-listed.mjs, tools/validate/browser-sky.mjs, tools/validate/browser-earth-moon.mjs, tools/validate/browser-jupiter-io.mjs, tools/validate/browser-showers.mjs, tools/validate/browser-precision.mjs, tools/validate/browser-lighting.mjs, tools/validate/public-build-assets.mjs]
planned_writes: [.savepoint/Design.md]
---

# Check every experience still works and update the design notes

## Outcome

Every experience (Apollo, Earth–Moon Explorer, Jupiter–Io, the made-up fixtures including the listed-orbit fixture, Perseids and Geminids) passes every browser script at mobile and desktop sizes with zero console errors, in fresh run directories, with the sky on. The public build passes its gate. Configured gates pass. The reference spec's six viewer acceptance criteria are walked through against meteorshowers.org and recorded as met, partly met or a gap. Every drift note from T-036 to T-039 and T-051 to T-054 is reconciled into Design, and the owner's final visual judgement is recorded.

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
2. Every browser script passes with zero console errors, writing to `docs/evidence/o011-integration-<date>/` (no overwriting of earlier evidence). The list covers every `tools/validate/browser-*.mjs` script (spike02, spike03, shell, anchor-labels, synthetic, synthetic-ring, synthetic-belt, synthetic-listed, sky, earth-moon, jupiter-io, showers for Perseids and Geminids, precision, lighting) at 1280×800 and 390×844, except the fixed-viewport measurement scripts (precision, lighting); plus the public-build validator.
3. Every prior browser scenario that an O-011 Task changed is mapped to its current assertion (browser-regression rule); deferred coverage is closed.
4. Design.md is reconciled. Each drift note from T-036 to T-039 and T-051 to T-054 is reflected or stated as non-architectural with a reason. The camera-reach deferred notes (T-024/T-025, T-028) are closed or updated. The Geminids PASS or FINDING is recorded in Current Technical State. GAP-5 (radiant marker) stays recorded as open.
5. Owner visual judgement is recorded per experience.
6. The reference spec's six viewer acceptance criteria and its seven required-experience items are walked through, each recorded as met, partly met or a gap with evidence. The Earth-based perspective is recorded as deferred.

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

## Replan — 2026-10-13 (I-025)

Amended in planning to cover T-051 to T-054 (measured stream, sky, comet and markers), the scripts added since O-014, and the reference spec walk-through.
