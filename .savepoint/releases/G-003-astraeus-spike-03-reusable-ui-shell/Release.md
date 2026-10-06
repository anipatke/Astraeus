---
id: G-003
title: Astraeus Spike 03 — Reusable UI shell
status: planned
---

## Outcome

Complete Astraeus Spike 03: a small, coherent, reusable astronomy UI shell around the canvas — time, events, object selection, camera overview/focus/follow, scale, contextual information and provenance/uncertainty — extracted from Planetary Explorer's strongest patterns and proven on Apollo 11 through configuration only.

## Why

Spikes 01 and 02 proved the scientific state and trajectory layers. The interaction layer is the next weakness: the Apollo demo UI is debug tooling that covers the canvas. Astraeus is reusable machinery, so its UI must be too, and the owner's principle (reliable where data exists, plausible where it doesn't, explicit about the difference) needs a viewer-facing provenance affordance.

## Success Conditions

The success criteria in `docs/ASTRAEUS_SPIKE_03_BRIEF.md` hold, as narrowed by O-005's confirmed decisions. The strongest signal: remove Apollo data, plug in another astronomy experience, and most of the UI still makes sense. I-003, I-004 and I-005 are repaired through the shell.

## Boundaries

Internal spike. Excludes the brief's "Do not build" list (Perseids, new astronomy models, unrelated reconstruction work, Story DSL, narration, CMS, design-system package, publishing, accounts, huge settings, advanced accessibility framework, VR, terrain), the imperative `Astraeus.Scene` developer API, time-ranged provenance and Readable-scale radius changes. Scientific State, `ScalePolicy`, provenance data and the event model stay unchanged.
