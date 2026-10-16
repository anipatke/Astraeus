---
id: C-045
scope: {kind: objective, id: O-011}
result: CLEAR
checked_by: {role: checker, session: o011-orchestrator-check-20261017-morning}
executed_session: o011-builders-2026-10-11-to-17
checked_at: '2026-10-17T07:00:00Z'
health_snapshot: sha256:f56641d260354efa44847d7a9201066bd9f6aed3678747da84cb9cf1a51cb8dd
reviewed:
  base_commit: f29d0fa
  head_commit: 94ee998
  files:
    - src/experiences/showers/showerDefinition.ts
    - src/experiences/showers/showerSettings.ts
    - src/experiences/showers/measuredOrbits.ts
    - src/core/listedOrbitGroup.ts
    - src/core/elementsBody.ts
    - src/core/bodies/swiftTuttle.ts
    - src/assets/sky.ts
    - src/app/SkyView.ts
    - src/app/bodyDraw.ts
    - src/main.tsx
    - data/showers/perseids.json
    - data/showers/geminids.json
    - tools/data/fetch-meteoroid-orbits.mjs
    - tools/validate/public-build-assets.mjs
    - .savepoint/Design.md
  dependencies: [O-010, O-014]
issues: []
supersedes: null
---

# C-045: O-011 Full Objective Check

Scope: O-011 "Run Perseids and a second shower as test fixtures", reviewed at committed HEAD `94ee998` against base `f29d0fa^` (118 `src/` files changed, +8,618 / −1,091). Owned Tasks at check time: T-036, T-037, T-038, T-039, T-040, T-051, T-052, T-053, T-054, T-055, T-056. T-057 and T-058 were moved to O-016 on 2026-10-17 by owner direction (site work filed here before O-016 existed) and are out of this scope. Uncommitted at check time and metadata-only for this scope: Design.md reconciliation, T-065 and findings note edits, AGENTS.md project rule (I-033), records C-044, I-033, O-017, the moved T-057/T-058, and the new unexecuted `tools/validate/browser-lite.mjs`.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first Full Check of O-011)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Criteria:** O-011 Success Conditions 1–12 as amended by the recorded owner decisions in the Objective (2026-10-11 reference-spec and asset-architecture replans: SC 3–5 delivered by O-014 and verified here in the Perseids context; 2026-10-13 T-051 data terms: CAMS and Yale local only; 2026-10-13 dot placement and clump; T-056 2026-10-16: GMN default and shipped; T-060/O-016 2026-10-16: HYG is the shipped star catalogue). Guardrails cited by the Tasks: ARCH-01..03, PROV-01, PROV-02, TEST-01..03, STYLE-01..10. Release gates: configured gates plus the project's scene-affecting full browser run.
2. **Entry points:** `?experience=shower-<name>` mounted through `src/main.tsx` from `data/showers/*.json`; `parseShowerSettings`, `buildShowerDefinition`, `loadMeasuredOrbits`; `createListedOrbitGroup`; `buildElementsBody`; the sky layer (`SkyView`, `src/assets/sky.ts`); the marker rule (`bodyDraw.ts`); the fetch tool `tools/data/fetch-meteoroid-orbits.mjs`; the public-build validator.
3. **Relied-on runtime:** Orb two-body propagation through `TwoBodyAdapter`; VSOP87A planet series (O-014, lazy since I-022); Three.js / R3F; Vite dev and public builds; headless Chromium (SwiftShader) through the donor's playwright-core; JPL Horizons as an independent oracle.
4. **Matrix axes:** success conditions × owned Tasks; input shape for shower settings (normal, missing, wrong type, out-of-range, reversed window, non-finite, unknown key, path escape); environment (dev server, public build, local data present or absent); sizes (desktop, phone); time (inside the 1990–2030 validated span and outside it). Not applicable: text-width classes (no truncation logic in scope), concurrency (single-user client), auth and persistence (none).
5. **Admission boundary:** an Issue must violate an amended Success Condition or a cited guardrail through a supported path (the shipped experiences, their settings files, or the public build).

## Coverage Matrix

| SC / Task | Rule | Evidence | Result |
|---|---|---|---|
| SC1 / T-036 | A window reads as one linked shape; Apollo unchanged | T-036 done with owner `check_waiver` (board); later reshaped under I-019 (`c19aacf`, owner accepted 2026-10-17); `tests/timeline.test.ts`; `browser-synthetic.mjs` and `browser-spike02.mjs` pass in this run | Proven (Task Check waived by owner; behaviour covered by fresh tests and scripts) |
| SC2 / T-037 | Optional camera reach; existing limits unchanged | T-037 done with owner `check_waiver`; `browser-synthetic-belt.mjs` (declared reach) and `browser-synthetic-eccentric.mjs` (51 AU) pass in this run | Proven |
| SC3–5 (O-014) | Sun-centred scenes, paths, solar-system scale, in the Perseids context | C-026 (O-014 Full, CLEAR); `browser-showers.mjs` checkSunEarth (Sun at origin, no Moon, Earth on its path, scale factor stated) passes for both showers in this run; `browser-sun.mjs`, `browser-precision.mjs` pass | Proven |
| SC6 / T-051, T-056 | Stream from measured orbits, traceable; terms respected | C-027 (CAMS terms silent, local only), C-035 (GMN CC BY 4.0, default and shipped); `browser-showers-gmn.mjs` and `browser-public-showers.mjs` pass (25,588 Perseid GMN orbits from the shipped asset; panel credits GMN); public-build validator 0 matches over 13 local sources (`public-build-assets.json`) | Proven |
| SC7 / T-038 | Shower code outside generic code; entry discovers settings by name | C-031; `tests/nameCheck.test.ts`, `tests/layerRule.test.ts` pass in the 906-test run; checker grep of `src/core`, `src/shell`, `src/assets`, `src/app` for shower/meteor/Perseid/Geminid names: only the catalogued body `swift-tuttle` in `src/core/bodies/` (a body definition, accepted in C-030) | Proven |
| SC8 / T-038, T-040 | Perseids to the reference spec; factual checks; performance | C-031 (factual checks: crossing at peak, radiant, traceability), C-028 (owner frame-rate figure); `browser-showers.mjs perseids` passes in this run (5m30s, desktop and phone); checker's independent Horizons probe (below) | Proven for engine evidence; owner look outstanding (below) |
| SC9 / T-039, T-055 | Geminids from configuration and data only | C-033 (zero `src/` change in the T-039 working tree), C-032 (generic settings-defined body); `browser-showers.mjs geminids` passes in this run | Proven |
| SC10 / T-040 | Cross-experience regression; spec walk-through; Design reconciled | C-034; this run: all 22 browser scripts exit 0 with zero console errors in a fresh directory; Design reconciled 2026-10-17 (T-065 evidence; checker spot-checked `ProvenanceSourceType`, `LOCAL_ONLY_TEXTURES`, Jupiter texture against code) | Proven |
| SC11 / T-053 | A real starry sky for every experience, fixed at infinity, cited | C-028; amended by owner to HYG (C-039, O-016); `browser-sky.mjs` passes in this run (every experience, both sizes) | Proven |
| SC12 / T-054 | Small bodies drawn as labelled markers, generic | C-030; `browser-synthetic-eccentric.mjs`, `browser-marker-existing.mjs` pass in this run | Proven |
| T-052 | Listed orbit group, generic, made-up proof | C-029; `browser-synthetic-listed.mjs` passes; `tests/listedOrbitGroup.test.ts` passes | Proven |

### Finite External-Boundary Matrix

| Cell | Classification |
|---|---|
| Configured vs actual target | Dev server on 5451 and `vite preview` of the public build on 5452 from a snapshot of `94ee998`; every script read `ASTRAEUS_URL` (check-run.sh in the evidence directory) — passed |
| Startup, discovery, reuse | Fresh servers per run; shower discovery by glob of `data/showers/*.json` — passed |
| Unavailable dependency | Local data absent → public build serves shipped GMN and reports CAMS "not fetched" (C-035; `browser-public-showers.mjs`) — passed |
| Success / non-success responses | Shipped JSON assets load; validator refuses unlicensed shipped files (C-035, `tests/publicBuild.test.ts`) — passed |
| Redirect | Not applicable: static assets, no redirects in scope |
| Timeout, cancellation | Browser scripts carry explicit waits; none timed out in this run — passed |
| Malformed response | Malformed settings refused by name (probes below); malformed orbit rows covered by `tests/showersMeasured.test.ts` — passed |
| Retry, cleanup, partial effects | Fetch tool writes under git-ignored `data/local/` only (C-027 workflow review) — passed by cited evidence, not re-run |
| Secret-safe failure output | Not applicable: no secrets in scope |

### Workflow And Side-Effect Lock

The only multi-step writing workflow in scope is `tools/data/fetch-meteoroid-orbits.mjs` (download, filter by IAU code, write per-shower files, optional `--ship` copy to `data/stories/`). Its operation order, failure owners and the licence gate on `--ship` were reviewed in C-027 and C-035; this run did not re-run it (no network fetch of CAMS or GMN). The shipped copy's integrity is checked by the public build loading 25,588 orbits. Classification: passed by cited evidence. All other scoped paths are read-only at runtime.

### Matrix Completion Lock

Every cell above is classified. No Issue was found, so no follow-on cells were needed.

## Adversarial Pass and Independent Probes

Run by the checker in this session; the temporary probe files were deleted after use and are not in the tree.

1. **Comet against JPL Horizons at dates outside the test fixture** (Horizons API, `DES=109P;CAP`, heliocentric ICRF vectors, fetched 2026-10-17): 2026-08-12, miss 9.38 million km, 0.146% of its 42.94 AU distance. That is inside the stated 1990–2030 maximum (0.857%, `SWIFT_TUTTLE_MAX_ERROR_FRACTION`). At 2126-07-01 and 1862-01-01 the two-body model misses by 232% and 286% of distance: outside the validated span, as `SWIFT_TUTTLE_LIMITATIONS` states ("Positions before 1990 or after 2030 were not compared with Horizons"). The shower timelines stay inside a single year near 2027, so no supported path reaches the unvalidated span. The Swift–Tuttle story panel's 2126 return is badged `modelled` (owner, 2026-10-17).
2. **Malformed shower settings** (`parseShowerSettings`, Perseids and Geminids): missing id, empty object, peak instant as text, peak outside the activity window, start after end, negative peak rate, non-finite radiant, unknown stream source, and a panels path outside `data/stories/` are each refused with a named `ShowerSettingsError`. The unmodified files parse. An unknown top-level key is silently accepted (observation 1).
3. **Bypass of the name rule:** grep of generic folders, as in SC7.
4. **Public build bypass:** validator reports 0 local-data matches over 13 sources and 52 files. `?source=cams` in a public build falls back to the shipped source (C-035, `browser-public-showers.mjs`).

## Verify File Reality

Every file in `reviewed.files` exists at `94ee998`. Task evidence paths spot-checked through the T-065 link check (67 paths, 30 commits, 25 Checks, 0 missing) and C-044's independent re-run.

## Gates

Fresh full run from a snapshot of committed `94ee998` (`docs/evidence/objective-check-20261016T190443Z/`, `check-run.sh`, `summary.txt`), 2026-10-16 19:04:43 to 19:43:17 UTC:
- typecheck exit 0; `npx vitest run` 49 files, 906 passed, 1 skipped; `npm run build` and `ASTRAEUS_PUBLIC_BUILD=1 npm run build` exit 0; `public-build-assets.mjs` ok, 0 matches.
- `browser-public-showers.mjs` against `vite preview` of the public build: passed for geminids and perseids, `consoleErrors: []`.
- 22 browser scripts against the dev server, each exit 0, written only under the run directory. The summary's error counter shows 1 for `showers-gmn` and `story-panels`; the matched lines are "ok, zero console errors" and "ok  zero console errors" (counter false positives, read in the logs).
- `git diff --check` not applicable to the committed snapshot; the working-tree edits are records and docs.

## Code Health

`savepoint health check O-011 .` after the gate and a junit plus coverage test run (906 passed): snapshot `sha256:f56641d260354efa44847d7a9201066bd9f6aed3678747da84cb9cf1a51cb8dd`, "Code Health does not block clearance". Repository dirty with the metadata-only edits listed above plus the unexecuted `browser-lite.mjs`. Signals (observations, not Issues):
- Complexity: highest 138, `LayeredRender` in `src/app/AstraeusScene.tsx:169` (the next highest is `validatePathSpec` at 45, `src/app/experienceDefinition.ts:311`); 46 functions over 10. Input to O-017.
- Duplication 40.2% of lines, dominated by repeated evidence JSON under `docs/evidence/` and generated data (for example `data/apollo11/generated/validation.json` against `docs/evidence/o004-independent-check.json`); the health config does not exclude evidence folders, so the figure overstates source duplication. Input to O-017.
- Coverage 77.9% statements (median 84.5%); vulnerabilities 0; failing tests 0.

## Parallel Planning Advice

The Objective's lane keys and the moved Tasks' manifests were advisory; not evaluated (not an acceptance feature).

## Issues Pass

| SC | Classification |
|---|---|
| 1, 2 | Proven (owner-waived Task Checks; behaviour covered by fresh tests and scripts) |
| 3, 4, 5 | Proven (O-014, C-026; Perseids context in this run) |
| 6, 7, 9, 10, 11, 12 | Proven |
| 8 | Proven for the engine evidence; the owner's side-by-side look is an owner validation, below |

No Issues. No materiality actions are required.

## Owner Validation Still Needed

- T-040 (`owner_validation.required`): the owner's run-sheet look (T-040 DW5), including the Perseids side by side with meteorshowers.org (SC8's separate owner requirement).
- T-056 (`owner_validation.required`): the owner's look at the GMN Perseids.
- O-011 closes only after every owned Task is done; T-040 and T-056 are at `audit`.

## Observations (non-blocking)

1. `parseShowerSettings` ignores unknown top-level keys, so a misspelt optional setting is silently dropped. Candidate for O-017 if settings files grow.
2. O-017 (planned, owner decisions 2026-10-17) will strip CAMS and Yale. This Check's SC6 and SC11 evidence includes the local-only paths that O-017 removes; that later removal does not reopen this Check, but O-017's Full Check must re-prove the shipped GMN and HYG paths.
3. The router selection was found cleared (`objective: none`, `task: none`) at 2026-10-16T19:28:39Z while this Check ran; this checker did not edit it. Reported to the owner.
4. Health duplication and complexity signals above.

## Code Style Review

- [ ] STYLE-01 **One job per file** — `src/app/AstraeusScene.tsx` (575 lines) holds scene layering, camera, groups and markers.
- [ ] STYLE-02 **One job per function** — `LayeredRender` has cyclomatic complexity 138 (`src/app/AstraeusScene.tsx:169`).
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — O-011's range adds 8,618 `src/` lines across 118 files, several Task commits over 1,000 lines.
