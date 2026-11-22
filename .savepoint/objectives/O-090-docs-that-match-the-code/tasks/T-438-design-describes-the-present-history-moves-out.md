---
id: T-438
objective: O-090
title: Design describes the present, history moves out
status: done
depends_on: [{task: T-437, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-438, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T05:30:31Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
lane: docs
planned_reads: [docs/README.md, .savepoint/Design.md, docs/architecture/codebase-details.md, docs/architecture/reconciliation-history.md]
planned_writes: [.savepoint/Design.md, docs/architecture/codebase-details.md, docs/architecture/reconciliation-history.md, docs/README.md, docs/architecture/state-and-assets.md]
---

# Design describes the present, history moves out

## Outcome

Owner plan step 4, architecture. Design.md and the component map keep purpose, boundaries, lifecycle ownership and decision rationale; inventories, step sequences and dated gate results are replaced by links to the owning source; dated per-Objective history moves to `docs/architecture/reconciliation-history.md` under clearly marked headings, wording unchanged. Headings that Tasks, Checks, Guardrails, skills or AGENTS.md reference by name are kept or leave a one-line pointer.

## User Check

None visual. From Design's overview a reader reaches a subsystem's detailed contract in one link.

## Done When

| Item | Evidence |
|---|---|
| Inbound references to Design headings found (grep over .savepoint, agent-skills, docs, AGENTS.md, plus heading-name greps) and each referenced heading kept or pointed | table |
| Dated gate results, sizes and per-Objective narratives either moved under a history heading or replaced by a link; nothing deleted without a home | table |
| Overview → contract in one link for each subsystem in the map | evidence |
| The Savepoint index still loads (resume) | command |
| Before/after word count | wc -w |

## Context Files

T-434 Technical Evidence; `docs/README.md`; `.savepoint/Design.md` (whole: this Task trims it); `docs/architecture/codebase-details.md`; `docs/architecture/reconciliation-history.md` (top and headings).

## Design References

`agent-skills/savepoint-design/SKILL.md` under `Design Template`.

## Guardrails

PROV-01, PROV-02 (provenance labels kept); TEST-01..04; ARCH-06 (mechanise a trap where cheap).

## Implementation Plan

1. Grep inbound heading references first.
2. Per section: keep current contract and rationale; move dated history; replace inventories with links.
3. Update `docs/README.md` owners if a fact's owner moved.

## Boundaries

No archived history rewritten; moved text keeps its wording. Guardrails.md and other Savepoint records untouched.

## Technical Verification

prettier on changed files; resume loads.

## Technical Evidence

Builder session orchestrate-g024 T-438, 2026-11-22. Router left unchanged (coordinator rule).

### Reads

Context Files: T-434 Technical Evidence (tables C, M) and the Drift Notes of T-434 to T-437; `docs/README.md`; `.savepoint/Design.md` (whole); `docs/architecture/codebase-details.md` (top, headings, lines 7, 12); `docs/architecture/reconciliation-history.md` (top, headings, tail). Extra reads (logged): `docs/architecture/state-and-assets.md` top and line 33 (C5, assigned here because T-439's planned_writes do not hold it; added to this Task's `planned_writes`); `agent-skills/savepoint-design/SKILL.md` `Design Template`; `docs/architecture/demo-contracts.md`, `docs/BROWSER_CHECKS.md`, `docs/agents/build.md`, `verification.md` headings and greps (link targets); `browser-steps.mjs` step names and `tools/build-example.mjs` `EXAMPLES` (hello-react, two-viewers); `examples/hello-react/src/main.jsx` head; `ls` of `packages/`, `examples/`, `tools/`, `docs/`.

### Done When -> evidence

| Item | Evidence | Outcome |
|---|---|---|
| Inbound references found and each referenced heading kept or pointed | Grep of `.savepoint`, `agent-skills`, `docs`, `AGENTS.md`, READMEs, tests and tools for `Design(.md)` plus quoted heading names (about 100 distinct names). Every one of Design's 61 headings is kept with its exact text: `diff <(grep '^#' Design-before) <(grep '^#' Design.md)` is empty. Live inbound links (`AGENTS.md` and `docs/README.md` `#componentscodebase-map`, root README `#planet-positions-from-horizons`, docs/README "Verification in tiers (O-086)", "Size budgets are split", "Boundaries", BROWSER_CHECKS "Size budgets are split", `packageBoundaries.test.ts` and `verbGrammar.test.ts` "Public API shape") resolve. Referenced bold labels kept: "Allowlist growth counted per finding", "Owner decisions on C-137" (O2), "O-053 checks". Paragraph lead-ins named by old records ("Panels, controls and reads (O-075)", "The time look (O-074)", "Shown over a span of time (O-071)") moved with their section, and the Design heading links there. Names that old records cite but that were already absent from Design before this Task ("Open after O-011", "Shell layout (O-020)", "Public site and launch", "Measured orbits: GMN only") are unchanged (not regressions). No test or tool parses Design.md (grep) | Met |
| Dated gate results, sizes and per-Objective narratives moved under a history heading or replaced by a link; nothing deleted without a home | 34 blocks moved verbatim to `reconciliation-history.md` `### Design.md detail moved (O-090 T-438, 2026-11-22)`, one `####` per Design heading, same name (plus a Lookup row). Only link targets were re-pointed (2 links) to work from `docs/architecture/`. Script check: every non-heading line of the old Design.md is found verbatim in the new Design.md or the history file, except Architecture's second paragraph (an instruction on how to read Design, rewritten in place with the same meaning plus the pointer to the moved detail and to `docs/README.md`) | Met |
| Overview to contract in one link for each subsystem in the map | The map gains a `Contract` column: every row (engine, astraeus-data, planet packages, constellations, demos, site, examples, tools, tests, docs) links its owning README, note or guide; each Interfaces heading ends with a `Detail` link to its moved text and names its contract note where one exists (viewer-interface, planet-accuracy, constellations, o059-public-forms, browser policy). Link check script (relative paths and GitHub anchors) over Design.md, reconciliation-history.md, docs/README.md, root README.md, codebase-details.md, state-and-assets.md: `bad 0` | Met |
| Savepoint index still loads | `savepoint resume` -> loads ("Advance Task T-438 to its next stage") | Met |
| Before/after word count | `wc -w`: `.savepoint/Design.md` 17,233 -> 4,035; `reconciliation-history.md` 10,950 -> 26,874; `codebase-details.md` 3,692 -> 3,738; `state-and-assets.md` 3,217 -> 3,253; `docs/README.md` 510 -> 519 | Met |

### Deferred notes accounted for (AGENTS.md "Deferred Design reconciliation")

| Note (source) | Outcome |
|---|---|
| Design `Verification in tiers (O-086)` omits `two-viewers` (C12c; T-434, T-435) | Reflected: the section no longer copies the step list; it points at `browser-steps.mjs` (`-- --list`) and browser policy and states the full tier includes `two-viewers` |
| `Current Technical State` copies dated timings 125/196/320 s and `npm test` about 40 s (C12b, C11; T-434, T-435) | Reflected: the paragraph moved verbatim to history; Design now links BROWSER_CHECKS `Measured time`, `docs/evidence/test-cost/report.md` and build.md, and keeps only the rule that `tools/gate-limits.json` owns the limits |
| Codebase Map lacks `hello-react` and most root tools (C25; T-434) | Reflected: examples row names all four from `EXAMPLES` (`tools/build-example.mjs`), tools row summarises by kind and links build.md and RELEASING instead of an inventory; old table moved to history |
| Map `docs/` row may name `docs/README.md` (T-434) | Reflected: the docs row links it; Architecture's intro links it too |
| `gateLimits.test.ts` now rejects undated elapsed times in gate docs (T-435) | Reflected in `Verification in tiers (O-086)` |
| C5 state-and-assets VSOP87A claim | Reflected as a dated amendment sentence after the historical paragraph (history wording kept), pointing at Design `Planet positions from Horizons` and the planet accuracy note |
| C6 codebase-details "four planet models ... VSOP87A" and C24 "five npm workspaces" | Dated amendment inserted beside each claim (original wording kept) |
| C29 Vitest 30 s constant | Not changed (true; T-434 says do not "fix") |
| C30 size values duplicated in Design | Reflected: `Size budgets are split` keeps the split rule and names the owning files; values moved to history |
| T-436, T-437 drift notes | None architectural; Design already matched (`Planet positions from Horizons`; API generator named in the map Contract column) |

### Commands

- `npx prettier --check .savepoint/Design.md docs/README.md docs/architecture/*.md` -> "All matched files use Prettier code style!" (vacuous: `.prettierignore` leaves out Markdown).
- Link and anchor check (scratch script, GitHub slug rule) -> `bad 0`; duplicate-heading check in reconciliation-history -> none.
- `savepoint resume` -> loads.
- No typecheck, eslint or vitest: no code, test or tool changed, and no test reads the changed files (`gateLimits.test.ts` reads README, BROWSER_CHECKS, browser-policy, verification and build.md; `workflowParity.test.ts` reads RELEASING). No browser runs.

### Files changed

- `.savepoint/Design.md` (rewritten to summaries; all headings kept).
- `docs/architecture/reconciliation-history.md` (Lookup row; new moved section at the end).
- `docs/architecture/codebase-details.md` (two dated amendments: C6, C24).
- `docs/architecture/state-and-assets.md` (one dated amendment: C5; added to `planned_writes`).
- `docs/README.md` (history line names the moved Design text).
- This Task file.

### Limitations

- Summaries are condensed from the old Design text, not re-verified against code beyond the facts T-434 checked; the moved blocks keep their 2026-11-22 values.
- ARCH-06: no new mechanised check. A cheap one would be a test that Design.md quotes no undated elapsed time and that its relative links resolve; it would need a new test file outside this Task's planned writes.
- `codebase-details.md` and `state-and-assets.md` remain largely historical (old `src/` paths); only the claims T-434 listed were amended.

## Drift Notes

- Design now keeps one short summary per heading with a `Detail` link to `reconciliation-history.md` `Design.md detail moved (O-090 T-438, 2026-11-22)`; future reconciliation edits the summary and the owning contract, not the moved text.
- Possible follow-up (ARCH-06): mechanise "Design quotes no measured timings and its links resolve" (see Limitations).

## Coordinator (gates)

2026-11-22, coordinator (orchestrate-g024-20261122): Reviewed: all 61 Design headings kept; moved blocks are a dated as-built record whose header says code/tests/API page own current values. Coordinator relabelled the Design links from "Detail" to "Detail as built, 2026-11-22" so a reader knows the target is a dated record, not a live contract (sed over .savepoint/Design.md). Docs-only; no code changed since the full gate at T-437. Follow-up for T-440's read-through: confirm the three questions still land on a current source. Marked done under the standing rule (owner, O-038: "I mark them as they pass") and the owner's "carry on orchestrating G-024".
