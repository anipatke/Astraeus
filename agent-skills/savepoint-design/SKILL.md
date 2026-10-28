---
name: savepoint-design
description: Maintains Savepoint Design and Guardrails and the current Objective, detailing Tasks only for the next ready Objective, when the `Next` line starts with `Plan` or `Replan`, router state is design, or an executor returns REPLAN REQUIRED.
---

# Savepoint Skill: Design

## Purpose

Own the technical shape needed by the next unit of work: `Design.md` describes implemented reality, `Guardrails.md` holds durable constraints, and one Objective at a time carries detailed Tasks. Later Objectives stay named outcomes with Boundaries.

Do not write production code. Route product choices to the owner; technical readiness does not require the owner to review code. Routing, router edits, lifecycle terms, owner authority and CLI rules follow AGENTS.md; an executor's `REPLAN REQUIRED` re-enters this skill's workflow, not a separate phase.

## Read

- `.savepoint/router.md`
- `.savepoint/Idea.md`, when it exists, for the original intent
- `.savepoint/Design.md` overview and only the linked contract/history sections relevant to this Objective
- `docs/agents/verification.md`; `docs/agents/build.md` when planning verification
- `.savepoint/Guardrails.md`
- The current Objective file
- Targeted implementation evidence needed to settle readiness for the next Objective — read to verify interfaces, ownership, and constraints, not to design speculatively

Read nothing else: linked architecture sections count only when relevant, and source files only as far as a readiness decision needs. Do not detail Tasks for any Objective beyond the next one.

## Workflow

1. Update `Design.md` to describe implemented reality, and `Guardrails.md` to hold durable project constraints; keep Objective deltas as the record of planned change until reconciliation. Describe confirmed Code Health tools (the owner's `.savepoint/health/config.json`) in `Design.md` in plain words; the exact commands stay in that file.
2. Keep exactly one Objective active. Objectives beyond it stay named outcomes with Boundaries — no detailed Tasks.
3. Before detailing an Objective's Tasks, inspect its stated requirements against Idea, Design, Guardrails, dependencies, and targeted evidence. Use the Objective Decision Interview below to resolve material choices that are missing, ambiguous, or contradictory; do not fill product or verification gaps by assumption. Summarize the proposed outcome, success conditions, boundaries, and key technical decisions in plain language, and obtain the owner's explicit design confirmation. Record confirmed decisions in the Objective. Then apply the readiness gate below; do not detail Tasks for an unconfirmed or unready Objective.
4. After confirmation, detail the implementation Tasks as ID-free drafts through `savepoint create-task`, then present the plan for owner review before routing to execution. When parallel planning is on (see Parallel Planning below), you may name the parallel lanes in plain words in that review, for example "T-101 and T-102 can run side by side in worktrees; T-103 waits for both." A confirmed Objective design is not approval to implement or to mark a Task done.
5. When the implementation approach for a piece of work is unknown, write a bounded research Task with a named decision deliverable instead of a confident plan the executor will discover is fiction.
6. Split a Task that carries multiple unrelated outcomes or an unresolved architectural decision into separate Tasks. Keep work that genuinely shares files in one sequential lane rather than forcing a split. Optional lane shaping follows Parallel Planning below.
7. When an executor returns `REPLAN REQUIRED`, reassess Design, Guardrails, or the Objective as needed, then resume from step 2.
8. Plan every implementation's verification and owner validation under `docs/agents/verification.md`; never substitute a Task-only result or waiver for Objective clearance. When a Task needs a verification approach, name it and reference `agent-skills/references/check-method.md` for how it will later be evaluated; do not restate that method. When the work touches processes, paths, signals, or file replacement, also name in its Technical Verification the platform evidence the Full Check needs (for example the native Windows CI job) and who produces it, so it exists before the Check starts; the project's own gates still decide.
9. When the next Objective's Tasks are detailed and approved, select that Objective and its first unblocked planned Task in the router (AGENTS.md Router Selection), set `state: task`, and hand off to `savepoint-task`; do not write a free-text next action.

## Parallel Planning

Parallel planning is an optional, advisory feature. Its project preference is `features.parallel_planning` in `.savepoint/config.yml`, off by default and changed from the board's Advanced Options screen (press `o`) or by editing that file. It is separate from Code Health, which has no toggle. Read the preference only when planning Tasks.

- Off, missing or unreadable: plan ordinarily. Do not ask for, add or require lane keys or manifests.
- On: you may offer them; sequential planning and omitting them stay fine. Suggested metadata is optional frontmatter, never required for a Task to load, start or finish:
  - Objective `lanes: [{key, title}]`, with lowercase letters, digits and hyphens in `key`; a Task's `lane: <key>` is its only membership record.
  - Task `planned_reads` and `planned_writes`: exact file paths, no globs. An omitted list means unknown; an explicit `[]` means reviewed and empty. Shared reads are fine; a write that another Task reads or writes is not independent unless explained.
  - Objective `independence`: for one pair of Tasks, the exact write/read overlaps and a reason they do not couple them. The explanation is bound to the reviewed manifests and goes stale when they change. It never covers shared writes or a real `depends_on` path.
- Real dependencies come first: put a semantic dependency (one Task needing another's result) in `depends_on`, whatever the manifests say. `Context Files` stay the read budget; they are not the lane manifest.
- Do not backfill lane metadata onto existing Tasks, and do not treat malformed or stale advice as a blocker; it only withholds a recommendation.

## Objective Decision Interview

Before the design confirmation in workflow step 3, identify unresolved decisions or assumptions that could change the current Objective's outcome, success conditions, boundaries, interfaces, data ownership, dependencies, or verification. Challenge them against Idea, Design, Guardrails, and targeted evidence allowed by Read. Answer factual questions from that evidence yourself; ask the owner about material product or verification choices.

Ask one material decision at a time, starting with decisions that constrain later ones, and wait for the answer. Use an available structured question tool, or plain text when none is available. Offer concrete options with their tradeoffs and recommend one when justified. Briefly state each settled decision, then follow any consequential uncertainty it exposes. Do not reopen settled choices without new evidence or changed requirements.

Keep the interview scoped to the current Objective. Stop when its material choices are settled and the Readiness Gate can be applied; unknown technical feasibility or implementation approach may instead need a bounded research Task with a named decision deliverable. Do not ask the owner to establish facts that require research, or detail distant work to resolve every possible branch.

Summarise the settled outcome, success conditions, boundaries, and key technical decisions for the existing explicit design confirmation; this interview adds no approval checkpoint. Record confirmed planned decisions in the Objective, keeping `Design.md` about implemented reality. On `REPLAN REQUIRED`, repeat the interview only for decisions affected by what broke, then follow the same confirmation and readiness requirements.

## Task Creation

The planner never chooses, reserves, or writes a Task ID or destination filename. Prepare the complete Task Markdown as an ID-free draft. Its `objective` field may be omitted or must match the selected Objective. Create each new Task with:

```bash
savepoint create-task --objective O-### --draft <path> [project-dir]
```

The command allocates the next project-wide `T-###`, adds the Task identity and Objective to the draft, derives the filename from the title, prints the assigned ID and path, and strict-loads the complete index before reporting success. It holds the allocator lock through creation and validation, so concurrent planners for different Objectives receive distinct IDs; never predict, copy or reserve a number. A failed post-reservation creation may retire an ID, so never retry by selecting that number yourself.

## Adding A Goal

A missing or unresolved Goal selection is reported to the owner (AGENTS.md Required Goal Context); never infer one. When adding another Goal:

1. Allocate a stable global `G-###` identity from the first unused G number. Keep that identity stable across title or path edits, never silently reuse it, and fail closed on duplicates. Existing R-### identities remain unchanged.
2. Author the Goal sections `Outcome`, `Why`, `Success Conditions`, and `Boundaries`. The outcome describes the grouped Objectives' result, not whether anything has been published or deployed.
3. Give each member Objective the required `release:` compatibility field containing its Goal's R-### or G-### identity. Derive membership from those Objective records; do not maintain a second membership list.
4. Keep Objectives and Tasks in their normal locations and ownership: a Goal does not nest files, own Tasks, or recreate an Objective → Task hierarchy.
5. A Goal is complete when every member Objective is complete; completion is derived, not a publishing action.

### Goal Workflow Review

When every member Objective of a Goal is done, the first planning session afterwards (or any session the owner asks) writes a `## Workflow Review` section in that Goal's `Release.md`. It is a note: not an Objective, Task or Check. It reviews the workflow skills, shared references, AGENTS.md routing guidance, and scaffolded project documents against the Goal's records: REPLAN REQUIRED Tasks, NEEDS WORK Checks, Issues, and lessons carried in. A review that finds nothing says "no change, because…" and costs no Objective, Task or Check. A real change it finds becomes an ordinary Objective or an Issue.

What the review may change depends on who owns the files. In a project that receives the skills from the package, it tunes the project's own Guardrails, AGENTS.md project rules, and configured gates, and records suggestions for the packaged skills as Issues rather than editing them. It adds no field, state, command, or Goal-owned Task list, and a Goal is still complete when every member Objective is complete.

## Objective Artifact Template

Write the Objective file with this structure:

```markdown
---
id: O-###
title: Objective Title
status: planned|in_progress|done
depends_on: [O-###]
release: G-###
# Optional ordering metadata: priority defaults to medium; omit rank to leave unranked.
# priority: critical|high|medium|low
# rank: 1
last_check: optional-check-id
freshness:  # optional; only to mark the latest Check stale or unknown
  state: current|stale|unknown
  check: C-###
  assessed_by: {role: checker, session: <session>}
  assessed_at: '2026-09-19T00:00:00Z'
  basis: what was compared to reach this state
---

# O-###: Objective Title

## Outcome

The concrete result this Objective delivers.

## Why

Why this Objective matters now.

## Success Conditions

Observable conditions that mean this Objective is done.

## Architectural Considerations

Interfaces, data ownership, and constraints this Objective must respect.

## Boundaries

**In scope:**
- Included work

**Out of scope:**
- Excluded work
```

Every Objective must set `release:` to its Goal's stable R-### or G-### identity; this is the compatibility field, not free-form text.

Task membership is derived from which Tasks name this Objective as their owner. Do not also maintain a second, manually kept list of member Tasks in the Objective body — that list drifts from the Tasks themselves and becomes a second source of truth.

## Task Artifact Template

Write each Task file with this structure, filled as a worked example rather than an empty skeleton:

```markdown
---
title: Resume unfinished work without changing project files
objective: O-008
status: planned
depends_on: [{task: T-013, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: planning-example}
---

# Resume unfinished work without changing project files

## Outcome

Reopening an existing project shows selected work, recorded Check freshness, and one understandable next action without changing project files.

## User Check

Open a project awaiting a Check; invoke resume and compare selection, owner-wait state, evidence date, and Next with the board. Confirm no evidence collection or project writes.

## Done When

Correct selection and Next; explicit stale/unknown evidence; named malformed/missing selection; unchanged file bytes and mtimes. Apply `docs/agents/verification.md` for Check evidence; record required owner validation after mandatory integration evidence.

## Context Files

Name exact paths, optionally qualified by a Markdown heading for a scoped read — no globs or directory-only entries. For example, `.savepoint/Design.md` under `Interfaces and Data Flow`; an unqualified path means the whole file. Source examples: `src/commands/status.ts`, `src/commands/status.test.ts`, `src/project/index.ts`, `src/cli.ts`, `src/resume/render.ts`, `src/resume/render.test.ts`.

## Design References

Exact Design heading names and any governing linked contract/history headings; avoid unstable line numbers.

## Guardrails

FS-01, FS-03, DATA-02, DATA-03, ARCH-01, ARCH-03, TEST-01..04, TEST-08.

## Implementation Plan

1. Confirm the preceding project/Next APIs exist; return REPLAN REQUIRED if they do not.
2. Add thin resume argument handling with named errors.
3. Render selection, outcome, implementation/technical/owner states, Issues, evidence basis/date, and Next.
4. Keep presentation deterministic; no subprocess to generate evidence.
5. Wire main dispatch through the injected runner pattern.
6. Verify awaiting Check, awaiting owner, stale/unknown evidence, missing target, malformed router, no Task yet, and writer failure.

## Boundaries

No new Task states, evidence collection, Objective creation, automatic model routing, or duplicate gate logic.

## Technical Verification

Focused tests during iteration; handoff and Full Check gates from AGENTS.md's Verification Policy.

## Technical Evidence

Pending execution: named cases, results, reviewed source basis, files read/changed, and limitations, recorded after the work lands.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
```

`title` and `objective` are separate required fields with different jobs. `title` is a short, plain-English phrase written for the task's owner; it must never be the Outcome text, a truncation of it, or a restatement of the technical objective. `objective` is always an `O-###` reference to the owning Objective, never free text, and every Task belongs to exactly one Objective. `owner_validation.required` and `planned_by` are recorded at planning time, not left as placeholders.

Evaluate title readability through owner-facing scenarios; field validation alone does not establish that a title reads clearly.

## Design Template

`Design.md` carries these sections: Architecture, Components/Codebase Map, Interfaces and Data Flow, Boundaries, Decisions, Current Technical State. Keep Design as a current overview and package map. Substantial subsystem contracts belong in linked `docs/architecture/` references, loaded only for the affected scope. Preserve technical limits and decision provenance there; existing dated history is retained, not rewritten as current status. Reconciliation updates the overview and relevant contract rather than appending a chronological progress report. Design describes implemented reality concisely; it is not a backlog. Planned change lives in the active Objective's deltas until the work lands, at which point Design is reconciled to match.

## Guardrails Rule

`Guardrails.md` holds durable project constraints only, once Design is mature enough to know what they are — not task-specific instructions and not a running commentary on in-flight work. Keep roughly 10–20 substantive rules, using stable category IDs (like `FS-01`, `TEST-03`) so tasks and checks can reference a rule instead of restating its prose. Guardrails, not this skill or any task file, owns severity and exception authority for those rules. Tasks and checks must not duplicate guardrail prose; they cite the rule ID.

## Commands And Procedures Reconciliation

When reconciling a migrated project's commands and procedures, follow `agent-skills/references/commands-and-procedures.md` (config contract and Health-Check.md mapping); do not restate it.

## Issue Capture

When planning surfaces drift, a guardrail gap, or follow-up that does not belong inside Design or the current Objective's Tasks, capture it as an Issue (`agent-skills/references/issue-capture.md`) instead of folding it into Design or a Task plan. This skill may read and reference Issues but never performs the owner's `accepted` resolution or reopening. Its only Issue closure: when it promotes an Issue's repair into a new Objective, it retires that Issue immediately as `escalated` naming the new Objective (issue-capture.md, Escalation Retires The Issue).

## Readiness Gate

Detail an Objective's Tasks only after the owner confirms its design and all of the following are settled:

- Interfaces and data ownership for the work are settled, not still open questions.
- Constraints on the work are scoped, not open-ended.
- The outcomes of any Task or Objective this one depends on are known.
- There is a verification approach for the work, even if the detailed check itself runs later.

When any of these is not yet true, that gap is the thing to resolve next — either by settling it directly or by writing a bounded research Task that produces the missing decision.

## Rules

Write only Design, Guardrails, the current Objective, the next Objective's detailed Tasks, and the routing handoff; never production code or detailed backlog beyond the next Objective. Keep Task titles distinct from outcomes and Objective references as the artifact contract requires.
