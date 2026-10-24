---
id: I-091
title: The Moon is drawn without libration, so surface places sit up to several degrees off
type: other
status: in_progress
source:
  kind: report
  actor: {role: owner, session: improvements-intake-20261024}
  at: '2026-10-24T02:51:07Z'
severity: medium
history:
  - at: '2026-10-24T02:51:07Z'
    actor: {role: planner, session: improvements-intake-20261024}
    kind: observed
    note: 'Split from I-009 item 5. Owner, 2026-10-24: "Add it as an improvement issue".'
  - at: '2026-10-24T14:40:00Z'
    actor: {role: executor, session: i091-repair-20261024}
    kind: repair_attempted
    note: 'Moon orientation is now the existing iau-rotation kind (no new kind needed) with MOON_ROTATION in core/bodies/moon.ts: IAU WGCCRE 2009 report (Archinal et al., CMDA 109, 101, 2011) as saved in NAIF pck00011.tpc BODY301, pole RA/Dec and W with libration terms E1..E13; MoonTrajectory uses iauOrientation. The report -1.4e-12 d^2 term in W is omitted (0.0005 deg at 50 y). Residuals vs JPL Horizons MOON_ME at 7 dates 1969-2050 (fixture tests/fixtures/moon-rotation-horizons.json, fetched 2026-10-24): sub-Earth longitude <= 0.0060 deg, latitude <= 0.0028 deg, pole <= 0.0032 deg (about 0.2 km on the surface). Apollo 11 landing-site offset re-measured by the reconstruction tool (apollo11:reconstruct, validation.ts now uses the engine Moon): 0.01 km, 0 deg at touchdown and lift-off (was 254.18 km / 8.386 and 275.37 km / 9.087); this is by construction, as the reconstruction and the drawn Moon share one model, so the real accuracy is the Horizons residual above. moon.ts limitation text, Apollo scene Moon and Eagle landing-site text, report.ts paragraph, CHANGELOG updated; pinned tests updated (stateResolver, orientationIllumination, sceneTransforms incl. recorded moonQ now within 10 deg, rebuildComparison, domApollo). Gates: lint, typecheck, build, npm test (1859 passed), check:engine-alone, check:pack all pass. Not verified: no browser check or look at the textured Moon (owner judges on the preview; the mesh texture longitude seam assumes +X is longitude 0 as before); roll of the pole is checked only through Horizons pole RA/Dec at 7 dates; Design.md and docs/ASTRAEUS_SPIKE_02.md still describe the 254 km tidal-lock figure as history; columbia.json was left as committed (a 1e-9 last-digit difference from regeneration is unrelated platform noise). Issue left in_progress for savepoint-check to verify.'
---

# I-091: The Moon is drawn without libration, so surface places sit up to several degrees off

## Summary

The Moon's orientation is an approximate tidal lock with no libration (`packages/astraeus/src/core/bodies/moon.ts`, `TIDAL_LOCK_LIMITATION` and `LANDING_SITE_OFFSET`). An IAU-placed landing site sits 254 km (8.4°) from the same selenographic coordinates on this Moon at Apollo 11 touchdown. Every developer placing anything on the Moon's surface inherits the error, so this is an engine improvement, not demo work.

## Evidence

moon.ts lines 4-5 (documented limitations); docs/ASTRAEUS_SPIKE_02.md (the 254 km measurement); I-009 item 5.

## Proof Needed

A published lunar orientation model (for example the IAU WGCCRE rotation elements for the Moon, or a lunar libration series with its source recorded, PROV-01) drives the Moon's orientation in `src/core/`; a test compares the sub-Earth point or a surface site's direction with JPL Horizons (or the IAU model) at several dates and records the residual; the landing-site offset at touchdown is re-measured and the known-limitation text updated to the new figure; ARCH-02 and ARCH-05 hold (one definition, presentation unchanged); the Apollo demo and the planets demo still draw the Moon (fast suite).
