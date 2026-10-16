---
id: C-014
scope: {kind: objective, id: O-010}
result: CLEAR
checked_by: {role: checker, session: o010-check-20261011}
executed_session: o010-t032-t035-executor-sessions-20261011
checked_at: '2026-10-11T05:22:00Z'
health_snapshot: sha256:e62d1c5177adaa872ed52bfa7c6a8d9a4e3a283e276c18beaa2c24fa0d841d85
reviewed:
  base_commit: 2c10165
  head_commit: 2c10165
  files:
    - src/core/timeWindow.ts
    - src/shell/experience.ts
    - src/shell/timelineModel.ts
    - src/shell/TimelineBar.tsx
    - src/shell/AstraeusShell.tsx
    - src/shell/infoModel.ts
    - src/shell/InfoPanel.tsx
    - src/shell/metrics.ts
    - src/shell/MetricVisual.tsx
    - src/shell/style.css
    - src/synthetic/syntheticDefinition.ts
    - tests/timeWindow.test.ts
    - tests/timeline.test.ts
    - tests/infoProvenance.test.ts
    - tests/metricVisuals.test.ts
    - tests/experiencePlugIn.test.ts
    - tests/experienceDefinition.test.ts
    - tools/validate/browser-synthetic.mjs
    - .savepoint/Design.md
  dependencies: []
issues: []
supersedes: null
---

# C-014: O-010 Full Objective Check

CLEAR. Every Success Condition and every owned Task's Done When is proven by independent evidence, except the owner's own visual look (SC6 last sentence, T-035 DW6), which is owner validation and is listed below, not a technical criterion. All configured gates and all six browser scripts pass freshly. No Issues opened. CLEAR does not close anything: the owner still records T-035's visual acceptance against this Check and then closes O-010.

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
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope and independence

Fresh checker session started after `/clear`; it built none of T-032 to T-035. Main checkout (`git rev-parse --git-dir` equals `--git-common-dir`), branch `spike-04`, HEAD `2c10165`. All O-010 work is **uncommitted** in the working tree, so `reviewed.base_commit` and `head_commit` are both `2c10165` and the reviewed state is "HEAD plus the working-tree diff" (`git diff --stat`: 23 files, +787/−29, plus untracked `src/core/timeWindow.ts`, `tests/timeWindow.test.ts`, `docs/evidence/o010-t034-2026-10-11/`, `docs/evidence/o010-t035-2026-10-11/`). The owner commits at Objective close per the project rule.

All four Tasks are owner-`done` with recorded board Task-check waivers (T-032 04:54:43Z, T-033 04:56:37Z, T-034 05:01:09Z, T-035 05:14:15Z). Waived Tasks are covered here in full. This run wrote only this Check record and the fresh run directory `docs/evidence/o010-check-2026-10-11/`; no Task, Objective, router, Design or source file was edited.

## Scope lock (frozen)

1. **Criteria:** O-010 SC1–SC6; T-032 DW1–5; T-033 DW1–5; T-034 DW1–5; T-035 DW1–6. Guardrails named by the Tasks: ARCH-01, ARCH-02, ARCH-03, PROV-01, TEST-01, TEST-03, STYLE-01…10. Project rules: scene-affecting fuller gate, browser regression maintenance, historical evidence preservation, deferred Design reconciliation.
2. **Changed files and public entry points:** the `reviewed.files` list. Entry points: `createWindows`, `rateAt`, `provenanceAt`; `timePositionPercent`, `windowPositionPercent`, `windowCurvePath`, `formatWindowRate`, `windowContextAt`, `windowStops`, `navigationStops`; `infoView(…, timeUtcMs)` with `{kind: "window"}`; `RateMetric`, `rateScale`, `metricNotes` (rate case), `MetricVisual` rate case; `ExperienceConfig.windows`; `TimelineBar` band/curve/peak/Inside/Previous/Next; `AstraeusShell` window info target; the synthetic definition's window and `createMetrics`.
3. **Relied-on runtime:** React render of `TimelineBar`/`InfoPanel`, the Vite dev server on 5199 and headless Chromium via the donor `playwright-core` for the browser gate.
4. **Matrix axes:** below; text-class axis not applicable (labels and units are experience-supplied ASCII copy, no truncation or width logic was added); environment/output sink axis not applicable (no CLI or redirected output in scope).
5. **Admission boundary:** supported path = an experience built through `createWindows` and mounted via `ExperienceConfig.windows`, at the 1280×800 and 390×780 widths the scripts use. Raw, unvalidated windows passed straight into `ExperienceConfig` are outside the supported path (the same contract as events, which are also validated only by `createEvents`).

## Acceptance as invariants (classification)

| Criterion | General rule | Classification | Evidence |
|---|---|---|---|
| SC1 / T-032 DW1 | Any malformed window is rejected with a named error; valid ones come back frozen, deep-copied, sorted by start | Proven | Probe matrix rows 1–30 (below); mutation-after-validation probe; `tests/timeWindow.test.ts` |
| SC1 / T-032 DW2 | `rateAt` = piecewise-linear interpolation of samples, null outside window/samples/without rate; `provenanceAt` = covering span, later span owns shared boundary, null in gaps | Proven | Independent oracle sweep 900–2100 step 7; boundary rows; three-span probe with a gap and observed→illustrative |
| SC1 / T-032 DW3 | Existing core types and files unchanged | Proven | `git diff --stat -- src/core src/mission src/app` empty; only new `src/core/timeWindow.ts` |
| SC2 / T-034 DW4 | Without windows, navigation, context and markers equal the pre-O-010 behaviour | Proven | Probe: `navigationStops(events, [], t)` equals `eventNavigationTargets` at 0/1500/2999/3000/4000; labels stay "Previous event"/"Next event" (`TimelineBar.tsx` `stopLabel`); `browser-shell`, `browser-spike03`, `browser-spike02`, `browser-anchor-labels` pass on Apollo |
| SC3 / T-034 DW1 | Positions clamp to 0–100; curve normalised to the window's own max, drawn only from samples inside the timeline; context lists every window containing the clock (ends inclusive) with `rateAt`; merged stops strictly before/after, de-duplicated, event wins a tie | Proven | Probe "window context and positions" (exact path `M30 50 L45 0`, clipped curve → null, all-zero → null); forward/backward walk across overlapping windows, a peak coinciding with a start, and an event coinciding with a peak: forward `[1000,1200,1500(E1),2000,2500,3000]`, backward `[2500,2000,1500,1200,1000]` |
| SC3 / T-034 DW2 | Band (named), faint curve, peak marker that seeks and opens details; "Inside" only while inside; Previous/Next labelled by stop; legible at both widths | Proven (technical); visual legibility is owner validation | `browser-synthetic.mjs` fresh run at both sizes; screenshots `docs/evidence/o010-check-2026-10-11/synthetic/synthetic-window-{desktop,mobile}.png` reviewed by this checker: band, curve, peak and controls do not overlap |
| SC3 / T-034 DW3 | Window panel shows start/end/peak/rate now and the span provenance at the clock, falling back to `eventProvenance` | Proven | Probe "info view": accuracy at 1499/1500/1900/no-clock = first/second/fallback/fallback; facts order and "2.5 u"; missing id → null; no fallback → null provenance. Browser: first-half vs second-half wording across minute 135 |
| SC4 / T-033 DW1–2 | `rate` renders numbers-first; bar only against stated range or peak; numeric-only otherwise; null shows unavailable; existing kinds unchanged | Proven | Probe "rate metric scale and notes" (no range/peak → null scale; peak only → 0..max(value, peak); invalid range → null; out-of-range note); `tests/metricVisuals.test.ts` existing cases pass unmodified |
| SC4 one source | Curve and readout both come from the same window samples via `rateAt` | Proven | `syntheticDefinition.ts` `contactRateMetric` uses `rateAt(contactWindow, …)` and the same `contactWindow` is in `windows`; `tests/experiencePlugIn.test.ts` compares at nine times |
| SC5 / T-035 DW1–2 | Made-up window with rate, peak, two `illustrative` spans differing in accuracy/notes; rate readout; nothing labelled measured | Proven | Source read; browser asserts "made-up ramp"/"made-up fall" and no "measured"; `synthetic-bare` still passes |
| SC6 / T-032 DW4, T-033 DW4, T-034 DW5, T-035 DW2 | No meteor/shower/Perseids naming in any new generic file | Proven | `tests/experienceDefinition.test.ts` "window files stay generic" names all ten files; `grep -riE "meteor|shower|perseid" src/core src/shell` empty |
| SC6 / T-035 DW3 | Every browser script passes with zero console errors in a fresh directory; no historical evidence overwritten | Proven | Fresh run below; `git status --short docs/evidence` shows only untracked new directories |
| SC6 / DW5 (all Tasks), T-035 DW4 | Gates pass | Proven | Fresh run below |
| T-035 DW5 | Design reflects the features; each drift note accounted for | Proven | `Design.md` "Time windows and rates (O-010)" section; T-034's deferred note and T-035's stacking finding each accounted for |
| SC6 owner look / T-035 DW6 | Owner looks once at mobile and desktop | Owner validation still needed | `owner_validation.required: true`, `accepted_check: ""` |

## Coverage matrix

Independent harness: `docs/evidence/o010-check-2026-10-11/o010probe.test.ts.txt` (renamed `.txt` so the project's own test run does not pick it up), run as `npx vitest run --root <scratch> --dir <scratch>`: 1 file, 8 tests, all pass.

| Surface | Input / state cells | Result |
|---|---|---|
| `createWindows` | normal; empty list; non-integer start; NaN end; ∞ end; end = start; end < start; empty id; duplicate id; empty label; peak at start; peak at end; peak below; peak above; peak NaN; sample outside; samples unsorted; duplicate sample time; negative value; NaN value; −0 value; empty unit; empty samples; span outside; zero-length span; overlapping spans; unsorted spans; span with invalid provenance; spans with a gap; ties in start order | All as expected: invalid → throws; empty label, −0, empty samples, gaps, boundary peaks → accepted (none forbidden by DW1); sort is by start with ties kept in input order |
| frozen copies | caller mutates a sample after validation | Copy unaffected; window, rate, samples array and each sample frozen |
| `rateAt` | sweep below window, before first sample, at each sample, between, after last sample, after window; single sample (at, ±1 ms); no rate | Matches independent oracle to 1e-9; nulls where required |
| `provenanceAt` | before window; each span start; just before each end; shared boundary; gap; last span end; after window; observed vs illustrative | Matches DW2 incl. later-span boundary and inclusive last end (executor's documented reading) |
| `navigationStops` | no windows ≡ events; overlapping windows; peak = start de-dup; event = window point tie; strict before/after full forward and backward walks | Pass |
| `windowContextAt` / positions / curve | before, at start, inside, at end, after; window partly/fully outside the timeline; all-zero rates; fewer than two samples on screen | Pass |
| `infoView` window | before/at/after span boundary; past last span (fallback); no clock; unknown id; no `eventProvenance` | Pass |
| `rateScale` / `metricNotes` | no range or peak; null value; peak only; value above peak; zero peak; degenerate range; value outside range; null with range | Pass |
| Rendered (browser) | desktop 1280×800 and mobile 390×780: band, curve, peak, no Inside before, Next through opens/peaks/closes, Inside at peak with "48 passes per hour", source wording either side of 135, rate readout, unavailable outside | Pass |
| Apollo / bare / ring | no windows | Pass (four Apollo scripts, bare and ring sections) |

Representation axis: windows have no serialization form; not applicable. Text-class and sink axes: not applicable (scope lock item 4).

## Finite external-boundary matrix

| Cell | Classification |
|---|---|
| Configured vs actual target | `http://localhost:5199/` default in every script; server started with `--strictPort`, so a busy port fails instead of moving |
| Startup / discovery / reuse | Server polled until it answered before scripts ran; one server reused by all six |
| Unavailable dependency | Not exercised; scripts would fail on navigation (non-zero exit), which the gate treats as failure |
| Success / non-success | All six exited 0 and logged `"errors": []` |
| Redirect, timeout, malformed response | Not applicable: local static dev server; Playwright default timeouts apply |
| Cleanup / partial side effects | Each script writes only to the directory given (`ASTRAEUS_EVIDENCE_DIR` or, for anchor labels, its first argument); server stopped after the run |
| Secret-safe output | No secrets involved |

## Workflow and side-effect lock

The only side-effecting workflow in scope is the browser gate writing evidence. Order: start server → each script loads the page, asserts, writes screenshots to its own subdirectory → log captured → server stopped. Failure before writes leaves an empty subdirectory; failure after leaves partial screenshots plus a non-zero exit and log. Oracle: `git status --short docs/evidence` (no modified tracked file) and each log's `errors` array. In the UI, the band and peak clicks do two things in order (seek, then open details); a seek always succeeds within bounds (`clampToBounds` unchanged), so there is no partial state.

## Adversarial pass

- **Bypass validation:** `ExperienceConfig.windows` is a plain readonly array; an experience could pass unvalidated windows. Same contract as `events`/`createEvents`; outside the supported path (lock item 5). Observation only.
- **Overlapping/skipped transitions:** overlapping windows produce two Inside lines and correct merged stops (probe). Crossing a span boundary while the window panel is open changes the source (browser and probe).
- **Representation switch:** with windows the Previous/Next accessible names change from "Previous event" to "Previous: <label>"; without windows they are unchanged (TEST-03 holds for Apollo).
- **Numeric probes:** non-finite, negative, −0, single-sample, all-zero and clipped cases covered above. No impossible model or exception found.
- **Independent oracle:** rate interpolation checked against a separate piecewise-linear implementation, not the code's own binary search.
- **PROV-01:** both synthetic spans are `illustrative`, sources say "Made up … not real observations"; browser asserts nothing reads "measured".
- **ARCH-02:** `timeWindow.ts` imports only `state` (`assertUtcUnixMs`) and `provenance`; no State or trajectory is read or written.

## File reality

Every file named in T-032–T-035 evidence exists, including `docs/evidence/o010-t034-2026-10-11/browser-spike03/` and `docs/evidence/o010-t035-2026-10-11/` (screenshots and per-script logs). `src/app/style.css`, named in T-033/T-034 plans, does not exist; both Tasks recorded the correction to `src/shell/style.css`. No phantom files.

## Gates (fresh)

Toolchain: Node v24.16.0, Vitest 5.0.3, Vite 8.3.2. Run 2026-10-11 ~05:15Z.

- `git diff --check` → exit 0.
- `npm run typecheck` → clean.
- `npm run build` → succeeds; only the existing >500 kB chunk warning.
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` → 17 files, **304 tests passed**.
- Browser (scene-affecting fuller gate), started `2026-10-11T05:16:00Z` (`docs/evidence/o010-check-2026-10-11/run-started.txt`), `npx vite --port 5199 --strictPort`, `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js`:
  - `ASTRAEUS_EVIDENCE_DIR=docs/evidence/o010-check-2026-10-11/<name> node tools/validate/browser-<name>.mjs` for `shell`, `spike03`, `spike02`, `synthetic`, `synthetic-ring`; `node tools/validate/browser-anchor-labels.mjs docs/evidence/o010-check-2026-10-11/anchor-labels`.
  - All six exit 0, each log has `"errors": []` (`docs/evidence/o010-check-2026-10-11/*.log`).
  - `git status --short docs/evidence` lists no modified tracked file: no historical evidence overwritten.

## Code Health

`savepoint health check O-010 .` after the full gate: snapshot `sha256:e62d1c5177adaa872ed52bfa7c6a8d9a4e3a283e276c18beaa2c24fa0d841d85` (created). Verdict: **does not block clearance**. complexity, duplication, dependency vulnerabilities: no finding. coverage and tests (both optional): reported **stale**. That is a collection-freshness statement about the optional instances, not a code finding; the test result itself is the fresh 304/304 run above. No Issue warranted.

## Parallel planning advice

Lanes `core-windows` and `rate-metric` were advisory; work ran on the main checkout. Not a finding.

## Issues pass

No item meets the admission test. No Issues opened. No materiality actions are required.

## Observations (non-blocking)

1. **Design.md states something not yet true.** Current Technical State says "the owner's visual judgement is recorded in the Task"; T-035 still says pending and `accepted_check` is empty. It becomes true once the owner records the look; otherwise the planner should correct the line.
2. **T-035 evidence misdescribes `browser-anchor-labels.mjs`.** It says the script writes to a fixed historical folder; the script takes an output directory as its first argument (`tools/validate/browser-anchor-labels.mjs:4,11`). The executor restored the overwritten files, and this Check confirms no tracked evidence differs from HEAD, so there is no remaining damage.
3. **Clicking the band jumps the clock to the window start** before opening details (`TimelineBar.tsx`, band `onClick`). Not required or forbidden by T-034 DW2; the "Inside" button opens details without seeking. Worth the owner's eye.
4. **Small touch targets.** The band is 7 px tall and the peak marker 14×12 px; on a phone these are hard to tap. The "Inside" line and Previous/Next give alternative access. Owner judgement.
5. **The rate curve is very flat at desktop width** (track height is small), as the desktop screenshot shows. Within "faint"; owner judgement.
6. **Previous/Next to a window stop does not switch an open event panel to the window,** mirroring event behaviour; recorded by T-034.
7. **Unvalidated `ExperienceConfig.windows`** is possible (see adversarial pass). Consistent with events; a later Objective could validate at the boundary.
8. **Health instances `coverage` and `tests` report stale** despite a fresh junit run; likely a collection-ordering detail worth a look by the owner.
9. **All O-010 work is uncommitted.** Commit at Objective close per the project rule so later Checks have a real diff baseline.

## Owner validation still needed

- **T-035** (`owner_validation.required: true`, SC6, T-035 DW6): the owner's look at `?experience=synthetic` at desktop and phone sizes, per T-035's User Check, and Apollo's timeline looking as before. Record as `owner_validation.accepted_check: C-014` on T-035 with the owner's judgement. Observations 3–5 are offered for that look.
- T-032, T-033 and T-034 require no owner validation.

## Closure readiness

Every owned Task is owner-`done`; this mandatory Objective Check is CLEAR and current; no Issue is linked. O-010 may be closed by the owner once T-035's owner acceptance is recorded.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [ ] STYLE-09 **Content lives in data** — window UI wording ("Inside:", "opens/peaks/closes", "Starts/Ends/Peak/Rate now", "Not available at this time") is hardcoded in `TimelineBar.tsx`/`timelineModel.ts`/`infoModel.ts`, matching existing shell chrome such as "Just happened"; advisory.
- [x] STYLE-10 **Small diffs**
