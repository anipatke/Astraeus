---
id: C-215
scope: {kind: objective, id: O-099}
result: NEEDS WORK
checked_by: {role: checker, session: check-o099-20261123}
executed_session: orchestrate-o099-20261123 (T-444..T-446 builders, coordinator)
checked_at: '2026-11-23T09:04:10Z'
health_snapshot: sha256:a18c85639177ffa5144da7cf2400dd13e42b938573dd3605e8746ee21ba38724
reviewed:
  base_commit: e33334e4
  head_commit: ba0d0b73
  files: [packages/astraeus/src/app/orbitLineRule.ts, packages/astraeus/src/app/PathView.ts, packages/astraeus/src/app/OrbitSetView.ts, packages/astraeus/src/app/experienceDefinition.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/api/sunOrbit.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/planBodies.ts, packages/astraeus/tests/orbitLineRule.test.ts, packages/astraeus/tests/orbitLineGap.test.ts, packages/astraeus/tests/orbitLineGapReadout.test.ts, packages/astraeus/tests/orbitLook.test.ts, packages/astraeus-demo-apollo11/tests/paths.test.ts, packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus-site/tools/validate/browser-steps.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus/CHANGELOG.md, docs/BROWSER_CHECKS.md, docs/agents/browser-policy.md, tools/gate-limits.json, .savepoint/Design.md]
  dependencies: []
issues: []
unmet: [browser-gate-synthetic-journey]
supersedes: null
---

# C-215: O-099 Full Objective Check

Fresh session; it did not plan, build, coordinate or repair O-099. Diff `git diff main...o099-orbit-lines` (`e33334e4..ba0d0b73`, 38 files). T-444..T-446 are `done` with owner `check_waiver`s; this Check covers all three.

**Result: NEEDS WORK, because one browser step did not run through. The code is not at fault.** Every Success Condition is proven, and every non-browser gate passes. The one browser command also passed `orbit-lines`, `smoke`, `look-out` and the other quick steps. It failed only in `synthetic-journey`, which the policy requires because `browser-smoke.mjs` changed. Both loads timed out after 69 `net::ERR_NETWORK_CHANGED` console lines and `astraeus-data-jupiter: ... Failed to fetch`: the host network changed under the browser, which is the same symptom C-178 and C-207 recorded. No other step had a network error. Under the one-command rule the step was not rerun here, so it stays unverified, not failed. **Remediation:** a recheck that runs only `npm run check:browser -- --step synthetic-journey` and reuses every other result in this record. No code change is needed and no Issue is opened.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (browser runner only: the target is the dev server on its own port and the owner's :5490 was left running; the network-change failure is classified above; no other external boundary)
- [x] Workflow And Side-Effect Check Lock (n/a: per-frame pure sampling and readouts, no persistence or artifacts)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (n/a)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (n/a: initial Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. The O-099 Success Conditions SC1 to SC7, in Objective order: planet gap, moon gap, look and grid, OrbitSetView tests unchanged, per-frame cost, browser close-zoom, wording/CHANGELOG/no API change. Guardrails ARCH-02, ARCH-03, PROV-01, API-01, CODE-01, CODE-02, TEST-01..03. Gates: quality_gates, `git diff --check`, health check, and one browser command.
2. Entry points: `PathView` orbit lines (fixed span with `turn`, rolling composition windows), `OrbitSetView`, `sunOrbitLayer` (series, osculating, elements), `publishOrbitLineGaps`/`screenGapTo`, the `orbit-lines` step.
3. Out of scope: trajectory sampling, the belt app, release-tier gates.

## Coverage (independent probe: a temporary `tests/zzC215Probe.test.ts`, 8 cases, all pass, removed afterwards)

| Row | Cells | Result |
|---|---|---|
| SC1 Earth/Mars/Jupiter | fast clock (5 d a frame, 150 frames from 2030), backward play (-6 h steps from mid-2028), 40 random seeks 1955-2040, near the series end (2044-07 onwards) | Pass. Body to line 0 R in every cell. True path ±1 h worst: Earth 0.0036, Mars 0.0109, Jupiter 0.0004 R (bound 0.05) |
| SC2 Moon | backward play, 30 seeks 1990-2030 | Pass: 0 R at the body, ±1 h 0.022 R. Io: builder test `orbitLineGap.test.ts` (fresh `npm test` pass) |
| Elements body (comet, e 0.9) | near a later perihelion, and 7 y on | Pass: 0 km at the body. ±1 h near perihelion is 1,504 km, on chords between head points |
| SC3 grid / look | re-sample keeps shared far points (`orbitLineGap` grid case, `orbitLineRule` tests); end fade by place in time (code read); framing from far samples only (`farOnly`) | Pass |
| Paused | 9 re-syncs at the same time | Pass: 0 source calls, vertices identical |
| SC4 | `orbitSetSync.test.ts` absent from the diff | Pass (unchanged, passes) |
| SC5 | per-frame calls ≤ 1 + `HEAD_BUDGET`, then 1 (builder test); frame time +0.21 ms | Met by owner acceptance (T-446 Coordinator Completion, "Accept it") |
| SC6 | `orbit-lines` at 1440x900 and 390x844 (`browser-smoke.mjs` SIZES) | Pass: worst 0 px at both sizes (bound 2 px), 272 px and 255 px Earth radius, about 5 simulated hours |
| SC7 | limitation text, doc comments, CHANGELOG 0.10.1 `Fixed` + "Breaking changes: None"; `api-surface.lock.json` and `api/index.ts` not in the diff | Pass |
| ARCH-02 | the line reads the body's source, writes no State; `apiImports` passes | Pass |

Test edits reviewed: `orbitLook.test.ts` (1 expectation) and Apollo `paths.test.ts` (expected values) state the new grid rule; setup is untouched and each change is named in the T-445 evidence.

## Gates (fresh, Node v24.16.0)

| Gate | Result | Time |
|---|---|---|
| `npm run lint` | exit 0 | 11 s |
| `npm run typecheck` | exit 0 | 7 s |
| `npm run build` | exit 0 | 3 s |
| `npm test` (junit) | 340 files, 5518 passed, 2 skipped | 38 s |
| `git diff --check main...o099-orbit-lines` | clean | <1 s |
| `savepoint health check O-099` (08:58:53Z, after the gate) | snapshot above, created; "does not block clearance"; coverage optional and stale (collection statement) | 13 s |
| `npm run check:browser -- --tier quick --step look-out --step orbit-lines --step synthetic-journey --skip-examples` (once, 08:59:09Z-09:03:26Z) | **exit 1**: smoke 45 s, orbit-lines 57 s (limit 60), smoke-public-showers 6 s, planets-phone 9 s, look-out 70 s all exit 0 with 0 error lines; synthetic-journey exit 1, environmental (above). Evidence `docs/evidence/browser-quick-20261123T085909Z/` | 257 s (455) |

How the steps were chosen (browser policy): `look-out` because `OrbitSetView.ts` holds GLSL, which counts as a Shaders path, and the policy says to add the step when unsure. `orbit-lines` because PathView, orbitLineRule, OrbitSetView, sunOrbit and browser-smoke changed. `synthetic-journey` because browser-smoke changed. The new driver function `orbitLineGapsPx` is called only by `browser-smoke.mjs`. Not added: `two-viewers`, because no `dispose` changed. Not run: the packed examples, because the public API surface, packaging and `examples/` did not change.

## Owner decisions (verified as recorded)

All of these are recorded and none is re-assessed here:

- The +0.21 ms/frame cost is accepted (T-446 Coordinator Completion).
- `orbit-lines` is a full-tier step (T-446, browser-policy, BROWSER_CHECKS, gate-limits).
- Each Task has its `check_waiver` ("orchestrate O99").
- The owner looked on the preview and said "looks good" (T-445 and T-446 Owner Validation sections).

`owner_validation.accepted_check` is left for the owner or coordinator to fill once a CLEAR Check exists, because this skill does not record owner acceptance. Design is reconciled: "Orbit lines stay on their body (O-099)" reflects the T-445 drift notes, and T-446's readout is recorded as non-architectural.

## Issues

None opened. The browser failure comes from the host network and fails the admission test, since the Objective did not introduce it. No materiality actions are required.

## Observations (non-blocking)

- Uranus and Neptune (the osculating fallback) do not end on the body. The line's head and live point come from the ellipse, which is re-fitted only once the display time leaves the middle half of the turn, about 21 years for Uranus. Probe: Uranus is 0.23 R off at the opening time and 77.8 R off 10 years on. The plan accepts this (Architectural Considerations), and the known-limitations text states it (PROV-01). Two places say more than is true for these planets: the CHANGELOG line "a planet's orbit line ... now stays on the planet", and the `scene.ts` `orbit` doc "so the line runs through the body". Re-fitting more often would be a follow-up.
- `orbit-lines` took 57 s against its 60 s limit, and the three zoom stops landed on one radius. This is the known weakness T-446 already records.
- The doc comment on `publishOrbitLineGaps` gives the gap "as a share of the view's height" (correct for the readout). The driver converts it to px.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: `PathView.ts` +261 lines for one rule; it is contained, but the class keeps growing.
