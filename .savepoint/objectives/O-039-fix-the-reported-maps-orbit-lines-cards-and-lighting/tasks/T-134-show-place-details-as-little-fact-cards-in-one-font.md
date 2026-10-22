---
id: T-134
title: Show place details as little fact cards in one font
objective: O-039
status: planned
check_waiver:
  task: T-134
  reason: "Owner skipped the optional Task Check for the O-039 overnight run ('Skip them, one big check at the end'); the Full Objective Check covers it."
  actor: {role: owner, session: 8d73d3f8}
  recorded_at: '2026-10-22T10:40:06Z'
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o039-planning-20261022}
lane: cards
planned_reads: [/home/user/code/planetary-explorer/src/features/hotspots/FeatureDetails.tsx, docs/evidence/map-audit-20261021/card-fonts.md, src/shell/InfoPanel.tsx, src/shell/infoModel.ts, src/shell/style.css, src/shell/phone.css, tests/infoProvenance.test.ts, tests/moonFamilyPanel.test.ts]
planned_writes: [src/shell/InfoPanel.tsx, src/shell/infoModel.ts, src/shell/style.css, src/shell/phone.css, tests/infoCards.test.ts]
---

# Show place details as little fact cards in one font

## Outcome

Place cards show the feature type as a badge and each detail (Fun Fact, Naming origin, Map cue and the like) as its own small boxed card, ported from Planetary Explorer's `FeatureDetails.tsx`; every place, moon and planet card reads in the shell's one UI font with tabular figures (I-058).

## User Check

On the preview, open Charon's dark polar region, a Mars crater and a moon card: details sit in small boxes, nothing is in the typewriter font, and the card reads tidily on a phone-sized window and on desktop.

## Done When

- The place-card subtitle becomes a badge with the feature type; each detail is a small box with its label above its value, following the donor's structure and spacing (rounded border, quiet background, small capital label).
- `.info-panel-subtitle` and `.info-panel-facts dd` no longer set a monospace font; values use the UI font with `font-variant-numeric: tabular-nums`. Moon and planet fact rows also use the UI font. Metric readouts outside the info panel are unchanged.
- No overlaps or horizontal scroll at 375x667 and 1280x720 (owner rule), checked by the owner on the preview.
- `tests/infoCards.test.ts` pins the rendered structure (badge, one box per detail) and that no info-panel rule sets a monospace font. Existing info tests pass. Owner verdict recorded. Configured gates pass.

## Context Files

`/home/user/code/planetary-explorer/src/features/hotspots/FeatureDetails.tsx` (read only), `docs/evidence/map-audit-20261021/card-fonts.md`, `src/shell/InfoPanel.tsx`, `src/shell/infoModel.ts`, `src/shell/style.css`, `src/shell/phone.css`, `tests/infoProvenance.test.ts`, `tests/moonFamilyPanel.test.ts`.

## Design References

Design: Components/Codebase Map row for `src/shell/`.

## Guardrails

ARCH-01, STYLE-07, STYLE-09, STYLE-10.

## Implementation Plan

1. Port the donor's detail-box structure into `InfoPanel.tsx`, translating its Tailwind classes into `style.css` rules; keep Astraeus's UI font (owner decision 4).
2. Mark which facts are place details versus object facts in `infoModel.ts` only if the structure needs it; no data edits.
3. Drop the two monospace rules; add tabular figures.
4. Write the test; ask the owner to look on phone and desktop sizes.

## Boundaries

Info panel only; no data file edits, no change to story panels or metric readouts. No browser sets, no screenshots.

## Technical Verification

Focused node tests; configured gates at handoff; owner's look on the preview. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Deferred to T-137.
