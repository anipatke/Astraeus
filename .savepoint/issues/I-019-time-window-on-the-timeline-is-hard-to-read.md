---
id: I-019
title: A time window on the timeline is hard to read as one thing
type: other
status: open
source:
  kind: report
  actor: {role: owner, session: owner-chat-o010-look-20261011}
  at: '2026-10-11T05:27:04Z'
tasks: [T-034, T-035]
history:
  - at: '2026-10-11T05:27:04Z'
    actor: {role: owner, session: owner-chat-o010-look-20261011}
    kind: observed
    note: Owner's visual judgement on the made-up contact window after C-014 (CLEAR), recorded by the agent on the owner's direct instruction. The owner accepted T-035 with this as a follow-up; it does not reopen O-010.
  - at: '2026-10-17T00:00:00Z'
    actor: {role: executor, session: builder-i022-i019-20261017}
    kind: repair_attempted
    note: 'Window is now one shape: the band is a thick baseline sitting on the slider line, dashed start/end edges, a taller filled rate curve rising from it, and a dashed stem from the peak diamond down to the baseline; a caption above names it from the window data ("Perseids activity - peak 100 meteors per hour (ZHR)"; phone shows the name only). Label text comes from window.label and rate unit, nothing hardcoded in the shell. Apollo has no windows (browser-synthetic.mjs asserts none). Peak 44 px and band 88 px high on phone; story-panel markers (rings) stay above the baseline, distinct from the diamond. browser-synthetic.mjs updated (baseline sits on the slider line, caption, curve at least 40 px). Screenshots before/after, desktop and phone, synthetic/Perseids/Geminids: docs/evidence/i019-20261016T132151Z/screenshots/before and /after. Browser suite frozen tree evidence docs/evidence/i019-20261016T132151Z: synthetic, story-panels, spike02/03, shell, earth-moon, jupiter-io, precision, lighting pass with zero console errors; unrelated failures as noted in I-022. Unverified: owner judgement; the year-span Perseids/Geminids window is narrow on phone (about 30 px wide) because the span is a year (?span=activity widens it).'
---

# I-019: A time window on the timeline is hard to read as one thing

## Summary

The owner looked at the made-up "Contact window" on `?experience=synthetic` and could not tell what it meant. The window is drawn as two purple marks on either side of the seek slider: a thick band below it (when the window runs) and a thin rate curve above it (how busy it is), with an orange peak diamond on the band. The two marks read as separate, unrelated lines, and on desktop the curve is too flat to read as a rising and falling rate. Nothing on screen explains what the window is. Owner's words: "Window works, but the presentation is confusing. The bar and the curve read as two separate things split by the slider, and the curve is too flat to read as a rate."

This matters before real viewers see a window: the Perseids activity window (O-011) uses the same presentation.

## Evidence

- `docs/evidence/o010-check-2026-10-11/synthetic/synthetic-window-desktop.png` and `synthetic-window-mobile.png` (C-014 run).
- `src/shell/style.css`: `.timeline-window` is a 7 px band at the bottom of the track, `.timeline-window-curve` is drawn above the track in the space left after 11 px (`height: calc(100% - 11px)`), so the slider line sits between band and curve.
- `src/shell/TimelineBar.tsx`: band, curve and peak are separate elements in `.timeline-windows`; the band's only explanation is its accessible name and `title` tooltip.
- C-014 observations 3–5 (band click seeks to start; small touch targets; flat desktop curve) are related and can be weighed in the same repair.

## Proof Needed

- The owner looks at a window on the timeline at desktop and phone sizes and can say, without being told, when it runs, where it peaks and that the curve is its rate.
- The band, curve and peak read as one shape (or are otherwise clearly linked), and the rate visibly rises and falls at desktop width.
- An experience without windows (Apollo) looks unchanged; `browser-synthetic.mjs` and the other browser scripts pass with zero console errors in a fresh run directory; configured gates pass.
