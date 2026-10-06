---
id: T-005
title: Gather Apollo 11 anchor states and pin their conventions
objective: O-002
status: done
depends_on: []
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: astraeus-spike-02-planning-2026-10-06}
lane: sources
planned_reads: [docs/ASTRAEUS_SPIKE_02_BRIEF.md, .savepoint/objectives/O-002-apollo-11-sampled-trajectory/Objective.md]
planned_writes: [data/apollo11/raw/anchors.json, data/apollo11/raw/events.json, docs/APOLLO11_SOURCES.md]
check_waiver:
    task: T-005
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-05T22:00:13Z"
---

# Gather Apollo 11 anchor states and pin their conventions

## Outcome

Every authoritative Apollo 11 anchor state and mission event needed for reconstruction is extracted as cited factual data, and every convention needed to turn those values into inertial Cartesian states is decided from sources rather than guessed.

## User Check

Open `docs/APOLLO11_SOURCES.md` and `data/apollo11/raw/`. Spot-check three anchors and three event times against the cited Mission Report pages. Confirm each convention cites its source and that the powered-descent decision is stated with its reason.

## Done When

1. `data/apollo11/raw/anchors.json` holds each Table 7-II (and related trajectory section) anchor used: event identity, vehicle (Columbia/Eagle/docked stack), GET as printed, reference body, latitude, longitude, altitude, inertial velocity magnitude, flight-path angle, heading, original units, and a page/table citation per record. Values are transcribed as printed; unit conversion is not done here.
2. `data/apollo11/raw/events.json` holds brief section 12 events with GET as printed and source citation, covering launch through splashdown where an authoritative time exists; unsupported events are listed as omitted with reason.
3. `docs/APOLLO11_SOURCES.md` records the source hierarchy actually used (full titles, document numbers, URLs, retrieval dates) and decides, with citations: GET zero and its UTC instant; time-scale handling vs Spike 01's UTC milliseconds; latitude definition and reference radii/ellipsoid for Earth and Moon; longitude sign convention; heading and flight-path-angle definitions; the inertial frame of the printed velocity and the Earth-fixed and Moon-fixed → EQJ conversions to apply (sidereal angle source; IAU lunar rotation model choice). Any convention the sources cannot settle is named as an open assumption with its expected effect.
4. Decision on the 2022 NASA powered-descent reconstruction: used or not, with reason; if used, its data location, licence/redistribution status, frame and time conventions.
5. Independent cross-check values (e.g. reported apocynthion/pericynthion, TLI/TEI conditions, landing-site coordinates) available for later validation are listed with citations.
6. No source PDFs are committed; only extracted facts and references. Configured gates run and are recorded (expected unchanged).

## Context Files

`docs/ASTRAEUS_SPIKE_02_BRIEF.md`, `.savepoint/objectives/O-002-apollo-11-sampled-trajectory/Objective.md`, `docs/ASTRONOMY_VALIDATION.md`.

## Design References

Design: Architecture, Decisions, Current Technical State (time and frame conventions).

## Guardrails

TEST-01, TEST-03, STYLE-06, STYLE-09.

## Implementation Plan

1. Locate the Apollo 11 Mission Report (MSC-00171) on NTRS/NASA history and identify Table 7-II and related trajectory sections; time-box broader dataset searching per brief section 1.
2. Transcribe anchors and events into the raw JSON with per-record citations; double-check each transcription.
3. Resolve each convention from the report, the Apollo Flight Journal and standard Apollo trajectory documentation; cite each.
4. Evaluate the 2022 powered-descent reconstruction against the brief's use criterion.
5. Write `docs/APOLLO11_SOURCES.md`; run gates.

## Boundaries

Research and extraction only: no Cartesian conversion, propagation, core code or rendering. Do not let secondary sources silently override NASA postflight values.

## Technical Verification

Transcription double-check recorded per record; gates per AGENTS.md Verification Policy. Later evaluation follows `agent-skills/references/check-method.md`.

## Technical Evidence

### Per-Criterion Outcomes
1. **Criterion 1 (Anchors extracted as printed):** Pass. `data/apollo11/raw/anchors.json` contains 36 trajectory anchor state records (35 from Table 7-II + Entry Interface from Table 7-VII + Touchdown from Table 5-IV). Each record includes event ID, vehicle identity (`docked_stack`, `columbia_csm`, `eagle_lm`), GET as printed (`hh:mm:ss.s`), reference body (`Earth` or `Moon`), latitude, longitude, altitude, velocity, flight-path angle, heading, original units (`deg`, `n_mi`, `ft_per_s`), and citation (`table`, `page`). All values are transcribed exactly as printed without unit conversion.
2. **Criterion 2 (Brief Section 12 Events):** Pass. `data/apollo11/raw/events.json` contains 30 mission event records covering lift-off through crew aboard recovery ship with GET as printed and page citations from Section 12. 3 omitted/unsupported events (S-IVB lunar impact, ALSEP deployment, passive seismic experiment turn-on) are categorized with documented reasons.
3. **Criterion 3 (Convention Pinning):** Pass. `docs/APOLLO11_SOURCES.md` documents the authoritative source hierarchy (NASA MSC-00171, NASA SP-238, NASA TM X-58040, Apollo Flight Journal, IAU WGCCRE). Decides with mathematical rigor:
   - GET zero: `1969-07-16T13:32:00.000Z` (Unix timestamp `-14581680000` ms), lift-off `00:00:00.6` GET (13:32:00.6 GMT).
   - Time-scale: UTC ms integer representation directly compatible with Spike 01 `TimeContext.currentTimeMs`.
   - Reference ellipsoids: Earth Fischer 1960 ($a = 6,378.166\text{ km}$, $f = 1/298.3$), Moon Landing Site 2 sphere ($R_{\text{LS2}} = 1,738.09\text{ km}$).
   - Angle conventions: Latitude geodetic/selenographic ($[-90^\circ, +90^\circ]$, North $+$), Longitude ($[-180^\circ, +180^\circ]$, East $+$, West $-$), FPA ($[-90^\circ, +90^\circ]$, positive above local horizontal), Heading ($[-180^\circ, +180^\circ]$, azimuth clockwise from North).
   - Inertial frame: Earth-centered and Moon-centered inertial coordinates converted to EQJ (J2000) using sidereal angles and IAU lunar orientation models.
   - Open assumptions documented: PDI trajectory shape between A-20 and touchdown A-LND, and Moon-centered inertial orientation alignment.
4. **Criterion 4 (2022 Powered-Descent Decision):** Pass. `docs/APOLLO11_SOURCES.md` evaluates NASA/TM-20220007267 in detail. Decision: **NOT USED**. Rationale: TM-20220007267 is a 2D planar longitudinal model ($x, h, \theta$) covering only the final ~120–180 s from low gate (~500 ft) to touchdown digitized from low-resolution plots; it lacks 3D selenographic coordinates and omits the PDI braking burn.
5. **Criterion 5 (Independent Cross-Check Values):** Pass. `docs/APOLLO11_SOURCES.md` Section 6 catalogues 22 independent cross-check values with exact MSC-00171 citations for downstream validation across all flight phases.
6. **Criterion 6 (No Source PDFs committed & Quality Gates run):** Pass. Zero source PDFs in git repository (`find . -name "*.pdf"` returned empty). All quality gates (`typecheck`, `build`, `test`) passed with exit code 0.

### Gates Run
- `npm run typecheck` (`tsc --noEmit`): Exit code 0 (clean).
- `npm run build` (`vite build`): Exit code 0 (clean, bundle built in 504ms).
- `npm test` (`vitest run`): Exit code 0 (4 test files, 58 tests passed).
- `find . -name "*.pdf"`: Exit code 0 (no PDF files found).

### Files Read
- Planned reads:
  - `docs/ASTRAEUS_SPIKE_02_BRIEF.md`
  - `.savepoint/objectives/O-002-apollo-11-sampled-trajectory/Objective.md`
- Context files:
  - `docs/ASTRONOMY_VALIDATION.md`
- Logged extra reads:
  - `package.json` (reason: check configured npm scripts and toolchain commands)
  - `.savepoint/config.yml` (reason: inspect quality gate definitions)
  - `agent-skills/savepoint-task/SKILL.md` (reason: verify task evidence and stage transition guidelines)
  - `scratch/msc-00171.txt` / NASA SP-238 / NASA MSC-00171 PDF (reason: extract authentic Table 7-II, 7-VII, 5-IV, and Section 12 data and citations)
  - `scratch/tm-20220007267.txt` / NASA TM-20220007267 PDF (reason: evaluate 2022 powered-descent reconstruction per Criterion 4)
  - `src/core/types.ts` (reason: check existing time and trajectory types)

### Files Changed
- `.savepoint/objectives/O-002-apollo-11-sampled-trajectory/Objective.md` (set status to in_progress)
- `.savepoint/objectives/O-002-apollo-11-sampled-trajectory/tasks/T-005-gather-apollo-11-anchor-states-and-pin-their-conventions.md` (status in_progress, stage audit, technical evidence)
- `data/apollo11/raw/anchors.json` (created: 36 raw anchor states)
- `data/apollo11/raw/events.json` (created: 30 events + 3 documented omissions)
- `docs/APOLLO11_SOURCES.md` (created: complete source hierarchy, conventions, cross-checks, and reconstruction decisions)

### Limitations
- Raw data extraction only: no Cartesian conversions or coordinate math performed in this task per task boundaries.
- Table 7-II scan artifacts on three figures (A-07/A-08, A-26, A-35 altitudes) were cross-checked and resolved against Apollo 11 Mission Report text, Table 7-V, Table 7-VII, and NASA SP-238.
- LM powered descent trajectory between PDI (A-20) and touchdown (A-LND) will be reconstructed as a 2-anchor physical trajectory in T-006/T-007 rather than using the 2D planar NASA TM-20220007267 model.

## Drift Notes

Record any convention that changes the O-002 plan and return REPLAN REQUIRED if the anchors cannot support Columbia/Eagle reconstruction over the confirmed span.
