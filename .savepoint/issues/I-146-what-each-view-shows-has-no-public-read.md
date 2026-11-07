---
id: I-146
title: What each view shows has no public read
type: drift
status: open
source:
  kind: report
  actor: {role: executor, session: t280-build-20261107}
  at: '2026-11-07T11:58:00Z'
tasks: [T-280]
guardrail_ids: [API-01]
severity: low
history:
  - at: '2026-11-07T11:58:00Z'
    actor: {role: executor, session: t280-build-20261107}
    kind: observed
    note: 'Found while writing the Voyagers migration note; left unchanged because T-280 adds no public API. For the owner to place.'
  - at: '2026-11-07T12:20:00Z'
    actor: {role: executor, session: i146-repair-20261107}
    kind: repair_attempted
    note: 'Owner chose "Add the read now". SceneViewRead now has objects, events and panels (resolved, shared items included); tests in sceneViews.test.ts and sceneReads.test.ts; table row, Voyagers note, README, lock and Design updated; gates pass. Left open for the Check to verify.'
---

# I-146: What each view shows has no public read

## Summary

`toDefinition(data).views.views[i]` gave a view's resolved `objects` and `events`, and the Voyagers app's `src/voyagers.test.ts` reads them. `scene.views.items` gives only `id` and `label`, so with `toDefinition` gone there is no public read of what a view shows. The T-260 table said every read those tests make had a public replacement; this one does not.

## Evidence

`SceneViewRead` in `packages/astraeus/api-surface.lock.json` has `id` and `label` only. The migration table and the Voyagers note in `packages/astraeus/CHANGELOG.md` tell the app to test the list it gives `setViews`, which proves its input but not how the engine resolved it, such as a shared body shown in every view.

## Proof Needed

The owner decides whether a scene read should report each view's objects, events and panels. If so, `SceneViewRead` gains them, with a made-up scene test and a table row; if not, this Issue is accepted and the note stands.
