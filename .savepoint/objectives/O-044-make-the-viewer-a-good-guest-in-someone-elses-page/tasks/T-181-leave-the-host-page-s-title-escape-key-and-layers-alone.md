---
id: T-181
title: Leave the host page's title, Escape key and layers alone
objective: O-044
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: g012-planning-20261026}
---

# Leave the host page's title, Escape key and layers alone

## Outcome

Through `mount` and `AstraeusScene` the viewer never writes `document.title`; the repository site, which renders `App` directly, keeps today's titles. The viewer's document `keydown` handlers ignore an event whose `defaultPrevented` is set, so a host that handles Escape first keeps it. The mount element forms its own stacking context, so the viewer's `z-index` values (up to 9) cannot rise above host overlays.

## User Check

None required; behaviour is proven by tests.

## Done When

- `App` takes an option that turns off writing `document.title` (default: writes, as today); `mount` and `AstraeusScene` pass it off. A test mounts a scene with a label into a page titled "Host" and shows the title is still "Host" after the scene is drawn, for both routes; an existing or new test shows `App` alone still writes `pageTitleOf(definition)` (TEST-02).
- `StoryPanelView.tsx`, `useDrawers.ts` and `DisplaySwitches.tsx` return early on a `keydown` whose `defaultPrevented` is true. Tests: an Escape the host prevented (window capture listener calling `preventDefault`) leaves an open story panel, drawer and switch panel open; an unprevented Escape closes each as today.
- The element `mount` draws into and the `AstraeusScene` wrapper get `isolation: isolate` (inline style or the package stylesheet); a test asserts it on both.
- Hand-off gates green.

## Context Files

`packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/experienceDefinition.ts` under `pageTitleOf`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`, `packages/astraeus/src/shell/StoryPanelView.tsx`, `packages/astraeus/src/shell/useDrawers.ts`, `packages/astraeus/src/shell/DisplaySwitches.tsx`, `packages/astraeus/src/app/style.css`, `packages/astraeus/tests/domShell.test.ts`, `packages/astraeus/tests/domStory.test.ts`, `packages/astraeus/tests/displaySwitches.test.ts`, `packages/astraeus/tests/domSetup.ts`, `packages/astraeus-site/src/main.tsx`.

## Design References

Design Interfaces and Data Flow (public API layer, `mount`, `AstraeusScene`); Components/Codebase Map (`src/api/`, `src/app/`, `src/shell/`).

## Guardrails

ARCH-01, ARCH-03, TEST-01, TEST-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Add the title option to `App`; switch it off in `mount` and `AstraeusScene`; tests.
2. Add the `defaultPrevented` early return to the three handlers; tests.
3. Add `isolation: isolate` to both mount routes; test.

## Boundaries

No new public export or option on `mount`/`AstraeusScene` (title off is not configurable there, owner 2026-10-26); no change to which keys the viewer handles; no browser runs (browser policy: one run at the Full Objective Check).

## Technical Verification

Focused DOM tests while iterating; hand-off gates from AGENTS.md (`npm run lint`, `npm run typecheck`, `npm run build`, `npm test`). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Defer Design notes to T-184 (the O-044 integration step), named in the note.
