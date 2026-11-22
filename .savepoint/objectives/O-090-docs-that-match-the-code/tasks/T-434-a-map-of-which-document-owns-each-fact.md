---
id: T-434
objective: O-090
title: A map of which document owns each fact
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-434, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T05:30:31Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
lane: docs
planned_reads: [README.md, packages/astraeus/README.md, docs/BROWSER_CHECKS.md, docs/agents/browser-policy.md, docs/agents/verification.md, docs/agents/build.md, docs/NPM_PACKAGING.md, docs/RELEASING.md, .savepoint/Design.md, package.json, packages/astraeus-site/tests/gateLimits.test.ts, packages/astraeus-site/tests/apiRules.test.ts, tools/api-rules.mjs, packages/astraeus-site/tools/site/api-reference.mjs]
planned_writes: [docs/README.md]
---

# A map of which document owns each fact

## Outcome

One short page, `docs/README.md`, says for each drifting fact (package list and versions, workspace count, check commands and tiers, browser scenarios, time limits and measured timings, size budgets, public API surface and error codes, planet/moon providers, release procedure, architecture boundaries) which file or generated output owns it, and which docs only link to it. The Task evidence carries the full contradictions list (each false or stale statement found: file + heading, quote, owning source, true value) that later O-090 Tasks fix, and the list of doc material that code or tests consume (generated README error table, README API tables, the BROWSER_CHECKS limit table, packed README, site API page) so no later Task removes it blindly.

## User Check

None visual. The owner can open `docs/README.md` and find where to change a browser tier, a package version or a public API.

## Done When

| Item | Evidence |
|---|---|
| `docs/README.md` exists, under ~600 words: one table fact → owner → readers, plus one line on where history lives (archive, release notes, dated evidence) | file |
| Contradictions list in Technical Evidence covers at least the six named in the Objective (workspace count, planetary provider, browser workflow and timing, release status/roadmap, API "0.2 preview" intro, package guidance) plus any others found, each with owning source and true value checked against code/config | evidence table |
| Consumed-material list (what code/tests parse or generate in docs) recorded with file:line | evidence table |
| No other doc edited | git diff --stat |

## Context Files

`README.md`; `packages/astraeus/README.md` headings only (`grep -n '^## '`) plus sections a grep hit lands in; `docs/BROWSER_CHECKS.md`; `docs/agents/browser-policy.md`; `docs/agents/verification.md`; `docs/agents/build.md`; `docs/NPM_PACKAGING.md` under `The short version`; `docs/RELEASING.md`; `.savepoint/Design.md` headings plus `Components/Codebase Map` and `Current Technical State`; `package.json` (workspaces, scripts); `.savepoint/config.yml` (`quality_gates`); `packages/astraeus-site/tests/gateLimits.test.ts`; `packages/astraeus-site/tests/apiRules.test.ts`; `tools/api-rules.mjs`; `packages/astraeus-site/tools/site/api-reference.mjs`; the O-090 Objective Decisions.

## Design References

Design `Components/Codebase Map`, `Verification in tiers (O-086)`, `Size budgets are split`.

## Guardrails

PROV-01, PROV-02 (provenance labels kept); TEST-01..04; ARCH-06 (mechanise a trap where cheap).

## Implementation Plan

1. List the facts that drift (Objective Decisions step 1 sources). For each, find the source that owns it (manifest, release config, runner/gate limits, generated API reference, Design, subsystem guide).
2. Grep the top-level docs for each fact; record every stale or contradictory statement.
3. Grep tests and tools for docs they read or write; record them.
4. Write `docs/README.md`: purpose line, the owner table, a history pointer. Link, don't copy values.

## Boundaries

Only `docs/README.md` is written. Fixes happen in later Tasks. No history, Savepoint records, provenance, licence notices or evidence edited.

## Technical Verification

`npx prettier --check docs/README.md`. No tests change.

## Technical Evidence

Pending execution.

## Drift Notes

Pending.
