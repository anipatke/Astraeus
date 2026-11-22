---
id: O-094
title: Tests that earn their time
status: done
depends_on: [O-089]
release: G-024
priority: high
rank: 10
---

# O-094: Tests that earn their time

## Outcome

Where verification time goes is measured once (every Vitest file and test, every browser step, every gate, and how many times each runs per Objective across builders, coordinator and the Full Check), each test and gate is set against what it has actually caught in the project's records, the owner ticks the cuts on a report page, and only the ticked cuts land. One Full Objective Check then takes about half the machine time of the measured baseline, and nothing that caught a real defect in G-024 is removed.

## Why

Owner, 2026-11-22: "too many tests and its really unclear if they are adding value for how long they take", then "i seem to be spending 90% of my time waiting for tests" and "Do it next" (I-199, escalated here). It serves the G-024 outcome "verifies itself in a fraction of today's time without losing the checks that catch real defects".

## Success Conditions

- A baseline report with measured times (Vitest per file and per test from `test:full`'s junit output, browser steps from recorded runs, gates from `npm run check:gates`) and a repeat map of which gate runs where and how often per Objective.
- Each proposed cut names its seconds saved per Full Check and per Objective, what it has caught (records cited) and its risk; a protected list names every test, gate or tier that caught a G-024 defect.
- The owner's ticks are recorded in this Objective's Decisions; only ticked cuts land.
- A Full Objective Check's machine time is at most about half the baseline, measured the same way, with the protected list intact.

## Architectural Considerations

TEST-01..TEST-03 stay satisfied: a removed test's behaviour is either covered by a named remaining test or explicitly accepted as unguarded by the owner. Gate rules live in `docs/agents/verification.md`, `docs/agents/build.md`, `docs/agents/browser-policy.md`, `.savepoint/config.yml` `quality_gates` and `tools/gate-limits.json`; a cut that changes where a gate runs updates those, and the test that keeps `build.md` and `gate-limits.json` together.

## Boundaries

**In scope:**
- Measuring Vitest, browser steps, gates and their repetition; the owner report; the ticked cuts and the rule changes they need.

**Out of scope:**
- Cuts the owner did not tick; new tests beyond what a cut needs to keep a behaviour named; loosening scientific tolerances; changing the packaged Savepoint skills (suggestions become Issues).

## Decisions

- Owner 2026-11-22, design interview: scope "All three" (fast tests, the browser check, and repeats across builders/coordinator/Full Check); target "Halve it" (one Full Check's machine time to about half the baseline); choice "Report page, I tick cuts" (nothing is cut without the owner's tick); plan confirmed "Go ahead". Owner: "carry on, merge when clear".
- Orchestrated under G-024 decision 7; step checks waived; the Full Objective Check measures the time target.
- The measurement Task is research with a named deliverable (the report and proposal list); the trimming Tasks are planned only after the owner's ticks.
- Owner ticks 2026-11-22 on the report page (https://claude.ai/artifact/MmzwDc15jgcCRZvgYDEQGK): "Your recom[mendations]" = P01-P06 ticked; P07-P15 not ticked (not done). Baseline 454 s per full-tier Full Check (T-423); the six cuts are measured/estimated at about 228 s (50%).
- Tasks: T-424 rules and runner (P01-P04), T-425 Apollo cache and shared API picture (P05; the owner's tick authorises this test-setup change, assertions unchanged), T-426 public build reuse (P06; after T-424, both touch build.md). T-424 and T-425 side by side. The Full Check runs under the new rules and measures the time target the same way as T-423.
- Owner 2026-11-22 after measurement: P05 "Drop it" (about 1 s saved per full test run vs 13 s estimated) and P06 "Drop it" (about 2.3 s vs 7 s). T-425 and T-426 withdrawn and reverted. Landing: P01-P04 (T-424), estimated 208 s of the 454 s baseline (46%); the Full Check measures the actual figure and reports it against the "about half" target.
- Full Check C-211 CLEAR (2026-11-22): first Check under the new rules; measured 233.0 s machine time (102.4 s gates + 130.6 s browser `--tier quick --step look-out --skip-examples`) = 51.3% of the 454 s baseline, judged "about half" met; a default-browser diff is about 167 s (37%). I-203 opened (viewerIds wide cases time out while the lazy Developer drawer loads; from O-089 T-418). O-094 set done by the orchestrating session (G-024 decision 7; owner "carry on, merge when clear").
