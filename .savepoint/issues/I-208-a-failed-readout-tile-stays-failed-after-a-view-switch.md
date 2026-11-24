---
id: I-208
title: A failed readout tile stays failed after a view switch to another, working tile
type: defect
status: open
source:
  kind: check
  check: C-222
  actor: {role: checker, session: check-o100-20261124}
  at: '2026-11-24T10:15:31Z'
tasks: [T-456]
checks: [C-222]
guardrail_ids: [TEST-01, TEST-02]
severity: low
history:
  - at: '2026-11-24T10:15:31Z'
    actor: {role: checker, session: check-o100-20261124}
    kind: observed
    note: 'C-222 probe (throwaway happy-dom tests, deleted after the run): mount a Scene with two readoutTiles, "broken-tile" (its view made to throw, as tests/partBoundary.test.ts does) in view v1 and "ok" in view v2; after the message shows, handle.setView("v2"): the tile area still reads "This part could not be drawn." instead of "Fine gap". The same through tests/domSetup mountShell + showParts at wide and phone width (card and strip). Cause: the card and strip PartBoundary in shell/useShelfTile.tsx have no key, so React keeps the failed boundary instance when the tile part changes.'
    check: C-222
  - at: '2026-11-24T10:20:00Z'
    actor: {role: executor, session: repair-i208-20261124}
    kind: repair_attempted
    note: 'Strategic fix (one rule for every draw site): `shell/PartBoundary.tsx` takes a required `part` prop (the drawn part id) and resets its failed state in getDerivedStateFromProps when the id changes, so a site cannot omit the reset (typecheck refuses a boundary without `part`). All five sites pass it: `shell/useShelfTile.tsx` card, strip and sheet (`part={tile.id}`), `shell/useShelfPanels.tsx` (`key` kept, `part={current.id}`), `shelf/panel/View.tsx` blocks (`key` kept, `part={block.id}`). New test `tests/partBoundaryReset.test.ts` (existing tests unedited; ReadoutTileView and ReadoutTileStrip made to throw for "broken-tile", ColourKeyView for "broken"): table over wide (section.tile-card) and phone (button.tile-strip-button) through mountShell + showParts: failed tile shows the message with 1 report; showParts([ok]) draws "Fine gap" and "7 units", no message, no .part-failed, still 1 report; showParts([broken]) shows the message again with 2 reports (second is the view/strip error). Panel case: open Notes (1 .part-failed, "Working paragraph." present, 1 report), Close, reopen: message again, 2 reports. Red first: with HEAD''s useShelfTile.tsx copied in, wide and phone fail ("expected ''This part could not be drawn.'' to contain ''Fine gap''"), panel case passes (panels already keyed); restored, 3/3 pass. Focused run from repo root: partBoundaryReset, partBoundary, readoutTile, readoutTileAnnounce, lifecycle, shelfBar, twoViewers, chartAxisLabel: 8 files, 235 passed. typecheck pass; eslint and prettier clean on the 5 changed files; check:shelf-split ok (filterChips only); check:pack pass, engine 1,834,583 B raw / 526,064 B gzip (cap 527,000). Unverified: the public mount + setViews + handle.setView path (the C-222 probe) was not re-run as a test; the sheet boundary has no dedicated reset case (a view switch closes the sheet); full npm test, lint and browser not run (coordinator gate). Executor evidence only; the Issue stays open for a Check.'
---

# I-208: A failed readout tile stays failed after a view switch to another, working tile

## Summary

O-100 T-456 Done When: "A boundary resets when its part is drawn again (reopening the panel, a view switch): a key or remount is enough." The panel boundaries are keyed (`key={current.id}` in `shell/useShelfPanels.tsx`, `key={block.id}` in `shelf/panel/View.tsx`) and reset, but the tile's card and strip boundaries are not. After one view's tile fails, a view switch to another view whose tile works keeps showing the failure message in the tile area; the healthy tile is never drawn until the tile area itself unmounts (a view with no tile) or the layout flips between wide and phone.

## Evidence

- `packages/astraeus/src/shell/useShelfTile.tsx:83-85` (strip) and `:89-91` (card): `<PartBoundary>` with no `key`, while `tile` changes with the showing view (`:57`). The sheet's boundary (`:44-46`) resets because a view switch closes the sheet (`:65-70`).
- Probe through the public API (happy-dom, `mount`, `Scene.setViews` with `panels: ["broken-tile"]` / `["ok"]`, `handle.setView("v2")`): tile area text after the switch `"This part could not be drawn."`, expected to contain `"Fine gap"`. Same result with `mountShell({ phone: false | true })` + `showParts([two])`.
- `tests/partBoundary.test.ts` covers a failing block and a failing tile but no reset: no case draws the part again after a failure (reopen or view switch).

## Proof Needed

A new test (existing tests unedited): with two readoutTiles in two views, the first one's view throwing, a view switch to the second view draws the second tile (its label and value present, no "This part could not be drawn.") at wide width (card) and phone width (strip), and switching back shows the message again for the failing tile with one further report; plus a panel case: a panel whose block failed, closed and reopened, draws the block's boundary afresh (the message again, a second report). Run it with `tests/partBoundary.test.ts`, `tests/readoutTile.test.ts` and `tests/readoutTileAnnounce.test.ts`, and the configured gates.
