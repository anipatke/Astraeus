---
id: G-019
title: Story timing and flyby fixes for 0.9.1
status: planned
---

## Outcome

The `astraeus` package answers the Earth's Closest Calls project review of 0.9.0 with general parts any story app can use, shipped as 0.9.1 with additions and fixes only: paced playback never skips a slow-down and overlapping slow-downs take the slower speed as documented; a provider path's line follows the body where it moves fast; a body or path can be shown only over a span of time; camera moves a host asks for honour reduced motion; and the README states the contracts the review found missing or wrong.

## Why

Owner, 2026-11-12 (session closest-calls-review-20261112): pasted the Earth's Closest Calls review (phone-first app, ten closest JPL flybys since 2020 on one timeline, built on the public 0.9.0 API only; findings F-01 to F-19 in that app's `docs/astraeus-findings.md`). The owner asked for a critical review ("are they genuinely re-usable, and can we implement them in a modular way") and then chose the narrowed list:

- Show for a span of time (F-01, F-07, F-08): one general "shown from / until" option on bodies and paths, the object menu following it. It replaces element-set switching and view-bounded objects, which a host composes from it and existing views; it covers most of parked I-157.
- No skipped slow-downs (F-09): a fault in playback, fixed inside pacing.
- Provider-path lines sampled where the line bends, capped (F-05): no host density setting.
- Host camera moves honour `prefers-reduced-motion` (F-12): the README's existing promise; no new option.
- Overlapping ramps take the slower speed, as the README says (F-15); owner: "Fix the engine to match the guide".
- README fixes: F-02 (ecliptic obliquity 84381.406"), F-03 (whole milliseconds; the plain RangeError), F-04 (provider `stateAt` contract), F-14 (orbit camera field of view), F-13 (which colour an elements body's orbit line takes), F-17 (anchor labels off by default).

Dropped by the owner's choice: a separate element-set switch, hiding views from the view menu, timeline zoom (I-156 stays parked), path marker size (F-06). Version: owner "0.9.1, additions only" and "call this 0.9.1".

## Success Conditions

Every member Objective is done.

## Boundaries

**In scope:** the `astraeus` engine package, its public API, README, CHANGELOG, tests and examples.

**Out of scope:** breaking changes (0.9.1 adds only; the data packages' `>=0.9.0 <0.10.0` peers stay valid and are not re-released); asteroid or flyby data (story data stays out of the engine); new demos; changes to the Earth's Closest Calls app; publishing a release (the owner's action through the GitHub release workflow).
