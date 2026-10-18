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
  - at: '2026-10-18T06:40:00Z'
    actor: {role: executor, session: o024-labels-lane}
    kind: repair_attempted
    note: 'Lane o024-labels. (1) Scene readout: the canvas now publishes `data-paths` (JSON per path line: id, visible, vertices, inView, spanX, spanY), from `PathView.screenReadout` via `publishPathData` in sceneDebug.ts, generic (no shower names); driver.scenePaths/scenePath read it. (2) browser-showers: "the comet''s whole orbit is drawn" now asserts the line from that readout (visible, over 500 vertices, at least 90% in view, extent over 3% of the view) in the Overview at start and peak, with a negative probe (wheel in on the Sun: fewer than 60% of the vertices in view; a short orbit such as the Geminids'' keeps its near-Sun end in view, so a quarter is too strict); the Whole orbit preset asserts at least 90% in view and a span over 20% (measured 0.25 for the Perseids, the orbit seen nearly end-on; the old violet-pixel box read over 30% because of labels and glow). The orbit-coloured and violet pixel counts are recorded, not asserted; the unmasked violet-extent evaluate is removed. The whole-orbit picture is now taken before the assertions. (3) browser-anchor-labels now writes to argv[2], else ASTRAEUS_EVIDENCE_DIR, else a fresh timestamped directory under the system temp directory. (4) No other script asserted orbit labels visible. Unit tests added in tests/paths.test.ts. Results: tsc ok; vitest 66 files, 1025 passed 1 skipped; build ok; driver guard ok; browser-showers perseids and geminids (full, desktop and phone) exit 0, docs/evidence/o024-labels-iter-0507j; lite tier docs/evidence/o024-labels-lite-20261018T0519Z: anchor-labels, earth-moon, jupiter-io, orbit-motion, orbit-look, browser-lite all exit 0 with error-lines 0. Full run deferred to the orchestrator''s batch run. Status left open.'
---

# I-040: The showers' "comet orbit is drawn" checks were counting the orbit labels

## Summary

`tools/validate/browser-showers.mjs` proves the parent comet's orbit is drawn by counting pixels of the orbit's colour (`checkSunEarth` Overview start, `checkWholeOrbit` extent and scene count). The orbit's label is drawn in the same colour, and with the I-035 faint-line look the label supplied most of those pixels. Turning labels off (owner decision) makes the checks fail although the line is drawn.

## Proof Needed

1. The checks prove the orbit line is drawn from the line itself: a driver readout of the path (for example a data attribute or test hook reporting each path's visibility, vertex count and on-screen extent), or a pixel count with labels hidden that is calibrated to the line with a negative probe (orbit hidden or out of view) — not from label text.
2. The orbit-labels-off change passes browser-showers for both showers, desktop and phone.
3. `browser-anchor-labels.mjs` defaults to a fresh scratch or run directory (or honours ASTRAEUS_EVIDENCE_DIR) so a plain call cannot overwrite committed evidence.
4. The full run passes.
