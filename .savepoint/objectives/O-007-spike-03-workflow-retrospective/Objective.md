---
id: O-007
title: Review the Spike 03 workflow and tune project rules
status: done
depends_on: [O-005]
release: G-003
---

# O-007: Review the Spike 03 workflow and tune project rules

## Outcome

A recorded retrospective of how the Savepoint workflow served G-003, with any project-owned changes made and packaged-skill suggestions captured as Issues — or an explicit "no change, because…" conclusion.

## Why

The Goal Workflow Retrospective keeps project rules, gates and guidance aligned with what actually happened during the Goal. G-003 is the first UI-led spike and the first with required human visual review, so its verification lessons are worth capturing.

## Success Conditions

The review covers G-003's REPLAN REQUIRED Tasks, NEEDS WORK Checks, Issues and carried-in lessons against the workflow skills, shared references, AGENTS.md project rules, Guardrails and configured gates, and records its conclusion in this Objective.

## Boundaries

**In scope:** tuning this project's Guardrails, AGENTS.md project rules and configured gates; recording packaged-skill suggestions as Issues.

**Out of scope:** editing packaged skills or shared references; adding fields, states, commands or Goal-owned Task lists. Tasks are detailed only when this Objective becomes next.

## Confirmed Design — 2026-10-10

The owner confirmed the proposed design with "yes" in the O-007 planning session.

- Review G-003 scope changes, execution evidence, Check findings, Issues and carried-in G-002 lessons against the workflow sources and project policy.
- Use one sequential Task to record the retrospective and make evidence-supported project policy changes. Focus on maintaining browser regression coverage when UI changes, preserving historical evidence, and reconciling deferred architecture changes before Check.
- Record packaged-workflow suggestions as Issues after checking existing suggestions, especially I-010; preserve append-only history and package ownership.
- Record each conclusion with its source evidence, including explicit reasons wherever no change is needed. Application code and packaged workflow files are outside this work.
- Verify per-criterion evidence and run the configured gates at Task handoff. An independent Full Objective Check remains mandatory; owner acceptance does not replace it.

## Architectural Considerations

Policy ownership is settled: Guardrails owns durable engineering constraints, AGENTS.md project rules owns project workflow guidance, and config.yml owns configured gates. Do not duplicate the managed routing guidance or prescribe unsupported new workflow states. O-005 is done, its current Full Check is C-008 CLEAR, and its required owner visual acceptance is recorded in T-020 and T-022. C-007's findings and their repairs provide concrete retrospective evidence rather than reasons to reopen completed implementation.

## Readiness — 2026-10-10

Outcome, policy ownership, boundaries, dependency outcome and verification are settled. The owner approved the detailed Task plan for execution with "yes" on 2026-10-10. Planning is complete and the router selects the first planned Task for execution.

## Retrospective — 2026-10-10

Review basis: G-003 Release, O-005 confirmed decisions and boundaries, [T-016](../O-005-reusable-astronomy-ui-shell/tasks/T-016-audit-planetary-explorer-s-ui-for-patterns-worth-reusing.md)–[T-020](../O-005-reusable-astronomy-ui-shell/tasks/T-020-make-the-shell-work-on-every-screen-size-and-hand-it-over-for-visual-review.md)/[T-022](../O-005-reusable-astronomy-ui-shell/tasks/T-022-show-common-measurements-as-compact-reusable-visuals.md) execution and drift records, [C-007](../../checks/C-007-o-005-full-objective-check.md)/[C-008](../../checks/C-008-o-005-full-objective-recheck.md), [I-010](../../issues/I-010-workflow-suggestions-from-the-g-002-retrospective.md)–[I-012](../../issues/I-012-design-not-reconciled-for-o-005-drift-notes.md), O-003's carried-in lessons, and the workflow/policy sources listed in [T-023](tasks/T-023-review-spike-03-lessons-and-tighten-project-guidance.md). This is a document retrospective; it does not reopen O-005 or independently re-prove application behavior.

### Review matrix

| Lesson / event | Source evidence | Workflow comparison and disposition |
|---|---|---|
| Scope changed on owner direction | O-005 Confirmed Decisions (2026-10-06 and 2026-10-09); [T-018](../O-005-reusable-astronomy-ui-shell/tasks/T-018-let-viewers-pick-objects-and-switch-overview-focus-and-follow.md) owner follow-ups; [T-022](../O-005-reusable-astronomy-ui-shell/tasks/T-022-show-common-measurements-as-compact-reusable-visuals.md) metric extensions, anchor restyle and radar choice | savepoint-idea owns intent; savepoint-design owns confirmed scope and readiness; savepoint-task records deltas. **Existing rule sufficient:** the changes have owner direction and bounded records. No inference of a new engine/data-fidelity target; retain the AGENTS spike-hypothesis rule and ARCH-01/02, PROV-01. |
| Planned replan instructions versus actual events | [T-017](../O-005-reusable-astronomy-ui-shell/tasks/T-017-put-a-timeline-bar-around-the-canvas-and-move-diagnostics-behind-a-toggle.md) Implementation Plan asks for REPLAN REQUIRED if core changes are needed; [T-022](../O-005-reusable-astronomy-ui-shell/tasks/T-022-show-common-measurements-as-compact-reusable-visuals.md) asks for it if no honest visual reference exists; all six O-005 Task records lack a `replan:` block or a recorded returned REPLAN REQUIRED | **Existing rule sufficient:** conditional instructions are not actual events. No actual REPLAN REQUIRED event is evidenced in these selected records. Owner scope revisions are recorded separately; no claim is made about unseen conversation events. |
| UI replacements broke older browser harnesses | [T-018](../O-005-reusable-astronomy-ui-shell/tasks/T-018-let-viewers-pick-objects-and-switch-overview-focus-and-follow.md) test-stage limitations; [T-019](../O-005-reusable-astronomy-ui-shell/tasks/T-019-show-object-information-data-trust-and-the-scale-choice-on-request.md) limitations; [T-020](../O-005-reusable-astronomy-ui-shell/tasks/T-020-make-the-shell-work-on-every-screen-size-and-hand-it-over-for-visual-review.md) criterion 4 and legacy coverage gap; [C-007](../../checks/C-007-o-005-full-objective-check.md) coverage matrix; [I-011](../../issues/I-011-spike-01-02-browser-checks-not-superseded.md) | TEST-01/03 already require named evidence, and the AGENTS fuller gate already requires browser validation. **Project change:** add browser regression maintenance guidance to AGENTS.md: map prior scenarios to updated scripts or named equivalents, track explicit deferral to an integration Task, finish before the Full Check. Green new-shell smoke evidence did not cover the old rate/event/follow/phase/anchor scenarios. |
| Evidence writes could overwrite historical results | [T-018](../O-005-reusable-astronomy-ui-shell/tasks/T-018-let-viewers-pick-objects-and-switch-overview-focus-and-follow.md)/[T-019](../O-005-reusable-astronomy-ui-shell/tasks/T-019-show-object-information-data-trust-and-the-scale-choice-on-request.md) limitations; [C-007](../../checks/C-007-o-005-full-objective-check.md) Workflow and side effects; [I-011](../../issues/I-011-spike-01-02-browser-checks-not-superseded.md) repair; [C-008](../../checks/C-008-o-005-full-objective-recheck.md) isolated /tmp output | check-method's side-effect inventory exposes this risk but does not choose this project's evidence paths. **Project change:** AGENTS.md requires distinct run/scratch output and recorded paths, with an owner decision for deliberate historical replacement. Preserve historical records; do not reinterpret old pending statements as current status. |
| Deferred architecture notes were missed at integration | [T-018](../O-005-reusable-astronomy-ui-shell/tasks/T-018-let-viewers-pick-objects-and-switch-overview-focus-and-follow.md)/[T-019](../O-005-reusable-astronomy-ui-shell/tasks/T-019-show-object-information-data-trust-and-the-scale-choice-on-request.md)/[T-022](../O-005-reusable-astronomy-ui-shell/tasks/T-022-show-common-measurements-as-compact-reusable-visuals.md) Drift Notes; [T-020](../O-005-reusable-astronomy-ui-shell/tasks/T-020-make-the-shell-work-on-every-screen-size-and-hand-it-over-for-visual-review.md) criterion 6; [C-007](../../checks/C-007-o-005-full-objective-check.md); [I-012](../../issues/I-012-design-not-reconciled-for-o-005-drift-notes.md) Proof Needed and repair | savepoint-design already owns implemented reality; savepoint-task records drift; savepoint-check independently checks reconciliation. **Project change:** AGENTS.md adds named integration ownership and an explicit disposition for every deferred note before Full Check. The requirement existed; the missing piece was an accounting step. |
| [C-007](../../checks/C-007-o-005-full-objective-check.md) NEEDS WORK led to bounded repair and [C-008](../../checks/C-008-o-005-full-objective-recheck.md) CLEAR | [C-007](../../checks/C-007-o-005-full-objective-check.md) issues [I-011](../../issues/I-011-spike-01-02-browser-checks-not-superseded.md)/[I-012](../../issues/I-012-design-not-reconciled-for-o-005-drift-notes.md); both append-only repair/recheck histories; [C-008](../../checks/C-008-o-005-full-objective-recheck.md) closure map and admission ledger | **Existing rule sufficient:** check-method freezes recheck scope; issue-capture supports direct repair without retreating done Tasks; savepoint-check writes immutable independent results. The repaired scripts and Design were verified inside the original cells. Preserve both Checks and Issue histories; no new workflow state or extra Check cycle. |
| Technical and human visual review are separate | [T-020](../O-005-reusable-astronomy-ui-shell/tasks/T-020-make-the-shell-work-on-every-screen-size-and-hand-it-over-for-visual-review.md)/[T-022](../O-005-reusable-astronomy-ui-shell/tasks/T-022-show-common-measurements-as-compact-reusable-visuals.md) owner_validation names [C-008](../../checks/C-008-o-005-full-objective-recheck.md); dated owner visual verdicts; [C-008](../../checks/C-008-o-005-full-objective-recheck.md) reserves visual judgement for owner | **Existing rule sufficient:** AGENTS fuller-gate rule and savepoint-check closure rules already distinguish zero-error headless evidence from owner judgement. Provisional radar acceptance in [T-022](../O-005-reusable-astronomy-ui-shell/tasks/T-022-show-common-measurements-as-compact-reusable-visuals.md) was not final validation; the later [C-008](../../checks/C-008-o-005-full-objective-recheck.md)-linked verdict supplies it. |
| Carried-in G-002 engine/provenance and checkout lessons | O-003 retrospective; O-005 boundaries; [C-008](../../checks/C-008-o-005-full-objective-recheck.md) independence/revision; [T-016](../O-005-reusable-astronomy-ui-shell/tasks/T-016-audit-planetary-explorer-s-ui-for-patterns-worth-reusing.md) audit and [T-019](../O-005-reusable-astronomy-ui-shell/tasks/T-019-show-object-information-data-trust-and-the-scale-choice-on-request.md) provenance evidence | **Existing rule sufficient:** AGENTS hypothesis, one-session and owner-commit rules plus ARCH-01/02 and PROV-01 cover the concerns. O-005 has real commit baselines and owner-directed presentation scope; no new data-fidelity requirement. No same-checkout concurrent record change was observed during [T-023](tasks/T-023-review-spike-03-lessons-and-tighten-project-guidance.md). |
| Package suggestions and retrospective closure | [I-010](../../issues/I-010-workflow-suggestions-from-the-g-002-retrospective.md) suggestions 1–3; current task/check/design/idea skills and shared references; O-007 confirmed single-Task plan | **Packaged follow-up linked to [I-010](../../issues/I-010-workflow-suggestions-from-the-g-002-retrospective.md):** append a dated status note, preserving its original proposals. The current Task plus mandatory Full Check path addresses this retrospective's closure; the old no-Full-Check proposal is not adopted. Criteria-revision and concurrent-session suggestions were not exercised here. No new package suggestion: browser/evidence/Design lessons are project-specific execution guidance, and existing sources already state ownership and integration requirements. |
| Gate ownership and engineering constraints | config.yml; commands-and-procedures Config Contract / Extra Verification; Guardrails TEST-01/03/04, STYLE-07/10; [C-007](../../checks/C-007-o-005-full-objective-check.md)/[C-008](../../checks/C-008-o-005-full-objective-recheck.md) fresh gates | **Existing rule sufficient:** retain typecheck/build/test and unconfigured lint. Browser scope remains project fuller-gate guidance, not a new generic config field. Guardrails already cover named evidence and Check waivers; the three changes belong in project workflow guidance. No package, application, test, data or gate-definition edits. |

### Project changes and conclusion

AGENTS.md gains three project rules outside the Savepoint-managed block: browser regression maintenance, historical evidence preservation, and deferred Design reconciliation. Guardrails and config remain unchanged for the reasons above. Design's current-status prose now names [C-008](../../checks/C-008-o-005-full-objective-recheck.md)'s 170-test result and the recorded owner visual acceptance; the historical T-015 result remains labelled as historical. [I-010](../../issues/I-010-workflow-suggestions-from-the-g-002-retrospective.md) receives a dated update without changing its original suggestions or resolving it.

Spike 03 proved the configuration-driven UI shell while retaining scientific State and exposing provenance. Its independent Full Check caught two integration omissions that individual Task evidence had acknowledged but not completed. Keep the workflow's authority and independent-check model; make handoff accounting more practical with the three project rules. Further engine, data and story work remains outside this retrospective.

[T-023](tasks/T-023-review-spike-03-lessons-and-tighten-project-guidance.md) remains for the owner's completion decision. O-007 still requires an independent Full Objective Check and subsequent owner review of this conclusion and the policy diff; this session claims neither CLEAR nor acceptance.
