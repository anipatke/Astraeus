---
id: G-024
title: Engineering health repairs, for 0.10.0
status: planned
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
