---
type: check-method-reference
triggerable: false
---

# Shared Savepoint Check Method

`savepoint-check` owns the trigger, scope, mode and immutable record. Design and Task reference this method but never run a Check themselves. Apply [verification policy](../../docs/agents/verification.md) for waivers, dependencies, gates and completion authority.

Load this common method, then exactly one mode reference **in full**:

- Requested Task Check: [check-quick.md](check-quick.md).
- Mandatory Objective Check: [check-full.md](check-full.md).
- Assess: applicability only under the skill's Closure Rules; no new Check or probe procedure.

Use Guardrails and optional project verification procedures when present; skip related steps when absent. Absence is not an Issue. Common sections below apply to both modes; the selected mode defines their order. In a re-check, keep the original mode and scope lock. Full-only matrices, workflow locks, adversarial pass and health collection remain mandatory for Full, and are not loaded for Quick.

## Task Check And Objective Check Depth

A requested Task Check evaluates one Task's acceptance criteria, plan, evidence, and scoped files. The mandatory Objective Check additionally covers every owned Task, including waived Tasks, cross-Task integration, and Design reconciliation. Apply AGENTS.md's Verification Policy for what a Task clearance or waiver does not replace.

## Establish Scope

1. Inspect current files and the diff. Treat context logs, checked boxes,
   prior Check records, remediation claims, and green tests as claims to
   verify, not proof.
2. Verify file reality for every scoped file before referring to it.
3. Load only the acceptance criteria, guardrail rules, Design context, and
   evidence-mode requirements that govern the scoped work.

## Turn Acceptance Into Invariants

For every acceptance criterion:

1. Restate it internally as a general rule, not as one example.
2. List the inputs, state transitions, output paths, environment modes, and
   public entry points that can affect the rule.
3. Check normal, boundary, malformed-input, and failure cases, plus at least one bypass path. Full mode uses the applicable matrix axes in [check-full.md](check-full.md).
4. Run at least one independent scenario that is not merely an existing unit
   test repeated unchanged.
5. Record the expected result, actual result, and concrete evidence.

A regression test proves its example. It does not prove the surrounding
invariant.

## Parallel Planning Advice

Lane keys, `planned_reads`/`planned_writes` manifests and independence explanations are optional advice, and `features.parallel_planning` may be off. Ignoring a lane, running on main, using a different worktree, or changing files beyond a manifest is not a finding and never blocks `CLEAR`. Do not add a status, policy or gate for it, and never accept an executor's self-clearance. Evaluate it only when the scope's acceptance criteria make recommendations a feature: then verify their accuracy as behavior (dependencies respected, unexplained write/read overlap or unknown scope withholds advice, a stale explanation is not used). Malformed or stale advice is a nonblocking diagnostic. Actual-worktree filesystem and identity rules, dependencies and Guardrails stay in force.

## Re-check After Remediation

Use the immutable scope lock from the initial Check. Re-check every original
matrix cell (for a Quick Check, every original scope-lock item), every original reproduction, the remediation's changed code
paths, and only the adjacent cases already named in the original Issue or
scope lock, against the same focused and full gates.

Apply existing axes to remediation code, but do not add new axes, dependency
layers, or interpretations. A failure inside the frozen lock remains an
Issue. A newly noticed problem outside it is an observation for follow-up and
does not change the verdict, unless it is a credible blocker: secret
exposure, cross-tenant or role-boundary access, sensitive-data or privacy
harm, destructive data loss, unsafe billing side effects, or an equivalent
`.savepoint/Guardrails.md` blocker.

Before running a re-check probe, create an admission ledger with one row per
check: the re-check item, the prior Issue or remediation claim, the exact
frozen matrix cell, and the allowed result. Require an exact frozen cell for
every blocking result. A broad topic, general-purpose axis, changed helper,
plural configuration name, or newly noticed supported value is not enough.

If a probe has no exact frozen cell: do not run it as a blocking probe;
record a useful result as a non-blocking observation; do not count it toward
remediation required for closure; promote it only when the credible-blocker
exception above applies, naming the exact Blocker rule.

Start the re-check result with a closure map of the prior Issues: closed,
still open, or unverified.

Also assess every prior owner decision (acceptance or exception) on the scope.
Compare each decision's scope with what changed since its last assessment and
record the outcome as a `carried_forward` entry under `savepoint-check`
Closure Rules. A decision whose scope is unchanged still applies; state why
and do not ask the owner to renew it. List `unmet` requirement IDs on a
`NEEDS WORK` result so exception coverage can be checked.

Default convergence limit: one initial Check; one full re-check after
remediation; if an in-scope failure remains, one targeted remediation and
re-check; then stop and ask the owner to fix now, approve a permitted waiver,
create follow-up work, or close with non-blocking observations outside the
Task or Objective. Do not start a third autonomous remediation cycle or
broaden scope to keep a Check active. At the convergence limit, stop; do not
turn a newly noticed, non-blocking edge case into another remediation round.

## Verify File Reality

Every file named in a Task's evidence, drift note, or remediation claim must
either exist on disk now, be recorded as intentionally deleted, or be
recorded as discarded scratch work. Treat an unexplained phantom file as an
Issue.

## Verify Evidence And Gates

Run focused tests for changed behavior and relevant failure paths. Run
direct type or lint checks when the default gate excludes scoped files. Run
`git diff --check` and the project's configured build and test gates
(`quality_gates` in `.savepoint/config.yml`) unless the invoking skill names
a narrower approved gate. Apply the evidence mode the invoking skill
requires: Quick only for a requested Task Check, Full for the mandatory
Objective Check. Treat passing
tests and gates as supporting evidence, never as a substitute for acceptance
review.

## Complete The Issues Pass

Classify every acceptance criterion before returning a verdict: **Proven**
(independent evidence supports the general rule), **Issue** (a reproducible
scenario violates the rule), or **Unverified** (required evidence could not
be obtained). Any Issue or material unverified criterion means `NEEDS WORK`.
Return `CLEAR` only when every criterion is proven, relevant guardrails are
satisfied, and the required gates pass.

Before admitting an item as an Issue, require all of: it violates a named
acceptance criterion, guardrail, or release gate; it is reproducible through
a supported path; it lies inside the frozen scope lock; the Task or
Objective introduced, touched, widened, or explicitly promises the behavior;
and it has a credible consequence rather than only a theoretical
possibility. If an item fails this test, record it as an observation or omit
it.

Each Issue must include the violated acceptance criterion or guardrail rule,
the smallest reproducible scenario, expected and actual behavior, exact file
and line evidence, and the missing or inadequate test evidence.

Report every Issue from the completed pass together. Do not stop after the
first one. Do not invent requirements: Issues may rely only on acceptance
criteria, `.savepoint/Guardrails.md`, the active evidence mode, or explicit
release gates.

## Summarize Materiality

After the evidence-backed Issues, summarize every one in a compact
materiality table: Issue, Likelihood, Impact, Materiality, Recommendation.
Use Low, Medium, or High for likelihood, impact, and materiality, with a
short explanation where the rating is not self-evident.

Judge likelihood by realistic prerequisites, frequency, reachability, and
whether normal users or only unusual operator states can trigger it. Judge
impact by the credible outcome and existing containment, not only the
theoretical worst case. Combine likelihood and impact with the Task or
Objective's stated purpose and launch boundary to get materiality.
Recommendation states the proportionate disposition: fix now, combine with
another narrow fix, defer to named follow-up work, or accept with an
explicit owner waiver.

Do not copy the Issue order or guardrail severity into the materiality
rating without this separate check. Do not inflate a rare, contained
developer-workflow issue into a product-critical risk. Equally, do not use
low likelihood to excuse a credible blocker such as secret exposure,
cross-tenant access, destructive data loss, or sensitive-data harm.

Materiality guides priority and remediation scope; it does not silently
waive an acceptance criterion or guardrail. If the check shows that an item
does not actually violate an in-scope requirement, reclassify it as an
observation rather than leaving it as an Issue. If any Issue remains, the
verdict remains `NEEDS WORK` unless the owner explicitly approves the waiver
allowed by policy. When there are no Issues, state that no materiality
actions are required instead of emitting an empty table.

List observations separately from Issues. Do not use Issue language, `NEEDS
WORK`, or an in-task fix recommendation for an out-of-scope observation
unless the owner explicitly expands the Task or Objective.

## Review Code Style

When `.savepoint/Guardrails.md` defines `STYLE-*` rules, every Check record
carries a `## Code Style Review` section with one checkbox per rule, in the
order Guardrails lists them. Take rule IDs and labels from Guardrails; do not
hardcode them here. Tick a rule the scoped code follows. Leave a rule
unticked with a one-line reason and file evidence when the scoped code
departs from it. Style is advisory: an unticked rule never creates an Issue
or changes the result on its own. Skip the section when Guardrails defines
no `STYLE-*` rules.

```markdown
## Code Style Review

- [x] STYLE-01 **One job per file**
- [ ] STYLE-10 **Small diffs** — one commit adds ~2,000 lines across 30 files.
```
