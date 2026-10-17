---
id: G-004
title: Astraeus Spike 04 — Perseids as an engine test
status: done
---

## Outcome

Complete Astraeus Spike 04: test whether Astraeus can host a materially different experience — a meteor shower — through generic, reusable capabilities, using Perseids as a test fixture. The spike ends with evidence of what was reused, what failed, what generic capability was added and why, and whether a second shower works from configuration alone.

## Why

Idea success criterion 3 says a second, materially different experience must run on the same engine without experience-specific changes to the core. Spikes 01–03 proved the engine only on Earth–Moon and Apollo. A meteor shower differs in kind (many particles, time windows, illustrative data), so it is the right stress test.

## Success Conditions

The Definition of Done in `docs/ASTRAEUS_SPIKE_04_BRIEF.md` (canonical brief) holds, with its confirmed decisions. Every new reusable capability is shown with Perseids data, with a synthetic or alternative configuration, without Perseids assumptions, under contract-level tests, and with Apollo preserved. A second meteor shower built from configuration only passes, or its failure is reported as a finding.

## Boundaries

Internal spike. Space view only; no ground-observer view. No Perseids-specific logic in generic engine, rendering or UI code. Scientific State never changes to suit presentation. Observed meteor datasets, the imperative `Astraeus.Scene` API, narration, chapters and publishing are out of scope.

## Closure — 2026-10-17

Closed by the owner's direct instruction in chat ("FIX THIS", "JUST THE RECORD", "Im not wasting 45 mins over a single check"), recorded by the agent. Every member Objective is done: O-008, O-009, O-010, O-011 (C-045 CLEAR), O-012 (C-046 CLEAR) and O-014 (C-026 CLEAR). O-009 is done by exception, not CLEAR: its latest Check C-013 is NEEDS WORK with one unmet requirement, T-030/DW3 (the "before" headless frame-pacing figure), covered by the owner's structured `exception` on T-030 (recorded 2026-10-11, carried forward at C-013). The board's goal-close gate does not honour that exception, so this status was set on the record directly; no Check result was changed and nothing here claims CLEAR for O-009.
