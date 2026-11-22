---
id: T-439
objective: O-090
title: Packaging, release and science guides by section
status: planned
depends_on: [{task: T-438, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-439, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T05:30:31Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
lane: docs
planned_reads: [docs/README.md, docs/NPM_PACKAGING.md, docs/RELEASING.md, docs/ASTRONOMY_VALIDATION.md, docs/MOON_ORBITS.md, tools/publish-packages.mjs, tools/build-packages.mjs]
planned_writes: [docs/NPM_PACKAGING.md, docs/RELEASING.md, docs/ASTRONOMY_VALIDATION.md, docs/MOON_ORBITS.md, docs/README.md]
---

# Packaging, release and science guides by section

## Outcome

Owner plan step 4, specialist guides. The current release procedure is easy to find in RELEASING.md; one-time experiments and dated sizes in NPM_PACKAGING.md are marked as history with their date; package counts match the release config. Scientific docs describe the providers actually in use and keep provenance, frames, time scales, uncertainty, limitations and reproducibility; historical experiments are dated.

## User Check

None visual.

## Done When

| Item | Evidence |
|---|---|
| Package counts/lists in both guides match the release/publish config, or link to it | evidence quoting config |
| Current procedure first in RELEASING.md; history marked with dates | diff |
| Provider descriptions in ASTRONOMY_VALIDATION.md and MOON_ORBITS.md match source (provider files cited) | evidence |
| No provenance, frame, time-scale, uncertainty or limitation text lost (moved text listed) | table |
| Inbound links to edited headings still resolve | grep evidence |
| Before/after word counts | wc -w |

## Context Files

T-434 Technical Evidence; `docs/README.md`; `docs/NPM_PACKAGING.md`; `docs/RELEASING.md`; `docs/ASTRONOMY_VALIDATION.md` and `docs/MOON_ORBITS.md` by heading (headings first, then sections naming providers); `tools/publish-packages.mjs` and `tools/build-packages.mjs` header comments and package lists.

## Design References

Design `Planet positions from Horizons`, `Size budgets are split`.

## Guardrails

PROV-01, PROV-02 (provenance labels kept); TEST-01..04; ARCH-06 (mechanise a trap where cheap). Scientific tolerances are neither loosened nor restated.

## Implementation Plan

1. Confirm package list and providers from tools and source.
2. Fix contradictions; mark history; reorder RELEASING so the current procedure leads.
3. Update docs/README.md owners if needed.

## Boundaries

Never run the publish tool without --dry-run (AGENTS.md). Release notes, archive, spike reports and evidence untouched.

## Technical Verification

prettier on changed files.

## Technical Evidence

Pending execution.

## Drift Notes

Pending.
