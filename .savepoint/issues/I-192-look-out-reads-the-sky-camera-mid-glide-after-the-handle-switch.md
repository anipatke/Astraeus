---
id: I-192
title: The look-out step reads the sky camera mid-glide now that the driver reads the viewer handle
type: defect
status: open
source:
  kind: check
  check: C-203
  actor: {role: checker, session: check-o086-orchestrator-20261122}
  at: '2026-11-21T21:57:36Z'
tasks: [T-390]
checks: [C-203]
guardrail_ids: []
severity: medium
history:
  - at: '2026-11-21T21:57:36Z'
    actor: {role: checker, session: check-o086-orchestrator-20261122}
    kind: observed
    note: 'C-203: full tier, look-out fails "phone: step 3 turns west to Kettle" ({"sky":true,"raDeg":287.33,"decDeg":-19.11,"fovDeg":40}); third failure at the same assertion (T-391 run, T-393 run, C-203). journey-look-out.mjs:301 takes the first handle reading that differs from Lantern; the handle reports every frame, so that reading is mid-glide; the drawer it replaced (T-390) refreshed on a timer, which hid the glide.'
---

# The look-out step reads the sky camera mid-glide

## Problem

O-086 T-390 moved `cameraReading`/`waitForCameraReading` (`packages/astraeus-site/tools/validate/driver.mjs`) from the developer drawer to `window.astraeusHost.camera`. The handle reports the live pose each frame. `journey-look-out.mjs:301` waits for the first reading not in Lantern's direction and asserts it is more than 3° west of Lantern; during the glide that first differing reading can be short of the target, so the step fails intermittently (3 of about 6 recent full runs).

## Proof needed

The look-out step waits for the camera to settle (or for the target condition) through the driver before asserting step directions, without changing any assertion text; `npm run check:browser -- --step look-out` green twice in a row; then the full tier green once. A fast test of the new driver wait (it returns only after the pose stops changing, or times out naming what it waited for).
