---
id: C-187
scope: {kind: objective, id: O-076}
result: CLEAR
checked_by: {role: checker, session: recheck-o076-20261116}
executed_session: orchestrate-o076-20261116
checked_at: '2026-11-16T10:13:30Z'
health_snapshot: sha256:152ef11c8c964a088e1a6792f792b8c9400ff23aca0777efec34fe64545659c0
reviewed:
  base_commit: a6ccb200
  head_commit: 488877e9
  files: [docs/release-notes-0.9.2.md, .savepoint/Design.md, .savepoint/issues/I-180-0-9-2-release-notes-say-nothing-needs-a-change.md, .savepoint/router.md, packages/astraeus/CHANGELOG.md, packages/astraeus/tests/badTime.test.ts]
  dependencies: []
issues: []
supersedes: C-186
---

# C-187: O-076 Full Objective re-check (after I-180)

Fresh session; I did not plan, build, coordinate or repair O-076, T-320..T-322 or I-180, and I did not write C-186. Targeted re-check after remediation under C-186's frozen scope lock (check-method.md, Re-check After Remediation). Repair diff `git diff a6ccb200..HEAD` (HEAD 488877e9).

## Closure Map

| Issue | State | Proof |
|---|---|---|
| I-180 | **closed (verified)** | Proof Needed holds; see D4 below |

## Admission Ledger

| Re-check item | Prior claim | Frozen cell | Allowed result |
|---|---|---|---|
| Intro no longer says nothing needs a change; names the refusal | I-180 Proof Needed 1 | C-186 D4 | pass / Issue |
| Upgrading names the refused inputs, their codes and the fix | I-180 Proof Needed 1 | C-186 D4 | pass / Issue |
| Every other notes claim still maps to a CHANGELOG line | I-180 Proof Needed 2 | C-186 D3 | pass / Issue |
| No code change | I-180 Proof Needed 2 | C-186 D5, gates | pass / Issue |
| Design `### Constellations` (4) update | C-186 observation | none (non-blocking) | observation only |

## Re-check Results

- **D4 (summary and Upgrading vs code): pass.** `docs/release-notes-0.9.2.md` line 5 now reads "Additions and fixes only; no call changed shape. One stricter check may need a change: a story panel `at.time`, an anchor `time` or a `shownDuring` end must now be a whole millisecond within range (see Upgrading)." Upgrading (line 41) names the same three inputs as "accepted in 0.9.1, is now refused with that call's own code (`bad-panels`, `bad-anchor`, `bad-body` or `bad-trajectory`)", gives the fix ("round such times to a whole millisecond (for example `Math.round(ms)`)") and then "Nothing else needs a change". `grep -n 'nothing needs a change' -i` finds no remaining unqualified claim. Against the code: `packages/astraeus/tests/badTime.test.ts` lines 50-57 refuse `T0 + 0.5` and `1e16` with exactly those four codes (addBody `shownDuring` -> `bad-body`, addTrajectory `shownDuring` -> `bad-trajectory`, anchor -> `bad-anchor`, panel `at.time` -> `bad-panels`); `git show v0.9.1:packages/astraeus/src/core/storyPanels.ts` lines 124-125 checked `Number.isFinite` only, confirming "accepted in 0.9.1". The wording matches `packages/astraeus/CHANGELOG.md` line 16 (`Changed:`). The "Bad times" bullet and the intro/Upgrading no longer contradict each other.
- **D3 (each claim maps to a CHANGELOG line): pass.** The repair changed only lines 5 and 41 (`git diff a6ccb200..HEAD -- docs/release-notes-0.9.2.md`, 2 lines). The 17 bullets are byte-identical to the ones C-186 mapped; the two new sentences map to CHANGELOG line 16. The rest of the intro (five headline items, nine packages, peer range) and Upgrading (peer range, `bad-time` still `instanceof RangeError`) are unchanged and map to the CHANGELOG `Fixed:`/`Added:` lines and the peers C-186 read (D6).
- **No code change: pass.** `git diff --stat a6ccb200..HEAD` touches only `.savepoint/Design.md` (1 line), `.savepoint/checks/C-186-...` (new), `.savepoint/issues/I-180-...` (new), `.savepoint/router.md` (selection) and `docs/release-notes-0.9.2.md` (2 lines). Nothing under `packages/`, `tools/`, `examples/`, `package.json` or the lockfile changed; `.savepoint/config.yml` gate definitions unchanged.
- **Design `### Constellations` (4): observation resolved.** Now lists `outlineLabel` and points to `constellationFinder()` and the codebase map row; matches the code C-186 read (F1-F10, L1-L4).

## Gates

Reused from C-186 under the metadata-only rule (verification.md): the code, tests, fixtures, dependencies and gate definitions are unchanged since that run (above). Reused: `npm run check:gates -- lint typecheck build test:full check:engine-alone check:pack check:node-consumer` on a6ccb200, 2026-11-16T10:01:04Z-10:03:18Z, Node v24.16.0, all passed (test:full 265 files, 4049 tests, 0 failures, 2 skipped); `measure:example` all four, exit 0; `savepoint health check O-076` snapshot `sha256:152ef11c...` (10:03:36Z, does not block); `npm run check:browser` 10:04:28Z-10:09:41Z, exit 0, evidence `docs/evidence/browser-20261116T100428Z/`.

Rerun this session for what the docs repair could affect:

| Gate | Result | Time |
|---|---|---|
| Search for tests or tools reading the release notes or Design.md (`grep -rln 'release-notes\|Design\.md' packages/*/tests tools tests`) | none, so `npm test` cannot be affected | 10:12Z |
| `npm run lint` | exit 0 | 10:12:36Z-10:12:40Z |
| `git diff --check a6ccb200..HEAD` | clean | 10:12Z |

Browser not run (no code change; C-186's run stands).

## Owner Decisions Assessed

No structured owner acceptance or exception is recorded on O-076 or its Tasks, so no `carried_forward` entry is due. O-073 "Keep refusing" fractional panel times: unchanged; the notes now describe it. T-322's prose owner read (2026-11-16T10:00:24Z) was of the notes before the repair; the corrected sentences are new text.

## Owner Validation Still Needed

- T-322 (`owner_validation.required: true`): the owner's read of the corrected intro and Upgrading in `docs/release-notes-0.9.2.md` (lines 5 and 41), recorded against this Check.
- Looks: hello-sky's Milky Way, on the preview (`localhost:5490`), as C-186 noted.

## Closure

CLEAR. I-180 closed `verified`. Every O-076 Task is `done` (T-322 awaits only the owner's validation read above); no Issue linked to this Check remains open. The owner may accept the O-076 outcome once the T-322 read is recorded. No version bump, tag or publish.

## Observations (non-blocking)

- The notes and CHANGELOG say "`shownDuring` end"; the test also refuses a fractional `shownDuring` start (`addBody ... shownDuring: { start: t }` -> `bad-body`). "end" under-describes the refusal slightly; outside the frozen lock and both docs agree, so not an Issue.
- C-186's other observations stand (hello-sky browser step 22 s vs 15 s warning; finder test comment wording; STYLE-05 minor).

## Code Style Review

No code changed since C-186; its checklist stands (STYLE-01..04, 06..10 met; STYLE-05 minor).
