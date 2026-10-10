---
id: I-013
title: Mobile Developer panel is covered by shell controls
type: defect
status: in_progress
source:
  kind: report
  actor: {role: owner, session: mobile-review-20261010}
  at: '2026-10-09T23:00:00Z'
tasks: [T-020]
guardrail_ids: [TEST-01, TEST-02]
history:
  - at: '2026-10-09T23:00:00Z'
    actor: {role: executor, session: mobile-developer-repair-20261010}
    kind: observed
    note: Owner reports Developer mode appears beneath other components on mobile. No matching existing Issue found. Direct bounded repair under savepoint-task and issue-capture; completed Tasks remain done.
  - at: '2026-10-09T23:05:43Z'
    actor: {role: executor, session: mobile-developer-repair-20261010}
    kind: repair_attempted
    note: Raised diagnostics above shell-top. Proof Needed passes for 390x844, 390x640, 768x1024 and 1280x800 with information closed/open; all eight hit-test grids are unobstructed, scrolling reaches the end and toggle-off restores controls. All four browser scripts pass with zero errors; fresh configured typecheck/build/test pass, 170 tests. Evidence under /tmp/astraeus-i013-20261010. Real-device feel and owner visual acceptance remain unverified. Executor evidence only; Issue remains in_progress.
---

# I-013: Mobile Developer panel is covered by shell controls

## Summary

Developer diagnostics uses z-index 4 while shell-top uses 5. On mobile the diagnostics start at 98px and overlap the toolbar and potentially the information sheet inside shell-top. Those components paint above diagnostics and intercept taps inside it.

## Evidence and scoped reads

Owner mobile review reports the overlap. Targeted reads: src/shell/style.css for stacking/breakpoints; src/shell/AstraeusShell.tsx for panel/toggle ownership; src/app/style.css for diagnostics layout; tools/validate/browser-spike03.mjs and browser-shell.mjs for responsive/diagnostic scenarios; browser-spike02.mjs and browser-anchor-labels.mjs for regression commands/output paths; Guardrails and configured gates for verification policy. These reads locate the reported defect and the existing scene-affecting fuller gate. No unrelated application implementation is needed.

## Proof Needed

At 390×844 and a short 390×640 viewport, open Developer mode with object information closed and open. Interior points in the diagnostics scroll area must hit diagnostics descendants rather than toolbar/info controls. Toggle remains usable, panel scrolls to its last section, and disabling Developer mode restores normal info/toolbar interaction. Confirm tablet/desktop diagnostics and existing shell, responsive, Spike 01/02 and anchor-label scenarios still pass with zero browser errors. Preserve historical evidence by using a distinct /tmp run directory.

## Repair evidence — 2026-10-10

Before repair, `node /tmp/i013-reproduce.mjs` on a dedicated Vite server at http://127.0.0.1:5207/ independently reproduced the defect: y=110, 140 and 170 at x=48 inside diagnostics all hit `.shell-toolbar`. Screenshot: `/tmp/i013-before.png`. The first scratch import used a named CommonJS export and was corrected; sandbox Chromium failed to launch, so browser commands ran with explicit escalation approval.

Changed files:

- `src/shell/style.css`: diagnostics z-index 4 → 6, above shell-top's 5; no State, camera or scale change.
- `tools/validate/browser-spike03.mjs`: persistent diagnostics hit-test regression, scroll-end and toggle/normal-control restoration at four sizes × info closed/open. Existing scenarios remain intact; two mobile diagnostics screenshots added. Screenshot helper reads True state even when the short-screen toolbar is intentionally hidden.
- `tools/validate/browser-spike02.mjs`: optional ASTRAEUS_EVIDENCE_DIR output override, retaining all prior assertions/default output. Same override added to browser-spike03. No older scenario is removed or deferred.
- This Issue: capture and executor evidence. Other owner/checker records, completed Task/Objective statuses and router remain untouched. No architectural reconciliation needed: CSS stacking and validation output routing do not change architecture.

Validation, approximately 23:01–23:05:43 UTC, Node v22.22.2 / npm 10.9.7 / Vite 8.3.2 / Vitest 5.0.3:

- `npm run typecheck && npm run build && npm test && git diff --check`: final fresh run after all edits, exit 0, 10 files / 170 tests, 36.62 seconds. Build retains the existing >500 kB advisory; lint unconfigured.
- All browser commands used `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js ASTRAEUS_URL=http://127.0.0.1:5207/`.
- `ASTRAEUS_EVIDENCE_DIR=/tmp/astraeus-i013-20261010/responsive-rerun node tools/validate/browser-spike03.mjs`: exit 0, original eleven scenarios/screenshots plus two diagnostics screenshots. Eight grids: 225/165/690/735 points for 390×844/390×640/768×1024/1280×800 respectively, each repeated with info open; zero covered points, all scroll/end and restoration assertions pass. Results: `responsive-rerun/browser-results.json`. Initial run passed mobile 844 checks but timed out reading the deliberately hidden True control at 640px; fixed helper and reran the complete script to a distinct directory.
- `node tools/validate/browser-shell.mjs`: exit 0, unchanged shell/metrics/provenance/event/camera scenarios, errors empty; no screenshot output requested.
- `ASTRAEUS_EVIDENCE_DIR=/tmp/astraeus-i013-20261010/regression node tools/validate/browser-spike02.mjs`: exit 0, six scale pairs, six camera presets, 30 event jumps, rates within existing accepted intervals, 30 follow samples, all four USNO phases, errors empty. Results: `regression/browser-spike02-results.json`.
- `node tools/validate/browser-anchor-labels.mjs /tmp/astraeus-i013-20261010/anchors`: exit 0, 0/40/0 labels, errors empty. Results: `anchors/browser-anchor-labels-results.json`.
- Post-record `savepoint resume` strict loading and `git diff --check` required at handoff.

Historical screenshots/results remain untouched. Inspected the fresh 390×844 diagnostics screenshot: panel visibly covers the overlapping toolbar/info area as intended. Real-device touch feel and owner's visual judgement are not established by headless validation. This is repair evidence, not independent CLEAR or verified resolution; an independent Check or explicit owner acceptance is still needed to resolve I-013. Router was not Issue-only, so the issue-only routing handoff does not apply; release remains G-003. No commit: Objective-close commits belong to the owner on this checkout.
