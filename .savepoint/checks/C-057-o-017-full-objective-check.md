---
id: C-057
scope: {kind: objective, id: O-017}
result: CLEAR
checked_by: {role: checker, session: o017-orchestrator-check-20261017}
executed_session: o017-builders-20261017
checked_at: '2026-10-17T22:40:00Z'
reviewed:
  base_commit: 4f10505
  head_commit: f44409b
  files:
    - every file changed between 4f10505 and f44409b (734 paths, most of them evidence; code under src/, tests/, tools/, data/showers/, data/stories/, index.html, assets.html, app.html, site/, README.md, docs/)
  dependencies: ['C-047 T-066', 'C-048 T-067', 'C-049 T-068', 'C-050 T-069', 'C-051 T-070', 'C-052 T-071', 'C-056 T-072', 'C-053 T-073', 'C-054 T-074', 'C-055 T-075', 'T-076 owner waiver']
health_snapshot: sha256:82de87f599d188740561b82f2034685aacf7c0720df5e0b51f9c1bf490836643
issues: []
supersedes: null
---

# C-057: O-017 Full Objective Check

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not applicable: O-017 ran sequentially except T-073 and T-074 lanes, merged before this Check)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (two load-related browser failures re-run alone; below)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

O-017 Success Conditions 1–8, its Architectural Considerations, Owner Decisions 1–8, and the owner-added Tasks (T-073 shower stutter, T-074 five demos on the home page, T-075 dot positions on the graphics chip, T-076 owner's card pictures). Reviewed on `o017-simplify` from `4f10505` (spike-04 merge) to `f44409b`. Out of scope: the O-018 and O-019 lane work (T-077, T-078), not merged into this branch.

## Fresh full gate

Run on commit `f44409b`, node v24.16.0, 2026-10-17T04:01Z, evidence `docs/evidence/o017-objective-check-20261017T040127Z/`:

- `npx tsc --noEmit` exit 0; `npx vitest run` 55 files, 919 passed, 1 skipped (frame-time assertions behind `ASTRAEUS_PERF=1`, T-071); `npm run build` exit 0; public build exit 0; `public-build-assets.mjs` exit 0 (licence gate, synthetic exclusion, load budget).
- `tools/validate/run-full.sh` (trimmed full run, 593 s): every step exit 0 with zero console-error lines except `spike02` (a 30 s click timeout) and `showers-perseids` (the loop-wrap sample missed the wrap), both while the machine load average was 15–32 (other work and the owner's household use). Re-run alone on the same tree (dev server on 5302, load about 7): `browser-spike02.mjs` exit 0 (158 s), `browser-showers.mjs perseids` exit 0 (294 s), zero console errors (`rerun-*.log`). The same scripts passed in the T-072 and T-075 full runs on equivalent code. Classified as load flakes, not defects.
- Pictures against the owner-approved baseline `o017-baseline-20261017`: 20 pictures, 8 identical, max 0.0177% over 16 levels (tolerance 0.024%).

## Coverage matrix

| Condition | Result | Evidence |
|---|---|---|
| SC1 CAMS and Yale gone | Proven | C-048; checker grep of the public build for `cams-iau`, `yale-bsc`: 0 files; local CAMS/Yale data deleted on owner instruction. |
| SC2 two switches gone | Proven | C-049; public build grep `skymap`, `single-sun`, `sunLight`: 0 files; `browser-lighting.mjs`, `browser-sky-map.mjs` removed with mapped scenarios; up, orbit quality, timeline span kept. |
| SC3 made-up experiences out of the public build | Proven | C-049; validator synthetic check ok; public build grep `syntheticRing`, `synthetic-belt`: 0 files; lite on the dev server opens all six. |
| SC4 owner-picked simplifications | Proven | C-050 (C1–C5, C7, C8 done; `src/` duplication 63 to 13 lines; functions over CCN 20 from 5 to 3). |
| SC5 load budget enforced | Proven | C-051 (mutation probe fails the build); budget passes on the final tree; textures kept at original quality (Owner Decision 7). |
| SC6 browser checks cut down | Proven, better than target | C-052; full run 37 min 56 s to 9–10 min; lite negative probe; one-off tools and briefs archived. |
| SC7 nothing visible changed, owner look | Proven with owner-accepted differences | Every real experience compared at both sizes (C-056). Intended differences: shower dots near the Sun now on their true curved paths (T-075, owner accepted the new baseline in C-055); site pages (five demo cards, owner's pictures, removed CAMS/Yale/NASA rows). Owner looked at the final contact sheet and numbers: "Done". |
| SC8 numbers reported | Proven | `docs/O017_RESULTS.md` (C-056). `src/` grew 680 lines (file splits and the GPU dot path), stated plainly. |
| Arch: no engine contract change | Exception, owner-directed | `ScalePolicy` gained an optional `linearUnitsPerKm?` and `PointGroup` gained optional `fillPositionsRangeKm?` and `keplerElements?` (T-073, T-075). Additive and optional; every existing implementation compiles and behaves as before (tests). They arrive with the owner's decisions "It will need to run on phones and laptops, we should optimise for that" and "use the graphics chip", which went beyond the removal-only consideration. Recorded here as owner-directed scope, not a silent contract change. `State`, `Trajectory`, `Provenance`, `TimelineEvent` unchanged. |
| Arch: story data outside the engine | Proven | Showers, cards and titles come from data and definitions; no experience names in shell or core (C-050, C-051, C-054). |
| Arch: validator keeps proving nothing local-only ships | Proven | Validator self-proof and synthetic self-proof pass; production reads only shipped orbit copies (`measuredOrbits.ts` `import.meta.env.PROD` branch). |
| Arch: look-and-feel numbers stay settings | Proven | `look.refillSliceMs` is a settings field (T-073). |
| Owner-added T-073/T-075 shower smoothness | Proven on desktop; phone improved, real-phone look owed | C-053, C-055: desktop long frames gone for both showers; Geminids at 4x throttle about 3 to 15 frames a second (software GL). |
| Owner-added T-074/T-076 home page | Proven, owner accepted | C-054 and the T-076 owner waiver; five addresses asserted by test and lite. |

## External boundaries

Public build (licences, data, budget): checked. Owner's portfolio embed addresses (`app.html`, `?experience=shower-perseids`, `shower-geminids`, `earth-moon`, `jupiter-io`): all five asserted on the home page by `tests/homePage.test.ts` and lite. The live site and its Vercel build are untouched by this Check.

## Adversarial pass

1. Public build grep for removed names and the old title "Earth–Moon spike": 0 files each.
2. Public build grep for `data/local`: three hits. In the loader it is the dev-only URL; the production branch never requests it. In both shipped GMN files it is a sentence of the files' own provenance note ("data/local/ is still git-ignored; whether to ship a subset is an owner…"), stale since the shipping decision. Not a leak of local data; observation 2.
3. Contract diff `4f10505..f44409b` on `src/core/scalePolicy.ts` and `src/core/pointGroup.ts`: only the optional members above.
4. Load-related browser failures re-run alone: pass (above).

## Design reconciliation

T-072 reconciled Design.md with every O-017 Drift Note and Check observation (C-056 DW3): components map, lighting, sky, shower builder, GMN-only orbits and column layout, points layer (slicing, GPU blend, Kepler on GPU, fallback, epoch rebasing), public site, current state.

## Code health

Snapshot `sha256:82de87f599d188740561b82f2034685aacf7c0720df5e0b51f9c1bf490836643` (`savepoint health check O-017 .`): no blocking finding; complexity, duplication and dependency vulnerabilities report no finding; coverage and JUnit evidence reported stale (optional, not wired to this gate).

## Issues Pass

No new Issues. I-034 (shower dots jump) is repaired by T-073 and T-075 and can be resolved by a Check or the owner once the real-phone look is done. I-033 (lite tier) proof is met (C-052) and can be resolved.

## Materiality

No blocking findings. The contract extension is owner-directed and recorded. The two browser failures were load flakes, re-run clean.

## Observations (non-blocking)

1. A real-phone look at the showers is owed once a preview link or the live site carries this build.
2. Both shipped GMN files carry a stale provenance sentence about `data/local/`; correct it in the fetch tool's provenance text at the next data refresh.
3. Merging `o017-simplify` to `main` publishes it: the live site builds from `main` on Vercel. The release order recorded with the owner said no deploy before O-018, O-019 and O-020; the owner said "I will check this on the live site once this is merged", so the merge is the owner's release decision.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
