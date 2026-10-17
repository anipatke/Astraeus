---
id: I-037
title: The showers' "comet orbit drawn in the Overview" check was passing on the timeline strip, not the scene
type: defect
status: open
checks: [C-063]
source:
  kind: report
  actor: {role: checker, session: o017-orchestrator-check-20261017}
  at: '2026-10-17T21:10:00Z'
history:
  - at: '2026-10-17T21:10:00Z'
    actor: {role: checker, session: o017-orchestrator-check-20261017}
    kind: observed
    note: 'Found by the T-084 builder (Drift Note 1, lane o020-t084, 60cc616): browser-showers counted violet pixels over 60 as proof the comet orbit is drawn in the Sun Overview, but the screenshot included the timeline bar and its purple activity strip. With the bar masked (`ui.sceneCanvasPng`) violet in the Overview is about 0, because the I-035 orbit look is not violet there. T-084 now records `out.path.<start|peak>WholeOrbitViolet` instead of asserting it; the Whole-orbit preset check still asserts the orbit extent unmasked.'
  - at: '2026-10-17T22:00:00Z'
    actor: {role: executor, session: i036-i037-builder-20261017}
    kind: repair_attempted
    note: 'Executor stopped (owner pause). Done: browser-showers asserts the comet orbit from the scene alone (bar masked, lavender orbit-colour test): Overview at the window start 233 pixels, 0 with the camera pulled in on the Sun (negative probe, kept in the script); Whole orbit preset at the peak 214 scene-only pixels. Overview at the peak is recorded only (55, the line lies under the stream and glow). Perseids single run passed with no errors. Remains: the final run-full (not run) and a Check.'
  - at: '2026-10-17T21:40:00Z'
    actor: {role: executor, session: o020-orchestrator-20261018}
    kind: repair_attempted
    note: 'Merged into o018-o019 (merge of o020-i036-i037). Full run docs/evidence/o020-i036-i037-full-20261017T212213Z in the lane at db92b3b: 22/22 exit 0, error-lines 0 (showers-perseids and showers-geminids pass). Scene-only orbit count asserted at the Overview start (>100) and in the Whole-orbit preset at the peak (>150); peak Overview recorded only. Proof 2 deviation: the negative probe pulls the camera in so the orbit is out of view, because the shower orbit has no hide toggle; it shows the count measures the orbit, not a hide switch. Left open for verification in the O-020 Full Objective Check, where the checker judges that deviation.'
---

# I-037: The showers' Overview comet-orbit check passed on the timeline strip

## Summary

`tools/validate/browser-showers.mjs` asserted that the parent comet's whole orbit is visible in the Sun Overview by counting violet pixels in a full-page screenshot. The purple activity strip above the timeline (removed by T-084) supplied those pixels, so the check never proved the orbit was drawn. After T-084 the assertion is recorded only.

## Proof Needed

1. The check proves the comet orbit is drawn in the Overview from the scene alone (bar masked), using the colour or brightness the current orbit look actually draws (I-035 look, settings in Developer > Display settings > Orbit lines), or reads the orbit line's visibility through a driver readout.
2. A negative probe: with the comet orbit hidden, the check fails.
3. The full run passes.
