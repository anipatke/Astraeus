---
id: O-003
title: Review the Spike 02 workflow and tune project rules
status: done
depends_on: [O-002, O-004]
release: G-002
---

# O-003: Review the Spike 02 workflow and tune project rules

## Outcome

A recorded retrospective of how the Savepoint workflow served G-002, with any project-owned changes made and packaged-skill suggestions captured as Issues — or an explicit "no change, because…" conclusion.

## Why

The Goal Workflow Retrospective keeps project rules, gates and guidance aligned with what actually happened during the Goal.

## Success Conditions

The review covers G-002's REPLAN REQUIRED Tasks, NEEDS WORK Checks, Issues and carried-in lessons against the workflow skills, shared references, AGENTS.md project rules, Guardrails and configured gates, and records its conclusion in this Objective.

## Boundaries

**In scope:** tuning this project's Guardrails, AGENTS.md project rules and configured gates; recording packaged-skill suggestions as Issues.

**Out of scope:** editing packaged skills or shared references; adding fields, states, commands or Goal-owned Task lists. Tasks are detailed only when this Objective becomes next.

## Retrospective Conclusion — 2026-10-06

Owner direction: do and close the retrospective now; prioritise Astraeus findings for the next spike and beyond; note Apollo demo issues for later as non-blocking.

### What happened in G-002

- **Records reviewed:** O-002 (T-005…T-013) and O-004 (T-014, T-015); Checks C-002 (NEEDS WORK), C-003 (CLEAR), C-004 (CLEAR), C-005 (NEEDS WORK) and C-006 (CLEAR); Issues I-001…I-008. No Task returned REPLAN REQUIRED.
- **The engine hypothesis was proven early.** T-006/T-008 and C-004 showed a sampled spacecraft fits `Trajectory → State` with no mission naming in core. That was the spike's purpose.
- **Most later effort went to Apollo data fidelity:** T-010, T-011, T-013, T-014 and T-015, plus both NEEDS WORK verdicts (I-006 miss attribution, I-008 post-TLI speed). O-004 set "no impossible speeds" on a demo dataset as an acceptance target. The physical burn fix then introduced a worse spike, which the owner accepted as a sample limitation once O-004 was reframed around the engine.
- **The "every G-002 Issue repaired before close" rule** pulled presentation and data repairs into an engine-proof Goal. It was reversed by moving them to G-003 and I-009.
- **Workflow friction:** concurrent sessions on the main checkout (a router edit during execution; an interrupted re-check that left an orphaned admission ledger); an untracked tree that makes diff evidence vacuous; headless-only visual evidence with no owner visual judgement.

### Changes made (project-owned)

- `AGENTS.md`, new "Astraeus Project Rules" section outside the managed block:
  - spikes test engine hypotheses, and demo data is held to "plausible and labelled";
  - one active session per checkout;
  - the owner commits at Objective close;
  - browser validation is the fuller gate for scene-affecting work.
- `.savepoint/Guardrails.md`:
  - added ARCH-01 (no mission names in core or the generic shell), ARCH-02 (State never depends on presentation) and PROV-01 (reconstructed or illustrative data carries provenance and published limitations; never presented as measured);
  - removed SEC-02 (no protected routes exist).
  - O-005's Tasks now cite the new rules.
- Configured gates are unchanged: typecheck, build and test fit. Lint stays unconfigured, which is noted as a gap, not added.
- Issues:
  - I-010 records packaged-skill suggestions: the re-check lock when the owner revises criteria, concurrent sessions, and retrospective closure.
  - I-009 records the Apollo demo follow-ups.

### Astraeus findings, prioritised

**Next spike (G-003, already planned as O-005):**

1. **The UI layer is debug tooling.** Build a reusable, configuration-driven shell.
2. **Provenance must reach viewers, not just reports.** The badge and known limitations are per object for now. The engine renders whatever a provider gives it, so truthfulness is a provider responsibility that the UI must expose.

**Spike after (Perseids, the reuse test):**

3. **Many-object providers.** The contract is proven for single bodies only. A meteor stream needs a batch or particle provider, plus performance limits for `stateAt` across thousands of objects.
4. **Second provider kind.** Kepler or osculating elements (comet 109P) behind the same contract, with provenance.
5. **Asynchronous provider data.** The Apollo data ships in the JS bundle (>500 kB chunk advisory). Providers need lazy or fetched data before larger datasets.

**Beyond:**

6. **Developer API and package boundary.** The imperative `Astraeus.Scene` API (Idea success criterion 2) needs a decision on React versus plain Three.js. Today the presentation layer is a React app.
7. **Reference-centre presentation transform.** A Moon-relative (any-centre) view for display only; lunar orbits are unreadable Earth-centred.
8. **Time-ranged provenance and confidence.** Lets paths and timelines highlight exactly where liberties were taken. This is a story-layer need.
9. **ReadableScale radius treatment.** For spacecraft near bodies; currently explained, not solved.
10. **Lunar libration in runtime Moon orientation.** Only when surface positions matter (I-004 shows 254 km).
11. **Story layer.** Captions, annotations, scripted focus and scale changes. Spike 03's design note will list the concrete needs.

### Apollo demo issues (non-blocking)

Recorded in I-009 and deferred: the post-TLI speed (I-008), lunar-orbit smoothing, unconfirmed overrides (A-05, A-33, A-34), the unchecked parking-orbit start, the landing-site offset, documentation tidy-ups and NaN input validation in the tools. None blocks G-002, G-003 or Astraeus work.

### Conclusion

The workflow served the engine proof well but let a demo dataset's fidelity become the acceptance target for about half of G-002. The project rules and Guardrails above correct that locally. Packaged-skill suggestions are in I-010. Ready for owner closure.

### Owner Closure — 2026-10-06

On the owner's direct instruction, the planner set this Objective to `status: done` without a Full Objective Check. The owner judged that a document-only retrospective does not need independent clearance. This is closure by owner decision, not a `CLEAR` result. I-010 item 3 records the missing retrospective closure path.
