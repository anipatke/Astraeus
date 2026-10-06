---
id: I-009
title: Apollo 11 demo data follow-ups, deferred and non-blocking
type: other
status: open
source:
  kind: report
  actor: {role: planner, session: g002-retro-2026-10-06}
  at: '2026-10-06T09:40:00Z'
tasks: [T-013, T-015]
checks: [C-005, C-006]
history:
  - at: '2026-10-06T09:40:00Z'
    actor: {role: planner, session: g002-retro-2026-10-06}
    kind: observed
    note: Collected in the G-002 retrospective (O-003) from Spike 02 design-note limitations, C-005/C-006 observations and accepted I-008.
  - at: '2026-10-06T09:40:00Z'
    actor: {role: planner, session: g002-retro-2026-10-06}
    kind: deferred
    note: Owner direction in the retrospective — note Apollo demo issues for later, non-blocking. Apollo is a provider example, not an accuracy target; pick these up only if a future story needs them.
---

# I-009: Apollo 11 demo data follow-ups, deferred and non-blocking

## Summary

The Apollo 11 reconstruction is good enough to prove the Astraeus trajectory contract, and its limits are published. These data-fidelity improvements were deliberately not pursued. None blocks G-002, G-003 or any Astraeus work.

1. **Post-TLI speed (I-008, owner-accepted).** The physical TLI burn fit leaves a 454.706 km cutoff position residual, and the 10 s A-02>A-03 coast smooths it at about 73.5 km/s. Options: fit the burn to position and velocity together (for example variable thrust or burn time), or treat the TLI cutoff anchor as a waypoint.
2. **Lunar-orbit smoothing.** Coasts touching A-15, A-27, A-29 and A-30 need the largest corrections (up to about 1,959 km on A-30>A-31), probably from printed headings off the orbit plane or timing drift. Re-read those values against the scan, and consider a lunar gravity field only if the story needs it.
3. **Unconfirmed inferred overrides.** A-05 (docking flight-path angle) and the A-33/A-34 speeds are still owner-approved inferences without documentary confirmation.
4. **Parking orbit start.** Columbia's insertion point is A-01 integrated about 2.5 h backward; no published insertion position has checked it.
5. **Landing-site offset (I-004).** Tranquility Base is 254 km from the drawn site because the runtime Moon has no libration. G-003 labels this; fixing it needs lunar libration in the core (an Astraeus finding, recorded in O-003).
6. **Documentation tidy-ups.** `docs/ASTRAEUS_SPIKE_02.md` section 13 still says the post-TLI correction awaits "planner review" (it was owner-accepted). Design and T-015 say "40 non-cutoff anchors" where 28 are non-cutoffs. `docs/APOLLO11_SOURCES.md` does not mention the accepted limitation.
7. **Tool input validation.** `solvePhysicalBurn` returns NaN for a direct NaN state instead of throwing. This is unsupported input; the runtime rejects nonfinite samples.

## Evidence

`docs/ASTRAEUS_SPIKE_02.md` sections 7.3, 13 and 14; `docs/APOLLO11_RECONSTRUCTION.md` known gaps; `.savepoint/checks/C-005-o-004-full-objective-check.md` and `.savepoint/checks/C-006-o-004-full-objective-recheck.md` observations; `.savepoint/issues/I-008-post-tli-coast-still-produces-impossible-speed.md`.

## Proof Needed

None for now. If picked up, split the chosen item into its own Objective or Task and prove it with the reconstruction tests, the 1 s scan and a byte-identical re-run.
