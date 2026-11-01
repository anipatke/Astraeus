---
id: G-015
title: Feedback from the Voyagers app
status: planned
---

## Outcome

The `astraeus` package removes what blocks the Voyagers app (a separate project on the published 0.7.0, public API only, with a Voyager 1 / Voyager 2 / Both switch built on `setViews`): playback that slows only for the encounters a view shows, a camera that can move to the probe at an encounter and back, a mount handle that works as soon as `ready` resolves, a viewer that leaves the host page's address alone unless asked, and a runnable views example for the next app.

## Why

Owner, 2026-11-01 (session voyagers-feedback-20261101): the Voyagers app sent five findings against 0.7.0. Each was measured against the release before planning: pacing builds its event zones from every event regardless of the view (`pacingFor`), the host link has no camera call, `ready` resolves when rendering is requested but the host link attaches in a later effect (a host-style test without `act` reproduced `missing-data` from `setTime` straight after `await ready`), the viewer reads and rewrites undocumented address parameters (`view`, `t`, `scale`, `up`, `stars`, `milkyway`, `milkywaybrightness`, `labels`, `loadfade`, sky off) with no opt-out, and no demo or example uses views. The owner chose a new Goal rather than growing G-014.

## Success Conditions

Every member Objective is done.

## Boundaries

**In scope:** the `astraeus` engine package, its public API, docs, tests and the `examples/` projects.

**Out of scope:** probe or mission data (story data stays out of the engine); new demos (owner, 2026-10-24: improvements only); changes to the Voyagers app; publishing a release (the owner's action through the GitHub release workflow).
