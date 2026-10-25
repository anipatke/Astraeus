<!-- SAVEPOINT:BEGIN -->
# Agents Guide

## Workflow

1. If the owner pasted a `Next` line, act on it directly; it is the selection, so do not re-run `savepoint resume` to confirm it. Otherwise run the read-only `savepoint resume` command and act on its `Next` line.
2. The Next line's first word says what to do; use it to choose the skill: `Start`, `Build`, or `Test` → `savepoint-task`; `Check` → `savepoint-check`; `Assess` → `savepoint-check` (applicability only, no new Check); `Plan` or `Replan` → `savepoint-design`; `Pick a Task in` → select the Objective's next Task, then `savepoint-task`; `Fix` → repair with `savepoint-task` under `issue-capture.md`; `Choose` → report it to the owner, who decides; `Accept`, `Close`, `Blocked`, `Done`, or `Resolved` → report it to the owner, who decides. When an Objective or Task is selected with an Issue, follow the Objective or Task and treat the Issue as context. If a selected record is reported stale, do not substitute other work.
3. Activate the skill per the table below and follow its Read section and the active Task's Context Files.

If the Next line does not name an Objective, Task, or Issue, follow the router `state` and the resume guidance; do not guess a record. If the `savepoint` binary is unavailable, read the router selection, report that the tool is missing, and do not guess the next step.

The active skill is the canonical workflow source. This guide defines routing, terminology, and repo rules only; do not duplicate skill-by-skill prompt instructions here.

## Skill Activation

| State | Skill |
|-------|-------|
| idea | savepoint-idea |
| design | savepoint-design |
| task | savepoint-task |
| check | savepoint-check |

`REPLAN REQUIRED`, returned by `savepoint-task` on a materially invalid plan, routes back into `savepoint-design`. It is not a fifth router state — `state` stays `design` while the planner resolves what broke.

Use the `skill` tool when the listed skill is available. If the agent says the skill is not found, read `agent-skills/{skill}/SKILL.md` directly and follow it as the active skill.

## Router Selection

The board advances the router when the owner closes a Task. `savepoint-design` selects the next Objective, and `savepoint-task` selects the Task it starts. Agents and board actions never blank or change `release:`; only an explicit owner Goal choice changes it.

An owner may ask, `set router to O-### [T-###] [I-###]`, or select an Issue alone with `set router to I-###`. Confirm every named record exists and, when a Task is named, require an Objective and confirm the Task belongs to it. If a record is missing or the Task belongs elsewhere, do not edit the router; explain why. For an Issue-only selection, clear `objective` and `task`; for an Objective/Task selection, clear `issue` unless the owner named one. Edit only the `objective`, `task`, and `issue` selection keys, leaving `release:` byte-for-byte unchanged unless the owner names a Goal as part of an explicit Goal choice. Finish by running `savepoint resume` and showing its `Next` line.

After a direct Issue repair selected alone, follow `agent-skills/references/issue-capture.md`, Out-Of-Scope Repair, for the exact router handoff. Preserve `release:`.


## Verification Policy

Before planning verification, implementing, handing off, or checking work, read [the verification policy](docs/agents/verification.md). It owns gate evidence, optional Task-check waivers, independent Checks and mandatory Objective Checks. Read [project gates](docs/agents/build.md) to choose or run commands. `quality_gates` in `.savepoint/config.yml` owns the ordinary commands.

## Required Goal Context

The router must select a live Goal; each live Objective names exactly one Goal in `release:`. Only an explicit owner Goal choice changes router `release:`. Missing, unknown or archived selections are reported to the owner, never guessed. For Goal repair, creation, migration or adoption, read [Goal and adoption rules](docs/agents/goal-and-adoption.md). Goals group Objectives, never own Tasks or imply publishing.

## Terminology

- Router `state` is the current state: `idea`, `design`, `task`, or `check`.
- Task `status`: only `planned`, `in_progress`, or `done`.
- Task `stage`: **required** when `status: in_progress` — `build` → `test` → `audit`; reaching `audit` means the Task is ready for a Check, and explicitly does not mean it passed.
- Never write `stage: implementation`; use `stage: build` when starting implementation work.
- Agents may set a Task to `status: in_progress` when starting implementation, and its owning Objective from `planned` to `in_progress` at the same time. That is the only Objective status change an agent makes.
- Only the owner may set a Task to `status: done` or retreat a Task to an earlier status. **Stop. Prompt the owner before continuing** when that decision is required.
- Only `savepoint-check` may write a Check record or close an Issue as `verified`. The owner may resolve an Issue as `accepted` from the board's Issues panel and reopen a resolved one. Board resolution records the fixed reason, owner actor, and time; it is not technical `CLEAR`. An agent may record an owner decision only when directly instructed. `savepoint-design` may close an Issue as `escalated` when it promotes the repair into a new Objective.

## Issue Capture

Capture defects, drift, guardrail gaps, and durable follow-up that does not belong inside Design or the current Objective's Tasks as Issues at `.savepoint/issues/I-###-slug.md`. "Defect" maps to `type: defect`, not a separate workflow. Enter `agent-skills/references/issue-capture.md` for search-before-creating, artifact fields, resolution authority, append-only history, and repair routing.

## Worktree Lanes

Detect a lane before writing: the owner names it, or `git rev-parse --git-dir` differs from `git rev-parse --git-common-dir`. In a lane, read [lane rules](docs/agents/worktree-lanes.md): never write the router or create Tasks, Checks or Issues; commit on the lane branch without pushing or merging.

## Existing Codebase Adoption

For adoption or reconstruction, read [adoption rules](docs/agents/goal-and-adoption.md). Use targeted evidence; never infer owner intent from code.

## Code Style

Code style is project-owned policy: the `STYLE` rules in `.savepoint/Guardrails.md` are the single source of truth. Read them when writing or reviewing code. They are Guideline severity and advisory — they inform review but never block a Check by themselves. If the project has no `.savepoint/Guardrails.md`, code style is not defined for it.

## Build

Read [project gates and tooling](docs/agents/build.md) when selecting or running verification, changing build tooling, or releasing. Never `npm publish` or run `tools/publish-packages.mjs` without `--dry-run`; GitHub releases publish.

## Codebase Map

The current package map is in [.savepoint/Design.md](.savepoint/Design.md#componentscodebase-map). Load it for architecture readiness or locating a subsystem, not automatically for every Task.

## Context Budget

Follow the active skill's Read section and the Task's Context Files. Read only relevant sections of linked references; links are not instructions to load every document. A Context Files entry may name an exact path and heading; unqualified entries retain their whole-file meaning. Log necessary targeted extra Task reads with path, section and reason before reading. Read Idea for original intent and Design for architecture readiness. Do not scan outside the active scope.

Shared references under `agent-skills/references/` are non-triggerable: `check-method.md` routes Check modes; `issue-capture.md` is entered for Issues; `commands-and-procedures.md` is entered for migrated config reconciliation.

## CLI Rules

Agents may run `savepoint resume`, a read-only command that prints `Next` without writing project files. No other `savepoint` command is for agents except the narrow Task creation operation below. `savepoint health setup [dir] [--apply]` is human-only: it suggests health tools and, with `--apply`, saves them; agents never run it. `savepoint health report [dir]` is likewise human-only: it rewrites `.savepoint/health/report.md` from the newest snapshot.

Exception: agents may run `savepoint health check O-### [dir]` only during a Full Objective Check, after the full gate, to collect one official Code Health snapshot and record its ID in the Check. Task Checks and all other activity never run it.

Exception: agents may run `savepoint create-task --objective O-### --draft <path> [dir]` only to create a new Task from an ID-free draft. The command assigns the project-wide Task ID and strict-loads the index before reporting success. Do not use it to edit or rename a Task, and do not choose or write Task IDs manually.

After writing or editing any `.savepoint/` record, including creating or renaming one, run `savepoint resume`. If the record fails to load, fix it and run `savepoint resume` again until it loads. Do not substitute other work while it fails.

## Reporting to the Owner

The Context Log stays technical and precise — it's the record a Check session verifies later. Chat replies to the owner are a different audience: a few plain sentences, no jargon, no file/function dumps unless asked. Say what happened and what's next; leave the mechanism in the Context Log.

<!-- SAVEPOINT:END -->

## Astraeus Project Rules

Project-owned rules outside the Savepoint-managed block (added by the G-002 retrospective, O-003, 2026-10-06).

- **Spikes test engine hypotheses.** An Objective in a spike states what it proves about Astraeus (state, providers, presentation, story layer). Demo data quality is held to the Idea principle: reliable where data exists, plausible where it doesn't, explicit about the difference. A demo dataset's fidelity is never an Objective's acceptance target unless the owner says so explicitly.
- **One active session per checkout.** Only one agent session writes `.savepoint/` records or the router on the main checkout at a time. Run parallel work in worktree lanes (see Worktree Lanes). A session that finds records changing under it stops and reports to the owner.
- **Commit at Objective close.** The owner commits after closing each Objective so that Checks have a real diff baseline; an untracked tree makes `git diff` evidence vacuous.
- **Deferred Design reconciliation.** When architecture notes are deferred to an integration Task, name that Task in the originating drift note. The integration Task accounts for each deferred note as reflected in Design.md or explicitly non-architectural, with a reason, before the Full Objective Check.

Read [browser policy](docs/agents/browser-policy.md) before any browser validation, browser-script work, or UI change affecting those scripts. It preserves the owner's once-per-change rule, Task exception, screenshot prohibition, driver boundary and evidence retention. The owner judges appearance on `localhost:5490`.
