---
id: T-331
title: Rebuild the timeline on the new layout
objective: O-079
status: planned
depends_on: [{task: T-329, requires: clear}]
check_waiver: {task: T-331, reason: 'Owner said "orchestrate 79": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o079-20261121}, recorded_at: '2026-11-21T00:35:01Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g023-20261121}
---

# Rebuild the timeline on the new layout

## Outcome

The timeline (play, speed, scrubber, events, windows, story markers, date, and its phone drawer) sits in its named area, is styled only from the look settings and opens its cards and panels through the panel rule, as the decision note sets; its old placement and styles are gone.

## User Check

On desktop and phone, play, pause, change speed, scrub, open an event card and a story panel from the timeline, and open the phone timeline drawer: each works as before (or as the note's behaviour changes say), and nothing overlaps the bar or sheets.

## Done When

The timeline matches the note's verdict (keep or rebuild) and area; its stylesheet reads only from the look settings and passes the drift check; it opens cards and story panels through the panel rule (no direct open calls left); the timeline drawer is placed by the panel rule; existing timeline tests pass or are migrated as the note lists, each change named; the phone journey passes under the browser policy. Apply `docs/agents/verification.md`.

## Context Files

- `docs/architecture/viewer-interface.md`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/Objective.md`
- `.savepoint/Design.md` under `Host-page behaviour`
- `packages/astraeus/src/shell/TimelineBar.tsx`
- `packages/astraeus/src/shell/TimelineBar.css`
- `packages/astraeus/src/shell/timelineModel.ts`
- `packages/astraeus/src/shell/timelineGlow.ts`
- `packages/astraeus/src/shell/AstraeusShell.tsx`
- `packages/astraeus/src/shell/useDrawers.ts`
- `packages/astraeus-site/tools/validate/journey-planets-phone.mjs`
- `docs/agents/browser-policy.md`

## Design References

The decision note; Design "Host-page behaviour" (timeline space, phone sheets).

## Guardrails

ARCH-01, ARCH-02, API-03, TEST-01, TEST-02, TEST-03, STYLE-01, STYLE-07, CODE-01.

## Implementation Plan

1. Move the timeline into its area; remove its own placement rules.
2. Route its card and panel opens and its phone drawer through the panel rule.
3. Restyle from the look settings; pass the drift check.
4. Migrate tests as the note lists; run the phone journey (one browser job at a time).

## Boundaries

No new timeline features, no About, no version bump. Return REPLAN REQUIRED if the timeline cannot follow the note without a product change.

## Technical Verification

Focused tests while iterating; handoff runs the configured gates plus `check:engine-alone` and the phone journey under the browser policy. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas for reconciliation in T-327.
