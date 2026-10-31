---
id: C-133
scope: {kind: objective, id: O-050}
result: CLEAR
checked_by: {role: checker, session: o050-recheck-20261101}
executed_session: o050-i128-repair-20261101
checked_at: '2026-10-31T22:30:00Z'
health_snapshot: sha256:aee04fbdc7cc680d0a3c75dbecc3a884f44f5dcc8e2a27d69c06c9776cbdc3b3
reviewed:
  base_commit: 4fca108a
  head_commit: 87803afc
  files: [packages/astraeus/src/api/scene.ts, packages/astraeus/src/app/mission.ts, packages/astraeus/tests/publicApiProviderLines.test.ts, packages/astraeus/CHANGELOG.md, packages/astraeus/README.md, .savepoint/router.md]
  dependencies: []
issues: []
supersedes: C-132
---

# C-133: O-050 re-check after the I-128 repair

This is the full re-check of O-050 ("Follow a probe as one path", T-213 to T-217) after C-132 returned NEEDS WORK on I-128. It uses C-132's frozen scope lock, coverage matrix (M1-M32), external-boundary matrix and workflow lock, which are not restated here. No axis, dependency layer or interpretation was added. The repair under review is commit `87803afc` (`git diff 76425b89..87803afc`, 6 files, +68/-5); the Objective baseline stays `4fca108a`.

**Independence.** This session did not plan, build, repair or coordinate O-050, and did not write C-132. It wrote only:
- gate outputs (`coverage/`, `junit.xml`, `dist/`, packed tarballs, example builds);
- one official health snapshot (recorded above);
- three throwaway probe tests, each copied into `packages/astraeus/tests/`, run once with plain `npx vitest run <file>` after `test:full` and the health snapshot (no junit or coverage written), then deleted. The new probe's source is in the Appendix; its log and the C-132 probe re-run logs are in the checker scratchpad (`probe/i128recheck-log.txt`, `probe/probe-log.txt`, `probe/probe-log-b.txt`, `probe/c133-rerun-c132-probes-log.txt`);
- this record and the I-128 resolution.

One process note: the first run of the new probe redirected its console to `probe/probe-log.txt`, which overwrote C-132's scratch copy of that log. C-132's results are quoted in full in the C-132 record, and the re-run below reproduced every one of them, so nothing cited is lost.

Not a lane (`git-dir` = `git-common-dir` = `.git`). `docs/prds/` and `docs/research/` were not read or touched. Node v24.16.0, npm 12.2.1, times UTC.

**Verdict: CLEAR.** I-128 is fixed by the general fix C-132 recommended: provider path sample times are rounded to whole milliseconds (`providerBody`, `scene.ts:950-952`), so every `lineFixedTo` form builds and draws on a provider path, and `"auto"` resolves to non-centre bodies within one sample of an independent sphere-of-influence oracle. Every other C-132 matrix cell reproduces unchanged, the repair's two extra changes (O1 and O2 from C-132) behave as stated, and every gate passes.

## Closure Map (prior Issues)

| Issue | State | Evidence |
|---|---|---|
| I-128 | **closed (verified)** | C-132's own probe `o050b` re-run unchanged on 87803afc: id `"earth"`, list `[sun, earth]` and `"auto"` on 2-day bounds all `ok "drawn"` (were `RangeError`). New independent probe R0-R6 below. Regression test `publicApiProviderLines.test.ts` (4 tests) passes in `test:full` |

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-132 lock reused, immutable)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-132 M1-M32 re-run, below)
- [x] Finite External-Boundary Matrix (unchanged; browser run reused, see Gates)
- [x] Workflow And Side-Effect Check Lock (unchanged; M19 failure step now passes)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; nothing to evaluate)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger

| # | Re-check item | Prior Issue / claim | Frozen cell | Allowed result |
|---|---|---|---|---|
| L1 | provider path, `"earth"` / list / `"auto"`, 2-day bounds (exact C-132 reproduction) | I-128 | M19 | blocking |
| L2 | `"auto"` on a provider path resolves a non-centre body at the right times | I-128 Proof Needed | M19 x M14 (auto oracle) | blocking |
| L3 | provider line drawn against a non-centre body matches the sampled-path drawing | I-128 Proof Needed ("as on a sampled one") | M19 x M6/M8 | blocking |
| L4 | provider sample times whole ms, start/end exact, increasing, over several spans | repair claim (cause) | M19 | blocking |
| L5 | sampled-path behaviour unchanged | I-128 Proof Needed | M1-M18, M21-M32 | blocking |
| L6 | wrong-type `lineFixedTo` gives `bad-trajectory` | repair claim (C-132 O1) | M5 | non-blocking (cell was an observation) |
| L7 | `"auto"` refused as an elements id | repair claim (C-132 O2) | M20 | non-blocking (cell was an observation) |
| L8 | spans under 127 ms, fractional bounds | none | no exact frozen cell | observation only |

## Re-run Of The Frozen Matrix

C-132's two probe files (`probe/o050.probe.ts`, `probe/o050b.probe.ts`, unchanged) were copied to `packages/astraeus/tests/c133-*.test.ts`, run with `npx vitest run ... --reporter=verbose --silent=false` (24 passed), then deleted. Every cell matches C-132 except the three the repair targets:

| Cell | C-132 | C-133 (87803afc) | Class |
|---|---|---|---|
| M1 malformed list classes, M2 boundaries, M3 empty list, M4 mutation | as recorded | identical outputs (null "must be a list", `[null]`/NaN "not a valid moment", missing body "must be a body id", outside "lies outside the path", touching / exact end / empty accepted, mutation-after unchanged) | passed |
| M5 `lineFixedTo: 5` / `true` | `TypeError: lineFixedTo.map ...` (O1) | `bad-trajectory: lineFixedTo 5 must be a body id, "auto" or a list of stretches` (same for `true`; a function also refused) | passed (O1 resolved) |
| M8 gap vertices | errors below 3.3e-8 | same seven errors (max 2.9e-8) | passed |
| M9 `lineAgainstAt` boundary | `["b","a","c"]` | `["b","a","c"]` | passed |
| M14 Earth flyby oracle | enter 110 / leave 291 vs 109.07 / 290.93 | identical | passed |
| M15 Moon innermost | Moon stretch hours 114-127 | identical | passed |
| M16 far path | `[]` / `["sun"]` | identical | passed |
| M17 comet | `["sun"]`, no error | identical | passed |
| **M19 provider path** | `RangeError` for id, list, auto (2-day) | **all `ok "drawn"`**; 127 h auto still `["earth"]`; no-`lineFixedTo` baseline still drawn | **passed (I-128 fixed)** |
| M20 `"auto"` elements id | accepted (O2) | `bad-element: ... "auto" is reserved ...` | passed (O2 resolved) |
| M21 groupMarkers | `[1,1]`, `[2]`, `[3]`, chain, `[5]` | identical | passed |
| M6, M7, M10-M13, M18, M22-M32 | builder tests, browser, consumer, docs | builder suites pass in `test:full` (2064 passed); consumer 7 passed; pack pass; docs re-read (M32: README now also shows `"auto"` and a list in the worked-example sentence; CHANGELOG proof line now "I-125 to I-127") | passed |

## Independent I-128 Probe (new, L1-L4, L6-L8)

Source: Appendix (`probe/i128recheck.probe.test.ts`). Command: copied to `packages/astraeus/tests/`, `npx vitest run packages/astraeus/tests/i128recheck.probe.test.ts --reporter=verbose --silent=false`, 8 passed, then deleted. Set-up: Sun + Earth + Mars scene, Sun-centred; provider returns the true Earth position from an independent resolver plus a made-up straight line relative to Earth (closest approach 200,000 km at hour 200, 10,000 km/h); bounds 401 h + 7 ms (not a multiple of 127 ms). Output (verbatim, abridged to the probe lines):

```
[probe] R0 old formula non-integer count 126 of 128
[probe] R0 resolver at fractional time RangeError: timeUtcMs must be an integer JavaScript UTC Unix-millisecond value
[probe] R1 none ok
[probe] R1 id earth ok
[probe] R1 list sun/earth ok
[probe] R1 auto ok
[probe] R1 id mars ok
[probe] R1 2-day auto ok
[probe] R2 stretches [{"body":"sun","startH":0,"endH":110.5118},{"body":"earth","startH":110.5118,"endH":290.4882},{"body":"sun","startH":290.4882,"endH":401.0000019}]
[probe] R2 soi km 918009 analytic enter h 110.404 leave h 289.596 step h 3.157
[probe] R3 earth values compared 2322 worst rel diff 6.806e-7
[probe] R3 auto values compared 2322 worst rel diff 6.806e-7
[probe] R4 spacing ratios [0.00015696117, 0.00015696117, 0.00015696117, 0.00015696147]
[probe] R5 span 172800000 / 1443600007 / 267840000 / 28800000 / 3600001 / 127003 / 315576000013: ok true providerAskedNonInteger false (each)
[probe] R6 lineFixedTo 5 | true | () => "earth": SceneError bad-trajectory: ... must be a body id, "auto" or a list of stretches
[probe] R6 lineFixedTo null | {}: SceneError bad-trajectory: lineFixedTo must be a list
[probe] R6 addBodyFromElements auto: SceneError bad-element: ... "auto" is reserved ...
[probe] R6 sampled moon auto still works ok
[probe] R7 span 50 dupes 77 last 50 / ok
[probe] R7 span 126.5 dupes 0 last 127 / ok
[probe] R7 frac bounds first/last offset 0 86400001 / ok
```

| Row | Expected | Actual | Class |
|---|---|---|---|
| R0 mechanism | old formula gives fractional times; resolver refuses them | 126 of 128 fractional; `RangeError` | confirms the C-132 cause |
| R1 (L1) | every form builds and draws at five clock times, including the path ends | all `ok`, also id `"mars"` and the exact 2-day C-132 case | passed |
| R2 (L2) | `"auto"` gives sun / earth / sun, boundaries within one sample step (3.157 h) of the analytic crossing of Earth's sphere (918,009 km from literal catalogue GMs at the live Sun-Earth distance) | enter 110.51 h vs 110.40; leave 290.49 h vs 289.60 | passed |
| R3 (L3) | provider path and a sampled path built from the same states at the same times draw the same vertices (id `"earth"` and `"auto"`), at three clock times | 2,322 values each, worst relative difference 6.8e-7 (Float32 buffers) | passed |
| R4 (L3) | Earth-fixed provider line: rendered vertex spacing / independent Earth-relative spacing is one constant (the scale) | four ratios agree within 2e-6 | passed |
| R5 (L4) | 128 whole-ms times, first = start, last = end, strictly increasing, provider never asked a fractional time, for 2 d, 401 h + 7 ms, 3.1 d, 8 h, 1 h + 1 ms, 127,003 ms, 10 years + 13 ms | all true | passed |
| R6 (L6, L7) | as the repair claims; sampled Moon `"auto"` unchanged | as claimed | passed |
| R7 (L8) | no frozen cell | see observations N1, N2 | observation |

## Gates (fresh, HEAD 87803afc, 2026-10-31 UTC)

Runner `scratchpad/gates/run.sh`, sequential; logs `scratchpad/gates/*.log`, summary `scratchpad/gates/summary.txt`.

| Command | Time (UTC) | Result |
|---|---|---|
| `git diff --check 4fca108a..HEAD` | 22:20:36 | rc 0 |
| `npm run lint` | 22:20:37-22:20:40 | rc 0 |
| `npm run typecheck` | 22:20:40-22:20:45 | rc 0 |
| `npm run build` | 22:20:45-22:20:47 | rc 0 |
| `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` | 22:20:47-22:21:26 | rc 0: 167 files, 2064 passed, 1 skipped |
| `npm run test:full` | 22:21:26-22:22:32 | rc 0: 167 files, 2064 passed, 1 skipped (C-132: 166 / 2060; +1 file, +4 tests = `publicApiProviderLines.test.ts`); statements 91.83%, branches 86.56%, lines 94.39% |
| `npm run check:pack` | 22:22:32-22:22:49 | pass; astraeus 472 files (limit 472), 7.16 MB packed |
| `npm run check:engine-alone` | 22:22:49-22:23:06 | pass, 109 files, 1140 passed, 1 skipped |
| `npm run check:node-consumer` | 22:23:06-22:23:08 | pass, 7 tests |

**Browser: not re-run; C-132's run is reused** (`docs/evidence/browser-20261031T221053Z/`, 8/8 steps rc 0 at b32bd8fd). Reasoning: the browser policy allows one `check:browser` per Objective Check and says a later check reuses the earlier run, never running it twice for one change. The repair changes only (a) provider-form `addTrajectory` sample times, (b) a type guard on `lineFixedTo` that throws only for non-string, non-object values, (c) the `"auto"` id refusal in `addBodyFromElements`, (d) a moved comment and docs. `grep` over every non-test caller of `addTrajectory` (site, Apollo 11 demo, synthetic probe and journey, both examples) finds no provider-form path, and none uses `"auto"` as a body id, so no browser scenario reaches the changed lines; their effect is proved in node by the probe and `test:full`, and the packed consumer re-ran green.

## Code Health

`savepoint health check O-050`, run after the full gate: snapshot `sha256:aee04fbdc7cc680d0a3c75dbecc3a884f44f5dcc8e2a27d69c06c9776cbdc3b3` (created). Verdict "Code Health does not block clearance"; complexity, coverage, dependency vulnerabilities, duplication and tests (all optional) each "no blocking finding". Supporting evidence only.

## Verify File Reality

Every file in the repair commit exists on disk with the content reviewed. `publicApiProviderLines.test.ts` is new and runs in `test:full`. The router change in the repair commit (`issue: none` to `issue: I-128`) is a selection edit, not implementation.

## Adversarial Pass (repair code)

- Bypass: the rounding is in `providerBody`, the only producer of provider `pathTimesUtcMs`; sampled paths take their times from the samples (unchanged by the repair; C-132 M6-M18 still pass). The auto resolver, the line drawing and `lineAgainstAt` all read the same `pathTimesUtcMs`, so no path keeps the fractional times.
- Monotonicity and ends: with a step of at least 1 ms (spans of 127 ms or more), rounding keeps times strictly increasing; R5 confirms ends are exact for integer bounds.
- Type guard: `typeof value === "object"` lets `null` and plain objects through to `planLineStretches`, which already refuses them (`must be a list`); a function is now refused.
- Independent oracles: R2 uses literal catalogue GMs and a hand-built geometry; R3 compares against the sampled-path code proved in C-132 M8; R4 is a scale-invariance check independent of the drawing code.

## Issues

None. No materiality actions are required.

## Owner Decisions Assessed

- **Task-check waivers T-213 to T-217** (owner, o050-run-20261101): waive only the optional Task Checks; scope unchanged; apply.
- **Apollo 11 raw budget 4,500,000 B** (owner): `load-budget.mjs` unchanged by the repair; applies.
- **T-217 owner look** ("looks good", 2026-10-31T22:04:59Z): the repair changes nothing the owner looked at (the synthetic journey uses samples; no browser-visible change). Recorded as evidence, not a structured acceptance.

No structured `exception` or `carried_forward` decision exists on O-050, so none is carried forward.

## Closure Readiness

- I-128 closed as `verified` by this Check.
- T-213 to T-216 are done. T-217 is `status: done` and declares `owner_validation.required: true`; the owner may record `owner_validation: {required: true, accepted_check: C-133, accepted_by: {role: owner, session: ...}}`. This Check does not record it.
- With this Check `CLEAR` and no open material Issue linked to it, the owner may close O-050. Objective closure and the commit are the owner's.

## Code Style Review (repair diff)

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**: `checkLineFixedToType` is one small guard.
- [ ] STYLE-03 **Test branches**: the regression test's `"auto"` case asserts only that a list came back, not that it reaches a non-centre body (the probe R2 shows it does); the C-132 peak-member gap is unchanged.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**: C-132's O1 resolved.
- [x] STYLE-07 **One source of truth**: one rounding point for all provider times.
- [x] STYLE-08 **Comments explain why**: the rounding comment names the resolver's guard.
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**: 6 files, +68/-5.

## Non-blocking Observations

- **N1.** A provider path with bounds under 127 ms now gets duplicate sample times (50 ms: 77 duplicates). It builds and draws without error. Such spans are not a realistic use; no frozen cell.
- **N2.** `toUtcMs` accepts fractional numbers, so fractional `bounds` are possible. Rounding then puts the first or last sample up to 0.5 ms outside the bounds (start + 0.4 ms gives first offset 0; end + 0.6 ms gives last offset +1 ms), and the provider is asked at that time. Harmless here; a later tidy could round the bounds once in `providerBody`, or refuse fractional bounds.
- **N3.** The doubled prefix in list-time errors (`lineFixedTo[0] addTrajectory("p") lineFixedTo[0] start "NaN" is not a valid moment`) from C-132 is unchanged; cosmetic.
- **N4.** C-132 O5 (browser follow check seeks rather than plays), O6 (chained grouping) and O7 (hello-scene panels under a numbered mark) still stand as written. O3 (CHANGELOG I-124 mention, README example) and O4 (misplaced comment) are resolved by the repair.
- **N5.** The router still reads `state: task`, `issue: I-128`; this Check does not edit it. After I-128's resolution the owner (or the next session) sets the next selection.

## Appendix: probe source (`probe/i128recheck.probe.test.ts`, as run)

```ts
// Independent recheck probe for I-128 (C-133). Throwaway; copied into packages/astraeus/tests, run once, deleted.
import { describe, expect, it } from "vitest";
import { PerspectiveCamera } from "three";
import { Scene, SceneError, earth, mars, moon, sun } from "astraeus";
import { catalogue } from "../src/assets/catalogue";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createStateResolver } from "../src/core/stateResolver";
import { createState } from "../src/core/state";
import { trueScale } from "../src/core/scalePolicy";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { TrackedBodyView } from "../src/app/TrackedBodyView";
import { trackedBodiesOf } from "../src/app/experienceDefinition";
import { sphereOfInfluenceKm } from "../src/api/sphereOfInfluence";
import { placementAbout } from "./scenePlacement";

const T0 = Date.parse("2026-03-01T00:00:00Z");
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const R = createStateResolver(catalogue.definitions(), catalogue.sources(), createOrbAstronomyAdapter());
const log = (...a: unknown[]) => console.log("[probe]", ...a);
const err = (fn: () => unknown) => { try { fn(); return "ok"; } catch (e) { return e instanceof SceneError ? `SceneError ${e.code}: ${e.message}` : `${(e as Error).name}: ${(e as Error).message}`; } };

// Probe passes Earth: relative to Earth, a straight line at 10,000 km/h along +y, closest approach 200,000 km at TC.
const TC = T0 + 200 * HOUR;
const SPEED = 10_000 / HOUR; // km per ms
const relEarth = (t: number) => [200_000, (t - TC) * SPEED, 0];
const asked: number[] = [];
const provider = { stateAt: (t: number, center?: string) => {
  asked.push(t);
  const c = (center ?? "sun") as "sun";
  const e = R.stateOf("earth", t, c).positionKm; const r = relEarth(t);
  return createState({ body: "probe", center: c, timeUtcMs: t, positionKm: [e[0]! + r[0]!, e[1]! + r[1]!, e[2]! + r[2]!], orientation: null });
} };
const SPAN = 401 * HOUR + 7; // not a multiple of 127 ms
const scene = (lineFixedTo: unknown, span = SPAN, extra = (s: Scene) => s) => extra(new Scene().addBody(sun).addBody(earth, { enlarge: 50 }).addBody(mars)).setTime(T0)
  .addTrajectory({ id: "probe", center: "sun", provider, bounds: { start: T0, end: T0 + span }, lineFixedTo: lineFixedTo as never });
const drawAt = (s: Scene, times: number[]) => {
  const body = trackedBodiesOf(s.toDefinition())[0]!;
  const view = new TrackedBodyView(body);
  const out = times.map((t) => { view.update(t, trueScale, new FloatingOrigin(), new PerspectiveCamera(), placementAbout("sun")); return [0, 1].map((i) => Array.from((view.group.children[i] as any).geometry.getAttribute("position").array as Float32Array)); });
  return { body, out };
};

describe("I-128 recheck", () => {
  it("R0: mechanism at the old formula (pre-repair) — fractional times, which the resolver refuses", () => {
    const step = (2 * DAY) / 127; const old = Array.from({ length: 128 }, (_, i) => T0 + i * step);
    log("R0 old formula non-integer count", old.filter((t) => !Number.isInteger(t)).length, "of 128");
    log("R0 resolver at fractional time", err(() => R.stateOf("earth", T0 + 0.5, "sun")));
  });
  it("R1: every lineFixedTo form builds and draws on a provider path with a non-127-ms-multiple span", () => {
    const list = [{ start: new Date(T0).toISOString(), end: new Date(T0 + 150 * HOUR).toISOString(), body: "sun" }, { start: new Date(T0 + 150 * HOUR).toISOString(), end: new Date(T0 + 250 * HOUR).toISOString(), body: "earth" }];
    const times = [T0, T0 + 100 * HOUR, TC, T0 + 300 * HOUR, T0 + SPAN];
    for (const [name, v] of [["none", undefined], ["id earth", "earth"], ["list sun/earth", list], ["auto", "auto"], ["id mars", "mars"]] as const) {
      const r = err(() => drawAt(scene(v), times));
      log("R1", name, r);
      expect(r).toBe("ok");
    }
    // the C-132 reproduction exactly: 2-day bounds
    const r2 = err(() => drawAt(scene("auto", 2 * DAY), [T0, T0 + DAY]));
    log("R1 2-day auto", r2); expect(r2).toBe("ok");
  });

  it("R2: auto on a provider path resolves sun/earth/sun within one sample step of the analytic SOI crossing", () => {
    const { body } = drawAt(scene("auto"), [TC]);
    const st = body.lineFixedTo as { startUtcMs: number; endUtcMs: number; body: string }[];
    log("R2 stretches", JSON.stringify(st.map((s) => ({ body: s.body, startH: (s.startUtcMs - T0) / HOUR, endH: (s.endUtcMs - T0) / HOUR }))));
    expect(st.map((s) => s.body)).toEqual(["sun", "earth", "sun"]);
    const soi = sphereOfInfluenceKm(catalogue.get("earth").definition.gmKm3S2, catalogue.get("sun").definition.gmKm3S2, Math.hypot(...R.stateOf("earth", TC, "sun").positionKm));
    const half = Math.sqrt(soi ** 2 - 200_000 ** 2) / SPEED; // ms from TC to the sphere's edge
    const step = SPAN / 127;
    log("R2 soi km", soi.toFixed(0), "analytic enter h", ((TC - half - T0) / HOUR).toFixed(3), "leave h", ((TC + half - T0) / HOUR).toFixed(3), "step h", (step / HOUR).toFixed(3));
    expect(Math.abs(st[1]!.startUtcMs - (TC - half))).toBeLessThanOrEqual(step + 1);
    expect(Math.abs(st[1]!.endUtcMs - (TC + half))).toBeLessThanOrEqual(step + 1);
  });

  it("R3: a provider path draws the same vertices as a sampled path at the same times (id earth and auto)", () => {
    for (const v of ["earth", "auto"] as const) {
      const p = drawAt(scene(v), [T0 + 120 * HOUR, TC, T0 + 380 * HOUR]);
      const samples = p.body.pathTimesUtcMs.map((t) => ({ time: t, positionKm: Array.from(provider.stateAt(t, "sun").positionKm) }));
      const s = drawAt(new Scene().addBody(sun).addBody(earth, { enlarge: 50 }).addBody(mars).setTime(T0).addTrajectory({ id: "probe", center: "sun", samples, lineFixedTo: v }), [T0 + 120 * HOUR, TC, T0 + 380 * HOUR]);
      let worst = 0; let n = 0;
      p.out.forEach((frame, f) => frame.forEach((arr, k) => arr.forEach((x, i) => { const y = s.out[f]![k]![i]!; n += 1; worst = Math.max(worst, Math.abs(x - y) / Math.max(1, Math.abs(y))); })));
      log("R3", v, "values compared", n, "worst rel diff", worst);
      expect(n).toBeGreaterThan(0);
      expect(worst).toBeLessThan(1e-6);
    }
  });

  it("R4: earth-fixed provider line is the Earth-relative path carried to Earth's place now (independent oracle on vertex spacing)", () => {
    const now = TC + 50 * HOUR;
    const { body, out } = drawAt(scene("earth"), [now]);
    const ts = body.pathTimesUtcMs; const arr = [...out[0]![0]!, ...out[0]![1]!];
    // ratio of rendered vertex spacing to independent Earth-relative spacing must be one constant (the scale)
    const idx = [0, 20, 40, 60, 78].filter((i) => ts[i]! <= now);
    const verts = (i: number) => arr.slice(i * 3, i * 3 + 3);
    const ratios: number[] = [];
    for (let k = 1; k < idx.length; k += 1) {
      const a = relEarth(ts[idx[k - 1]!]!); const b = relEarth(ts[idx[k]!]!);
      const va = verts(idx[k - 1]!); const vb = verts(idx[k]!);
      ratios.push(Math.hypot(vb[0]! - va[0]!, vb[1]! - va[1]!, vb[2]! - va[2]!) / Math.hypot(b[0]! - a[0]!, b[1]! - a[1]!, b[2]! - a[2]!));
    }
    log("R4 spacing ratios", ratios);
    expect(ratios.length).toBeGreaterThan(1);
    for (const r of ratios) expect(Math.abs(r / ratios[0]! - 1)).toBeLessThan(1e-4);
  });

  it("R5: sample times are whole ms, strictly increasing, start/end exact, 128 of them, for a range of spans", () => {
    for (const span of [2 * DAY, SPAN, 3.1 * DAY, DAY / 3, HOUR + 1, 127 * 1000 + 3, 10 * 365.25 * DAY + 13]) {
      asked.length = 0;
      const { body } = drawAt(scene("earth", span), [Math.round(T0 + span / 2)]);
      const t = body.pathTimesUtcMs;
      const ok = t.length === 128 && t.every(Number.isInteger) && t[0] === T0 && t[127] === T0 + span && t.every((x, i) => i === 0 || x > t[i - 1]!);
      log("R5 span", span, "ok", ok, "providerAskedNonInteger", asked.some((x) => !Number.isInteger(x)));
      expect(ok).toBe(true);
    }
  });

  it("R6: wrong-type lineFixedTo and the reserved id", () => {
    for (const v of [5, true, () => "earth", null, ["earth"], {}]) log("R6 lineFixedTo", String(v), err(() => scene(v).toDefinition()));
    expect(err(() => scene(5))).toMatch(/bad-trajectory/);
    expect(err(() => scene(true))).toMatch(/bad-trajectory/);
    log("R6 addBodyFromElements auto", err(() => new Scene().addBody(sun).addBodyFromElements({ id: "auto", label: "A" } as never)));
    log("R6 sampled moon auto still works", err(() => drawAt(new Scene().addBody(earth).addBody(moon).setTime(T0).addTrajectory({ id: "probe", center: "earth", samples: [0, 1, 2].map((i) => ({ time: T0 + i * HOUR, positionKm: [380_000, 0, 0] })), lineFixedTo: "auto" }), [T0])));
  });

  it("R7 (observation only): very short and fractional bounds", () => {
    for (const span of [50, 126.5]) {
      const r = err(() => { const { body } = drawAt(scene("earth", span), [T0 + 10]); const t = body.pathTimesUtcMs; log("R7 span", span, "dupes", t.length - new Set(t).size, "last", t[127]! - T0); });
      log("R7 span", span, r);
    }
    const r = err(() => { const s = new Scene().addBody(sun).addBody(earth).setTime(T0).addTrajectory({ id: "probe", center: "sun", provider, bounds: { start: T0 + 0.4, end: T0 + DAY + 0.6 }, lineFixedTo: "earth" }); const { body } = drawAt(s, [T0 + HOUR]); log("R7 frac bounds first/last offset", body.pathTimesUtcMs[0]! - T0, body.pathTimesUtcMs[127]! - T0); });
    log("R7 fractional bounds", r);
  });
});
```
