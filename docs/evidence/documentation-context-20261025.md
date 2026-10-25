# Documentation context reduction — 2026-10-25

Owner authorized implementation after the read-only review, with the explicit requirement to preserve critical and material content. This is a documentation reorganization, not a Savepoint Check or lifecycle transition.

## Measured reading costs

Word counts use whitespace-separated words, not model tokens. These totals cover entry guidance, skill and mandatory shared references; Planning also includes Idea and Guardrails. New totals include verification policy and build guidance, so relocated policy is not counted as free savings. Task/Objective records, source, evidence and relevant subsystem reads are additional and vary by scope.

| Session | Before | After | Fixed-reading reduction |
|---|---:|---:|---:|
| Task | 4,953 | 3,980 | 20% |
| Planning | 27,634 | 7,954 | 71% |
| Quick Check | 8,616 | 6,198 | 28% |

AGENTS.md: 3,503 → 1,628 words. Design.md: 19,911 → 1,226 words. Actual session savings depend on the relevant linked contract/history sections; the initial review's Task and Quick estimates were optimistic. Full Checks retain all Full procedures.

## Preservation and verification

- Every substantive original Design line (195 non-heading lines longer than 35 characters) was checked as retained verbatim across `docs/architecture/`. The original section bodies were moved intact; searchable headings and a lookup table were added to history.
- Every original Check procedure paragraph from Establish Scope onward was checked against the common + Quick + Full union. The sole wording change there replaces a positional “below” reference with a cross-file link. Quick ordering remains in its mode reference; the Full checklist, matrices, side-effect lock, adversarial pass and official health collection remain mandatory in Full.
- Original lifecycle, owner authority, lane, Goal, adoption, build, CLI and project-rule text was checked as retained verbatim. Verification policy retains its obligations with updated loading pointers. Routing/context text now directs conditional reads.
- All Guardrail table rows, including rule IDs and severities, are byte-identical. Only the obsolete “worked example” authoring scaffold was removed.
- All 35 local Markdown file/heading links in the entry guide, overview and new references resolved.
- The skill-creator `quick_validate.py` passed for Task, Design and Check. `git diff --check` passed. `savepoint resume` successfully loaded the records after the edits; G-011 remains done.
- No Task, Check, Issue, Goal, router, application source, tests, dependencies or gate configuration changed. Pre-existing untracked `docs/prds/` and `docs/research/` were left untouched. Historical evidence directories were not changed.

## Maintenance

The current package map and architecture summary now live in Design; detailed contracts and dated amendments are linked rather than bulk-loaded. Context Files may qualify an exact path with a heading, while existing unqualified paths keep their whole-file meaning. Browser owner rules have one policy reference, separate from the existing scenario/driver map.

These are checkout-local Savepoint guide and skill changes authorized by the owner. No upstream Savepoint generator/package was modified; a future generated-guide or skill refresh must reconcile these loading changes and preserve the linked project policy.

No application gates or browser run were needed for documentation-only edits; the validation above checks document integrity and preservation, not application behavior.
