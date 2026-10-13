---
id: T-039
title: Add the Geminids with a settings file and no code
objective: O-011
status: planned
depends_on: [{task: T-038, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o011-plan-2026-10-11}
lane: showers
planned_reads: [docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md, data/showers/perseids.json, data/showers/perseids-orbits.json, src/experiences/showers/showerSettings.ts, src/experiences/showers/showerDefinition.ts, tools/validate/browser-showers.mjs]
planned_writes: [data/showers/geminids.json]
---

# Add the Geminids with a settings file and no code

## Outcome

The Geminids run from `data/showers/geminids.json` alone. The pass/fail answer to the brief's question, "could Astraeus support a second meteor shower primarily through configuration?", is recorded with evidence: either it passed with zero code change, or the exact change it would need is recorded as a finding.

## Astraeus Hypothesis

- **Capability tested:** that a second shower with a materially different parent (asteroid 3200 Phaethon, short period, small perihelion distance, December) is configuration only.
- **Contract reused:** everything T-038 reused, plus the T-038 shower builder, settings validation and entry discovery, unchanged.
- **Gap or hypothesis:** zero code change. Likely stress points: a small perihelion and short period under the uniform spread, a different activity length and ZHR profile, and camera reach and presets for a different geometry.
- **Generic change:** none permitted in this Task. A needed change in any code, including `src/showers/`, the entry, tests or browser scripts, is a finding: stop, record it, and return it to the owner.
- **Perseids-independent evidence:** this Task is that evidence. Only one settings file is added.

## User Check

Open the Geminids experience and confirm it loads with its own window, peak, rate and stream. Confirm the diff adds only the settings file.

## Done When

1. `geminids.json` holds 3200 Phaethon's elements and epoch (JPL Small-Body Database) and the radiant, activity window, peak and peak ZHR, each with source and access date, fetched from the source. The CAMS Geminid (IAU 4) subset is fetched locally by running T-038's fetch tool unchanged (git-ignored, never committed; T-051 replan), with its provenance header. No member is invented.
2. `git diff --stat` for this Task shows `data/showers/geminids.json` as the only changed file outside `.savepoint/` and `docs/evidence/`. If the parent body needs a catalogued definition (as Swift–Tuttle did), that is code, so it is a FINDING returned to the owner, not a silent change.
3. Run with the existing browser shower script, pointed at Geminids by its existing parameters or by running the script as written over every discovered shower: the experience loads with zero console errors at desktop and phone sizes, the stream is near Earth across its window, and the window, peak and rate readouts are present. Evidence goes in a fresh run directory.
4. Existing tests pass unchanged. If the builder's tests iterate over discovered settings, Geminids is covered with no test edit.
5. **Result recorded** in Technical Evidence: PASS (configuration only) or FINDING (the exact file, change and reason). A FINDING is returned to the owner before anything is changed. It is a valid spike outcome, not a failed Task.
6. Configured typecheck, build and test gates pass; record counts.

## Context Files

`.savepoint/objectives/O-011-run-perseids-and-a-second-shower-as-fixtures/Objective.md`, `data/showers/perseids.json`, `src/showers/showerSettings.ts`, `src/showers/showerDefinition.ts`, `tools/validate/browser-showers.mjs`.

## Design References

Design: Experience plug-in boundary; Groups and the `points` layer (O-009); Time windows and rates (O-010).

## Guardrails

ARCH-01, ARCH-03, PROV-01, TEST-01, TEST-03.

## Implementation Plan

1. Confirm T-038's builder, discovery and browser script exist as named; return REPLAN REQUIRED if not.
2. Fetch and record the Geminids facts with citations.
3. Write the settings file, choosing the spread with the same method T-038 recorded.
4. Run the browser script and gates. If anything fails because of code, stop and record the FINDING.

## Boundaries

Only `data/showers/geminids.json` is written outside records and evidence. No code edits, including "small" ones to the builder, entry, tests or scripts.

## Technical Verification

Configured gates and the shower browser script. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record the PASS or FINDING here for T-040 and O-012.

## Replan — 2026-10-13 (I-025)

Amended in planning: "configuration only" now means a settings file plus its measured-orbit data file, because the owner decided on measured CAMS orbits with no invented members. The dependency on T-038 is unchanged.
