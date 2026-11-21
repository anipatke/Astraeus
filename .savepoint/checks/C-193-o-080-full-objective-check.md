---
id: C-193
scope: {kind: objective, id: O-080}
result: NEEDS WORK
checked_by: {role: checker, session: check-o080-20261121}
executed_session: orchestrate-o080-20261121
checked_at: '2026-11-21T06:48:00Z'
health_snapshot: sha256:8f47cd39386fedd3a36e03057406200577e1a7c523cf16f490ff1cd4082495dd
reviewed:
  base_commit: 01c8426f
  head_commit: c182f38e
  files: [packages/astraeus/src/api/planParts.ts, packages/astraeus/src/api/viewerParts.ts, packages/astraeus/src/api/viewerHandle.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/errors.ts, packages/astraeus/src/app/useShelf.ts, packages/astraeus/src/app/shelfContract.ts, packages/astraeus/src/shelf/, packages/astraeus/src/shell/useShelfPanels.tsx, packages/astraeus/src/shell/StoryButton.tsx, packages/astraeus/src/shell/bar/barEntries.tsx, packages/astraeus/src/shell/panels/panelRule.ts, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/tests/domSetup.ts, packages/astraeus/tests/sceneInputCopies.test.ts, packages/astraeus/tests/apiImports.test.ts, tools/build-packages.mjs, tools/check-packs.mjs, tools/check-shelf-split.mjs, packages/astraeus-site/data/shelf-catalogue.json, packages/astraeus-site/src/catalogue/, packages/astraeus-site/tools/site/api-reference.mjs, packages/astraeus-site/tools/validate/journey-catalogue.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tests/apiReference.test.ts, packages/astraeus-site/tests/packagePacks.test.ts, packages/astraeus-site/tests/publicBuild.test.ts, .savepoint/Design.md, docs/architecture/viewer-interface.md, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
  dependencies: []
issues: [I-188, I-189, I-190]
supersedes: null
---

# C-193: O-080 Full Objective Check

Fresh session; I did not plan or build O-080. Lean check at the owner's request ("Lean final check"): each gate once, one browser run. Diff `main...HEAD` (`01c8426f..c182f38e`, 94 files). T-333..T-336 all `done` with owner step-check waivers.

**Result: NEEDS WORK.** The shelf contract, bar/panel integration, comment stripping, API page split, sizes and Design reconciliation hold, and every non-browser gate passes. The one browser run fails on the new catalogue journey (I-188, a wrong assertion, so the catalogue page has no browser proof yet); the T-336 race fix leaves a reproducible host-heard case (I-189); the `bad-part` doc is stale (I-190).

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (browser runner, pack/consumer tools)
- [x] Workflow And Side-Effect Check Lock (two-pass tsc build; catalogue Run/stop)
- [x] Matrix Completion Lock (catalogue browser cells unverified, I-188)
- [x] Parallel Planning Advice (advisory; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. O-080 Success Conditions (One shelf contract, First set, Bar and panels, Shared look, Pick by import, Catalogue, Proof and docs, Sizes, Owner look); guardrails ARCH-01..03, API-01..05, API-07, TEST-01, TEST-03; gates in `docs/agents/build.md`.
2. Entry points: `scene.addParts`, `handle.part` (mount handle and `AstraeusScene` ref), the six factories and their controls; `components.html`, `api/shelf.html`; `build:packages`/`check:pack`, `check:shelf-split`.
3. Relied-on orchestration: `useShelf` host/report silencing, panel rule `left` occupant, bar fit rule story items, view rule `panels`.
4. Axes: embedding path x2, viewers x2, part kinds x6, input shape (valid, wrong shape, lookalike, foreign part), lifecycle (before ready, live, unmount, rebuild), host vs visitor cause, view switch, layout (wide/phone), packed vs source.
5. Admission: supported host path, inside O-080's diff, credible consequence.

## Coverage Matrix

| Cell | Evidence | Result |
|---|---|---|
| addParts append/atomic, duplicate-id across parts/blocks/story panels, bad-part on non-factory value | `shelfParts.test.ts`, `shelfContentParts.test.ts` (in full gate); code `planParts.ts` | pass |
| handle.part both paths, bad-part foreign part/lookalike/bad setter arg, not-mounted outside lifecycle | `lifecycle.test.ts` `describe.each([mountDriver, reactDriver])` shelf cases | pass |
| two viewers, separate elements and cells | `twoViewers.test.ts` API-03 shelf cases (every path pairing) | pass |
| setters silent, on* visitors only | lifecycle cases pass; checker probe: undo between draw and report is heard | **I-189** |
| story button in bar rule, phone "This story" menu, left occupant, Escape/Close, view scoping and close on switch | `shelfBar.test.ts`, `panelRule.ts` `isShelf`/`viewSwitched`, `BarMenu.tsx` "This story" section; browser not exercised (no demo uses parts) | pass (fast suite) |
| shared look, drift scan over `src/shelf` | `lookDrift.test.ts`, `interfaceLeftovers.test.ts` | pass |
| pick by import (JS) | `check:shelf-split` ok (filterChips only; no other marker) | pass |
| comment stripping: licence/load-bearing comments | engine/data `src` has no `@license`, `/*!`, `@vite-ignore`, `__PURE__`, `webpackIgnore`; licences ship as `LICENSE`/`NOTICE`/`licenses/` files; `/*!`,`@license`,`@preserve` allowed by `KEPT_COMMENT` | pass |
| comment stripping: runtime unaffected | `check:node-consumer` pass, `measure:example` 521,275 B gzip (unchanged), packed examples hello-scene/react/planets/sky pass in the browser run; `scene.d.ts` keeps doc comments (pack rule) | pass |
| pack rule self-proof | `packagePacks.test.ts` planted comment / banner / `//` in string cases | pass |
| API page split | main 43,388 B gzip (cap 46,000), shelf 5,022 B (cap 8,000); `apiReference.test.ts` new case; every name still linked from main page | pass |
| catalogue completeness | `shelfCatalogue.test.ts` (36) | pass |
| catalogue plain text vs behaviour | entries checked against factories: explainer heading/paragraphs/notes, colourKey count, actions camera, filterChips purpose says the story decides | pass (observation below) |
| catalogue page in a browser at 1280x720 and 375x667 | journey fails at its first content assertion | **unverified, I-188** |
| bad-part docs | `errors.ts:73`, README row name only panel/customBlock | **I-190** |
| existing tests' setups unchanged | `lifecycle.test.ts` diff has no removed lines; other existing files gain list entries/optional helper fields only (domSetup, apiImports ALLOWED, sceneInputCopies row, publicBuild ids, two imports) | pass |
| Design reconciliation | T-336 accounting table covers every T-333/T-334/T-335 drift note; Design "Viewer interface" Shelf bullet, codebase map, site and size sections, note sections 7/9/11 match the code read here | pass |
| sizes | engine 9.26 MB unpacked (limit 9.5), 7.23 MB packed; load budget every page ok | pass |

## Gates (this session, after the last commit)

- `npm run lint` 0 (4.8 s); `npm run typecheck` 0 (6.8 s); `npm run build` 0 (3.3 s).
- `npm run test:full` 0: 288 files, 4532 passed, 2 skipped (82.6 s); `git diff --check main...HEAD` clean.
- `check:engine-alone` pass (30.6 s); `check:pack` pass (20.4 s); `check:node-consumer` pass; `measure:example` 1,821,479 / 521,275 B; `check:shelf-split` ok.
- Public build (`ASTRAEUS_PUBLIC_BUILD=1 ASTRAEUS_ENGINE_SHARE=1`) + `load-budget.mjs dist`: every page ok (components own 364,419 / 390,000 gzip); `public-build-assets.mjs dist` 0.
- `npm run check:browser` once: **FAILED** — `catalogue` exit 1 (I-188); all other steps exit 0, no console errors. Time warnings: look-out 109 s (limit 75), hello-sky 24 s (15), total 397 s (320); a background test run and the owner's :5490 server shared the machine. Evidence `docs/evidence/browser-20261121T064004Z`.
- `savepoint health check O-080`: snapshot above, "does not block clearance"; all instances optional, no finding.

## Probes

- Race (I-189): deterministic scratch test on the mount path, 3/3 heard two events. The fix does cover the T-336 two-calls-before-draw case (lifecycle passes). Not run on the React path.
- Two-pass build: JS pass `removeComments`, declarations pass `emitDeclarationOnly`; no `.js` written by the second pass, so no comment can return through it.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-188 browser journey fails | High (every run) | Medium: release gate red; catalogue page unproven in a browser | Medium | Fix now (one assertion), prove in the next single browser run |
| I-189 host undo heard as visitor | Low (needs a host call between draw and report) | Medium: host hears two false visitor events | Low-Medium | Fix now with a deterministic case, or defer by owner choice |
| I-190 bad-part doc stale | High (always read) | Low | Low | Combine with the I-189 repair |

## Owner Validation

T-336 declares `owner_validation.required`. The owner's recorded words ("better", on the catalogue preview) are an owner look, not an acceptance against a Check, and this Check is NEEDS WORK, so no `owner_validation` is recorded. Missing: a CLEAR Objective Check and the owner's own acceptance naming it.

## Observations (non-blocking)

- `handle.part` matches by id and kind, so a different `panel({ id: "gaps" })` never added to the scene still returns the scene's "gaps" control; harmless today.
- Catalogue filterChips "uses" text "light up while the rest dims" describes what a story can wire, not what the part does; the purpose line says so.
- `api/*.html` are not opened by `browser-smoke.mjs` (static pages; T-336 noted it).
- Gate time warnings above; machine was loaded.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — `useShelf.ts` undo-before-report branch untested (I-189).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
