---
id: I-173
title: README omits the provider line's known limit (bends seen only against another body)
type: drift
status: resolved
source:
  kind: check
  check: C-174
  actor: {role: checker, session: o070-check-20261112}
  at: '2026-11-12T08:13:00Z'
tasks: [T-309]
checks: [C-174, C-175]
guardrail_ids: [API-07]
severity: low
resolution:
  disposition: verified
  check: C-175
  actor: {role: checker, session: o070-recheck-20261112}
  at: '2026-11-12T08:18:29Z'
  reason: Repair proven by C-175 (CLEAR).
history:
  - at: '2026-11-12T08:13:00Z'
    actor: {role: checker, session: o070-check-20261112}
    kind: observed
    note: Found by the O-070 Full Objective Check; O-070 Success Condition 4 and T-309 Done When (README sentence with the known limit).
    check: C-174
  - at: '2026-11-12T08:13:57Z'
    actor: {role: executor, session: o070-run-20261112}
    kind: repair_attempted
    note: 'README addTrajectory row now says bends are judged about the path center only, so a bend seen only against another body is not refined (Sun-centred path with lineFixedTo "earth" keeps its chords; give it an Earth center). Proof Needed re-run: grep finds the sentence once; no other README text changed (git diff is the one clause); CHANGELOG and Design already state the same rule; npm run lint, tools/api-rules.mjs and publicApiSunPaths.test.ts pass. Executor evidence only.'
    check: C-174
  - at: '2026-11-12T08:18:29Z'
    actor: {role: checker, session: o070-recheck-20261112}
    kind: rechecked
    note: 'Proof Needed met, by C-175 (CLEAR): the README addTrajectory row states bends are judged about the path center only and a bend seen only against another body (Sun-centred path, lineFixedTo earth) is not refined, with the Earth-center remedy; CHANGELOG and Design agree; the diff since C-174 is that one README clause.'
    check: C-175
---

# I-173: README omits the provider line's known limit (bends seen only against another body)

## Summary

O-070 Success Condition 4 requires the README to state how a provider path's line is drawn **and** "the known limit that bends seen only against another body (a Sun-centred path drawn fixed to Earth) are not refined". T-309 Done When repeats it for the `addTrajectory` row. The new README sentence states the first half (128 even moments, up to 3,968 more judged from the path's `center`, 4,096 cap, a close fast pass can cut a corner) but not the known limit. That limit is exactly the Closest Calls case: an asteroid's Sun-centred provider path drawn with `lineFixedTo: "earth"` gets no refinement for its Earth flyby, so a host reading the README cannot tell that it must give the path an Earth `center` (or split it) to see the curve.

## Evidence

- `packages/astraeus/README.md` line 86, the `addTrajectory` row, final sentences ("A `provider` path's line is drawn through 128 evenly spaced moments plus up to 3,968 more ... so the line can still cut a corner there. A `samples` path is drawn at every sample."): no mention of `lineFixedTo` or of bends against another body; `grep -n -i "not refined" packages/astraeus/README.md` finds nothing.
- The limit is real and is recorded only in `.savepoint/Design.md` `Paths across the solar system` ("bends seen only against another body (`lineFixedTo`) are not refined (owner decision)") and in `src/api/planPaths.ts` `providerBody`, which reads positions about `center` only.
- No test covers README wording here (API-07 checks tables against types, not this sentence).

## Proof Needed

The README `addTrajectory` row states that a provider path's bends are judged about its `center` only, so a bend seen only against another body (for example a Sun-centred path drawn with `lineFixedTo: "earth"` past Earth) is not refined; CHANGELOG/Design consistent with it; no other text changed.
