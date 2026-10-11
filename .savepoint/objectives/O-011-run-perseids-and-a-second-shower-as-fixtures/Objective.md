---
id: O-011
title: Run Perseids and a second shower as test fixtures
status: in_progress
depends_on: [O-010]
release: G-004
lanes:
  - {key: timeline-window, title: Readable time window}
  - {key: camera-reach, title: Camera reach per experience}
  - {key: showers, title: Shower builder, Perseids and Geminids}
---

# O-011: Run Perseids and a second shower as test fixtures

## Outcome

A Perseids experience is built in a shared shower builder from a Perseids settings file: published facts plus an `illustrative` modelled particle stream. A Geminids experience is then added with a settings file only, and no code anywhere. Two generic changes come first, each proven with made-up configuration: a readable time window on the timeline (I-019), and camera reach that an experience declares. Cross-experience browser checks cover Apollo, the made-up experiences and both showers at mobile and desktop sizes.

## Why

This is where the brief's required evidence is gathered (`docs/ASTRAEUS_SPIKE_04_BRIEF.md`): each new capability works with Perseids data, with alternative configuration, and with Apollo preserved. The configuration-only second shower is the owner's pass/fail test. Two known gaps stand in the way: the owner found the window presentation confusing (I-019), and the camera cannot reach far enough to show a stream that Earth passes through (deferred note in Design, named for O-011).

## Success Conditions

1. **Readable window (I-019).** On the timeline, a window's band, rate curve and peak read as one linked shape, and the rate visibly rises and falls at desktop width. The owner, looking at the made-up window at desktop and phone sizes, can say when it runs, where it peaks and that the curve is its rate. An experience without windows (Apollo) looks unchanged.
2. **Camera reach per experience.** `ExperienceDefinition` takes optional camera reach (at least the maximum focus distance and the far plane). Without it, every existing experience keeps today's limits exactly. The made-up Sun-centred belt (about 2.5 AU, today proven only by tests) becomes visible in the app through this setting. Reach is presentation only: State is unchanged (ARCH-02).
3. **Shared shower builder.** Shower code lives outside generic code (`src/showers/`). It turns one shower settings file (`data/showers/<name>.json`) into an `ExperienceDefinition`, using only existing contracts: an orbit-based group for the stream, a `TimelineWindow` with peak, rate samples and provenance spans, the `rate` metric, a `radec` radiant readout, camera presets and reach. The entry finds shower settings files by name (`?experience=shower-<name>` or equivalent), so adding a settings file needs no code change. Generic code gains no meteor, shower or Perseids naming (name check).
4. **Perseids.** Published facts come from primary sources and are cited in the settings file and in provenance: the 109P/Swift-Tuttle orbit (JPL Small-Body Database), and the radiant, activity window, peak and peak ZHR (IMO). They carry their stated source. The particle spread, member positions and the rate curve between published points are `illustrative` and are never shown as observed (PROV-01). The modelled stream is shaped so that Earth visibly passes through it across the activity window. The owner looks once at Perseids as a story.
5. **Geminids, configuration only (pass/fail).** A Geminids settings file (parent 3200 Phaethon; facts from the same kinds of source) runs with zero code change anywhere, including the entry, builder and tests outside its own data. Any code change it would need is recorded as a finding and returned to the owner, never patched silently. A finding is a valid spike result.
6. **Cross-experience regression.** Configured gates pass. Every browser script passes with zero console errors in fresh run directories: Apollo, synthetic, synthetic-ring, Perseids and Geminids at mobile and desktop sizes. Scripts that the UI changes invalidate are updated, with each prior scenario mapped to its new assertion. Deferred drift notes are reconciled into Design. The owner's visual judgement is recorded and never substitutes for the architectural evidence.

## Architectural Considerations

- Stop condition (brief): bypassing a contract, adding shower logic to generic code, or changing State for presentation returns REPLAN REQUIRED.
- The shower builder is an experience adapter, not engine code. It may hold shower concepts (radiant, ZHR, parent body). Generic files stay covered by the name check.
- Stream modelling uses the existing `createOrbitGroup` (base elements, uniform spread, seed, Sun-centred, `ecliptic-j2000` plane). If the uniform spread cannot give a stream that Earth passes through across the window, that is a recorded finding first; any generic change (for example another spread shape) is proposed with its own made-up proof, not added silently.
- Camera reach is a presentation setting on the definition. It replaces the scene constants (`far = 5000`, `focusLimits` reach) only when declared. The floating origin and `ScalePolicy` are unchanged.
- The window repair stays in the shell (`TimelineBar`, `timelineModel`, styles); the `TimelineWindow` contract and `rateAt` stay unchanged.
- The rate readout and the timeline curve share `rateAt` over the same samples (STYLE-07).

## Confirmed Decisions — 2026-10-11

Owner confirmed in the O-011 planning session:
1. **Configuration only means a settings file.** One shared shower builder is written with Perseids. The second shower adds only a settings file and no code. This is a clear pass/fail test.
2. **Experiences set their own camera reach.** This is a generic change in this Objective, proven on the made-up belt; Apollo keeps today's limits.
3. **I-019 is repaired here, first**, on the made-up window, before Perseids uses the window.
4. **Radiant appears in the information panel only** (a `radec` readout). No scene marker; GAP-5 stays a recorded open gap for the findings.

Planner-settled choices, stated in the confirmation summary and confirmed with it: Geminids as the second shower; the entry discovers shower settings by name, so the entry itself does not change for a new shower; a Geminids code need stops and is reported as a finding; owner looks at the repaired window, at Perseids, and at the final cross-experience run; the window repair and camera reach can run side by side.

## Owner Decision — 2026-10-11 (dependency on O-009)

The owner directed that O-009 be removed from `depends_on`. O-009 was closed by owner exception (C-013 NEEDS WORK, not CLEAR), so the dependency gate kept O-011 from starting. O-011 still uses O-009's delivered group contract and `points` layer; removing the dependency waives only the gate, not that reliance. Recorded by the agent on the owner's direct instruction.

## Boundaries

**In scope:**
- Shell timeline-window repair and its made-up proof; optional camera reach on `ExperienceDefinition` and its made-up proof; shower builder, Perseids and Geminids settings files and sourced data; entry discovery of shower settings; contract tests; name-check coverage; browser scripts; regression; Design reconciliation.

**Out of scope:**
- Ground view, observed meteor datasets, a radiant marker in the scene, meteor entry or atmosphere effects, rate-driven dot brightness, perturbations beyond two-body, drawing the comet's whole orbit at true scale, the imperative `Astraeus.Scene` API, the findings note (O-012).
