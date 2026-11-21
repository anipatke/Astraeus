---
id: C-192
scope: {kind: objective, id: O-079}
result: CLEAR
checked_by: {role: checker, session: recheck-o079-20261121}
executed_session: repair-o079-c191-20261121
checked_at: '2026-11-21T05:06:30Z'
health_snapshot: sha256:89776871e521e753c553ce015724788eaf368df946679986eebf52799c746e11
reviewed:
  base_commit: 7e58613d
  head_commit: 5842f2f9
  files: [packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/driver.d.mts, packages/astraeus-site/tests/browserDriverPhoneBar.test.ts, packages/astraeus-site/src/skyTraceControl.ts, packages/astraeus/src/shell/areas/areas.css, packages/astraeus/src/shell/timelineGlow.ts, packages/astraeus/src/shell/look/look.css, packages/astraeus/src/shell/look/interfaceLook.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/shell/bar/barItems.ts, packages/astraeus/src/shell/parts/phone.css, packages/astraeus/src/shell/ (headers of every *.tsx part), packages/astraeus/tests/lookDrift.test.ts, packages/astraeus/tests/interfaceHeaders.test.ts, packages/astraeus/tests/phoneSheetPlace.test.ts, packages/astraeus/tests/timelineGlowAccent.test.ts, packages/astraeus/tests/fixtures/computed-look.baseline.json, packages/astraeus-demo-apollo11/tests/timeline.test.ts, docs/architecture/viewer-interface.md, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
  dependencies: []
issues: []
supersedes: C-191
---

# C-192: O-079 Full Objective Re-check

Fresh session; I did not plan, build or repair O-079 (repair session repair-o079-c191-20261121, coordinator orchestrate-o079-20261121). Re-check of C-191 under its frozen scope lock: the four Issues against their own Proof Needed, every C-191 matrix cell after the repair commit `5842f2f9` (diff `7e58613d..5842f2f9`, 43 files), and the full gate fresh. Tree clean apart from untracked `docs/research/`, this run's browser evidence and health snapshot.

**Result: CLEAR.** All four Issues are verified and closed; every C-191 passing cell still holds; the full gate passes, including the one browser run (every step exit 0).

## Closure Map

| Issue | Status | Why |
|---|---|---|
| I-184 | closed, verified | driver reads and chooses both switch forms, reveals the cog and restores the menu; `planets-phone` and `look-out` (desktop and phone) pass in this run's single `check:browser`; fast cases trip on the old driver |
| I-185 | closed, verified | cause diagnosed (phone sheet places were content-sized, so the `--sheet-max` cap never resolved), fixed in `areas.css`; driver probes the band under the bar for the intended capped card; smoke passes 18/18 (every view, both sizes); `phoneSheetPlace.test.ts` trips on the old `areas.css` |
| I-186 | closed, verified | played glow is `color-mix(... var(--astraeus-accent) ...)` by default, host accent reaches the token, a set Developer colour still overrides; the TypeScript colour scan trips on the old `timelineGlow.ts` |
| I-187 | closed, verified | note section 9 and README name `barEntries.tsx`, the `barItems.ts` constructors, `ENGINE_PRIORITY`, the component in `src/shell/`, and for panels `Occupant`/`PanelState`/`NO_PANELS`/`openOccupant`/`closeOccupant`/`topmost`, the `<Area>` in `AstraeusShell.tsx`, `panels.open/close`, test rows: each checked against the code; every `src/shell/*.tsx` part and rule module has a header; `interfaceHeaders.test.ts` trips on the old `AboutPanel.tsx` |

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope (C-191 lock reused unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-191 cells re-run)
- [x] Finite External-Boundary Matrix (browser runner; ran once)
- [x] Workflow And Side-Effect Check Lock (unchanged from C-191; driver helpers now restore menu and switch panel)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger

| Re-check item | Prior Issue / claim | Frozen cell | Allowed result |
|---|---|---|---|
| switch read/choose in both forms; cog revealed and menu restored; fast cases | I-184 | W2 | pass / Issue |
| planets-phone, look-out at both sizes in the single run | I-184 | W2 | pass / Issue |
| cause of covered canvas, fix, fast case; smoke every view both sizes | I-185 | W1 | pass / Issue |
| played glow follows accent; host accent; Developer override; TS drift test | I-186 | L2, L3 | pass / Issue |
| note section 9 and README how-tos; part headers | I-187 | O2 | pass / Issue |
| site trace control top 72 px (repair side change) | I-184 repair | W2 (look-out) | pass / Issue |
| every other C-191 cell after the repair | C-191 passing findings | A1-A7, S1, L1, L3, B1, B2, P1, G1, G2, O1, T1, D1, W3, R1 | pass / Issue |

## Coverage Matrix (re-run)

| # | Cell | Result | Evidence |
|---|---|---|---|
| A1-A7, S1 | About and shortLabel contracts | pass | untouched by repair; `about.test.ts`, `lifecycle.test.ts`, `shortLabels.test.ts`, `twoViewers.test.ts` green in `test:full` |
| L1 | interface look settings | pass | `look.test.ts`, `interfaceLook.test.ts` green; `INTERNAL_LOOK_COLOURS.glow` equals the new `--astraeus-glow` token (drift test) |
| L2 | every interface colour from the look | pass (I-186) | `timelineGlow.ts` names no colour by default (`PART_TOKEN`, `paint`); `timelineGlowAccent.test.ts`; Developer picker shows set colour or token in force (`App.tsx` `glowColoursShown`) |
| L3 | drift check | pass | new TypeScript scan; mutation: restoring HEAD~1 `timelineGlow.ts` fails "flags no typed colour in src/shell TypeScript" |
| B1, B2, P1 | bar and panel rules | pass | untouched; `fitBar`, `barDom`, `panelRule`, `panelPlacementDom` green |
| G1, G2 | good guest, two viewers | pass | untouched; suites green |
| O1 | old code gone | pass | no reintroduction in repair diff |
| O2 | contributor guide, headers | pass (I-187) | grep of `barEntries.tsx` (`entry`, `leadEntries`, `controlEntries`, `trailingEntries`), `barItems.ts` (four constructors, `ENGINE_PRIORITY`), `panelRule.ts` (`Occupant`, `PanelState`, `NO_PANELS`, `openOccupant`, `closeOccupant`, `topmost`), `AstraeusShell.tsx` (`LeftArea`, `Area` right/developer/menu/timeline, `panels.open/close`), `usePanels.ts`; mutation: HEAD~1 `AboutPanel.tsx` fails two header cases |
| T1 | existing tests changed only as approved | pass | repair changed one existing expectation (`astraeus-demo-apollo11/tests/timeline.test.ts`, input unchanged, old strings pinned the replaced orange) and regenerated the computed-look baseline (only phone-place `justify-content` and glow gradients); both accepted by the coordinator in I-186 history |
| D1 | demos set About | pass | untouched |
| W1 | smoke both sizes | pass (I-185) | `smoke/results.json`: 18/18 ok, incl. synthetic-journey phone; mutation: HEAD~1 `areas.css` fails four `phoneSheetPlace` cases, HEAD~1 driver fails the two free-point cases |
| W2 | planets phone, look-out phone | pass (I-184) | `planets-phone` ok (phone: place io:ra-patera, 3 shown; the journey is phone-only by definition, desktop planets is in the smoke); `look-out` ok desktop and phone; mutation: HEAD~1 driver fails 15 of the `browserDriverPhoneBar` cases (switch both forms, cog read/press, switch-panel restore) |
| W3 | other browser steps, packed examples | pass | meteor-shower, views, hello-scene, hello-react, hello-planets, hello-sky, public-build steps exit 0 |
| R1 | Design reconciliation | pass | repair changes no architecture; note section 9 and README updated; CHANGELOG 0.9.5 (proposed) line added for the glow and sheet cap |

Adversarial notes: the default gradient keeps the opacities of the old rgba form (test compares set and token alphas); `--glow-played` is set inline on a descendant, so `var(--astraeus-accent)` resolves through inheritance from the viewer root where `interfaceLookVars` sets it, per viewer (API-03 holds). `withRevealed` and `withSwitchesRestored` restore only what was closed, and an open menu or panel stays open (fast cases). The site trace control change is host-site code, not a browser script, so the browser policy's driver-only rule is not crossed.

## Commands And Results

| Gate | Command | Time (UTC) | Result |
|---|---|---|---|
| Full tests | `npm run test:full` | 04:53:00, 83 s | **1 failure**: `viewsDom.test.ts` "keeps time, speed and playing state across a switch" (clock read 9.26 s later than before the switch); see Observations |
| Full tests (rerun) | `npm run test:full` | 04:54:48, 83 s | pass: 284 files, 4407 passed, 2 skipped; coverage 93.23% statements |
| Focused | `vitest run viewsDom.test.ts` x3 | 04:54 | 8/8 each time |
| Lint | `npm run lint` | 04:56:22 | exit 0 |
| Typecheck | `npm run typecheck` | 04:56:26 | exit 0 |
| Build | `npm run build` | 04:56:33 | exit 0 |
| Engine alone | `npm run check:engine-alone` | 04:56:36 | pass, 28.2 s (211 files, 3281 passed) |
| Pack | `npm run check:pack` | 04:57:04 | pass; engine 9.48 MB unpacked (limit 9.5) |
| Node consumer | `npm run check:node-consumer` | 04:57:19 | pass |
| React consumer | `npm run check:react-consumer` | 04:57:26 | pass (react 19.3.1) |
| Example size | `npm run measure:example` | 04:57:35 | pass; first-open 518,568 B gzip |
| Diff whitespace | `git diff --check main...HEAD` | 04:52 | clean (C-191's phone.css EOF line fixed) |
| Code Health | `savepoint health check O-079` | 04:58:08 | snapshot sha256:89776871...6e11 (created), "does not block clearance" |
| Browser | `npm run check:browser` (once) | 04:58:25-05:04:52, 388 s | **pass**: every step exit 0, error-lines 0; evidence `docs/evidence/browser-20261121T045825Z/`; time warnings only |
| Mutation probes | HEAD~1 copies of `driver.mjs`, `areas.css`, `timelineGlow.ts`, `AboutPanel.tsx`, restored after | 05:05 | 19 of the new cases fail against the old code; tree restored (git status clean) |

## Code Health

Snapshot sha256:89776871e521e753c553ce015724788eaf368df946679986eebf52799c746e11: does not block; every instance optional, no blocking finding.

## Issues

None opened. No materiality actions are required.

## Owner Decisions

The Objective's Decisions record owner choices but no structured `exception` or owner acceptance; no `carried_forward` entries are due. The owner's later "Keep it" choice (no desktop title without an About) resolves C-191's observation and is scope.

## Observations (non-blocking)

- `viewsDom.test.ts` "keeps time, speed and playing state across a switch" failed once under the full parallel suite and passed on rerun and three focused runs; the clock appears to advance in real time between the two reads, so it is load-sensitive. Not touched by the repair; worth making deterministic (paused clock or fake timers) as follow-up.
- `check:browser` took 388 s against 320 s; `look-out` 108 s against 75 s (the repair's menu and switch-panel restores add steps), `hello-sky` 24 s against 15 s. Warnings only; the limits file says to look at why before raising them.
- The TypeScript colour scan keeps one `KNOWN` entry, `shell/bodyFeatures.ts` `#ffffff` (place-marker fallback for scene data), accepted by the coordinator with its reason.
- As noted in I-184, other reveal-based driver helpers (pickBody, view buttons, scale, camera entries) may still leave a phone menu open after a read; every journey passed.
- C-191 observations otherwise stand (`T-326` duplicated headings, `domPhone.test.ts` "pill" names, `engineVersion.ts` imports the whole `package.json`).

## Owner Validation Still Needed

T-328 and T-327 declare `owner_validation.required`; the owner may record acceptance against this Check (C-192). The Objective may then be closed by the owner.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** — the played glow now reads the accent token; the one internal glow hex in `interfaceLook.ts` is held equal to `look.css` by the drift test.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — the Objective remains 130+ files for an owner-chosen whole-interface reset; the repair itself is 43 files, mostly one-line headers.
