---
id: C-084
scope: {kind: objective, id: O-025}
result: CLEAR
checked_by: {role: checker, session: o025-orchestrator-20261019}
executed_session: o025-repair-20261019
checked_at: '2026-10-19T14:58:00Z'
health_snapshot: sha256:f0eef5dcb0fc2a78f3dee045465370de51dde24d58cf2b2c73925a209eb75f0d
reviewed:
  base_commit: 6e1bbae
  head_commit: d38caca
  files:
    - src/experiences/jupiter-io/jupiterIo.ts
    - src/shell/AstraeusShell.tsx
    - src/shell/MoonFamilyPanel.tsx
    - src/shell/moonFamilies.ts
    - src/shell/phone.css
    - tests/moonFamilyPanel.test.ts
    - tools/validate/browser-jupiter-io.mjs
    - tools/validate/browser-moon-panel.mjs
    - tools/validate/driver.mjs
  dependencies: []
issues: [I-043, I-044, I-045]
supersedes: C-083
unmet: []
---

# C-084: O-025 Full Objective Re-check

Supersedes C-083 (NEEDS WORK) under its frozen scope: O-025 Success Conditions 1-6, the owner's 2026-10-19 rules (no browser checks until the Objective check; no panel collisions, phone first), each owned Task's Done When, the configured gates, the full browser run and Code Health. Re-check only: the scope was not widened.

Independence: the repairs were made by a separate Sonnet builder session (o025-repair-20261019). The checking session reviewed the diff and moved one misplaced doc comment in `tools/validate/driver.mjs` (no logic). The commit is d38caca.

**Result: CLEAR.** All three Issues are proven repaired. Every gate and all 24 full-run steps pass with zero console errors.

## Evidence
- Gates on the d38caca working tree (`docs/evidence/o025-recheck-20261019T142031Z/gates.log`): typecheck 0, build 0, `npm test` 77 files, 1122 passed, 1 skipped; `git diff --check` clean. The driver guard test is included and passes.
- Full run `docs/evidence/o025-recheck-20261019T142031Z/full` (HEAD d38caca, 1942 s): 24 of 24 steps exit 0 with error-lines 0. These include jupiter-io, embedded, moon-panel, lite, phone, home-curve-fits, public-build-assets, showers, story-panels, sky and view-link. No screenshots.
- Health: snapshot above, "does not block clearance"; coverage and tests evidence stale (optional, reported only).

## Success conditions
1. Every Horizons moon is present with its name and source (C-083). The count and table date are now shown: the moons panel reads "115 moons in the JPL Horizons list of 18 October 2026". Jupiter's information has a "Known moons" fact, and the small moons' facts and sources name the fetch date. The count is computed from the data, and the date comes from `asOf`. A unit test and the moon-panel browser assertions cover this. **Met.**
2. Positions come from Horizons fits: met (C-076 unit tests in the gate run).
3. Tagged places match the import: the unit tests and the browser `places()` readout in jupiter-io pass on every viewport. **Met.**
4. Dots at any distance, balls up close, names on demand: the unit tests and the jupiter-io browser cases pass. **Met.**
5. Load budget: public-build-assets passes. Phone performance: the jupiter-io phone cases pass, and the phone layout steps hold (controls 44, bar 44, timeline 112 to 109). **Met.**
6. Browser checks use the driver only, and the full run passes. **Met.**

## Issues
- **I-043 verified:** the Developer helpers are scoped to `[data-developer-panel]` (`driver.mjs` `devFolds`). jupiter-io and embedded pass.
- **I-044 verified:** the open phone drawer reserves the Developer button's column (`phone.css`, right padding 60 px plus the safe area). Its top bar is still collision-checked against the button. The drawer-versus-button pair is excused in `browser-moon-panel.mjs`, with the reason given in a comment, as I-044's Proof Needed allows. The layouts at 375x667, 390x844, 1280x720 and 1440x900, plus the search, highlight and focus cases, pass.
- **I-045 verified:** see SC1.

## Observations (non-blocking)
- jupiter-io now takes 1361 s (about 23 minutes) of the 1942 s run. The phone-only search in `places()` was widened to 30-degree steps plus a steep pitch, which multiplies the page loads. It is a candidate for trimming, for example by computing a facing view per place instead of sweeping.
- `focusedOn` now reads the Focus button in place rather than revealing it. On a phone, revealing it opened the drawer, which closed the information sheet the script was reading. This is a driver fix, not a product change.

## Owner validation still needed
T-098, T-099, T-101 and T-103 need the owner's look on the preview. The builders' open questions are carried over from C-083: the place badge wording ("Reconstructed"), the 60 px minimum moon width for markers, the app pages' load limits, and the Jupiter opening view framed on Callisto.

## Code Style Review
No STYLE departures noticed in the repaired files.

## Full Check Progress Checklist
- [x] Establish Scope (frozen from C-083)
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Review Code Style
