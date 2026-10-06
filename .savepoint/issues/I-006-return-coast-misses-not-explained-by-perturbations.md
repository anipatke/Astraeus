---
id: I-006
title: Largest return-coast misses are not explained by unmodelled perturbations
type: verification
status: resolved
source:
  kind: check
  check: C-002
  actor: {role: checker, session: check-t009-2026-10-06}
  at: '2026-10-06T02:31:56Z'
tasks: [T-009, T-007]
checks: [C-002, C-003]
severity: medium
resolution:
  disposition: verified
  check: C-003
  actor: {role: checker, session: check-t009-recheck-2026-10-06}
  at: '2026-10-06T05:36:39Z'
  reason: Causal claim removed; the remaining return-coast misses are reproduced independently (A-32>A-33 212.6 km, A-34>A-35 38.4 km) and the residual is stated as unexplained.
history:
  - at: '2026-10-06T02:31:56Z'
    actor: {role: checker, session: check-t009-2026-10-06}
    kind: observed
    note: Found by an independent n-body probe during the T-009 Task Check. Related to I-003, whose stated cause this contradicts for the two largest misses.
    check: C-002
  - at: '2026-10-06T02:46:56Z'
    actor: {role: executor, session: t009-rework-2026-10-06}
    kind: repair_attempted
    note: "T-009 reopened by the owner. Causal wording corrected in the spike note (7, 13, 14.1), Design.md, I-003, and the tool's provenance accuracy and report text (re-run). Return-phase audit added as tools/validate/anchor-consistency.mjs with evidence/anchor-consistency.json; primary-source re-read of Table 7-II/7-I/7-VI/3-I. Result: A-32>A-33 unexplained; A-34>A-35 points to a suspected illegible-digit speed transcription defect at A-33/A-34 (not confirmed, not applied). No source value or conversion changed. Issue stays open for the checker and owner."
  - at: '2026-10-06T04:03:54Z'
    actor: {role: owner, session: t009-rework-conversation}
    kind: owner_decision
    note: Owner approved adopting A-33/A-34 speeds 4 075.0/4 074.0 ft/s as inferred overrides and planning a narrow conversion proof for A-32/A-33 (recorded by the executor on direct owner instruction).
  - at: '2026-10-06T04:03:54Z'
    actor: {role: executor, session: t010-2026-10-06}
    kind: repair_attempted
    note: "T-010 applied the A-33/A-34 inferred overrides (raw unchanged). Audit: A-34>A-35 now 38.4 km / 55.6 m/s under n-body (was 37,893 km); the reconstruction's two-body step is 15,344 km / 10,743 m/s (was 44,194 km). A-32>A-33 is unchanged at 25,125 km and still unexplained; T-011 owns the conversion proof. Issue stays open."
  - at: '2026-10-06T04:25:46Z'
    actor: {role: executor, session: t011-2026-10-06}
    kind: repair_attempted
    note: "T-011 proved the conversions independently (docs/ASTRAEUS_SPIKE_02.md 7.2; tools/validate/conversion-proof.mjs; docs/evidence/conversion-proof.json). A-33 conversion verified (0.15 km, round trip 1e-6). A-32 lunar frame, radius and Moon ephemeris verified against JPL Horizons DE441 (sub-Earth point 0.002 deg, Moon 9 km). Defect found in the heading reference: the printed Moon-referenced FPA and heading are measured against Earth-equatorial north, not lunar north. Under that reading 14 lunar-orbit anchors agree with one orbit plane to 0.6 deg (lunar north: scatter of 13 to 27 deg), A-10>A-11 velocity miss falls 940.6 to 12.8 m/s, and A-32>A-33 falls 25,031 to about 210 km / 3.5 m/s. Change proposed, not applied (owner decision). Leads: printed headings of A-15, A-27, A-29, A-30 do not fit the plane; A-29/A-30 would fit as -112.56/-112.73. Issue stays open."
  - at: '2026-10-06T05:35:00Z'
    actor: {role: executor, session: o002-recheck-2026-10-06}
    kind: repair_attempted
    note: "T-013 applied the T-011 heading-reference change (owner decision 2026-10-06) and integrated coasts with Earth J2, Moon and Sun. Reconstruction raw misses: A-32>A-33 212.6 km / 3.5 m/s (was 25,125 km), A-34>A-35 38.4 km / 55.6 m/s (was 15,344 km), A-10>A-11 16.8 km / 12.8 m/s. These match the independent anchor-consistency audit. The causal wording in the spike note (7, 7.1-7.3, 13, 14), Design.md, the provenance accuracy text and the report was updated in T-009. The residual ~210 km at A-33 and the off-plane headings of A-15, A-27, A-29, A-30 remain unexplained (see also I-007). Not verified by a Check."
  - at: '2026-10-06T05:36:39Z'
    actor: {role: checker, session: check-t009-recheck-2026-10-06}
    kind: rechecked
    note: "Task re-check C-003 (CLEAR). An independent RK4 (Earth J2, Moon, Sun; checker constants and basis code) reproduces A-10>A-11 16.8 km / 12.8 m/s, A-32>A-33 212.6 km / 3.5 m/s and A-34>A-35 38.4 km / 55.6 m/s at 10 s and 5 s steps. The EQJ-north velocity rebuild matches the stored native states to 0 m/s. Wording in the note (7, 7.3, 13, 14.1), Design.md, I-003, provenance accuracy and the report no longer attributes the misses to unmodelled gravity, and names the residual as unexplained."
    check: C-003
---

# I-006: Largest return-coast misses are not explained by unmodelled perturbations

## Summary

`docs/ASTRAEUS_SPIKE_02.md` section 7 ("These come from ignoring lunar, solar and oblateness perturbation and unmodelled burns"), the generated provenance `accuracy` text, `.savepoint/Design.md` Current Technical State ("because coasts are unperturbed two-body or patched two-body") and I-003's Summary all attribute the propagated misses to the simple dynamics. Spike 03 recommendation 1 builds on that attribution.

An independent propagation with Earth, Moon and Sun point masses plus Earth J2 does not support it for the two largest misses. The translunar control case does collapse, which validates the probe:

| Segment | Two-body miss | Earth+Moon+Sun+J2 miss |
|---|---|---|
| A-10>A-11 (translunar, control) | 10,945 km | **16.7 km** |
| A-08>A-09 | 121 km | 114 km |
| A-32>A-33 (TEI → MCC-5) | 25,125 km (patched) | **25,031 km / 425 m/s** |
| A-34>A-35 (MCC-5 → CM/SM sep) | 44,194 km / 10,951 m/s | **37,893 km / 10,831 m/s** |

No burn occurred between A-34 and A-35 (MCC-6 and MCC-7 were cancelled), so under realistic dynamics the anchors should nearly connect. The n-body path from A-34 passes within 871 km of the A-35 position about 96 min before the A-35 time, which points to an inconsistency in the return-phase anchor data, its time tags or its conversion (A-32…A-35), not to dynamics. The precedent is I-002: transcription errors in A-06…A-08 produced misses up to 164,274 km that fell to about 120 km once corrected. The report's anchor-consistency check covers only the Earth anchors up to A-09, so the return phase has never been consistency-checked.

## Evidence

- Probe harness (checker scratch, re-creatable): loads `src/core/astronomyAdapter.ts` and the `earthCentred` states from `data/apollo11/normalised/anchors.json`. It integrates a geocentric RK4 with a 10 s step (5 s for A-10/A-32) with μE 398600.4418, μM 4902.8001, μS 1.32712440018e11 km³/s², J2 1.08263e-3 about EQJ z, the Moon and Sun third-body direct and indirect terms from the Astraeus adapter, and compares with the next anchor's `earthCentred` state.
- Backward n-body A-35→A-34 misses A-34 by 2,120 km / 93 m/s, against a print-rounding effect at A-34 of 38.9 km / 0.20 m/s.
- Raw values: `data/apollo11/raw/anchors.json` A-32…A-36 (Table 7-II p. 7-9; A-36 Table 7-VII).

## Proof Needed

1. Either identify the cause (re-verify A-32…A-35 against MSC-00171 Table 7-II, the GET tags and the Moon-referenced A-32 conversion; extend the anchor-consistency check to the return phase), or state plainly that the two largest misses are **unexplained** and possibly reflect source or conversion inconsistency.
2. Correct the causal wording in `docs/ASTRAEUS_SPIKE_02.md` section 7 and 14.1, in the provenance `accuracy` text (via the tool and a re-run), in `.savepoint/Design.md`, and in I-003.
3. Re-run `npm run apollo11:reconstruct` (byte-identical unless data changes) and the configured gates.

## Return-Phase Audit (T-009 rework)

Executor evidence only, not verification. Full write-up: `docs/ASTRAEUS_SPIKE_02.md` 7.1. Reproduce with `node tools/validate/anchor-consistency.mjs`, which writes `docs/evidence/anchor-consistency.json`. The probe reproduces the C-002 table exactly.

- **Primary source re-read** (NTRS scan of MSC-00171: Table 7-II p. 7-9, Table 7-I p. 7-8, Table 7-VI p. 7-11, Table 3-I). The GET values for A-33 and A-35 are confirmed by Tables 3-I and 7-VI. The A-34 GET cell appears to read "…7.4" rather than "08.6"; Table 7-VI's ignition time plus its 11.2 s firing supports 08.6, and a difference of 1.2 s or less is immaterial. Every legible latitude, longitude, altitude, FPA and heading digit for A-32 to A-35 matches the raw file. The hundreds digit of the A-33 and A-34 speeds is illegible. Units, reference bodies and the space-fixed angle definitions match the tool. Conversion round-trip error is under 1e-6 km.
- **A-34>A-35: suspected transcription defect, unconfirmed.** As printed, A-33 and A-34 never reach entry interface. With A-34 at 4 074.0 ft/s, the miss to A-35 is 38 km / 56 m/s (print rounding 39 km), and the path reaches entry at 195:03:08.6, 3.18°S 171.97°E, −6.48°, against Table 7-VI's 195:03:08, 3.17°S 171.99°E, −6.46°. With A-33 at 4 075.0 ft/s, the path grazes at a 125 km perigee near 195:06, consistent with Table 7-VI's −0.70° post-TEI prediction. The scan cannot confirm the digit, so nothing was applied. Owner decision: adopt it as an inferred override (as for A-05), or seek a second source.
- **A-32>A-33: unexplained.** Moon-referenced velocity direction is suspect. The n-body arrival at A-11 matches the printed position, speed and FPA, but gives heading −84.6° against the printed −62.8°, and A-30>A-31 misses by 200 km / 1,737 m/s. Measuring Moon-referenced FPA and heading against Earth's north reduces the A-11 velocity miss from 940 to 13 m/s and A-32>A-33 from 25,031 to 213 km. However, it fails Table 7-VI's post-TEI entry check and A-30>A-31, and Table 7-I does not support it. It is a lead only.
- **Rendered jump near GET 150:30:** Columbia samples 1313→1314 (150:29:56.4 → 150:29:57.4), the A-32>A-33 discontinuity of 25,125 km / 434 m/s. The source state is A-33 (Table 7-II, "Second midcourse correction Ignition").
