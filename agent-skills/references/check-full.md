---
type: check-method-reference
triggerable: false
---

# Full Objective Check

Mandatory for Objective closure. Read [common rules](check-method.md) and this entire reference. Apply every applicable section in the checklist's order; common sections are in check-method.md, Full-specific sections are below. Copy the checklist into the Check record and tick each step as completed. No Task waiver replaces this integration Check. References to the credible-blocker exception, Issue admission and evidence gates refer to the matching sections of the common rules.

### Full Check Progress Checklist

Each step names the section that defines it, in method order. Skip a step only where its section says it does not apply.

```markdown
- [ ] Establish Scope
- [ ] Freeze The Check Scope
- [ ] Turn Acceptance Into Invariants
- [ ] Build The Mandatory Coverage Matrix
- [ ] Finite External-Boundary Matrix
- [ ] Workflow And Side-Effect Check Lock
- [ ] Matrix Completion Lock
- [ ] Parallel Planning Advice
- [ ] Perform The Adversarial Pass
- [ ] Re-check After Remediation
- [ ] Verify File Reality
- [ ] Verify Evidence And Gates
- [ ] Collect Code Health Evidence
- [ ] Complete The Issues Pass
- [ ] Summarize Materiality
- [ ] Review Code Style
```

## Freeze The Check Scope

Before the first adversarial probe, trace the real code and workflow, then
write a numbered scope lock containing:

1. the acceptance criteria, guardrails, and release gates being tested;
2. the changed files and supported public entry points;
3. the directly relied-on runtime orchestration, external effects, and
   dependency behavior needed for those entry points to keep their promise;
4. the selected matrix axes and cells, including explicit not-applicable
   cells;
5. the supported-path and materiality boundary used to admit an Issue.

The scope lock defines what the Check means by `complete`. Do not expand into
unrelated dependency internals, unsupported configurations, or increasingly
remote hypothetical states.

During the initial Check only, new source evidence may correct a factual
mistake in the scope lock. Record the amendment and restart the affected
matrix pass. Once the initial verdict is returned, the lock is immutable for
every re-check. Do not silently introduce a new axis, dependency layer,
acceptance interpretation, or meaning of "adjacent" during remediation review.

## Build The Mandatory Coverage Matrix

Full mode only. A Quick Task Check uses the Quick Check Procedure instead.

Before running focused probes, create a concrete matrix for the scoped public
behavior. List every row and applicable axis; mark a cell not-applicable only
with a reason tied to scope or an acceptance rule. A prose checklist is not a
matrix.

Always include these axes when applicable: public surfaces (every
constructor, factory, parser/validator, state reducer, pure renderer, output
backend, and selection/helper entry point); input shape (normal, empty,
missing, duplicate, wrong type, mixed type, non-finite, mutable input, and
mutation after validation); state (every state, every allowed transition, and
backward, skipped, overlapping, terminal-revival, post-failure, and
representation-switch transitions); environment/output (interactive and
redirected sinks crossed with normal, no-colour, dumb/no-cursor, failure,
warning, timeout, and explicit public overrides); boundaries (the exact
limit, immediately below and above it, and the full small finite range when
practical); sequences (complete workflows including initialization,
intermediate milestones, completion, failure, retry/repeat, and final
output); representations (serialization round trips, direct models,
structured events, and rendered output where each exists); and text classes
(ASCII, control characters, combining marks, variation selectors, wide
characters, emoji modifiers, regional flags, and joined emoji when text width
or truncation is in scope, using an independent oracle when one is available).

Run the matrix through repeatable parameterized tests or one deterministic
Check harness where possible. Record its rows, cell classifications, and
command/output evidence. Ad-hoc probes may supplement the matrix but cannot
replace it.

Once the initial Check starts its adversarial probes, this matrix is the
frozen scope lock. A missing required cell discovered during that initial
Check is a Check-process error: amend the lock explicitly and rerun the
affected matrix before returning a verdict. A re-check may never add the
missing cell retroactively as a new blocking perimeter.

### Finite External-Boundary Matrix

When scoped code relies on a server, subprocess, browser runner, provider, or
other external boundary, classify this finite set during the initial Check:
configured target and actual runtime target; startup, discovery, and reuse
ordering; connection refusal or unavailable dependency; successful and
non-success responses; redirect behavior; timeout and cancellation;
malformed or unexpected response; retry, cleanup, and partial side effects
where applicable; and secret-safe failure output.

Mark a cell not-applicable only with a scope reason. Do not invent additional
network or toolchain edge classes during later re-checks unless they meet the
credible-blocker exception below.

## Workflow And Side-Effect Check Lock

Full mode only. A Quick Task Check uses the Quick Check Procedure instead.

Apply this lock to any command or workflow with multiple operations,
external calls, persistence, transactions, generated artifacts, cleanup, or
structured progress. Derive the inventory from the actual code path and
external effects, not from task notes or a test table that is meant to
verify it.

Before testing, record a table for the complete workflow: order, real
operation, side effect / state change, failure timing, failure owner and
final state, cleanup / secondary failure, and independent oracle.

The inventory must include, when applicable: input parsing, guards, setup,
constructors, and connection/client creation; external calls and each
operation that can partly succeed; transaction begin, write, commit,
rollback, and retry behavior; artifact build, encode, open, partial write,
flush/sync, replace, invalidation, and temporary-file cleanup; `finally`
blocks, resource close, reporter/output close, and interruption; and the
point where success becomes externally visible.

For every real operation: decide whether failure is command-fatal, a
warning, or secondary cleanup information, following acceptance criteria or
guardrails and never silently replacing or hiding the primary failure;
exercise failure before, during, and after its side effect when those states
differ; trace the operations actually entered against the intended order and
expected failure prefixes; verify semantic state, not only file existence or
matching counts; use an independent oracle rather than a second copy of the
implementation's own calculation; and mutate or bypass the general rule, not
only the original reproduction.

### Matrix Completion Lock

Do not begin the verdict or Issue write-up until every mandatory cell is
classified as passed, Issue, unverified, or not-applicable with a reason;
every prior remediation is reproduced inside the matrix or a named adjacent
cell; every Issue has been followed by completion of all remaining cells; the
acceptance-coverage classification has been reconciled against the matrix
results; and every applicable multi-step or side-effecting workflow satisfies
the Workflow And Side-Effect Check Lock above.

If time, tooling, or environment prevents completion, classify the affected
acceptance criterion as unverified and return `NEEDS WORK`; never silently
shrink the matrix.

## Perform The Adversarial Pass

Full mode only. Ask every applicable question below to challenge the completed coverage and workflow matrices:

- Can another constructor, factory, public API, serialization form, or environment path bypass validation?
- Can backward, skipped, overlapping, revived, or post-failure transitions violate the invariant?
- Can mode or representation changes bypass monotonicity, ownership, authorization, idempotency, or safety?
- Can redirected, no-colour, non-interactive, failure, retry, or timeout output lose required information or expose forbidden information?
- Do boundary, Unicode, parser, date/time, pagination, and numeric probes establish the relevant input class rather than one sample? Can duplicate, empty, missing, non-finite, mixed-type, or unexpected values create an impossible model or unhandled exception?
- Do tests use an independent outcome, rather than the implementation's own calculation and assumptions?

For state machines, structured events, parsers, renderers, auth, billing, persistence, jobs, and multi-step writes, verify relevant inputs and transitions through the required matrices; informal spot checks do not suffice.

## Collect Code Health Evidence

Full mode only. A Quick Task Check, and every other Savepoint activity, never
collects health.

1. Run the project's full gate first (see Verify Evidence And Gates). Test and
   coverage health instances read the reports that gate wrote, so tests do not
   run twice.
2. Run `savepoint health check O-### [dir]` for the Objective under review. It
   saves one `official` snapshot and prints the snapshot ID, whether a new
   snapshot was created, and a plain verdict. It exits non-zero only when no
   snapshot was saved; a blocking verdict still exits 0, so read the verdict.
   Never use a manual snapshot (from the board refresh) as Check evidence.
3. Record the printed snapshot ID in the Check frontmatter as
   `health_snapshot`. A project with no health configuration prints "Code
   Health is not configured"; record "Code Health not configured" in the Check
   body, omit `health_snapshot`, and do not treat it as a finding.
4. Treat the verdict as supporting evidence, never as `CLEAR` or as proof the
   Objective is healthy. Blockers include failing tests, high/critical vulnerabilities, required instances that failed or are stale, and opt-in `blocking` rules. A verdict that says "blocks clearance" prevents
   `CLEAR`: record the Issues behind it and result `NEEDS WORK`. A verdict that
   "does not block clearance" neither grants nor withholds `CLEAR`.
5. Keep collection failure, incomplete coverage, stale reports, unhealthy
   measurement, and Check findings as separate statements. A failed tool is not
   bad code.
6. Optional-instance failures, warnings, Watch results, and unknown-severity
   vulnerabilities do not block. Open an Issue for one only through the Issue
   Capture judgment below, when durable follow-up is warranted; collection
   never creates Issues.
