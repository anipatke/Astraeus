---
id: T-452
title: Explainer paragraph changes are announced politely
objective: O-098
status: done
depends_on: []
check_waiver: {task: T-452, reason: 'Owner said "orchestrate O-98" (2026-11-24): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o098-20261124}, recorded_at: '2026-11-24T08:17:01Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o098-20261124}
planned_reads: [packages/astraeus/src/shelf/explainer/View.tsx, packages/astraeus/src/shelf/explainer/factory.ts, packages/astraeus/src/shelf/explainer/part.css, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/tests/twoViewers.test.ts, packages/astraeus/tests/shelfContentParts.test.ts, packages/astraeus/tests/lookDrift.test.ts, packages/astraeus/CHANGELOG.md, docs/architecture/viewer-interface.md]
planned_writes: [packages/astraeus/src/shelf/explainer/View.tsx, packages/astraeus/src/shelf/explainer/factory.ts, packages/astraeus/src/shelf/explainer/part.css, packages/astraeus/tests/explainerLive.test.ts, packages/astraeus/CHANGELOG.md, docs/architecture/viewer-interface.md]
---

# Explainer paragraph changes are announced politely

## Outcome

When a host calls `setParagraphs` while an explainer is shown, a screen reader hears the new paragraphs politely (after what it is saying), read as a whole; the first draw of the explainer, including every time its panel opens, says nothing extra (belt #21, owner decision 5: always, no option). The visible text and layout are unchanged.

## User Check

Not required (`owner_validation.required: false`): no page on localhost:5490 changes an explainer's paragraphs (the catalogue example is static) and the owner is not a screen-reader user by default; the polite region, the silent first draw and the change are proven by the component test. Optional look, no screen reader needed: run `npm run preview:owner`, open `localhost:5490/components.html`, press Run on **Explainer**. Right-click the first paragraph, Inspect, then in DevTools open the **Accessibility** pane and select the paragraph's parent element: it shows "Live region: polite" and "Atomic (live regions): true". The heading and the small note sit outside that element. The panel looks exactly as before.

## Done When

- **Polite region on the paragraphs only.** `ExplainerView` wraps the paragraphs in one element (`<div className="shelf-explainer-paragraphs" aria-live="polite" aria-atomic="true">`) that is drawn on every render, even when `paragraphs` is empty, so it exists from the first draw (a region that exists before its text changes is the reliable pattern; one added with its text is not announced, which is what makes the first draw silent). The heading and notes stay outside it. No `role="status"`/`alert`, no hidden copy of the text, no timer.
- **Same look.** The wrapper is laid out as the section is today: one CSS line in `explainer/part.css` gives it `display: grid; gap: var(--astraeus-space-4); min-width: 0;` (tokens only, lookDrift), so paragraph spacing, wrapping (O-097's `overflow-wrap`) and the section's gaps are unchanged. Not `display: contents` (it drops the region from the accessibility tree in some browsers).
- **Component test, failing before**, new `packages/astraeus/tests/explainerLive.test.ts` (happy-dom, the panel-open pattern of `tests/lifecycle.test.ts`'s shelf content case): on first draw the paragraphs sit inside an element with `aria-live="polite"` and `aria-atomic="true"`, and the heading and note do not; that element is the same node after `setParagraphs` (not re-created, so the change is announced) and now holds the new text; an explainer with `paragraphs: []` beside a heading still draws the empty region, and a later `setParagraphs(["x"])` fills that same node; closing and reopening the panel draws the region again with the current text (silent, as a first draw). Two viewers keep their own regions (one assertion is enough, as `twoViewers.test.ts` does for paragraphs).
- **Existing tests unchanged**: `tests/lifecycle.test.ts` ("shelf content parts (O-080 T-334)", lines 1012-1017, read `.shelf-explainer-text` as descendants), `tests/twoViewers.test.ts` ("API-03: chips, text and a key…"), `tests/shelfContentParts.test.ts`, `tests/shelfInputTable.test.ts` and `tests/lookDrift.test.ts` pass unedited. If one turns red, stop and report; do not edit it.
- **Doc comment.** `ExplainerControl.setParagraphs` keeps "silently" meaning the host hears no event, and adds: "a screen reader hears the new paragraphs politely while the explainer is shown". The `explainer` factory's doc comment says the same in one clause. No signature change (the API lock is unchanged).
- **CHANGELOG** (`packages/astraeus/CHANGELOG.md`, the open 0.11.0 section only, one line of your own; other builders add theirs): "Fixed: an `explainer`'s paragraphs are a polite live region: a screen reader hears what `setParagraphs` changes while the explainer is shown; its first draw stays quiet." Not a breaking change.
- **Docs.** `docs/architecture/viewer-interface.md` section 11, the `explainer` row of the parts table only: add "paragraphs are a polite live region (heading and notes are not)".
- **Size.** The explainer's JS loads only when imported (`npm run check:shelf-split`); the CSS line is on the first download (expected +20 to +40 B gzip). Run `npm run check:pack` and `npm run check:shelf-split` and report the engine figure; if the 527,000 B gzip cap is passed, stop and report.
- Configured gates pass; evidence recorded under `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/shelf/explainer/View.tsx`
- `packages/astraeus/src/shelf/explainer/factory.ts`
- `packages/astraeus/src/shelf/explainer/part.css`
- `packages/astraeus/tests/lifecycle.test.ts` (the "shelf content parts (O-080 T-334)" case only, for the render pattern)
- `packages/astraeus/CHANGELOG.md` (top section only)
- `docs/architecture/viewer-interface.md` section 11 (the parts table)
- `/home/user/code/belt/docs/astraeus-improvements.md` row 21 (read only)

## Design References

`.savepoint/Design.md` under `Viewer interface`; viewer-interface note section 11 (the `explainer` row). G-025 Release.md owner decision 5.

## Guardrails

TEST-01, TEST-02, TEST-03, STYLE-01, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Write `tests/explainerLive.test.ts` and see it fail (no region today).
2. Wrap the paragraphs in the always-drawn region; add the CSS line.
3. Doc comments, CHANGELOG line, viewer-interface row.
4. Run the existing explainer cases unedited; `npm run check:pack`, `npm run check:shelf-split`.

## Boundaries

No option, input field or setting (decision 5); no throttle or timer (see the Objective's Decisions: "Open for the owner"); no change to the heading, notes, the panel, other parts, the readout tile or the chart; no edit to the catalogue example; no existing test edited; no browser step added.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/explainerLive.test.ts packages/astraeus/tests/lifecycle.test.ts packages/astraeus/tests/twoViewers.test.ts packages/astraeus/tests/shelfContentParts.test.ts packages/astraeus/tests/shelfInputTable.test.ts packages/astraeus/tests/lookDrift.test.ts packages/astraeus-site/tests/apiReference.test.ts`. Handoff: the configured gates, `npm run check:pack` and `npm run check:shelf-split`. No browser step: happy-dom shows the region's attributes and that the node survives a change, which is all a headless browser could show; the existing `catalogue` step still draws the explainer at the Full Check. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Done When -> evidence:

| Done When | Evidence |
|---|---|
| Polite region on paragraphs only | `View.tsx` wraps paragraphs in `div.shelf-explainer-paragraphs[aria-live=polite][aria-atomic=true]`, drawn always; `tests/explainerLive.test.ts` case 1 (heading and note outside) and case 2 (empty region drawn). Red first: all 3 cases failed before the change (no region). |
| Same look | `part.css` one line `.shelf-explainer-paragraphs { display: grid; gap: var(--astraeus-space-4); min-width: 0; }`; `lookDrift.test.ts` passes unedited. |
| Component test | `tests/explainerLive.test.ts`: same node after `setParagraphs`, empty region filled in place, reopen redraws with current text, two viewers keep own regions (3 passed). |
| Existing tests unchanged | lifecycle, twoViewers, shelfContentParts, shelfInputTable, lookDrift, apiReference passed unedited. |
| Doc comment | `ExplainerControl.setParagraphs` and the `explainer` factory comments in `factory.ts`; no signature change. |
| CHANGELOG | One Fixed line in 0.11.0 section. |
| Docs | `viewer-interface.md` section 11 explainer row. |
| Size | `check:shelf-split` ok; `check:pack` pass, engine 525,880 B gzip (cap 527,000; was 525,853, +27 B). |

Commands: `npm run typecheck` ok; eslint (ts6 shim) on View.tsx, factory.ts, explainerLive.test.ts clean; prettier clean (test file reformatted once); `npx vitest run` explainerLive, lifecycle, twoViewers, shelfContentParts, shelfInputTable, lookDrift, astraeus-site apiReference: 7 files, 342 tests passed. No browser run. Extra reads: none beyond Context Files (lifecycle.test.ts lines 1-135, 280-308 for the mock/mount harness).

Files changed: View.tsx, factory.ts, part.css (explainer), tests/explainerLive.test.ts (new), packages/astraeus/CHANGELOG.md, docs/architecture/viewer-interface.md.

Limitations: happy-dom shows attributes and node identity only; no screen reader was run.

## Drift Notes

None.

Marked done by the coordinator under the owner's "orchestrate O-98" (2026-11-24; standing rule "I mark them as they pass", O-038) after the wave gate passed on 2026-11-24T08:22Z: `npm run typecheck`, `npm run lint`, `npm test` 348 files 5634 passed 2 skipped, `npm run build`, `npm run check:pack` engine 525,880 B gzip, `npm run check:shelf-split` ok.
