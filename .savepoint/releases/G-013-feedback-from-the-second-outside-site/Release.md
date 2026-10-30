---
id: G-013
title: Feedback from the second outside site
status: planned
---

## Outcome

The `astraeus` package fixes what the second outside site built on it (a Voyager interplanetary story on the published 0.3.0, using JPL Horizons data and only the public API) had to work around: a recorded path can be drawn fixed to the Sun beside enlarged planets, path positions have a stated frame, and the docs match the package.

## Why

Owner, 2026-10-24: only engine and package improvements, grown by real need. On 2026-10-30 the Voyager app (a separate project, outside this repository) handed back twelve findings and one "worked well" list; they were captured as I-096 to I-107 (session voyager-feedback-20261030). The owner chose a new Goal for them rather than extending the finished G-012, and named I-096 (interplanetary paths cannot be drawn fixed to the Sun) the priority.

## Success Conditions

Every member Objective is done.

## Boundaries

**In scope:** the `astraeus` package, its public API, docs, tests and example; findings I-096 to I-107 as the owner selects them into Objectives.

**Out of scope:** Voyager or probe data, and anything mission-specific (story data stays out of the engine); publishing a release (the owner's action through the GitHub release workflow).
