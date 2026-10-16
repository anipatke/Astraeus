---
id: C-032
scope: {kind: task, id: T-055}
result: CLEAR
checked_by: {role: checker, session: o011-orchestrator-check-20261013}
executed_session: t055-builder-2026-10-16
checked_at: '2026-10-16T05:45:00Z'
reviewed:
  base_commit: 5eb6fb7
  head_commit: 5eb6fb7 (working tree, uncommitted)
  files:
    - src/core/elementsBody.ts
    - src/assets/catalogue.ts
    - src/experiences/showers/showerSettings.ts
    - src/experiences/showers/showerDefinition.ts
    - src/app/experienceDefinition.ts
    - src/app/App.tsx
    - src/app/AstraeusScene.tsx
    - src/app/sceneLayout.ts
    - src/app/catalogueItem.ts
    - data/showers/geminids.json
    - tests/elementsBody.test.ts
    - tests/showers.test.ts
    - tests/showersMeasured.test.ts
    - tests/fixtures/phaethon-horizons-source.txt
    - tests/fixtures/phaethon-horizons.json
    - tools/validate/browser-showers.mjs
    - docs/ASTRONOMY_VALIDATION.md
  dependencies: [T-038]
issues: []
supersedes: null
---

# C-032: T-055 Task Check (Quick)

Checker: the O-011 orchestrator session. The Sonnet builder sub-session is separate.

## Scope Lock

1. Done When 1–6 of T-055. The owner look is not required.
2. Changed files: as listed. The five `src/app` files are outside planned_writes. They carry an optional per-experience catalogue, defaulting to the built-in one, and the builder recorded each with its reason. `data/showers/geminids.json` received a schema-shape edit only: `parentBodyId` became `parentElements`. T-039's facts are untouched.
3. Out of scope: the Geminids' own facts and acceptance (T-039).

## Acceptance Coverage

| DW | Result | Independent evidence |
|----|--------|----------------------|
| 1 Generic record → body | Proven | Code review: validation names the field for each value; the classification rule is approximate ≤ 1% and indicative ≤ 5% of the distance from the Sun. The name check passes, with no body name in `src/core/elementsBody.ts`. |
| 2 Swift–Tuttle equivalence | Proven (builder test) | Bit-identical at five dates (relative difference 0 against 1e-9). The epoch and periapsis instants are equal. |
| 3 Phaethon vs Horizons | Proven | The checker fetched SBDB live (solution 1017, epoch 2461200.5): a, e, i, Ω, ω and M equal `geminids.json` exactly. The checker's own Python two-body propagation against live Horizons vectors (ICRF, Sun centre): 2020-12-14 gives 935,340 km (2.179%, r = 0.287 AU), 2026-12-14 gives 11,305 km (0.004%), 2032-12-14 gives 32,701 km (0.009%). The builder's maximum is 935,344 km at 2020-12-14 (2.18%), classified "indicative". The accuracy text names two-body motion and the small perihelion. |
| 4 Parent from file or catalogue | Proven | Exactly one of the two is accepted, with named errors (tests). On checker review, the composition is now the Sun, the sphere-visual planets and the shower's own parent: Perseids mounts swift-tuttle and not phaethon; Geminids mounts phaethon and not swift-tuttle (tests and the browser `data-bodies` check). The panel names the parent, not "the comet". The preset reads "Focus parent". The checker viewed `geminids-soft-peak/desktop-sun-overview-peak.png` and `desktop-whole-orbit.png`: the stream crosses Earth's path, with Phaethon, the planets and no stray comet. |
| 5 Browser script driven by settings | Proven | `browser-showers.mjs` reads the peak longitude, radiant, counts, parent and window from each settings file and runs over every discovered shower. The peak tolerance is held at 0.3° after checker review; the first build loosened it to 0.5°. Per-scenario lit counts are logged. Perseids stays above the old 1000 bar everywhere it applied (4,770–15,752). |
| 6 Gates and browser | Proven | Checker gates at 2026-10-16T05:40Z: typecheck 0, build 0, vitest 41 files with 783 passed and 1 skipped. Fresh directories `docs/evidence/o011-t055-20261016T035119Z/` and `docs/evidence/o011-t055-20261016T051510Z-rework/`, with zero console errors. Perseids, synthetic-eccentric and synthetic-belt exit 0. Geminids fails only the strict peak assertion: 261.99° against the published 261.6°. Correcting that value belongs to T-039, as the Done When allows. `git ls-files data/local` = 0. |

## Issues

None.

## Observations (non-blocking)

1. `ASTRAEUS_SOFT_PEAK=1` in `browser-showers.mjs` turns the peak miss into a recorded result. The default is strict. Keep it only as a diagnostic; T-039's acceptance must use the strict run.
2. The Geminid lit-pixel count is about 228 against the 150 floor. The screenshots show a clearly visible stream, so the thin margin comes from the pixel detector reading 1.6 px aqua dots, not from visibility. A colour-aware or count-based detector would be a sturdier check (O-012 note).
3. The wall-clock fill test in `tests/listedOrbitGroup.test.ts` failed once under load in the builder's run and then passed. This is the same flake as C-030 observation 3; watch it at the Full Objective Check.
4. Drift for T-040: the elements-body record, `extendCatalogue`, and the optional `ExperienceDefinition.catalogue` are architecture. "Planet" is decided by a sphere visual because there is no definition category. PathView's explicit-centre validator still checks only the built-in catalogue.
