---
id: C-214
scope: {kind: release, id: G-024}
result: CLEAR
checked_by: {role: checker, session: check-i195-20261122}
executed_session: orchestrate-g024-20261122
checked_at: '2026-11-22T07:14:00Z'
reviewed:
  base_commit: f0ecbb86
  head_commit: 4841f12c
  files: [packages/astraeus/src/app/useBodyTexture.ts, packages/astraeus/tests/glowAndHooksDom.test.ts, packages/astraeus/tests/ownedPictures.test.ts, packages/astraeus/package.json, package-lock.json, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
  dependencies: []
issues: []
supersedes: null
---

# C-214: I-195 repair check

Fresh session; it did not build or repair this work. Quick method on the direct repair of I-195 (recorded under G-024, as C-170 did for a repair check), diff `main...HEAD` (one commit, `4841f12c`). Nothing repaired, committed or pushed; router untouched.

**Result: CLEAR.** Proof Needed holds: `check:three-newest` passes on three 0.187.0, and the peer range `>=0.169.0 <0.188.0` states only what was run (API-07).

## Scope lock

1. Proof Needed: engine typechecks against the newest three after the fix; peer range widened to what it proves (API-07).
2. Files: the seven in `reviewed.files` plus the Issue history entry.
3. Out of scope: runtime behaviour (no runtime code changed beyond a type assertion), browser rendering.

## Proof (all run fresh here, 2026-11-22T07:10Z..07:13Z)

| Item | Expected | Actual |
|---|---|---|
| `npm run check:three-newest` | pass on the newest in range | three 0.187.0 + @types/three 0.187.0: typecheck, lint pass; 259 files, 4330 passed, 1 skipped; 37.4 s |
| `check-engine-alone --three 0.181.2` | pass (lowest version that broke) | @types/three 0.181.0: typecheck, lint pass; 4330 passed, 1 skipped; 33.5 s |
| `check-engine-alone --three 0.183.2` (added here) | pass inside the un-run 0.182..0.185 gap | @types/three 0.183.1: typecheck, lint pass; 4330 passed, 1 skipped; 31.6 s |
| Root three/@types 0.169.0 (floor) | quality gates pass | see Gates |

**Peer range judgement.** The two type changes the Issue names arrive at 0.181 (generic `Texture` from `TextureLoader.load`) and 0.182 (`getContext` widened to `GPUCanvasContext`). The repair no longer writes the signature out: `SafeTextureLoader.load` takes `Parameters<TextureLoader["load"]>` and `ReturnType<...>`, so it follows whatever the installed types declare. Run points now cover the floor (0.169), the first break (0.181.2), the middle of the gap (0.183.2), 0.186.1 (executor, reported not reproduced) and the ceiling (0.187.0). Leaving 0.182, 0.184 and 0.185 un-run is acceptable: the fix is derived from the installed types rather than tied to one version, and the bracketing versions pass. The upper bound `<0.188.0` stops before anything untested.

**Test edits.** Both change only `as unknown as CanvasRenderingContext2D` to `as never` on the `mockReturnValue` object of the `getContext` spy, plus a comment. A type assertion is erased at compile time; the mock object, spy and hooks are byte-identical. No setup or behaviour change. Root test count is unchanged (5487 passed, 2 skipped).

**Docs.** README peer line ("0.169 up to, not including, 0.188") matches `package.json` and the lock file. CHANGELOG 0.10.0 line is true: range matches; 0.169, 0.181, 0.186 and 0.187 were run with matching types (0.186 by the executor only); the loader-signature description matches the code.

**Browser.** None run: no camera, layout, shader, sky or packaging-path change (`package.json` changes only `peerDependencies`, not `exports`/`files`); the one source edit is a type-level signature with an unchanged runtime body.

## Gates

| Gate | Result | Time |
|---|---|---|
| `git diff --check main...HEAD` | clean | 0.0 s |
| `npm run lint` | exit 0 | 8.2 s |
| `npm run typecheck` | exit 0 | 7.7 s |
| `npm run build` | exit 0 | 7.0 s |
| `npm test` (junit) | 337 files, 5487 passed, 2 skipped | 40.8 s |
| `npm run check:pack` | pass | 22.3 s |

## Issues

None. No materiality actions are required.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** — signature now taken from `TextureLoader.load` rather than copied.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**

## Observations (non-blocking)

- The executor's `repair_attempted` entry on I-195 is stamped `2026-11-22T08:20:00Z`, later than real UTC at this check (about 07:14Z); likely local time labelled UTC. Not edited (append-only history).
- The two test comments name the widening differently ("newer @types/three" vs "@types/three 0.181"); cosmetic.
- Unverified: 0.182.0, 0.184.x, 0.185.x not run individually (judged acceptable above); 0.186.1 reported by the executor, not reproduced.
