---
id: T-416
title: A test keeps the workflows, the gates and the release docs in step
objective: O-091
status: planned
depends_on: [{task: T-413, requires: clear}, {task: T-414, requires: clear}, {task: T-415, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-416, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T23:30:07Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: parity
planned_reads: [.github/workflows/ci.yml, .github/workflows/publish.yml, .savepoint/config.yml, package.json, packages/astraeus-site/tools/validate/browser-steps.mjs, packages/astraeus-site/tests/gateLimits.test.ts, docs/agents/build.md, docs/RELEASING.md]
planned_writes: [packages/astraeus-site/tests/workflowParity.test.ts, .github/workflows/publish.yml, package.json, package-lock.json, docs/agents/build.md, docs/RELEASING.md]
---

# A test keeps the workflows, the gates and the release docs in step

## Outcome

Release parity is mechanised: `npm test` fails when the push/PR workflow stops running exactly the Task gates, when the release workflow stops running any check the release docs promise before publishing (or runs one after the publish step), when an action is not referenced as the project chose, or when `id-token: write` leaks beyond the publishing job. The release workflow also re-proves the newest three.js (draft 03's check) before publishing, and the docs say what runs where (Objective success conditions 1–4; owner rule "Strategic fix first": mechanise the trap).

## User Check

None visual.

## Done When

- `yaml` added as an exact-pinned root devDependency (PLAN.md decision 8 / owner question 3; `npm install --save-dev --save-exact yaml@<current>`; lock diff is that package only, recorded). If the owner declines, stop and report (no hand-written YAML reader).
- `.github/workflows/publish.yml` gains `npm run check:three-newest` (name: "Check the engine against the newest three.js in its peer range") after `check:react-consumer` and before the browser install (PLAN.md decision 4).
- New `packages/astraeus-site/tests/workflowParity.test.ts` (beside `gateLimits.test.ts`, which holds the other tooling-doc parity checks). It parses both workflows and `.savepoint/config.yml` with `yaml`, and exports nothing. Each rule is a small named function taking parsed objects and returning a list of problems; the cases run each rule on the real files (expect `[]`) **and** on an in-memory planted copy (expect the named problem). One table test over the rules and their plants (owner memory: one table test across input kinds):
  1. **CI triggers:** `ci.yml` `on` has `push` and `pull_request`, with no `paths`/`branches` filter on `push`. Plant: drop `pull_request`.
  2. **CI Node versions:** the `gates` job matrix `node` is `[22, 24]` and contains the major of `package.json` `engines.node` (`>=22.12` → 22), so raising the engine floor without the matrix fails. Plant: matrix `[24]`.
  3. **CI gates = `quality_gates`:** the `run` steps after `npm ci` equal, in order and verbatim, the `quality_gates` values (`lint`, `typecheck`, `build`, `test`; `block_on_failure`/`gate_timeout` keys ignored). Plant: remove the lint step; reorder build/test.
  4. **Release covers CI:** every `quality_gates` command's npm script (`npm run X`, with `npm test` ≡ `npm run test`; arguments ignored) is run by `publish.yml` before the publish step. Plant: remove `npm test`.
  5. **Release checks before publishing:** `publish.yml` runs, before the step whose `run` contains `tools/publish-packages.mjs`: `check:engine-alone`, `check:pack`, `check:node-consumer`, `check:react-consumer`, `check:three-newest`, and one `check:browser` command whose `--step` list equals the steps in `browser-steps.mjs` `STEPS` that have an `example` field (imported, not hard-coded: a fifth packed example joins the release automatically). Plant: move `check:node-consumer` after the publish step; drop `--step hello-sky`.
  6. **Publish step is guarded:** the publish step contains `--dry-run` on its non-release branch, and no workflow `run` contains `npm publish`. Plant: remove `--dry-run`.
  7. **Permissions:** both workflows have workflow-level `permissions` of exactly `{contents: read}`; `id-token: write` appears only under `jobs.publish.permissions` of `publish.yml`. Plant: workflow-level `id-token: write`.
  8. **Action references** (PLAN.md decision 3, default): every `uses:` is `owner/repo@<40 hex>`; the same action uses the same SHA in both files. Plant: `actions/checkout@v7`. (If the owner chose major tags, the rule is instead "every `uses:` has a major tag `@vN`, the same in both files".)
  9. **Release docs name what runs:** every release-workflow check from rule 5 appears (as `npm run <script>` text) in `docs/RELEASING.md` "What is checked where" table, and the table names `.github/workflows/ci.yml`. Plant: the table text with the Node consumer row removed.
- `docs/RELEASING.md`: the "What is checked where" table (line ~66) gains rows / edits: "Task gates on Node 22 and 24, every push and pull request: `.github/workflows/ci.yml`"; "A Node test imports the packed engine: `npm run check:node-consumer`, in the workflow"; "The four packed examples draw in a browser: `npm run check:browser -- --step hello-scene …`, in the workflow (the full tier stays the local step 4)"; "The engine against the newest three in its peer range: `npm run check:three-newest`, in the workflow"; the "The workflow then:" paragraph (line ~46) lists the same order. Step 4 keeps O-086's wording and adds one clause that the workflow re-runs these.
- `docs/agents/build.md`: one new bullet after "Package gates", "CI (O-091)": `ci.yml` runs `quality_gates` on Node 22 and 24 for every push and pull request; `publish.yml` runs them plus engine-alone, pack, Node consumer, React consumer, newest three and the packed-example browser steps before publishing; `workflowParity.test.ts` keeps both in step with `quality_gates`, `browser-steps.mjs` and `RELEASING.md`; a workflow change cannot be run from a local session, so its first run is on the next push (draft 05's checklist). Also the actions-pinning choice and how to refresh a SHA (`git ls-remote https://github.com/actions/<name> 'refs/tags/v<N>*'`).
- Gates per `docs/agents/verification.md`; the focused test also run with each plant reverted shows the real files clean.

## Context Files

- `.github/workflows/ci.yml`, `.github/workflows/publish.yml` (whole, after drafts 01, 02)
- `.savepoint/config.yml` (`quality_gates`, lines 5–11)
- `packages/astraeus-site/tools/validate/browser-steps.mjs` (`STEPS`, the `example` field; read only)
- `packages/astraeus-site/tests/gateLimits.test.ts` (how it reads docs and tool files; pattern only)
- `docs/RELEASING.md` ("Each release" steps 4–8 and "What is checked where")
- `docs/agents/build.md` (Package gates bullet, the bullet list layout)

## Design References

`.savepoint/Design.md` `Current Technical State` (where a CI sentence belongs; see Drift Notes).

## Guardrails

STYLE-07 (one source per list: gates from `quality_gates`, examples from `STEPS`), TEST-01, TEST-03, STYLE-02, STYLE-03, CODE-01, API-07.

## Implementation Plan

1. Add `yaml`; add the three-newest step to `publish.yml`.
2. Write the rules and the table test with plants; run focused.
3. Docs: RELEASING table and paragraph, build.md bullet.
4. Gates.

## Boundaries

No change to `ci.yml` beyond what a failing rule shows was a draft 01 defect (record it); no change to gate scripts, `browser-steps.mjs` or `quality_gates`. No `gate-limits.json` change. No full browser tier in the workflow. Do not run anything on GitHub (draft 05). Do not edit `agent-skills/`, `AGENTS.md` or `verification.md`.

## Technical Verification

Focused: `npx vitest run packages/astraeus-site/tests/workflowParity.test.ts packages/astraeus-site/tests/gateLimits.test.ts`. Mutation (record, revert, show `git diff .github` clean of the plant): delete the `npm run lint` step from `ci.yml` and the `check:node-consumer` step from `publish.yml` in the working tree; the test fails naming each. Handoff `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

For the coordinator's Design reconciliation before the Full Objective Check: `.savepoint/Design.md` `Current Technical State` gains one sentence on CI (push/PR Task gates on Node 22 and 24; release runs the consumers, newest three and packed examples; parity mechanised by `workflowParity.test.ts`); `Decisions` > `O-053 checks` "Honest versions and docs" gains the three peer rule (range kept only as wide as `check:three-newest` proves, re-proved at release).
