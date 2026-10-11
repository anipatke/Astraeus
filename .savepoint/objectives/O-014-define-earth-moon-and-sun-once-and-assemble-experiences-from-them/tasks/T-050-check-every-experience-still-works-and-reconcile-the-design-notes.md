---
id: T-050
title: Check every experience still works and reconcile the design notes
objective: O-014
status: planned
depends_on: [{task: T-049, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o014-plan-2026-10-11}
lane: integration
planned_reads: [.savepoint/Design.md, .savepoint/Guardrails.md, docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md, tools/validate/browser-spike02.mjs, tools/validate/browser-spike03.mjs, tools/validate/browser-shell.mjs, tools/validate/browser-anchor-labels.mjs, tools/validate/browser-synthetic.mjs, tools/validate/browser-synthetic-ring.mjs, tools/validate/browser-synthetic-belt.mjs, tools/validate/browser-earth-moon.mjs, tools/validate/browser-showers.mjs, tools/validate/browser-jupiter-io.mjs, tools/validate/public-build-assets.mjs]
planned_writes: [.savepoint/Design.md, docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md, docs/DONOR_PROVENANCE.md]
---

# Check every experience still works and reconcile the design notes

## Outcome

Every experience and fixture passes its browser script in a fresh run directory at desktop and phone sizes with zero console errors, the public build passes its output gate, the configured gates pass, and `.savepoint/Design.md` describes the implemented asset architecture: every drift note from the eight Tasks is reflected or marked non-architectural with a reason, the Codebase Map lists `src/assets/` and `src/experiences/`, and the lighting choice is recorded with its evidence. The design document's status section records what was built as planned and what differs. This is the integration gate before the Full Objective Check.

## Astraeus Hypothesis

- **Capability tested:** Gates A–D together, on the whole tree, with the regression baseline of Spikes 01–03 intact.
- **Contract reused:** every browser script; the gates in `.savepoint/config.yml`.
- **Gap:** none expected; any failure is a finding.
- **Generic change:** none. A needed fix is recorded as an Issue or returned as REPLAN REQUIRED, never patched silently here.
- **Evidence independent of any experience:** the synthetic fixtures' scripts and the fake-texture public-build test.

## User Check

Open each of Earth–Moon Explorer, Apollo, Perseids, Jupiter–Io and the belt once at desktop and phone and confirm each looks as it did at its own Task's look. Record it.

## Done When

1. Configured typecheck, build and test gates pass, counts recorded; `ASTRAEUS_PUBLIC_BUILD=1` build passes `public-build-assets.mjs`.
2. All eleven browser scripts pass with zero console errors in `docs/evidence/o014-final-<date>/` at 1280×800 and 390×844; every scenario from the pre-O-014 scripts is mapped to its current assertion.
3. `Design.md`: Architecture, Codebase Map, Interfaces and Data Flow and Current Technical State describe the catalogue, resolver, compositions, scene centre, path kinds, scale policies, planets, Jupiter–Io, lighting choice and texture rights; each Task's drift notes are accounted for by name; the deferred notes from T-024/T-025/T-027/T-028 that O-014 resolved (camera limits, Earth/Moon mandatory, metrics reading the Moon, scene called `EarthMoonScene`) are closed.
4. The design document gains a "Built — <date>" section listing deviations from the plan, if any, and the measured figures (precision, planet maxima, Io classification, lighting difference).
5. The owner's look recorded; handoff to the Full Objective Check with current full-gate evidence.

## Context Files

`.savepoint/Design.md`, `.savepoint/Guardrails.md`, `docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md`, `docs/DONOR_PROVENANCE.md`, every `tools/validate/*.mjs` script listed in the frontmatter, and the eight preceding Tasks' Drift Notes.

## Design References

The whole of Design; the design document's Gates A–D and section I.

## Guardrails

ARCH-01 to ARCH-05, PROV-01, PROV-02, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Run the gates and the public build; run every browser script into the fresh directory.
2. Walk each Task's Drift Notes into Design or mark them non-architectural with a reason.
3. Update the Codebase Map and Current Technical State; close the resolved deferred notes.
4. Write the design document's "Built" section; record the owner's look; hand off.

## Boundaries

No code change beyond a browser-script assertion update. No new capability. No Perseids story work (O-011).

## Technical Verification

Full configured gate fresh, every browser script, the public build gate. Evaluated under `agent-skills/references/check-method.md` as the Full Objective Check's integration evidence.

## Technical Evidence

Pending execution.

## Drift Notes

None expected; this Task closes the others'.
