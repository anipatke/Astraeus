---
id: C-096
scope: {kind: objective, id: O-039}
result: NEEDS WORK
checked_by: {role: checker, session: o039-full-check-20261022}
executed_session: 8d73d3f8
checked_at: '2026-10-22T11:20:12Z'
health_snapshot: sha256:565b2030530450b64e129130e102e3118f71da75e7c4429eb197a5aa982f55d7
reviewed:
  base_commit: f991634a
  head_commit: 033d64d0
  files: [src/app/App.tsx, src/app/AstraeusScene.tsx, src/app/BodyMesh.tsx, src/app/DeveloperSettings.tsx, src/app/OrbitSetView.ts, src/app/bodyDraw.ts, src/app/bodySet.ts, src/app/lighting.ts, src/app/sceneFrame.ts, src/app/sceneLights.ts, src/assets/bodies/galileanMoons.ts, src/assets/bodies/planetSystemMaps.ts, src/assets/bodies/venus.ts, src/assets/licence.ts, src/assets/visual.ts, src/core/bodies/moonSystem.ts, src/core/bodies/planetMoons.ts, src/core/orbitPeriod.ts, src/experiences/planets/planetDefinition.ts, src/experiences/planets/planetSystemParts.ts, src/experiences/planets/surfacePlace.mjs, src/experiences/planets/surfacePlace.d.mts, src/experiences/planets/systems/pluto.ts, src/experiences/planets/systems/saturn.ts, src/main.tsx, src/shell/AstraeusShell.tsx, src/shell/InfoPanel.tsx, src/shell/phoneLayout.ts, src/shell/style.css, vite.config.ts, tools/validate/load-budget.mjs, tools/validate/public-build-assets.mjs, tools/import/planetary-explorer-conventions.json, data/bodies/europa/map.json, index.html, assets.html, README.md, docs/DONOR_PROVENANCE.md, .savepoint/Design.md, tests/mapOrientation.test.ts, tests/plutoOrbitLines.test.ts, tests/venusMap.test.ts, tests/infoCards.test.ts, tests/illuminateAll.test.ts, tests/clickOpensInfo.test.ts, tests/planetChoice.test.ts, tests/publicBuild.test.ts, tests/planetDefinition.test.ts]
  dependencies: []
issues: [I-068, I-069, I-070]
unmet: [SC1, SC7, SC8, I-067]
supersedes: null
---

# C-096: O-039 Full Objective Check

Independent session: did not plan, build, coordinate or mark any O-039 Task. Full mode, first run. Diff `git diff main...o039-reported-defects` (merge base f991634a = main, head 033d64d0, 29 commits, 77 files). Covers all ten Tasks T-130 to T-139; every Task carries an owner `check_waiver` (TEST-04 satisfied) and is `done`.

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. **Requirements tested:** O-039 Success Conditions SC1 to SC10; the in-scope boundary item I-067 (Europa places); Guardrails ARCH-01..05, PROV-01/02, DATA-01, TEST-01..04, CODE-01/02; the load-budget rule in `tools/validate/load-budget.mjs` and the public-build file check as release gates; Astraeus Project Rules (Deferred Design reconciliation).
2. **Changed files and entry points:** the files in `reviewed.files`. Entry points: `describeBody` / `textureUrlFor` (texture choice), `BodyMesh` lit material, `sphere()` and the Galilean visuals (map turns), `shownLongitude` via `placedFeatures` and each planet system's `packages`, `OrbitSetView` with `BodySetLayer.balancePoint`, `periodAboutBalanceS` / `meanPeriodS`, `InfoPanel`, `chooseLightDirection` via `placeBodyLights` in the lighting stage, `pickObject` / `pickOpensInfo`, `main.tsx` planet globs under `__PUBLIC_BUILD__`, `publicBuildAliases`, `checkOnlyPublicPlanets`, `PAGES` / `NON_PUBLIC_PLANET_FILES`.
3. **Relied-on behaviour:** Vite glob and alias resolution in a public build; React Three Fiber texture loading at mesh mount (`useBodyTexture`); the fitted Pluto 2016 chunks.
4. **Matrix axes:** listed below; browser rendering cells are not applicable by owner decision 6 (the owner's preview look is the screen proof).
5. **Materiality boundary:** an Issue must break a named SC, guardrail or release gate through a supported path (local or public build, phone or desktop width) that O-039 introduced or promised.

## Gates (fresh, this session, tree clean at 033d64d0)

| Gate | Command | Time (UTC) | Result |
|---|---|---|---|
| Lint | `npm run lint` | 11:14:43 | pass (exit 0) |
| Typecheck | `npm run typecheck` | 11:14:45 | pass |
| Build | `flock /tmp/astraeus-build.lock npm run build` | 11:14:49 | pass, chunk-size warning only |
| Full gate | `npm run test:full` | 11:14:50 to 11:15:51 | pass: 99 files, 1335 passed, 1 skipped; vitest 54.04 s (about 61 s wall); `junit.xml` and `coverage/coverage-final.json` written; statements 69.22%, lines 72.44% |
| Public build | `ASTRAEUS_PUBLIC_BUILD=1 flock /tmp/astraeus-build.lock npx vite build --outDir /tmp/o039-public-o8mS --emptyOutDir` | 11:15:58 | pass; `dist/` left holding the local build |
| Public file check | `node tools/validate/public-build-assets.mjs /tmp/o039-public-o8mS` | 11:16:01 | exit 0, `ok: true`, `planets.ok: true`, `planetSelfProof: true`, load budget ok (index 399,185; assets 630,888; Apollo 4,193,753; Jupiter view 6,780,792; showers 9,963,600; geminids 12,448,073; whole build 40,477,206 B raw) |
| Diff whitespace | `git diff --check main...HEAD` | 11:18:45 | one trailing space in the T-132 record (line 70), no code |

No browser set, script, server or screenshot was run (owner decision 6; owner rules 2026-10-22).

## Code Health

`savepoint health check O-039` at 11:18:45 to 11:18:53, after the full gate: snapshot `sha256:565b2030530450b64e129130e102e3118f71da75e7c4429eb197a5aa982f55d7` (created, official, commit 033d64d0, clean). Verdict: **blocks clearance**, on dependency_vulnerabilities (6 groups, 1 high, vite 8.3.2): this is I-066, open since O-037; O-039 did not touch `package.json` or `package-lock.json`. History appended to I-066. Other signals (supporting only): tests 0 failing (good); duplication 1.4% (good); complexity highest CCN 27 (needs attention, improving, 27 to 38 over 3 official checks; lint's complexity-20 rule passes); coverage 69.2% (needs attention: within the watch range, below the recent median 77.9%). These are observations, not Issues.

## Coverage matrix

| Row (SC / item) | Normal | Boundary / malformed | Bypass or other entry | Representation | Result |
|---|---|---|---|---|---|
| SC1 Venus map choice | `textureUrlFor` 2k at 320 to 767, 8k at 768+ (test) | exactly 768 picks 8k, 767 2k (test); no window picks 8k (donor rule, code read) | **other demos drawing Venus:** showers at 1280 px get the 8k file (C-096 probe) | load budget counts 2k only | **Issue I-068** |
| SC1 Venus material and light | donor values pinned (test), emissive applied in lit textured material (code) | body without emissive renders as before (spread is empty) | flat material has no emissive (recorded deviation) | n/a | Proven |
| SC1 Venus licence and credits | licence record, README, assets rows name Magellan, public domain (diff) | n/a | **home shelf and assets card show the old CC BY thumbnail captioned public domain** | public build ships `t-venus-2k` | **Issue I-069** (PROV-02) |
| SC1 Venus hashes | SHA-256 of both files match `map.json` (test) | old `venus-2k.jpg` removed; no remaining reference except a dead name in `NON_PUBLIC_PLANET_FILES`'s exclusion list (harmless: showers list the new name) | n/a | n/a | Proven |
| SC2 map turns | Iapetus PI with dark centre 0.83 deg from velocity, 179 deg with yaw 0 (test); per-body turns pinned (test) | Ganymede 0; untouched bodies keep 0 (code read) | markers live in the sphere frame, so a turn never moves a place against its terrain (code read, `applyOrientation`) | owner looked at Iapetus (T-130, 10:42:04Z) | Proven |
| SC3 Titan places | real Saturn definition draws Xanadu at 80 = 180 - 100 W (C-096 probe through `saturnSystem`) | `features.json` unchanged (`git diff` empty); records without west/scale 1/offset 0 are shown as stored (synthetic test in `planetDefinition.test.ts`; C-096 enumeration: only Titan and Europa records qualify) | n/a | n/a | Proven |
| I-067 Europa places | record corrected; `shownLongitude(147, record)` = 33 (test) | `features.json` unchanged | **real Jupiter definition still draws Tyre at 147 and Thera Macula at 181: `jupiter.ts` passes no `map`** (C-096 probe) | public site's only planet is Jupiter | **Issue (I-067 still open)** |
| SC4 Pluto lines | five moons within 2% of one lap, under 1% from round at 2016-07-01 (test) | independent dates 2016-06-25 and 2016-08-20: lap, roundness and moon-on-line assertions pass (C-096 probe; only the old no-balance contrast numbers differ by date, as expected) | no-balance path: every changed expression reduces to the old one when `balancePoint` is undefined (code read), Phobos test | head equals fitted place to 1e-6 km (test) | Proven (Titan by code-path equivalence, see observations) |
| SC5 cards | badge and one box per fact (test), monospace rules removed, tabular figures (test, CSS read) | long values wrap (`overflow-wrap: anywhere`, `min-width: 0`) | metric readouts and provenance badge keep their own fonts, as planned in the card-fonts audit | owner look recorded on the board | Proven |
| SC6 Illuminate all | off returns sun direction, on returns unit body-to-camera vector (test) | camera on the body falls back to sunlight; non-finite length falls back (code) | stage call passes camera and body in the same floating-origin axes (code read) | button `aria-pressed`, default off (`App.tsx`) | Proven |
| SC7 Design and provenance | O-039 paragraph covers every drift note; DONOR_PROVENANCE covers Venus, turns, Titan, Europa, cards | n/a | **Design says Europa qualifies through its map record; the app does not wire it** | n/a | **Issue (under I-067)** |
| SC8 public Jupiter only | public globs name only Jupiter; no other system chunk, settings or outer-planet map in the public build (check `planets.ok`) | `&planet=mars` and unknown names open Jupiter (test) | **other planets' moon-index chunks still built (about 1.1 MB, unfetched)**; inner-planet maps stay because showers and Apollo draw them (not a defect) | local build keeps nine planets (T-136 evidence; local `npm run build` this session emitted `saturn-*.js`) | **Issue I-070** (low) |
| SC9 click opens card | `pickOpensInfo(false)` true, `(true)` false (test) | a body-set member with no object only flies (code read) | dot moons are `listed: false` objects, so their card opens (code read) | owner look | Proven |
| SC10 gates | all pass fresh (table above) | | | | Proven |

### Finite external-boundary matrix

Vite glob and alias resolution: exercised by the real public build (target `/tmp/o039-public-o8mS`, startup and output verified by the file check). Texture loading over HTTP: not run (no servers by owner rule); load-at-mount behaviour read in `BodyView.tsx` and `useBodyTexture.ts` (failed load resolves to an empty texture). Connection refusal, redirect, timeout, retry, secret output: not applicable (static files, no credentials). The public file check's self-proofs (`selfProof`, `syntheticSelfProof`, `budgetSelfProof`, `planetSelfProof`) all true.

### Workflow and side-effect lock

The only multi-step workflow is the public build plus file check: build (writes the scratch dir only), walk the dir, compare stems and settings text, run self-proofs in temp dirs (removed in `finally`), print and exit non-zero on failure. Success becomes visible only through the exit code and JSON. The check fails on another planet's map or settings (self-proof), but by design ignores `-moons.js` and the inner maps (I-070) and counts only listed files per page (I-068). The Pluto line path: sample, move to the balance frame, remap each frame; a missing partner throws at construction (code read; no test of the throw, observation).

### Adversarial pass

- Bypass of a per-body rule through another entry: yes, twice. The Venus desktop variant reaches every demo that draws Venus (I-068); the Europa record is never passed by the Jupiter system, and the tests call the helper directly rather than the system (I-067).
- Representation change: the public pages' thumbnail and caption disagree (I-069).
- Independent oracle: Titan and Europa longitudes checked through the real planet definitions; Pluto checked at two dates the tests do not use; showers composition read from its own builder.
- Numeric edges: `meanPeriodS` returns the guess for a non-finite or non-positive guess, NaN rates, or data that does not reach back (code read); `chooseLightDirection` guards a zero or non-finite distance.

## Acceptance classification

| Requirement | Class | Evidence |
|---|---|---|
| SC1 | Issue | I-068, I-069; maps, material, light, hashes otherwise proven |
| SC2 | Proven | tests + code read + owner look (Iapetus) |
| SC3 | Proven | real Saturn definition probe |
| SC4 | Proven | tests + two independent dates |
| SC5 | Proven | test + CSS read + owner look |
| SC6 | Proven | test + wiring read + owner look |
| SC7 | Issue | Design states Europa's conversion works; it is not wired (I-067) |
| SC8 | Issue | I-070 (low) |
| SC9 | Proven | test + code read + owner look |
| SC10 | Proven | fresh gates |
| I-067 (in-scope boundary) | Issue | still open; history appended |

Guardrails: ARCH-01/04 hold (no experience names added to shell code; `src/core/orbitPeriod.ts` imports nothing outside core; Pluto's partner is data in `planetMoons.ts`). ARCH-02 holds (lines and lights consume State). PROV-02 broken by I-069. DATA-01 holds (no donor data edited; Europa `map.json` regenerated by the importer from its conventions file). TEST-04 holds (waivers on all ten Tasks). TEST-01 is weak for Europa: the test proves the helper, not the behaviour (I-067).

## Issues and materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-067 Europa places not converted in the app | High: every Europa place view, on the public site's only planet | Medium: Tyre, Thera, Thrace, Cyclades, Castalia, Cilix, Manannan, Tara and Murias sit far off their terrain; Pwyll and Conamara look right | High | Fix now: a one-line wiring change in `systems/jupiter.ts` plus a test through the real Jupiter definition |
| I-068 Desktop showers fetch the 14.5 MB Venus map | High: every desktop visit to either public showers demo | Medium: page download more than doubles (about 24 to 27 MB), unmeasured by the budget | Medium | Fix now or owner decision: limit the variant to the planets demo, or count it and raise the limits on purpose; re-measure Venus |
| I-069 Venus thumbnail misattributed | High: visible on the home page and assets page | Low to medium: a CC BY 4.0 picture shown without its credit and labelled public domain | Medium | Fix now: regenerate the thumbnail from the Magellan 2k map |
| I-070 other planets' moon data in the public build | Low: never fetched | Low: about 1.1 MB on the server | Low | Owner accepts, or defer to a follow-up |
| I-066 vite advisory (pre-existing, blocks health) | as recorded in C-094 | | Low for O-039 | Owner decision outside O-039 |

## Owner decisions assessed

No structured `exception` or `owner_validation.accepted_check` exists on O-039 or its Tasks, so no `carried_forward` entry is written. The owner's preview look (T-137, board marks) is treated as the screen proof for visual conditions, per the owner's rule; it cannot cover I-067's wiring (the Jupiter check came back as "all done except Jupiter?") or the non-visual items above.

## File reality

Every file named in Task evidence exists or is recorded as removed (`venus-2k.jpg`, removed by T-132). Scratch probe tests written by this Check (`tests/zzCheckO039Probe*.test.ts`, `tests/zzCheckO039Pluto.test.ts`) were deleted before commit. The public build sits in `/tmp/o039-public-o8mS`, outside the repo.

## Observations (non-blocking)

- Five Europa lines/regions (Agave, Belus, Cadmus, Rhadamanthys Lineae; Powys Regio) match neither longitude reading; donor data, out of scope (no `features.json` edits). Owner may raise an Issue later.
- SC4's "Titan line unchanged" has no dedicated test; proven here by code-path equivalence (with no `balancePoint`, `positionInto`, `periodMs`, `#mapped` and the remap reduce to the old code). The balance-point path is proven only on Pluto's real data (ARCH-03 asks for an alternative configuration), and the "partner not in set" throw has no test.
- Venus's 8k map (8192x4096) costs about 170 MB of GPU memory with mipmaps on every desktop view that draws Venus; part of I-068's decision.
- "Illuminate all" lives in the Developer drawer, so a visitor sees it only after opening Developer mode; the owner looked at it there.
- Coverage fell to 69.2% from a recent median of 77.9% (Watch); complexity 27 is improving.
- `NON_PUBLIC_PLANET_FILES` still names the removed `venus-2k.jpg` in its exclusion list; harmless today.
- One trailing space in the T-132 record.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — the balance-point throw in `OrbitSetView.ts` and Europa's real wiring have no test.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — Saturn's glob carries `map.json` but Jupiter's hand-written package list does not, so the conversion rule depends on each system remembering it.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**

## Verdict

**NEEDS WORK.** Unmet: SC1 (I-068, I-069), SC7 and the in-scope I-067 (Europa conversion not wired into the Jupiter system), SC8 (I-070, low). Health also blocks on the pre-existing I-066. Proven: SC2 to SC6, SC9, SC10. Remediation goes to a direct repair under each Issue (no Task is retreated); a later Check verifies it. To close O-039 the owner needs: the I-067 wiring fix and a recheck, a decision on I-068 (limit the 8k map to the planets demo, or count it and raise limits), the I-069 thumbnail regenerated, I-070 accepted or deferred, and I-066 accepted or fixed.
