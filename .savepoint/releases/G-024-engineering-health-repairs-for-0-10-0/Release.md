---
id: G-024
title: Engineering health repairs, for 0.10.0
status: done
---

## Outcome

Astraeus gives the same right answer for every valid input and every load order, says truthfully what it is unsure of, verifies itself in a fraction of today's time without losing the checks that catch real defects, and is easier to change at the top of the engine. Confirmed defects from three independent audits are fixed, duplicated and low-value verification is removed or moved to the right tier, the per-frame work every embedder pays for is cut, and the docs describe the code as it is.

## Why

Owner, 2026-11-21 (session plan-g024-20261121): three independent audits of 0.9.5 at commit 5529527 (Codex, Gemini, Claude; `audits/2026-11-21_*_auditfindings.md`) were consolidated into one engineering health review (https://claude.ai/artifact/4863gR72uZsuGXddJGjuBa; finding IDs AH-01..AH-51 below come from it). Verdict: sound core, targeted repair, no rewrite (3.1/5). The review found confirmed wrong positions for valid inputs (AH-01, AH-02, AH-03), error and provenance contracts that do not hold (AH-04, AH-05), a 406–449 s browser suite over its own 320 s limit with packages built up to three times per gate (AH-29, AH-31), test plumbing in the production frame loop (AH-09), and a 617-line viewer coordinator (AH-18). Owner: "turn this into a new goal with new objectives".

Owner decisions, 2026-11-21:
1. Browser checks: "Quick set, full when relevant": a Full Objective Check runs a quick browser tier (every page loads, phone layout, packed examples); the full journeys run at release and for Objectives that touch camera, layout, shaders, sky or packaging. This changes `docs/agents/browser-policy.md` (owner-approved here).
2. Moon data: "Fix it in the first round": each scene's moon data becomes its own in the first phase, after a reproduction test is pinned.
3. Viewer coordinator: "One slice at a time": one Objective takes out the developer drawer and the first behaviour; later features move one more slice each; no big-bang rewrite.
4. Text pins: "Retire after replacement": the browser-assertion baseline, scene pin and computed-look snapshot are retired only after outcome checks replace them.
5. World model: "Wait for a real need": custom bodies and runtime show/hide wait for a story app that needs them; the misleading "open" scale type is fixed now.
6. Version: "0.10.0, breaking allowed": fixes may change behaviour (zone-less date text rejected, scale typed as a closed choice); data peers move to `>=0.10.0 <0.11.0` at release.
7. Overnight orchestration (owner, 2026-11-21, "work through this list of objectives one by one. Orchestrate each objective to completion, use this session to plan, sonnet builders and testers as subagents, and this session again to test"): Objectives O-082..O-093 are orchestrated in order under the standing orchestration rules; the owner starts it from a fresh session.
   - Owner look needed while offline: "Park it, move to the next": finish everything else on the Objective's branch, leave it unmerged with a note, continue with Objectives that do not depend on it.
   - Stuck (a Full Check still NEEDS WORK after one repair round, or a size budget goes red): "Park it, continue others", with a plain note of what is wrong and the options.
   - O-089 first slice: "Selection".
   - O-093 formatter: "Prettier, one commit", kept separate from logic changes.
   - O-091 three.js peer range: "Test newest, narrow if it fails".
   - Full Objective Checks: "Orchestrator session runs it" (the orchestrating session, not the Sonnet builders, writes the Check).

8. Final objective (owner, 2026-11-22, "consider this a final objective"): the owner's documentation-trim plan becomes O-090's scope and O-090 runs last, after every other G-024 Objective (plan recorded in O-090's Decisions).

## Success Conditions

Every member Objective is done.

## Boundaries

**In scope:** the `astraeus` engine package, its tests, the site's browser checks and tools, root gate tooling and workflows, project docs (README, guides, browser and verification policy), and the demos only where a fix needs them.

**Out of scope:** custom bodies, runtime show/hide, member picking and an observer frame (decision 5); decoupled data-package versions (AH-40, a separate owner choice); single-pass lighting to lift the 30-body cap (AH-16, only the raw error is fixed); single-auditor findings marked "needs verification" in the review (AH-17 Float32 quantisation, AH-27 post-2030 moon cutoff, AH-43 decoder bounds, AH-45 health-tool parsing, AH-47 Apollo velocity spike) unless an Objective confirms one on the way; outside apps; the version bump and publishing (the owner's release steps).

## Workflow Review

Written 2026-11-22 after every member Objective closed (owner: "write the G-024 workflow review"). A note, not an Objective, Task or Check.

**Records reviewed.** 18 Full Objective Checks for 13 Objectives (C-196..C-213). Four were NEEDS WORK on the first pass (C-198, C-203, C-205, C-208); each cleared after one repair and one recheck, so no check failed to settle. C-201 was a planned recheck after the owner's look and a merge. No Task returned REPLAN REQUIRED (T-366, T-413 and T-432 had conditional replan clauses, and none fired). Issues I-191..I-205: 10 verified, 1 escalated (I-199 → O-094), 4 open (I-195, I-200, I-202, I-205).

**Findings and what changed.**

1. **A driver change reached the Full Check unrun (I-192; same class as I-184 in O-079).** T-390 changed `driver.mjs`, a file every browser step calls. The policy said a Task that changes "a browser script or the runner" runs "the affected steps", but it did not say that a change to the shared driver affects every step that calls the changed function. **Changed:** `docs/agents/browser-policy.md` now says so, and says how to find those steps.
2. **A test weaker than its claim (I-198).** The parity test read only the `run` text, so turning a step off still passed. **No change**, because TEST-01/02 and the check method already require proof that the test fails when the thing it guards breaks. The fresh checker applied them and caught it; O-085 was about the same thing.
3. **Flaky waits under load (I-203, I-204).** **No change**, because the repair was general: a 10 s default for every Vitest wait, with a test proving it.
4. **Stale owner preview (I-201).** **No change**, because `npm run preview:owner` and the browser policy now prevent it.
5. **Size budget went red (I-191).** **No change**, because the rule "park it and give the owner measured options" worked: the owner settled it in one answer ("size option a").
6. **Design wording out of date at a Check (I-197).** **No change**, because it happened once and was small, and "reconcile Design before the Full Check" already covers it.
7. **Task IDs clashed across branches.** A parked Objective's branch allocated T-354..T-360 while main's counter lagged, so the next Objective got the same IDs. `savepoint create-task` reads only the checkout's own counter. **Issue I-206** asks the packaged tool to protect against this; until then the orchestrator brings the counter up to the highest ID on any unmerged branch before creating Tasks.
8. **A packaged reference assumes coverage in every Full Check (I-202).** It is already an open Issue for the packaged skill; no project change.
9. **Verification cost.** Full Checks fell from about 454 s to about 233 s (O-094, measured 2026-11-22), and builders now run focused tests while the coordinator runs the full gate once per wave (owner, 2026-11-22). **No change**: orchestration rules live outside the project until the orchestrator skill is packaged.
10. **Docs drift.** O-090 cut the current guides from 69,338 to 41,012 words and added a test that rejects undated timings. A link test and a stricter timing test are **Issue I-205**.

The project rule "Read docs by section" stays: Design.md is now 4,131 words instead of 17,233, which makes section reads cheaper but no less needed.
