---
id: T-038
title: Build Perseids from a settings file through a shared shower builder
objective: O-011
status: planned
depends_on: [{task: T-036, requires: clear}, {task: T-037, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o011-plan-2026-10-11}
lane: showers
planned_reads: [src/app/experienceDefinition.ts, src/core/orbitGroup.ts, src/core/pointGroup.ts, src/core/timeWindow.ts, src/core/provenance.ts, src/shell/experience.ts, src/shell/metrics.ts, src/synthetic/syntheticDefinition.ts, src/synthetic/syntheticRingDefinition.ts, src/main.tsx, tests/experiencePlugIn.test.ts, tests/syntheticRing.test.ts, tools/validate/browser-synthetic-ring.mjs]
planned_writes: [src/showers/showerSettings.ts, src/showers/showerDefinition.ts, data/showers/perseids.json, src/main.tsx, tests/showers.test.ts, tests/experiencePlugIn.test.ts, tools/validate/browser-showers.mjs]
---

# Build Perseids from a settings file through a shared shower builder

## Outcome

A shared shower builder in `src/showers/` turns a shower settings file into an `ExperienceDefinition`, and Perseids runs from `data/showers/perseids.json`. Published facts are cited and carry their stated source. The modelled stream and the rate curve between published points are `illustrative`. Earth visibly passes through the stream across the activity window. The entry finds shower settings files by name, so a later shower needs no entry change.

## Astraeus Hypothesis

- **Capability tested:** that a materially different experience (many particles, a lasting activity window, mixed published and modelled data) is hosted by existing generic contracts alone.
- **Contract reused:** `ExperienceDefinition` with the `points` layer and `groups`; `createOrbitGroup` (Sun-centred, `ecliptic-j2000`, uniform spread, seed); `TimelineWindow` with peak, rate samples and provenance spans; the `rate` metric through `createMetrics` and `rateAt`; the `radec` coordinates metric for the radiant; camera presets; camera reach (T-037); `Provenance`.
- **Gap or hypothesis:** that no generic change is needed. Watch in particular: whether a uniform spread of elements gives a stream that Earth passes through across the whole window; whether centroid focus suits a stream; whether `createObjectMetrics`' Moon readings leak into a shower; and whether the entry can find settings by name without per-shower code.
- **Generic change:** none expected. Any need is STOP — REPLAN REQUIRED, with the gap and a proposed generic solution recorded. It is not patched in this Task.
- **Perseids-independent evidence:** the builder's contract tests run with a made-up shower settings object (no Perseids values). The name check confirms generic files gained no shower naming. Geminids (next Task) is the configuration-only test.

## User Check

Open the Perseids experience at desktop and phone sizes. Play through the activity window: the stream is visible, Earth passes through it, the timeline shows the window with its peak, and the rate readout rises and falls. Open the stream's and window's details and see which parts are published and which are modelled.

## Done When

1. **Facts.** `perseids.json` holds the 109P/Swift-Tuttle orbital elements and epoch (JPL Small-Body Database), the radiant RA/Dec, activity start and end, peak time and peak ZHR (IMO Working List or calendar), each with its source and access date. Values are fetched and checked by the executor from the primary source, not recalled. Anything not stated by a source is marked modelled.
2. **Settings contract.** `src/showers/showerSettings.ts` validates a settings object with named errors: required facts, finite numbers, window order, peak inside the window, spread widths, seed, member count. The builder (`showerDefinition.ts`) produces the definition from settings alone and contains no Perseids values.
3. **Stream.** A Sun-centred orbit-based group with `illustrative` provenance whose limitations state "modelled spread, two-body, not observed". Its spread is chosen and justified in Technical Evidence so that Earth is inside or beside the stream through the activity window. A test measures the members' nearest distance to Earth at start, peak and end. If no uniform spread achieves this, record the finding and stop (REPLAN REQUIRED).
4. **Window and rate.** The activity window carries the published peak and ZHR and an `illustrative` rate curve. Provenance spans make the published peak and the modelled shape distinguishable in the info panel. The rate readout and the timeline curve both use `rateAt` over the same samples.
5. **Radiant.** The radiant appears as a `radec` readout in the info panel only, with its source.
6. **Entry discovery.** The entry finds every `data/showers/*.json` by name (for example through Vite's glob import) and mounts it as `?experience=shower-<name>` or an equivalent stated scheme. Existing experience names still work.
7. **Evidence.** Contract tests with a made-up shower settings object (`tests/showers.test.ts`). The name check still passes, and `src/showers/` is outside its generic scope only by design (stated). A browser script loads Perseids at desktop and phone sizes, steps to window start, peak and end, and checks the stream, window and readouts with zero console errors in a fresh run directory. Every other browser script still passes.
8. Configured typecheck, build and test gates pass; record counts. Owner visual judgement of Perseids as a story is recorded.

## Context Files

`.savepoint/objectives/O-011-run-perseids-and-a-second-shower-as-fixtures/Objective.md`, `docs/ASTRAEUS_SPIKE_04_BRIEF.md`, `docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md`, `src/app/experienceDefinition.ts`, `src/core/orbitGroup.ts`, `src/core/pointGroup.ts`, `src/core/timeWindow.ts`, `src/core/provenance.ts`, `src/shell/experience.ts`, `src/shell/metrics.ts`, `src/synthetic/syntheticDefinition.ts`, `src/synthetic/syntheticRingDefinition.ts`, `src/main.tsx`, `tests/experiencePlugIn.test.ts`, `tests/syntheticRing.test.ts`, `tools/validate/browser-synthetic-ring.mjs`.

## Design References

Design: Experience plug-in boundary; Groups and the `points` layer (O-009); Time windows and rates (O-010); T-037's camera reach.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, PROV-01, TEST-01, TEST-03, STYLE-05, STYLE-06, STYLE-07, STYLE-09.

## Implementation Plan

1. Confirm T-036 and T-037 landed as planned (window presentation, camera reach field); return REPLAN REQUIRED if not.
2. Fetch and record the Perseids facts with citations.
3. Write the settings type and validation, then the builder, using the made-up ring and window definitions as patterns.
4. Model the stream: choose the base and spread (for example true anomaly near the node at peak, with a node spread covering the activity window), measure Earth's distance to the stream across the window, and justify the result.
5. Add entry discovery by name.
6. Tests, browser script, all browser scripts, gates; owner look.

## Boundaries

No change to `src/core/`, `src/shell/` or generic `src/app/` code. A need for one is REPLAN REQUIRED. No radiant marker, no meteor entry effects, no observed meteor data, no perturbations. Geminids is the next Task.

## Technical Verification

Focused tests during iteration. Handoff runs the configured gates and every browser script (scene-affecting fuller gate). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas and every reuse or gap observation here. T-040 reconciles them, and O-012 uses them for the findings.
