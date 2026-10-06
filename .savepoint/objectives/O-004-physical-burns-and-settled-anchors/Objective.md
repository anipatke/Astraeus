---
id: O-004
title: Validate Astraeus trajectory integration with mission samples
status: done
depends_on: [O-002]
release: G-002
---

# O-004: Validate Astraeus trajectory integration with mission samples

## Outcome

The Apollo sample demonstrates that Astraeus consumes a reconstructed spacecraft path through the same generic `Trajectory → State` contract as natural bodies and reuses the existing Earth–Moon scene without mission-specific logic in core. The reconstruction is deterministic, its sources and modeling limits are explicit, and the spike is presented as a proof of Astraeus rather than a claim of historical Apollo flight accuracy.

## Why

G-002 proves that a sampled mission trajectory can reuse Astraeus's generic state, scale, floating-origin, and rendering pipeline. O-002 cleared the core trajectory extension; O-004 retains the source and offline reconstruction work as a realistic provider example. The post-TLI speed spike is a limitation of this Apollo sample, accepted by the owner for this spike. The engine contract and scene integration are the acceptance focus; historical flight accuracy may be improved later.

## Success Conditions

1. Columbia and Eagle enter the runtime through `SampledTrajectory` and the generic `Trajectory → State` interface; `src/core/` and the tracked-body scene path contain no Apollo-specific behavior.
2. Runtime trajectory states preserve their body, center, EQJ frame, time bounds, and position/velocity meaning. Out-of-range evaluation has the documented error behavior, and both true-scale and readable-scale views consume the same physical trajectory states.
3. The browser scene demonstrates the sampled provider through the existing Earth–Moon experience, including mission times, follow/focus, and event navigation; Earth/Moon behavior remains unchanged.
4. The offline Apollo reconstruction remains deterministic. Source corrections, inferred overrides, physical-burn residuals, coast smoothing, and other approximations are described as reconstruction data, not Astraeus guarantees.
5. The post-TLI A-02>A-03 speed anomaly remains disclosed as a limitation of the Apollo sample. It is not represented as authentic Apollo motion and is not a failure of the generic Astraeus trajectory contract; I-008 records the owner's acceptance for this spike.
6. `docs/APOLLO11_RECONSTRUCTION.md`, `docs/APOLLO11_SOURCES.md`, `docs/ASTRAEUS_SPIKE_02.md`, and `.savepoint/Design.md` distinguish the engine behavior being demonstrated from the fidelity limits of this particular dataset.

## Confirmed Decisions — 2026-10-06

Owner confirmed in the G-002 planning session:

- **Scope:** data fixes only — I-007 and I-002. I-003, I-004 and I-005 stay open as Spike 03 follow-ups.
- **A-13 source reading:** the executor establishes it from sources (owner does not read the table); any override needs the owner's yes/no on presented evidence.
- **Burn treatment:** physical burns from the ignition anchor with a published cutoff residual, replacing exact two-anchor pass-through for cutoff anchors. Chosen over keeping Hermite arcs with published peak speeds, and over instantaneous impulses.
- **Design summary** confirmed with "Confirm".

### Owner Direction After C-005 — 2026-10-06

- The purpose of Spike 02 is to prove Astraeus's generic trajectory integration using Apollo samples, not to establish historical Apollo flight accuracy.
- The owner accepted I-008 as a limitation of the Apollo sample. Future Apollo data refinement is possible, but no new burn model or anchor change is required to prove Astraeus in this spike.
- Objective clearance focuses on the generic trajectory contract, scene integration, deterministic outputs, and explicit provenance/limitations. This acceptance does not claim the post-TLI motion is physically plausible.

## Architectural Considerations

- All change is offline in `tools/apollo11/` and `data/apollo11/`; the runtime `SampledTrajectory` contract and `src/` stay untouched (generated samples change).
- `smoothedCoast` in `tools/apollo11/segments.ts` today integrates forward from the start anchor's state; a coast after a burn must start from the burn's modelled cutoff state so the join is continuous. Keep that start-state input generic, not burn-specific naming in the coast.
- The burn model reuses the offline dynamics (`tools/apollo11/dynamics.ts`: Earth J2, Moon, Sun) plus thrust; burns stay in their anchor's reference body (`poweredHermite`'s single-body rule holds).
- Raw anchors stay as printed except for cited transcription corrections; overrides live only in `inferredOverrides` (STYLE-07, STYLE-09).
- The Apollo reconstruction is a mission-specific provider example. Its known content limitations are carried with provenance and do not redefine Astraeus's generic trajectory contract.
- Verification approach: focused tests plus the 1 s scan and byte-identical rerun; Full Objective Check per `agent-skills/references/check-method.md`, re-running `tools/validate/browser-spike02.mjs` for scene evidence.

## Boundaries

**In scope:**
- Generic trajectory-provider and scene integration evidence using the completed Apollo reconstruction; deterministic offline data and explicit source/model provenance; reconciliation of the existing report and design notes with the accepted I-008 limitation.

**Out of scope:**
- I-003 uncertainty display, I-004 landing-site offset, I-005 HUD and ReadableScale radii.
- Proving the exact Apollo 11 flight path or refining every Apollo coast for historical physical accuracy; future Apollo data enrichment may be planned separately.
- Guidance, variable-thrust or mass-flow models beyond the completed constant-acceleration work; changes to descent, ascent or surface-hold segments.
- Runtime, scene, UI or `src/core/` changes; calling the result the exact Apollo 11 flight path.
