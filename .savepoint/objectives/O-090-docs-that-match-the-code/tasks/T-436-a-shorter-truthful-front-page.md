---
id: T-436
objective: O-090
title: A shorter, truthful front page
status: planned
depends_on: [{task: T-435, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-436, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T05:30:31Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
lane: docs
planned_reads: [docs/README.md, README.md, package.json, docs/DONOR_PROVENANCE.md, docs/ASTRONOMY_VALIDATION.md]
planned_writes: [README.md, packages/astraeus-site/assets.html, packages/astraeus-site/index.html]
---

# A shorter, truthful front page

## Outcome

Owner plan step 3, root README. It keeps the product, demos, the provenance principle (observed / modelled / illustrative), setup and links; drops the obsolete roadmap including "Later: package the engine"; replaces the asset and science inventory with links to the owning docs; states the workspaces and the planet/moon providers truthfully (or links to their owner), with no hard-coded counts that drift.

## User Check

A newcomer can clone and run the site from the root README alone.

## Done When

| Item | Evidence |
|---|---|
| Root-README contradictions from the T-434 list fixed (workspace count, VSOP87A vs the providers actually used, roadmap/status) | before/after table checked against package.json workspaces and provider source |
| Roadmap section gone or reduced to a link to the changelog | diff |
| Asset/science inventory replaced by links; every removed passage has a home (named doc) or a recorded reason | table |
| Setup commands verified against package.json scripts | evidence |
| Every relative link in README.md resolves | link-check command recorded |
| Before/after word count | wc -w |

## Context Files

T-434 Technical Evidence; `docs/README.md`; `README.md`; `package.json`; provider source as needed to confirm (log the read); `docs/DONOR_PROVENANCE.md` and `docs/ASTRONOMY_VALIDATION.md` headings only, to confirm link targets.

## Design References

Design `Planet positions from Horizons`, `Core layers and demos`.

## Guardrails

PROV-01, PROV-02 (provenance labels kept); TEST-01..04; ARCH-06 (mechanise a trap where cheap).

## Implementation Plan

1. Confirm workspace list and providers from source.
2. Rewrite in place: keep product, demos, provenance, run, develop; the checks section stays as T-435 left it; collapse "Assets, science and credits" to a short credits list with links; drop "Status and roadmap".
3. Check links.

## Boundaries

Coordinator widening (T-434 C6c): correct the VSOP87 provider claims in the site copy of `assets.html` (lines ~267, ~278) and `index.html` (~253) to the Horizons fits; text only, no layout change. README.md only. Credits and licence acknowledgements are kept (shortened, not removed). No new demos or claims.

## Technical Verification

prettier; link check; no tests.

## Technical Evidence

Pending execution.

## Drift Notes

Pending.
