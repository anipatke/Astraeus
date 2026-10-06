---
id: I-008
title: Post-TLI coast still produces an impossible spacecraft speed
type: defect
status: resolved
source:
  kind: check
  check: C-005
  actor: {role: checker, session: o004-independent-20261006}
  at: '2026-10-06T08:32:00Z'
tasks: [T-015]
checks: [C-005]
guardrail_ids: [TEST-01, TEST-02]
resolution:
  disposition: accepted
  actor: {role: owner, session: owner-chat-20261006}
  at: '2026-10-06T08:48:32Z'
  reason: 'Owner accepted this as a limitation of the Apollo sample for Spike 02: the spike proves Astraeus can consume a generic sampled trajectory, not historical Apollo flight accuracy. Apollo data may be refined later. This is an owner decision, not technical proof that the coast is physically plausible.'
history:
  - at: '2026-10-06T08:32:00Z'
    actor: {role: checker, session: o004-independent-20261006}
    kind: observed
    check: C-005
    note: 'The physical TLI burn misses cutoff position by 454.706 km. The following ten-second A-02>A-03 coast smooths that miss and produces about 73.55 km/s through runtime SampledTrajectory. The one-second movement/velocity consistency scan still returns zero violations. O-004 outcome remains unmet.'
  - at: '2026-10-06T08:39:16Z'
    actor: {role: executor, session: i008-repair-20261006}
    kind: deferred
    note: "Reproduced the O-004 model tradeoff with the existing gravity integrator at 0.25 s and 0.125 s: constant EQJ acceleration fitted to A-02 cutoff velocity leaves 454.706052 km position residual at both steps; numerically fitting A-02 position instead leaves 2.586956640 km/s cutoff velocity residual at both steps. The modelled cutoff-to-A-03 endpoint lower bound remains 509.254764 km over 10 s (50.925476 km/s). Therefore the recorded constant-acceleration velocity-fit decision cannot satisfy the no-impossible-speed outcome at this handoff without changing the burn model or anchor treatment. No code, raw anchor, or override changed; waiting on planning decision."
  - at: '2026-10-06T08:48:32Z'
    actor: {role: owner, session: owner-chat-20261006}
    kind: owner_decision
    check: C-005
    note: 'Owner accepted the post-TLI speed as an Apollo sample limitation for this Astraeus spike. The spike proves the generic trajectory integration; Apollo data enrichment may be considered later.'
---

# I-008: Post-TLI coast still produces an impossible spacecraft speed

## Summary

O-004 promises a reconstruction with no physically impossible speeds. T-015 improves the ordinary burn arcs, but its modelled TLI cutoff feeds a short coast that creates a larger speed spike. Publishing the residual does not satisfy that outcome.

Search before creation covered all existing Issues for TLI, coast and speed symptoms. I-007 is retired by escalation to O-004, not a live repair record. This is the new post-burn coast defect introduced by T-015's cutoff handoff, rather than the old A-13/MCC-1 forced-burn symptom. I-003 addresses uncertainty presentation and is outside this Objective's repair scope.

## Evidence

- Violated requirement: O-004 **Outcome**, “The Apollo 11 reconstruction has no physically impossible speeds.” Relevant frozen cells: C (all burn→coast handoffs including A-02>A-03), R (whole runtime speed/position scan and off-grid post-TLI probes). TEST-01/02 outcome evidence does not establish physical plausibility for this changed handoff.
- Supported reproduction: load `data/apollo11/generated/columbia.json` into the actual `SampledTrajectory`; evaluate `stateAt(-14542671800)` (1969-07-16T16:22:08.200Z, five seconds after TLI cutoff, GET 02:50:08.2). The velocity norm is **73.542988 km/s**. Independently difference positions at ±10 ms: **73.543765 km/s**. The full one-second grid reaches **73.549279 km/s** in this coast.
- Independent endpoint oracle: the modelled cutoff and A-03 positions are **509.254764 km** apart over ten seconds. Any continuous path meeting those two endpoints requires an average speed of at least **50.925476 km/s**, already far above the approximately **10.84 km/s** endpoint speeds. This establishes the defect without trusting the generator's reported velocity or imposing a new residual threshold.
- `tools/apollo11/segments.ts:122` begins the coast from the modelled cutoff; lines 128–140 blend to backward propagation and differentiate the blended position. `tools/apollo11/trajectory.ts:66` passes the preceding segment's endState. These operations are individually continuous but physically incompatible with the short endpoint span.
- `docs/APOLLO11_RECONSTRUCTION.md:79` publishes the 454.706 km cutoff residual; line 80 publishes the 69,263.4 m/s velocity correction. Disclosure is accurate; it does not remove the impossible motion.
- `tools/apollo11/validation.ts:73` compares displacement against the same trajectory's derivative. Zero violations means kinematic consistency, not a physically plausible magnitude. `tests/apollo11Reconstruction.test.ts:237` tests that zero count; the burn-peak regression at line 215 checks only burns, excluding this coast. Both pass on the failing output.
- Repeatable checker scripts and results: `docs/evidence/o004-check.mjs`, `o004-independent-check.json`, `o004-interpolation.mjs`, `o004-interpolation.json`. All configured gates pass; browser reports no errors. This is a product outcome failure rather than a gate or collection failure.

## Proof Needed

Repair the TLI burn/coast combination within O-004's recorded decisions, or return to planning if those decisions cannot support the required endpoints. Do not silently alter raw anchors or create an unapproved override. Preserve physical burn integration, cutoff residual publication, continuous joins, all non-cutoff anchors, and unchanged special segments.

Recheck the C-005 frozen matrix, including the complete Columbia/Eagle one-second scan, post-TLI ±1/±100 ms joins and 100 ms interior probes, independent endpoint average-speed and position-difference oracles, all twelve burn peaks/residuals, interpolation, deterministic outputs, browser and configured gates. Add outcome evidence that fails on the current coast spike; a self-consistency scan alone is insufficient. T-014 and T-015 remain done; repair proceeds under this Issue or planner-selected work, not by retreating their statuses.
