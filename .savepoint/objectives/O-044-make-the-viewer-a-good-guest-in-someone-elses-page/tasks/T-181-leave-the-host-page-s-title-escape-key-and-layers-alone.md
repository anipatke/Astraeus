---
id: T-181
title: Leave the host page's title, Escape key and layers alone
objective: O-044
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: g012-planning-20261026}
check_waiver:
  task: T-181
  reason: 'Owner said "orchestrate O44"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.'
  actor: {role: owner, session: o044-run-20261028}
  recorded_at: '2026-10-28T10:27:53Z'
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

Gates run: `npm run lint` pass (no findings), `npm run typecheck` pass, `npm run build` pass (chunk-size warning only), `npm test` pass (142 files, 1865 passed, 1 skipped). No browser run (run rules). No extra reads beyond Context Files (plus `tests/publicApi.test.ts`, `src/api/scene.ts`, `src/api/prepared.ts` to learn how Scene definitions carry a label).

Changed: `packages/astraeus/src/app/App.tsx`, `src/api/mount.ts`, `src/api/AstraeusScene.tsx`, `src/shell/StoryPanelView.tsx`, `src/shell/useDrawers.ts`, `src/shell/DisplaySwitches.tsx`; new `packages/astraeus/tests/hostPageDom.test.ts` (6 tests).

- Criterion 1 (title): `App` has internal prop `writeTitle` (default true); `mount` and `AstraeusScene` pass false. Test mounts into a page titled "Host" with a labelled definition (prepareScene mocked, because the Scene API sets no label) and shows the title stays "Host" for `mount` and `AstraeusScene`; another test shows `App` alone writes "Made-up survey · Astraeus" and not when `writeTitle` is false. Met.
- Criterion 2 (Escape): the three handlers return unless `!event.defaultPrevented`. Tests with a window capture listener calling `preventDefault` leave the story panel, phone drawer and switch panel open; unprevented Escape closes each. Met.
- Criterion 3 (isolation): `mount` sets `element.style.isolation = "isolate"`; the `AstraeusScene` wrapper has it inline (before caller `style`, so a caller can override). Asserted on both. Met.
- Criterion 4: gates green. Met.

Limitations: no real browser/stacking check; the unprevented-Escape tests only confirm the old behaviour; `mount` leaves isolation set on the host element after `unmount`.

## Drift Notes

Defer Design notes to T-184 (the O-044 integration step), named in the note.

- Deferred to T-184: Design Interfaces should note that `App` has an internal `writeTitle` prop (not public API) that `mount`/`AstraeusScene` set false, that viewer Escape handlers yield to `defaultPrevented`, and that both mount routes set `isolation: isolate`.
- Not architectural: `mount` does not restore `element.style.isolation` on unmount.
