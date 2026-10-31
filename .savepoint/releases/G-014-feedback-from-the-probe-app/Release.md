---
id: G-014
title: Feedback from the probe app
status: planned
---

## Outcome

The `astraeus` package removes what blocks the interplanetary probe app (a separate project on the published 0.4.0, public API only) from its next milestone: moons and planets placed at historical mission dates, orbit lines and orbit framing for every planet, playback that paces itself between cruise and encounters, and the smaller path, zoom and selection gaps it found.

## Why

Owner, 2026-10-24: only engine and package improvements, grown by real need. On 2026-10-31 the probe app handed back three blocking gaps and three cheap extras, captured as I-110 to I-115 with new evidence on I-099 and I-103 (session probe-feedback-20261031). The owner chose a new Goal rather than reopening the released G-013 (0.4.0), and asked for all six in the same batch.

## Success Conditions

Every member Objective is done.

## Boundaries

**In scope:** the `astraeus` engine and the `astraeus-data-*` moon packages, their public API, docs, tests and example; I-110 to I-115, plus I-099 and I-106 where the playback work touches them.

**Out of scope:** probe or mission data (story data stays out of the engine); small moons before 2010; publishing a release (the owner's action through the GitHub release workflow).
