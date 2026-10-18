---
id: I-040
title: The showers' "comet orbit is drawn" checks were counting the orbit labels, not the lines
type: defect
status: open
source:
  kind: report
  actor: {role: checker, session: o020-orchestrator-20261018}
  at: '2026-10-18T06:10:00Z'
history:
  - at: '2026-10-18T06:10:00Z'
    actor: {role: checker, session: o020-orchestrator-20261018}
    kind: observed
    note: 'Owner asked for orbit and path labels off by default in every demo (2026-10-18). With the labels off (uncommitted change, moved to lane o024-labels), browser-showers fails: Perseids "the comet''s whole orbit is drawn (9 violet pixels)" (was over 150) and Geminids "drawn in the Overview, scene only (5 orbit-coloured pixels)" (was over 100). The parent orbit''s label is drawn in the orbit''s colour, so these colour counts measured mostly the label text; the faint I-035 line alone is only a few pixels at those views. I-037 had already moved the counts off the timeline strip; this is the same class of defect one layer down. Also found: browser-anchor-labels.mjs writes into the committed `docs/evidence/regression-spike01-02/anchor-labels` when called without its directory argument (it reads argv[2], not ASTRAEUS_EVIDENCE_DIR); the overwritten file was restored.'
---

# I-040: The showers' "comet orbit is drawn" checks were counting the orbit labels

## Summary

`tools/validate/browser-showers.mjs` proves the parent comet's orbit is drawn by counting pixels of the orbit's colour (`checkSunEarth` Overview start, `checkWholeOrbit` extent and scene count). The orbit's label is drawn in the same colour, and with the I-035 faint-line look the label supplied most of those pixels. Turning labels off (owner decision) makes the checks fail although the line is drawn.

## Proof Needed

1. The checks prove the orbit line is drawn from the line itself: a driver readout of the path (for example a data attribute or test hook reporting each path's visibility, vertex count and on-screen extent), or a pixel count with labels hidden that is calibrated to the line with a negative probe (orbit hidden or out of view) — not from label text.
2. The orbit-labels-off change passes browser-showers for both showers, desktop and phone.
3. `browser-anchor-labels.mjs` defaults to a fresh scratch or run directory (or honours ASTRAEUS_EVIDENCE_DIR) so a plain call cannot overwrite committed evidence.
4. The full run passes.
