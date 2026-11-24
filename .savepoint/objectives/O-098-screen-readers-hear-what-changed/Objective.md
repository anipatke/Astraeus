---
id: O-098
title: Screen readers hear what changed
status: planned
depends_on: [O-097]
release: G-025
priority: medium
rank: 4
---

# O-098: Screen readers hear what changed

## Outcome

Explainer paragraph changes made through `setParagraphs` are announced politely, never on first render (belt #21, owner decision 5); the readout tile's accessible line uses its shown value text, names its marks and announces value changes politely and throttled (belt #28); the chart's accessible summary names its marks ("marks: 3:1 at 2.5, 5:2 at 2.82, …") (belt #18, summary half).

## Why

Lost accessibility: today these changes are silent or read as raw numbers.

## Success Conditions

- **Explainer (T-452).** The paragraphs sit in one always-drawn polite, atomic live region (`aria-live="polite"`, `aria-atomic="true"`); the heading and notes are outside it. The region exists from the first draw and is the same node after `setParagraphs`, so a change is announced and a first draw (including each panel open) is not. Proven by a component test that fails today.
- **Readout tile (T-453).** The line's screen-reader text is "label: shown value, on a [log ]scale from low to high; marks: name at value, …" (no raw dot position). A change of the shown value text is announced in one visually hidden `role="status"` element per tile, outside the phone's strip button and sheet, empty on first draw, throttled to at most one update per 2,000 ms (trailing; the latest value always lands; an unchanged text, `setScaleValue` alone and `setFacts` announce nothing). Proven with fake timers in a component test that fails today, on a wide viewer and a phone (sheet open: still one region).
- **Chart (T-454).** The summary names every drawn mark in value order ("; marks: 5:2 at 2.82, …", the summary's own two-decimal formatter), before the highlight clause; a mark the bins no longer cover is left out. Proven by a component test that fails today.
- **No option, input or look change**: no new field, setting or CSS beyond the explainer's one wrapper line (tokens only); the API lock is unchanged; nothing visible moves (`lookDrift` and the existing shelf tests pass).
- **Existing tests**: unedited, except the two expected strings that pin today's accessible text (`tests/lifecycle.test.ts` lines 1067-1069 chart summary, 1141-1143 tile line), changed only with the owner's approval below.
- CHANGELOG 0.11.0 has one `Fixed` line per part (no breaking change); viewer-interface section 11's `explainer`, `readoutTile` and `chart` rows state the rule. The README has no accessibility section, so it is not touched.
- Engine first download stays under its 527,000 B gzip cap (expected +40 to +90 B: the explainer's CSS line and the shell's tile-area line; each part's JS stays in its own chunk, `npm run check:shelf-split` ok).
- No browser step is added; the Full Objective Check runs the quick tier per the browser policy (the existing `catalogue` step draws all three parts).

## Design Confirmation

Owner confirmed this design at Goal level on 2026-11-22 (G-025 Outcome and decision 5; correctness only, no restyling, no new options). Tasks detailed in planning session plan-o098-20261124.

## Decisions

- Planner, 2026-11-24: each part is self-contained, no shared live-region helper. The explainer needs only two attributes on a wrapper; the tile needs a throttled hidden status; the chart needs no live region (its marks never change). A shared helper would be one more module whose import the shelf-split rule must police, for no shared code. So T-452, T-453 and T-454 have no dependencies and run in parallel; their writes are disjoint except their own line in CHANGELOG 0.11.0 and their own row in viewer-interface section 11 (shared writes, so no `independence` metadata; builders edit only their own line or row), and T-453 and T-454 each change a different expected string in `tests/lifecycle.test.ts` (different cases, lines 1067-1069 and 1141-1143).
- Planner, 2026-11-24: tile throttle 2,000 ms, trailing. One label-and-value utterance takes about 1.5 to 2 s at a screen reader's default rate, so 2 s spacing never queues announcements behind each other and the settled value is the last heard; ARIA's guidance for continuously updating content (`timer`, `marquee`: live off by default) is not to speak every change, and the catalogue tile changes every frame while time plays.
- Planner, 2026-11-24: the tile's region is drawn by the shell once in the `tile` area (an internal `ShelfTile.live` component beside `view` and `strip`), because on a phone the strip is a button (a region inside it is unreliable) and the full view is only mounted in the sheet, where it would double the strip's.
- Planner, 2026-11-24: the chart's mark values use the summary's existing formatter ("2.5", not "2.50" as first written in the Outcome), one number style per summary.
- Planner, 2026-11-24: no browser step. Each part's proof is an attribute, a node identity or timer logic that happy-dom with fake timers shows exactly; a headless browser cannot hear an announcement either. The explainer Task has no owner validation (nothing on localhost:5490 changes an explainer's paragraphs); the tile and chart Tasks give a DevTools Accessibility pane route, and the tile a Windows Narrator route.

### Owner answers (2026-11-24)

1. "Allow both": T-453 and T-454 may change exactly the two expected strings named above in `packages/astraeus/tests/lifecycle.test.ts` (lines 1067-1069 chart summary; 1141-1143 tile line); no test setup changes.
2. "Always announce": T-452 has no throttle for 0.11.0, per decision 5. Revisit only if a host shows the frequent-rewrite case.
3. "Keep it static": the explainer catalogue example stays as it is.
4. "orchestrate O-98": standing orchestration rules: own branch, Sonnet builders T-452, T-453, T-454 in parallel (shared files only on their own lines), optional step checks waived, coordinator marks steps done when gates pass, owner look where a Task requires it before one Full Objective Check.

## Boundaries

**In scope:** live regions and accessible text in the explainer, readout tile and chart parts.

**Out of scope:** announcements for other parts; readout-tile placement.
