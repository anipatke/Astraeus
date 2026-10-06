---
id: O-005
title: Build a reusable astronomy UI shell, proven on Apollo
status: planned
depends_on: [O-004]
release: G-003
---

# O-005: Build a reusable astronomy UI shell, proven on Apollo

## Outcome

Deliver Astraeus Spike 03 as specified in `docs/ASTRAEUS_SPIKE_03_BRIEF.md` (canonical brief), narrowed by the confirmed decisions below: a Planetary Explorer UI extraction audit, a small generic UI shell around the canvas, Apollo 11 configured through it, developer diagnostics behind a toggle, responsive screenshot evidence and `docs/ASTRAEUS_SPIKE_03.md`. Repairs I-003 (uncertainty presentation), I-004 (landing-site offset, shown as a stated liberty) and I-005 (HUD coverage, ReadableScale explanation).

## Why

Spikes 01 and 02 proved the scientific state and trajectory layers; the interaction layer is now the weakest part and is debug tooling that covers the canvas. The project Idea (2026-10-06) makes Astraeus reusable machinery, not an experience, and asks that every reconstruction, approximation or creative liberty carries provenance an experience can expose to its viewer. This Objective proves both for the UI.

## Success Conditions

The brief's ten success criteria, with these confirmed specifics:

1. The canvas is visually dominant at the brief's viewports (desktop ~1440+, laptop 1280×800, tablet, mobile portrait), shown by screenshots; the default viewer UI follows the brief's progressive-disclosure hierarchy.
2. A persistent timeline bar provides play/pause, current date/time, speed, scrub/seek, previous/next event and event markers where practical; the current, previous and next event are understandable without opening a table.
3. Objects are selected, focused and followed through generic controls whose labels come from configuration ("Focus Earth", "Follow Columbia", "Earth–Moon overview"); camera changes never change scientific State.
4. A True/Readable scale control explains that Readable pulls bodies closer while keeping their true size, so spacecraft near a body are drawn on top. `ScalePolicy` is unchanged.
5. A compact provenance affordance (for example "Reconstructed ⓘ") reveals source, accuracy statement, notes and known limitations from the existing per-trajectory `Provenance` plus experience configuration. Apollo's known limitations name at least the smoothed joins, the published burn cutoff residuals and Eagle's landing-site offset against the drawn Moon, with figures taken from the generated reconstruction data, not re-derived.
6. Existing diagnostics (state vectors, physical/render distance, frame, centre, floating origin, residuals, FPS where available) remain available behind a developer toggle and are absent from the default viewer UI.
7. `docs/PLANETARY_EXPLORER_UI_AUDIT.md` classifies donor elements KEEP / ADAPT / APP-SPECIFIC / REJECT with source, reason and Astraeus destination; the shell reuses the KEEP/ADAPT patterns.
8. The generic shell contains no mission naming (an automated test greps the shell source for `apollo`, `columbia`, `eagle`); Apollo supplies configuration and content only.
9. Primary controls are keyboard-accessible, have visible focus, useful labels and adequate tap targets, and no critical action depends only on hover.
10. Spike 01/02 behaviour is unchanged: `src/core/`, generated Apollo data and existing tests pass unmodified except tests of replaced UI; browser checks report no console errors.
11. Screenshots cover Earth–Moon overview, translunar coast, close Earth, close Moon, spacecraft follow, event/provenance open, mobile and 1280×800, and the owner validates the design visually.
12. `docs/ASTRAEUS_SPIKE_03.md` covers the brief's thirteen design-note topics, including the storytelling requirements discovered and a Perseids recommendation; `.savepoint/Design.md` is reconciled.

## Confirmed Decisions — 2026-10-06

Owner confirmed in the G-002 replan session:

- **Goal shape:** G-002 closes lean (O-004 plus the O-003 retrospective). This Objective moved from G-002 to the new Goal G-003 and replaces its earlier "readable mission view" scope.
- **Landing site (I-004):** shown as a stated liberty through Eagle's provenance/known limitations; no lunar libration and no core change. The former O-006 is folded in here and removed.
- **Provenance granularity:** per object, as the core has it today. Time-ranged provenance is recorded as a future story-layer need, not built.
- **ReadableScale radii (I-005):** unchanged and explained in the scale control; a radius treatment is recorded as a future need.
- **Out of scope:** the imperative `Astraeus.Scene` developer API from the project Idea (a later spike), Perseids, and everything in the brief's "Do not build" list.
- **Design summary** confirmed with "confirm".

## Architectural Considerations

- New generic shell in `src/shell/`, consuming a generic experience configuration (objects, events, timeline window and rates, camera presets, info content, provenance and known limitations) and generic engine/app state (clock, camera request, scale policy, selection). No `if (mission === …)` and no mission names.
- `src/mission/apollo11.ts` supplies the Apollo configuration; `src/app/` keeps the scene and wires the shell to it. Existing `DebugControls`, `DebugOverlay` and `MissionPanel` are replaced or moved behind the developer toggle.
- `src/core/`, `ScalePolicy`, floating origin, `Provenance`, `TimelineEvent` and generated data are read-only for this Objective; a genuinely generic need is escalated through `REPLAN REQUIRED`, not patched in.
- Planetary Explorer at `/home/user/code/planetary-explorer` is a read-only donor. Its code licence is unresolved, so adapted code stays local-use only, recorded in `docs/DONOR_PROVENANCE.md`. Adopting donor dependencies (Tailwind, zustand, drei) is decided by the audit Task and recorded there.
- Visual quality needs human judgement: owner validation is required on the final Task, and screenshots must let the owner judge without running tooling.

## Boundaries

**In scope:**
- Brief deliverables A–F; repairs of I-003, I-004 (as a label) and I-005.

**Out of scope:**
- Changes to scientific State, trajectories, `ScalePolicy` behaviour, provenance types, the event model or the reconstruction.
- Perseids, Story DSL, narration, CMS, design-system package, publishing, accounts, large settings menus, advanced accessibility framework, VR, terrain, the imperative Scene API, time-ranged provenance and Readable-scale radius changes.
