# Astraeus Spike 04 — Brief

Owner brief, supplied 2026-10-10. The text under "Critical Instruction" is the owner's, kept verbatim; the decisions below it were confirmed in the G-004 planning session the same day.

## Critical Instruction — Validate Astraeus, Not the Demo

Spike 04 exists to validate and improve **Astraeus as a reusable astronomy engine**.

The Perseids experience is a test fixture, not the primary deliverable.

### Mandatory rules

1. **Engine-first evaluation.** Every proposed task must identify which Astraeus capability, contract or architectural assumption it validates.

2. **Reuse before extension.** Start with existing Astraeus capabilities. If something cannot be achieved, identify the precise gap before proposing changes.

3. **No demo-driven architecture.** Do not introduce Perseids-specific logic into generic engine, rendering or UI components.

4. **No visual-success substitution.** A convincing Perseids animation does not prove Astraeus works. Visual quality is necessary for storytelling, but insufficient for architectural acceptance.

5. **Evidence at the abstraction boundary.** Tests must demonstrate that generic Astraeus components work independently of Perseids configuration.

6. **Cross-experience regression.** Apollo must continue working, but Apollo passing alone is not evidence that new capabilities are generic.

7. **Challenge new abstractions.** Every proposed extension must explain why it belongs in Astraeus rather than the Perseids experience adapter.

### Required task structure

Every implementation task must explicitly state:

- **Astraeus capability being tested**
- **Existing contract being reused**
- **Gap or hypothesis being investigated**
- **Generic change required, if any**
- **Evidence that proves reuse independently of Perseids**

If a task cannot answer these questions, it does not belong in this spike unless it is essential fixture setup.

### Required evidence

For every new reusable capability, demonstrate:

1. It operates with Perseids data.
2. It operates with a minimal synthetic or alternative configuration.
3. It contains no Perseids-specific assumptions.
4. Its behaviour is covered by contract-level tests.
5. It preserves existing Apollo functionality.

### Stop condition

If implementing Perseids requires bypassing Astraeus contracts, embedding experience-specific behaviour in generic components, or changing scientific state to accommodate presentation:

**STOP — REPLAN REQUIRED.**

Document the architectural gap and propose a generic solution before proceeding.

### Definition of Done

Spike 04 is complete only when its findings explain:

- Which Astraeus capabilities were successfully reused.
- Which existing abstractions failed or proved insufficient.
- Which generic capabilities were added or changed, and why.
- What evidence demonstrates those capabilities are reusable.
- Which limitations remain.
- Whether Astraeus could support a second meteor shower primarily through configuration.

**A successful Perseids demo with unproven Astraeus abstractions is a failed spike.**

## Confirmed Decisions — 2026-10-10

1. **View:** space view only. A ground-observer (topocentric) view is out of scope and is recorded as a known gap for a later spike.
2. **Perseids data:** published facts — parent comet 109P/Swift-Tuttle's orbit, radiant, activity window, peak date and zenithal hourly rate — with a modelled particle spread around them. Everything modelled carries `illustrative` provenance and is never presented as observed.
3. **Second shower:** a second meteor shower (for example the Geminids) built from configuration only is a pass/fail requirement. If it needs code changes, the spike reports that as a finding.
