---
id: I-139
title: Panel sizes follow the browser window, not the viewer
type: other
status: open
source:
  kind: report
  actor: {role: planner, session: o055-planning-20261102}
  at: '2026-11-02T12:00:00Z'
guardrail_ids: [API-03]
severity: medium
history:
  - at: '2026-11-02T12:00:00Z'
    actor: {role: planner, session: o055-planning-20261102}
    kind: observed
    note: 'Found while planning O-055 (several viewers on one page, D9). The viewer sizes its panels from the browser window and picks the phone layout by window width, so a small viewer on a wide page keeps the desktop layout.'
  - at: '2026-11-02T12:05:00Z'
    actor: {role: owner, session: o055-planning-20261102}
    kind: deferred
    note: 'Owner, 2026-11-02, "All recommendations; #7 later": kept out of O-055, for a later Objective. Relayed by the coordinator.'
  - at: '2026-11-09T22:19:52Z'
    actor: {role: planner, session: o061-run-20261110}
    kind: escalated
    note: 'Owner, on the T-288 box preview: "the controls dont fit", "full page is fine, add I-139 to 0.8.1". Promoted into O-068 under G-017, before O-062.'
  - at: '2026-11-09T22:47:02Z'
    actor: {role: owner, session: o061-run-20261110}
    kind: reopened
    note: 'Owner, asked what the use case is ("dont recall it ever being needed for anything to date"), then "yes, take it out": O-068 removed from G-017 before planning; this Issue is open again.'
  - at: '2026-11-09T22:47:02Z'
    actor: {role: owner, session: o061-run-20261110}
    kind: deferred
    note: 'Parked until a real app shows the viewer smaller than the window (no app, demo or the site does today; only the binned cover preview box showed it). Fix it then.'
---

# I-139: Panel sizes follow the browser window, not the viewer

## Summary

The viewer's panels are sized against the browser window, not against the viewer's own element. A viewer smaller than the window (for example two side by side on a desktop page, or one in a 600x400 box) keeps the desktop layout and desktop panel widths, so its panels can crowd or overlap each other inside the small box. That breaks the "panels must not collide, phone first" rule and API-03's "behave as if alone". The owner deferred it from O-055 to a later Objective.

## Evidence

- The stylesheets size panels in viewport units (`vw`, `dvh`): for example `packages/astraeus/src/shell/style.css` (`width: min(360px, calc(100vw - 24px))`, `max-height: min(calc(100dvh - 72px - 200px), 640px)`), `shell/TopBar.css`, `shell/TimelineBar.css`, `shell/phone.css` (`calc(100dvh - ...)`, `width: calc(100vw - 16px)`) and `shell/embedded.css`; 28 such declarations in `src/app/style.css` and `src/shell/*.css` at planning time.
- The phone layout is chosen from the window: `packages/astraeus/src/shell/phoneLayout.ts` uses `window.matchMedia(PHONE_QUERY)`, not the viewer's own size.
- O-055 scopes the styles under `.astraeus-shell` and makes ids per viewer, but deliberately leaves sizes as they are (T-257 Boundaries, O-055 Architectural Considerations).

## Proof Needed

A viewer in a box smaller than the window (phone-sized inside a desktop window, and two side by side at 1280x720) picks its layout from its own size and sizes its panels against its own box (for example container queries or `cqw`/`cqh` units with the viewer's root as the container); a DOM or layout test proves the layout choice per viewer, and the owner confirms no panel collisions on `localhost:5490` at 375x667 and 1280x720 with one and two viewers.
