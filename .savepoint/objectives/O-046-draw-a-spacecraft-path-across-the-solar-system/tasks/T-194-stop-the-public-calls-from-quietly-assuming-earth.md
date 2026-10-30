---
id: T-194
title: Stop the public calls from quietly assuming Earth
objective: O-046
status: done
depends_on: [{task: T-193, requires: clear}]
owner_validation: {required: false}
check_waiver:
  task: T-194
  reason: 'Owner said "orchestrate O-46"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.'
  actor: {role: owner, session: o046-run-20261030}
  recorded_at: '2026-10-30T21:23:30Z'
planned_by: {role: planner, session: o046-run-20261030}
---

# Stop the public calls from quietly assuming Earth

## Outcome

The mechanised body-name check (`packages/astraeus/tests/nameCheck.test.ts`) also covers `packages/astraeus/src/api/`, so a public default or rule that hard-codes a body (like the old `addTrajectory` `center ?? "earth"`) fails a test unless it is allowlisted with a reason (new guardrail ARCH-06; owner, 2026-10-30: "how do we ensure this is codified", then "Add it to O-046 now").

## User Check

Not owner-facing.

## Done When

- The check's source glob includes `src/api/**`; each `src/api/` file that must still name a body (for example the body handles in `bodies.ts`, the Moon's parent table, Earth's own Sun orbit in `sunOrbit.ts`, the scene-centre fallback) is allowlisted with a one-line reason, or the literal is replaced by a catalogue lookup where that is the cleaner rule.
- A planted-offence test proves the extended check catches a hard-coded body default in a made-up `src/api/` file (the existing planted-tree pattern), and the stale-allowlist test still fails on an unneeded entry.
- The test's header comment cites ARCH-06; `.savepoint/Design.md` mentions that the check covers `src/api/`.
- No behaviour change; all gates green.

## Context Files

`packages/astraeus/tests/nameCheck.test.ts`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/bodies.ts`, `packages/astraeus/src/api/sunOrbit.ts`, `.savepoint/Guardrails.md` (ARCH-06), `.savepoint/Design.md` under `Current Technical State`.

## Design References

`.savepoint/Design.md` under `Boundaries`; I-021 (the original name check).

## Guardrails

ARCH-01, ARCH-06, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Widen the glob; run the check to list the offences.
3. For each: replace with a catalogue or scene lookup if that is the general rule, otherwise allowlist with a reason.
4. Planted-offence case; header comment; Design line.

## Boundaries

No public API change; no other folders added to the check.

## Technical Verification

Configured gates at hand-off; no browser run. Evaluated in the Full Objective Check under `agent-skills/references/check-method.md`.

## Technical Evidence

Built and handed off at stage audit (Task Check waived, see frontmatter).

- Widened the glob in packages/astraeus/tests/nameCheck.test.ts to src/api/**; header cites ARCH-06; folder-read test includes src/api/; planted src/api case added (stale-allowlist test unchanged and passing).
- Offences found: activity.ts (experience name "meteors" in an error message: reworded to "events per hour"); scene.ts ORBITS parent "earth"/"jupiter" (replaced by the body's catalogue parentId, no behaviour change); scene.ts scene-centre fallback "earth" (allowlisted: documented default when no catalogued first body, catalogue root is the Sun); bodies.ts (allowlisted: built-in handles are the ids); sunOrbit.ts (allowlisted: Earth's dedicated Sun trajectory and provenance).
- Design.md Boundaries gains a line on the src/api/ coverage.
- Gates after last edit: lint, typecheck, build clean; test 146 files, 1910 passed, 1 skipped. No browser run.

## Drift Notes

None expected.
