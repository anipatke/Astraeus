---
id: O-094
title: Tests that earn their time
status: planned
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
