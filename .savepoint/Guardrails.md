---
type: guardrails
status: active
---

# Guardrails — Engineering Policy

> The rules below are a worked example. **Replace these rules with your project's own engineering policy** — delete what does not apply, and add the rules your domain actually needs. Hold durable project constraints only, once `Design.md` is mature enough to know what they are — not Task-specific instructions and not a running commentary on in-flight work. Keep roughly 10–20 substantive rules, using stable category IDs so Tasks and Checks can cite a rule instead of restating its prose.

## Purpose

This document is the authoritative engineering policy for Astraeus.

If a rule can block a Check's verdict or require remediation, it must be defined here. Skills must not invent blocking policy that isn't recorded here.

## Severity Model

| Severity | Meaning |
|---|---|
| Blocker | Must be fixed before a Check can return `CLEAR`, unless the owner explicitly approves an exception. |
| Required | Must be satisfied before approval unless an explicit waiver is recorded. |
| Guideline | Improve when practical. Does not block a Check by itself. |

## Rule Index

### Security

| ID | Severity | Rule |
|---|---|---|
| SEC-01 | Blocker | Secrets, tokens, and credentials must not be hardcoded or committed. |
| SEC-03 | Required | Client-facing error responses must not expose stack traces, internal file paths, or secrets. |

### Architecture And Provenance

| ID | Severity | Rule |
|---|---|---|
| ARCH-01 | Required | No mission, experience or dataset names in `src/core/` or generic shell/presentation code; experience content arrives as configuration or data. |
| ARCH-02 | Required | Scientific State never depends on presentation: scale policy, camera, selection, UI and rendering consume State and never change it. |
| ARCH-03 | Required | A new or changed generic capability is proven with a synthetic or alternative configuration in contract-level tests; one experience passing, including Apollo, is not evidence of reuse. |
| PROV-01 | Required | Reconstructed, approximated or illustrative data carries provenance and its published known limitations, and is never presented as measured or exact. |

### Data

| ID | Severity | Rule |
|---|---|---|
| DATA-01 | Blocker | Destructive schema or data changes require explicit owner approval. |

### Testing And Evidence

| ID | Severity | Rule |
|---|---|---|
| TEST-01 | Required | Every changed behavior must have named outcome evidence: a test or an explicit scenario validation. |
| TEST-02 | Required | Bug fixes must include a regression test or an explicit failing scenario that proves the bug. |
| TEST-03 | Required | "Existing tests cover it" is acceptable only when the exact test file and case names are recorded. |
| TEST-04 | Required | If an optional Task Check is skipped, Task evidence must carry an explicit owner waiver; the waiver never replaces the mandatory Objective Check. |

### Code Style

| ID | Severity | Rule |
|---|---|---|
| STYLE-01 | Guideline | **One job per file** — split files when responsibilities mix. |
| STYLE-02 | Guideline | **One job per function** — small, named, testable units. |
| STYLE-03 | Guideline | **Test branches** — cover meaningful conditionals and edge cases. |
| STYLE-04 | Guideline | **Types document intent** — prefer explicit types over comments. |
| STYLE-05 | Guideline | **Build only what is needed** — no speculative abstractions. |
| STYLE-06 | Guideline | **Handle errors at boundaries** — validate inputs, APIs, IO, and external data. |
| STYLE-07 | Guideline | **One source of truth** — no duplicated rules, constants, state, or config. |
| STYLE-08 | Guideline | **Comments explain why** — not what the code already says. |
| STYLE-09 | Guideline | **Content lives in data** — keep copy/config out of logic. |
| STYLE-10 | Guideline | **Small diffs** — minimal, reviewable, behaviour-preserving changes. |

### Code Health

| ID | Severity | Rule |
|---|---|---|
| CODE-01 | Guideline | **Complexity** — bring a Watch signal back to its watch line; the aim is not a target. |

## Savepoint Check Enforcement

`savepoint-check` applies these rules through `agent-skills/references/check-method.md`: Quick evidence is optional and applies only to a requested Task Check; Full evidence is mandatory for an Objective Check. Code style rules are Guideline severity throughout — they inform review but never block a Check's verdict by themselves.

Required waivers must be explicit and documented. Blocker exceptions require direct owner approval.
