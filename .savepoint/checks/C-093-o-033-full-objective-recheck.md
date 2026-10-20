---
id: C-093
scope: {kind: objective, id: O-033}
result: CLEAR
checked_by: {role: checker, session: o033-targeted-recheck-20261020}
executed_session: o033-repair-i053-20261021
checked_at: '2026-10-20T14:36:00Z'
health_snapshot: sha256:62d3f2550c4ae8710f403a9da4f4ceff497f2b993a3c2b16cbc05afe21bc75fb
reviewed:
  base_commit: ff1d8d80
  head_commit: 5a68b0a4
  files: [data/planets/pluto.json, tests/planetOpeningFraming.test.ts, .savepoint/Design.md, .savepoint/issues/I-052-outer-planets-browser-check-fails-on-its-first-clock-read.md, .savepoint/issues/I-053-pluto-opens-on-a-phone-with-charon-off-the-left-edge.md]
  dependencies: []
issues: []
supersedes: C-092
---

# C-093: O-033 targeted Full Objective recheck

Independent session: did not build, repair or coordinate any O-033 work. This is the one targeted recheck after the one targeted remediation (I-053, closing I-052) that C-092's Convergence section allowed. C-091's scope lock is frozen and reused unchanged; C-091 and C-092 evidence is reused for everything the repair did not touch (AGENTS.md Verification Policy; owner rule: a later check reuses the earlier run, never the same set twice for one change).

## Closure map of prior Issues

| Issue | Proof Needed | State after this recheck |
|---|---|---|
| I-048 outer planets without their own places | met at C-092 (code unchanged since) | resolved, verified |
| I-049 catalogue "shown in the app" | met at C-092 (unchanged) | resolved, verified |
| I-050 "within 1 m" for every dot moon | met at C-092 (unchanged) | resolved, verified |
| I-051 switch drops the running clock | met at C-092; switch scenario passed again at both sizes in this run | resolved, verified |
| I-052 outer-planets script fails on its first clock read | 1 met at C-092; 2 met now (planets set clean: six steps at C-092, outer-planets here) | resolved, verified |
| I-053 Pluto phone framing | 1, 2 and 3 met (below) | resolved, verified |

## Progress

- [x] Establish Scope (diff `ff1d8d80..5a68b0a4` read in full: one number in `data/planets/pluto.json`, one new test, Design text, two Issue history entries)
- [x] Freeze The Check Scope (C-091 lock reused unchanged; no new axis)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (recheck cells below; others reused)
- [x] Finite External-Boundary Matrix (runner and dev server unchanged; C-091 classification stands)
- [x] Workflow And Side-Effect Check Lock (no workflow code changed)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not used; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission ledger

| Recheck item | Prior Issue / claim | Frozen cell (C-091) | Allowed result |
|---|---|---|---|
| Pluto and Charon in view at phone and desktop | I-053 Proof 1 | T-118 DW4 framing; SC9 planets set at phone | blocking |
| Test fails when Charon is out at phone size | I-053 Proof 2 | SC9; TEST-01 | blocking |
| Planets set clean at both sizes | I-052 Proof 2, I-053 Proof 3 | SC9; T-118 DW5; T-121 DW1 | blocking |
| Phone Uranus scenario (unverified at C-092) | I-052 | T-118 DW5 | blocking |
| Jupiter unchanged | regression of the repair | SC6 | blocking |
| Engine set and other planets-set steps reuse | owner rule | SC9 | reuse if the repair cannot reach them |
| Design reflects the repairs | C-092 observation | Objective Design reconciliation | observation |

## Reach of the repair (verified, not assumed)

`git diff --stat ff1d8d80 HEAD` outside `.savepoint/` and `docs/evidence/`: `data/planets/pluto.json` (startView distance 12 to 20) and `tests/planetOpeningFraming.test.ts` only. No `src/` or `tools/` file changed, so no scene, camera, controls or UI code: the engine set stays reused from C-091 (pass, 275 s, `docs/evidence/engine-20261020T135556Z/`). Of the planets-set scripts only `tools/validate/browser-outer-planets.mjs` mentions Pluto (`grep -l pluto tools/validate/browser-*.mjs`); smoke, jupiter-io, moon-panel, jupiter-tap, story-panels and planet-switch open Jupiter, the catalogue page or Mercury to Mars, and passed at C-092 (`docs/evidence/demo-planets-20261020T141653Z/`, each exit 0, 0 error lines). So only outer-planets was rerun. `data/planets/jupiter.json` unchanged (SC6). Public build asset checks reused from C-092: the change is one digit for another in a settings file (same byte count), so no page set's size moves.

## Gates (fresh, at HEAD 5a68b0a4, clean tree)

| Gate | Time (UTC) | Result |
|---|---|---|
| `npm run typecheck` | 14:30:55Z | exit 0 |
| `npm run build` | 14:30:55Z-14:30:56Z | exit 0 (chunk-size warning only, as before) |
| `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` | 14:30:56Z-14:31:29Z | exit 0, 88 files, 1,250 passed, 1 skipped |

Log: `/tmp/claude-1000/-home-user-code-Astraeus/827ddc8a-e534-43b0-98b9-9af4e2acda26/scratchpad/gates2.log` (scratch).

## Browser check (one script, run once, not rerun)

The runner cannot select one step from the command line, so the shared `runSet` from `tools/validate/runner.mjs` was called with the planets set's own outer-planets step definition (same dev server on 5479, same `ASTRAEUS_URL`/`ASTRAEUS_EVIDENCE_DIR`, same summary format):

`node --input-type=module -e 'import { runSet } from "./tools/validate/runner.mjs"; process.exitCode = await runSet("demo-planets-outer", [{ name: "outer-planets", script: "browser-outer-planets.mjs", scene: "planets: Saturn, Uranus, Pluto (desktop and phone)" }]);'`

| Step | Window (UTC) | Evidence | Result |
|---|---|---|---|
| outer-planets | 14:31:44Z-14:33:49Z (125 s; total 131 s with server) | `docs/evidence/demo-planets-outer-20261020T143138Z/` | exit 0, 0 error lines, `errors: []` |

Both passes completed every scenario: desktop 1280 x 800 and phone 390 x 844 each ran the clock read, the five-day seek and switch to Saturn (kept times 2016-11-15T13:14:45Z desktop, 13:04:42Z phone), the outer planets in the switch, Saturn's ring radii and moon families, the Titan Kraken Mare, Charon Mordor Macula and Pluto Sputnik Planitia presses, Pluto and Charon drawn as spheres in view at Pluto's opening view (the assertion that failed at C-092 on the phone), and Uranus's ring bands and all moons as dots (phone Uranus, unverified at C-092, now run). No screenshot was taken; the evidence directory holds logs and `results.json` only.

## Code Health

`savepoint health check O-033 .` after the gates (14:34:14Z): snapshot `sha256:62d3f2550c4ae8710f403a9da4f4ceff497f2b993a3c2b16cbc05afe21bc75fb` (created), "Code Health does not block clearance". Complexity, dependency vulnerabilities and duplication: no blocking finding; coverage and tests instances stale (optional; collection state, not a finding).

## Owner decisions carried forward

No structured owner `exception` or `owner_validation` acceptance exists on O-033 or its Tasks, so no `carried_forward` entry is written. The Task-check waivers (`check_waiver` on T-114 to T-121, 2026-10-20) are unchanged in scope and still apply; they waive Task Checks only.

## Coverage matrix (recheck cells; C-091 and C-092 cells not listed are unchanged and reused)

| Criterion / cell | Evidence | Result |
|---|---|---|
| I-053 Proof 1 / T-118 DW4 "showing Pluto and Charon" | settings `startView.distance` 20 (azimuth 0, elevation 20 unchanged, inside reach 400/2000); browser: Pluto and Charon spheres in view at 390 x 844 and 1280 x 800 | Proven |
| I-053 Proof 2 | `tests/planetOpeningFraming.test.ts`; independent recompute: worst-case Charon share of half-width 1.430 at distance 12 phone (fails the `< 1` bound), 0.839 at 20 phone, 0.242 at 20 desktop; scene fov is 45 deg (`AstraeusScene.tsx` line 188) as the test assumes; the browser scenario also fails on an out-of-view Charon (C-092 proved it) | Proven |
| SC9 planets set, phone and desktop, zero console errors (I-052 Proof 2, I-053 Proof 3) | six steps exit 0 at C-092 on code the repair cannot reach + outer-planets exit 0 here; 0 error lines throughout | Proven |
| T-118 DW5 / T-121 DW1 written scenarios run | every outer-planets scenario ran at both sizes, phone Uranus included | Proven |
| SC6 Jupiter unchanged | `jupiter.json` and all `src/` unchanged since C-092 | Proven (reused) |
| SC1, SC2, SC8 (I-048 to I-051) | code unchanged since C-092; switch and place scenarios passed again | Proven (reused + rerun) |
| SC9 configured gates | fresh, pass | Proven |
| SC9 engine set | reused from C-091; the repair reaches no engine step | Proven (reused) |
| SC7 budget, public build validator | reused from C-092; no size change | Proven (reused) |
| SC9 / T-121 DW5 owner's look | pending | Owner validation (below) |

## Adversarial notes

- The opening view is one `startView` for every screen shape; the test takes the worst case over all directions of Charon around Pluto, not its position at the default time, so a different opening time cannot push Charon out at the phone aspect (0.84 of the half-width leaves margin; Pluto alone uses under 0.2).
- The test uses the system's mean separation (19,596 km); Charon's orbit is near circular (eccentricity about 0.0002), so the real separation does not exceed it materially.
- Saturn, Uranus and Neptune framings are unchanged and pass the same geometry at both aspects; the browser's Saturn and Uranus scenarios use explicit views, so the geometry test is the only check of their default openings (observation, not in the frozen lock as a browser cell).

## Issues

None. No materiality actions are required.

## Owner validation still needed

T-121 `owner_validation: {required: true}`: the owner's one look at each planet on the preview (localhost:5490) is outstanding and is not recorded here. T-121 stays at `stage: audit`; only the owner records the acceptance against this Check and sets Tasks done. Owner judgement items already flagged (owner decisions, not findings): Saturn view about 23.3 MB raw; Iapetus marker frame (Design now says yaw 0, to be confirmed on the preview); outer planets out of shower views (`BEYOND_SHOWER_VIEWS`); repository growth; S/2009 S 2 stand-in radius; Io IAU facing; Pluto and Charon licence wording; ring looks and framing (Pluto now opens farther out, distance 20); Jupiter's own places deliberately out under SC6, and the catalogue's "Not in the app yet" wording for Jupiter.

## Observations (non-blocking)

- C-092's Design observation is addressed: the planets row now names `isSurfacePlace`, `data/moons/fit-errors/` with `PlanetSystem.fitErrorsM`, the live clock through `ExperienceSwitch.currentTimeUtcMs`, and Pluto's distance with its test; the Iapetus wording is corrected.
- T-118 Done When 4 still reads "Pluto 12 at 20 deg"; the setting is now 20 under I-053 (Design records it). Task text is history; no action needed unless the owner wants it noted.
- Repair history entries are dated `2026-10-20T14:29:59Z` while the repair commit is 14:30:15Z (+11:00 shown as 01:30:15); close enough, no local-time-as-UTC error this time.
- C-091 and C-092 observations not touched by the repair stand.

## Code Style Review

- [x] STYLE-01 **One job per file** — one new test file for one rule.
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches** — the framing test fails on the original setting.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed** — a settings number, not a per-aspect framing system.
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — the test restates the 45 deg fov and planet/ring radii as constants rather than reading them from the scene and data (C-092's inline-rule note also stands).
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data** — the fix is in the planet's settings file.
- [x] STYLE-10 **Small diffs** — 5 files, 55 insertions.

## Result

CLEAR. I-053's repair holds: Pluto and Charon open in view at phone and desktop, a test fails on the old framing, and the planets set is clean at both sizes (outer-planets rerun once here, the other six steps reused from C-092 on code the repair cannot reach). I-048 to I-053 are resolved as verified. Gates, the health snapshot and the reused engine set and public build checks pass. The Objective is ready for owner closure once the owner records T-121's look on the preview, marks the Tasks done and accepts the outcome; this Check closes nothing itself.
