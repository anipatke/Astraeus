---
id: T-401
title: Owner look at the unchanged picture
objective: O-087
status: done
depends_on: [{task: T-395, requires: clear}, {task: T-396, requires: clear}, {task: T-397, requires: clear}, {task: T-398, requires: clear}, {task: T-399, requires: clear}]
owner_validation: {required: true, accepted_check: C-206, accepted_by: {role: owner, session: orchestrate-g024-20261122}}
check_waiver: {task: T-401, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:11:52Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: owner-look
planned_reads: []
planned_writes: []
---

# Owner look at the unchanged picture

## Outcome

The owner confirms on `localhost:5490` that the lighter frame loop changed nothing they can see (Objective condition "No visual change").

## User Check

On the preview at `localhost:5490`, desktop width and phone width (375x667), look at:

1. **Names on the Apollo 11 page** (`/app.html`): Earth, Moon and spacecraft names sit beside their objects as before; when two names would overlap one hides; at fast playback two crossing names swap once, not flicker; hovering a name brightens it; tapping a name selects it. On phone width no name sits under a panel.
2. **The Moon's orbit line** (same page): playing, the ring fades at its end and the bright arc ends exactly at the Moon; pause, then drag the timeline: the line follows at once; switch scale (Readable / True): the line follows.
3. **Small-moon orbit lines** (`/app.html?experience=planets&planet=saturn`, and Pluto `&planet=pluto` where the lines turn about the Pluto-Charon balance point): lines end at their moons while playing; hide the moons with the view or switch that hides them and show them again: the lines come back whole, not stale.
4. **Paused viewer** (any page): the time text stays put while paused; Play resumes; a timeline drag while paused updates the time text immediately.

Reply "looks unchanged" or name the item and what differs.

## Done When

- The owner's answer is recorded in Technical Evidence with the date. Any difference becomes a repair in the owning draft's lane (labels 03, paths 06, orbit sets 05, paused 04); this Task then repeats only the named item.
- If the owner is offline: park per G-024 decision 7 (branch left unmerged with a note; continue with Objectives that do not depend on it).

## Context Files

None (owner task).

## Design References

None.

## Guardrails

TEST-01.

## Implementation Plan

1. Coordinator confirms 02-06 are merged and the preview serves the branch build.
2. Ask the owner the User Check; record the answer.

## Boundaries

No screenshots (browser policy); no code change in this Task.

## Technical Verification

Owner judgement only.

## Technical Evidence

Owner answer, 2026-11-22T01:58:34Z (on localhost:5490, dev server from the o091 checkout, which contains all of O-087): "1. Works fine, but they sit over their object which is OK ? 2. Yes 3.Y 4Y 5Y" (item 5 was O-088's button look). Coordinator reply: label placement is unchanged by O-087 (same anchor offset and tries; `x = screen.x + dx`, `y = screen.y + dy` before and after T-396), so names sitting over large or close objects is existing behaviour; pushing names clear of large discs would be a separate improvement. Every item passed; no repair needed.

## Drift Notes

None.
