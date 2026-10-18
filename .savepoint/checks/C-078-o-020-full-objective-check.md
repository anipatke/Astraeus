---
id: C-078
scope: {kind: objective, id: O-020}
result: CLEAR
checked_by: {role: checker, session: o020-full-check-20261018}
executed_session: o020-orchestrator-20261018
checked_at: '2026-10-18T09:55:00Z'
health_snapshot: sha256:698796e33115dc476c23643469c5374f0bd57dc06da34a7f5ad30297d82a063c
reviewed:
  base_commit: 0d917d6
  head_commit: 1197afd
  files:
    - src/shell/AstraeusShell.tsx
    - src/shell/TopBar.tsx
    - src/shell/TopBar.css
    - src/shell/topBarIcons.tsx
    - src/shell/ScaleControl.tsx
    - src/shell/scaleModel.ts
    - src/shell/ObjectControls.tsx
    - src/shell/objectModel.ts
    - src/shell/experience.ts
    - src/shell/TimelineBar.tsx
    - src/shell/TimelineBar.css
    - src/shell/timelineGlow.ts
    - src/shell/phoneLayout.ts
    - src/shell/phone.css
    - src/shell/ControlsDrawer.tsx
    - src/shell/useDrawerSwipe.ts
    - src/shell/useSwipeToDismiss.ts
    - src/shell/Sources.tsx
    - src/shell/ProvenanceBadge.tsx
    - src/shell/StoryPanelView.tsx
    - src/shell/controls.css
    - src/shell/Collapsible.tsx
    - src/shell/embedded.ts
    - src/shell/embedded.css
    - src/shell/style.css
    - src/app/App.tsx
    - src/app/experienceDefinition.ts
    - src/experiences/apollo11/apollo11Definition.tsx
    - src/experiences/showers/showerPaths.ts
    - tools/validate/driver.mjs
    - tools/validate/driver-guard.mjs
    - tools/validate/run-full.sh
    - tools/validate/browser-phone.mjs
    - tools/validate/browser-controls.mjs
    - tools/validate/browser-embedded.mjs
    - tools/validate/browser-orbit-look.mjs
    - tools/validate/browser-showers.mjs
    - tests/browserDriverGuard.test.ts
    - tests/browserDriverScale.test.ts
    - tests/phoneLayout.test.ts
    - tests/collapsible.test.ts
    - .savepoint/Design.md
    - docs/BROWSER_CHECKS.md
  dependencies: ['C-060 T-079', 'C-061 T-080', 'C-062 T-083', 'C-063 T-084', 'C-064 T-085', 'C-065 T-081', 'C-067 T-086', 'C-070 T-090']
issues: []
supersedes: null
---

# C-078: O-020 Full Objective Check

Fresh checker session. It built and repaired none of O-020's Tasks, none of the owner's direct fixes on this branch, and none of the I-035, I-036 or I-037 repairs. Main checkout (not a lane), branch `o018-o019`, HEAD `1197afd`; the tracked tree was clean at start (four untracked evidence folders from earlier sessions). This run edited no Task status, Objective status, router, Design or implementation file. It wrote this record, its evidence folder, and the verified closure of I-035, I-036 and I-037.

All nine owned Tasks are owner-`done`: T-079, T-080, T-081, T-083, T-084, T-085, T-086 and T-090 each after a CLEAR Quick Task Check (C-060 to C-067, C-070); T-082 with a recorded owner Task-check waiver (83bd20e, actor owner, 2026-10-18T09:26:44Z), which this Check covers in full.

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature here; lanes were used and merged; nothing to evaluate)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first Objective Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. **Criteria.** O-020 Success Conditions 1 to 8, read with Owner Decisions 1 to 15 and the Tasks' Done When (T-082 as revised on 2026-10-18 per its Planning Note: the five-address lock and the new picture baseline moved to O-024 T-093). Guardrails ARCH-01, ARCH-02, ARCH-03, TEST-01, TEST-02, TEST-03, TEST-04, STYLE-*. Release gate: configured gates plus `tools/validate/run-full.sh`, the AGENTS.md fuller gate for scene-affecting work.
2. **Changed files and entry points.** The shell files listed in `reviewed.files` (O-020 diff `0d917d6..1197afd`: 168 files under `src`, `tools`, `tests`), the owner's direct fixes on this branch that touch the O-020 shell (`ab1fcb2` slimmer phone timeline, `4e5bf0f` drawer stays open while the object list is tapped, `1325bb1` Focus for any picked object, `2af1189` orbit labels off by default). Entry points: `app.html` with no experience (Apollo 11), `?experience=earth-moon`, `jupiter-io`, `showers&shower=perseids|geminids`, the synthetic experiences used by the browser checks, framed and unframed.
3. **Relied-on runtime.** React shell state (drawer open, playback, selection), `matchMedia` for the phone query, `localStorage` for folds (try/catch), `window.top` for framing, CSS `env(safe-area-inset-*)` and `prefers-reduced-motion`.
4. **Matrix axes.** Viewport (390x844, 360x640, 844x390 touch, 768x1024 touch, 1024x768, 1440x900) x experience (five public ones) x state (drawers closed, top open, timeline open, info sheet, story sheet, developer panel) x input (tap, swipe on handle, drag on scene, Escape, keyboard) x motion (normal, reduced) x framing (alone, framed). Text-class, serialization and output-sink axes not applicable (no text truncation logic or output backend in scope beyond CSS ellipsis).
5. **Admission boundary.** A supported viewport and experience reached through a public address; a promise named in a Success Condition, Owner Decision or Task Done When; a credible effect on a viewer.

## Acceptance as invariants (classification)

| SC | Rule | Evidence | Result |
|---|---|---|---|
| 1 | At phone sizes, portrait and landscape, top bar and timeline can be hidden; a handle brings each back | `phoneLayout.ts` `PHONE_QUERY` (max-width 700 px, or max-height 500 px with a coarse pointer); probe: `data-phone` true on 390x844, 360x640 and 844x390 touch for all five experiences, false on 768x1024 touch, 1024x768 and 1440x900; pill and both handles present; both drawers start closed; `browser-phone` passes | Proven |
| 2 | Drawers open/close by tap and swipe; time, playback, selection survive | Probe (independent of the project driver): pill tap opens, "Hide controls" tap closes, pill swipe down opens, handle swipe up closes, timeline handle swipe up opens, Escape closes, handle tap opens; playing state held through every step (Apollo portrait, Perseids portrait reduced motion, Jupiter-Io landscape, Earth-Moon 360x640 reduced motion); speed slider in the timeline drawer | Proven |
| 3 | Settings become sliders or sheets on phones; info and story panels are bottom sheets with swipe to dismiss; Sources collapsed | Probe: info sheet opens from the drawer with Sources closed; every story panel (Apollo 7, Earth-Moon 3, Perseids 3, each at three phone sizes) opens with Sources closed; developer panel fits the phone width (8 px gutters) with 44 px fold headings and one open; scale explanation one tap away (T-085, `browser-earth-moon`); phone layout numbers are live sliders (T-081) | Proven |
| 4 | Drawer swipes and scene drags never trigger each other | Probe: six scene drags per load (centre up and down, 30 px above the timeline handle up and down, 30 px below the pill down and up) at three phone sizes for Apollo, Earth-Moon and Perseids: no drawer opened in 54 drags. Swipes are read on the handles only (`useDrawerSwipe.ts`). The optional "tap on the empty scene toggles immersive mode" was never decided or built (observation 2) | Proven |
| 5 | Safe-area insets, 44 px targets, no horizontal scroll, reduced motion, readable text | No horizontal scroll and no element past either edge in 30 loads; no shell text under 11 px; reduced motion gives a 0 s drawer transition; every shell control at least 44 px on phones (`browser-phone`, `browser-controls`, probe); the timeline's event and panel marks are 18x20 px (observation 1); safe-area `env()` on all four edges in `phone.css` and the timeline (read; not emulable headlessly) and the owner's look on a real phone (T-082 Owner Notes) | Proven (safe area by reading plus the owner's real-phone look) |
| 6 | Every experience works in the new layout; shell generic | Lite loads 11 experiences plus site pages at both sizes; probe loads five public experiences at six sizes with zero console errors; `grep` of `src/shell/` for apollo, perseid, geminid, jupiter, earth-moon, swift, phaethon, shower: no hit (ARCH-01) | Proven |
| 7 | Larger screens slimmer: timeline thinner (measured), one top bar, rarely used controls behind it | Timeline `.timeline-bar` 52 px at 1440x900 and 1024x768 for every experience (was 140.6 px Apollo, 198.2 px Perseids, T-080 baseline); top bar one 50 px row with the cog alone; scale explanation and events behind one tap. The O-017 before/after pictures were compared by T-079, T-080, T-081 and T-086 (differences listed there); the picture machinery was later removed by owner decision (T-102, 2026-10-18), so this Check does not compare pictures; looks are the owner's on the preview (laptop "Looks good", T-082) | Proven (pictures by the recorded Task comparisons and the owner's look) |
| 8 | Gates, lite at phone sizes portrait and landscape, drawer check, zero console errors, owner's look on a real phone | Fresh gates and full run below; `browser-phone` (portrait and landscape) in `run-full.sh`; owner on a real phone: "2 good" and after the slimming "looks good" (T-082) | Proven |

Owner-decision promises also checked: Decision 9 (accessible names "Play playback"/"Pause playback", "Developer mode", "Select object", "Seek timeline", "Playback speed" present in all 30 probe loads); Decision 10 (Apollo True only, no scale control: `browser-shell`, `browser-spike03`); Decision 12 (three-scale menu only in the harness: `browser-scale-menu` unit coverage in `tests/controls.test.ts`); Decision 13 (info sheet above the timeline: probe sheet bottom 716 px vs Play top 741 px at 390x844, Play reachable by hit test); Decisions 14 and 15 (glow standard, developer folds: `browser-synthetic`, `browser-phone` developer groups, probe).

## Coverage matrix

Probe harness: `docs/evidence/c078-o020-full-20261018T093154Z/checker-probes/probe.mjs` and `probe2.mjs` (results `probe-results.json`, `probe2.log`), against a dev server on port 5611 after the full run finished (one browser job at a time).

| Row | 390x844 | 360x640 | 844x390 touch | 768x1024 touch | 1024x768 | 1440x900 |
|---|---|---|---|---|---|---|
| Layout mode (`data-phone`) | phone, 5/5 | phone, 5/5 | phone, 5/5 | wide, 5/5 | wide, 5/5 | wide, 5/5 |
| Horizontal overflow | none | none | none | none | none | none |
| Shell controls >= 44 px | pass | pass | pass | n/a (wide) | n/a | n/a |
| Track marks >= 44 px | 18x20 (obs. 1) | 18x20 | 18x20 | n/a | n/a | n/a |
| Timeline height | 112 px | 160 px | 112 px | 110 px | 52 px | 52 px |
| Console errors | 0 | 0 | 0 | 0 | 0 | 0 |
| Drawers tap/swipe/Escape | pass (Apollo) | pass (Earth-Moon, reduced) | pass (Jupiter-Io) | n/a | n/a | n/a |
| Scene drag opens nothing (6 drags x 3 exps) | pass | pass | pass | n/a | n/a | n/a |
| Info sheet: Sources closed, Play reachable | pass | pass | pass | covered by `browser-spike03` | `browser-shell` | `browser-shell` |
| Story sheets: Sources closed, Play reachable | pass (13) | pass (13) | pass (13) | `browser-story-panels` | `browser-story-panels` | `browser-story-panels` |
| Developer panel fits, folds 44 px, one open | pass | pass | pass | n/a | probe folds | probe folds |
| Reduced motion transition 0 s | pass (Perseids) | pass | n/a (run normal) | n/a | n/a | n/a |
| Framed (portfolio) | `browser-embedded` phone frame | n/a | n/a | n/a | `browser-embedded` | `browser-embedded` |

A first pass of the probe reported "a scene drag opened the timeline drawer" at two sizes. Cause: the probe's drag started 12 px above the timeline bar, which is on the timeline handle (`phone.css` line 36, the handle sits 28 px above the bar), so it was a real handle swipe. Re-run with drags 30 px above the handle: 54 of 54 drags opened nothing. Recorded as a probe error, not a finding.

### External-boundary matrix

Browser runner and dev/preview servers (configured ports 5601/5602 for the full run, 5611 for the probes; started, answered, stopped; no reuse of another session's server). `window.top` across origins: `embedded.ts` treats a throw as framed; `browser-embedded` runs with cross-origin framing. `localStorage` unavailable or throwing: `tests/collapsible.test.ts` covers missing and throwing storage. Redirect, timeout, retry, secret output: not applicable (no network calls in scope).

### Workflow and side-effect lock

The only persisted side effect in scope is the fold state in `localStorage` (`Collapsible.tsx`): written on mount and on each toggle, wrapped in try/catch, read with a fallback. Failure owner: the fold, which still works unremembered. Observation 3 records how the mount-time write interacts with a per-experience default. Drawer state is in-memory React state; time, playback and selection are owned by the clock and App state and survive drawer changes (matrix row above). The browser scripts' writes into tracked historical evidence folders: after this full run `git status` shows no modified tracked evidence.

## Adversarial pass

- Bypass of the phone layout: a short window with a mouse (max-height 500 px, fine pointer) stays desktop by design; a landscape phone (coarse pointer, 390 px high) is phone. Tablets in portrait (768 px) keep the wide layout with 44 px targets (`browser-spike03` touch-target rule).
- Gesture fight: a drag that starts on the scene and ends on a handle cannot open a drawer, because the press is captured where it starts (`setPointerCapture` on the handle only).
- State across representation switch: rotating a phone changes `data-phone` live (`usePhone` listens to the query); drawer state lives in the shell and persists.
- Generic rule: orbit lines leave the Object list by `listed: false` / `partOf` in data; no experience name in `src/shell/`.
- Tests use independent outcomes: the probe is a separate harness reading the DOM and hit-testing, not the project driver.

## Verify file reality

Every file named in the Tasks' evidence that this Check relied on exists (`src/shell/*` listed above, `tools/validate/browser-{phone,controls,embedded,scale-menu}.mjs`, `tools/validate/harness/scale-menu.{html,tsx}`, `tests/{phoneLayout,collapsible,browserDriverGuard,browserDriverScale}.test.ts`). `tools/validate/shellScale.mjs` is recorded as folded into the driver and removed (T-083). Picture evidence named by T-079 to T-086 is git-ignored PNGs, recorded as such; the picture tools were removed by T-102 (owner decision).

## Verify evidence and gates (fresh, on 1197afd)

- `git diff --check HEAD`: clean.
- `npm run typecheck`: exit 0.
- `npm test -- --reporter=default --reporter=junit ...`: 74 files, 1103 passed, 1 skipped, exit 0 (junit written to the session scratchpad, not the repo root; see Code health).
- `npm run build`: exit 0 (existing chunk-size warning only).
- Full gate: `PLAYWRIGHT_CORE=... DEV_PORT=5601 PUBLIC_PORT=5602 bash tools/validate/run-full.sh docs/evidence/c078-o020-full-20261018T093154Z`, 2026-10-18 20:31 to 20:46 local, 814 s: 22 of 22 steps exit 0, error-lines 0 (lite, phone, controls, spike02, shell, anchor-labels, synthetic, synthetic-ring, synthetic-listed, public-build-assets, public-showers, earth-moon, jupiter-io, embedded, orbit-motion, orbit-look, spike03, view-link, sky, showers-perseids, showers-geminids, story-panels). Summary: `docs/evidence/c078-o020-full-20261018T093154Z/summary.txt`.
- Since the previous batch full run (`9272d73`) only `data/moons/jupiter.json` (one moon's family) and its test changed; the run above is fresh regardless.

## Code health

`savepoint health check O-020 .`: snapshot `sha256:698796e33115dc476c23643469c5374f0bd57dc06da34a7f5ad30297d82a063c` (created), "Code Health does not block clearance". Complexity, dependency vulnerabilities and duplication: no finding. Tests and coverage: reported stale, because this run wrote the junit report to the session scratchpad instead of the repo-root `junit.xml` the instance reads, and no coverage run was made; a collection gap, not a finding (the test gate itself passed above). All instances optional.

## Issues pass

No Issue admitted. Every Success Condition is Proven above. The three items below were tested against the admission rule and recorded as observations.

No materiality actions are required.

### Issues verified and closed by this Check

Left open by the executor for verification in this Check:

- **I-035** (Moon's orbit line moving gap): the repair, by owner direction, is Planetary Explorer's orbit look (faint ring with faded ends, trailing arc, zoom brightening, arc width capped in pixels), not the overlap Proof 2 first asked for; the owner looked ("nice", 0aad2d2; the cap was the owner's choice). Fresh `orbit-look` (look in force per path readout; slider changes ring opacity 0.18 to 0.8) and `orbit-motion` (playback and mid-play seek: head gap 0, longest arc segment under 0.01 of the orbit size) pass. Verified.
- **I-036** (orbit-look Readable case tested True): the case now loads `scale=readable-scale` on Earth-Moon through `loadAddress`, which throws when the scale is not offered or not in force (`assertScaleInUse`, `tests/browserDriverScale.test.ts`, 3 tests incl. the unknown id `readable`), then asserts `currentScale`; fresh full run passes. Verified.
- **I-037** (showers comet-orbit check passed on the strip): the check now reads the orbit line from the scene's path readout (visible, at least 500 vertices, 90 percent in view, an extent) and its negative probe pulls the camera in until the orbit is out of view and requires the in-view count to fall below 60 percent. The deviation from Proof 2 (out of view rather than hidden) is accepted: the shower orbit has no hide toggle, and the probe shows the count follows the line rather than a fixed value. Fresh `showers-perseids` and `showers-geminids` pass. Verified.

## Owner decisions carried forward

Assessed at this Check; scope unchanged since each was given, so each applies:

- T-084 owner acceptance (C-063): glow on the showers. Unchanged since except T-086's generalisation, which the owner separately accepted. Applies.
- T-085 owner acceptance (C-064): Apollo True only; ⓘ on Earth-Moon. Unchanged. Applies.
- T-086 owner acceptance (C-067): glow for every experience. Unchanged. Applies.
- T-090 owner acceptance (C-070): developer folds. Unchanged. Applies.
- T-082 owner validation (`required: true`): recorded in prose (Owner Look, 2026-10-18, laptop and phone "Looks good"/"looks good"); there is no structured `accepted_check` because its Task Check was waived. The owner may record it against C-078 if they want the structured form; the Task is already owner-done.
- T-082 owner Task-check waiver (83bd20e): satisfied by this Full Objective Check covering T-082 (embedded detection, framed check, Design reconciliation all verified above).

## What closes O-020

Every owned Task is done; this mandatory Objective Check is CLEAR and current; no Issue is linked to it. The owner may close O-020. The owner's look at the embedded view inside the live portfolio is still planned for after the launch update (T-082), outside this Objective's technical gate.

## Owner validation still needed

None for closure. Optional: the portfolio embed on the live site after the launch merge.

## Observations (non-blocking)

1. **Timeline marks are smaller than 44 px on phones.** Event marks and story-panel marks on the phone timeline are 18x20 px, the peak mark 16x12 px; scene story markers 14x14 px. Not admitted as an Issue: they are positions on a track (Apollo has 37 marks across about 330 px, so 44 px marks cannot fit side by side), the same size as before O-020 (`0d917d6` `style.css` line 274), deliberately excluded from the control checks (`driver.mjs` `controlStyles` comment), and every event is reachable through 44 px paths (Previous and Next, and the Events list in the timeline drawer, whose rows are all at least 44 px). Story panels are also reached by the scene markers and by auto-open while playing, but have no 44 px row in the Events list. If the owner wants a larger touch area, an invisible hit area around each mark or a panel row in the Events list would do it.
2. **Success Condition 4's optional "tap the empty scene to toggle immersive mode"** was to be decided at planning; no decision or build is recorded. It is optional ("can ... if that tests well"), so not a gap; the owner may say whether they want it.
3. **Fold memory overrides the per-experience default.** `Collapsible` writes its state on mount, so a viewer who opened the developer panel in Apollo (first group "This demo" open, "Camera and view" stored closed) and then opens Earth-Moon, which has no "This demo" group, finds every group closed. Probe: Apollo `demo:true, camera:false`; Earth-Moon after Apollo all false; Earth-Moon fresh `camera:true`. T-090 Done When 3 is met as written (one default open; state remembered); writing only on a toggle would keep the default for groups the viewer never touched. One more tap; no lost function.
4. I-036's scale guard runs only through `loadAddress`; other scripts that put `scale=` in an address ask for `true-scale`, which every experience offers (as the orchestrator noted).
5. Code-health tests and coverage instances were stale at collection (see Code health).

## Code Style Review

- [x] STYLE-01 **One job per file** — `phoneLayout.ts`, `embedded.ts`, `useDrawerSwipe.ts`, `Collapsible.tsx`, `Sources.tsx` each do one thing; stylesheets split per component.
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches** — storage fallbacks, scale counts, phone query and glow profiles have unit tests.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed** — the three-scale menu exists without a three-scale experience, but by owner Decision 7/12.
- [x] STYLE-06 **Handle errors at boundaries** — storage and `window.top` access guarded.
- [x] STYLE-07 **One source of truth** — `controls.css` owns the control look; `phoneLayout.ts` the phone breakpoint; `driver.mjs` the interface knowledge.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data** — orbit listing by `listed`/`partOf` in experience data.
- [ ] STYLE-10 **Small diffs** — the Objective changed 168 files (+20,356/−2,692) under `src`, `tools` and `tests` across nine Tasks; T-083's driver migration alone touched every browser script, by design (it is what makes later interface changes one-file edits).
