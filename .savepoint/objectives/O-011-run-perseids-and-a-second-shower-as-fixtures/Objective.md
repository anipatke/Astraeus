---
id: O-011
title: Run Perseids and a second shower as test fixtures
status: planned
depends_on: [O-009, O-010]
release: G-004
---

# O-011: Run Perseids and a second shower as test fixtures

## Outcome

A Perseids experience built entirely in its own adapter from published facts plus an `illustrative` modelled spread; a second shower (for example the Geminids) built from configuration only; and cross-experience checks over Apollo, the synthetic experience and both showers at mobile and desktop sizes.

## Why

This is where the brief's required evidence is gathered: each new capability works with Perseids data, with alternative configuration, and with Apollo preserved. The configuration-only second shower is the owner's pass/fail test.

## Success Conditions

Shaped after O-009 and O-010. Any need to change generic code for the second shower is recorded as a finding, not patched silently. Owner visual judgement is required for the storytelling quality, and never substitutes for the architectural evidence.

## Architectural Considerations

The stop condition in the brief applies: bypassing a contract, adding Perseids logic to generic code or changing State for presentation returns REPLAN REQUIRED.

## Boundaries

**In scope:** Perseids and second-shower adapters and data, cross-experience browser validation.
**Out of scope:** ground view, observed meteor datasets.
