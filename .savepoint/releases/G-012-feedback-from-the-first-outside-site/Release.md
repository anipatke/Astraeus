---
id: G-012
title: Feedback from the first outside site
status: planned
---

## Outcome

The `astraeus` package fixes what the first outside site built on it (a twelve-shower meteor site on the published 0.2.0) had to work around: the viewer behaves well inside someone else's page, its behaviour is documented rather than learned from the source, and the public API answers the questions that site had to answer with its own code.

## Why

Owner, 2026-10-24: from now on only engine and package improvements, no more demos. On 2026-10-26 the showers site handed back 32 findings measured against 0.2.0 (`/home/user/code/showers/docs/astraeus-handoff.md`, outside this repository). The owner reviewed the triage the same day and chose two Objectives (planning session g012-planning-20261026): host-page fixes with a documentation round first, then new public features.

## Success Conditions

Every member Objective is done.

## Boundaries

**In scope:** the `astraeus` package, its public API, docs, tests and example; findings the triage kept (host-page fixes, documentation, position query, orbit fitting, accuracy exports, card parity, provenance alignment).

**Out of scope:** the Showers demo's loader and data format and anything shower-specific (story data stays out of the engine; triage, 2026-10-26: R11, E12, G1, G9); swapping scenes inside one mounted viewer (E5, later if asked again); publishing a release (the owner's action through the GitHub release workflow); the three.js `Clock` warning (raised by a dependency, not the engine).
