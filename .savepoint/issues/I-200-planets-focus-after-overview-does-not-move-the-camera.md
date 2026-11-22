---
id: I-200
title: Planets Focus after Overview does not move the camera
type: defect
status: open
source:
  kind: report
  actor: {role: owner, session: orchestrate-g024-20261122}
  at: '2026-11-22T03:36:49Z'
tasks: []
checks: []
guardrail_ids: []
severity: low
history:
  - at: '2026-11-22T03:36:49Z'
    actor: {role: owner, session: orchestrate-g024-20261122}
    kind: observed
    note: 'Owner during the O-089 T-422 look on localhost:5490: "focus on saturn after overview does nothing". Coordinator reproduced it headless on the branch (e5e0e489) and on main before O-089 (fcde39b5) with the same readouts, so it predates O-089. Owner chose "Log it for later".'
---

# Planets Focus after Overview does not move the camera

## Problem

On the planets page (`app.html?experience=planets&planet=saturn&sky=off`, 1280x800), the opening view shows Saturn at about 57 px radius. Pressing Focus (`focus-saturn`) frames it at about 7 px, and Overview gives the same framing (about 7 px, centred), so after Overview, Focus visibly does nothing. The two presets frame the scene identically for a planet scene. The same readouts appear before and after O-089. A headless repro using the shared driver (`pickedBody`, `chooseCamera`, `waitForBodySettled`) is in the coordinator's session scratchpad and can be rebuilt from this description.

## Proof Needed

On the planets page, Focus on the planet frames it visibly closer than Overview (the planet's on-screen radius after Focus is clearly larger than after Overview), checked through the driver readouts in a browser step, and Overview then Focus moves the camera each time.

## Repair Routing

Backlog (owner, "Log it for later"). Likely the camera-fallback/preset slice that follows O-089 (viewer-interface §9 recipe) or a planets-scene framing fix; savepoint-design decides.
