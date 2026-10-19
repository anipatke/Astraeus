---
id: I-045
title: The Jupiter demo does not show how many moons there are or when NASA's list was taken
type: defect
status: open
source:
  kind: check
  check: C-083
  actor: {role: checker, session: o025-orchestrator-20261019}
  at: '2026-10-19T11:40:00Z'
tasks: [T-098, T-099]
checks: [C-083]
guardrail_ids: [PROV-01]
history:
  - at: '2026-10-19T11:40:00Z'
    actor: {role: checker, session: o025-orchestrator-20261019}
    kind: observed
    note: 'O-025 Success Condition 1 asks that the count and the table date be recorded and shown in the information panel and the details. Recorded: data/ephemerides/jupiter-moons/index.json bodyList "fetched 2026-10-18T04:30:41.878Z: 115 moons", data/moons/jupiter.json asOf 2026-10-18. Not shown: no viewer text carries the total (MoonFamilyPanel shows per-family counts only; grep finds no total or date in src/experiences/jupiter-io/jupiterIo.ts, src/shell/MoonFamilyPanel.tsx, moonFamilies.ts); MoonCatalogue.asOf is parsed (src/assets/moonCatalogue.ts:90) but never read; SMALL_MOON_PROVENANCE (jupiterIo.ts:65-70) names the source but not the fetch date.'
    check: C-083
  - at: '2026-10-19T14:19:43Z'
    actor: {role: executor, session: o025-repair-20261019}
    kind: repair_attempted
    note: "Added optional listSource/listDate to MoonFamilyList; MoonFamilyPanel shows a summary line ('115 moons in the JPL Horizons list of 18 October 2026', count summed live from the families, date from the catalogue asOf) with a data-moon-summary hook; Jupiter's information panel has a 'Known moons' fact with the same text; each small moon has a 'Moon list fetched' fact and its provenance source names the fetch date (src/shell/moonFamilies.ts, MoonFamilyPanel.tsx, src/experiences/jupiter-io/jupiterIo.ts). Unit test in tests/moonFamilyPanel.test.ts reads count and date from the data; driver moonListSummaryText plus assertions in browser-moon-panel.mjs (panel, Jupiter information, small-moon information) pass on desktop and phone. typecheck, tests (1122 passed), git diff --check clean. Evidence docs/evidence/o025-repair-20261019T114109Z/. Awaiting independent Check."
---

# I-045: The Jupiter demo does not show the moon count or NASA's list date

## Summary

The data record that JPL Horizons listed 115 moons of Jupiter on 2026-10-18, but a viewer never sees either figure. Success Condition 1 of O-025 asks for both in the information panel and the details.

## Evidence

See history. `src/assets/moonCatalogue.ts:36,90` (`asOf` parsed, unused); `src/experiences/jupiter-io/jupiterIo.ts:65-70`.

## Proof Needed

Jupiter's information panel (and the moons panel heading) state the total from the data ("115 moons", counted live, not typed in) and the Horizons list date; the small-moon details name the fetch date; a unit test reads both from the data; a browser assertion through the driver reads them on the page.
