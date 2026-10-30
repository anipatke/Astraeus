---
id: T-193
title: Prove a probe's journey end to end and write it up
objective: O-046
status: planned
depends_on: [{task: T-192, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o046-planning-20261030}
---

# Prove a probe's journey end to end and write it up

## Outcome

A Sun-centred scene with a made-up probe path, enlarged planets and the "Solar system" opening scale is shown working in the packed package, in the browser check and on the local preview for the owner's one look; docs and Design match the code.

## User Check

On `localhost:5490`, open the made-up probe scene: the probe's line stays still against the Sun while time plays, the probe reaches its target planet at the flyby moment, the planets are enlarged, the probe's name shows next to it, and the labels switch hides it. Phone and desktop layouts have no overlaps (375x667, 1280x720).

## Done When

- `npm run check:node-consumer` builds a Sun-centred scene with a path (`lineFixedTo`, `plane: "ecliptic-j2000"`, `solarSystemScale`) from the packed package and checks `stateOf`.
- `npm run check:browser` gains one case (in an existing script where it fits, per `docs/BROWSER_CHECKS.md`): a Sun-centred path draws, its line does not move between two times, and its label is visible; run once, total still about a minute.
- The example: `examples/hello-scene` or a README example shows a Sun-centred path (made-up probe, no mission data), whichever keeps the example smallest; say which.
- API reference page lists the new options; README and CHANGELOG `Unreleased` complete for the whole Objective.
- Design reconciled: `.savepoint/Design.md` and `docs/architecture/` describe paths in Sun-centred scenes, the line rule, the path frame and the scale; each earlier step's drift note is accounted for as reflected or non-architectural with a reason.
- Owner look recorded (owner_validation), then hand off for the Full Objective Check.

## Context Files

`tools/check-node-consumer.mjs`, `docs/BROWSER_CHECKS.md`, `packages/astraeus-site/tools/validate/harness.mjs`, `examples/hello-scene/src/main.js`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `.savepoint/Design.md`, `docs/agents/browser-policy.md`, each earlier O-046 step's Drift Notes.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` and `Current Technical State`; `docs/architecture/state-and-assets.md`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Node consumer case, then the browser case (follow the browser policy; one browser job at a time).
3. Example and docs.
4. Design reconciliation.
5. Prepare the preview on `localhost:5490` and ask the owner for the look.

## Boundaries

No probe data from any real mission. No new browser scripts beyond the one case. No screenshots.

## Technical Verification

Configured gates, `npm run check:node-consumer`, one `npm run check:browser`; Full Objective Check afterwards under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Reconciliation step for O-046.
