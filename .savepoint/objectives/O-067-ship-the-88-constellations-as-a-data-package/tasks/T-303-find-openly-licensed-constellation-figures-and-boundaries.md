---
id: T-303
title: Find openly licensed constellation figures and boundaries
objective: O-067
status: done
depends_on: []
owner_validation: {required: true}
check_waiver: {task: T-303, reason: 'Owner said "orchestrate O67" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o067-run-20261110}, recorded_at: '2026-11-10T08:21:23Z'}
planned_by: {role: planner, session: o067-planning-20261110}
---

# Find openly licensed constellation figures and boundaries

## Outcome

A research note names the candidate sources for the 88 constellations' stick figures, IAU boundaries and names, with each licence confirmed from its primary source, how well each figure set fits the engine's star list, and a recommendation the owner can choose from.

## User Check

Read the note `docs/architecture/constellations-o067.md` and choose the figure set (and confirm the boundary and name sources), or ask for more.

## Done When

- The note compares at least three figure-set candidates (for example Stellarium's modern sky culture, the IAU/Sky & Telescope figures, d3-celestial or another openly licensed set), each with: licence and its exact wording and URL (read from the primary source, not a secondary page), attribution required, whether ends are HIP numbers or positions, coverage (all 88?), file format, size, and maintenance.
- For each HIP-based candidate: the count of figure stars missing from the engine's star list (V <= 6.5, `packages/astraeus/src/assets/stars/hyg-v42-naked-eye.json`, fifth column) and of HIP numbers absent from HYG v4.2, computed by a script kept in the scratchpad and summarised (commands and results) in the note.
- Boundaries: the source of Delporte's boundaries in J2000 (for example CDS VI/49), licence, point density, size, and how the outlines close; names and abbreviations: an IAU source and licence.
- The estimated package size (packed and unpacked) for the recommended choice.
- A recommendation with reasons, the owner's decision recorded in the note and in the Objective once given (DATA-01, PROV-02).
- No data is added to any package in this step.

## Context Files

`.savepoint/objectives/O-067-ship-the-88-constellations-as-a-data-package/Objective.md`, `packages/astraeus/src/assets/sky.ts`, `packages/astraeus/src/assets/stars/hyg-v42-naked-eye.json` (read by script only), `packages/astraeus-data-pluto/package.json`, `packages/astraeus-data-pluto/NOTICE`, `docs/architecture/planet-accuracy-o063.md` (as a note format example).

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (Sky figures, O-065) and `Components/Codebase Map` (the data packages).

## Guardrails

PROV-01, PROV-02, DATA-01, ARCH-01.

## Implementation Plan

1. Read each candidate's licence on its primary page or repository; record exact wording and links.
2. Download candidate figure files into a fresh scratchpad folder (untrusted data; scripts kept outside it, Python with `-I`); count endpoints, coverage and engine-list matches.
3. Do the same for boundaries and names.
4. Write the note with a comparison table and a recommendation; leave the owner's choice pending.

## Boundaries

No package, importer or engine change; no data committed outside the note.

## Technical Verification

Research only: the note's counts are reproducible from the recorded commands. No gate run is needed beyond `npm run lint` if any repository file other than the note changes (none should). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Builder session o067-run-20261110 (T-303), 2026-11-10. Research only; owner validation pending (User Check: read the note and choose).

**Deliverable:** `docs/architecture/constellations-o067.md`.

**Per criterion:**
- Three or more figure sets compared with licence wording and URL from the primary source, attribution, end type, coverage, format, size and maintenance: done for five (Stellarium Modern (IAU), Modern, Modern (S&T), d3-celestial, dcf21 IAU), plus the IAU/S&T charts themselves (images only, CC BY 4.0, archived IAU page) and Stellarium Rey for reference.
- HIP coverage per set, computed by a scratchpad script: Modern (IAU) 745 end stars, 744 in the engine list, 1 missing (HIP 55203 xi UMa: HYG v4.2 has the star without a HIP, so the engine list holds it with hip 0); Modern 710/708, 2 missing (HIP 33165 CMa V 6.65, HIP 30665 Mon V 6.60, both in HYG, fainter than 6.5); Modern (S&T) 745/744 (55203); dcf21 IAU 742/741 (55203); d3-celestial is positions, all 757 ends within 0.05 deg of an engine star.
- Boundaries: VI/49 (Davenhall & Leggett 1989, Delporte 1930), licence wording (ReadMe states none; VizieR Rules of usage quoted), point density (B1875 1,565 corners; J2000 12,948 points, 1,533 O / 11,415 I), closure (B1875 one ordered run per code, 89 codes incl. SER1/SER2). Finding: the current J2000 `bound_20.dat` (CfA mirror, 2024-07-23) is RA-sorted, not in outline order; recommended method interpolates and precesses `bound_18.dat`. Names: IAU table, web texts CC BY 4.0 (archived copyright page quoted).
- Package size estimate: 249 KB raw / 92 KB gzip data; about 100-110 KB packed, 280-300 KB unpacked.
- Recommendation with reasons: in the note. Owner decision section left pending; to be recorded in the note and the Objective once given.
- No data added to any package: only the note and this Task / the Objective status changed.

**Commands** (scripts in `/tmp/claude-1000/-home-user-code-Astraeus/685f214b-36b0-48dd-866e-e9470f0d5e93/scratchpad/o067/scripts/`, downloads in sibling folders, `python3 -I`, paths as arguments): `coverage.py` (output `coverage-out.txt`), `agree.py` (`agree-out.txt`), `bounds.py` (`bounds-out.txt`), `size.py` (`size-out.txt`); downloads by `curl` from raw.githubusercontent.com (Stellarium master, d3-celestial master, dcf21 master), vizier.cfa.harvard.edu (VI/49), astronexus.com (HYG v4.2), web.archive.org (IAU pages, VizieR rules). Source commits: Stellarium modern_iau `dc5679c9` (2026-06-18), modern `daace2ad` (2026-03-05), d3-celestial `7e720a3d` (2022-07-05), dcf21 `75d29c20` (2025-02-22).

**Unreachable:** cdsarc/vizier/cds.unistra.fr (timeouts and refused connections; the CfA mirror and the archive were used), pbarbier.com (406), live iau.org constellations and copyright pages (404 on the new site; archive copies used).

**Files read:** router, this Task, Objective, `agent-skills/savepoint-task/SKILL.md`, Context Files (`packages/astraeus/src/assets/sky.ts` by grep for `StarRow`; `SkyFigureInput` read from its own file via grep, extra read logged below; star list by script; `packages/astraeus-data-pluto/package.json` and `NOTICE`; `docs/architecture/planet-accuracy-o063.md`).
**Extra reads (logged):** `SkyFigureInput` declaration (located by grep under `packages/astraeus/src`, its interface only) to confirm boundary rings close implicitly and figures take pairs of ends; `tools/check-packs.mjs` (grep for the limit table) to compare the size estimate with the pluto package's limits.
**Files changed:** `docs/architecture/constellations-o067.md` (new); this Task (status, stage, evidence); Objective `status: planned` to `in_progress`.
**Gates:** none run. Technical Verification needs `npm run lint` only if a repository file other than the note changes, and none did.

**Limitations:** licences were read but not judged legally (VI/49 states none; the CC BY-SA 4.0 Stellarium edges fallback is offered). The size is estimated from stand-in data (VI/49 J2000 point count), not the future importer's output. It is not known whether the RA-sorted `bound_20.dat` order is only on the CfA mirror, because Strasbourg could not be reached. No visual check that Modern (IAU) matches the IAU charts beyond the edge-agreement counts (93 per cent shared with the independent dcf21 transcription; 756 of 757 with S&T).

## Drift Notes

- Build steps: the Modern (IAU) file has 4 zero-length and 87 repeated steps, which the import tool must drop. Xi UMa (HIP 55203) must be a position end. Serpens needs two boundary figures, because `SkyFigureInput` boundaries hold one ring. The J2000 boundaries should be generated from the B1875 corners (interpolate 1 deg, precess), not read from the RA-sorted `bound_20.dat`. Non-architectural for Design.md unless the Serpens two-figure choice changes the package's public helper; account for it in the integration step.

Owner validation 2026-11-10 (coordinator session o067-run-20261110): after reading the choices, the owner chose "Official IAU drawing" (figures: Stellarium Modern (IAU), CC BY-SA 4.0) and "Stellarium's copy" (boundaries: Stellarium's Delporte corners, CC BY-SA 4.0); recorded in the note's Owner decision section and the Objective. Coordinator marks T-303 done under the standing run rules.
