---
id: C-034
scope: {kind: task, id: T-040}
result: CLEAR
checked_by: {role: checker, session: o011-orchestrator-check-20261016-night}
executed_session: t040-builder-2026-10-16 (integration) and i028-repair-2026-10-16
checked_at: '2026-10-16T11:50:00Z'
reviewed:
  base_commit: f5a9273
  head_commit: 8130ff6
  files:
    - .savepoint/Design.md
    - src/app/sceneFraming.ts
    - src/app/AstraeusScene.tsx
    - tests/startCamera.test.ts
    - tools/validate/browser-showers.mjs
  dependencies: [T-039]
issues: []
supersedes: null
---

# C-034: T-040 Task Check (Quick), with I-028 verification

Checker: the O-011 orchestrator session, independent of the T-040 integration builder and the I-028 repair session. Committed work only: 8130ff6, in a clean worktree.

## Scope Lock

1. T-040 Done When 1–6, plus I-028 Proof Needed 1–4. Guardrails ARCH-01, TEST-01..03, plus the project rules on browser-regression maintenance and historical evidence.
2. Changed files: as listed in `reviewed.files`, plus the integration evidence directory.
3. Out of scope: owner visual judgement (Done When 5), which is recorded as still needed.

## Invariants and probes

| Criterion | Expected | Actual | Evidence |
|---|---|---|---|
| DW1 gates | pass fresh | pass at 8130ff6 (counts below) | Gates |
| DW2 every browser script | 0 console errors, fresh dir | 21/21 exit 0 at HEAD. This includes the scripts added after the integration run (sky-map, showers-gmn, view-link), so the integration run is re-proven on the current code. | docs/evidence/o011-check-20261016T105315Z/summary.txt |
| DW3 scenario map | each changed scenario mapped | T-040 evidence "Repair" names the maps; the Perseids sky-on scenarios that failed in the integration run pass here (sky exit 0) | T-040 evidence; docs/evidence/o011-check-20261016T105315Z/sky.log |
| DW4 Design reconciled | drift notes reflected | Design.md diff in aea091d covers T-036..T-039, T-051..T-054, the Geminids PASS, and GAP-5 open. Gaps raised later by T-065 (Spike 03-era "Known open items"; a `published` provenance candidate) are newer than this Task and go to O-012. | git show aea091d -- .savepoint/Design.md |
| DW5 owner judgement | recorded | NOT YET: owner validation is still needed | — |
| DW6 viewer criteria walk-through | met / partly / gap | recorded in T-040 evidence; the Earth-based view is deferred | T-040 evidence |
| I-028 PN1 cause | found | the Sun's close-up framing became the start camera after the true-radius Sun rework | I-028 history |
| I-028 PN2 generic fix | opens at declared default; no body named | `sceneFraming.ts` `startsInsideFocus` and `START_CAMERA_DISTANCE` name no body. Independent probe: a plain public-build load of `?experience=shower-perseids` and `?experience=shower-geminids` opens at the overview with the stream in view (`docs/evidence/o011-check-20261016T105315Z/probes/pubper.png`, `pubgem.png`). | probes |
| I-028 PN3 tests | unit + plain-load browser assertion | tests/startCamera.test.ts passes in the full run; the browser-showers plain-load scenario passes for both showers | c-t.log; showers-*.log |
| I-028 PN4 reruns | listed scripts, 0 errors | all pass in this run | summary.txt |

Bypass probes (`docs/evidence/o011-check-20261016T105315Z/probes/probe1.mjs`): a malformed `?view=` (garbage, negative distance, elevation 95°, unknown body), a bad `?t=`, and `?source=bogus` all open the experience at its default with zero console errors.

## Gates (fresh, checker, committed HEAD 8130ff6 in a clean worktree `/home/user/code/astraeus-check-8130ff6`, 2026-10-16 ~10:50Z, node v24.16.0)

- `npm run typecheck`: exit 0. `npm run build`: exit 0. `npx vitest run`: 45 files, 828 passed, 1 skipped (`docs/evidence/o011-check-20261016T105315Z/c-t.log`).
- `git diff --check f5a9273 8130ff6`: one blank line at EOF in docs/DONOR_PROVENANCE.md, and trailing whitespace in two committed vite logs. Cosmetic; observation only.
- Browser: all 21 `tools/validate/browser-*.mjs` scripts (spike02, spike03, shell, anchor-labels, synthetic ×5, marker-existing, sky, sky-map, sun, earth-moon, jupiter-io, showers perseids, showers geminids, showers-gmn, view-link, precision, lighting) against vite :5450 serving the worktree: 21/21 exit 0 with zero console errors. `docs/evidence/o011-check-20261016T105315Z/summary.txt` lists each command and time; `docs/evidence/o011-check-20261016T105315Z/check-run.sh` is the runner. (The single "console-error-lines=1" in showers-gmn is its own "ok, zero console errors" line.)
- Public build (`ASTRAEUS_PUBLIC_BUILD=1 vite build` of the worktree, `vite preview` :5451): index, assets, app and the Perseids, Geminids and Apollo demos load with zero console errors and no failed requests (`docs/evidence/o011-check-20261016T105315Z/probes/probe2.mjs` output). The public-build validator found no local data in the integration-time run, and in the coordinator's run on the same tree (no matches).

## Issues Pass

Every criterion is Proven, except DW5, which is owner validation (not a technical criterion of this Check). No Issues, so no materiality actions are required.

## Owner validation still needed

T-040 DW5: the owner's look per experience (Apollo, Earth–Moon, Perseids, Geminids, Jupiter–Io, synthetic). I-028 needs no owner look.

## Observations (non-blocking)

- I-030, found in this Check's public-build probe: the public Geminids demo drew no stream. It belongs to O-016 and was repaired the same night (uncommitted at check time).
- Design.md gaps that T-065 noted are for O-012.

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
- [ ] STYLE-10 **Small diffs**: tonight's commits are large (aea091d 52 files, 721d95a 49 files), mostly evidence and shared-file batching by the orchestrator.
