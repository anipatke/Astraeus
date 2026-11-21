---
id: T-333
objective: O-080
title: Let a story add its own bar buttons and custom panels
status: planned
depends_on: []
check_waiver: {task: T-333, reason: 'Owner said "Orchestrate 080": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o080-20261121}, recorded_at: '2026-11-21T05:15:22Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o080-20261121}
---

# Let a story add its own bar buttons and custom panels

## Outcome

The shelf groundwork: `scene.addParts`, `handle.part(descriptor)` with typed controls, the `bad-part` code, and the first two parts, `panel` and `customBlock`. A panel's button sits in the bar as a `story` item and its panel opens through the panel rule; a custom panel (a `panel` whose only block is a `customBlock`) hands the host an element to fill.

## User Check

A synthetic scene with two panels shows two story buttons after the switch on a 1280 px viewer; pressing one opens its panel at the left (closing About or a card), pressing the other replaces it, Escape closes it. At 360 px the row keeps the first button and the second is in the menu under "This story". A panel listed only in view B is hidden in view A and closes on switching to A. A host fills the custom block's element and its content survives closing and reopening the panel.

## Done When

The O-080 Success Conditions "One shelf contract", "Bar and panels" and the `panel`/`customBlock` part of "First set" hold, with named tests on both embedding paths (one lifecycle suite), a synthetic scene (ARCH-03), a two-viewer test (API-03), the `bad-part` and `duplicate-id` cases, and fit-rule cases for story buttons. The shell renders `descriptor.view` and never imports a shelf module. Site browser driver and any affected journey updated in this Task if the bar's DOM changes. README, CHANGELOG (0.9.5 section), doc comments (factories carry `@shelf`), `npm run api:errors`, `npm run api:lock`. Apply `docs/agents/verification.md`.

## Context Files

- `docs/architecture/viewer-interface.md` under `4. Bar`
- `docs/architecture/viewer-interface.md` under `5. Panels`
- `docs/architecture/viewer-interface.md` under `7. Public interface (O-079, O-080, O-081)`
- `docs/architecture/viewer-interface.md` under `9. Module structure and contributor guide`
- `docs/architecture/viewer-interface.md` under `11. Story-component shelf`
- `.savepoint/objectives/O-080-story-buttons-and-panels-in-the-bar/Objective.md`
- `.savepoint/Design.md` under `Viewer interface`
- `.savepoint/Design.md` under `Views of one scene`
- `.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)`
- `packages/astraeus/src/api/scene.ts`
- `packages/astraeus/src/api/aboutInput.ts`
- `packages/astraeus/src/api/viewerHandle.ts`
- `packages/astraeus/src/api/viewerAbout.ts`
- `packages/astraeus/src/api/views.ts`
- `packages/astraeus/src/api/errors.ts`
- `packages/astraeus/src/api/index.ts`
- `packages/astraeus/src/shell/bar/barItems.ts`
- `packages/astraeus/src/shell/bar/barEntries.tsx`
- `packages/astraeus/src/shell/bar/BarMenu.tsx`
- `packages/astraeus/src/shell/panels/panelRule.ts`
- `packages/astraeus/src/shell/panels/usePanels.ts`
- `packages/astraeus/src/shell/AboutPanel.tsx`
- `packages/astraeus/src/shell/AstraeusShell.tsx`
- `packages/astraeus/tests/lookDrift.test.ts`
- `packages/astraeus-site/tools/validate/driver.mjs`
- `packages/astraeus/README.md` under `Looks, controls and views`
- `packages/astraeus/CHANGELOG.md` (top section only)

## Design References

Design "Viewer interface", "Views of one scene", "Public API shape (G-016, owner 2026-11-01)", "Good guest", "One handle, one lifecycle", "Host calls land in order".

## Guardrails

ARCH-01, ARCH-02, ARCH-03, API-01, API-02, API-03, API-04, API-05, API-07, TEST-01, TEST-03, STYLE-07, STYLE-09.

## Implementation Plan

1. Confirm the bar's `storyItem` and the panel rule's `left` place exist as the note describes; return REPLAN REQUIRED if not.
2. Add the descriptor shape (public fields plus the internal `view`), `bad-part` with its doc comment, and `scene.addParts` (append, `duplicate-id` across part and block ids, build-time checks such as a view naming an unknown part).
3. Add `handle.part(x)` on the shared `ViewerHandle` (so `mount` and `AstraeusScene` match), `bad-part` for a part not in this viewer's scene, `not-mounted` outside the lifecycle, calls landing in host order.
4. `src/shelf/panel/` and `src/shelf/customBlock/`: factories checked at the call, `PanelControl` (`open`, `setOpen`, `onOpen`) and `CustomBlockControl` (`element`, alive from `ready` to `unmount`, hidden while closed).
5. Shell: story items from parts in `addParts` order, hidden outside their views; the menu's "This story" group; the shelf panel as a `left` occupant (phone detail sheet) and a view switch closing a panel the view does not show. Render `descriptor.view`; no shelf import in the shell.
6. Extend the drift check to `src/shelf`; style only from the shared look.
7. Tests, synthetic scene, README, CHANGELOG, api errors and lock; migrate driver/journeys if the bar DOM changed.

## Boundaries

No content parts (explainer, actions, chips, colour key: next Task), no catalogue page, no readout tile or chart, no changes to story panels' timing or the site's demos.

## Technical Verification

Focused tests during iteration; configured gates at handoff (AGENTS.md Verification Policy). Evaluated later under `agent-skills/references/check-method.md`. No browser run per step; the Full Check runs `check:browser` once.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas for the planner; reconciled in the last O-080 Task before the Full Objective Check.
