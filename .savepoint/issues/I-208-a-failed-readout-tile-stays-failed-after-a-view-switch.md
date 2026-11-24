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
