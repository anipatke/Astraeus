---
id: C-186
scope: {kind: objective, id: O-076}
result: NEEDS WORK
checked_by: {role: checker, session: check-o076-20261116}
executed_session: plan-o076-20261116
checked_at: '2026-11-16T10:10:06Z'
health_snapshot: sha256:152ef11c8c964a088e1a6792f792b8c9400ff23aca0777efec34fe64545659c0
reviewed:
  base_commit: deafd4c9
  head_commit: a6ccb200
  files: [packages/astraeus-data-constellations/src/finder.ts, packages/astraeus-data-constellations/src/index.ts, packages/astraeus-data-constellations/tests/finder.test.ts, packages/astraeus-data-constellations/README.md, packages/astraeus-data/src/milkyWay.ts, packages/astraeus-data/src/pictures.ts, packages/astraeus-data/package.json, packages/astraeus-data/README.md, packages/astraeus-data/CHANGELOG.md, packages/astraeus/CHANGELOG.md, packages/astraeus/api-surface.lock.json, packages/astraeus/tests/milkyWaySource.test.ts, packages/astraeus-site/tests/measureExample.test.ts, examples/hello-sky/src/main.js, tools/build-example.mjs, tools/check-node-consumer.mjs, tools/measure-example.mjs, tools/measure-example.d.mts, docs/release-notes-0.9.2.md, .savepoint/Design.md]
  dependencies: []
issues: [I-180]
unmet: [T-322-DW1, T-322-DW2, O-076-SC4]
supersedes: null
---

# C-186: O-076 Full Objective Check

Fresh session; I did not plan, build or coordinate O-076 or T-320..T-322. Diff `git diff main...HEAD` (merge base deafd4c9, HEAD a6ccb200, branch `o076-constellation-data-and-0-9-2-notes`). All three Tasks are `done` with owner check waivers (plan-o076-20261116, 2026-11-16T09:29:54Z); this integration Check reviews each of them. As asked for G-020's last Objective, the 0.9.2 release notes and the `Unreleased` CHANGELOG sections were also checked against the code.

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (n/a: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. Criteria: O-076 SC1-SC5; T-320 Done When (finder, containment and edge rule, tests, `outlineLabel`, docs); T-321 Done When (own module, subpath in both export maps, packed hello-sky proof, Node consumer, docs); T-322 Done When (DW1 changelogs complete and accurate, nothing claimed the code does not do; DW2 release notes in the 0.9.1 shape, every claim maps to a CHANGELOG line; DW3 no bump/tag/publish). Guardrails ARCH-01, PROV-01/02, API-01, API-04, API-07, TEST-01..03. Gates: full gate, lint, typecheck, build, check:engine-alone, check:pack, check:node-consumer, measure:example (four examples), Code Health, one check:browser.
2. Entry points: `constellationFinder()` and its returned function; `buildMatcher`/`buildFinder` (internal, tested); `constellations(..., { outlines, outlineLabel })`; `astraeus-data/milky-way` (`milkyWaySource`, source and packed `dist` export maps); `dataSource`/`PICTURES`; `tools/measure-example.mjs` `unexpectedPictures`/`ALLOWED_PICTURES`; `tools/build-example.mjs` EXTRA_PACKAGES; `tools/check-node-consumer.mjs`; docs (`docs/release-notes-0.9.2.md`, both `Unreleased` sections, both READMEs).
3. Relied-on runtime: `loadBoundaries()` JSON import; engine `mergePictures` over every `data` source by picture name (`api/assembleScene.ts:143`, `assets/sky.ts:206`), so the source's name does not matter; Vite asset emission in the packed hello-sky build.
4. Axes and cells: see matrix. Not applicable: environment/output sinks (no CLI output beyond the measure line), text classes (labels pass through unchanged; no width/truncation in scope), serialization round trips (no new serialized form).
5. Admission: an Issue must break a criterion or guardrail above through a supported public path, in O-076's diff, with a credible consequence.

## Coverage Matrix

| # | Surface | Cell | Result | Evidence |
|---|---|---|---|---|
| F1 | finder | named stars, builder's table (24 rows) | pass | `finder.test.ts` in full gate |
| F2 | finder | 48 further bright stars not in the builder's table (Aldebaran, Regulus, Deneb, Canopus, Achernar, Acrux, Alpheratz (And, at the And/Peg corner), Rasalhague (Oph), Thuban, Errai (Cep), sigma and delta Oct, Miaplacidus, Atria, ...) | pass, 48/48 | independent probe (below) |
| F3 | finder | poles: dec +/-89.9 and +/-90 at 50 RAs each | pass (UMi / Oct) | probe |
| F4 | finder | seam: RA 0 / 359.99 at 4 decs; RA +/-360, +720000; RA -0 | pass | test + probe |
| F5 | finder | Sun's path, 13 dates incl. Oph (engine `stateOf`) | pass | test |
| F6 | finder | whole-sky grid > 15000 points: exactly one enclosing loop, every one of 88 hit | pass | test |
| F7 | finder | boundary: 12 shared vertices (3+ owners) and the RA+360 twin | pass, alphabetically first | test |
| F8 | finder | boundary: great-circle midpoints of every 37th shared segment (2 owners) | pass: one of the owners, the alphabetically first, stable on repeat | probe |
| F9 | finder | bad input: dec 90.01, -91, NaN, "7", RA Infinity, NaN, missing, 5, null | pass, RangeError naming field | test |
| F10 | finder | cache: same promise on repeat; failed load clears the cache | pass (code read `index.ts` `finder ??=`, reject handler resets) | test + read |
| L1 | outlineLabel | all 88 with outlines: called once per outline (89 incl. two Serpens), result applied, figures untouched | pass | probe |
| L2 | outlineLabel | outlines false: never called | pass | probe |
| L3 | outlineLabel | non-function, empty, number, undefined result | pass, RangeError | test |
| L4 | outlineLabel | absent: labels as 0.9.1 | pass | test (existing tests unchanged) |
| M1 | milky-way | source holds only `milky-way`, `provides: []`, same record (licence) as `PICTURES` and `dataSource` | pass | `milkyWaySource.test.ts`, node-consumer |
| M2 | milky-way | `exports` and `x-publish.exports` both list `./milky-way`; packed hello-sky has `node_modules/astraeus-data/src/milkyWay.{js,d.ts}` | pass | read + build output |
| M3 | milky-way | packed hello-sky emits no astraeus-data picture but `milky-way` | pass ("pictures: only milky-way emitted"; `dist/assets` jpgs = engine 2k maps + `milky-way-afB88TpF.jpg`) | measure:example |
| M4 | measure check | planted `titan-4k-Ab12Cd34.jpg`, nested `venus-8k-balanced-*.jpg`, root `io-2k.jpg` reported; real dist clean | pass | probe on a scratch copy |
| M5 | milky-way | engine draws it from any source by name | pass (structural: `mergePictures` by name) | read |
| M6 | milky-way | browser: hello-sky runs with the source, no error lines | pass | check:browser |
| D1 | docs | constellations README and astraeus CHANGELOG entries vs finder/outlineLabel code | pass | read |
| D2 | docs | astraeus-data README and CHANGELOG vs code | pass | read |
| D3 | docs | release-notes bullets each map to an `Unreleased` CHANGELOG line (17 bullets) | pass | read |
| D4 | docs | release-notes summary and Upgrading claims vs code | **Issue I-180** | below |
| D5 | docs | `Unreleased` lines for O-073..O-075 vs code (spot reads: sheet 30-85 default 50 `phoneLayout.ts:31,40`; `closeAfterSeconds` `core/storyPanels.ts:156-180`; fractional refusal `badTime.test.ts:50-57`); the O-073..O-075 lines were already proven by C-181, C-182, C-185 | pass | read |
| D6 | release | no version bump, tag or publish; peers `>=0.9.0 <0.10.0` on all 7 data packages | pass | `package.json` reads, `git tag` (last v0.9.1) |

External boundary (browser runner, Vite build, npm pack in examples): configured and actual target the packed tarballs (M2); startup, failure and cleanup belong to existing tooling unchanged by O-076 except the extra package; a failed picture check throws (exit non-zero) after the measure is printed. Other cells not applicable (no network or retry in scope).

Workflow lock (`measure-example.mjs` main): build example -> measure -> picture check -> throw on extra. Failure before measure is the build's; the picture check is fatal and names the files; no side effects beyond `dist`. Oracle: directory listing (M3), planted files (M4).

## Acceptance Classification

- O-076 SC1 (finder): **Proven** (F1-F10).
- O-076 SC2 (`outlineLabel`): **Proven** (L1-L4).
- O-076 SC3 (Milky Way subpath; `dataSource`/`PICTURES` unchanged): **Proven** (M1-M6).
- O-076 SC4 (changelogs and release notes ready): **Issue** — I-180 (D4). Changelogs: Proven (D1, D2, D5).
- O-076 SC5 (additions only, peers, gates): **Proven** (D6, gates).
- T-320 all Done When: Proven. T-321 all Done When: Proven. T-322 DW1/DW2: Issue I-180 (the notes claim more compatibility than the code gives); DW3: Proven.

## Issues

- **I-180** — `docs/release-notes-0.9.2.md` lines 5 and 41 say "nothing needs a change", but the `Changed:` CHANGELOG line (`packages/astraeus/CHANGELOG.md:16`) and the code (`core/storyPanels.ts` `atOf` via `isUtcUnixMs`; `tests/badTime.test.ts:50-57`) refuse a fractional or out-of-range panel `at.time`, anchor `time` or `shownDuring` end that 0.9.1 accepted (`v0.9.1` `storyPanels.ts:124-125`, `Number.isFinite` only). Expected: the notes name the refusal as the one upgrade change. Violates T-322 DW1/DW2, O-076 SC4, API-07.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-180 | Low (needs a non-whole millisecond time, e.g. a panel placed at a computed fraction of a span) | Medium (that app's `mount` throws after an upgrade the notes call safe) | Low | Fix now: one or two sentences in the notes' intro and Upgrading; no code change. Or the owner accepts the Issue. |

## Gates

Run once each, this session, on HEAD a6ccb200 with the working tree clean apart from untracked evidence/snapshot files.

| Gate | Result | Time (limit) |
|---|---|---|
| `npm run check:gates -- lint typecheck build test:full check:engine-alone check:pack check:node-consumer` (10:01:04Z-10:03:18Z) | all passed, 0 over limit | total 134 s |
| lint | pass | 4.4 s (15) |
| typecheck | pass | 6.4 s (20) |
| build | pass | 2.4 s (15) |
| test:full (coverage + junit) | pass: 265 files, 4049 tests, 0 failures, 2 skipped | 71.9 s (105) |
| check:engine-alone | pass | 24.9 s (40) |
| check:pack | pass | 17.7 s (30) |
| check:node-consumer | pass (includes the `astraeus-data/milky-way` Node import) | 6.3 s (15) |
| measure:example hello-scene / hello-react / hello-planets / hello-sky | all exit 0; first-open 1,773,029 / 1,770,047 / 1,771,140 / 1,775,626 B raw (510,085 / 506,360 / 509,222 / 511,211 gzip); hello-sky "pictures: only milky-way emitted" | 3.2 / 3.3 / 3.2 / 5.2 s |
| `git diff --check main...HEAD` | clean | |
| Independent probe (`packages/astraeus-data-constellations/tests/zzCheckC186Probe.test.ts`, run with `npx vitest run`, then deleted) | 4/4 pass | 0.4 s |
| `npm run check:browser` (once, alone, 10:04:28Z-10:09:41Z) | exit 0, every step exit 0, error-lines 0 | total 313 s (320) |

Browser steps: smoke 119 s (170), smoke-public-showers 14 s (30), planets-phone 9 s (25), meteor-shower 20 s (40), views 21 s (40), look-out 63 s (75), hello-scene 14 s (25), hello-react 4 s (12), hello-planets 6 s (15), **hello-sky 22 s (15, WARNING, not failed)**, public-build-assets 1 s (8), public-addresses 0 s (5). Evidence: `docs/evidence/browser-20261116T100428Z/`.

## Code Health

`savepoint health check O-076` after the full gate (10:03:36Z): snapshot `sha256:152ef11c8c964a088e1a6792f792b8c9400ff23aca0777efec34fe64545659c0` (created); "Code Health does not block clearance". Complexity, coverage, dependency vulnerabilities, duplication and tests: optional, reported only, no blocking finding.

## File Reality

Every file named in the three Tasks' evidence and drift notes exists at HEAD. T-320's planned `packages/astraeus-data-constellations/CHANGELOG.md` was never created; recorded as a deviation (the entries live in `packages/astraeus/CHANGELOG.md`), accepted by the coordinator. No phantom files.

## Design Reconciliation

Commit a6ccb200 updated the Codebase Map rows for `packages/astraeus-data/`, `packages/astraeus-data-constellations/` and `examples/hello-sky/`; they match the code. The T-320 and T-321 drift notes are reflected there. `Public API shape` holds principles, not a list of names, so not naming `constellationFinder` there is consistent. Observation: `### Constellations` item (4) still lists the helper's options without `outlineLabel` and does not mention the finder; the map row covers both.

## Owner Decisions Assessed

- O-076 D1-D3: the code follows them (one load then a synchronous function; an optional `outlineLabel`; a subpath in the same package).
- O-073 "Keep refusing" fractional panel times: the code follows it. I-180 is about the notes' wording, not this decision.
- T-322 owner read of the notes, 2026-11-16T10:00:24Z ("ready, carry on"; heading stays `Unreleased`; repeated Milky Way entry kept): those choices hold and are not findings. The read is recorded in the Drift Notes, not as a structured `owner_validation.accepted_check` (no Check existed then). Whether to keep the read once I-180 is fixed, or record acceptance against a later Check, is the owner's decision.

## Owner Validation Still Needed

- T-322 (`owner_validation.required: true`): the owner's reading of the corrected notes, or an `accepted` resolution of I-180.
- Looks: hello-sky now draws the Milky Way. The browser step does not read the sky's Milky Way readout, only that the example runs with no error lines; whether it looks right is for the owner on the preview (`localhost:5490`).

## Observations (non-blocking)

- hello-sky's browser step took 22 s against its 15 s limit (warning only). It is not new with O-076: the step already took 19-22 s in runs before this branch (for example 22 s at 04:42 and 09:31 in earlier evidence folders). Per build.md, look at why before raising the limit.
- `finder.test.ts` comment on the Sun's dates says "Cap to Jan 19" and "Sgr Dec 18-Jan 18"; the wording is muddled but the dates tested are well inside each stretch.
- The edge rule returns the first loop within 1e-9 rad of an edge in alphabetical order. Where neighbours' densified vertices differ, which loop wins at 0.2 mas is a matter of rounding. The rule is documented, so this is not material.
- Design `### Constellations` (4) is not updated for `outlineLabel` and the finder (see Design Reconciliation).

## Code Style Review

- [x] STYLE-01 **One job per file** — finder in its own `finder.ts`; Milky Way record in `milkyWay.ts`.
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches** — bad inputs, edges, poles, seam, grid, label errors.
- [x] STYLE-04 **Types document intent** — `SkyDirection`, `Matcher`.
- [ ] STYLE-05 **Build only what is needed** — `buildFinder` is a one-line wrapper over `buildMatcher(...).find`; `enclosing` exists for tests only (`finder.ts:153-195`). Minor.
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** — `PICTURES["milky-way"]` re-uses `MILKY_WAY_PICTURE`.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs** — 27 files, mostly tests, docs and records.

## Handoff

NEEDS WORK on I-180 alone. It needs a direct doc repair under the Issue (`docs/release-notes-0.9.2.md` intro and Upgrading; no code change, no Task retreat), then a targeted re-check of D3/D4 under this scope lock, or the owner's `accepted` resolution of I-180. The re-check reuses this run's gates (metadata-only change) and needs no browser run. T-320..T-322 stay `done`.
