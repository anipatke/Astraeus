---
id: O-078
title: Change a group's colour and dot size live
status: in_progress
depends_on: []
release: G-022
priority: high
rank: 1
last_check: C-190
---

# O-078: Change a group's colour and dot size live

## Outcome

`handle.setGroupLook(id, { color?, dotSizePx? })` on the mount handle and the `AstraeusScene` ref changes a group's dot colour and size on the next drawn frame (also while paused), on whichever draw path the group uses, without a new scene, geometry, refill or re-plan; `handle.groupLook(id)` reads `{ color, dotSizePx }` in force. The group's scene label follows the colour.

## Why

G-022: the Asteroid Belt app dims 23 of 25 groups when a visitor picks a Kirkwood gap; a rebuild costs ~1.4 s of blocked main thread.

## Success Conditions

- `setGroupLook(id, look)`: `id` is a group added with `addGroup`; `color` a hex colour as `addGroup` takes it; `dotSizePx` a finite number above 0; omitted fields keep their current value. Unknown or non-group id → `bad-group` naming the id; bad colour or size ≤ 0 (or non-finite, non-number) → `bad-group` naming the field; options that are not a plain object → `bad-group`; before ready / after unmount → `not-mounted`.
- `groupLook(id)` returns `{ color, dotSizePx }` in force (the scene's values until changed); undefined before ready, after unmount, and for an id that is not a group.
- Calls land in host call order; the last call wins; read-back is immediate.
- Both draw paths (CPU blend and GPU Kepler) carry the new colour and size from the next frame; a group that switches path (scale change) keeps it; a paused viewer draws the change (the draw rule wakes).
- Presentation only: positions (fills, blend inputs, shader inputs), fill count, `stateOf`, provenance, `scene.groups` (documented: describes the scene, keeps the original values), views, `shownDuring` and selection unchanged; no new geometry or material.
- The group's scene label colour follows `color`. The info card shows no group colour today, so it is unchanged (documented).
- Without any `setGroupLook` call a group renders exactly as before (material colour/size and label colour equal the scene's values).
- 25 calls on a scene of ~126,000 dots in 25 groups: time recorded as evidence (not a threshold), in Node and, at the Full Check's one browser run or a headless probe, in Chromium.
- README handle table row and a short example (dim every group except two); CHANGELOG entry under a proposed 0.9.4; doc comments; `npm run api:lock`; no version bump; configured gates plus `check:engine-alone` and `check:pack` pass.

## Architectural Considerations

- Public API rules (Design "Public API shape", Guardrails API-01..07): additive members, existing `bad-group` and `not-mounted` codes, units in field names (`dotSizePx`).
- The host link validates (`api/`), the viewer holds the live looks (`SceneControls`), and the frame applies them (ARCH-02 presentation only). `ViewerHandle` is the one handle both embedding paths share (`viewerHandleOf`), so the ref and mount cannot drift.
- `PointsView` owns both materials; it applies a look to both so a path switch keeps it.

## Decisions

- Owner 2026-11-20: new Goal G-022 with this one Objective; version 0.9.4 proposed in the CHANGELOG ("0.9.4 (Recommended)"); the owner bumps and publishes.
- Owner 2026-11-20: "Skip step check, one final (Recommended)": the single Task's optional Task Check is waived; the mandatory Full Objective Check runs once, by a fresh checker session.
- Owner 2026-11-20: "Yes, build it (Recommended)" to the design above, including `scene.groups` keeping the scene's original values and the card unchanged because it shows no colour.

## Boundaries

**In scope:**
- `packages/astraeus/src/api/` (handle, link, looks), `src/app/` (viewer port, App host control, scene controls, frame stages, PointsView, KeplerPoints, SceneLabels), tests, README, CHANGELOG, API lock.

**Out of scope:**
- Per-dot colours, member picking, group label hiding, hidden-group refill skipping; Meteor Showers or belt app changes; version bump and publishing.
