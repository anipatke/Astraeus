---
id: T-065
title: Draft the Spike 04 findings
objective: O-012
status: in_progress
stage: audit
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o012-plan-20261016}
---

# Draft the Spike 04 findings

## Outcome

`docs/ASTRAEUS_SPIKE_04.md` answers each of the six Definition of Done questions in `docs/ASTRAEUS_SPIKE_04_BRIEF.md`, each answer backed by named tests, browser evidence, Check records or audit rows.

## User Check

Read the findings note. For each question you can see a plain answer and click through to its evidence. The note doesn't claim more than the evidence shows, and the open items (the ground view, owner looks still pending) are stated.

## Done When

1. Owner direction 2026-10-16: "Draft the Spike 04 findings", queued overnight while O-011 awaits owner looks; it may need a touch-up after O-011 closes, which the note says at the top.
2. Six sections, one per brief question:
   - capabilities reused;
   - abstractions that failed or proved insufficient;
   - capabilities added or changed, and why;
   - evidence they are reusable (synthetic or alternative configurations, contract tests);
   - remaining limitations;
   - whether a second shower works mostly through configuration (the Geminids, T-039 and C-033).
3. Every claim links to a commit, a test file and case name, a Check record (C-###), an evidence directory, or an audit row in `docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md`. A claim with no evidence is written as an open question, not as a fact.
4. Data provenance is stated plainly: GMN is public; CAMS and Yale are local only; dot places are illustrative. The ground-observer gap is recorded.
5. Same style as `docs/ASTRAEUS_SPIKE_03.md`.

## Context Files

`docs/ASTRAEUS_SPIKE_04_BRIEF.md`, `docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md`, `docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md`, `docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md`, `docs/ASTRAEUS_SPIKE_03.md`, `docs/ASTRONOMY_VALIDATION.md`, `.savepoint/Design.md`, `.savepoint/checks/` (C-022 onward).

## Design References

All of Design.md (reading for reconciliation, not editing).

## Guardrails

PROV-01, TEST-03.

## Implementation Plan

1. Read the brief, the gap audit and the Checks.
2. Map each Definition of Done question to its evidence.
3. Write the note, then list in Drift Notes any Design.md gap found (no Design edits here).

## Boundaries

Documentation only: no code, no Design.md edits, no new Checks.

## Technical Verification

Link check (every referenced path exists). Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Built 2026-10-16 by a builder session (no Check written, Task not set to done, nothing committed or staged, router untouched). Output: `docs/ASTRAEUS_SPIKE_04.md`, draft banner at the top, six sections plus data provenance, open questions, recommendations (labelled) and an evidence index.

Per criterion: (1) draft banner states O-011 owner looks are pending and a touch-up may follow. (2) Six sections in the brief's order. (3) Every claim cites a commit, test file and case name, Check, evidence directory or audit row; gaps are listed as eight Open questions (T-056 has no Check; I-024/I-026/I-029 and T-036/T-037 read only through builder evidence or the T-040 drift table; C-013 rests on an owner exception; CAMS permission unanswered). (4) Provenance stated: GMN public CC BY 4.0, CAMS and Yale local only, dot places illustrative; ground-observer gap recorded. (5) Structure follows `docs/ASTRAEUS_SPIKE_03.md` (short intro, numbered sections, evidence).

Link check (node, 2026-10-16): every backticked repo path under docs, src, tests, tools, data, .savepoint and every cited commit hash was tested for existence.
Output: `paths checked 78 commits 20 missing []`

Read: brief, gap audit, stream and sky data note, asset architecture (first 60 lines), Spike 03 note, Checks C-014, C-026 to C-033 (coverage sections), T-040 and T-056 evidence, O-011 Objective, Design.md (grep). Test case names taken from `grep` of the test files named in the note.

Limitations: documentation only, no gates run. Claims were taken from Check records, not re-verified.

## Drift Notes

- Design.md "Known open items" paragraph (around line 175) still describes the Spike 03 position; it does not list the Spike 04 limitations (no ground view, local-only CAMS/Yale data, group-fill 10^4 miss from O-009). T-040 added a separate "Open after O-011" paragraph; the older paragraph is stale.
- Design.md does not say a `published` provenance type is an open candidate (it appears only in the T-040 drift table).
- Not an architecture gap but unchecked: T-056 (GMN source) has no Check, and T-036/T-037 were read only via the T-040 drift table. O-012's second Task (Design reconciliation) should decide.
