---
name: savepoint-task
description: Executes one Savepoint Task within its planned boundaries when the `Next` line starts with `Start`, `Build`, `Test`, `Pick a Task in`, or `Fix`, or router state is task, recording extra reads, lifecycle progress, and handoff evidence for a fresh savepoint-check session, and returning REPLAN REQUIRED on a material gap instead of redesigning.
---

# Savepoint Skill: Task

## Purpose

Build one Task within its planned boundaries and record truthful evidence. A materially invalid plan returns `REPLAN REQUIRED`; this role cannot grant clearance for its own work. Routing, Goal problems, router edits, lifecycle terms and CLI rules follow AGENTS.md; this skill never picks or creates a Goal.

## Read

- `.savepoint/router.md`
- The active Task
- The owning Objective's boundaries
- The Task's `## Context Files` (a path qualified by a heading means that section; an unqualified path means the whole file)
- `docs/agents/verification.md`; `docs/agents/build.md` when selecting or running gates
- The `.savepoint/Guardrails.md` rule IDs the Task names, when the project has that file

For architecture references, read the named Design section and only the linked contract/history sections governing it; do not load every reference. Record such linked reads with the path, heading and reason in the evidence before reading.

The Context Files are the read budget. Necessary targeted extra reads are allowed, but record each one (path, heading where relevant, reason) in the Task's evidence before reading or editing it. The router, `AGENTS.md`, this skill and the Guardrail IDs the Task names are not extra reads.

## Workflow

1. Confirm the start is allowed: the Task's own dependencies are satisfied and its owning Objective is ready. A blocked start is reported to the planner, never worked around by starting anyway or substituting a different Task.
2. Set the router selection to the owning Objective and active Task (AGENTS.md Router Selection; preserve `release:`), then set the Task `status: in_progress` and `stage: build`, and the owning Objective `status: in_progress` if it is still `planned`.
3. Implement the plan's checklist in scoped order. Treat `STYLE` guardrail rules as advisory, and cite guardrail rule IDs rather than restating rule prose.
4. Advance the stage as work completes: `build` → `test` → `audit`. `audit` means ready for a Check when one is requested (an optional Task Check or the mandatory Full Objective Check), not that it passed.
5. If the plan turns out to be materially invalid, stop and return `REPLAN REQUIRED` (below) instead of redesigning silently.
6. At handoff, verify every acceptance criterion against a concrete outcome, run the gates `docs/agents/verification.md` requires, and record the evidence below whether or not a Task Check is requested.
7. If the owner requests the optional Task Check, hand off to a fresh `savepoint-check` session; the executor's own session can never be that Check. If the owner instead gives an explicit Task-check waiver, record it (below) and route the evidence to the mandatory Full Objective Check.

In a worktree lane (`docs/agents/worktree-lanes.md`): skip the router writes in step 2 and after a direct Issue repair, create no Tasks, Checks or Issues, and commit on the lane branch without pushing or merging.

Lane keys and `planned_reads`/`planned_writes` are optional advice. When `features.parallel_planning` is on you may note in the evidence that the files actually touched differ from the planned writes, but never stop, return `REPLAN REQUIRED`, or refuse a start solely because a manifest changed, a lane was ignored, or a different worktree or none was used. The extra-read rule, dependencies, acceptance criteria, Guardrails and lane rules still apply. When the setting is off, lane metadata is not needed.

## Lifecycle

- A Task Check's `NEEDS WORK` resumes repair at `stage: build` within the same Task. `CLEAR` never sets `status: done`; completion belongs to the owner.
- A mandatory Objective Check's `NEEDS WORK` never retreats a Task that is already `done`. Default to direct repair under its recorded Issue; use new or newly selected work linked to the Objective only when planning is needed. Follow `agent-skills/references/issue-capture.md`, Out-Of-Scope Repair, for proof and the Issue-only router handoff after `repair_attempted`; preserve `release:` and show the resulting `savepoint resume` Next line.

## REPLAN REQUIRED

Material gaps include a missing Context File, a false assumption the plan depends on, a contradictory dependency interface, an approach that cannot work, or a technically impossible acceptance criterion. Do not route around them. Instead:

- record a `replan:` block in the Task frontmatter, with handoff evidence in the body that the planner needs to understand what broke;
- keep the Task's current `status` and `stage` unchanged, and preserve any partial work;
- stop, and hand control to the planner (`savepoint-design`).

`savepoint resume` routes to `Replan` only from this frontmatter block; a REPLAN REQUIRED written only in the body leaves the router on the Task:

```yaml
replan:
  reason: Context File internal/store/lock.go does not exist
  recorded_by: {role: executor, session: <session>}
  recorded_at: '2026-09-19T00:00:00Z'
```

## Issue Capture

When implementation hits a defect, drift or guardrail gap that is not the work this Task owns, record it as an Issue (`agent-skills/references/issue-capture.md`) rather than expanding scope or repairing it silently. This skill may add evidence to an Issue and record an explicit owner-directed `accepted` closure; it never infers acceptance or closes one as `verified`.

## Acting On A Code Health Report

A Code Health report is advisory. When it lists a signal, use the thresholds in `.savepoint/health/config.json`:

- Bring a signal that Needs Attention back to the watch line. The aim is not a target; do not chase it.
- Prefer production code that is risky or often changed over tests, and leave flat dispatch tables alone.
- Do not lower a score by moving branches elsewhere; a split must make the code easier to read.
- Record in the Task evidence what remains above the watch line; never silently stop or silently continue.
- Narrowing the measured scope, for example excluding test files, is the owner's decision.
- Cite a Guardrails complexity rule by ID rather than restating it.

## Evidence And Handoff

At handoff, the Task's recorded evidence must include:

- a per-criterion outcome for every acceptance criterion;
- the named commands actually run, including the applicable build plus fast gate or the full gate;
- the files read and the files changed, including every logged extra read;
- stated limitations — anything not verified, or verified only partially.

Record an owner's Task-check waiver only on the owner's explicit instruction, in this shape (`task` is this Task's own ID); prose in the body does not satisfy the gates. `docs/agents/verification.md` defines what it satisfies.

```yaml
check_waiver:
  task: T-###
  reason: Owner closed this Task without requesting a Task Check.
  actor: {role: owner, session: <session>}
  recorded_at: '2026-09-19T00:00:00Z'
```

A fresh `savepoint-check` session treats this evidence as claims to verify, not proof.

## Rules

This skill may write: scoped implementation, recorded evidence (extra reads, per-criterion outcomes, commands, limitations), lifecycle progress, and a replan handoff.

Never widen scope, edit the Task's acceptance criteria to match implementation, write a Check record, close an Issue on your own, invent a Task-check waiver, or claim clearance or owner acceptance. Reopening an Issue is an owner action. Only the owner sets `status: done` or retreats status.
