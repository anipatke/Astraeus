---
id: C-194
scope: {kind: objective, id: O-080}
result: CLEAR
checked_by: {role: checker, session: recheck-o080-20261121}
executed_session: repair-o080-c193-20261121
checked_at: '2026-11-21T07:12:00Z'
health_snapshot: sha256:92f7f71d8587011ba89049a0b9cd5676f330b7f5766085e1ab7adcb19dd12a33
reviewed:
  base_commit: c182f38e
  head_commit: 9b621871
  files: [packages/astraeus/src/app/useShelf.ts, packages/astraeus/src/shell/useShelfPanels.tsx, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/api/errors.ts, packages/astraeus/README.md, packages/astraeus/api-surface.lock.json, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus-site/tools/validate/catalogue-lines.mjs, packages/astraeus-site/tools/validate/catalogue-lines.d.mts, packages/astraeus-site/tools/validate/journey-catalogue.mjs, packages/astraeus-site/tests/shelfCatalogue.test.ts]
  dependencies: []
issues: []
supersedes: C-193
---

# C-194: O-080 Full Objective re-check

Fresh session; I did not plan, build or repair O-080. Lean re-check (owner: "Lean final check") of the repair commit `9b621871` against C-193's frozen scope lock and matrix; each gate once, one browser run.

**Result: CLEAR.** Closure map: I-188 closed (verified), I-189 closed (verified), I-190 closed (verified). No new Issue.

## Progress

- [x] Establish Scope (diff `c182f38e..9b621871`, 15 files)
- [x] Freeze The Check Scope (C-193's lock, unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-193 matrix; three cells re-run below, the rest re-proven by the full gate)
- [x] Finite External-Boundary Matrix (browser runner: unchanged except the journey assertion)
- [x] Workflow And Side-Effect Check Lock (no new workflow)
- [x] Matrix Completion Lock (catalogue browser cells now passed)
- [x] Parallel Planning Advice (advisory; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality (every file the repair names exists)
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger

| Item | Prior Issue | Frozen cell | Allowed result |
|---|---|---|---|
| Journey assertion compares like with like; fast case catches the old mistake | I-188 | catalogue page in a browser | pass/Issue |
| `catalogue` step at 1280x720 and 375x667 | I-188 | catalogue page in a browser | pass/Issue |
| Undo between draw and report silent, both paths, both orders; fails on old code | I-189 | setters silent, on* visitors only (axis: embedding path x2, host vs visitor) | pass/Issue |
| Source-marking review: visitor still heard, reads follow the shell | I-189 | same cell | pass/Issue |
| `bad-part` doc covers factories, setters, build-time camera; README regenerated | I-190 | bad-part docs | pass/Issue |

## Results

- **I-188.** `holdsAddLines` compares the add lines line by line without leading space; `shelfCatalogue.test.ts` asserts it holds for every example and that the old `source.includes(add)` is false for each (the old mistake). Browser: `catalogue` exit 0 in 5 s, `results.json` ok at desktop (1280x720) and phone (375x667): 6 parts, no sideways scroll, no overlaps, nothing outside; the journey's Run size, one-viewer-at-a-time and every-example-starts assertions ran and passed. **Verified.**
- **I-189.** New lifecycle case runs in the `describe.each` over mount and `AstraeusScene`. Against a scratch copy (`git archive HEAD`) with pre-repair `useShelf.ts`, `useShelfPanels.tsx`, `AstraeusShell.tsx`: fails on both paths (mount: reads `[true,false,true,false,...]`; React: heard `[{gaps,true},{gaps,false}]`). Current code: 5 of 5 runs pass on both paths. Independent checker probe (scratch copy only, two panels, both paths, passed): three host calls in one draw (open, then close+open at draw) silent and read `true`; host opens B then reopens A at B's draw: silent, reads A open/B closed; visitor close then host open: only the visitor heard; visitor opening A in B's place: heard B closed, A opened, reads follow. Design review: `applied` is set in the same effect as the panel reducer dispatch, so the change and its serial reach one render on both paths (one `App`/`AstraeusShell` per viewer, shell not keyed, so `applied`, `asked`, `seen` share one lifetime; a rebuilt scene keeps them consistent). No remaining hole found inside the lock. **Verified.**
- **I-190.** `errors.ts` `bad-part` names all six factories, part control setters, the build-time action camera and foreign parts; README row matches (`apiRules.test.ts` in the full gate); API lock updated. **Verified.**

## Gates (this session, after `9b621871`)

- `npm run lint` 0 (8 s); `typecheck` 0 (6 s); `build` 0 (3 s); `npm run test:full` 0: 288 files, 4542 passed, 2 skipped (84 s); `git diff --check main...HEAD` clean.
- `check:engine-alone` pass (30 s); `check:pack` pass (20 s); `check:node-consumer` pass (6 s); `measure:example` 1,821,479 / 521,275 B gzip (unchanged); `check:shelf-split` ok.
- Public build (`ASTRAEUS_PUBLIC_BUILD=1 ASTRAEUS_ENGINE_SHARE=1`, scratch outDir) + `load-budget.mjs`: every page ok (api/index.html 43,454 / 46,000 gzip; components own 364,417 / 390,000).
- `npm run check:browser` once (07:02:46-07:09:23 UTC): exit 0, every step exit 0, no error lines. Evidence `docs/evidence/browser-20261121T070246Z`. Time warnings as C-193 judged them (loaded machine, the owner's :5490 server running): look-out 109 s (75), hello-sky 24 s (15), total 397 s (320); not failures.
- `savepoint health check O-080`: snapshot above, "does not block clearance"; all instances optional, no finding.
- Nothing reused from C-193: the repair changed engine source, so every gate C-193 ran was rerun.

## Materiality

No Issues; no materiality actions required.

## Owner Decisions

No owner acceptance or exception is recorded on O-080 or its Tasks (step-check waivers only), so no `carried_forward` entries.

## Owner Validation

T-336 declares `owner_validation.required`. This Check is CLEAR, so the owner may now accept T-336 against C-194; that needs the owner's explicit words naming this Check (the earlier "better" was a look, not an acceptance). Not recorded here. O-080 closes after that acceptance.

## Observations (non-blocking)

- C-193's observations stand (`handle.part` matches id and kind; filterChips "uses" text; `api/*.html` not opened by smoke).
- A visitor change landing in the same React render as a host request's application would be counted as the host's; no supported path produces that within the lock.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
