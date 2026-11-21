---
id: C-191
scope: {kind: objective, id: O-079}
result: NEEDS WORK
checked_by: {role: checker, session: check-o079-20261121}
executed_session: orchestrate-o079-20261121
checked_at: '2026-11-21T04:15:52Z'
health_snapshot: sha256:e5bc3d5d703c752b536ce5b46a1f81fe6eb54c78a73258ae8d010ca726303cd1
reviewed:
  base_commit: afda87b6
  head_commit: 327f1fe2
  files: [docs/architecture/viewer-interface.md, .savepoint/Design.md, packages/astraeus/src/api/aboutInput.ts, packages/astraeus/src/api/planAbout.ts, packages/astraeus/src/api/viewerAbout.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/viewerHandle.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus/src/api/look.ts, packages/astraeus/src/api/pickerInput.ts, packages/astraeus/src/api/planPicker.ts, packages/astraeus/src/api/views.ts, packages/astraeus/src/api/errors.ts, packages/astraeus/src/app/look.ts, packages/astraeus/src/app/liveLook.ts, packages/astraeus/src/app/engineVersion.ts, packages/astraeus/src/app/style.css, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/shell/AboutPanel.tsx, packages/astraeus/src/shell/useTitlePlace.ts, packages/astraeus/src/shell/SwitchControl.tsx, packages/astraeus/src/shell/TimelineBar.tsx, packages/astraeus/src/shell/timelineGlow.ts, packages/astraeus/src/shell/bar/, packages/astraeus/src/shell/panels/, packages/astraeus/src/shell/areas/, packages/astraeus/src/shell/look/, packages/astraeus/src/shell/parts/, packages/astraeus/tests/ (every changed file), packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus/api-surface.lock.json, packages/astraeus-site/src/demoAbout.ts, packages/astraeus-site/src/main.tsx, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/journey-planets-phone.mjs, packages/astraeus-site/tools/validate/journey-look-out.mjs, packages/astraeus-site/tools/site/api-reference.mjs]
  dependencies: []
issues: [I-184, I-185, I-186, I-187]
supersedes: null
---

# C-191: O-079 Full Objective Check

Fresh session; I did not plan or build O-079 (planner plan-g023-20261121, coordinator and builders orchestrate-o079-20261121 and the t3xx builder sessions). Scope: O-079, its eight Tasks (T-328, T-330, T-329, T-326, T-331, T-325, T-332, T-327; all done, every step Check waived by the owner, waivers recorded), the note `docs/architecture/viewer-interface.md`, the Design.md reconciliation, and `git diff main...HEAD` (merge base afda87b6, HEAD 327f1fe2; tree clean apart from untracked `docs/research/` and this run's evidence and snapshot).

**Result: NEEDS WORK.** The engine side is sound: About, short labels and the interface look meet their contracts, the bar and panel rules are pure and well tested, the old stylesheets and placement code are gone, and every non-browser gate passes. But the one browser check fails in three phone scenarios (I-184, I-185), the timeline's played glow still draws the old orange outside the look (I-186), and the contributor guide's how-tos do not match the code (I-187).

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (browser runner; ran once)
- [x] Workflow And Side-Effect Check Lock (no persistence; host call -> link -> redraw; build writes CSS and JSON import into dist)
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

1. O-079 Success Conditions SC1 (note), SC2 (areas, look, drift check, old code gone), SC3 (bar and panel rules pure, sole placers), SC4 (behaviour kept or listed, tests migrated as listed), SC5 (About), SC6 (`shortLabel`), SC7 (clean, modular, headers, contributor guide, out of the box), SC8 (shared look public), SC9 (shelf designed), SC10 (API-03, no page lookups), SC11 (ARCH-03, demos set About, owner look), SC12 (README, CHANGELOG 0.9.5 proposed, api:errors, api:lock, gates, browser checks migrated). Guardrails ARCH-01/02/03, API-01..07, TEST-01..03, CODE-01/02; gates of `docs/agents/build.md`.
2. Entry points: `Scene.setAbout`/`about`; `ViewerHandle.about`/`setAbout` via `mount` and `AstraeusScene` (shared `viewerHandleOf`); `PickerOptionInput.shortLabel`, `ViewInput.shortLabel`; `LookInput.interface`/`LookRead.interface`; `astraeus/style.css`. Internal: `fitBar`, `reducePanels`/`topmost`, `useScreen`, `interfaceLookVars`, `AboutPanel`, `useTitlePlace`, the site's `demoAbout`, the browser driver.
3. Relied-on: the bundler resolving CSS `@import` in the published stylesheet (exercised by the packed examples); `package.json` JSON import in `dist`; happy-dom for DOM suites; headless Chromium for `check:browser`.
4. Matrix below. 5. Admission: supported public calls, the site's demos and the configured gates; owner Decisions in the Objective are scope, not findings.

## Coverage Matrix

| # | Cell | Result | Evidence |
|---|---|---|---|
| A1 | About shapes: title only, blank-space title, empty/missing/number/boxed title, null, array, Map | pass | probe (23 rows, both `checkedAbout` and `Scene.setAbout`): bad shapes `bad-about`; `" "` accepted (non-empty string, as specified) |
| A2 | shortTitle empty; status empty (accepted, panel hides it) and number | pass | probe; `AboutPanel.tsx` hides empty status |
| A3 | credits/links: not a list, null entry, empty text, ftp, `javascript:`, bare `https://`, newline in url, upper-case `HTTP://`, link without url, empty lists | pass | probe; message names the field (`links[0].url`) |
| A4 | mutation after set, extra keys, frozen nesting, bad set keeps the earlier | pass | probe: copy stripped and deep-frozen; earlier About kept |
| A5 | handle on both paths: read, live replace, call order, `bad-about`, Escape, rebuild back to scene's, unmount, `not-mounted`; scene without About | pass | `lifecycle.test.ts` two cases x mount/React; `READS`/`CALLS` tables |
| A6 | Built with Astraeus link and version from `package.json` in source and dist | pass | `about.test.ts`; `dist/src/app/engineVersion.js` imports `../../package.json`, packed |
| A7 | No About: wide bar no title, phone title = selected name opening the card | pass (as built) | `about.test.ts`; note section 4 "As built"; see Observations |
| S1 | `shortLabel` bad shapes on picker and views, kept on read | pass | `shortLabels.test.ts`; probe |
| L1 | interface look: ranges, colours, font, no address param, defaults equal `look.css`, two viewers separate | pass | `look.test.ts` rows, `interfaceLook.test.ts` |
| L2 | every interface colour from the look | **Issue I-186** | timeline played glow `#fc6323` in `timelineGlow.ts`; probe fails |
| L3 | drift check: literals, lengths, z-index, `@media` outside `areas.css` | pass | `lookDrift.test.ts`; `@media` only in `areas.css` (grep) |
| B1 | fit rule: exact width, one px below, priority order with menu button counted, title short/i give-back, story buttons from the end, compact, unmeasured 0/negative/NaN | pass | probe (independent arithmetic, 6 cases); `fitBar.test.ts` 16 |
| B2 | bar renders only from the rule; no pill | pass | `barDom.test.ts`; `TopBar.tsx` gone |
| P1 | panel rule: Escape order across all open, developer has no Escape, view switch keeps About, phone About/developer replace each other over story, wide coexist | pass | probe (5); `panelRule.test.ts` 27+, `panelPlacementDom.test.ts` |
| G1 | Good guest: no page lookups, ids by `useId`, styles under root, keys scoped | pass | grep (only pre-existing opt-in `writeTitle`); `viewerIds`, `escapeScope`, `twoViewers` |
| G2 | API-03 two viewers: About, panels, look | pass | `twoViewers.test.ts` About case x 3 pairings; `panelPlacementDom`; `interfaceLook.test.ts` |
| O1 | old stylesheets and placement code gone | pass | grep: no `TopBar`, `useDrawers`, `useTimelineSpace`, `controls-pill`, `--ui-`, `--timeline-space`; only entry files import `app/style.css` |
| O2 | contributor guide matches code; part module headers | **Issue I-187** | note section 9 lines 402-404, README "Interface modules" |
| T1 | existing tests changed only as approved, not narrowed | pass | diffs reviewed: pill selector swaps, `viewerIds` two-step (owner), `phoneLayout` cqh values (owner), path lists (owner), `escapeScope` change 8 (note), token-text regexes (look change); see Observations |
| D1 | demos set an About from existing records | pass | `demoAbout.ts`, `demoAbout.test.ts`; owner look 2026-11-21 |
| W1 | browser: smoke both sizes | **Issue I-185** | synthetic-journey phone failed |
| W2 | browser: planets phone, look-out phone | **Issue I-184** | both exit 1, driver not migrated |
| W3 | browser: meteor-shower, views, public builds, packed examples (hello-scene, -react, -planets, -sky) | pass | summary.txt; the examples exercise the `@import` stylesheet from tarballs |
| R1 | Design reconciliation of every drift note | pass | T-327 table checked against Design "Viewer interface", "Good guest", "Host-page behaviour" and the note's "As built" lines |

External boundary (browser runner): configured and actual targets as `run-browser.mjs`; startup and servers ran; three steps failed on assertions/timeouts (not connection); no secrets in output; evidence kept at `docs/evidence/browser-20261121T040852Z/`.

## Commands And Results

| Gate | Command | Time (UTC) | Result |
|---|---|---|---|
| Full tests | `npm run test:full` | 04:05:25, 84 s | pass: 280 files, 4346 passed, 2 skipped; coverage 93.24% statements |
| Lint | `npm run lint` | 04:07 | exit 0 |
| Typecheck | `npm run typecheck` | 04:07 | exit 0 |
| Build | `npm run build` | 04:07 | exit 0 |
| Engine alone | `npm run check:engine-alone` | 04:07 | exit 0 |
| Pack | `npm run check:pack` | 04:07 | pass (engine within 9.5 MB unpacked) |
| Node consumer | `npm run check:node-consumer` | 04:08 | pass |
| React consumer | `npm run check:react-consumer` | 04:08 | pass (react 19.3.1) |
| Example size | `npm run measure:example` | 04:08 | pass; first-open 518,444 B gzip, CSS 9,560 B gzip |
| Diff whitespace | `git diff --check main...HEAD` | 04:08 | one new blank line at EOF of `shell/parts/phone.css` (observation) |
| Code Health | `savepoint health check O-079` | 04:08:40 | snapshot sha256:e5bc3d5d...cd1, "does not block clearance" |
| Browser | `npm run check:browser` (once) | 04:08:52-04:14:38, 345 s | **FAIL**: smoke (synthetic-journey phone), planets-phone, look-out (phone); others pass; over its 320 s limit (warning only) |
| Probes | temporary `tests/zzCheckProbe.test.ts` (removed) | 04:15 | 39 passed, 1 failed (the I-186 played-colour probe) |

## Code Health

Snapshot sha256:e5bc3d5d703c752b536ce5b46a1f81fe6eb54c78a73258ae8d010ca726303cd1: does not block. Watch/attention signals, observations only: complexity reports 183 for `MoonsSheet` in `shell/AstraeusShell.tsx:97`, a lizard TSX mis-attribution (ESLint `complexity` 20 passes; `MoonsSheet` is one line); one dependency vulnerability unchanged over five checks; coverage, duplication and tests good.

## Issues

- **I-184** (SC12, T-327 Done When): the site driver is not migrated for the phone bar: the compact switch (planets phone) and the Developer cog inside the closed menu (look-out phone).
- **I-185** (SC12, SC11): the smoke's synthetic journey on a phone finds no free scene point at Saturn; cause not diagnosed (no second browser run).
- **I-186** (SC2, SC8, API doc of `InterfaceLook.accent`): the timeline's played glow uses a hand-typed `#fc6323`, ignoring the accent; the drift check cannot see TypeScript colours.
- **I-187** (SC7): the note's and README's "add a bar item / add a panel" instructions name the wrong files and shapes; most part modules lack the required header.

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-184 | High (every run) | Medium: the integration gate cannot pass; driver-only | Medium | Fix now (driver plus fast test) |
| I-185 | High (every run) | Medium: phone-size coverage lost; a real overlay is possible | Medium | Fix now after diagnosis |
| I-186 | High (every demo with a timeline) | Low-Medium: visible two-tone accent; host restyle incomplete | Medium | Fix now; extend the drift check |
| I-187 | Medium (any new contributor) | Low: misleading guide | Low | Combine with the fixes above (docs and headers) |

`unmet`: SC2, SC7, SC12.

## Observations (non-blocking)

- `git diff --check`: new blank line at EOF of `packages/astraeus/src/shell/parts/phone.css`.
- `viewerStyles.test.ts` now reads the `--astraeus-text-size` token instead of the root's computed `font-size`; the computed 14 px stays locked by the computed-look baseline, so no coverage is lost.
- Wide bar without an About shows no title, whereas SC5 says the title place shows the selected object's name with no About; recorded as built in note section 4 and Design, accepted by the coordinator, and covered by the owner's preview look; the owner may want to confirm it explicitly.
- Note section 1 and section 8 left the `[data-area]` occluder selector undone (recorded "Kept on purpose" in Design).
- `T-326` record repeats its `## Done When` and `## Context Files` headings (loads fine).
- `domPhone.test.ts` case names still say "pill".
- `check:browser` took 345 s against its 320 s limit, `hello-sky` 23 s against 15 s (warnings).
- `engineVersion.ts` imports the whole `package.json` into an app bundle (about 1.2 KB).

## Owner Validation Still Needed

T-328 and T-327 declare `owner_validation.required`; acceptance is to be recorded against a Check, after these Issues are cleared by a re-check.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — the played-glow colour duplicates the old accent outside `look.css` (`timelineGlow.ts:30`; I-186).
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — 132 files, about 6,800 lines added; expected for an owner-chosen whole-interface reset.
