---
id: I-002
title: Suspected transcription errors in raw anchors A-05 to A-08
type: defect
status: resolved
source:
  kind: report
  actor: {role: executor, session: T-007}
  at: '2026-10-06T00:00:00Z'
tasks: [T-005, T-007]
resolution:
  disposition: escalated
  actor: {role: planner, session: g002-plan-2026-10-06}
  at: '2026-10-06T12:00:00Z'
  reason: Owner chose to repair this inside G-002 as Objective O-004.
escalated_to: O-004
history:
  - at: '2026-10-06T00:00:00Z'
    actor: {role: executor, session: T-007}
    kind: observed
    note: Owner chose to keep the raw values, flag them and continue T-007. Not verified against the PDF, which is too large to fetch here.
  - at: '2026-10-06T00:00:00Z'
    actor: {role: owner, session: T-007}
    kind: owner_decision
    note: 'Keep raw, flag, continue.'
  - at: '2026-10-06T00:00:00Z'
    actor: {role: owner, session: T-007}
    kind: owner_decision
    note: 'Owner checked MSC-00171 Table 7-II and confirmed A-06 (altitude 13 506.5, longitude 67.70W, speed 16 060.8), A-07 (16 620.8) and A-08 (16 627.3) were transcription errors. A-05 flight-path angle 44.94 is printed as in the source; owner investigates it separately.'
  - at: '2026-10-06T00:00:00Z'
    actor: {role: executor, session: T-007}
    kind: repair_attempted
    note: 'Corrected the four raw values with correction_note on each entry; added regression test; re-ran reconstruction. Misses fell: A-06>A-07 9,574 to 120 km, A-08>A-09 164,274 to 121 km. Tests 93 pass. A-05 unchanged and still flagged. Not verified as resolved by a Check.'
  - at: '2026-10-06T00:00:00Z'
    actor: {role: owner, session: T-007}
    kind: owner_decision
    note: 'Owner approved an explicit reconstruction exception for A-05: raw and canonical flight-path angle stays 44.94; reconstruction uses 49.94 as an inferred override (status probable-source-typo, confidence high but not documentary-confirmed). Evidence: propagation from neighbouring anchors predicts about 49.95; 49.94 preserves continuity; contemporaneous PAO readouts at GET 3:46 and 4:04 agree better with 49.94; 44.94 leaves large residuals. Single manual exception, not a general repair mechanism. Documentary confirmation (RTCC or BET state vector near docking) still wanted.'
  - at: '2026-10-06T00:00:00Z'
    actor: {role: executor, session: T-007}
    kind: repair_attempted
    note: 'Override implemented in tools/apollo11/config.json (inferredOverrides) and recorded in anchors.json, the report and tests. A-04>A-05 velocity miss 604.2 to 1.8 m/s (position 4.5 km unchanged). A-05>A-06 miss 1,831.0 km and 570.2 m/s to 61.9 km and 42.9 m/s. Raw test still asserts 44.94. Not verified by a Check.'
  - at: '2026-10-06T12:00:00Z'
    actor: {role: planner, session: g002-plan-2026-10-06}
    kind: escalated
    note: Repair promoted into O-004 (Tasks T-014 source readings, T-015 physical burns) by owner decision in G-002 planning.
  - at: '2026-10-06T07:51:24Z'
    actor: {role: executor, session: t014-source-settlement-2026-10-06}
    kind: repair_attempted
    note: 'T-014 source search left the owner-approved A-05 override inferred: Table 7-II prints 44.94 degrees, and no independent full state vector or BET near GET 3:24 was found in the NASA post-launch report, technical transcript, PAO transcript, Apollo Flight Journal docking transcript, or NASA-CR-108349. PAO provides scalar speed/range at GET 3:46 (18,917 ft/s, 9,002 n mi) and 4:04 (17,014 ft/s, 11,753 n mi), not a full state. Kept raw 44.94, reconstruction 49.94, status probable-source-typo, and confidence high/not documentary-confirmed unchanged.'
---

# I-002: Suspected transcription errors in raw anchors A-05 to A-08

## Summary

Four Table 7-II anchors in `data/apollo11/raw/anchors.json` disagree with the state two-body-propagated from A-03, while A-04 and A-09 agree with it. Digit-slip patterns suggest transcription errors; the values were not checked against the printed table.

## Evidence

From the T-007 consistency table in `docs/APOLLO11_RECONSTRUCTION.md`:

- A-05 flight-path angle printed 44.94, predicted about 49.95.
- A-06 altitude printed 8,506.5 nmi, predicted about 13,514; longitude printed 47.70W, predicted about 67.5W; speed printed 16,360.9 ft/s, predicted about 16,072.
- A-07 altitude printed 10,620.8 nmi, predicted about 16,632.
- A-08 altitude printed 10,627.3 nmi, predicted about 16,638.

The result is large reported misses on Columbia's coasts A-05>A-06 (11,154 km), A-06>A-07 (9,574 km) and A-08>A-09 (164,274 km). T-007 keeps the raw values unchanged and flags these four anchors.

## Proof Needed

Compare these rows against MSC-00171 Table 7-II (page 7-9). If they are transcription errors, correct `data/apollo11/raw/anchors.json` with citations, re-run `npm run apollo11:reconstruct` and remove the ids from `suspectAnchors` in `tools/apollo11/config.json`.
