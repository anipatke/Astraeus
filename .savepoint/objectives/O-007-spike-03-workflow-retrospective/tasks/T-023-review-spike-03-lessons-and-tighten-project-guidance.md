---
id: T-023
title: Review Spike 03 lessons and tighten project guidance
objective: O-007
status: done
depends_on: []
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: o007-planning-20261010}
check_waiver:
    task: T-023
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-09T22:53:05Z"
---

# Review Spike 03 lessons and tighten project guidance

## Outcome

O-007 records an evidence-backed workflow retrospective, with justified project policy changes and deduplicated packaged-workflow suggestions.

## User Check

Read O-007's retrospective and the project policy diff. Confirm the conclusions match the Spike 03 experience, the guidance is practical, and the recorded no-change decisions are justified. Owner review follows the mandatory independent Full Objective Check.

## Done When

1. A review matrix in O-007 covers scope changes, actual REPLAN REQUIRED events (or their evidenced absence), C-007 NEEDS WORK and C-008 CLEAR, related Issues, carried-in lessons, and the workflow skills/shared references/project policy. Distinguish planned REPLAN instructions from actual events.
2. Each conclusion names its evidence and disposition: project change, existing rule sufficient with reason, or packaged-workflow suggestion linked to an Issue.
3. Project guidance addresses browser regression maintenance after UI changes, historical evidence preservation, and deferred Design reconciliation, or records why existing guidance is sufficient. Keep policy in its authoritative file and avoid duplicating managed workflow rules.
4. Packaged suggestions are searched against existing Issues, especially I-010, before capture. Do not edit packaged skills/references or rewrite Issue history. Record no new suggestion with a reason when applicable.
5. Configured gates pass at handoff and per-criterion evidence records reviewed/changed files, results and limitations. Application source, tests, datasets and packaged workflow files remain unchanged.
6. Owner review is requested with the concrete retrospective and policy diff. Task completion and Objective closure remain owner decisions; the independent Full Objective Check is mandatory.

## Context Files

- `AGENTS.md`
- `.savepoint/router.md`
- `.savepoint/Guardrails.md`
- `.savepoint/config.yml`
- `.savepoint/Design.md`
- `.savepoint/releases/G-003-astraeus-spike-03-reusable-ui-shell/Release.md`
- `.savepoint/objectives/O-007-spike-03-workflow-retrospective/Objective.md`
- `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/Objective.md`
- `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-016-audit-planetary-explorer-s-ui-for-patterns-worth-reusing.md`
- `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-017-put-a-timeline-bar-around-the-canvas-and-move-diagnostics-behind-a-toggle.md`
- `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-018-let-viewers-pick-objects-and-switch-overview-focus-and-follow.md`
- `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-019-show-object-information-data-trust-and-the-scale-choice-on-request.md`
- `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-020-make-the-shell-work-on-every-screen-size-and-hand-it-over-for-visual-review.md`
- `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-022-show-common-measurements-as-compact-reusable-visuals.md`
- `.savepoint/checks/C-007-o-005-full-objective-check.md`
- `.savepoint/checks/C-008-o-005-full-objective-recheck.md`
- `.savepoint/issues/I-010-workflow-suggestions-from-the-g-002-retrospective.md`
- `.savepoint/issues/I-011-spike-01-02-browser-checks-not-superseded.md`
- `.savepoint/issues/I-012-design-not-reconciled-for-o-005-drift-notes.md`
- `.savepoint/objectives/O-003-spike-02-workflow-retrospective/Objective.md`
- `agent-skills/savepoint-check/SKILL.md`
- `agent-skills/savepoint-design/SKILL.md`
- `agent-skills/savepoint-idea/SKILL.md`
- `agent-skills/savepoint-task/SKILL.md`
- `agent-skills/references/check-method.md`
- `agent-skills/references/commands-and-procedures.md`
- `agent-skills/references/issue-capture.md`

## Design References

Design: Components/Codebase Map and Current Technical State. O-007: Confirmed Design, Architectural Considerations and Readiness.

## Guardrails

TEST-01, TEST-03, TEST-04, STYLE-07, STYLE-10.

## Implementation Plan

1. Verify O-005 completion, C-008 clearance and recorded owner visual acceptance; preserve existing uncommitted owner/checker records. Stop and report if records change under this session.
2. Build a source-linked retrospective matrix in O-007 from the selected records. Read workflow sources to compare their requirements with the actual evidence, without reviewing unrelated application implementation.
3. Decide whether each lesson needs project guidance, already has adequate guidance, or belongs to the package. Make only justified edits to project-owned Guardrails, AGENTS.md project rules or configured gates. Consult commands-and-procedures.md for any gate config change.
4. Search Issues before capturing packaged suggestions under issue-capture.md. Append new dated evidence to an existing relevant Issue where appropriate; do not resolve it without applicable authority.
5. Record the conclusion in O-007, reconcile any retrospective-relevant Design statement whose current status is demonstrably stale, and verify policy ownership and scope through the diff.
6. Run configured handoff gates, record per-criterion evidence, and present the retrospective and policy diff for owner review. Leave Task at audit for the owner decision and later independent Check.

## Boundaries

No application, test, data or browser-script changes; no package edits; no new workflow fields, states or commands; no reopening completed O-005 work. Future product work stays outside this retrospective. Work is sequential because the conclusion and policy edits share evidence and files.

## Technical Verification

Review matrix and diff inspection establish document outcomes. Run the configured typecheck, build and test gates at handoff under AGENTS.md Verification Policy; lint is unconfigured. No scene-affecting changes are planned, so browser execution is not required for this document-only Task. If proposed policy changes alter gate definitions, run the resulting configured gates fresh. The later independent Full Objective Check applies agent-skills/references/check-method.md and the project's full-gate policy; owner validation follows integration evidence.

## Technical Evidence

Started 2026-10-10 by executor session t023-codex-20261010. O-005 is done; C-008 is CLEAR; T-020/T-022 record owner acceptance naming C-008. Router already selects O-007/T-023 with release G-003. No dependency block is recorded. Existing owner/checker working-tree changes are preserved; context-file content hashes were captured at /tmp/t023-baseline.json before edits.

Extra read planned: targeted Issue index search (frontmatter titles and suggestion terms only) to deduplicate packaged suggestions as criterion 4 requires; no unrelated implementation reads.


### Per-criterion handoff outcomes — 2026-10-10

1. Met: O-007's retrospective matrix covers confirmed scope changes, conditional replan instructions versus the absence of recorded actual events in the six O-005 Tasks, C-007/C-008, I-010–I-012, carried-in O-003 lessons and all four skills / three shared references / project policy. Record references link directly to the source files. This is a review of selected recorded evidence, not a reconstruction of unseen chat history.
2. Met: every matrix row names evidence and a disposition. Project changes have reasons; retained rules and gate commands have explicit no-change reasons; the package follow-up links to I-010.
3. Met: three project-owned AGENTS.md bullets address regression scenario mapping, separate evidence output, and named integration accounting for deferred Design notes. The Savepoint-managed guide block is byte-identical to HEAD. Guardrails and config remain unchanged: named outcome evidence and existing gates already apply; the additions are workflow guidance, not new severity rules or runtime surfaces.
4. Met: searched Issue titles and targeted retrospective/package/browser/historical/reconciliation terms before capture. I-010 has a new dated history entry and body update; its original suggestions and history are preserved, status remains open. I-011/I-012 are existing verified repairs and untouched by this session. No new package suggestion or Issue: current workflow already requires evidence and reconciliation, while these prevention steps are project-specific. I-010's historical no-Full-Check suggestion is not adopted.
5. Met: fresh configured gates passed as below; exact reads/changes and limitations are recorded here. Scope inspection and baseline hashes show no application/source/test/dataset/browser-script/package/gate edits and no changes to non-owned Context Files. Existing uncommitted records are preserved.
6. Review requested at handoff with O-007's concrete matrix and the AGENTS.md diff. Owner review/acceptance remains pending and follows the mandatory independent Full Objective Check. Task stays in_progress/audit; this executor writes no Check, waiver, acceptance or completion decision.

### Commands and results

Fresh run on 2026-10-09 approximately 22:51:45–22:52:12 UTC (2026-10-10 Australia/Sydney). Toolchain observed: Node v22.22.2, npm 10.9.7, Vite 8.3.2, Vitest 5.0.3.

- `npm run typecheck` — exit 0.
- `npm run build` — exit 0; existing >500 kB chunk advisory, approximately 1.46 MB minified JS.
- `npm test` — exit 0; 10 files / 170 tests passed, duration 25.78 seconds. No focused test run was needed for this documentation-only work.
- `git diff --check` — exit 0 before and after handoff evidence.
- `savepoint resume` — strict loader passed, no dependency block; at test stage reported Ready. Final audit-stage strict load passed: `Check T-023 — Review Spike 03 lessons and tighten project guidance (O-007)`. Runtime directs the owner to request an optional Task Check or record an explicit waiver; the Full Objective Check remains mandatory.
- `git diff --name-only -- src tests data tools agent-skills package.json package-lock.json .savepoint/config.yml .savepoint/Guardrails.md` — empty.
- Targeted Python scope assertions — all non-owned Context Files match the pre-edit SHA-256 snapshot at `/tmp/t023-baseline.json`; AGENTS managed block matches HEAD. This snapshot is scratch verification only, not a required permanent artifact.
- `node --version`, `npm --version`, `date -u +%Y-%m-%dT%H:%M:%SZ` — recorded runtime/time evidence above.

Lint is unconfigured. Browser validation and Code Health did not run: this Task changes documents only, and official health collection belongs to a Full Objective Check. No historical browser artifacts were generated or overwritten.

### Files reviewed

All Context Files below, plus this Task and the active task skill. Some initial combined outputs were truncated; targeted rereads supplied the relevant omitted policy, Task and Check sections. No application implementation was read for this retrospective.

- `AGENTS.md`
- `.savepoint/router.md`
- `.savepoint/Guardrails.md`
- `.savepoint/config.yml`
- `.savepoint/Design.md`
- `.savepoint/releases/G-003-astraeus-spike-03-reusable-ui-shell/Release.md`
- `.savepoint/objectives/O-007-spike-03-workflow-retrospective/Objective.md`
- `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/Objective.md`
- `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-016-audit-planetary-explorer-s-ui-for-patterns-worth-reusing.md`
- `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-017-put-a-timeline-bar-around-the-canvas-and-move-diagnostics-behind-a-toggle.md`
- `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-018-let-viewers-pick-objects-and-switch-overview-focus-and-follow.md`
- `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-019-show-object-information-data-trust-and-the-scale-choice-on-request.md`
- `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-020-make-the-shell-work-on-every-screen-size-and-hand-it-over-for-visual-review.md`
- `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-022-show-common-measurements-as-compact-reusable-visuals.md`
- `.savepoint/checks/C-007-o-005-full-objective-check.md`
- `.savepoint/checks/C-008-o-005-full-objective-recheck.md`
- `.savepoint/issues/I-010-workflow-suggestions-from-the-g-002-retrospective.md`
- `.savepoint/issues/I-011-spike-01-02-browser-checks-not-superseded.md`
- `.savepoint/issues/I-012-design-not-reconciled-for-o-005-drift-notes.md`
- `.savepoint/objectives/O-003-spike-02-workflow-retrospective/Objective.md`
- `agent-skills/savepoint-check/SKILL.md`
- `agent-skills/savepoint-design/SKILL.md`
- `agent-skills/savepoint-idea/SKILL.md`
- `agent-skills/savepoint-task/SKILL.md`
- `agent-skills/references/check-method.md`
- `agent-skills/references/commands-and-procedures.md`
- `agent-skills/references/issue-capture.md`
- `.savepoint/objectives/O-007-spike-03-workflow-retrospective/tasks/T-023-review-spike-03-lessons-and-tighten-project-guidance.md`

Extra targeted read: `.savepoint/issues/*.md` titles and retrospective/package/browser/historical/reconciliation matches only, for required Issue deduplication (logged before search). Git metadata/status/diff and runtime version output were inspected for worktree identity, preservation and gate evidence; no extra application reads.

### Files changed by this session

- `AGENTS.md`: three project workflow bullets outside managed block.
- `.savepoint/Design.md`: current gate/Check and owner visual-review status; historical T-015 evidence retained.
- `.savepoint/issues/I-010-workflow-suggestions-from-the-g-002-retrospective.md`: appended dated history/body clarification; no resolution change.
- `.savepoint/objectives/O-007-spike-03-workflow-retrospective/Objective.md`: planned → in_progress and retrospective matrix/conclusion.
- This Task: planned → in_progress, build → test → audit, execution evidence and drift record.

Router selection already matched the owner's Next; no router edit. The pre-existing changes in I-011, I-012, O-005, T-020, T-022, router/task IDs and the untracked C-008 remain preserved. The pre-existing O-007 plan is retained. No commit: this is the main checkout and project policy assigns Objective-close commits to the owner.

### Limitations and handoff

The retrospective relies on recorded O-005 execution/independent Check/owner evidence, not new browser inspection. No claim about unrecorded REPLAN or concurrent-session events. Package-owner decisions on I-010 remain unverified; the append does not close that Issue. No technical CLEAR or owner acceptance is claimed for O-007. Review O-007's matrix and the three-bullet AGENTS.md diff; the owner decides Task completion and optional Task Check/explicit waiver. A fresh independent Full Objective Check remains mandatory, and owner validation follows it.

## Drift Notes

Three project workflow rules added to AGENTS.md; no Guardrails/config changes. Design current-status sentences updated from T-015/pending visual review to C-008 and recorded owner acceptance, preserving historical evidence. I-010 receives an append-only dated clarification; no new Issue or package edits. All changes fit the confirmed retrospective scope.
