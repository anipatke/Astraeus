---
name: savepoint-check
description: Runs an independent, fresh-session Check on an explicitly requested Task or a mandatory Objective when the `Next` line starts with `Check` or `Assess`, or router state is check, applying the shared check method to write an immutable Check record and any Issues, and closing work only under the recorded conditional-acceptance rules.
---

# Savepoint Skill: Check

## Purpose

Write an independent, immutable verdict for an optional requested Task Check or the mandatory Full Objective Check. Remediation goes to the planner or executor and is verified in a later run; this role cannot repair work to manufacture clearance. `Assess` is the applicability step in Closure Rules and writes no Check. Routing, Goal problems, router edits, lifecycle terms and CLI rules follow AGENTS.md; this skill never picks or creates a Goal, and uses `savepoint resume` only to resolve Next and validate project loading.

This session must be fresh: independent from the executor's conversation that built the work under review. The same model is allowed; the same session is not. Model names are optional; names or owner/planner self-report do not establish independence.

## Read

- `.savepoint/router.md`
- The requested Task or Objective under review; for an Objective Check, every Task it owns
- The `.savepoint/Guardrails.md` rule IDs the scope names, when the project has that file
- Prior Checks and Issues linked to the scope
- The scoped source and test files the work actually changed
- `docs/agents/verification.md`
- `agent-skills/references/check-method.md` (common rules), then in full only the selected mode: `check-quick.md` for a Task Check, `check-full.md` for an Objective Check. Never load Full procedures for a Quick Check.
- For a Full Objective Check, `docs/agents/build.md` and `docs/agents/browser-policy.md`; for a Task Check, build rules when selecting its applicable gates
- For architecture reconciliation, the Design overview and only the linked sections governing the scope
- For `Assess`, only the scope, prior decisions and Closure Rules; no Check method or gates

## Workflow

For `Assess`, apply Closure Rules to the prior decisions, record applicability and stop; skip the steps below.

1. Confirm the session is fresh. If this session built the work under review, stop and hand off to a fresh session. An owner-requested self-review may provide observations, but never writes a Check record or satisfies the independent Check gate.
2. Confirm the scope and depth (check-method.md, Task Check And Objective Check Depth).
3. Apply the common method plus the selected mode reference, each in full, with its gates (`docs/agents/verification.md`): Quick does not replace handoff gates; Full requires current successful full-gate evidence, reused only under the metadata-only rule.
4. Decide the result. Write one new, immutable Check record — never edit a prior one. A rerun gets a new `C-###` and names the run it replaces in `supersedes`.
5. On `NEEDS WORK`: record the Issues found (`agent-skills/references/issue-capture.md`) and hand remediation back to the executor or planner rather than repairing anything here. A Task Check's `NEEDS WORK` resumes the executor at `stage: build` inside that same Task. An Objective Check's `NEEDS WORK` never retreats a Task that is already `done`: remediation is a direct repair under the recorded Issue by default, or new or newly selected work linked to the Objective only when the repair needs planning (issue-capture.md, Out-Of-Scope Repair); every previously completed Task keeps its status.
6. On `CLEAR`: this alone does not close a Task or Objective. Apply Closure Rules to record whether the owner may complete the Task or accept the Objective outcome.
7. Treat advisory observations, including `STYLE` guardrail rules, as non-blocking. Fill the `## Code Style Review` checklist as the method describes; neither changes the result.
8. Stop. Do not repair implementation, rewrite acceptance criteria, or update Design as part of this run.

Lane groupings and read/write manifests are advisory (check-method.md, Parallel Planning Advice); ignoring them is never a finding.

## Code Health Evidence

Only a Full Objective Check runs `savepoint health check O-### [dir]`, after the full gate, recording the official snapshot ID in `health_snapshot`; check-full.md, Collect Code Health Evidence, covers absent configuration, verdict blockers, optional failures, stale reports and Issue admission. Manual snapshots never count. A signal between the aim and the watch line in `.savepoint/health/config.json` is an observation, never an Issue or a reason for `NEEDS WORK`; list what remains in the Check body. The health verdict supports evidence; it never grants clearance.

## Check Artifact Template

```yaml
id: C-###
scope: {kind: task, id: T-001}
result: CLEAR|NEEDS WORK
checked_by: {role: checker, session: review-001}
executed_session: build-001
checked_at: '2026-09-19T00:00:00Z'
health_snapshot: optional-snapshot-id
reviewed:
  base_commit: optional-base-sha
  head_commit: optional-head-sha
  files: []
  dependencies: []
issues: []
supersedes: null
```

- `health_snapshot`: optional; set only by a Full Objective Check that ran `savepoint health check`, holding the official snapshot ID and nothing else.
- `reviewed`: optional scope metadata, including on `CLEAR`; omit the whole block when there is nothing to record. When present, `files` and `dependencies` hold real path or content-hash entries, or explicit `[]` when that category is absent. It does not establish clearance: `CLEAR` depends on the independent checker recorded on the Check. A `CLEAR` Check is current on its own; no separate freshness assessment is needed.
- `issues`: the `I-###` references this run opened. `supersedes`: the prior `C-###` this run replaces, or empty on a first run; the prior record stays intact.
- `unmet`: a `NEEDS WORK` Check may add `unmet: [<requirement IDs>]`; not allowed on `CLEAR`. When present, an exception grants completion only if its `requirements` cover every listed ID, and each uncovered ID is a named blocker. Without the list, rely on your own assessment of what the exception covers.

The body carries outcome coverage, test and command results, negative and boundary probes, applicable Guardrails, the `## Code Style Review` checklist when Guardrails defines `STYLE-*` rules, owner validation still needed, and nonblocking observations.

## Closure Rules

- A checker may complete a technical Task's optional Check — one with no `owner_validation.required` — once its clearance is current and no unexcepted material blocker remains; only the owner may set the Task's `status: done`.
- A Task with no requested Task Check may be owner-closed only when its implementation evidence is complete and an explicit Task-check waiver is recorded (`docs/agents/verification.md` defines what it satisfies). Never write a Check to stand in for a waiver.
- A Task declaring `owner_validation.required` additionally needs the owner's recorded acceptance: `owner_validation: {required: true, accepted_check: C-###, scope: [<accepted behavior or criterion IDs>], accepted_by: {role: owner, session: <session>}}`. `accepted_check` is the Check it was first given against and stays as provenance; `scope` is optional.
- An owner exception is recorded as a structured `exception` only on the owner's explicit instruction — never as Issue history or prose alone: `exception: {requirements: [<criterion or rule IDs>], reason: ..., owner: <owner>, recorded_at: '2026-09-19T00:00:00Z', check: C-###}`. The owner's waiver of evidence is such an exception; `check` is the originating Check.
- A decision carries forward: an acceptance or exception keeps applying through later Checks while the behavior, requirements and scope it covers are unchanged. Applicability is recorded on the decision, append-only: `carried_forward: [{check: C-###, applies: true, assessed_by: {role: checker, session: <session>}, assessed_at: '2026-09-19T00:00:00Z', reason: ..., material_change: <required when applies is false>}]`. An owner entry in the same list renews the decision and always applies. Never edit the originating Check or an earlier entry.
- A re-check, or an `Assess` step, assesses every prior owner decision on the Objective: compare each decision's scope with what changed since its last entry, and record one `carried_forward` entry per decision at the latest Check. Unchanged scope applies, with the reason stated; do not ask the owner to renew it. Only a material change to a decision's own scope sets `applies: false`, naming the change, and then the owner is asked to renew that decision alone.
- `Assess` writes only the `carried_forward` entries, no new Check record. It never creates, renews or infers an owner decision, and never changes the Check's result.
- Waived evidence is unproven, so a Check stays `NEEDS WORK` while a requirement rests on an exception. A recorded exception can grant completion despite an unmet requirement while it applies, but that is completion by exception, never `CLEAR` or current clearance.
- An Objective closes only after every Task it owns is done, the mandatory Objective integration Check is current, and every material Issue linked to that Check is resolved (including explicit owner acceptance recorded as an Issue resolution), with the same conditional owner-acceptance rule applied at the Objective level. The Full Objective Check reviews every owned Task, including waived Task Checks. An unfinished owned Task is never excused by an Objective-level exception — cross-Task repair goes back through Tasks, and no Objective Check ever closes a Task directly.
- A Goal is complete when every member Objective is complete; no Goal-level clearance or acceptance is required, and completion does not mean published or deployed.
- A record lacking sufficient scope or evidence cannot support completion. A freshness assessment is optional: record one only to mark the latest Check `stale` or `unknown` (for example, when code changed after it). That blocks normal completion until a new Check runs.

## Rules

This skill may write: the Check record, Issues, evaluation metadata, and authorized closure evidence under Closure Rules. It may close an Issue as `verified` after verifying Check proof, and record readiness for owner closure, but never sets Task/Objective `status: done` or records owner acceptance on the owner's behalf; the owner's `accepted` resolution or reopening of an Issue does not create a `CLEAR` Check.

Never repair implementation, edit acceptance criteria to match a result, or update Design as a form of remediation. Route correction back to the planner or executor; verify it in a later immutable record.
