---
id: C-182
scope: {kind: objective, id: O-074}
result: CLEAR
checked_by: {role: checker, session: o074-check-20261115}
executed_session: plan-o074-20261115
checked_at: '2026-11-15T09:33:00Z'
health_snapshot: sha256:b362182d8c7aa1761b8f2d5fa6dfa49474f0d5c07a4613d8c021405a0bdd445c
reviewed:
  base_commit: 18a582f5
  head_commit: 3c138aab
  files: [packages/astraeus/src/core/lookValues.ts, packages/astraeus/src/app/look.ts, packages/astraeus/src/api/lookInput.ts, packages/astraeus/src/api/look.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/shell/timelineModel.ts, packages/astraeus/src/shell/TimelineBar.tsx, packages/astraeus/src/shell/infoModel.ts, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/app/timeLook.ts, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/liveLook.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/tests/timeLook.test.ts, packages/astraeus/tests/look.test.ts, packages/astraeus/tests/helpers/viewerPresentation.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus/api-surface.lock.json, packages/astraeus-site/tools/validate/load-budget.mjs, .savepoint/Design.md]
  dependencies: []
issues: []
supersedes: null
---

# C-182: O-074 Full Objective Check

Fresh session; I did not plan or build O-074 or T-316. Scope: O-074 and its one Task T-316 (Task Check waived by the owner, 2026-11-15T09:10:52Z), diff `git diff main...HEAD` (main 18a582f5 to HEAD 3c138aab).

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (n/a: no server, subprocess or network in the change; `Intl` is an in-process runtime API, covered in the matrix)
- [x] Workflow And Side-Effect Check Lock (n/a: a pure formatter and a live look; no persistence, artifacts or multi-step writes)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (n/a)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (n/a: initial Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. Criteria: O-074 Success Conditions SC1-SC6, Design Decisions D1-D4 and Boundaries; T-316 Done When (6 bullets); Guardrails ARCH-02, API-02, API-04, API-05, API-06, TEST-01..03, CODE-01; gates: lint, typecheck, build, test:full, check:engine-alone, check:pack, check:node-consumer, measure:example, check:browser, Code Health.
2. Changed files: the `reviewed.files` list. Public entry points: `Scene.setLook`, `handle.setLook`, `handle.look` (mount and React handle, same type), exported type `TimeLook`, `LookInput.time`, `LookRead.time`.
3. Relied-on runtime: `Intl.DateTimeFormat` (zone acceptance, language style, short zone name); React re-render of the shell on the App's `timeLookShown` state.
4. Axes: zone class (UTC, local, IANA east, IANA west across a date line, lowercase `utc`/`Etc/UTC`, unknown, empty, blank, non-string) x precision (day, minute, second, unknown); places (clock bar full and short text, slider `aria-valuetext`, bound dates, event list rows, event card subtitle, window card Starts/Ends/Peak, `<time dateTime>`, Developer drawer, address `t`); state (default, setLook before mount, live setLook, round-trip, reset to `{}`, refused setLook); representation (input, read-back, address).
5. Admission: a supported public call producing text or a read-back that contradicts an SC or Done When bullet.

## Coverage matrix

| # | Cell | Expected | Actual / evidence | Result |
|---|---|---|---|---|
| 1 | UTC x second, default and explicit | byte-identical 0.9.1 ISO | `timeLook.test.ts` "UTC to the second is byte-identical"; bar/slider/bounds/cards test; checker probe on a mounted viewer: `2030-01-01T00:00:00Z` in bar, slider, rows | pass |
| 2 | UTC x minute / day | `...T04:37Z` / `2026-11-15` | table rows; probe `2030-01-01T00:00Z`, short `2030-01-01 00:00` | pass |
| 3 | local x 3 precisions (TZ pinned) | Intl, visitor language, short zone; day date only | table rows (Asia/Kolkata, en-US) | pass |
| 4 | Australia/Sydney, America/New_York x 3, across a date line | Intl; NY reads the 14th | table rows; probe NY/day: `Dec 31, 2029` for 2030-01-01T00:00Z | pass |
| 5 | unknown zone, empty, blank `"  "`, non-string, unknown precision, unknown key, non-object | `bad-look` | test cases (6) + probe via live `handle.setLook` (3), refused call leaves `handle.look.time` unchanged | pass |
| 6 | `"LOCAL"` | `bad-look` (Intl refuses) | probe: `bad-look` | pass |
| 7 | `"utc"`, `"Etc/UTC"` | accepted as IANA names Intl knows | probe: accepted, Intl style `Jan 1, 2030, 12:00:00 AM UTC` | pass (observation) |
| 8 | read-back default | `{ zone: "UTC", precision: "second" }` | test; probe `handle.look.time` | pass |
| 9 | live setLook, no remount | text changes at once | probe: same `.timeline-time` element node before and after; full, short, slider, rows and bounds all changed | pass |
| 10 | `setLook(handle.look)` round-trip | text unchanged | probe and `applyLook` test | pass |
| 11 | `setLook({})` | back to default ISO | probe | pass |
| 12 | `<time dateTime>` | ISO UTC always | probe: clock, rows, bounds keep ISO UTC under NY/day; test | pass |
| 13 | event card subtitle; window Starts/Ends/Peak | formatter | test (default and NY/minute) | pass |
| 14 | Developer drawer, address `t` | stay UTC | `DebugOverlay.tsx:19` and `viewLink.ts:86` unchanged; grep shows no other visitor-facing ISO text in `src/shell` | pass |
| 15 | address cannot set time (`param: null`) | address ignored | test "ignores the address" (`?zone=&time=&precision=`); `fromAddress` returns undefined for zone/choice | pass |
| 16 | Scene.setLook before mount | kept, frozen copy | test | pass |
| 17 | React path (API-02) | same handle type | `ViewerHandle` shared; the look path is the same `checkedLook`/`applyLook` | pass |
| 18 | API times (ARCH-02) | unchanged UTC ms | diff touches only display code and look checking | pass |
| 19 | README rows, CHANGELOG Unreleased, API lock | updated | README L130, L232; CHANGELOG first Unreleased bullet; lock gains `TimeLook`, `LookInput.time`, `LookRead.time` | pass |
| 20 | Design reconciliation | drift note reflected | Design.md "The time look (O-074, T-316)" paragraph (3c138aab) matches the drift note | pass |

Classification: SC1-SC6 Proven; D1-D4 Proven; all six Done When bullets Proven.

## Adversarial pass

- Bypass: the address cannot reach `time` (row 15); the Developer drawer has no control. `handle.setLook` uses the same `checkedLook` as `Scene.setLook` (row 5 via the live handle).
- Representation: read-back round-trips through `setLook` (row 10).
- Date boundaries: NY across midnight UTC and New Year (rows 4, probe).
- Locale independence: the test pins the language and `TZ`, and normalises the narrow no-break space newer ICU puts before AM/PM.
- Independent oracle: my probe compares against `toISOString` and DOM text on a mounted viewer, not `formatTime` itself.

## Existing tests

`tests/look.test.ts` gained two rows in the `CASES` table (`time.zone`, `time.precision`); no existing row or setup changed. The table's own "covers every look in the table" check requires a row per `LOOK_FIELDS` entry, so the rows are the intended way to extend it. `tests/helpers/viewerPresentation.ts` `FAKE_LOOK` gained `time: { zone: "UTC", precision: "second" }` because `LookRead` now requires it (typecheck fails without it); the value is the default and no test reads it differently. Both are additions forced by the type and the coverage check, not changes to an existing test's setup: acceptable.

## Gates (HEAD 3c138aab, Node v24, 2026-11-15)

| Command | Time (UTC) | Result |
|---|---|---|
| `npm run lint` | 09:20:56Z | pass, 4 s |
| `npm run typecheck` | | pass, 10 s |
| `npm run build` | | pass, 2 s |
| `npm run test:full` (full gate) | | pass: 260 files, 3,951 passed, 2 skipped, 78 s (includes `apiReference.test.ts` at the owner's 44,500 B gzip limit) |
| `npm run check:engine-alone` | | pass, 22.9 s |
| `npm run check:pack` | | pass, 19.3 s |
| `npm run check:node-consumer` | | pass, 5 s |
| `npm run measure:example` | to 09:23:21Z | pass; first-open total 508,694 B gzip |
| `git diff --check main...HEAD` | | clean |
| `npm run check:browser` (once, alone) | 09:26:30Z-09:31:47Z | pass, 12 of 12 steps, total 316 s (limit 320 s); `WARNING: step hello-sky took 22s, over its limit of 15s` (warning only, as in O-073; exit 0). Evidence `docs/evidence/browser-20261115T092630Z/` |
| Checker probe (mounted viewer, happy-dom, discarded scratch file `tests/zzO074CheckProbe.test.ts`, removed after the run) | 09:32Z | 1 passed |

## Code Health

`savepoint health check O-074` (09:26:13Z, after the full gate): snapshot `sha256:b362182d8c7aa1761b8f2d5fa6dfa49474f0d5c07a4613d8c021405a0bdd445c` (created). "Code Health does not block clearance." complexity, coverage, dependency_vulnerabilities, duplication, tests: reported, no finding.

## Issues

None. No materiality actions are required.

## Observations (non-blocking)

- A local or named zone shows its full text in the narrow bar's short slot (`shortTimestamp` returns it unchanged), e.g. `Nov 14, 2026, 9:37:12 PM EST` (about 27 characters against 16 for UTC). Not covered by an SC; the owner may want to look at a zone look on a phone size on `localhost:5490`.
- `"utc"` and `"Etc/UTC"` are accepted (Intl knows them) and read in the Intl style, not ISO; only the exact `"UTC"` keeps ISO text. Consistent with the README wording.
- `LookRead.time` has no doc comment, unlike its neighbours.
- The precision union `"day" | "minute" | "second"` is written in `api/look.ts`, `shell/timelineModel.ts` and as `TIME_PRECISIONS` in `core/lookValues.ts`; `isTimePrecision` is exported but unused.

## Owner decisions carried forward

- T-316 Task-check waiver (owner, 2026-11-15T09:10:52Z): applies; no Check stands in for it.
- api/index.html gzip limit 44,000 -> 44,500 B (owner, 2026-11-15T09:20:17Z, recorded in T-316 and `load-budget.mjs`): accepted decision, not a finding; the page passes under it.

## Owner validation still needed

None required (T-316 `owner_validation.required: false`). Closing O-074 is the owner's decision.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [ ] STYLE-05 **Build only what is needed** — `isTimePrecision` (`core/lookValues.ts`) is exported and never used.
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — the precision names are repeated in `api/look.ts`, `shell/timelineModel.ts` (`TimeLook`) and `core/lookValues.ts` (`TIME_PRECISIONS`).
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
