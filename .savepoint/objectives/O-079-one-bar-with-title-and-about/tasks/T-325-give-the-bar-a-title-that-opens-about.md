---
id: T-325
title: Give the bar a title that opens About
objective: O-079
status: planned
depends_on: [{task: T-331, requires: clear}]
check_waiver: {task: T-325, reason: 'Owner said "orchestrate 79": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o079-20261121}, recorded_at: '2026-11-21T00:35:01Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g023-20261121}
---

# Give the bar a title that opens About

## Outcome

A scene can carry its title and About content (`scene.setAbout`, `handle.about`, `handle.setAbout`, shaped as the decision note's interface sets), the title is the bar's title item (desktop and the phone row, shrinking to "i" by the bar rule), and it opens an About panel placed by the panel rule (desktop under the title; phone the sheet above the timeline) ending with "Built with Astraeus" and the engine version.

## User Check

On desktop, a scene with an About shows its title at the bar's left; clicking it opens About with the status, credits and links and the built-with mark with the version; clicking again or Escape closes it. On a phone the title (or "i") opens About as a sheet above the timeline, and the object info sheet and About close each other as the note's close table says. A host calling `setAbout` with a new status sees it change in the open panel. A scene without an About shows the selected object's name in the title place.

## Done When

The O-079 Success Conditions for `setAbout`, `handle.about`/`setAbout`, the title item and the About panel hold, through the bar rule and the panel rule (no placement code of its own), with named tests on both embedding paths (one lifecycle suite), a synthetic scene (ARCH-03), a two-viewer test (API-03) and the `bad-about` cases. README, CHANGELOG (proposed 0.9.5), doc comments, `npm run api:errors` and `npm run api:lock` updated. Apply `docs/agents/verification.md`.

## Context Files

- `docs/architecture/viewer-interface.md`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/Objective.md`
- `.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)`
- `.savepoint/Design.md` under `Good guest`
- `.savepoint/Design.md` under `One handle, one lifecycle`
- `packages/astraeus/src/api/scene.ts`
- `packages/astraeus/src/api/pickerInput.ts`
- `packages/astraeus/src/api/viewerHandle.ts`
- `packages/astraeus/src/api/errors.ts`
- `packages/astraeus/src/api/index.ts`
- `packages/astraeus/src/shell/TopBar.tsx`
- `packages/astraeus/src/shell/TopBar.css`
- `packages/astraeus/src/shell/InfoPanel.tsx`
- `packages/astraeus/src/shell/AstraeusShell.tsx`
- `packages/astraeus/src/shell/viewerKeys.ts`
- `packages/astraeus/package.json`
- `packages/astraeus/README.md` under `Looks, controls and views`
- `packages/astraeus/README.md` under `Looks, picker, scale and switches`
- `packages/astraeus/CHANGELOG.md` (top section only)

## Design References

Design "Public API shape (G-016, owner 2026-11-01)", "Good guest", "Host-page behaviour", "One handle, one lifecycle", "Host calls land in order", "Scene and host-link split".

## Guardrails

ARCH-01, ARCH-03, API-01, API-02, API-03, API-04, API-05, API-07, TEST-01, TEST-03, STYLE-07, STYLE-09.

## Implementation Plan

1. Add `AboutInput` (and its credit and link types) in its own `src/api/` input file with a checker that throws `bad-about` naming the field; add the `bad-about` code with its doc comment.
2. `Scene.setAbout` (replace) and `scene.about` read; pass the About through the scene's plans and `assembleScene` into the definition.
3. Host link and handle: `about` read and `setAbout` replace, landing in call order, `not-mounted` outside the lifecycle; the same on the `AstraeusScene` ref through `viewerHandleOf`.
4. Engine version: read `version` from the engine's own `package.json` (JSON default import, which the build supports) in one module; no hand-written copy.
5. Shell: the About title becomes the bar's title item (the bar rule places it and shrinks it to "i"); an `AboutPanel` placed by the panel rule (a component with ids via `useId`, styles under `.astraeus-shell`), listing status, credits (Source link when a url is given), links, then the built-with link and version; Escape closes it through the viewer-scoped key rule.
6. Tests: input checks (each field), scene read, handle on both paths, call order, panel render with and without status/credits/links, version equals `package.json`, two viewers, synthetic scene.
7. README rows and a short example; CHANGELOG entry; `npm run api:errors`; `npm run api:lock`.

## Boundaries

No new placement or fit code (use the bar and panel rules; return REPLAN REQUIRED if they cannot express About), no site demo changes, no story buttons or tile, no version bump.

## Technical Verification

Focused tests while iterating; handoff runs the configured gates plus `check:engine-alone` and `check:pack`. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas (for example a new definition field) for reconciliation in T-327.
