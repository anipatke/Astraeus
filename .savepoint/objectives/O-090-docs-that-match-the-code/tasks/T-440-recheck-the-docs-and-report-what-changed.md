---
id: T-440
objective: O-090
title: Recheck the docs and report what changed
status: planned
depends_on: [{task: T-439, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-440, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T05:30:31Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
lane: docs
planned_reads: [docs/README.md, README.md, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, .savepoint/Design.md]
planned_writes: [packages/astraeus/CHANGELOG.md, docs/README.md]
---

# Recheck the docs and report what changed

## Outcome

Owner plan step 5. The original contradictions (workspace count, planetary provider, browser workflow and timing, release status, API intro, package guidance) are rechecked against code, config, generated output and dated evidence; the site's API reference is built and its lead inspected; the packed engine README is inspected; touched examples and links pass the gates in force. An independent fresh read-through (a separate session given only the repo) answers "How do I run the right checks?", "How do I build and extend my first scene?" and "Where is the current contract for this subsystem?", recording the path taken and any ambiguity; ambiguities are fixed or recorded with a reason. Before/after word counts for every edited guide, the duplicated claims retired and the deliberate duplication kept (with its reader) are reported here, with no percentage target. The changelog's top section gets one docs line.

## User Check

The owner reads the word-count and duplication report in this Task's evidence.

## Done When

| Item | Evidence |
|---|---|
| Each original contradiction rechecked and now true, with its source | table |
| The site build that renders the API page runs; the lead shows the manifest version and no "preview" | command + grep of output |
| `npm pack --dry-run -w astraeus` and README links checked | command |
| Fresh read-through: three questions, path, ambiguities, fixes | evidence (coordinator spawns the reader; its answers quoted) |
| Word-count table (before from `git show main:<file>`, after), retired duplicates, kept duplicates + reader | table |
| Changelog line added in the top section only | diff |

## Context Files

All O-090 sibling Tasks' Technical Evidence; `docs/README.md`; `packages/astraeus/CHANGELOG.md` top section only.

## Design References

None beyond the sibling Tasks.

## Guardrails

PROV-01, PROV-02 (provenance labels kept); TEST-01..04; ARCH-06 (mechanise a trap where cheap).

## Implementation Plan

1. Recheck table.
2. Build and pack inspection; link check over all edited files.
3. The coordinator runs the fresh read-through and passes its answers; fix small ambiguities in place (log files) or record them.
4. Word-count and duplication report; changelog line.

## Boundaries

Fixes are limited to small ambiguities in files earlier O-090 Tasks edited; anything larger becomes an Issue via the coordinator.

## Technical Verification

prettier on changed files; the build and pack commands above.

## Technical Evidence

Pending execution.

## Drift Notes

Pending.
