---
id: T-010
title: Apply the owner-approved A-33/A-34 speed correction
objective: O-002
status: done
depends_on: []
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: t009-rework-2026-10-06}
check_waiver:
    task: T-010
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-06T04:38:07Z"
---

# Apply the owner-approved A-33/A-34 speed correction

## Outcome

The reconstruction uses 4 075.0 ft/s (A-33) and 4 074.0 ft/s (A-34) through the existing inferred-override mechanism. The raw source values stay as transcribed ("4 375.0" and "4 374.0"), and the A-34>A-35 return-coast miss is re-measured and documented.

## Owner Decision

Approved by the owner on 2026-10-06 in the T-009 rework conversation ("Yes to both"). The evidence is in I-006 and `docs/ASTRAEUS_SPIKE_02.md` 7.1. The hundreds digit is illegible on the MSC-00171 Table 7-II scan. A-34 at 4 074.0 meets A-35 within print rounding and reproduces the Table 7-VI entry conditions. A-33 at 4 075.0 is consistent with Table 7-VI's post-TEI prediction. The owner reports that *Apollo by the Numbers* (NASA SP-4029) gives 4,075.0 ft/s for the MCC-5 ignition. The executor could not retrieve that page, so this value is owner-reported.

## User Check

Open `docs/APOLLO11_RECONSTRUCTION.md` and find A-33 and A-34 under "Inferred overrides", with the printed value and the value used. Confirm that `data/apollo11/raw/anchors.json` still says "4 375.0" and "4 374.0", and that the A-34>A-35 step is now tens of km rather than 44,194 km.

## Done When

1. `tools/apollo11/config.json` `inferredOverrides` has A-33 (`inertialSpeedKmS`, printed 4 375.0 → 4 075.0 ft/s) and A-34 (4 374.0 → 4 074.0 ft/s), with status, confidence, decision and evidence fields. The override values are exact km/s conversions of the ft/s figures, and the guard still throws if the printed value differs.
2. Raw data is unchanged. Tests are updated to assert the exact override set {A-05, A-33, A-34} and the unchanged raw strings.
3. `npm run apollo11:reconstruct` is re-run twice with byte-identical output. The report, provenance accuracy text and A-05 "single exception" wording are updated to match.
4. The A-34>A-35 discontinuity and the A-33/A-34 entry-interface result are recorded from the report and `node tools/validate/anchor-consistency.mjs`. A-32>A-33 stays labelled unexplained.
5. The spike note 7/7.1/13, Design.md, I-003 and I-006 history are updated to state that the correction is applied and owner-approved, not documentary-confirmed from the primary scan. Configured gates pass.

## Context Files

`tools/apollo11/config.json`, `tools/apollo11/anchors.ts`, `tools/apollo11/report.ts`, `tools/apollo11/reconstruct.ts`, `tests/apollo11Reconstruction.test.ts`, `tools/validate/anchor-consistency.mjs`, `docs/ASTRAEUS_SPIKE_02.md`, `docs/APOLLO11_RECONSTRUCTION.md`, `.savepoint/Design.md`, `.savepoint/issues/I-003-propagated-misses-reach-tens-of-thousands-of-km.md`, `.savepoint/issues/I-006-return-coast-misses-not-explained-by-perturbations.md`.

## Design References

Design: Current Technical State (reconstruction).

## Guardrails

TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Add the two overrides to config.
2. Update the override tests and the wording that names A-05 as the only exception.
3. Re-run the reconstruction and the audit; record the new misses.
4. Update the docs and Issues; run the gates.

## Boundaries

Data correction through the existing override path only. Do not change any raw value, the conversion code, the dynamics, or A-32.

## Technical Verification

Configured gates, the determinism re-run, and the audit script output. A Check follows `agent-skills/references/check-method.md`.

## Technical Evidence

Executor evidence for a later Check; not a Check, and no `CLEAR` is claimed. Executed in the same conversation that reworked T-009 and planned this Task, so a fresh session must check it.

**Per-criterion outcomes**

1. Met. `tools/apollo11/config.json` `inferredOverrides` now has A-33 (printed 1.3335 → 1.24206 km/s, i.e. 4 375.0 → 4 075.0 ft/s) and A-34 (1.3331952 → 1.2417552 km/s, i.e. 4 374.0 → 4 074.0 ft/s). Each has status `probable-transcription-error`, confidence, decision and evidence fields. The printed values are the exact JS products the parser computes, so the existing guard in `normaliseAnchor` still throws if the raw value changes. Rewriting the file normalised its JSON indentation; its content is otherwise unchanged.
2. Met. The raw strings are still "4 375.0" and "4 374.0" (checked after the final run). `tests/apollo11Reconstruction.test.ts` now asserts the flagged and overridden set is exactly ["A-05", "A-33", "A-34"], the A-33/A-34 speeds used (4 075.0/4 074.0 ft/s), and the unchanged raw strings.
3. Met. `npm run apollo11:reconstruct` was run repeatedly; the last two runs were byte-identical (combined SHA-256 171ea92d…). The report lists A-33 and A-34 under "Inferred overrides". The "Known gaps" text and the provenance `accuracy` text now name A-32>A-33 as the unexplained miss and describe the A-33/A-34 overrides. The A-05 "single exception" sentence now names all three overrides.
4. Met. Reconstruction segments table: A-34>A-35 is 15,344.0 km / 10,742.7 m/s (was 44,193.9 / 10,950.8). A-32>A-33 is 25,124.6 km / 417.7 m/s (position unchanged; the velocity changed because A-33 changed). `node tools/validate/anchor-consistency.mjs` now writes separate `printed` (as transcribed) and `reconstructed` rows. Reconstructed A-34>A-35 under n-body is 38.4 km / 55.6 m/s; printed is 37,893.2 km / 10,830.8 m/s. A-34 at 4 074.0 reaches entry at 195:03:08.6, 3.18°S 171.97°E, −6.48°. A-32>A-33 is still labelled unexplained.
5. Met. Updated: spike note sections 4, 7, 7.1, 12, 13 and 14.1; `.savepoint/Design.md` Current Technical State; I-003 (summary and history); I-006 (owner_decision and repair_attempted history). All say the correction is applied and owner-approved, not documentary-confirmed. Gates are below.

**Commands (final):** `npm run typecheck` pass; `npm run build` pass (existing chunk warning); `npm test` 7 files / 116 tests pass; `npm run apollo11:reconstruct` byte-identical; `node tools/validate/anchor-consistency.mjs`; `savepoint resume` strict-loads. Lint: none configured. The browser script was not re-run, because no runtime code changed; only the generated sample values after A-33 changed.

**Files read:** the Context Files. **Extra reads:** none beyond the Context Files and this conversation's T-009 rework reads.

**Files changed:** `tools/apollo11/config.json`, `tools/apollo11/reconstruct.ts`, `tools/apollo11/report.ts`, `tests/apollo11Reconstruction.test.ts`, `tools/validate/anchor-consistency.mjs` (printed vs reconstructed rows), regenerated `data/apollo11/normalised|generated/**`, `docs/APOLLO11_RECONSTRUCTION.md`, `docs/evidence/anchor-consistency.json`, `docs/ASTRAEUS_SPIKE_02.md`, `.savepoint/Design.md`, I-003, I-006, this Task, `.savepoint/router.md`.

**Limitations**
- The corrected digit is not readable on the only primary scan used. The *Apollo by the Numbers* 4,075.0 ft/s value is owner-reported; the executor could not retrieve it. A-34's 4 074.0 is inferred from A-33 plus the 4.8 ft/s burn and the A-35 and entry fits.
- The reconstruction still uses two-body coasts, so a 15,344 km step remains at A-35 in the rendered path.
- The T-009 deliverables were edited after T-009 reached `audit`. T-009's fresh Task Check should review the docs as they now stand.

