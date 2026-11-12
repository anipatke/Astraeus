---
id: C-171
scope: {kind: objective, id: O-069}
result: NEEDS WORK
checked_by: {role: checker, session: o069-check-20261112}
executed_session: o069-run-20261112
checked_at: '2026-11-12T04:15:00Z'
health_snapshot: sha256:f40be9dda63e18a95b191e60a9941bec430dd7a810050c7ad07b7098c25f7065
reviewed:
  base_commit: 369e76cb
  head_commit: 74fbea31
  files: [packages/astraeus/src/core/pacing.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/tests/pacing.test.ts, packages/astraeus/tests/pacedAdvance.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, .savepoint/Design.md]
  dependencies: []
issues: [I-170, I-171]
unmet: [T-307-continuous, O-069-outcome-every-zone]
supersedes: null
---

# C-171: O-069 Full Objective Check

Fresh session; did not plan or build O-069. Wrote only this record, I-170, I-171 and throwaway probes in the session scratchpad. No code changed, nothing committed. Both Task Checks waived by the owner (`check_waiver` on T-307, T-308); no owner acceptance or exception on the scope to carry forward.

## Checklist

- [x] Establish Scope  - [x] Freeze The Check Scope  - [x] Turn Acceptance Into Invariants  - [x] Build The Mandatory Coverage Matrix  - [x] Finite External-Boundary Matrix (browser gate only; n/a otherwise, pure functions)  - [x] Workflow And Side-Effect Check Lock (frame stage: step, wrap/stop, re-apply)  - [x] Matrix Completion Lock  - [x] Parallel Planning Advice (n/a)  - [x] Perform The Adversarial Pass  - [x] Re-check After Remediation (n/a, first run)  - [x] Verify File Reality  - [x] Verify Evidence And Gates  - [x] Collect Code Health Evidence  - [x] Complete The Issues Pass  - [x] Summarize Materiality  - [x] Review Code Style

## Scope lock

1. Objective Success Conditions 1-4; T-307 and T-308 Done When; ARCH-03/04, API-07, CODE-02, TEST-02/03.
2. `pacedRate`, `pacedAdvance`, `stepPacing` (`core/pacing.ts`); `frameTime` (`app/sceneFrame.ts`); App's 100 ms interval and `seekTo`.
3. Matrix: piece shapes (slower than base only; faster-than-base span containing / touching a slower rule; nested; touching; reversed order; view-filtered); frame lengths 16/33/100/250/1,000/3,000 ms; clock states (first step, steady, paused, seek, rate change, loop wrap, end stop, view-switch ease).
4. Admission: supported public pacing shapes (README table) through the viewer's frame stage.

## Coverage

| Criterion | Result | Evidence |
|---|---|---|
| SC1 / T-308 integrator never passes a zone, frame-rate independent | Proven (steady state) | Independent probe, irregular zone placement: all 10 zones seen at every frame length incl. 3 s; in-zone real time 8.98-9.01 s (exact 9 s); pass 223.7-225.0 s. Fake-clock `stepPacing` probe: 0/76 skips at 16 ms, 0/76 with a 1 s hitch. |
| SC1 during a view-switch ease | **Issue I-171** | 27/76 offsets skip the zone at 16 ms frames during the 1 s ease. |
| SC2 seek, loop, end stop, setRate/setTime, Auto vs chosen, ease shape | Proven | Existing pacing, pacingViews, syntheticJourney, sceneFrame tests unchanged and green; `frameTime` deletes `last` and re-applies after wrap/stop; `seekTo` clears `last`. |
| SC3 / T-307 min of each piece alone, order-independent, F-15 | Proven for pieces slower than base | `pacing.test.ts` F-15 and nested/touching tests; reviewed. |
| T-307 "result continuous in time" | **Issue I-170** | A slower rule's ramp starting inside a faster span drops the speed at once (2,592,000x -> 86,400x in 1 ms; the site synthetic journey 328 -> 30 d/s and 30 -> 361 d/s). Old layering was continuous. |
| SC4 no API change, CHANGELOG both fixes, Design reconciled | Proven | `api-surface.lock.json` unchanged in `git diff main...HEAD`; CHANGELOG `## Unreleased` two Fix entries; Design `Journeys across years` and views item updated (74fbea31). |

Scrutiny points from the brief: (a) the touching-only minimum is what causes I-170; the literal Done When "min over the base and each piece" would instead cap every span at the base, so neither reading meets continuity with faster-than-base pieces — the rule needs a fix, not a wording change. (b) Ease fallback: I-171; first step after a seek/play and after an outside move falls back for at most one interval (the gap from the move to the next frame) — observation. (c) 5 ms slack: at cruise 26 d/s it hides an outside seek under about 3 h simulated, which the integrator then overwrites; viewer and host seeks go through `seekTo`, which clears `last`, so only direct `clock.seek` callers (`jumpToEvent`, `openClock`) rely on it — observation.

## Gates

- `npm run test:full`: pass, 250 files, 3,731 passed, 2 skipped (76 s).
- `npm run check:engine-alone`: pass (25 s). `npm run check:pack`: pass (15 s). `npm run check:node-consumer`: pass (5 s). `npm run measure:example`: pass (first-open 1,759,855 B / 505,782 B gz).
- `git diff --check main...HEAD`: clean.
- `savepoint health check O-069`: snapshot above, "does not block clearance".
- `npm run check:browser` (once): pass, 12 steps, 0 error lines, total 314 s (limit 320 s); evidence `docs/evidence/browser-20261112T040415Z`.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-170 | Medium: any fast span with a slow rule nearby, incl. the site's synthetic journey | Medium: visible speed jump, breaks the smooth-ease promise; regression | Medium | Fix now (T-307 rule) |
| I-171 | Low: a view switch within ~1 s of reaching a zone at cruise | Medium: a zone skipped, no report | Low | Combine with the I-170 fix, or owner accepts |

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — no test of a piece faster than the base meeting a slower one (I-170).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**

## Observations (non-blocking)

- `pacedAdvance`'s `direction` -1 is test-only (pacing rates are positive).
- Frames beyond `MAX_PACE_STEPS` drop real time (slows, never skips) — as documented.
