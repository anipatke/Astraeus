---
id: I-055
title: Planets show their night side with no way to light them all for inspecting places
type: other
status: open
source:
  kind: report
  actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
  at: '2026-10-21T21:25:00Z'
severity: medium
history:
  - at: '2026-10-21T21:25:00Z'
    actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: observed
    note: 'Owner, on the localhost:5490 preview during O-037: "half of the planets are in the dark! can inspect the feature", then "i think we need an \"illumiate all\" toggle basically". Bodies are lit only by the Sun (placeBodyLights), so from many view angles the night side faces the camera and surface places are hard to inspect. O-037 kept the lighting stage unchanged; the owner can compare with the pre-O-037 preview on localhost:5491.'
---

# I-055: Planets show their night side with no way to light them all for inspecting places

## Summary

Planets are lit only by the Sun, which is accurate but often leaves the side facing the camera dark, so their surface places cannot be inspected. The owner wants an "illuminate all" switch that lights every body evenly while it is on, with the true sunlit look as the default.

## Evidence

Owner report on the preview, 2026-10-21. Lighting is placed by `placeBodyLights` (`src/app/sceneLights.ts`), now called from the lighting stage in `src/app/sceneFrame.ts`. Out of scope for O-037 (G-007 boundary: no change to what the demos show). Per the owner's tune-looks rule this belongs in settings with a live control.

## Proof Needed

A control in the settings (phone and desktop layouts, no overlaps at 375x667 and 1280x720) turns even lighting on and off for every body in every demo; the default stays sunlit; a node test covers the light choice; the owner confirms on the preview that night-side places become readable.
