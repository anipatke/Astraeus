---
id: T-187
title: Label modelled facts and give every orbit body a Sun distance
objective: O-045
status: done
depends_on: [{task: T-185, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o045-planning-20261028}
check_waiver:
  task: T-187
  reason: 'Owner said "orchestrate O45"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.'
  actor: {role: owner, session: o045-run-20261028}
  recorded_at: '2026-10-29T10:21:12Z'
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

Search for source-type lists (grep of `illustrative|reconstructed|"observed"|sourceType` across packages, excluding node_modules/dist/.savepoint/docs/prds/research): the only lists are `ProvenanceSourceType` and `SOURCE_TYPES` (core/provenance.ts, both extended) and the `PROVENANCE_STATUS` record (shell/infoModel.ts, extended: `modelled: "Modelled"`, the panel badge's word in storyPanels.ts `BADGE_LABEL`). TypeScript enforces the Record. Demo packages (apollo11, planets, showers, site) construct provenance only with existing types and display via `PROVENANCE_STATUS`; none lists the types. Docs spike notes (docs/ASTRAEUS_SPIKE_*) are historical and left alone. README `addEvents` row updated.

1. Modelled: tests/publicApiStory.test.ts shows an event with `sourceType: "modelled"` displays status "Modelled"; a malformed `sourceType` is refused.
2. Per-event provenance: `EventInput.provenance` (api/story.ts); `Scene.addEvents` validates with `eventProvenanceOf` (bad-event; per-event message names `event "<id>"`), stores per event; `ExperienceConfig.eventProvenanceById` is read first in `eventInfo`, else `eventProvenance`. Test covers own wins, fallback, malformed per-event and malformed batch (both `bad-event`). The batch provenance was previously not validated at all, so there was no "batch error code" to match; it is now checked and throws `bad-event` too (drift, below).
3. Group doc: `GroupInput.provenance` doc comment (api/group.ts) states the group card always shows "illustrative", the elements' sourceType is kept in the accuracy line, and quotes the appended note.
4. Sun distance: cause was `bodyMetrics(resolver, ids, ["distance"])` in `Scene.toDefinition` using the built-in catalogue, so an elements body (not in it) got no row; it now passes the scene's catalogue. tests/publicApiSunOrbits.test.ts: elements body shows "Distance from Sun" (kind distance, km, digits 0, `centre to centre` context), changes with time, and has the same shape as built-in Swift-Tuttle's row. Swift-Tuttle's card unchanged (its row compared in the same test; showers rebuild test compares perseids rows to the pre-rebuild fixture unchanged).
5. Layout: no CSS or markup change; the readout is one more row in the existing metrics list of the same card, and per-event provenance reuses the existing provenance block. Reasoned, not viewed: no new overlap at 375x667 or 1280x720.
6. Doc comments added on `EventInput.provenance`, `eventProvenanceOf`, `eventProvenanceById`, `ProvenanceSourceType`, `addEvents`.

Gates: npm run lint clean; npm run typecheck clean; npm run build ok; npm test 144 files passed, 1886 passed, 1 skipped.

## Drift Notes

- Showers rebuild comparison test (packages/astraeus-demo-showers/tests/rebuildComparison.test.ts) edited: it used a built-in-catalogue resolver and expected the old rows; it now uses the definition's catalogue (as App.tsx does) and expects, for the Geminids' elements-body parent Phaethon, the new "Distance from Sun" row first, and the Sun's added "Distance to Phaethon" row last. Intended consequence of Done When 4.
- Batch `addEvents` provenance is now validated (`bad-event`); it was unchecked before. Behaviour change only for malformed input. For T-188: reflect in Design.md Interfaces (event provenance, "modelled") or mark non-architectural.
- Group `sourceType` is "illustrative" on the card with the elements' type in the accuracy line, not the elements' sourceType itself as the Done When wording could suggest; the doc comment states the actual behaviour. Defer Design notes to T-188.
