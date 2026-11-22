---
id: O-091
title: CI on every push, and release parity
status: done
depends_on: [O-085, O-086]
release: G-024
priority: medium
rank: 10
---

# O-091: CI on every push, and release parity

## Outcome

Every push and pull request runs the Task gates in CI, the release workflow runs the packed Node consumer and the browser example steps before publishing, and an upgrade check proves the engine against the newest three.js in its peer range (or the range is narrowed).

## Why

AH-36 (all three): the only workflow is the release; it skips the Node consumer and every browser step. AH-37: peer `three >=0.169.0 <1` while shader chunks are patched by string and only 0.169 is tested.

## Success Conditions

- A push/PR workflow with the Task gates; a planted failure turns it red.
- The release workflow adds the Node consumer and the packed-example browser steps.
- A documented, runnable check against the newest three.js; the peer range matches what is proven.
- Actions pinned per the project's choice (Gemini SEC-05 noted).

## Architectural Considerations

Never `npm publish` or run the publish script without `--dry-run`; GitHub releases publish.

## Boundaries

**In scope:**
- Workflows, peer range, the compatibility check.

**Out of scope:**
- Data-package versioning (AH-40).

## Decisions

- Owner 2026-11-21 (G-024 decision 7): "work through this list of objectives one by one. Orchestrate each objective to completion"; owner 2026-11-22 "I am remote now, add park the check and move on". Step checks waived on every Task. No owner look.
- Branch `o091-ci-every-push` is stacked on the parked `o088-outcome-checks` (shared `package.json`, `docs/RELEASING.md`, browser steps), so it merges after O-087 and O-088.
- Owner rule (G-024 orchestration): no throwaway failing-test branch push and no GitHub release-workflow run, dry run included. T-417 is therefore the post-merge `main` CI run only; the red proof and the release proof are local (T-416 parity test with planted copies, T-414 local release steps). Objective success condition 1's GitHub red run is recorded as not run, by owner rule.
- Planner (orchestrate-g024-20261121) defaults taken: CI gates = `quality_gates` verbatim (nothing network- or browser-bound on push); Node 22 and 24 matrix; actions pinned to full commit SHAs with `# vX.Y.Z` comments, `id-token: write` job-scoped; newest three.js checked with `check-engine-alone.mjs --three` (narrow the peer range only if it fails); parity test parses the real YAML with an exact-pinned `yaml` devDependency.
- Waves: T-413, T-414, T-415 side by side (T-414 is the only browser job); then T-416; T-417 after the merge.
- T-415: newest three.js (0.187) fails typecheck from 0.181 on; peer narrowed to `>=0.169.0 <0.181.0` under the owner decision "Test newest, narrow if it fails"; the type fix is follow-up Issue I-195 (outside O-091).
- PARKED 2026-11-22 (owner remote): T-413..T-416 done; Design reconciled. The Full Objective Check waits for O-087 and O-088 to close (stacked). T-417 is the post-merge `main` CI run.
- Rebased onto main after O-088 merged (276614b3); router to the Full Objective Check (owner 2026-11-22: "carry on with O-091 after that").
- O-091 set done by the orchestrating session after re-check C-209 CLEAR (C-208 NEEDS WORK on I-198; owner "Add the cases"; verified) and the green post-merge main CI run (T-417) (G-024 decision 7, "Orchestrate each objective to completion"; owner "carry on with O-091 after that").
