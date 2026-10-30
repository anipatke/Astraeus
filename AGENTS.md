<!-- SAVEPOINT:BEGIN -->
# Agents Guide

## Workflow

1. If the owner pasted a `Next` line, it is the selection: act on it without re-running `savepoint resume`. Otherwise run the read-only `savepoint resume` and act on its `Next` line.
2. The Next line's first word picks the skill:
   - `Start`, `Build`, `Test` → `savepoint-task`; `Pick a Task in` → select the Objective's next Task, then `savepoint-task`; `Fix` → repair with `savepoint-task` under `issue-capture.md`.
   - `Check` → `savepoint-check`; `Assess` → `savepoint-check` (applicability only, no new Check).
   - `Plan` or `Replan` → `savepoint-design`.
   - `Choose`, `Accept`, `Close`, `Blocked`, `Done`, `Resolved` → report it to the owner, who decides.
3. Follow the skill's Read section and the active Task's Context Files.

When an Objective or Task is selected with an Issue, follow the Objective or Task and treat the Issue as context. If a selected record is reported stale, do not substitute other work. If Next names no Objective, Task or Issue, follow the router `state` (below) and the resume guidance; do not guess a record. If the `savepoint` binary is unavailable, read the router selection, report that the tool is missing, and do not guess the next step.

| State | Skill |
|-------|-------|
| idea | savepoint-idea |
| design | savepoint-design |
| task | savepoint-task |
| check | savepoint-check |

`REPLAN REQUIRED`, returned by `savepoint-task` on a materially invalid plan, routes back into `savepoint-design`; it is not a fifth router state (`state` stays `design` while the planner resolves what broke).

Use the `skill` tool; if a skill is not found, read `agent-skills/{skill}/SKILL.md` and follow it as the active skill. The active skill is the canonical workflow source; this guide holds routing, terminology and repo rules only.

## Router Selection

The board advances the router when the owner closes a Task. `savepoint-design` selects the next Objective, and `savepoint-task` selects the Task it starts. Agents and board actions never blank or change `release:`; only an explicit owner Goal choice changes it.

An owner may ask `set router to O-### [T-###] [I-###]`, or `set router to I-###` for an Issue alone. Confirm every named record exists; a named Task requires an Objective it belongs to. If a record is missing or the Task belongs elsewhere, do not edit the router; explain why. An Issue-only selection clears `objective` and `task`; an Objective/Task selection clears `issue` unless the owner named one. Edit only the `objective`, `task` and `issue` keys, leaving `release:` byte-for-byte unchanged unless the owner names a Goal as an explicit Goal choice. Finish by running `savepoint resume` and showing its `Next` line.

After a direct repair of an Issue selected alone, `agent-skills/references/issue-capture.md`, Out-Of-Scope Repair, sets the router handoff. Preserve `release:`.

## Verification Policy

Before planning verification, implementing, handing off or checking work, read [the verification policy](docs/agents/verification.md): it owns gate evidence, optional Task-check waivers, independent Checks and mandatory Objective Checks. `quality_gates` in `.savepoint/config.yml` owns the ordinary commands; read [project gates and tooling](docs/agents/build.md) when selecting or running verification, changing build tooling or releasing. Never `npm publish` or run `tools/publish-packages.mjs` without `--dry-run`; GitHub releases publish.

## Required Goal Context

The router must select a live Goal; each live Objective names exactly one Goal in `release:`. Only an explicit owner Goal choice changes router `release:`. Missing, unknown or archived selections, including Next `Choose a Goal` or a `savepoint doctor` report of a missing Goal or `release:`, are reported to the owner, never guessed. Only `savepoint-design` adds a Goal (`savepoint-idea` fills the fresh G-001 placeholder). Goals group Objectives, never own Tasks or imply publishing.

For Goal repair, creation, migration, or adopting or reconstructing an existing codebase, read [Goal and adoption rules](docs/agents/goal-and-adoption.md). Adoption uses targeted evidence and never infers owner intent from code.

## Terminology

- Router `state` is the current state: `idea`, `design`, `task`, or `check`.
- Task `status`: only `planned`, `in_progress`, or `done`.
- Task `stage`: **required** when `status: in_progress` — `build` → `test` → `audit`. Start implementation at `stage: build`, never `stage: implementation`. Reaching `audit` means the Task is ready for a Check, and explicitly does not mean it passed.
- Agents may set a Task to `status: in_progress` when starting implementation, and its owning Objective from `planned` to `in_progress` at the same time. That is the only Objective status change an agent makes.
- Only the owner may set a Task to `status: done` or retreat a Task to an earlier status. **Stop. Prompt the owner before continuing** when that decision is required.
- Only `savepoint-check` may write a Check record or close an Issue as `verified`; `savepoint-design` may close one as `escalated` when it promotes the repair into a new Objective. The owner may resolve an Issue as `accepted` from the board's Issues panel and reopen a resolved one; board resolution records the fixed reason, owner actor and time, and is not technical `CLEAR`. An agent records an owner decision only when directly instructed.

## Issue Capture

Capture defects (`type: defect`, not a separate workflow), drift, guardrail gaps and durable follow-up that does not belong inside Design or the current Objective's Tasks as Issues at `.savepoint/issues/I-###-slug.md`. Enter `agent-skills/references/issue-capture.md` for search-before-creating, fields, resolution authority, history and repair routing.

## Worktree Lanes

Detect a lane before writing: the owner names it, or `git rev-parse --git-dir` differs from `git rev-parse --git-common-dir`. In a lane, read [lane rules](docs/agents/worktree-lanes.md): never write the router or create Tasks, Checks or Issues; commit on the lane branch without pushing or merging.

## Code Style

The `STYLE` rules in `.savepoint/Guardrails.md` are the single source of truth for code style; without that file, none is defined. Read them when writing or reviewing code. They are Guideline severity and advisory: they inform review but never block a Check by themselves.

## Context Budget

Follow the active skill's Read section and the Task's Context Files; links are pointers, not instructions to load every document. A Context Files entry may name an exact path and heading (read that section); an unqualified path means the whole file. Log necessary extra Task reads with path, section and reason before reading. Read Idea for original intent and Design for architecture readiness; the [package map](.savepoint/Design.md#componentscodebase-map) is for locating a subsystem, not for every Task. Do not scan outside the active scope.

Shared references under `agent-skills/references/` are non-triggerable: `check-method.md` routes Check modes; `issue-capture.md` is entered for Issues; `commands-and-procedures.md` for migrated config reconciliation.

## CLI Rules

Agents run only `savepoint resume` (read-only; prints `Next` without writing project files), plus two narrow exceptions:

- `savepoint create-task --objective O-### --draft <path> [dir]` creates a new Task from an ID-free draft; it assigns the project-wide Task ID and strict-loads the index before reporting success. Never use it to edit or rename a Task, and never choose or write Task IDs manually.
- `savepoint health check O-### [dir]` runs only during a Full Objective Check, after the full gate, to collect one official Code Health snapshot whose ID the Check records. Task Checks and all other activity never run it.

`savepoint health setup [dir] [--apply]` (suggests health tools; `--apply` saves them) and `savepoint health report [dir]` (rewrites `.savepoint/health/report.md` from the newest snapshot) are human-only.

After writing, creating or renaming any `.savepoint/` record, run `savepoint resume`. If the record fails to load, fix it and rerun until it loads; do not substitute other work while it fails.

## Reporting to the Owner

The Context Log stays technical and precise — it's the record a Check session verifies later. Chat replies to the owner are a different audience: a few plain sentences, no jargon, no file/function dumps unless asked. Say what happened and what's next; leave the mechanism in the Context Log.

<!-- SAVEPOINT:END -->

## Astraeus Project Rules

Project-owned rules outside the Savepoint-managed block (G-002 retrospective, O-003, 2026-10-06).

- **Spikes test engine hypotheses.** An Objective in a spike states what it proves about Astraeus (state, providers, presentation, story layer). Demo data quality is held to the Idea principle: reliable where data exists, plausible where it doesn't, explicit about the difference. A demo dataset's fidelity is never an Objective's acceptance target unless the owner says so explicitly.
- **One active session per checkout.** Only one agent session writes `.savepoint/` records or the router on the main checkout at a time. Run parallel work in worktree lanes. A session that finds records changing under it stops and reports to the owner.
- **Commit at Objective close.** The owner commits after closing each Objective so that Checks have a real diff baseline; an untracked tree makes `git diff` evidence vacuous.
- **Deferred Design reconciliation.** When architecture notes are deferred to an integration Task, name that Task in the originating drift note. The integration Task accounts for each deferred note as reflected in Design.md or explicitly non-architectural, with a reason, before the Full Objective Check.
- **Strategic fix first** (owner, 2026-10-30). Prefer the long-term general fix over a short-term or special-case one. When a consumer, a check or the owner hits a trap, fix the rule that allowed it and, where it can be mechanised, add or extend a check so the same trap fails a test next time (ARCH-06 is the worked example).
- **Browser policy.** Read [browser policy](docs/agents/browser-policy.md) before any browser validation, browser-script work, or UI change affecting those scripts. The owner judges appearance on `localhost:5490`.
