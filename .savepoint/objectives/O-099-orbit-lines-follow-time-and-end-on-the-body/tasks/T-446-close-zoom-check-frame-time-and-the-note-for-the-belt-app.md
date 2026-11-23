---
id: T-446
title: Close-zoom check, frame time and the note for the belt app
objective: O-099
status: planned
depends_on: [{task: T-445, requires: clear}]
owner_validation: {required: true}
check_waiver: {task: T-446, reason: 'Owner said "orchestrate O99" (2026-11-23): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o099-20261123}, recorded_at: '2026-11-23T08:18:33Z'}
planned_by: {role: planner, session: plan-g026-20261123}
planned_reads: [docs/BROWSER_CHECKS.md, docs/agents/browser-policy.md, packages/astraeus/CHANGELOG.md]
planned_writes: [packages/astraeus/CHANGELOG.md, docs/BROWSER_CHECKS.md]
---

# Close-zoom check, frame time and the note for the belt app

## Outcome

The fix is proven on screen and on cost: a browser check at true scale and close zoom on Earth with time playing shows the line staying on the planet; a frame-time check at the belt's scale shows no regression against 0.10.0; the CHANGELOG has a 0.10.1 `Fixed` entry; and a short note tells the belt app what to verify after it upgrades.

## User Check

Open the browser-check results named in the evidence; on `localhost:5490`, close zoom on Earth with time playing, the line stays on the planet. Read the belt note.

## Done When

- A browser check at 1440x900 and 390x844: true scale, camera focused on Earth at a few radii, time playing over a few simulated days; the screen distance from Earth's centre to its orbit line stays under a stated pixel bound at every sampled frame. Added to the existing step that owns orbit lines or the planets demo, per the browser policy; one browser job at a time.
- A frame-time comparison against 0.10.0 on a scene at the belt's scale (tens of thousands of group points plus Earth, Mars and Jupiter orbit lines, time playing): median and 95th-percentile frame time not worse beyond run-to-run noise, both numbers recorded.
- CHANGELOG: a `## 0.10.1` section with a `Fixed` entry in plain words (lines stay on their body at close zoom and in every year), no breaking changes.
- A belt note in the Task evidence, ready for the owner to paste into the belt session: upgrade to 0.10.1; check Earth, Mars and Jupiter at a few radii with time playing at the opening year and about 5 years either side; check zoomed-out lines look as before; check nothing moves while paused; report back.
- Configured gates pass; release-tier checks are the owner's release step.

## Context Files

- `docs/BROWSER_CHECKS.md`
- `docs/agents/browser-policy.md`
- `packages/astraeus/CHANGELOG.md` (top section only)
- `.savepoint/releases/G-026-orbit-lines-that-stay-on-the-body-for-0-10-1/Release.md` (`Belt verification after release`)

## Design References

`.savepoint/Design.md` under `Verification in tiers (O-086)`.

## Guardrails

TEST-01, TEST-03, CODE-02.

## Implementation Plan

1. Pick the browser step per the policy; add the close-zoom check.
2. Build the belt-scale frame-time scene from the made-up preview scenes (no belt code), measure 0.10.0 and the change.
3. CHANGELOG and belt note.

## Boundaries

No change to the belt app; no version bump or publish.

## Technical Verification

The touched browser step and configured gates at handoff. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas for reconciliation before the Full Check.
