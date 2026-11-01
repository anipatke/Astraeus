---
id: O-058
title: Split the scene builder and host link by concern
status: planned
depends_on: [O-053]
release: G-016
priority: high
---

# O-058: Split the scene builder and host link by concern

## Outcome

The `Scene` builder (about 1,050 lines planning every concern) becomes one small planner per concern (bodies, paths, groups and activity, story layer, timeline and pacing, views and switches, camera) joined by a single assembler; `ViewerLink`'s four jobs (clock, views, camera, event zones) are separate parts behind the same host link; input parsers live in `src/api/` or `src/core/`, not in display code. The public surface does not change: the O-053 API-surface lock passes untouched (review F15; I-132).

## Why

Owner, 2026-11-01: "yes, early" and "lets do this right". O-054 to O-057 and O-059 all change `scene.ts` and `viewerLink.ts`; splitting first keeps each later change small and reviewable (owner's "small change, small diff"; STYLE-01, STYLE-10; C-136 style note).

## Success Conditions

Detailed when this Objective is planned. Named outcomes: per-concern planner modules and one assembler; `ViewerLink` composed of per-job parts; `src/api` imports from `app/` and `shell/` reduced to what the host link needs, with parsers moved; the API-surface lock and every existing test unchanged and passing; no behaviour change, shown by the full suite and one browser check.

## Architectural Considerations

Pure refactor: same inputs, same definition, same errors and messages. The O-053 checks are the safety net; a lock diff means the refactor changed the API and must be undone.

## Boundaries

**In scope:** `packages/astraeus/src/api/scene.ts`, `viewerLink.ts`, the parsers they use, their tests' imports.

**Out of scope:** any public API change, rename or new feature (later Objectives).
