---
id: T-184
title: Write down what outside sites had to learn from the source
objective: O-044
status: planned
depends_on: [{task: T-181, requires: clear}, {task: T-182, requires: clear}, {task: T-183, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: g012-planning-20261026}
---

# Write down what outside sites had to learn from the source

## Outcome

The README and the doc comments behind the API reference say what the showers site could learn only by reading the package; the CHANGELOG `Unreleased` section lists every O-044 behaviour change; `docs/RELEASING.md` makes the first-download size part of each release's notes. Design is reconciled for all of O-044.

## User Check

None required; the owner may read the README diff.

## Done When

README (`packages/astraeus/README.md`) or the named doc comments cover, in plain words:
- The one-line install with the four peers (`react`, `react-dom`, `three`, `@react-three/fiber`) and why a plain-JavaScript page still needs React (R1).
- Who needs `astraeus/style.css`: `AstraeusScene` users; `mount` loads it itself (R2).
- Story panels: a panel opens only when forward playback crosses it, so one at the opening instant never opens by itself; `at.utc` may be any instant inside the timeline, in any year; what `pauseSeconds` does (playback holds, restarts unless the visitor pressed Play) (R6, G7), on `addStoryPanels` / `StoryPanelsInput`.
- The viewer honours `prefers-reduced-motion` (R10).
- Embedding: the viewer leaves the title alone, isolates its layers (its own `z-index` up to 9) and ignores an Escape the host prevented, matching T-181 (E6, E10).
- `camera.setReach(d)` also sets the far plane to 2.5 × d (E7), on its doc comment.
- In a host build, `planetModels` and the developer panels are separate files loaded later; after a redeploy an open tab may ask for an old file, and a `vite:preloadError` reload covers it (E11).
- The first-download size of the packed example, from `npm run measure:example`, with `docs/RELEASING.md` gaining a step to record that figure in each release's notes (E8).
- CHANGELOG `Unreleased` lists the title, Escape, layers, Node loading, default time and phone-panel changes.
- `.savepoint/Design.md` reconciled: every Drift Note from the other O-044 Tasks accounted for as reflected or non-architectural, with a reason.
- Hand-off gates green, including the API reference doc-comment test.

## Context Files

`packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md` under `Unreleased`, `docs/RELEASING.md`, `packages/astraeus/src/api/scene.ts` under `addStoryPanels` and `setReach`, `packages/astraeus/src/api/story.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`, `tools/measure-example.mjs`, `.savepoint/Design.md`, the T-181, T-182 and T-183 Task files.

## Design References

Design Interfaces and Data Flow (public API layer); Current Technical State.

## Guardrails

TEST-01, STYLE-07, STYLE-08.

## Implementation Plan

1. Wait for the other three O-044 Tasks to land, so the text matches what shipped.
2. Write the README and doc-comment text; CHANGELOG and RELEASING entries.
3. Reconcile Design.

## Boundaries

No code behaviour change; no claims beyond what the code does at this commit; no docs for O-045 features.

## Technical Verification

Hand-off gates (the doc-comment test covers the API reference). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

This Task is the O-044 integration step for deferred Design notes.
