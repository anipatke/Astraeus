---
id: T-184
title: Write down what outside sites had to learn from the source
objective: O-044
status: done
depends_on: [{task: T-181, requires: clear}, {task: T-182, requires: clear}, {task: T-183, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: g012-planning-20261026}
check_waiver:
  task: T-184
  reason: 'Owner said "orchestrate O44"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.'
  actor: {role: owner, session: o044-run-20261028}
  recorded_at: '2026-10-28T10:48:41Z'
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

Gates: `npm run lint`, `typecheck`, `build`, `npm test` (142 files, 1871 passed, 1 skipped; includes the API doc-comment test) all pass. No browser run. Source change is doc comments only (`src/api/scene.ts` `setReach`, `addStoryPanels`; `src/api/story.ts` `StoryPanelsInput` fields).
- Install line and why React (R1): README Install paragraph on plain-JavaScript pages. Met.
- `astraeus/style.css` (R2): README, `mount` loads it, `AstraeusScene` users import it. Met.
- Story panels (R6, G7): README "Inside someone else's page" and the `addStoryPanels` / `StoryPanelsInput` comments (crossing only, `at.utc` any year, `pauseSeconds` 0 to 20 default 6, restart unless Play pressed; `autoOpen` default true, read from `shell/storyPanels.ts` and `useStoryPanels.ts`). Met.
- Reduced motion (R10): README; code has `prefers-reduced-motion` media rules in the CSS only. Met.
- Embedding (E6, E10): README title, isolation (z-index 0 to 9 found in src CSS), Escape. Met.
- `setReach` far plane (E7): comment and README; `scene.ts` sets `far: reach * 2.5`. Met.
- Lazy files and `vite:preloadError` (E11): README "Loading in your build and in tests". The reload snippet is advice on Vite's event, not exercised here. Met.
- First download (E8): `npm run measure:example` first-open total 1589214 raw / 454404 gzip (index js 1544445, css 44769); README states it; `docs/RELEASING.md` step 5 records it each release. Met.
- CHANGELOG Unreleased: five new entries (title/Escape/layers, Node loading, default time, phone panel, docs). Met.
- Design reconciliation: Interfaces and Data Flow gained the host-page paragraph; Current Technical State gained the `node` condition. T-181 drift: `writeTitle`, Escape yield and isolation reflected in Design; "mount does not restore isolation on unmount" non-architectural (a small caller-visible detail, recorded in README and CHANGELOG). T-182 drift: `node` condition reflected in Design and README. T-183 drift: default time and `useZoomThrough` reflected in Design. Met.
Unverified: no real browser or phone check; jsdom/happy-dom claim is from T-182's note (not exercised).

## Drift Notes

This Task is the O-044 integration step for deferred Design notes.
