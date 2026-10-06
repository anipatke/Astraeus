---
id: T-014
title: Settle the A-13 and A-05 readings from the sources
objective: O-004
status: done
depends_on: []
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: g002-plan-2026-10-06}
check_waiver:
    task: T-014
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-06T07:55:32Z"
---

# Settle the A-13 and A-05 readings from the sources

## Outcome

A-13's longitude has a sourced, consistency-checked value, either a cited raw correction or an owner-approved inferred override. A-05's flight-path angle override has a recorded documentary search result. The reconstruction is regenerated on the settled data.

## User Check

Read the A-13 and A-05 findings in `docs/APOLLO11_SOURCES.md` and the decision presented in chat; answer yes/no to any proposed override. Confirm the regenerated report no longer shows a 650 km A-13>A-14 anchor separation.

## Done When

- A-13 longitude: the source reading (MSC-00171 Table 7-II p. 7-9, or a cited secondary source such as the Apollo Flight Journal or SP-4029) is recorded with what was actually read, and the value is checked against A-12 and A-14 by propagation (expected ignition-to-cutoff ground track about 0.9° westward). Outcome is one of: cited raw correction with `correction_note` (source confirms a transcription error), or an inferred override in `tools/apollo11/config.json` `inferredOverrides` with evidence and the owner's recorded approval (source unreadable or printed as transcribed). If neither the source nor the owner settles it, stop and report rather than change data.
- A-05: a time-boxed search (about one hour of source work) for a documentary state near docking (RTCC, BET or equivalent) is recorded with the sources tried. The override's `status`/`confidence` changes only if a source is found; otherwise it is recorded as still inferred.
- A regression test pins the settled A-13 value (raw and reconstruction), alongside the existing A-05 and A-06–A-08 assertions.
- `npm run apollo11:reconstruct` re-runs byte-identical twice; A-13>A-14 anchor separation is reported.
- I-002 and I-007 histories record the outcome (append-only, `repair_attempted`).
- Configured gates pass (typecheck, build, test).

## Context Files

`data/apollo11/raw/anchors.json`, `data/apollo11/normalised/anchors.json`, `tools/apollo11/config.json`, `tools/apollo11/anchors.ts`, `tools/validate/anchor-consistency.mjs`, `tests/apollo11Reconstruction.test.ts`, `docs/APOLLO11_SOURCES.md`, `.savepoint/issues/I-002-suspected-transcription-errors-in-anchors-a-05-to-a-08.md`, `.savepoint/issues/I-007-a-13-longitude-and-burn-arc-speed-spike.md`.

## Design References

Design: Components/Codebase Map (`tools/apollo11/`, `data/apollo11/`), Current Technical State (overrides in effect, I-007). O-004 Confirmed Decisions.

## Guardrails

TEST-01, TEST-02, TEST-03, DATA-01, STYLE-07, STYLE-09.

## Implementation Plan

1. Fetch the MSC-00171 page or the AFJ/SP-4029 rows for A-13/A-14 (single-page or text sources if the full PDF is too large). Record exactly what was read and from where.
2. Run `tools/validate/anchor-consistency.mjs` (or an equivalent propagation from A-12 and back from A-14) for the printed value and candidate values; record the predicted longitude.
3. If the source confirms a transcription error, correct the raw cell with `correction_note` and citation. Otherwise prepare an override proposal and **stop for the owner's yes/no** before writing it.
4. Run the bounded A-05 documentary search; record sources tried and the result.
5. Add the regression test; regenerate; confirm byte-identical rerun; run gates.
6. Append Issue history entries; record Technical Evidence.

## Boundaries

No burn-model change (next Task). No other anchor edits unless a source read here proves a transcription error, which is then reported to the owner before editing. No runtime or `src/` change.

## Technical Verification

Focused `vitest` on `tests/apollo11Reconstruction.test.ts` during iteration; handoff runs the configured typecheck, build and test gates per AGENTS.md's Verification Policy.

## Technical Evidence

### Acceptance evidence

- **A-13 source and decision:** NASA SP-238 Table 7-II p. 7-9 (NTRS 19710015566) indexes A-13 ignition as `170.09 E` and A-14 cutoff as `169.16 E`. Corrected `data/apollo11/raw/anchors.json` from `170.09W` to `170.09E` with a `correction_note`; the A-13 normalized inputs now use `170.09°` and no inferred override.
- **A-13 propagation:** `node tools/validate/anchor-consistency.mjs` propagates A-12 forward and A-14 backward. Predictions at A-13 are `170.75° E` from A-12 and `170.01° E` from A-14, against the source value `170.09° E`. The old west-longitude hypothesis is about 19–20° away from both predictions. Corrected A-13>A-14 anchor separation is `29.986 km`; old transcription hypothesis is `667.101 km`. The generated reconstruction report lists A-13>A-14 and contains no 650 km separation.
- **A-05 documentary search:** Bounded source search reviewed the primary Table 7-II row, NASA M-932-69-11 post-launch report, Apollo 11 technical air-to-ground transcript, NASA PAO transcript, Apollo Flight Journal transposition/docking transcript, and NASA-CR-108349 trajectory reconstruction report. No independent full state vector or BET near GET 3:24 was found. PAO's GET 3:46 values are `18,917 ft/s` and `9,002 n mi`; at 4:04 they are `17,014 ft/s` and `11,753 n mi`. These are scalar speed/range readouts, not a full state. A-05 stays raw `44.94°`; its owner-approved `49.94°` override remains inferred with `probable-source-typo` status and high/not-documentary-confirmed confidence unchanged.
- **Regression coverage:** Added test `pins the source-corrected A-13 longitude in raw and normalised anchors`; existing cases continue to pin A-05's raw/override values and A-06–A-08's source-verified values.
- **Regeneration:** `npm run apollo11:reconstruct` ran twice successfully. SHA-256 values were identical for `data/apollo11/normalised/anchors.json`, all four files under `data/apollo11/generated/`, and `docs/APOLLO11_RECONSTRUCTION.md` (hash output observed before and after the second run).
- **Issue histories:** Appended `repair_attempted` outcomes to I-007 (source-confirmed A-13 longitude correction) and I-002 (A-05 still inferred after search).
- **Configured gates:** `npm run typecheck` passed; `npm run build` passed (Vite emitted its existing >500 kB chunk-size advisory); `npm test` passed (7 files, 124 tests). The first test run exposed the non-serialized `printedInputs` field assumption in the new assertion; removed that assertion, then reran all three configured gates successfully.
- **Commands run:** `npm run apollo11:reconstruct` (twice, successful and byte-identical); `node tools/validate/anchor-consistency.mjs` (success); `sha256sum data/apollo11/normalised/anchors.json data/apollo11/generated/*.json docs/APOLLO11_RECONSTRUCTION.md` before and after the second regeneration (all six file hashes identical); configured typecheck, build, and test gates as above.

### Read budget and changed files

Read owner-provided AGENTS.md instructions, `agent-skills/savepoint-task/SKILL.md`, `.savepoint/router.md`, this Task, O-004, `.savepoint/config.yml`, Guardrails rules TEST-01/02/03, DATA-01, STYLE-07/09, both anchor JSON files, Apollo anchor configuration/conversion/validation code, the reconstruction test, source notes, I-002 and I-007. Extra read: generated `docs/APOLLO11_RECONSTRUCTION.md`, to verify the A-13>A-14 report row after regeneration. Extra output: `docs/evidence/anchor-consistency.json`, written by the validator to preserve A-12 forward, A-14 backward, and old-longitude hypothesis results; it was then read to confirm the recorded numeric values.

Files changed: this Task, O-004 status, I-002, I-007, raw A-13 anchors, A-05 override evidence, `tools/validate/anchor-consistency.mjs`, the Apollo reconstruction test, `docs/APOLLO11_SOURCES.md`, normalized anchors, generated Columbia/Eagle/events/validation outputs, `docs/APOLLO11_RECONSTRUCTION.md`, and validator evidence JSON. `npm run build` also generated ignored `dist/` output.

Limitations: no independent full documentary state near A-05 docking was found, so its override remains inferred and unchanged. The A-13 table was read through NASA NTRS indexed PDF text because the full PDF was too large for the web text viewer. Task is at `stage: audit`; owner validation and the completion decision remain with the owner.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
