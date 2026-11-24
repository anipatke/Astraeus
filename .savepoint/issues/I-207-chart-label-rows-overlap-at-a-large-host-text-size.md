---
id: I-207
title: Chart label rows overlap at a large host text size
type: defect
status: open
source:
  kind: check
  check: C-219
  actor: {role: checker, session: check-o097-20261124}
  at: '2026-11-24T07:51:55Z'
tasks: [T-450]
checks: [C-219]
guardrail_ids: [TEST-01]
severity: low
history:
  - at: '2026-11-24T07:51:55Z'
    actor: {role: checker, session: check-o097-20261124}
    kind: observed
    note: 'C-219 (O-097 Full Objective Check). The chart''s label row height is a fixed 12 chart units (packages/astraeus/src/shelf/chart/View.tsx:16 ROW = 12; used at :68 and :100), while the label font is --astraeus-text-xs = textSizePx * 11 / 14 (look.css:27) and textSizePx is a public look setting, 11 to 18 (LookInput.interface; viewer-interface section 10). Widths are measured (they follow the text size), the row height is not. Probe (Chromium headless, static SVG copying View.tsx geometry and markRows.ts, the catalogue chart''s marks "Limit" at 20 and "Survey edge" at 22 on bins 0..30, chart 358 px wide, the shell font stack): the two labels go to rows 0 and 1 at every size; their boxes overlap vertically by 0.58 / 1.58 / 2.58 / 4.58 / 5.58 px at textSizePx 14 / 15 / 16 / 17 / 18, against the catalogue step''s own limit of a quarter of the box (3.5 / 3.75 / 4.0 / 4.5 / 4.75 px), with 31 to 39 px horizontal overlap. At 17 and 18 the step''s own overprint rule fails. Glyph extents (canvas actualBoundingBox ascent/descent of each label) leave a 1.43 px gap at 14 and overlap by 0.57 px at 15 to 17 and 1.57 px at 18: the upper label''s descenders ("y", "g") reach into the lower label''s ascenders.'
  - at: '2026-11-24T07:57:31Z'
    actor: {role: executor, session: repair-i207-20261124}
    kind: repair_attempted
    note: 'Executor evidence only, not verified. Fix: packages/astraeus/src/shelf/chart/View.tsx measures each mark label''s getBBox().height in the existing layout effect (stored with the widths; the bail-out compares it too) and uses the tallest as the row pitch, falling back to ROW = 12 when nothing is measured; markRows.ts unchanged (pure). Test: packages/astraeus/tests/chartMarkRows.test.ts adds "ChartView row pitch follows the label height (I-207)" (2 cases with their own render helper that stubs getBBox and restores it; existing cases untouched): measured heights 14.1 and 17.6 give a row pitch of that height and viewBox 0 0 320 156+height; height 0 falls back to 12 (viewBox 0 0 320 168). Red-first: with HEAD''s View.tsx copied back the first new case fails (pitch 12), 1 failed / 6 passed; restored, 7 passed. Gates: typecheck pass; eslint (use-typescript6) and prettier --check on both files clean; vitest chartMarkRows.test.ts 7 passed; check:shelf-split ok; check:pack pass, engine 525,853 B gzip of 527,000 (1,833,752 B raw; the chart is not in the first-open bundle). Browser: npm run check:browser -- --step catalogue under flock, exit 0, 9 s of 16 s, error-lines=0, evidence docs/evidence/browser-steps-20261124T075630Z. Throwaway probe (not committed; the real catalogue page on a scratch vite server :5599 in the project harness Chromium, --astraeus-text-size forced by an injected stylesheet before load; "Limit" and "Survey edge" in rows 0 and 1): textSizePx 14 at 1280x720 / 375x667: box overlap 0.00 px (quarter 3.50 / 2.75), glyph gap +1.0 / +1.0 px, viewBox height 169.41 / 168.10; textSizePx 18: label font 14.14 px, box overlap 0.00 px (quarter 4.25 / 3.75), glyph gap +3.0 / +2.0 px, viewBox height 172.29 / 172.50. One-row chart: the unchanged unit case "keeps a one-mark chart at 0 0 320 156" passes. Note: at the default size a two-row chart is now about 1.4 units taller than before (pitch is the measured box, about 13.4, not 12). Unverified: textSizePx 11 to 13 and 15 to 17 were not probed; a runtime textSizePx change with no re-render still leaves the measurement stale until the next render (C-219 observation 2, unchanged).'
---

# Chart label rows overlap at a large host text size

## Problem

O-097 Success Condition 3: "Chart mark labels never overlap: a label that would overlap drops to a further row above the bars". The planner's decision makes the rows "follow the host's text size". Label widths are measured, so they follow it. The row height is a fixed 12 chart units (`packages/astraeus/src/shelf/chart/View.tsx:16`), sized for the default 11-unit label font. A host that sets the public `textSizePx` to 17 or 18 (allowed range 11 to 18) gets a 13.4 to 14.1-unit label font in 12-unit rows. Two close marks, such as the catalogue's "Limit" and "Survey edge", then sit in adjacent rows whose boxes overlap by more than the `catalogue` step's own quarter-box limit. The upper label's descenders print into the lower label (glyph overlap 0.57 px from textSizePx 15, 1.57 px at 18).

Expected: at any supported `textSizePx`, labels in adjacent rows do not overlap by more than the rule the browser check states, and no glyph of one label prints into another. Actual: they do at 17 and 18 (box) and from 15 (glyph extents). Missing test evidence: `tests/chartMarkRows.test.ts` and the `catalogue` step run only at the default text size, and the unit test's happy-dom render cannot measure height.

## Proof Needed

At `textSizePx` 18 (and the default 14), the catalogue's bar chart with "Limit" and "Survey edge" draws its two labels in different rows with a vertical box overlap no more than a quarter of the box height and no glyph overlap. The row height follows the measured label height (or the label font size), and a one-row chart still draws `viewBox="0 0 320 156"` at the default size. A test fails if the row height stops following the text size. The `catalogue` step passes.

## Repair Routing

Direct repair under this Issue inside O-097 (T-450's code: `View.tsx` row height from the measured text box height, with 12 as the fallback where nothing is measured), then the O-097 Full Objective recheck.
