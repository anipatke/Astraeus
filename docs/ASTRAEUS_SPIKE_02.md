# Astraeus Spike 02 — Design note

Status: implemented and validated by the executor on 2026-10-06 (T-009), revised after Task Check C-002 returned NEEDS WORK (I-006: miss attribution corrected, return-phase audit in 7.1), then updated for T-010 (A-33/A-34 speed overrides), T-011 (conversion proof, 7.2), T-012 (anchor labels), T-013 (Earth-north heading reference, Earth+Moon+Sun coasts and smoothed joins, 7.3) and T-015 (physical burns and cutoff residuals, 7.4). This is evidence for the owner and for the independent Full Objective Check; it is not a Check and claims no `CLEAR`. Requirement record: [`ASTRAEUS_SPIKE_02_BRIEF.md`](ASTRAEUS_SPIKE_02_BRIEF.md). Sources and conventions: [`APOLLO11_SOURCES.md`](APOLLO11_SOURCES.md). Generated validation report: [`APOLLO11_RECONSTRUCTION.md`](APOLLO11_RECONSTRUCTION.md). Browser evidence: [`evidence/spike02-browser.json`](evidence/spike02-browser.json) and `evidence/spike02/*.png`.

The scene presents an **Apollo 11 educational trajectory reconstruction based on NASA postflight trajectory data**. It is not the exact flight path, and nothing between NASA anchors is claimed to be accurate (see 7 and 13).

## What was proven

```text
absolute UTC time → SampledTrajectory.stateAt → State (EQJ, km, Earth centre) → ScalePolicy → floating origin → render axes → Three.js
```

A reconstructed spacecraft fits the same `Trajectory → State` contract as the Moon. Every stage after `State` was reused without modification. Deleting the word "apollo" (case-insensitive) from `src/core/` changes nothing, because it does not appear there: `grep -rni apollo src/core` returns no lines. The only mission-flavoured word in core is one doc comment saying a body may be "a spacecraft" (`src/core/body.ts:4`), which is generic.

## 1. Source research

Primary data is the *Apollo 11 Mission Report* (MSC-00171 / SP-238, NTRS 19700008096): Table 7-II (trajectory parameters), Table 7-VII (entry), Table 5-IV (landing), Table 3-I (sequence of events). Cross-checks use the Apollo Flight Journal and two Bennett descent/ascent papers. The full hierarchy, retrieval record and extraction method are in `APOLLO11_SOURCES.md` sections 2–3. Anchor values were typed by hand from the scanned tables with a page/table citation per value in `data/apollo11/raw/`. Transcription defects were found and are tracked (I-002, I-007; see 13). The range-zero constant in `APOLLO11_SOURCES.md` was wrong and is corrected (I-001).

## 2. Why no complete as-flown public trajectory dataset was used

None was found to exist as a public, citable, licence-clear source. NASA publishes sparse postflight anchor states (about 40 here), not a second-by-second as-flown state vector file. Fabricating a smooth path would present invented data as measurement, so the pipeline uses only the published anchors and says where it fills the gaps. The 2022 NASA powered-descent reconstruction was reviewed and not used (`APOLLO11_SOURCES.md` section 3): its time and coordinate conventions were not documentable enough for this spike, so descent is a two-anchor arc flagged in provenance.

## 3. Authoritative NASA anchors

40 anchor/vehicle rows: 27 for Columbia (A-01 TLI ignition to A-36 entry interface) and 13 for Eagle (undocking, DOI, PDI, touchdown, lift-off, ascent insertion, CSI, TPI, docking). The table with GET, event, per-anchor residual and print-rounding limits is in `APOLLO11_RECONSTRUCTION.md`. The sampled window runs from Earth orbit insertion to entry interface; launch and splashdown are events only. Eagle runs from undocking to docking.

## 4. Reconstruction method

Deterministic offline Node pipeline (`npm run apollo11:reconstruct`, `tools/apollo11/`). Per segment:

| Segment | Method |
|---|---|
| Parking orbit | Integrated backward from A-01 with the coast dynamics (no NASA anchor earlier) |
| Coast (including Earth ↔ Moon) | RK4, 10 s step, Earth-centred EQJ: Earth point mass + J2, Moon and Sun third bodies from the Astraeus adapter. Integrated forward from the earlier anchor and backward from the later one, then smoothed (below) |
| Ordinary burns | RK4 integration from ignition with Earth J2, Moon and Sun gravity plus a constant EQJ acceleration fitted to cutoff velocity; cutoff residuals and peak speeds are published |
| Powered descent / ascent | Two-anchor cubic Hermite in the Moon-fixed frame |
| Surface stay | Touchdown site held fixed in the Moon-fixed frame (IAU rotation model) |

Every non-cutoff anchor is met to 1e-6 km and 1e-6 m/s. Ordinary burns start at their ignition anchors and fit a constant inertial acceleration so integrated velocity reaches the cutoff velocity; remaining position and velocity residuals are published. A coast after a burn starts at its modelled cutoff state, then blends toward a backward propagation from the next anchor. Other coasts start at their converted anchor. Each coast's **raw miss** (`rawMissKm`/`rawMissMs`) and largest smoothing correction (`maxCorrectionKm`/`maxCorrectionMs`) are published, and `discontinuities` is empty. Smoothing is a presentation repair, not physics. Powered descent, surface hold and powered ascent retain their earlier methods and output. Three owner-approved inferred overrides exist: A-05 flight-path angle 44.94° → 49.94° (probable source typo), and A-33/A-34 speed 4 375.0 / 4 374.0 → 4 075.0 / 4 074.0 ft/s (illegible hundreds digit; T-010, see 7.1). Raw values are unchanged.

## 5. Coordinate and frame conversions

Runtime samples are Earth-centred EQJ kilometres. Earth-fixed anchors use the Fischer 1960 ellipsoid and Orb's ECEF→EQJ transform; Moon-fixed anchor positions use the IAU WGCCRE lunar rotation on a 1,738.09 km sphere. Moon-referenced flight-path angle and heading are applied against Earth-equatorial (EQJ, J2000) north, not lunar north: the source does not say which north it means, and only this reading makes the lunar-orbit anchors consistent (7.2; owner decision, T-013). Moon-relative states are normalised by adding the Astraeus Moon state at the same instant. GET → UTC uses range zero 1969-07-16T13:32:00Z (−14552880000 ms; the constant in `APOLLO11_SOURCES.md` was corrected under I-001; the tool asserts it against `events.json`). Time is UTC; TT−UTC is taken as 39.7 s for the lunar rotation. Details: `APOLLO11_SOURCES.md` section 4.

## 6. Sample density and interpolation

Interval per segment is the largest value on a fixed ladder whose cubic Hermite error at held-out midpoints is at most 0.25 km. Columbia has 2,244 samples and Eagle 107. **Measured** maximum interpolation error is 0.1997 km (target ≤ 0.25 km). Short burns collapse to a single sample. Runtime uses cubic Hermite with velocity.

## 7. Validation results

Re-run on final integrated code on 2026-10-06 after T-015: `npm run apollo11:reconstruct` run twice gave byte-identical generated outputs; T-015 records the per-file hashes.

- **Anchor residuals:** all 40 non-cutoff anchors remain within 1e-6 km and 1e-6 m/s. The 12 burn cutoff position residuals are 0.191–454.706 km; the fitted velocity residuals are at most 0.000001 m/s. The largest position residual is TLI A-01>A-02. This confirms the conversion and sampling pipeline, not the physical accuracy of the path.
- **Raw misses at the next anchor** (before smoothing; no threshold applied): after T-015, A-02>A-03 is a 10-second coast with a 463.219 km / 101.575 m/s raw miss. It starts from the modelled TLI cutoff, which is 454.706 km from the printed A-02 cutoff; the report lists its 463.219 km / 69,263.426 m/s maximum smoothing correction. Other highlighted results are A-10>A-11 at 17.987 km / 8.624 m/s, A-32>A-33 at 626.664 km / 12.604 m/s and A-34>A-35 at 66.704 km / 67.741 m/s. Lunar-orbit coasts still show timing and model differences; every coast residual and correction is in the generated report. The short post-TLI correction is visible in the record and remains a limitation for planner review.
- **Qualitative checks:** departure angle from the Moon's arrival direction 155.92°; the path enters the Moon's sphere of influence at 1969-07-19T02:45:33Z; lunar-orbit altitude 105.5–321.8 km against the time-matched Moon; the path is at 121.86 km altitude at the entry-interface anchor time, which is the 400,000 ft crossing (it ends on A-36 by construction).
- **Published lunar-orbit cross-check:** LOI-1 apsides 169.8 × 60.0 n mi against 169.7 × 60. Others differ by a few n mi; A-19 and A-26 differ more and the published values recorded there look doubtful.
- **Landing site versus runtime Moon orientation:** the IAU-placed site is **254 km (8.4°)** from the same selenographic coordinates on the runtime tidal-lock Moon at touchdown and 275 km (9.1°) at lift-off. This is larger than the 1–2° anticipated because the runtime orientation has no libration. The Moon was deliberately not altered to hide it.
- **Tests:** 123 pass in 7 files (`tests/sampledTrajectory.test.ts`, `apollo11Reconstruction.test.ts` 26, `missionScene.test.ts`, plus the 58 Spike 01 tests unmodified).

### 7.1 Return-phase anchor audit (I-006)

One focused pass over A-32 to A-35, done after Task Check C-002. It is kept as the record of that pass; finding 2 was later resolved by 7.2 and applied in T-013 (7.3). Numbers in this section describe the data before T-013. Script: `node tools/validate/anchor-consistency.mjs`; output: [`evidence/anchor-consistency.json`](evidence/anchor-consistency.json). It is diagnostic only: it reads the normalised anchors and changes no data. Dynamics: geocentric RK4 with a 10 s step, Earth J2, and Moon and Sun third-body terms from the Astraeus adapter. It reproduces C-002's figures exactly.

**What was re-checked against the primary source.** Table 7-II (MSC-00171 p. 7-9) was re-read from the NTRS scan, and Tables 7-I, 7-VI, 7-VII and 3-I were used as cross-checks.

- *GET:* Table 3-I and Table 7-VI confirm A-33 150:29:57.4, A-35 194:49:12.7 and A-31 135:23:42.3. The A-34 cell on the scan appears to end in "7.4", not the transcribed "08.6". Table 7-VI gives ignition 150:29:57.4 plus an 11.2 s firing, which is 150:30:08.6 and agrees with the transcription. The difference is at most 1.2 s, about 2 km at that range, so it does not matter here.
- *Latitude, longitude, altitude, flight-path angle, heading:* every legible digit for A-32 to A-35 matches `data/apollo11/raw/anchors.json`.
- *Velocity:* the hundreds digit of A-33 and A-34 is **illegible** on the scan ("4 ?75.0", "4 ?74.0"). The transcription reads it as 3.
- *Reference body, units, signs:* the reference bodies match. "Miles" are nautical miles and velocity is in ft/s. Angles are space-fixed: FPA is positive up, and heading is measured east of north in the body-centred horizontal plane (Table 7-I). These all match the tool.
- *Conversion to EQJ:* rebuilding each anchor from its inputs with the tool's own conversion reproduces the normalised state within 1e-6 km.

**Findings.** Raw values and the conversion code are unchanged. Finding 1 was later adopted by the owner as an inferred override (T-010).

1. **A-33/A-34 inertial speed (candidate transcription defect, not confirmed).** Propagated as printed, A-33 and A-34 never reach entry interface (perigee 870–973 km near 193:31 GET). A-35 does reach it (195:03:12.7, −6.12°). If the illegible digit is read as 0 (A-34 = 4 074.0 ft/s), A-34 meets A-35 within 38 km / 56 m/s, which is inside A-34's 39 km print-rounding limit. It also reaches entry at 195:03:08.6, 3.18°S 171.97°E, −6.48°, against Table 7-VI's predicted 195:03:08, 3.17°S 171.99°E, −6.46° after MCC-5. A-33 at 4 075.0 grazes at a 125 km perigee near 195:06, consistent with Table 7-VI's shallow −0.70° entry predicted after TEI. This strongly suggests the hundreds digit is 0, as in the I-002 precedent. The scan cannot confirm it. The owner reports that *Apollo by the Numbers* (NASA SP-4029) gives 4,075.0 ft/s for the MCC-5 ignition (not retrieved by the executor). The owner approved 4 075.0/4 074.0 as inferred overrides (T-010). After the correction, the audit's reconstructed A-34>A-35 is 38 km / 56 m/s, while the reconstruction's own two-body coast still misses A-35 by 15,344 km because it omits the Moon and Sun.
2. **A-32>A-33 is unexplained.** No single legible input of A-32 explains the miss. Separately, the Moon-referenced velocity direction looks suspect. Arriving at A-11 from A-10 reproduces the printed latitude, longitude, altitude, speed and FPA, but gives heading −84.6° against the printed −62.8°. The lunar-orbit coast A-30>A-31 also misses by 200 km / 1,737 m/s. One interpretation that the source does not state, that Moon-referenced FPA and heading are measured against Earth's north, reduces the A-11 velocity miss from 940 to 13 m/s and A-32>A-33 from 25,031 to 213 km. At the time of this pass it looked like a lead only, because it neither reproduced Table 7-VI's post-TEI entry conditions nor closed A-30>A-31. Section 7.2 tested it properly and found it holds; 7.2 explains why those two checks do not refute it.

**Where the visible jump is.** Playing through about GET 150:30 shows the A-32>A-33 step. Columbia samples 1313 (150:29:56.4, end of the TEI-to-MCC-5 coast propagated from A-32) and 1314 (150:29:57.4, A-33 itself) are 25,125 km / 434 m/s apart. The source state is A-33, "Second midcourse correction Ignition", Table 7-II p. 7-9. From A-34 (150:30:08.6) onward the samples are continuous until the A-34>A-35 step at 194:49:12.7 (15,344 km after the T-010 correction). Because the readout updates once per frame, at high playback rates the jump can appear a frame or more after 150:29:57; at 1,000× one frame is roughly 100 s of mission time. Since T-013 the path is continuous at both places (7.3).

### 7.2 Conversion proof for A-32 and A-33 (T-011, I-006)

Decision note. Script: `node tools/validate/conversion-proof.mjs`; output: [`evidence/conversion-proof.json`](evidence/conversion-proof.json); second ephemeris: [`evidence/conversion-proof-horizons.json`](evidence/conversion-proof-horizons.json) (JPL Horizons, DE441, equatorial ICRF vectors and sub-Earth points, retrieved 2026-10-06). Diagnostic only. Every conversion below was checked on its own, with code written for the proof and not shared with `tools/apollo11/frames.ts` or the adapter, before any propagation was run. Raw values, the dynamics, the runtime and the conversion code are unchanged.

**Conclusion.** The A-33 conversion is correct. A-32's position conversion is correct, including the lunar frame, the radius and the Moon's ephemeris. The defect is in A-32's **velocity**: the tool measures flight-path angle and heading against *lunar* north, but the printed Moon-referenced angles are measured against *Earth-equatorial (inertial) north*. Reading them that way brings the A-32>A-33 miss from 25,031 km to about 210 km. The change was proposed here and **applied in T-013** after owner approval (7.3).

| Step | Check | Result |
|---|---|---|
| A-33 position | Fischer ellipsoid by the meridian-ellipse form; Earth-fixed to EQJ by IAU 1982 GMST, nutation and IAU 1976 precession | 0.15 km from the tool at a 319,527 km radius; the rotation differs by 0.098″ (1″ is 1.5 km here) |
| A-33 velocity | ENU basis from cross products; inverse by Bowring's method; round trip to the printed parameters | 0.0006 m/s from the tool; round trip within 2.4e-5°, 3e-6 km and 1e-6 ft/s. A-34 is the same |
| A-32 (a) lunar frame | Orientation rebuilt from basis vectors; sub-Earth selenographic point compared with Horizons | Matrix identical to the code. Sub-Earth point 3.575°N 7.491°W against Horizons 3.574°N 7.490°W (A-11: 0.076°N 6.440°W against 0.074°N 6.438°W), so the IAU frame matches DE441 libration to 0.002°. Without the libration series the state moves 10 km / 68 m/s; principal axes instead of mean-Earth axes move it 0.9 km / 0.7 m/s |
| A-32 (b) radius, latitude | 1737.4 km and 1738.0 km against 1738.09 km | 0.69 km and 0.09 km, no velocity effect |
| A-32 (c) local basis | Lunar pole against EQJ pole as north; printed velocity read as Moon-fixed | The two poles are 21.9° apart. Switching to EQJ north changes A-32's velocity by 984 m/s. Reading it as Moon-fixed changes it by 4.9 m/s |
| A-32 (d) Moon state | Astraeus adapter against Horizons at A-32, A-31, A-11 | 9.0 km / 0.07 m/s (4.8″) at A-32 and A-31; 3.0 km at A-11. Using Horizons moves A-32 by the same amount |

An early draft of the Horizons fetch used the default ecliptic plane and appeared to show a 10° Moon error. That was the fetch, not the adapter: the equatorial vectors agree, and so does Horizons' own RA/Dec table (A-32 203.016°, −12.631°, matching the adapter within 0.002°).

**Why the heading reference is the defect.** Within one coast the orbit plane is fixed in inertial space, so r × v from each anchor must point the same way.

- With lunar north, the orbit normals of the docked 60 nmi orbit scatter by 13° and the inclination to the lunar equator reads 12° to 27°. With EQJ north, A-12 to A-14, A-16 to A-26 and A-28 all give a normal at RA 90.6°, Dec −66.6° and an inclination of 1.0° to 2.0°. Apollo 11's lunar orbit was nearly equatorial.
- Taking that plane, the heading each anchor would need is within 0.6° of the printed value for 14 anchors (A-12 to A-14 and A-16 to A-26 except A-15; for example A-16 −106.81° against −106.99°, A-24 −93.42° against −93.16°).
- Dynamics agree. A-10>A-11 velocity miss falls from 940.6 to 12.8 m/s (position 16.8 km, unchanged). A-32>A-33 falls from 25,031 km / 412 m/s to 212.6 km / 3.5 m/s with J2000 north, 208.6 km with the 1969 mean pole and 207.5 km with the B1950 pole. The three poles cannot be told apart by this data.
- No lunar-frame variant, radius or Moon-fixed reading moves the A-32>A-33 miss below 24,900 km.

**The propagated miss under the proven conversions** is 25,031 km / 412 m/s with the audit dynamics (the reconstruction's own patched step shows 25,125 km / 434 m/s). The conversions are not the cause of the miss as the tool computes it, but the *convention* the tool applies to A-32 is.

**Primary source.** Table 7-II defines heading as the angle of the inertial velocity's projection on the "local body-centered, horizontal plane, measured positive eastward from north". It does not say which north applies at the Moon. The reading above is therefore demonstrated by the data's internal consistency and by propagation, not by a printed definition. That is why the change is only proposed.

**Change (applied in T-013).** For Moon-referenced, non-surface anchors, the velocity is built from an EQJ-north local basis (east = unit(ẑ × r̂), north = r̂ × east) instead of the selenographic basis; the position conversion is unchanged (`inertialNorthAxes` in `tools/apollo11/frames.ts`, used by `nativeState`). The J2000 pole is used; the others differ by under 5 km at A-33.

**What this does not explain.**

- The remaining 210 km / 3.5 m/s at A-33. Print rounding at A-32 accounts for about 0.5 m/s.
- Entry conditions from A-32 under the new reading (194:59:23.7, 8.85°S 166.13°E, −10.89°) do not match Table 7-VI's −0.70°. This check is hypersensitive: 3.5 m/s over about 45 h moves perigee by hundreds of km, while A-33 itself (with the T-010 override) grazes at a 125 km perigee. It neither supports nor refutes the reading.
- Four anchors do not fit the plane under either north: A-15 (printed −89.13°, plane-implied −74.58°), A-27 (−97.63°, −87.38°), A-29 (−52.56°, −113.07°) and A-30 (−52.73°, −113.08°). A-29/A-30 would agree to within 0.5° if the printed values were −112.56° and −112.73°; A-27 would if it were −87.63°. These are transcription leads only, not read against the scan. A-30>A-31 stays at about 200–290 km / 1,740 m/s under either reading, consistent with A-30 being one of them.
- A-11, A-31 and A-32 sit 4° to 5° from the 60 nmi plane. A-11 is the pre-burn approach and A-31/A-32 are TEI; the offset is not diagnosed here.
- `docs/APOLLO11_SOURCES.md` 4.1 gave the range-zero constant as −14581680000 ms (05:32 UTC); it now gives −14552880000 ms (13:32 UTC), as the code always used (I-001).

### 7.3 Heading reference, full gravity and smoothed joins (T-013)

Owner decision 2026-10-06, after the O-002 recheck found visible jumps at lunar orbit insertion and in lunar orbit: adopt the Earth-north heading reference, integrate coasts with Earth (J2), Moon and Sun, and smooth what remains openly. Implementation: `tools/apollo11/dynamics.ts`, `segments.ts`, `frames.ts`; evidence in T-013 and the generated report.

| Coast | Before T-013 (step) | Raw miss after | Smoothing correction |
|---|---|---|---|
| A-10>A-11 LOI approach | 6,274 km / 1,575 m/s | 16.8 km / 12.8 m/s | 40 km / 13 m/s |
| A-12>A-13 lunar orbit | 635 km / 499 m/s | 616 km / 556 m/s | 624 km / 556 m/s |
| A-17>A-27 lunar orbit | 1,353 km / 1,128 m/s | 1,273 km / 1,141 m/s | 1,287 km / 1,141 m/s |
| A-30>A-31 lunar orbit | 200 km / 1,737 m/s | 290 km / 1,745 m/s | 1,959 km / 1,745 m/s |
| A-32>A-33 TEI to MCC-5 | 25,125 km / 418 m/s | 212.6 km / 3.5 m/s | 213 km / 6 m/s |
| A-34>A-35 return | 15,344 km / 10,743 m/s | 38.4 km / 55.6 m/s | 800 km / 56 m/s |

- Halving the integration step to 5 s changes no raw miss or correction at the published 0.001 precision.
- The independent audit script (`anchor-consistency.mjs`) gives the same raw misses as the tool for A-10>A-11, A-32>A-33, A-34>A-35 and A-35>A-36.
- Lunar-orbit coasts keep large raw misses, mostly timing. Coasts touching A-15, A-27, A-29 or A-30 (printed headings off the orbit plane) and A-02>A-03 (10 s apart, 69 km apart) need the largest corrections; the report's "Known gaps" names every coast over 100 km or 50 m/s.
- At the T-013 checkpoint, the one-second scan found no step but identified the old Hermite A-13>A-14 peak of 58 km/s. T-015 replaced that burn method; the current scan and burn results are recorded in 7.4.


### 7.4 Physical burns and cutoff residuals (T-015)

All 12 configured `poweredPairs` use an offline RK4 burn segment from the ignition state. The integrator uses the existing Earth J2, Moon and Sun gravity and fits one constant EQJ acceleration so the cutoff velocity is reached. Burn peaks are measured through the runtime `SampledTrajectory` every 100 ms in the burn's reference body. A-13>A-14 peaks at 1.669 km/s relative to the Moon; A-09>A-10 peaks at 1.532 km/s Earth-centred. Each burn's peak, fitted acceleration and cutoff position/velocity residual are in `APOLLO11_RECONSTRUCTION.md` and the generated JSON.

The cutoff state is not forced onto the printed cutoff position. The next coast receives that modelled state through a generic start-state input, then smooths toward its next anchor. The 12 cutoff position residuals range from 0.191 to 454.706 km; velocity residuals are at most 0.000001 m/s. Every non-cutoff anchor remains within 1e-6 km / 1e-6 m/s. Columbia's 701,486 one-second runtime windows and Eagle's 100,260 windows produced zero intervals whose move exceeded the maximum Earth-centred speed sampled at the interval start, midpoint and end (1 m tolerance). Position and velocity use one shared sample at each join, and generated `discontinuities` remains empty.

The largest cutoff residual is A-01>A-02 at 454.706 km. The following A-02>A-03 coast lasts 10 seconds and reports a 463.219 km raw miss and 69,263.426 m/s maximum velocity smoothing correction. This consequence is exposed in the generated report and remains a limitation for planner review; the task does not alter anchors or add guidance. Tests pin the unchanged special descent, surface-hold and ascent methods and sampled output.

## 8. Provenance model

`Provenance { sourceType: ephemeris | observed | reconstructed | illustrative, sources, accuracy, notes }`, attached to a Trajectory and never read by State computation. Both vehicles carry `reconstructed` with the sources, an accuracy statement (raw misses published, joins smoothed and how, Earth-north heading reference adopted from data, overrides, "not navigation grade"), and a notes line saying it is not the exact flight path. Anchors are separate from samples in each generated file and drawn as white dots against coloured lines.

## 9. Generic Astraeus changes

See the review table below. In short: `BodyId` is now any string (natural centres stay a closed `CenterId`), `Trajectory` gained optional `bounds`, and `SampledTrajectory`, `Provenance` and `TimelineEvent` were added. Scene-side: tracked-body placement, path split at the current time, marker, generic camera focus/follow/overview, event jump and extra rates.

## 10. Apollo-specific implementation

Only `tools/apollo11/` (reconstruction), `data/apollo11/` (anchors, samples, events) and `src/mission/apollo11.ts` (data import, labels, the required wording, rates, window) name the mission. `src/app/` takes a generic `MissionConfig`, so scene, camera, scale and floating-origin code contain no mission names.

## 11. ScalePolicy and floating-origin findings

Browser evidence was re-run on the final code (after T-010, T-012 and T-013) on 2026-10-06: `docs/evidence/spike02-browser.json` and `evidence/spike02/*.png`.

- **ScalePolicy:** UNCHANGED and sufficient. In the browser run the Columbia/Eagle range and speed readouts at six mission times were identical under TrueScale and ReadableScale (`scalePairsIdentical`: all true), and unit tests assert scale independence. ReadableScale compresses distance by 0.1 but not radii, so near Earth or Moon the spacecraft sits inside the bodies' spheres; spacecraft overlays therefore render in a final pass and depth-test only under TrueScale. That is a presentation workaround, not a scale-policy change, and the owner may want another treatment (see 12).
- **Floating origin:** UNCHANGED. No reproducible problem was found. Browser: no console errors across the full scripted run; following Columbia at 100× through 30 samples over lunar-orbit time gave smooth, monotone range (390,554 → 391,812 km, largest step 77 km) with no jump. The anchor-label toggle (T-012) re-ran with 0 errors and hides its layer when switched off. T-008 recorded follow-mode marker centroid within about 0.1 px of screen centre in steady frames. Floating-origin independence of State is unit-tested.
- Focus and follow switches at a fixed time left every scientific readout identical (`focusUnchanged: true`).

## 12. Storytelling lessons

- An Earth-centred path of a lunar orbiter loops and zig-zags because the Moon moves under it; this is truthful but is a poor story view. Spike 03 should offer a Moon-relative view as a camera/presentation choice without changing runtime State.
- ReadableScale needs spacecraft-aware presentation (radius treatment) rather than the overlay pass.
- Event jumps and bounded visibility worked well: the 30 events land exactly on their times, and out-of-bounds vehicles simply vanish.
- Uncertainty is part of the story. The joins are now smoothed for viewing, so a viewer no longer sees where the data disagree. Spike 03 could show the published raw miss or the correction size near each anchor (the anchor labels from T-012 are a start).
- The debug overlay and mission panel cover a large part of the canvas on a 1280×800 viewport.

## 13. Limitations

- **No accuracy claim between anchors.** Raw misses of up to 1,273 km (lunar orbit) are published and then smoothed for display. Smoothing removes the visible steps but does not make the path more accurate; where the correction is large (up to 1,959 km on A-30>A-31) the spacecraft visibly speeds up or slows down along the arc. The Earth-north heading reference is adopted from data consistency, not a printed definition. A-05, A-33 and A-34 depend on owner-approved inferred overrides that the primary scan cannot confirm.
- Columbia's path starts at Earth orbit insertion (GET 00:11:39.3), over the Atlantic east of Bermuda; launch and ascent are events only. The parking orbit has no anchor of its own: it is A-01 integrated about 2.5 h backward, and lands at 33.0°N, 55.5°W, 111 n mi. No published insertion position is in the sources, so that point is unchecked (owner noticed it on 2026-10-06); adding one as a cross-check is a small follow-up.
- Ordinary burns use a constant EQJ acceleration with Earth J2, Moon and Sun gravity; their cutoff velocity fits and residuals are published, but this is not guidance, mass-flow or variable-thrust modelling. A-13>A-14 peaks at 1.669 km/s relative to the Moon and A-09>A-10 peaks at 1.532 km/s Earth-centred. Powered descent and ascent remain two-anchor interpolations.
- The fitted TLI A-01>A-02 cutoff misses the printed position by 454.706 km. The following 10-second A-02>A-03 coast reports a 69,263.426 m/s maximum smoothing velocity correction; this is a documented limitation for planner review, not a new anchor correction.
- The IAU-placed landing site does not sit on the textured Tranquility Base (254 km).
- Anchor values were manually transcribed; A-06 to A-08 were corrected after owner verification (I-002), and the A-05, A-33 and A-34 overrides are inferred, not documentary-confirmed. A-13, A-15, A-27, A-29 and A-30 are further transcription leads, not yet read against the scan (I-007; 7.2).
- Rendering evidence comes from a headless software-GL Chromium; no human has judged visual jitter. `owner_validation` remains required.
- Browser rate measurement is weak and is not evidence of rate accuracy. The method reads a whole-second UTC readout over a 4 s window, with wall time bracketed around clicks on SwiftShader. The executor's first run gave 1× 1.0, 100× 98.9, 1,000× 1,021 and 10,000× 9,881 simulated s per wall s. The independent re-run in C-002 gave 1× **0.54**, 100× 99.98, 1,000× 1,005 and 10,000× 9,943. The final re-run gave 1× 1.004, 100× 99.9, 1,000× 1,004 and 10,000× 10,018. Results at 1× are therefore not reproducible, and no accuracy bound is claimed. The clock is unchanged, unit-tested Spike 01 code. An earlier version of the script read the readout while playing and produced outliers (445 and 4,465 for 1,000× and 10,000× in two runs) from a stale readout; a separate pause-then-read check gave 97.7, 969–987 and 9,752. The outliers were not investigated further, so a rare clock-versus-readout lag is not ruled out.
- The WebGL canvas cannot be read back (no preserved buffer), so evidence is screenshots plus DOM readouts, not pixel statistics.
- The JS bundle is 1.40 MB (417 kB gzip) with the data inlined.
- Moon rotation uses a constant TT−UTC and the IAU mean-Earth frame; the Apollo-era selenographic frame may differ by up to about 1 km.

## 14. Recommendation for Spike 03

1. Fix the remaining anchor data before adding more dynamics. Earth+Moon+Sun gravity and the Earth-north heading reference already closed the three large steps (7.3). What remains is mostly lunar-orbit timing and five suspect printed values (A-13, A-15, A-27, A-29, A-30). Re-read those against the scan, and add a lunar gravity field only if the remaining timing drift matters for the story. For storytelling, keep sparse anchors and show the uncertainty (raw miss or correction size) near each anchor.
2. Add a generic Moon-relative (or any reference-centre) presentation transform for display only, so lunar orbits are readable. Keep runtime State Earth-centred EQJ.
3. Lunar libration in the runtime Moon orientation, if surface positions matter.
4. A second, unrelated sampled source (for example a satellite or probe) to confirm the contract holds beyond a crewed lunar mission.
5. Move mission data out of the JS bundle (fetch or chunk), once the owner accepts runtime fetches.

## Architecture review (brief section 22)

| Item | Class | Notes |
|---|---|---|
| `State` | UNCHANGED | `orientation: null` already covered an unmodelled attitude |
| Frames (EQJ) | UNCHANGED | Earth-centred EQJ km used throughout |
| Reference centres (`referenceCenters.ts`) | UNCHANGED (behaviour); retyped to `CenterId` | Runtime guard `assertCenterId` added; only Earth, Moon, Sun compose |
| `BodyId` / `CenterId` | GENERIC EXTENSION | `BodyId` opened to any string; natural centres stay closed |
| `Trajectory` | GENERIC EXTENSION | Optional `bounds`; ephemeris trajectories unbounded |
| `SampledTrajectory` | GENERIC EXTENSION | New; no mission naming; Hermite/linear; out-of-range error; fresh snapshots |
| Provenance | GENERIC EXTENSION | New small metadata type |
| Events | GENERIC EXTENSION | New `{timeUtcMs, id, label, type?}`; separate from physics |
| `ScalePolicy` | UNCHANGED | Same samples drive both policies |
| Floating origin / render axes | UNCHANGED | No reproducible problem found |
| Path rendering | GENERIC EXTENSION | `mapOrbitPath` accepts a `Pick<…>`; travelled/future split; anchors drawn apart |
| Camera | GENERIC EXTENSION | `FocusId` widened to string; `CameraRequest` focus / follow / overview |
| Timeline | GENERIC EXTENSION | Optional mission window, merged rates, event jump in `DebugControls` |
| Scene overlay pass | GENERIC EXTENSION | Spacecraft markers rendered in a final pass (presentation) |
| `tools/apollo11/`, `data/apollo11/`, `src/mission/apollo11.ts` | MISSION-SPECIFIC | Outside `src/core/` |

No special case for Apollo exists in core. The one exception candidate, `Body.parentId` and `State.center` becoming `CenterId`, is a type tightening of existing behaviour.

## Brief success criteria

| # | Criterion | Evidence |
|---|---|---|
| 1 | Transparent, reproducible reconstruction from NASA data | Byte-identical re-run; sources, method and conventions documented |
| 2 | Anchors and samples distinguishable | Provenance, `anchors` in data files, white dots vs lines (screenshots) |
| 3 | Runtime uses generic `SampledTrajectory` | `src/mission/apollo11.ts` |
| 4 | Same `Trajectory` contract | `SampledTrajectory implements Trajectory`; `MoonTrajectory` unchanged in behaviour |
| 5 | No Apollo coordinate/rendering pipeline | Section 10; scene takes generic `MissionConfig` |
| 6 | Earth-centred EQJ at runtime | Sample file centre `earth`, frame EQJ |
| 7 | Both scales, identical scientific state | Browser `scalePairsIdentical`; scale-independence tests |
| 8 | Follow Earth → Moon → Earth without instability | Browser scenarios at six mission times, 0 console errors; limited to headless software GL (13) |
| 9 | Earth and Moon keep Spike 01 behaviour | 58 prior tests pass unmodified; overlay lit fraction 50.1 %, 0.2 %, 50.1 %, 99.8 % at the four USNO dates 2024-01-04 03:30, 01-11 11:57, 01-18 03:52, 01-25 17:54 UTC, identical to the values recorded in Spike 01 |
| 10 | Events separate from physics | `src/core/events.ts` has no trajectory dependency |
| 11 | Residuals measured and documented | Section 7 and generated report |
| 12 | Little or no mission-specific core change | Review table: generic extensions only |
