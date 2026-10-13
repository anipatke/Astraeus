---
id: C-027
scope: {kind: task, id: T-051}
result: CLEAR
checked_by: {role: checker, session: o011-orchestrator-check-20261013}
executed_session: t051-builder-2026-10-13
checked_at: '2026-10-13T09:18:02Z'
reviewed:
  base_commit: 864b139
  head_commit: 864b139
  files:
    - docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md
    - .savepoint/objectives/O-011-run-perseids-and-a-second-shower-as-fixtures/tasks/T-051-find-out-whether-we-may-ship-the-measured-perseid-orbits-and-choose-the-sky-sources.md
  dependencies: []
issues: []
supersedes: null
---

# C-027: T-051 Task Check (Quick)

Checker: the O-011 orchestrator session, independent of the Sonnet executor sub-session that did the research. Research Task, so the check re-derives the record's sources and figures rather than reviewing code.

## Scope Lock

1. Done When 1–7 of T-051 (including DW7, added by the 2026-10-13 replan) and PROV-01, PROV-02, TEST-01.
2. Changed files: the decision record (new) and the T-051 Task file. Objective.md, T-038, T-039 and T-053 also changed in this tree; those are the coordinator's planner edits recording the owner's replan decisions, not executor output, and are out of this Task's DW6 diff rule.
3. Out of scope: any build; whether CAMS will grant permission (owner action).

## Acceptance Coverage

| DW | Result | Independent evidence |
|----|--------|----------------------|
| 1 CAMS release, terms, yes/no | Proven | Checker WebFetch of https://cams.seti.org/ (2026-10-13T09:11Z): no licence, terms, copyright or redistribution text; downloads v3.0 `CAMS-v3-2010to2016.xlsx`; PI contact petrus.m.jenniskens@nasa.gov. Checker's own sheet reader (`chk-scripts/head.py`, `python3 -I`) shows row 2 is the citation request only, quoted correctly. SHA-256 of the scratch download re-computed: ec886496…85845, matches the record. Verdict "unclear, terms silent" and whom to ask are correct; the replan was raised as DW1 requires and resolved by owner decision (Objective.md, Replan — 2026-10-13 (T-051 data terms)). |
| 2 Content, counts, propagation | Proven | Checker's independent streaming counter (`chk-scripts/count.py`, keys on columns AK and BM, 3.9 s): 471,586 sheet rows (4 header rows + 471,582 data); IAU 7 = 18,699 bound + 6,229 e≥1 = 24,928; IAU 4 = 14,873 + 32 = 14,905. Exact match. First data row date serial 39010 → 2010-10-21 under 1904 dates (CAMS began Oct 2010), consistent with the record's 1904 finding. Worked propagation: three records, method and command recorded; dt=0 reproduces r_E; not re-run (record is internally consistent and the method is TwoBodyAdapter as planned). Subset format and gzip sizes stated. |
| 3 Reference values | Proven | Checker re-fetched https://www.ta3.sk/IAUC22DB/MDC2022/Etc/streamestablisheddata2026.txt: PER AdNo 9 (2023-10-01, Jenniskens 2023) LoS 140.1, RA 47.9, Dec 57.9, Vg 58.8, window 115.0–175.0; GEM AdNo 8 LoS 261.6, RA 113.0, Dec 32.4, Vg 33.8, window 225.0–273.0. Exact match. SBDB elements and the three Horizons comparisons are cited with query and time (not re-fetched; T-054 re-establishes them as test fixtures). |
| 4 Star catalogue | Proven | Owner chose Yale BSC, local only. Checker parse of the scratch `catalog.gz` by the ReadMe byte ranges: 9,110 records, 8,404 with V ≤ 6.5, 8,160 of those with B−V. Exact match. |
| 5 Milky Way image | Proven | ESO eso0932a, CC BY 4.0, credit "ESO/S. Brunier", projection and frame stated with a pixel check of the LMC; pole constants from fetched Astropy source; GC at RA 266.405, Dec −28.936 is the standard J2000 value. Sub-degree image alignment is stated as unverified and is T-053 DW2's job. |
| 6 No source/test/data changes | Proven | `git status`: only the record (new) and Task file from the executor; no src/, tests/, data/ change. |
| 7 Post-decision content | Proven | Section 5 states the local-data approach, exact URLs (with the User-Agent quirk and hash check), the no-fallback rule, and a draft email; published peak/radiant from MDC; pole constants fetched; Yale columns and count. |

Guardrails: PROV-01/PROV-02 satisfied (every figure cited or computed, licence status explicit, unknowns listed). TEST-01 not applicable (no code).

## Issues

None. No materiality actions required.

## Observations (non-blocking, carried forward)

1. **Stream display rule needs a planning decision before T-052.** Propagating each CAMS member from its own observation epoch to one display time scatters members 22–32 AU from the Sun (record §1). T-052's outcome as written ("propagated … to the requested time") would reproduce that scatter. How member dots are placed along their measured orbits is an owner/planner choice; coordinator to raise it.
2. 25% of Perseid members have e ≥ 1 (speed error on fast meteors) and `a` is weak; the measured node, i, ω and e are the reliable parts. Dropping e ≥ 1 leaves 18,699 Perseids, under the 20,000-member performance target; T-038 DW4 already covers "fewer than 20,000: all drawn, count stated".
3. The owner will send their own wording of the permission email (given in chat); the record's draft stands as the template.
