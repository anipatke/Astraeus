---
id: C-031
scope: {kind: task, id: T-038}
result: CLEAR
checked_by: {role: checker, session: o011-orchestrator-check-20261013}
executed_session: t038-builder-2026-10-15-to-16
checked_at: '2026-10-16T03:40:00Z'
reviewed:
  base_commit: 258ca6e
  head_commit: 258ca6e (working tree, uncommitted)
  files:
    - tools/data/fetch-meteoroid-orbits.mjs
    - tools/data/fetch-meteoroid-orbits.d.mts
    - data/showers/perseids.json
    - src/experiences/showers/showerSettings.ts
    - src/experiences/showers/showerDefinition.ts
    - src/experiences/showers/measuredOrbits.ts
    - src/core/clock.ts
    - src/app/viewUp.ts
    - src/app/App.tsx
    - src/app/AstraeusScene.tsx
    - src/app/CameraController.tsx
    - src/app/experienceDefinition.ts
    - src/app/sceneFraming.ts
    - src/app/SceneLabels.ts
    - src/app/bodyDraw.ts
    - src/app/BodyView.tsx
    - src/app/BodyMesh.tsx
    - src/shell/experience.ts
    - src/assets/visual.ts
    - src/assets/bodies/sun.ts
    - src/core/bodies/sun.ts
    - src/assets/textures/sun-2k.jpg
    - src/main.tsx
    - docs/ASTRONOMY_VALIDATION.md
    - docs/DONOR_PROVENANCE.md
    - tests/showers.test.ts
    - tests/showersMeasured.test.ts
    - tests/fetchMeteoroidOrbits.test.ts
    - tests/viewUp.test.ts
    - tests/sunLook.test.ts
    - tests/textureLicence.test.ts
    - tests/helpers/
    - tests/compositions.test.ts
    - tests/experiencePlugIn.test.ts
    - tests/experiences.test.ts
    - tests/swiftTuttle.test.ts
    - tools/validate/browser-showers.mjs
    - tools/validate/browser-sun.mjs
    - tools/validate/browser-synthetic-belt.mjs
  dependencies: [T-052, T-053, T-054]
issues: []
supersedes: null
---

# C-031: T-038 Task Check (Quick)

Checker: the O-011 orchestrator session. The Sonnet builder sub-session (one agent, resumed for each owner rework) is separate.

## Scope Lock

1. Done When 1–6 of T-038, plus the owner's look against meteorshowers.org/view/Perseids (owner_validation required).
2. Changed files: as listed. Files outside planned_writes are recorded with reasons in the Task's rework sections. They are the generic loop, view-up, Sun visual, label and refill-interval settings that the owner asked for during the look.
3. Out of scope: the second shower (T-039), Design reconciliation of drift notes (T-040), and the Milky Way texture (I-026).

## Acceptance Coverage

| DW | Result | Independent evidence |
|----|--------|----------------------|
| 1 Measured CAMS stream, local only, traceable | Proven | The checker recounted from the CAMS v3 workbook (`scratchpad/cams/CAMS.xlsx`, SHA-256 ec8864967785…a85845) with its own reader: 18,699 bound IAU 7 members, matching the file's header and the panel count. `git ls-files data/local` = 0 at every gate run. The public-build validator found `matches: []`. The not-fetched path is browser-asserted (`not-fetched.png`). The 20-record sample traces back to the workbook (builder test with `CAMS_XLSX`, log in the evidence). |
| 2 Factual checks | Proven | Checker, independently in Python on the raw elements: Vg median 58.83 km/s (MDC 58.8); the busiest solar-longitude bin is 140.0° (MDC 140.1°); the whole-season median radiant is RA 46.66 / Dec +57.21, 0.96° from MDC 47.9 / +57.9. The builder's near-node radiant (0.21° off) and its peak 0.19 d from MDC use a tighter Earth-proximity selection; both are within the 3° and 2 d limits. The reliable cut (Q ≥ 15°, σVg ≤ 10% Vg, Peña-Asensio & Sánchez-Lozano 2024, doi 10.1016/j.asr.2024.05.005) gives 15,644 members in the checker's recount and in the builder's, with 99 pairs flagged. |
| 3 Comet's whole orbit, planets, sky | Proven | The checker viewed `desktop-whole-orbit.png` and the Sun overview screenshots: the whole 109P orbit and the planets on their orbits as labelled markers, with the sky on. The comet path comes from the T-054 body, whose elements C-030 verified against SBDB and Horizons. The ecliptic-up view puts Earth's path within 0.8° of flat (12.5° with equatorial up), which answers the owner's "different plane" note. |
| 4 Performance ≥ 30 fps on the owner's machine | Proven (owner-measured) | Owner, 2026-10-16, after a busy-machine reading of 30 that rose as the builder's headless runs ended (load average 8.2 → 5.5): "now a steady 70 across all". The refill-interval fix (6 h → 72 h, a setting) came afterwards and only reduces per-frame work: software GL playing went from 18.6 to 33.3 fps, with paused script time equal to the T-054 baseline (`sun-close/fps-breakdown.txt`). The 3-day linear blend between fills sags by about 3e-4 AU at 1 AU (checker estimate: a·(Δt/2)²/2 with a = GM/r²), below the 0.001 AU stated. |
| 5 Clump near the comet | Proven, owner-accepted | Fraction 0.3 and ±20° of mean anomaly are labelled illustrative with no citation claimed; the panel says so and calls it a band at the comet's phase (C-029 observation 2). Owner decision: "Keep it as is (Recommended)". |
| 6 Stand-in removed, browser, gates | Proven | No `spread` or `memberCount` remains in the settings file (contract test). The checker's gates at 2026-10-16T03:28Z: typecheck 0, build 0, vitest 40 files with 728 passed and 1 skipped (the optional `CAMS_XLSX` sample). Browser evidence is in fresh directories: `docs/evidence/o011-t038-20261015T100508Z/` (`loop/`, `up/`, `year/`, `quality/`), `docs/evidence/o011-t038-20261016T010336Z/sun/` and `docs/evidence/o011-t038-20261016T014614Z/sun-close/`. Each script exits 0 with zero console errors, after a rerun noted in `summary.txt` for synthetic-belt and showers, where the builder widened the predicates for the new Sun look. The checker viewed the close-zoom series: the Sun stays visible to the closest allowed zoom (800,055 km). `regression-spike01-02` is unchanged (`git status`). |

## Owner Acceptance (recorded with the owner's words, 2026-10-15/16)

- Look reworks the owner asked for, each delivered as a setting with a live control:
  - "needs to play in a loop, as disappears when reaches the end": loop.
  - "id like to compare": all vs reliable orbits.
  - "ours seems to to be on a different plane to meteorshowers" and "we should have that as another varaiable": ecliptic up, with a toggle.
  - "can we make this run for a whole year?": whole-year timeline.
  - "we need a sun though lol", "if i zoom all the way in, it kinda disappears?", "dont need the square either?", "can we get a real sun texture on it..", "we can probably turn off the sun label": Sun visual, zoom minimum, no dot, the Solar System Scope CC BY 4.0 texture, and a label setting.
- Overall look: "very cool", then "Yea i think this is good".
- Default orbit set: "All orbits (Recommended)".
- Clump: "Keep it as is (Recommended)".
- Frame rate: "now a steady 70 across all".

## Issues

None.

## Observations (non-blocking)

1. Up close on the Sun, the orbit lines and Earth's label draw over the disc even when they are behind it. The owner was told and accepted the look. Candidate for a later generic depth rule; not O-011's bar.
2. The texture's orientation is a visual stand-in (no solar rotation model). The Sun item's limitations say so.
3. Drift notes in the Task, including the rework sections, are for T-040. These cover the generic label setting, the glow and emissive visual fields, framing radius for emissive marker bodies, the view-up setting, the looping clock and the refill interval.
4. The wall-clock fill test (C-030 observation 3) stayed green in the checker's runs. Keep watching it at the Full Objective Check.
