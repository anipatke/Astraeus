---
id: T-187
title: Label modelled facts and give every orbit body a Sun distance
objective: O-045
status: planned
depends_on: [{task: T-185, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o045-planning-20261028}
---

# Label modelled facts and give every orbit body a Sun distance

## Outcome

Provenance can say "modelled" with the same word the story-panel badge uses, each event can carry its own provenance, the group's provenance override is documented, and a body added from an elements record shows the same live "Distance from Sun" readout on its card as built-in Swift-Tuttle (findings G2, G3).

## User Check

None required (owner chose no extra look, 2026-10-28).

## Done When

- `ProvenanceSourceType` includes `"modelled"`; every place that lists, validates or displays source types handles it (search named in evidence), and its displayed word matches the panel badge "Modelled".
- `EventInput` takes an optional `provenance`; an event with one shows it, an event without one shows the `addEvents` provenance as today (TEST-03); a malformed per-event provenance throws the same error code as a malformed batch one, naming the event.
- `GroupInput`'s doc comment states that a group shows its orbit elements' `sourceType` with the position along each orbit as illustrative, and the note it appends.
- A card test shows an elements body's live Sun distance readout, matching Swift-Tuttle's format and updating with time; Swift-Tuttle's card unchanged.
- No collision or overlap introduced at 375x667 or 1280x720 (owner standing rule).
- Doc comments on every new or changed member; hand-off gates green.

## Context Files

`packages/astraeus/src/core/provenance.ts`, `packages/astraeus/src/api/story.ts` under `EventInput`, `packages/astraeus/src/api/scene.ts` under `addEvents` and `addBodyFromElements`, `packages/astraeus/src/api/group.ts` under `GroupInput`, `packages/astraeus/src/shell/storyPanels.ts` under `PanelBadge`, `packages/astraeus/src/shell/InfoPanel.tsx`, `packages/astraeus/src/shell/infoModel.ts`, `packages/astraeus/src/core/bodies/swiftTuttle.ts`, `packages/astraeus/src/core/elementsBody.ts`, `packages/astraeus/tests/infoCards.test.ts`, `packages/astraeus/tests/publicApiStory.test.ts`, `packages/astraeus/tests/publicApiGroup.test.ts`.

## Design References

Design Interfaces and Data Flow (provenance, story layer); Components/Codebase Map (`src/shell/` cards).

## Guardrails

ARCH-01, ARCH-03, TEST-01, TEST-02, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Add `"modelled"` and handle it everywhere source types are listed or shown.
2. Per-event provenance with fallback; group doc comment.
3. Find how Swift-Tuttle's card gets its Sun distance readout and give elements bodies the same; tests.

## Boundaries

No credit field on panels, no panel length limits, no change to panel badges' set (owner, 2026-10-28); no browser runs, no screenshots.

## Technical Verification

Focused tests; hand-off gates. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Defer Design notes to T-188 (the O-045 integration step), named in the note.
