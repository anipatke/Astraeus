# Apollo 11 Authoritative Sources and Conventions

> Established for Astraeus Objective O-002 (Task T-005). Grounded strictly in NASA postflight documentation, particularly the *Apollo 11 Mission Report* (MSC-00171 / NASA SP-238).

---

## 1. Executive Summary & Purpose

Astraeus Spike 02 proves that a sampled, reconstructed spacecraft trajectory can implement the same generic `Trajectory → State` contract used for natural celestial bodies in Spike 01, while all downstream systems (ScalePolicy, floating origin, render-axis conversion, Three.js) remain unchanged.

To preserve scientific integrity, Astraeus does **not** simulate an illustrative path or pretend an unbroken second-by-second digital telemetry stream exists. Instead, it extracts factual **anchor states** from authoritative NASA postflight trajectory analyses, settles all geometric, timing, and frame conventions from documentation, and feeds these into a deterministic offline reconstruction pipeline.

This document establishes:
1. The authoritative source hierarchy used and retrieval records.
2. The decision regarding the 2022 NASA powered-descent reconstruction.
3. The exact mathematical and physical conventions (timing, reference radii, ellipsoids, coordinates, heading, flight-path angle, frames, center normalisation).
4. Independent cross-check fixtures for downstream trajectory validation.
5. Known limitations and open assumptions.

---

## 2. Authoritative Source Hierarchy

```
                                  [ NASA Postflight Analysis ]
                                               │
              ┌────────────────────────────────┴────────────────────────────────┐
              ▼                                                                 ▼
   [ Primary Anchor States ]                                       [ Mission Chronology ]
   Apollo 11 Mission Report                                        Apollo 11 Mission Report
   (MSC-00171 / NASA SP-238)                                      (Table 3-I: Sequence of Events)
   Table 7-II: Trajectory Parameters                               Apollo Flight Journal (AFJ)
   Table 7-VII: Entry Parameters                                   NASA SP-4009 Chronology
   Table 5-IV: Landing Coordinates                                              │
              │                                                                 │
              └────────────────────────────────┬────────────────────────────────┘
                                               ▼
                              [ Offline Reconstruction Pipeline ]
                              - Earth-fixed & Moon-fixed -> EQJ
                              - Patch-centered two-body propagation
                              - Offline Astraeus Moon center composition
```

### 2.1 Primary Document Citations

1. **Apollo 11 Mission Report**
   - **Issuing Organization:** NASA Manned Spacecraft Center (Houston, Texas)
   - **Document Identifier:** MSC-00171 / NASA SP-238 / NASA-TM-X-62633
   - **Publication Date:** November 1969 (republished SP-238 in 1971)
   - **NTRS Document ID:** [19700008096](https://ntrs.nasa.gov/citations/19700008096)
   - **Sections Utilized:**
     - **Section 3.0 & Table 3-I (pages 3-4 to 3-5):** "Sequence of Events" (Range Zero, Lift-Off, burns, staging, touchdown, splashdown).
     - **Section 5.1 & Table 5-IV (page 5-10):** "Lunar Landing" (touchdown coordinates and times).
     - **Section 7.0 & Table 7-I (pages 7-1, 7-8):** "Trajectory", "Definition of Trajectory and Orbital Parameters".
     - **Table 7-II (page 7-9):** "Trajectory Parameters" (35 anchor states spanning translunar, lunar orbit, and transearth coast).
     - **Tables 7-III, 7-IV, 7-V, 7-VI (pages 7-10 to 7-11):** Maneuver summaries and cross-check orbital conditions.
     - **Table 7-VII (page 7-12):** "Entry Trajectory Parameters" (Entry Interface anchor state).
   - **Data Extracted:** Raw records saved to `data/apollo11/raw/anchors.json` and `data/apollo11/raw/events.json`.

2. **Apollo 11 Flight Journal (AFJ)**
   - **Curators:** David Woods, Kenneth D. MacTaggart, Frank O'Brien (NASA History Division)
   - **URL:** [https://history.nasa.gov/afj/ap11fj/](https://history.nasa.gov/afj/ap11fj/)
   - **Role:** Verification of ground-elapsed time offsets, mission control timeline context, and public transcripts.

3. **Apollo Experience Report — Mission Planning for Lunar Module Descent and Ascent**
   - **Author:** Floyd V. Bennett (NASA Manned Spacecraft Center)
   - **Document Identifier:** NASA TN D-6846
   - **Publication Date:** June 1972
   - **NTRS Document ID:** [19720019688](https://ntrs.nasa.gov/citations/19720019688)
   - **Role:** Clarification of powered descent phases, landing site targeting, and coordinate conventions.

4. **Apollo Lunar Descent and Ascent Trajectories**
   - **Author:** Floyd V. Bennett (NASA Manned Spacecraft Center)
   - **Document Identifier:** NASA TM X-58040 / AIAA Paper 70-24
   - **Publication Date:** March 1970
   - **NTRS Document ID:** [19700013098](https://ntrs.nasa.gov/citations/19700013098)
   - **Role:** Detailed explanation of the braking, approach, and landing phases and AGC guidance programs (P-63, P-64, P-66).

---

## 3. Decision on the 2022 NASA Powered-Descent Reconstruction

### 3.1 Document Examined
- **Title:** *Reconstruction of the Apollo 11 Moon Landing Final Descent Trajectory*
- **Authors:** Luke J. Miller, Jared A. Grauer, Jing Pei (NASA Langley Research Center), Stewart L. Nelson (Advanced Aircraft Company)
- **Document Identifier:** NASA/TM-20220007267
- **Publication Date:** August 2022
- **NTRS Document ID:** [20220007267](https://ntrs.nasa.gov/citations/20220007267)
- **Distribution:** Publicly released (Public Use Permitted).

### 3.2 Evaluation Against Spike 02 Criteria
The brief specifies:
> "Evaluate NASA's 2022 Apollo 11 powered-descent trajectory reconstruction for a higher-resolution descent segment. Only use it if integration is straightforward and its coordinate/time conventions can be documented confidently."

And Objective O-002 establishes:
> "Powered descent: the 2022 NASA reconstruction is used only if the research Task finds its time/coordinate conventions documentable and integration straightforward; otherwise descent is a documented two-anchor reconstruction flagged in provenance."

### 3.3 Decision: NOT USED
The 2022 NASA powered-descent reconstruction is **NOT** incorporated into the Astraeus Spike 02 trajectory dataset for the following technical reasons:

1. **Dimensionality & Coordinate System Mismatch:**
   NASA/TM-20220007267 does **not** reconstruct a 3D selenocentric or inertial trajectory. It reconstructs a 2D planar longitudinal trajectory (altitude $h(t)$ in feet, downrange distance $x(t)$ in feet to the landing site, and pitch angle $\theta(t)$). It contains no selenographic latitude/longitude or 3D Cartesian coordinates in any astronomical reference frame.
2. **Restricted Temporal Scope:**
   The report covers only the final manual approach and vertical descent phase (~120–180 seconds, beginning at low gate near ~500 ft altitude down to touchdown). It completely excludes the powered descent initiation (PDI) braking phase (from 50,000 ft down to 500 ft, spanning over 10 minutes and ~250 nautical miles downrange).
3. **Tertiary Reconstruction Nature:**
   The authors did not have access to original digital telemetry tapes (which NASA erased and reused in the 1970s/1980s). Instead, they manually digitized low-resolution, blurred graphical plots from Floyd Bennett's 1970 paper (NASA TM X-58040) using the MATLAB GUI tool GRABIT, and then applied a Kalman filter with manually tuned weighting matrices to smooth the digitized samples. The paper itself documents noticeable digitization errors, kinematic inconsistencies in the published figures, and sensor axis ambiguities.
4. **Integration Complexity:**
   Lacking 3D coordinates, embedding this planar slice into the 3D selenocentric EQJ frame would require synthesizing an artificial out-of-plane path, defeating the goal of factual NASA postflight data.
5. **Approved Alternative:**
   Per Objective O-002 confirmed decisions, powered descent will be represented as a documented two-anchor reconstruction (from PDI at GET 102:33:05.1 to touchdown at GET 102:45:39.9) transparently flagged in provenance metadata as `sourceType: reconstructed` with an explanatory note.

---

## 4. Coordinate & Frame Conventions Decided from Sources

All conventions below are pinned from the primary NASA sources and mathematically settled.

### 4.1 Ground Elapsed Time (GET) Zero and UTC Instant
- **Range Zero (T-0):** `1969-07-16T13:32:00.000Z` (13:32:00.0 GMT, July 16, 1969).
  - *Source:* MSC-00171, Table 3-I, page 3-4 ("Range zero - 13:32:00 G.m.t., July 16, 1969").
- **Lift-off:** `GET 00:00:00.6` (13:32:00.6 GMT).
  - *Source:* MSC-00171, Table 3-I, page 3-4 ("Lift-off - 00:00:00.6").
- **Time Conversion Formula:**
  Astraeus represents time as integer UTC Unix milliseconds ($t_{\text{utcMs}}$).
  For any event with printed elapsed time `hr:min:sec.s`:
  $$\Delta t_{\text{sec}} = 3600 \cdot \text{hr} + 60 \cdot \text{min} + \text{sec}$$
  $$t_{\text{utcMs}} = -14552880000 + \text{round}(1000 \cdot \Delta t_{\text{sec}})$$
  Where $-14552880000\text{ ms}$ is the exact UTC Unix millisecond timestamp of `1969-07-16T13:32:00.000Z`. (Corrected 2026-10-06, I-001: an earlier version printed −14581680000, which is 05:32 UTC.)
- **Time-Scale Handling:**
  In 1969, NASA mission control GMT operated on Universal Time. Astraeus Spike 01 utilizes UTC Unix milliseconds matching standard JavaScript `Date.getTime()` resolution. Spike 01's `@lizard-isana/orb` adapter performs UTC-to-TT conversions internally. Across the 8-day mission duration, difference between UTC and UT1 ($DUT1$) was less than 0.1 s, corresponding to negligible spatial displacement ($<45\text{ m}$ at the equator), far below the 1 km anchor tolerance.

### 4.2 Reference Bodies and Ellipsoids

#### Earth Model: Fischer 1960 Ellipsoid
- *Source:* MSC-00171, Section 7.0, page 7-1:
  > "(1) the earth model is a modified seventh-order expansion containing geodetic and gravitational constants representative of the Fischer ellipsoid"
- **Equatorial semi-major axis ($a$):** $6,378,166.0\text{ m} = 6,378.166\text{ km}$ ($20,925,741\text{ ft}$).
- **Flattening ($f$):** $1 / 298.3$.
- **Polar semi-minor axis ($b$):** $b = a(1 - f) \approx 6,356,784.3\text{ m} = 6,356.784\text{ km}$.
- **Second eccentricity squared ($e^2$):** $e^2 = 2f - f^2 \approx 0.00669454$.
- **Note on Spike 01 Volumetric Mean Radius:**
  Astraeus scientific state displays Earth with volumetric mean radius $6,371.0\text{ km}$ (`src/core/body.ts`). For Cartesian anchor reconstruction, the Fischer ellipsoid is used exclusively to evaluate the geodetic surface normal and geodetic altitude.

#### Moon Model: Spherical Moon & Landing Site 2
- *Source:* MSC-00171, Section 7.0, page 7-1 & Table 7-I, page 7-8:
  > "(2) the moon model is a spherical harmonic expansion containing the R2 potential function... altitude above the lunar surface is referenced to Landing Site 2"
- **Reference Radius at Landing Site 2 ($R_{\text{LS2}}$):** $1,738.09\text{ km} = 937.78\text{ n mi} = 5,702,400\text{ ft}$.
- **Nominal Spherical Radius:** $1,738.09\text{ km}$.
- **Note on Spike 01 Volumetric Mean Radius:**
  Astraeus scientific state uses volumetric mean radius $1,737.4\text{ km}$ for the Moon (`src/core/body.ts`). The difference between the Landing Site 2 reference sphere ($1,738.09\text{ km}$) and Spike 01's volumetric mean radius ($1,737.4\text{ km}$) is approximately $0.69\text{ km}$, which is documented in provenance.

### 4.3 Units of Distance
- *Source:* MSC-00171, Table 7-VII, page 7-12:
  Entry Interface is given as $400,000\text{ ft}$ altitude and $65.8\text{ miles}$.
  Calculation:
  $$\frac{400,000\text{ ft}}{6,076.11549\text{ ft/n mi}} = 65.83\text{ n mi}$$
  $$\frac{400,000\text{ ft}}{5,280\text{ ft/mi}} = 75.76\text{ statute miles}$$
- **Settled Definition:**
  All instances of **"miles"** in Table 7-II, Table 7-III, Table 7-IV, Table 7-V, Table 7-VI, and Table 7-VII represent **international nautical miles**:
  $$1\text{ n mi} = 1,852\text{ m} = 1.852\text{ km} = 6,076.11549\text{ ft}$$
  All velocity values in **"ft/sec"** convert to km/s via:
  $$1\text{ ft/sec} = 0.0003048\text{ km/s}$$

### 4.4 Latitude Convention
- *Source:* MSC-00171, Table 7-I, page 7-8.
- **Geodetic Latitude ($\phi_{\text{geod}}$):**
  Measured north or south from the Earth's equator to the local vertical (ellipsoidal normal) vector.
  - North: Positive ($+0^\circ \le \phi \le +90^\circ$).
  - South: Negative ($-90^\circ \le \phi \le -0^\circ$).
- **Selenographic Latitude ($\phi_{\text{sel}}$):**
  Measured north or south from the true lunar equatorial plane to the local vertical vector.
  - North: Positive ($+0^\circ \le \phi \le +90^\circ$).
  - South: Negative ($-90^\circ \le \phi \le -0^\circ$).

### 4.5 Longitude Convention
- *Source:* MSC-00171, Table 7-I, page 7-8.
- Measured east or west from the prime meridian:
  - **East Longitude:** Positive ($+0^\circ \le \lambda \le +180^\circ$).
  - **West Longitude:** Negative ($-180^\circ \le \lambda < 0^\circ$).
- Example conversions:
  - `172.55E` $\rightarrow +172.55^\circ$
  - `165.01W` $\rightarrow -165.01^\circ$
  - `39.39E` $\rightarrow +39.39^\circ$
  - `140.20W` $\rightarrow -140.20^\circ$

### 4.6 Flight-Path Angle ($\gamma$) Definition
- *Source:* MSC-00171, Table 7-I, page 7-8:
  > "Flight-path angle measured positive upward from the body-centered, local horizontal plane to the inertial velocity vector, deg"
- **Sign:**
  - $\gamma > 0$: Velocity vector directed above local horizontal (ascending / climbing).
  - $\gamma = 0$: Velocity vector parallel to local horizontal.
  - $\gamma < 0$: Velocity vector directed below local horizontal (descending).

### 4.7 Heading Angle ($\psi$) Definition
- *Source:* MSC-00171, Table 7-I, page 7-8:
  > "Angle of the projection of the inertial velocity vector onto the local body-centered, horizontal plane, measured positive eastward from north, deg"
- **Sign & Range:**
  Heading angle $\psi$ is an azimuth relative to North:
  - Positive values ($0^\circ \le \psi \le 180^\circ$): Eastward of North (e.g. $+57.78^\circ$ at TLI; $+95.10^\circ$ at CSM separation).
  - Negative values ($-180^\circ \le \psi < 0^\circ$): Westward of North (e.g. $-62.80^\circ$ at LOI; $-106.99^\circ$ during retrograde lunar orbit).
- Local East-North-Up velocity vector components:
  $$v_{\text{East}} = V \cdot \cos(\gamma) \cdot \sin(\psi)$$
  $$v_{\text{North}} = V \cdot \cos(\gamma) \cdot \cos(\psi)$$
  $$v_{\text{Up}} = V \cdot \sin(\gamma)$$

### 4.8 Reference Frames & Transformations to EQJ

```
   [ Table 7-II Earth Anchor ]                        [ Table 7-II Moon Anchor ]
   (Geodetic Lat, Long, Alt)                         (Selenographic Lat, Long, Alt)
   (Inertial V, FPA, Heading)                        (Inertial V, FPA, Heading)
               │                                                 │
               ▼                                                 ▼
   [ Geodetic to ECEF Position ]                     [ Spherical to Selenocentric Position ]
   Fischer 1960 Ellipsoid                            Landing Site 2 Sphere (R = 1738.09 km)
               │                                                 │
               ▼                                                 ▼
   [ ECEF to Earth-Centered EQJ ]                    [ Selenographic to Moon-Centered EQJ ]
   Orb 3.1.1 ECEF -> EQJ Transform                   IAU 2015 WGCCRE Lunar Rotation Matrix
   (IAU 1982 GMST, Precession/Nutation)              (Alpha_0, Delta_0, W at UTC timestamp)
               │                                                 │
               │                                                 ▼
               │                                     [ Center Composition to Earth EQJ ]
               │                                     r_Apollo/Earth = r_Apollo/Moon + r_Moon/Earth
               │                                     (using dated Astraeus Moon state)
               │                                                 │
               └───────────────────────┬─────────────────────────┘
                                       ▼
                       [ Runtime SampledTrajectory in EQJ ]
```

#### Earth-Fixed $\rightarrow$ Earth-Centered EQJ
1. **Position:**
   Compute Cartesian ECEF position using Fischer 1960 ellipsoid:
   $$N(\phi) = \frac{a}{\sqrt{1 - e^2 \sin^2(\phi)}}$$
   $$X_{\text{ECEF}} = (N + h) \cos(\phi) \cos(\lambda)$$
   $$Y_{\text{ECEF}} = (N + h) \cos(\phi) \sin(\lambda)$$
   $$Z_{\text{ECEF}} = \left(N(1 - e^2) + h\right) \sin(\phi)$$
2. **Rotation to EQJ:**
   Transform ECEF position to Earth-centered EQJ using the Greenwich Mean Sidereal Time (GMST) and IAU precession/nutation matrix provided by `@lizard-isana/orb` at timestamp $t$.
3. **Velocity in EQJ:**
   Table 7-II specifies that velocity is **"Space-fixed"** (inertial magnitude $V$, with flight-path angle $\gamma$ and heading $\psi$ relative to the inertial direction of local horizontal/vertical). Rotate the inertial local basis into EQJ to produce the Earth-centered inertial velocity vector $\mathbf{v}_{\text{EQJ}}$.

#### Moon-Fixed $\rightarrow$ Moon-Centered EQJ
1. **Position in Selenographic Frame:**
   $$X_{\text{sel}} = (R_{\text{LS2}} + h) \cos(\phi_{\text{sel}}) \cos(\lambda_{\text{sel}})$$
   $$Y_{\text{sel}} = (R_{\text{LS2}} + h) \cos(\phi_{\text{sel}}) \sin(\lambda_{\text{sel}})$$
   $$Z_{\text{sel}} = (R_{\text{LS2}} + h) \sin(\phi_{\text{sel}})$$
2. **Rotation to Moon-Centered EQJ:**
   Rotate the selenographic vector into EQJ using the standard IAU Working Group on Cartographic Coordinates and Rotational Elements (WGCCRE) lunar orientation model (Archinal et al. 2018 / 2011).
   The orientation of the Moon's north pole and prime meridian relative to J2000 at Julian centuries $T = (JD - 2451545.0) / 36525$:
   $$\alpha_0 = 269.9949^\circ + 0.0031^\circ T - 3.8787^\circ \sin(E1) - 0.1204^\circ \sin(E2) \dots$$
   $$\delta_0 = 66.5392^\circ + 0.0130^\circ T + 1.5419^\circ \cos(E1) + 0.0274^\circ \cos(E2) \dots$$
   $$W = 38.3213^\circ + 13.17635815^\circ \cdot d + \dots$$
   This rotation is used for **position** only.
3. **Velocity in Moon-Centered EQJ (Earth-equatorial north):**
   For Moon-referenced, non-surface anchors, flight-path angle and heading are applied in a local basis built from the Moon-centred EQJ position $\mathbf{r}$ and the EQJ (J2000) pole $\hat{\mathbf{z}}$, not from the lunar pole:
   $$\hat{\mathbf{u}} = \hat{\mathbf{r}},\quad \hat{\mathbf{e}} = \frac{\hat{\mathbf{z}} \times \hat{\mathbf{u}}}{\lVert \hat{\mathbf{z}} \times \hat{\mathbf{u}} \rVert},\quad \hat{\mathbf{n}} = \hat{\mathbf{u}} \times \hat{\mathbf{e}}$$
   and the 4.7 components are taken along $\hat{\mathbf{e}}, \hat{\mathbf{n}}, \hat{\mathbf{u}}$. Table 7-I does not say which north applies at the Moon. This reading is **adopted from the data**, not from a printed definition: under it, 15 lunar-orbit anchors (A-12 to A-14, A-16 to A-26, A-28) share one orbit plane to within about 0.6°, against a scatter of up to about 17° with lunar north, and the A-10>A-11 and A-32>A-33 coasts nearly close (`docs/ASTRAEUS_SPIKE_02.md` section 7.2, T-011). The owner approved it on 2026-10-06 (Objective O-002, "Confirmed Decisions — 2026-10-06 (visible jumps)"; T-013). The J2000, 1969 mean and B1950 poles cannot be told apart by this data (under 5 km at A-33); J2000 is used. Surface-fixed anchors take the velocity of the rotating Moon-fixed point.
4. **Normalisation to Earth Center:**
   To satisfy Brief Section 5 and Objective O-002, the runtime trajectory is stored in a single unified coordinate system: Earth-centered EQJ. The Moon-relative Cartesian state is translated:
   $$\mathbf{r}_{\text{Apollo/Earth}}(t) = \mathbf{r}_{\text{Apollo/Moon}}(t) + \mathbf{r}_{\text{Moon/Earth}}(t)$$
   $$\mathbf{v}_{\text{Apollo/Earth}}(t) = \mathbf{v}_{\text{Apollo/Moon}}(t) + \mathbf{v}_{\text{Moon/Earth}}(t)$$
   where $\mathbf{r}_{\text{Moon/Earth}}(t)$ and $\mathbf{v}_{\text{Moon/Earth}}(t)$ are sampled from the dated Astraeus Moon trajectory at timestamp $t$.

---

## 5. Independent Cross-Check Values for Later Validation

The following table compiles independent postflight values published in MSC-00171 (Tables 7-III, 7-IV, 7-V, 7-VI, 7-VII, and 5-IV) for downstream validation of propagated segments in T-007 and validation in T-009:

| Phase / Maneuver | GET Timestamp | Target / Parameter | Authoritative Value | Citation in MSC-00171 |
|---|---|---|---|---|
| **Translunar Injection (TLI)** | 02:50:03.2 | Burn cutoff state | Alt: $173.3\text{ n mi}$, Vel: $35,567\text{ ft/s}$, FPA: $6.91^\circ$ | Table 7-II, p. 7-9 |
| **TLI Free Return** | 75:05:21 | Pericynthion altitude | $896.3\text{ n mi}$ ($1,660.0\text{ km}$) | Table 7-III, p. 7-10 |
| **MCC-1 Post-burn Orbit** | 75:53:35 | Targeted pericynthion | $61.5\text{ n mi}$ ($113.9\text{ km}$), Vel: $8,334\text{ ft/s}$ | Table 7-III, p. 7-10 |
| **LOI-1 Insertion Orbit** | 75:55:48.0 | Resultant orbit | Apocynthion: $169.7\text{ n mi}$, Pericynthion: $60.0\text{ n mi}$ | Table 7-V, p. 7-11 |
| **LOI-1 Firing Results** | 75:49:50.4 | $\Delta V$ / burn duration | $\Delta V = 2,917.5\text{ ft/s}$, Firing time: $357.5\text{ s}$ | Table 7-V, p. 7-11 |
| **LOI-2 Circularization Orbit** | 80:11:53.6 | Resultant orbit | Apocynthion: $65.7\text{ n mi}$, Pericynthion: $53.8\text{ n mi}$ | Section 7.4.4, p. 7-3; Table 7-V |
| **CSM Separation Burn** | 100:39:52.9 | $\Delta V$ / orbit | $\Delta V = 1.4\text{ ft/s}$, Orbit: $63.7 \times 56.0\text{ n mi}$ | Table 7-V, p. 7-11 |
| **Descent Orbit Insertion (DOI)** | 101:36:44.0 | $\Delta V$ / orbit | $\Delta V = 76.4\text{ ft/s}$, Orbit: $64.3 \times 8.5\text{ n mi}$ (pre-PDI peri) | Table 7-V, p. 7-11; Sec 7.4.6 |
| **Powered Descent Initiation** | 102:33:05.1 | State at PDI ignition | Alt: $6.4\text{ n mi}$ ($38,887\text{ ft}$), Vel: $5,564.3\text{ ft/s}$ | Table 7-II, p. 7-9 |
| **Lunar Landing Site 2 (Target)** | Preflight | Targeted ellipse center | $0.72^\circ\text{ N}, 23.71^\circ\text{ E}$ | Section 7.7, p. 7-5 |
| **Lunar Landing Site (Actual)** | 102:45:39.9 | Touchdown coordinates | $0.67408^\circ\text{ N}, 23.47297^\circ\text{ E}$ | Table 5-IV, p. 5-10 |
| **Lunar Lift-off** | 124:22:00.8 | Ignition time | Engine ignition at $124:22:00.8$ | Table 3-I, p. 3-4 |
| **Ascent Insertion Orbit** | 124:29:15.7 | $\Delta V$ / resultant orbit | $\Delta V = 6,070.1\text{ ft/s}$, Orbit: $48.0 \times 9.4\text{ n mi}$ | Table 7-V, p. 7-11 |
| **Coelliptic Sequence (CSI)** | 125:19:35.5 | $\Delta V$ / resultant orbit | $\Delta V = 51.5\text{ ft/s}$, Orbit: $49.3 \times 45.7\text{ n mi}$ | Table 7-V, p. 7-11 |
| **Constant Differential Height (CDH)** | 126:17:49.6 | $\Delta V$ / resultant orbit | $\Delta V = 19.9\text{ ft/s}$, Orbit: $47.4 \times 42.1\text{ n mi}$ | Table 7-V, p. 7-11 |
| **Terminal Phase Initiation (TPI)** | 127:03:51.8 | $\Delta V$ / resultant orbit | $\Delta V = 25.3\text{ ft/s}$, Orbit: $61.7 \times 43.7\text{ n mi}$ | Table 7-V, p. 7-11 |
| **Terminal Phase Finalize (TPFI)** | 127:46:09.8 | $\Delta V$ / resultant orbit | $\Delta V = 31.4\text{ ft/s}$, Orbit: $63.0 \times 56.5\text{ n mi}$ | Table 7-V, p. 7-11 |
| **Transearth Injection (TEI)** | 135:23:42.3 | $\Delta V$ / duration | $\Delta V = 3,279.0\text{ ft/s}$, Firing time: $151.4\text{ s}$ | Table 7-VI, p. 7-11 |
| **Second Midcourse (MCC-2)** | 150:29:57.4 | $\Delta V$ / duration | $\Delta V = 4.8\text{ ft/s}$, Firing time: $11.2\text{ s}$ | Table 7-VI, p. 7-11 |
| **Entry Interface (EI)** | 195:03:05.7 | State at $400,000\text{ ft}$ | Alt: $65.8\text{ n mi}$, Vel: $36,194.4\text{ ft/s}$, FPA: $-6.48^\circ$ | Table 7-VII, p. 7-12 |
| **Drogue Deployment** | 195:12:06.9 | Timestamp | Drogue deployment at $\approx 10,000\text{ ft}$ | Table 7-VII, p. 7-12 |
| **Splashdown Location** | 195:18:35 | Touchdown coordinates | $13.30^\circ\text{ N}, 169.15^\circ\text{ W}$ (guidance); $13.25^\circ\text{ N}, 169.15^\circ\text{ W}$ (ship) | Table 7-VII, p. 7-12 |

---

## 6. Open Assumptions and Expected Sensitivity

1. **Table 7-II Digitization & Parameter Rounding:**
   - Table 7-II prints latitude and longitude to two decimal places ($0.01^\circ \approx 0.3\text{ km}$ on the Moon, $1.1\text{ km}$ on Earth), altitude to one decimal place ($0.1\text{ n mi} \approx 0.185\text{ km}$), and velocity to 0.1–1 ft/s ($0.03\text{–}0.3\text{ m/s}$).
   - *Expected effect:* Small truncation residual ($\le 0.5\text{ km}$) when converting into Cartesian coordinates. Segment initialisation tolerance of $\le 1\text{ km}$ easily accommodates this rounding.
2. **Earth Rotation & UT1 Offset ($DUT1 = 0$):**
   - The `@lizard-isana/orb` library defaults $DUT1 = 0$ (UTC $\approx$ UT1). In July 1969, the actual offset $|UT1 - UTC|$ was less than $0.1\text{ s}$.
   - *Expected effect:* At the Earth's equator, a $0.1\text{ s}$ rotation represents $46\text{ m}$ of longitudinal displacement. This is an order of magnitude smaller than the $1\text{ km}$ anchor verification threshold and produces zero observable visual artifact.
3. **Runtime Moon Visual Alignment vs Cartographic IAU Placement:**
   - The runtime Moon in Astraeus Spike 01 uses an approximate tidal-lock orientation basis (near-side axis pointing directly toward Earth).
   - An anchor or landing site placed using the full IAU lunar rotation model in inertial EQJ space will possess slight angular offset ($\approx 1^\circ\text{–}2^\circ$) from the visual texture feature of Tranquility Base on the rendered 3D sphere.
   - *Decision:* Per confirmed planning decision in Objective O-002, this offset is measured and documented truthfully; Moon mesh orientation is **not** artificially altered to hide the difference.
4. **Moon-Referenced Heading Reference (adopted from data, 2026-10-06):**
   - Table 7-I defines heading against "north" without saying which north applies at the Moon. The reconstruction uses Earth-equatorial (EQJ) north for Moon-referenced, non-surface anchors (4.8, Moon step 3).
   - *Expected effect:* versus lunar north, the velocity of a lunar-orbit anchor changes by about 70 to 980 m/s (A-32 984 m/s). Under EQJ north the lunar-orbit anchors are mutually consistent; four printed headings (A-15, A-27, A-29, A-30) still do not fit the orbit plane and are transcription leads only.
5. **Ascent and Parachute Omission:**
   - The launch vehicle ascent (from pad to orbit insertion) and parachute descent (from drogue deployment to water impact) are represented by mission events only, not reconstructed flight paths. Spacecraft trajectory rendering commences at Earth Orbit Insertion ($GET\text{ 00:11:39.3}$) and terminates at Entry Interface ($GET\text{ 195:03:05.7}$).

---

## 7. Deliverables & Handoff Summary

- `data/apollo11/raw/anchors.json`: 36 authoritative Table 7-II / 7-VII / 5-IV anchor records with complete original metadata.
- `data/apollo11/raw/events.json`: 30 authoritative mission events covering Section 12 from launch to splashdown, plus explicit reasons for omitted events.
- `docs/APOLLO11_SOURCES.md`: This comprehensive decision record.
- Ready for Task T-006 (generic SampledTrajectory implementation) and Task T-007 (offline conversion and propagation tool).

## 8. T-014 Source Settlement (2026-10-06)

### A-13 longitude

I read the NASA NTRS indexed text for *Apollo 11 Mission Report*, NASA SP-238, document 19710015566, Table 7-II, printed page 7-9. The table heading identifies longitude in degrees; the lunar-orbit circularization rows show A-13 ignition at `170.09 E` and A-14 cutoff at `169.16 E`. The NTRS record identifies this as the NASA SP-238 mission report; the original 1969 MSC-00171 record is [NTRS 19700008096](https://ntrs.nasa.gov/citations/19700008096). The indexed table text was readable, while the web text viewer rejected the full 12.5 MB SP-238 PDF. The source reading is also available from the [NASA NTRS SP-238 record](https://ntrs.nasa.gov/citations/19710015566).

The prior raw A-13 value `170.09W` was a transcription error. The corrected source pair changes east longitude from `170.09°` to `169.16°`, a `0.93°` westward ground-track change. A-13's raw record now carries a `correction_note`; no inferred override is used for A-13. Propagation from A-12 predicts A-13 at `170.75° E`; backward propagation from A-14 predicts `170.01° E`. The corrected A-13>A-14 anchor separation is `29.986 km`, compared with `667.101 km` under the old west-longitude transcription. The regenerated report lists the pair and no longer contains the 650 km discrepancy; propagation details are in T-014's Technical Evidence and `docs/evidence/anchor-consistency.json`.

### A-05 documentary search

The search was bounded to about one hour of source work and focused on an independent RTCC, BET, or equivalent state near docking. Sources tried:

- [NASA SP-238, Table 7-II, p. 7-9](https://ntrs.nasa.gov/citations/19710015566): the docking row prints FPA `44.94°`; this repeats the disputed source value and is not an independent state.
- NASA's [Post Launch Mission Operation Report M-932-69-11](https://www.apollojournals.org/afj/ap11fj/pdf/a11-postlaunch-rep.pdf), “Translunar Coast”: reports docking completion at about GET 3:29, without a numerical state vector.
- The [Apollo 11 technical air-to-ground transcript](https://www.apollojournals.org/alsj/a11/a11transcript_tec.html), around GET 3:17–3:50: records separation, a communications gap around docking, and the crew's later confirmation of docking; it contains no independent full state at GET 3:24.
- NASA's [PAO transcript](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11transcript_pao.pdf): at GET 3:46 reports speed `18,917 ft/s` and Earth range `9,002 n mi`; at GET 4:04 reports `17,014 ft/s` and `11,753 n mi`. These are scalar readouts, not a full state vector.
- [Apollo 11 Flight Journal, Day 1 part 3](https://www.apollojournals.org/afj/ap11fj/03tde.html): transcript and commentary around transposition and docking; no independent state vector.
- NASA's [Apollo mission 11 trajectory reconstruction and postflight analysis, volume 1 (NASA-CR-108349)](https://ntrs.nasa.gov/citations/19700014995): the report describes RTCC vectors and BET work, but its documented CSM BETs cover lunar revolutions 13, 14, 25, and 26, not the translunar docking interval; no GET 3:24 state was found in its indexed text.

No independent full state vector or BET near GET 3:24 was found in this bounded search. The PAO scalars are nearby documentary observations but do not independently establish FPA. Therefore A-05 remains raw `44.94°`, with the already owner-approved `49.94°` reconstruction override still marked inferred (`probable-source-typo`, confidence high but not documentary-confirmed); status and confidence were not changed.
