---
id: T-456
title: A failing part stays in its own place
objective: O-100
status: done
depends_on: []
check_waiver: {task: T-456, reason: 'Owner chose "Chart first" for G-027 (2026-11-24), to be built while the label questions were answered: standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g027-20261124}, recorded_at: '2026-11-24T09:55:03Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g027-20261124}
lane: boundary
planned_reads: [packages/astraeus/src/app/PanelLoadBoundary.tsx, packages/astraeus/src/shell/useShelfPanels.tsx, packages/astraeus/src/shell/useShelfTile.tsx, packages/astraeus/src/shelf/panel/View.tsx, packages/astraeus/src/app/shelfContract.ts, packages/astraeus/src/api/listeners.ts, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/CHANGELOG.md, docs/architecture/viewer-interface.md]
planned_writes: [packages/astraeus/src/shell/PartBoundary.tsx, packages/astraeus/src/shell/useShelfPanels.tsx, packages/astraeus/src/shell/useShelfTile.tsx, packages/astraeus/src/shelf/panel/View.tsx, packages/astraeus/src/app/style.css, packages/astraeus/tests/partBoundary.test.ts, packages/astraeus/CHANGELOG.md, docs/architecture/viewer-interface.md]
---

# A failing part stays in its own place

## Outcome

Every shelf part is drawn inside an error boundary, so a part whose view throws (any cause, today's chart loop included) shows a short message where it would have drawn and the rest of the viewer stays: the canvas, the bar, the panel's title, Close and other blocks. The error is reported to the page, as a throwing host listener is.

## User Check

None beyond the Objective's; a failing part cannot be produced on the catalogue page. The unit test below is the proof.

## Done When

- **One boundary, shell code**: new `packages/astraeus/src/shell/PartBoundary.tsx`, a React error boundary that on error draws one short line in the part's place, "This part could not be drawn.", as a `role="status"` element with a class styled from the shared look tokens only (lookDrift), and reports the error once through the same page report `api/listeners.ts` uses (`reportError`, else rethrown on a timer). It may share its shape with `app/PanelLoadBoundary.tsx`; that file and its message stay unchanged.
- **Wrapped at every place the shell or a panel draws a part:** each block in `shelf/panel/View.tsx` (one boundary per block, so siblings stay), the open panel in `shell/useShelfPanels.tsx` (its `current.view`), and the tile and its sheet in `shell/useShelfTile.tsx` (both `tile.view`). The shell still imports no shelf module (`npm run check:shelf-split` passes). A boundary resets when its part is drawn again (reopening the panel, a view switch): a key or remount is enough.
- **Unit test**, new `packages/astraeus/tests/partBoundary.test.ts` (TEST-02), happy-dom, using the viewer driver of `tests/lifecycle.test.ts` in a new file (no existing test edited): a panel holding a working `explainer` and a block whose view throws (a test-only descriptor of the internal block shape; the builder reads `app/shelfContract.ts` for it). Opening the panel leaves the viewer mounted (canvas host and bar present), the panel's title and Close present, the explainer's text present, the message in the failing block's place, and the error reported once. The same for a tile whose view throws.
- **Existing tests unchanged**: every test passes unedited. If one turns red, stop and report it.
- **Docs:** viewer-interface section 11, "One contract", gains one line: a part that fails shows a short message in its own place and never takes the viewer down.
- **CHANGELOG** (`packages/astraeus/CHANGELOG.md`): open `## 0.11.1 (unreleased)` at the top if absent; one `Fixed` line: "A shelf part that fails now shows \"This part could not be drawn.\" in its own place and is reported to the page (`reportError`); before, the whole viewer unmounted."
- **Size.** `npm run check:pack`: report the engine first-download figure; expected +150 to +300 B gzip. If it passes the 527,000 B cap, stop and report.
- Configured gates pass; evidence recorded under `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/app/PanelLoadBoundary.tsx`
- `packages/astraeus/src/shell/useShelfPanels.tsx`
- `packages/astraeus/src/shell/useShelfTile.tsx`
- `packages/astraeus/src/shelf/panel/View.tsx`
- `packages/astraeus/src/app/shelfContract.ts`
- `packages/astraeus/src/api/listeners.ts`
- `packages/astraeus/tests/lifecycle.test.ts` (the driver setup at the top and the chart case only)
- `docs/architecture/viewer-interface.md` section `11. Story-component shelf`, "One contract" only
- `packages/astraeus/CHANGELOG.md` (top section only)

## Design References

`.savepoint/Design.md` under `Viewer interface`; viewer-interface section 11 ("One contract", "Pick by import").

## Guardrails

ARCH-01, API-03, API-05, TEST-01, TEST-02, STYLE-01, STYLE-02, STYLE-07, CODE-01.

## Implementation Plan

1. Write the failing test with a throwing block and a throwing tile; see the viewer unmount.
2. `PartBoundary.tsx` with the message and the page report.
3. Wrap the four draw sites.
4. Docs line, CHANGELOG, `check:pack`, `check:shelf-split`.

## Boundaries

No change to the chart (T-455, T-457) or to `PanelLoadBoundary`'s message; no host event or option for a failed part; no edit to any existing test.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/partBoundary.test.ts packages/astraeus/tests/lifecycle.test.ts packages/astraeus/tests/twoViewers.test.ts packages/astraeus/tests/lookDrift.test.ts`. Handoff: the configured gates, `npm run check:pack`, `npm run check:shelf-split`. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

| Done When | Evidence |
|---|---|
| One boundary | `src/shell/PartBoundary.tsx` (role=status line, class `part-failed` styled with look tokens in `app/style.css`; reports via `reportToPage`, now exported from `api/listeners.ts`). `lookDrift` test passes. |
| Wrapped at every draw site | `shelf/panel/View.tsx` (one boundary per block), `useShelfPanels.tsx` (open panel), `useShelfTile.tsx` (card, strip, sheet; the strip was added beyond the plan). `check:shelf-split` ok; keyed per part so it resets on redraw. |
| Unit test | `tests/partBoundary.test.ts` (2 cases: throwing block beside a working explainer, throwing tile): viewer, bar button, title, Close, sibling text, message and one report asserted. Red-first not shown (written with the code). |
| Existing tests unchanged | lifecycle, twoViewers, lookDrift, apiImports, packageBoundaries pass unedited. |
| Docs | viewer-interface section 11 "One contract": one bullet added. |
| CHANGELOG | packages/astraeus/CHANGELOG.md `## 0.12.0 (unreleased)` (opened by T-455; brief said 0.12.0, not 0.11.1): one Fixed line. |
| Size | `check:pack` pass: engine 1,834,391 B raw, 526,012 B gzip (cap 527,000; was 525,880, +132). |

Commands: `npm run typecheck` ok; eslint (ts6) on changed files ok; prettier ok (test reformatted); `npx vitest run` partBoundary, lifecycle, twoViewers, lookDrift, apiImports, astraeus-site packageBoundaries: 6 files, 201 tests pass (the grep for useShelfPanels/useShelfTile/ShelfPanel in tests found none); `check:shelf-split` ok; `check:pack` pass.
Files changed: src/shell/PartBoundary.tsx (new), src/shell/useShelfPanels.tsx, src/shell/useShelfTile.tsx, src/shelf/panel/View.tsx, src/app/style.css, src/api/listeners.ts (export only; not in planned_writes), tests/partBoundary.test.ts (new), CHANGELOG.md, docs/architecture/viewer-interface.md.
Limitations: shell now imports `reportToPage` (a value) from api/listeners; the test mocks the colourKey and readoutTile views to throw for one id.

## Drift Notes

Design.md Viewer interface: shell/PartBoundary is a new shell module that reads api/listeners `reportToPage`; the strip is also bounded.

Marked done by the coordinator under the owner's G-027 orchestration ("Chart first"; "orchestrate the rest of the goal", 2026-11-24) after the wave gate passed on 2026-11-24T10:00Z: `npm run typecheck`, `npm run lint`, `npm test` 350 files 5640 passed 2 skipped, `npm run build`, `npm run check:pack` engine 526,012 B gzip, `npm run check:shelf-split` ok. Coordinator added the required `### Breaking changes in 0.12.0` ("None yet") heading the releaseBreaks test needs.
