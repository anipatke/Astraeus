---
id: T-453
title: Readout tile speaks its shown value and names its marks
objective: O-098
status: done
depends_on: []
check_waiver: {task: T-453, reason: 'Owner said "orchestrate O-98" (2026-11-24): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o098-20261124}, recorded_at: '2026-11-24T08:17:01Z'}
owner_validation: {required: true, accepted_check: C-221, accepted_by: {role: owner, session: orchestrate-o098-20261124}}
planned_by: {role: planner, session: plan-o098-20261124}
planned_reads: [packages/astraeus/src/shelf/readoutTile/View.tsx, packages/astraeus/src/shelf/readoutTile/factory.ts, packages/astraeus/src/shelf/readoutTile/part.css, packages/astraeus/src/app/shelfContract.ts, packages/astraeus/src/shell/useShelfTile.tsx, packages/astraeus/src/shell/parts/parts.css, packages/astraeus/tests/readoutTile.test.ts, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/tests/twoViewers.test.ts, packages/astraeus/tests/domSetup.ts, packages/astraeus-site/src/catalogue/examples/readoutTile.ts, packages/astraeus/CHANGELOG.md, docs/architecture/viewer-interface.md]
planned_writes: [packages/astraeus/src/shelf/readoutTile/View.tsx, packages/astraeus/src/shelf/readoutTile/factory.ts, packages/astraeus/src/shelf/readoutTile/announce.ts, packages/astraeus/src/app/shelfContract.ts, packages/astraeus/src/shell/useShelfTile.tsx, packages/astraeus/tests/readoutTileAnnounce.test.ts, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/CHANGELOG.md, docs/architecture/viewer-interface.md]
---

# Readout tile speaks its shown value and names its marks

## Outcome

The readout tile's line no longer reads as a raw number: its screen-reader text uses the value as the app words it and names the line's marks ("Distance (invented): 4.2 units, on a log scale from 1 to 1,000; marks: Ten at 10"), and a change of the shown value is announced politely, at most once every 2 seconds and always ending on the latest value, on a wide viewer and on a phone alike (belt #28). Nothing visible changes.

## User Check

Two looks on `localhost:5490/components.html` after `npm run preview:owner`, Run on **Readout tile**:

1. No screen reader: right-click the tile's line (the track with the dot), Inspect, open DevTools' **Accessibility** pane: its Name reads "Distance (invented): 4.2 units, on a log scale from 1 to 1,000; marks: Ten at 10" and changes with the value while the time plays.
2. With Windows Narrator (the screen reader built into Windows): press Win+Ctrl+Enter to turn it on, click into the page, press play on the timeline. Narrator says "Distance (invented): … units" about every 2 seconds, not on every frame and not on load; pause, and it says the last value once, then stays quiet. Press Win+Ctrl+Enter again to turn it off. Repeat once at phone width (DevTools device bar, 390 px): the same, with the strip shown and the sheet shut, and with the sheet open (still one announcement each time, not two).

## Done When

- **The line's text**, `lineSummary` in `readoutTile/View.tsx`, takes the shown value text and the marks: `${label}: ${value}, on a ${log ? "log " : ""}scale from ${low} to ${high}` and, when the line has marks, `; marks: ${mark.label} at ${number(mark.value)}` joined by ", " (the existing `number` formatter, up to three decimals). The raw dot position is no longer in it. No new input (no `unit` or `valueText` field).
- **Announcement text**: `${label}: ${value}` (the app's own words), from one pure function in new `packages/astraeus/src/shelf/readoutTile/announce.ts` together with the throttle (`announceAfter(ms)` or similar, timers injectable through the global timer functions so fake timers drive it). Only the value text announces: `setScaleValue` alone and `setFacts` do not; a `setValue` that leaves the text unchanged does not.
- **Throttle, 2,000 ms, trailing**: the first value change starts a 2,000 ms window; further changes in the window only replace the pending text; when the window ends the region gets the latest text, unless it equals the last announced (or first drawn) text. So a host that calls `setValue` every frame is heard at most once per 2 s, a single change is heard within 2 s, and the settled value is always the last thing said. Reason (recorded in the Objective's Decisions): one label-and-value utterance takes about 1.5 to 2 s at a screen reader's default rate, so a 2 s spacing never queues announcements behind each other, and ARIA's own guidance for continuously updating content (`timer`, `marquee`, off by default) is not to speak every change.
- **One region per tile, outside the strip button and the sheet.** The tile's descriptor gains an internal third component beside `view` and `strip` (`ShelfTile.live` in `app/shelfContract.ts`, not exported from `astraeus`, no API lock change), drawn once by `shell/useShelfTile.tsx` inside the `tile` area next to the card (wide) or the strip button (phone), never inside the button and never in the sheet, so an open sheet does not double it. It renders a visually hidden `role="status"` element (the shell's existing `.visually-hidden` class in `shell/parts/parts.css`; no new CSS), empty on first draw, so mounting, a view switch to another tile and a resize from wide to phone say nothing. Its pending timer is cleared on unmount. The shell still imports no shelf module.
- **Component test, failing before**, new `packages/astraeus/tests/readoutTileAnnounce.test.ts` (happy-dom, `vi.useFakeTimers()`, the `mountShell` pattern of `tests/readoutTile.test.ts`), named cases: first draw: the status element exists and is empty; one `setValue("5 units")`: still empty at 1,999 ms, "Gap: 5 units" at 2,000 ms; ten changes within 2 s: exactly one update, with the last value; a further change after that: a second update 2 s later; `setValue` with the same text, `setScaleValue` alone and `setFacts`: no update; phone with the sheet open: exactly one status element in the viewer and it is outside `button.tile-strip-button`; unmount with a change pending: no update and no timer left (`vi.getTimerCount()` 0); the line's `aria-label` carries the value text and every mark ("Half at 50"). Two viewers: a change in viewer A updates only A's status element.
- **Existing tests.** `tests/readoutTile.test.ts` (strip `textContent` lines 213 and 232, "with no strip" on a wide viewer) and `tests/twoViewers.test.ts` (the tile case) pass unedited: the status element is outside the strip and starts empty. `tests/lifecycle.test.ts` lines 1141-1143 pin today's line text "Gap on a log scale from 1 to 100: 10"; this Task changes that one expected string to "Gap: 4 units, on a log scale from 1 to 100" **only if the owner has approved it in the Objective's Decisions** (listed there as "Open for the owner"); without that approval, stop and report before editing. No other line of an existing test changes; if another case turns red, stop and report.
- **Doc comments.** `ReadoutTileControl` keeps "silent" for the host (no event); `setValue`'s comment adds "a screen reader hears the new value politely, at most once every 2 s". No signature change.
- **CHANGELOG** (the open 0.11.0 section only, one line of your own): "Fixed: the `readoutTile`'s screen-reader text reads the value as shown and names the line's marks, and a screen reader hears value changes politely, at most once every 2 seconds." Not a breaking change.
- **Docs.** `docs/architecture/viewer-interface.md` section 11, the `readoutTile` row only: "the line's text is the label, the shown value, the scale and its marks; value changes are a polite status, throttled to one per 2 s".
- **Size.** The tile's view and announcer load only when `readoutTile` is imported (`npm run check:shelf-split`, which must stay ok: `announce.ts` is imported only from the tile's own files); `useShelfTile.tsx` is on the first download (expected +20 to +50 B gzip). Run `npm run check:pack` and `npm run check:shelf-split` and report the engine figure; if the 527,000 B gzip cap is passed, stop and report.
- Configured gates pass; evidence recorded under `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/shelf/readoutTile/View.tsx`
- `packages/astraeus/src/shelf/readoutTile/factory.ts`
- `packages/astraeus/src/app/shelfContract.ts` (`ShelfTile`)
- `packages/astraeus/src/shell/useShelfTile.tsx`
- `packages/astraeus/tests/readoutTile.test.ts` (the "the shell draws the tile in its own place" block, for `mountShell` on wide and phone)
- `packages/astraeus/tests/lifecycle.test.ts` (the "readoutTile (O-081 T-338)" case only)
- `packages/astraeus/CHANGELOG.md` (top section only)
- `docs/architecture/viewer-interface.md` section 11 (the parts table)
- `/home/user/code/belt/docs/astraeus-improvements.md` row 28 (read only)

## Design References

`.savepoint/Design.md` under `Viewer interface`; viewer-interface note section 11 (the `readoutTile` row) and the `tile` area rows of its areas table.

## Guardrails

TEST-01, TEST-02, TEST-03, STYLE-01, STYLE-02, STYLE-05, STYLE-07, CODE-01.

## Implementation Plan

1. Write `tests/readoutTileAnnounce.test.ts` and see it fail (no status element, raw line text).
2. `announce.ts`: the text function and the trailing 2,000 ms throttle.
3. The tile's `live` component; `ShelfTile.live`; `useShelfTile` draws it once in the tile area on both layouts.
4. `lineSummary` with the value text and marks.
5. With the owner's approval recorded, the one expected string in `lifecycle.test.ts`; doc comments, CHANGELOG line, viewer-interface row.
6. `npm run check:pack`, `npm run check:shelf-split`.

## Boundaries

No new input, option or setting (no `unit`, `valueText` or throttle field); no visible change (value, strip, sheet, card, line, facts, placement); no announcement for facts or the dot alone; no change to the explainer or chart; no existing test edited beyond the one approved expected string; no browser step added.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/readoutTileAnnounce.test.ts packages/astraeus/tests/readoutTile.test.ts packages/astraeus/tests/lifecycle.test.ts packages/astraeus/tests/twoViewers.test.ts packages/astraeus/tests/shelfInputTable.test.ts packages/astraeus/tests/lookDrift.test.ts packages/astraeus-site/tests/apiReference.test.ts packages/astraeus-site/tests/shelfCatalogue.test.ts`. Handoff: the configured gates, `npm run check:pack` and `npm run check:shelf-split`. No browser step: the throttle is timing logic that fake timers prove exactly and a headless browser cannot hear; the existing `catalogue` step still draws the tile at the Full Check. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Extra reads: none beyond Context Files (also read `tests/domSetup.ts` mountShell and `src/shelf/useCell.ts`, planned reads).

| Done When | Evidence |
|---|---|
| Line text (value, scale, marks; no dot position) | `lineSummary` in View.tsx; `readoutTileAnnounce.test.ts` "the line's aria-label carries the value text and every mark"; lifecycle.test.ts tile line now "Gap: 4 units, on a log scale from 1 to 100" (owner-approved, Objective answer 1) |
| Announcement text and throttle in `announce.ts` | `announceAfter`, `announcedText`; tests "one change is silent until 2,000 ms", "ten changes ... one update", "the same text, the dot alone and the facts say nothing", "a change that returns ... says nothing" |
| 2,000 ms trailing throttle | same cases (1,999 ms empty, 2,000 ms said; a further change says 2 s later) |
| One region per tile, outside button and sheet | `ShelfTile.live` (shelfContract.ts, internal), `ReadoutTileLive`, drawn once in `useShelfTile` tile area; test "phone with the sheet open: one status element ... outside the strip button and the sheet"; "first draw ... empty"; "unmount with a change pending: no update and no timer left" (`getTimerCount()` 0) |
| Two viewers | test "two viewers: a change in one viewer updates only its status element" |
| Existing tests unedited | readoutTile.test.ts, twoViewers.test.ts pass; lifecycle.test.ts only the one approved string |
| Doc comment | `setValue` comment in factory.ts (the "silent" wording kept) |
| CHANGELOG, docs | one line in 0.11.0 Fixed; readoutTile row in viewer-interface.md section 11 |
| Size | `check:pack` pass: engine 525,880 B gzip (cap 527,000; includes concurrent builders' work); `check:shelf-split` ok |

Commands: `npm run typecheck` clean; eslint (TS6 shim) and prettier --check on changed files clean; `npx vitest run` on readoutTileAnnounce, readoutTile, lifecycle, twoViewers, shelfInputTable, lookDrift, apiImports, packageBoundaries, apiReference, shelfCatalogue: 10 files, 373 tests passed. `npm run api:lock` rewrote `api-surface.lock.json` with no diff (API lock unchanged). Red-first not run separately (no status element existed before).

Files changed: src/shelf/readoutTile/View.tsx, factory.ts, announce.ts (new), src/app/shelfContract.ts, src/shell/useShelfTile.tsx, tests/readoutTileAnnounce.test.ts (new), tests/lifecycle.test.ts (one string), CHANGELOG.md, docs/architecture/viewer-interface.md.

Limitations: the new test drives the viewer's cell directly (as the control writes it); handle-level `setValue` is covered by the existing lifecycle case. No browser/screen-reader run (owner User Check).

## Drift Notes

None. `ShelfTile.live` is optional (internal), so a tile without it draws no status.

Marked done by the coordinator under the owner's "orchestrate O-98" (2026-11-24) after the wave gate passed (`npm run typecheck`, `npm run lint`, `npm test` 348 files 5634 passed 2 skipped, `npm run build`, `npm run check:pack`, `npm run check:shelf-split`). Owner checked on localhost:5490 (`npm run preview:owner`, branch o098-screen-readers at 0dde837f, 2026-11-24T08:23Z; components.html, DevTools Accessibility pane) and said "looks good". The acceptance fields are filled in once the Full Objective Check has an id.
