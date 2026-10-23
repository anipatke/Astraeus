---
id: C-102
scope: {kind: objective, id: O-030}
result: NEEDS WORK
checked_by: {role: checker, session: o030-full-check-20261023}
executed_session: coordinator-20261023
checked_at: '2026-10-23T03:19:00Z'
health_snapshot: sha256:92a7166d27bcf359a4280386a88e0594aab1670ac5647747ad567a64090ad9c9
reviewed:
  base_commit: a6548cd4
  head_commit: 8b84bd93
  files: [src/main.tsx, src/app/addressNavigation.ts, src/app/App.tsx, src/app/AstraeusScene.tsx, src/app/sceneContentsHooks.ts, src/app/bodyDraw.ts, src/app/TrackedBodyView.ts, src/app/useBodyTexture.ts, src/shell/SwitchControl.tsx, src/shell/bootLoader.ts, src/experiences/showers/showerDefinition.ts, tools/validate/load-budget.mjs, tools/validate/driver.mjs, tools/validate/journey-meteor-shower.mjs, docs/BROWSER_CHECKS.md, tests/addressNavigation.test.ts, tests/switchControl.test.ts, tests/releaseSharedTextures.test.ts, tests/showers.test.ts, tests/helpers/shippedPanels.ts, tests/domSetup.ts, .savepoint/Design.md, docs/evidence/browser-20261023T031537Z/summary.txt]
  dependencies: []
issues: [I-074]
supersedes: null
unmet: [O-030-SC3]
---

# C-102: O-030 Full Objective Check

Full Objective Check of O-030 (T-152, T-153, T-154; all three Task Checks waived by the owner, "Same as O-031 (Recommended)", waivers in each Task's frontmatter). This session is independent: it did not plan, build, coordinate or mark any O-030 work. Times are `date -u` output.

**Verdict: NEEDS WORK**, on one low-materiality defect (I-074): a switch made while the loading cover is still fading out after the previous scene appeared loses the cover (SC3). Everything else is proven: in-place switch with no reload, address and back/forward logic, generic switch, one story per shower, the leak repair, gates, load budget and the one browser run all pass.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (lanes not used; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. O-030 Success Conditions 1-5; T-152/T-153/T-154 Done When; guardrails ARCH-01, ARCH-02, ARCH-03, CODE-01, TEST-01, TEST-03; AGENTS.md browser rules (one run, driver only, no screenshots, fresh evidence folder).
2. Diff `a6548cd4..8b84bd93` (24 code/test/tool/doc files, listed in `reviewed.files`); entry points: the top-bar `SwitchControl`, `popstate`, the app entry `src/main.tsx`, `loadShowerPanelsFile`, `load-budget.mjs`.
3. Relied-on runtime: React remount by key, Three.js dispose events, Vite lazy glob chunks, history API, the boot cover markup in `app.html`.
4. Matrix below; text classes, colour/redirected output not applicable (no text-width or CLI output in scope).
5. Supported path: the showers page (public and local) and the local planets demo; an Issue needs a reproducible supported-path violation of a Success Condition, Done When or guardrail.

## Acceptance Coverage

| Requirement | Result | Evidence |
|---|---|---|
| SC1 In place: new definition built and mounted, old released, own start view/time, `keep: ["t"]` keeps time | **Proven** | `main.tsx` rebuilds via `chooseDefinition` reading `window.location.search` each time and remounts `<App key={mounts}>` on one root; journey: marker on `window` survives the Geminids switch, 51,115 Geminid dots drawn (`browser-20261023T031537Z/meteor-shower`); planets-phone journey switches Mercury to Jupiter in place (passes); `switchAddress` drops `view`/`t` and keeps `t` when asked (`tests/addressNavigation.test.ts` "a kept time travels in the address; the view is dropped"); release: heap evidence in T-153 judged below |
| SC2 Address and back/forward in place | **Proven** | `addressNavigation.test.ts` push vs no-push, newest-wins, failure cases; `popstate` wired at `main.tsx:111`; `viewLink.ts:109` uses `replaceState` only on share, so no stray pushes; owner look covered Back/Forward on desktop and phone |
| SC3 Generic switch, made-up proof, loading cover covers the change | **Issue (I-074)** | Generic and ARCH-03 proven (`SwitchControl.tsx` names nothing; `tests/switchControl.test.ts` made-up `pick` choice, callback gets the address, no navigation). Cover: a switch within the previous cover's fade (0.6 s default, up to 3.1 s) loses the cover; probe below |
| SC4 One story; budget lists and limits it | **Proven** | No eager glob in `showerDefinition.ts`; public build `app.js` maps each `stories/*/panels.json` to its own lazy chunk; `showerDefinition` chunk imports none; load budget `showers` 20 files 9,945,232 B (limit 10,070,000), `geminids` 20 files 12,431,808 B (limit 12,680,000), via the new `storyPanels` option; `showers.test.ts` cases at lines 731 and 739 (same error wording) |
| SC5 Proof: fast tests, journey step, one memory reading, owner look, gates, one browser run | **Proven** | All named; memory recorded once in T-153 (after repair 32.9 to 49.6 MB over 20 switches, levelling after the first switch; JS heap only, GPU not measured, stated); owner look in T-154 "all fine, run the check"; browser run below |
| T-153 Done When: one `npm run check:browser` | **Proven** | Deferred to this Check by owner decision; run once here |
| T-154 Design reconciliation of both drift notes | **Proven** | `Design.md` rows `src/experiences/`, `src/shell/`, `src/main.tsx` + `addressNavigation.ts`, Shower builder (lazy panels, in-place switch, texture release, caches kept), O-024 paragraph "now in place" |

## Coverage Matrix

| Row (public surface) | Normal | Boundary / malformed | State / sequence | Result |
|---|---|---|---|---|
| `SwitchControl` click | inactive option calls `open(address)` | active option: no call; <2 options: no control; no `open`: falls back to `location.assign` (code read) | n/a | passed |
| `createAddressNavigation.open` | push then cover then rebuild | rebuild rejects: `fail` once | two opens, first resolves last: only newest mounts | passed (unit) |
| `createAddressNavigation.popped` | cover then rebuild, no push | n/a | popped after open | passed (unit) |
| `main.tsx` mount/remount | key bump remounts App | build failure: `failBootLoader` (unchanged path) | real browser switch in place | passed (journey) |
| `showBootLoader` / `hideBootLoader` | cover removed, switch, cover rebuilt and hidden again | no `#boot` template: no-op (code read) | **switch during the fade: cover removed by the old timer**; stale first-frame hide (adjacent, code read) | **Issue I-074** |
| `loadShowerPanelsFile` | settings path loads its file | no path: undefined; path naming no file: `ShowerSettingsError` same wording | inline panels bypass the lookup | passed (unit) |
| `buildShowerDefinition(…, panelsFile)` | handed panels used | made-up shower with panels from settings alone | n/a | passed (unit) |
| `load-budget.mjs` `storyPanels` | chunk found and counted | app script names no chunk: problem reported (code read) | n/a | passed (public build) |
| Shared texture release | anchor and sprite geometry dispose events fire; anchor rebuilt | `releaseAnchorSprite` twice: safe | scene unmount then next scene re-uploads | passed (unit; heap evidence) |
| Journey Geminids step | page kept, stream drawn | n/a | after play/seek/story panel | passed (browser) |

External boundary (browser runner, dev and preview servers): runner uses ports 5479/5480 with `--strictPort` (5490 left alone; verified free before the run); startup, success and cleanup passed; non-success, timeout and refusal paths are the runner's existing code, unchanged by O-030 (not applicable). History API and lazy chunk fetch: success proven; a failed chunk fetch rejects into `fail` (unit-proven at the navigation level).

## Workflow And Side-Effect Lock (one switch)

| Order | Operation | Side effect | Failure | Final state |
|---|---|---|---|---|
| 1 | `history.pushState(address)` | address changes | n/a | new address |
| 2 | `showBootLoader` | cover shown | n/a | cover (except I-074 window) |
| 3 | `buildDefinition` (lazy imports, orbits, panels) | network fetches | reject: `failBootLoader`, error rethrown; old App stays under a failed cover with the new address | visible failure, no silent state |
| 4 | `isCurrent()` check | none | overtaken: nothing mounted | newest wins |
| 5 | `root.render(<App key>)` | old App unmounts (canvas disposed, shared textures disposed), new mounts | n/a | one canvas |
| 6 | new scene's first frame: `hideBootLoader` | cover fades, removed after timer | see I-074 | scene visible |

## Adversarial Pass

- Bypass of the generic rule: only `switcherOf` passes `open`; Apollo has no switcher; public planets page offers Jupiter alone (no control). No experience names in `SwitchControl`, `addressNavigation`, `bootLoader` (ARCH-01).
- Stray pushes: only the switch pushes; share uses `replaceState` on the current address, so an old App cannot overwrite the new address mid-rebuild.
- Overlapping switches: newest-wins proven; the cover's own timing is not (I-074).
- Leak repair judged on code and evidence: dispose fires Three's dispose event so each renderer drops its table entry; texture and sprite geometry re-upload on next draw (needs only intact `image`/attributes). T-153's numbers come from forced-gc reads on a production preview with locator waits; the level-off after switch 1 matches the bounded caches listed. Accepted as SC5's one reading.
- StrictMode (dev only): the cleanup of `useReleaseSharedTextures` runs once at mount in development, so halos made before it keep a disposed glow picture that later releases do not reach. Production (where memory was measured) is unaffected; observation only.

## Gates (fresh, this session)

| Gate | Result | Time (UTC) |
|---|---|---|
| `npm run lint` | pass | 03:13:49-03:13:52 |
| `npm run typecheck` | pass | 03:13:52-03:13:56 |
| `flock /tmp/astraeus-build.lock npm run build` | pass | 03:13:56-03:13:57 |
| `npm run test:full` | pass, 114 files, 1522 passed, 1 skipped (junit 1523 tests, 0 failures); coverage statements 71.89%, lines 74.78% | 03:13:57-03:14:57 |
| Public build (`ASTRAEUS_PUBLIC_BUILD=1`, scratch outDir, under the lock) + `node tools/validate/load-budget.mjs <dist>` | pass, all 7 page sets ok | 03:15:15-03:15:17 |
| `savepoint health check O-030` | snapshot created; "Code Health does not block clearance"; all five optional instances report no finding | 03:15:25-03:15:31 |
| `npm run check:browser` (once) | pass, 6 steps exit 0, 0 error lines, total 71 s; evidence `docs/evidence/browser-20261023T031537Z/` (meteor-shower: switched geminids, geminidDots 51115, afterTap 73) | 03:15:36-03:16:47 |
| `git diff --check a6548cd4 8b84bd93` | one trailing space in the T-152 record (record text only) | 03:12 |

Checker probe (scratch happy-dom test, created and deleted in `tests/`, not committed): hide, 200 ms, show, 2000 ms: `#boot` removed (expected `loading`); switch after the fade: cover rebuilt then hidden (passes).

## File Reality

Every file named in T-152, T-153 and T-154 evidence exists. Scratch memory scripts and port 5601/5602 previews are recorded as scratch in T-153.

## Code Health

Snapshot `sha256:92a7166d…ad9c9`, after the full gate: does not block clearance; supporting evidence only.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-074 cover lost on a switch during the fade | Low-Medium (a switch or Back within ~0.7 s of a scene appearing; up to 3.1 s with the longest fade setting) | Low (a brief flash of the old scene and an undrawn canvas; no data or state harm) | Low | Fix now: a few lines in `bootLoader.ts` (cancel or ignore the pending removal when the cover is shown again) plus a fast test; short recheck. Or owner accepts it as an Issue resolution |

## Owner Validation Still Needed

- T-154 `owner_validation.required: true`: the owner's look ("all fine, run the check") is recorded in prose; the structured acceptance (`accepted_check`) is the owner's to record against a Check.
- Decide on I-074: repair and short recheck, or accept.

## Observations (non-blocking)

- T-152 record line 80 has a trailing space (`git diff --check`).
- The load-budget self-tests were not extended for the `storyPanels` option (T-152 stated this); the real public build exercises it.
- Back/forward in a real browser is proven by the owner's look and the unit logic, not by the browser command (not required by SC5).
- Dev-only StrictMode effect order, above.
- Public build still ships a `no-panels` story chunk (lazy, never fetched by a page); pre-existing.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — `showBootLoader` has no fast test (its fade-window branch is I-074); `load-budget.mjs` `addStoryPanels` has no self-test.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs** — 24 files, +348/-38 for two features and a leak repair.
