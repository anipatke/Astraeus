---
id: O-010
title: Show time windows and rates on the timeline
status: done
depends_on: [O-008]
release: G-004
lanes:
  - {key: core-windows, title: Window contract and timeline}
  - {key: rate-metric, title: Rate readout}
---

# O-010: Show time windows and rates on the timeline

## Outcome

Astraeus can show something on the timeline that lasts and changes, not only instants: a time window with a start, an end, an optional peak, an optional rate that rises and falls, and provenance that can differ along the window. The shell draws it, navigates to it and explains it, and offers a generic `rate` readout. It is proven with made-up data only; Apollo is unchanged.

## Why

The O-008 gap audit (`docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md` §2, GAP-3, GAP-3b, GAP-4; §6 reshaped this Objective) found that `TimelineEvent` is an instant, `ExperienceConfig.window` is only the whole timeline, provenance is one record per trajectory or event list, and `Metric` has no rate kind. Eclipses, occultations, communication passes, launch windows and mission phases share this shape; a meteor shower's activity window is the first concrete case. Spike 03 already recorded time-ranged provenance as a story-layer need (`docs/ASTRAEUS_SPIKE_03.md` §4, §10).

## Success Conditions

1. A time-window contract in `src/core/` (additive; `TimelineEvent`, `State`, `Trajectory`, `Provenance` and `ScalePolicy` unchanged) declares id, label, start and end, an optional peak instant inside the window, optional rate samples (time, value) with a unit label, and optional provenance spans (start, end, `Provenance`) inside the window. A validating constructor rejects malformed windows with named errors. A pure helper gives the rate at a time (linear between samples, none outside the window or the samples) and the provenance that applies at a time; a window without spans falls back to the experience's existing provenance.
2. `ExperienceConfig` takes optional `windows`. An experience without windows (Apollo) renders and navigates exactly as before.
3. The timeline shows each window as a shaded band, a faint rate curve inside it when it has samples, and a peak marker, at mobile and desktop sizes. The context row says when the clock is inside a window and its current rate. Previous/Next stop at each window's start, peak and end as well as at events. Opening a window shows its details, including the provenance that applies at the current time, so a change of provenance along the window is visible in the shell.
4. A generic `rate` metric kind ("N per unit time") reuses the existing value, unit, range and context fields and renders through the existing Metric Visual components; existing kinds are unchanged. An experience supplies rate values through its existing `createMetrics` factory, computed from the same window samples (one source of truth).
5. Made-up evidence (ARCH-03): the made-up experience (`?experience=synthetic`) gains a made-up window with rate samples, a peak, a rate readout and two provenance spans that are both `illustrative` but differ in accuracy and notes, so the change is visible without presenting made-up data as measured (PROV-01). Differing source types along a window are proven in contract tests with a test-only fixture.
6. The name check covers every new generic file and finds no meteor, shower or Perseids naming. Configured gates and every browser script pass with zero console errors in fresh run directories; existing scripts are updated per the browser-regression rule if the timeline change invalidates them. Apollo behaviour is unchanged. The owner looks once at the made-up window at mobile and desktop sizes.

## Architectural Considerations

- The window complements `TimelineEvent` rather than extending it, so every existing event consumer is untouched. A peak is a property of its window; an experience that also wants the peak in its event list may add an ordinary event, but the shell does not require it.
- Rate samples and rate-at-time are story-layer data, not scientific State; nothing in a window changes or is derived from a group's or body's State (ARCH-02). A smoothed or modelled rate curve carries `illustrative` provenance through the spans (PROV-01).
- Window provenance is optional; existing single records (`TrackedBody.provenance`, `eventProvenance`) stay valid and unchanged.
- The shell stays configuration-driven (ARCH-01): window labels, units and provenance text arrive from the experience. Navigation merges event times and window start/peak/end times in the timeline model, not in the experience.
- The `rate` kind is a shell metric kind (GAP-4); the core helper that interpolates rates is the single source that both the timeline curve and an experience's rate readout use (STYLE-07).

## Confirmed Decisions — 2026-10-11

Owner confirmed in the O-010 planning session:
1. **Time-ranged provenance is in scope.** A window can carry provenance spans, so published and modelled parts of one window are labelled differently.
2. **Timeline presentation:** a shaded band plus a faint rate curve and a peak marker on the timeline bar, at mobile and desktop sizes; the context row names the window and its current rate.
3. **Navigation:** Previous/Next stop at each window's start, peak and end, as well as at events.

Planner-settled choices, stated in the confirmation summary and confirmed with it: made-up data only (Perseids data and the "operates with Perseids data" evidence are O-011, as for O-009); the made-up window lives in the existing made-up experience; linear rate interpolation; differing source types proven in tests only; one owner look at mobile and desktop.

## Boundaries

**In scope:**
- Window contract and helpers in `src/core/`, `ExperienceConfig.windows`, timeline band/curve/peak, context row, navigation and window details in `src/shell/`, the `rate` metric kind and visual, the made-up window and rate readout in `src/synthetic/`, contract tests, name-check coverage, browser checks, regression, Design reconciliation.

**Out of scope:**
- Perseids or any other shower data or wording, narration, chapters, rate-driven visual effects in the scene (for example dot brightness), time-ranged provenance on trajectories or groups, camera-limit changes, ground view, the imperative `Astraeus.Scene` API.
