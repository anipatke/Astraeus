---
id: I-083
title: The Geminids solar-longitude test times out under the full gate
type: verification
status: open
source:
  kind: check
  check: C-114
  actor: {role: checker, session: o042-full-check-20261024}
  at: '2026-10-24T00:55:00Z'
tasks: [T-172, T-176]
checks: [C-114]
guardrail_ids: [TEST-01]
severity: medium
history:
  - at: '2026-10-24T00:55:00Z'
    actor: {role: checker, session: o042-full-check-20261024}
    kind: observed
    note: 'Found by the O-042 Full Objective Check (C-114). npm run test:full failed twice in a row on 2975f1bf (00:40:17Z and 00:42:39Z), both times on the Geminids DW3(ii) case in showersMeasured.test.ts (5000 ms timeout); the first run also failed the Perseids fill-time indicator (108.3 ms against < 100). npm test and the file alone pass. The full gate is red, Vitest writes no coverage/coverage-final.json, and savepoint health check O-042 reports "blocks clearance" (tests: 1 failing). Same class as I-072 and I-080.'
    check: C-114
---

# I-083: The Geminids solar-longitude test times out under the full gate

## Summary

`packages/astraeus-demo-showers/tests/showersMeasured.test.ts`, case "Geminids from the shipped GMN orbits > DW3(ii), all orbits: the busiest solar-longitude bin (0.5 deg) is within 1 degree of the MDC's 261.6 (J2000)", runs past Vitest's 5000 ms default under `npm run test:full` (coverage on, all 129 files in parallel). It failed in both full runs of C-114. The case works out a solar longitude for each of the 51,115 Geminids rows inside the test body (`showersMeasured.test.ts:107-118`). That takes 1.9 s when the file runs alone and 5.4 to 7.7 s under the full gate.

The same file has a second timing assertion. "Perseids: the member records, the clump and the drawing > fills every dot quickly enough to draw them all" expects one fill to take under 100 ms (`showersMeasured.test.ts:255`). It measured 19 ms alone and 108 ms in the first full run, so it failed there; it passed in the second run (74 ms per fill).

Both cases are older than O-042. T-172 and T-176 edited this file, and C-113 (O-041) passed the full gate with the same DW3(ii) case. Under O-042 the full gate has five more test files (129 against 124), including the two-shower `rebuildComparison.test.ts`. This Check did not prove which change pushed the case over the limit. The product is not affected: the browser run and the fast suite pass.

Violated: the Full Objective Check's full-gate requirement (AGENTS.md Verification Policy and Build: `npm run test:full`), which is O-042 Success Condition 6 ("the Full Objective Check passes"). TEST-01 applies in so far as the measured-orbit facts must be proven on the gate that counts.

## Evidence

- `npm run test:full`, 2026-10-24 00:40:17Z to 00:41:28Z: `Test Files 1 failed | 128 passed (129)`, `Tests 2 failed | 1736 passed | 1 skipped`. Geminids DW3(ii) `Error: Test timed out in 5000ms` at `showersMeasured.test.ts:107`, junit time 7.67 s. Perseids fill: `AssertionError: expected 108.3223281999999 to be less than 100` at `:255`.
- `npm run test:full`, 00:42:39Z to 00:43:44Z: `Test Files 1 failed | 128 passed (129)`, `Tests 1 failed | 1737 passed | 1 skipped`. Same DW3(ii) timeout, junit time 5.40 s. The fill case passed (0.37 s for five fills).
- Neither run wrote `coverage/coverage-final.json`.
- `npx vitest run packages/astraeus-demo-showers/tests/showersMeasured.test.ts`: 19 passed. Geminids DW3(ii) took 1862 ms; the fill took 19.2 ms. With `--coverage`: 19 passed.
- `npm test`, 00:51:33Z to 00:52:08Z: 129 files, 1738 passed, 1 skipped.
- `savepoint health check O-042` (00:50:53Z): snapshot `sha256:b5069f2a80a2807bed1538043e24a11b4e1df19ec44d73fdb1ac6b77724e6816`, "Code Health blocks clearance". Tests: "1 failing; the evidence is stale". Coverage: "collection failure: no report was found".
- T-172 and T-176 evidence ran `npm test` only, not `npm run test:full`.

## Proof Needed

- `npm run test:full` passes twice in a row on the repaired tree, with DW3(ii) for both showers well inside its limit. One way is to work out the solar longitudes once per file, in a `beforeAll` with a stated hook limit. Another is an explicit timeout with a reason, as I-080 did.
- The fill-time indicator no longer fails on machine load. For example, it could compare against a margin that is stated and justified, or record the time without asserting a wall-clock bound under the full gate.
- The facts still hold: the busiest 0.5-degree bin is within 1 degree of 261.6 and 140.1.
- `coverage/coverage-final.json` is written.
- A fresh `savepoint health check O-042` does not block on tests.
- If the repair touches only test files, the re-check reuses the C-114 browser run (`docs/evidence/browser-20261024T004507Z`) under the Astraeus browser rule, and does not run `npm run check:browser` again.
