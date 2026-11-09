---
id: G-017
title: App commands, timeline and flyby accuracy for 0.8.1
status: planned
---

## Outcome

The `astraeus` package answers the Voyagers project review of 0.3.0 to 0.8.0, shipped as 0.8.1 with additions and host-call fixes only (no breaking change): every host call after `ready` takes effect in a defined order, a host can select an object, the README says an event has one zone, a visitor can zoom the timeline into a crowded stretch, a label can show during a stretch of time, and planet positions near flybys match JPL Horizons within a measured, stated tolerance.

## Why

Owner, 2026-11-10 (session voyagers-review-20261110): pasted the Voyagers review (the app moved from 0.3.0 to 0.8.0 on the public API only; about 65 findings, all 12 blockers fixed, 12 open). Its asks were recorded as I-150 to I-158 (I-153 merged into I-150 by the owner). The owner chose all eight remaining asks ("All eight") in three Objectives, and a 0.8.1 version: "Should be as 0.8.1, we wont update Voyagers". The fixes serve the next app; Voyagers stays on 0.8.0.

## Success Conditions

Every member Objective is done.

## Boundaries

**In scope:** the `astraeus` engine package, its public API, docs, tests and examples; the core planet series when O-063 changes it.

**Out of scope:** breaking changes (0.8.1 adds only; the data packages' `>=0.8.0 <0.9.0` peers stay valid and are not re-released unless O-063's research shows a data package must change, which goes back to the owner); probe or mission data (story data stays out of the engine); new demos (owner, 2026-10-24); changes to the Voyagers app; publishing a release (the owner's action through the GitHub release workflow).
