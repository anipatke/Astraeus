---
id: G-025
title: Fixes from the belt app's stress test, for 0.11.0
status: planned
---

## Outcome

Eight defects a real host (the asteroid-belt app) hit in astraeus 0.10.0 are fixed in the engine: a point group's label selects it like a body's; a panel button that turns the camera on a phone closes the sheet first; a viewer with no WebGL rejects `ready` with its own error and leaves a readable message; bad shelf input is refused evenly with `bad-part`; long unbreakable text wraps inside a panel and chart mark labels never overprint; and screen readers hear explainer, readout-tile and chart content and changes. The work is correctness only: no restyling and no new look options beyond what a fix needs.

## Why

Owner, 2026-11-22: the belt app (`/home/user/code/belt`) moved to 0.10.0 in its O-005 and stress tested the bar, About and every shelf part it uses. Its brief (pasted into session 2026-11-22; source list "Breaks: fix in the engine" in the belt's `docs/astraeus-improvements.md`, items #33, #16, #18, #21, #27, #28, #30, #31; evidence under `/home/user/code/belt/docs/measurements/astraeus-0.10/`; today's factory behaviour pinned by `/home/user/code/belt/tests/shelfEdges.test.ts`) names them. Owner rule (2026-11-22): breaks are fixed in the engine; visual and component tweaks are lower priority as long as hosts can customise.

Owner decisions, 2026-11-22 (planning session):
1. Ship as 0.11.0 with the stricter input checks, listed under the CHANGELOG's breaking changes with a one-line migration.
2. On a phone, a panel button that turns the camera always closes the sheet: one engine rule in the panel rule, no option.
3. Panel buttons get an on/off switch (`ActionsControl.setEnabled`), and no note under the button.
4. An empty colour key is refused with `bad-part`.
5. Explainer paragraph changes are always announced politely; the first draw is silent; no option.
6. Planner finding, from the code: body labels are already tap targets by their own outline (`app/scenePicking.ts` `pickCandidatesOf`); only listed objects that are not catalogued bodies (point groups) are skipped. So "every label behaves alike" needs no change to body labels.

Order (most visible to visitors first): O-095, O-096, O-097, O-098. Owner, 2026-11-23: G-026 (orbit lines, 0.10.1) goes first; this Goal follows it.

## Success Conditions

Every member Objective is done.

## Boundaries

**In scope:** the `astraeus` engine package (picking, panel rule, mount and error codes, shelf factories and views, panel CSS), its README, CHANGELOG, API lock and tests; the shelf catalogue page where a part's documented input changes.

**Out of scope:** the belt's "Tweaks and customisation" items (chart ticks and highlight colour, panel button labels, readout-tile placement, About status tone, a public phone-layout read, part state across remounts); hit-testing single dots inside a group; changes to the belt app, Meteor Showers or any outside app; the version bump and publishing (the owner's release steps). A handoff note for the belt app lists which items shipped and anything left open, and says where a fix makes one of the out-of-scope tweaks easier.
