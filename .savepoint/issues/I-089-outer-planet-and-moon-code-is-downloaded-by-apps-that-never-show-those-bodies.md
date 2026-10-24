---
id: I-089
title: Outer-planet and moon code is downloaded by apps that never show those bodies
type: other
status: in_progress
source:
  kind: report
  actor: {role: owner, session: improvements-intake-20261024}
  at: '2026-10-24T02:47:47Z'
severity: low
history:
  - at: '2026-10-24T02:47:47Z'
    actor: {role: planner, session: improvements-intake-20261024}
    kind: observed
    note: 'Owner, 2026-10-24: "can we add the fixes as issues, and iterate through and fix them with agents" (after "no more demos, here on in only improvements").'
  - at: '2026-10-24T05:00:00Z'
    actor: {role: executor, session: i089-repair}
    kind: observed
    note: 'Design note, stopped before code. The six modules cannot load on demand without a public API change. (1) core/bodies/outerPlanets (7.2 kB source), planetMoons (7.3), swiftTuttle (7.1) are imported statically by core/bodies/index.ts, which builds BUILT_IN_BODIES and BUILT_IN_BINDINGS as module constants; assets/catalogue.ts builds `catalogue` from them at import with PLANET_SYSTEM_ENTRIES (planetSystemMaps) and SWIFT_TUTTLE_ENTRY; api/data.ts reads the *_MOON_SYSTEM constants from planetMoons; moonSystem is imported by jupiterMoons, so it stays with Io to Callisto. (2) Scene.addBody("saturn"|"pluto"|"neptune"|"uranus"|swiftTuttle) is synchronous and looks the body up in that catalogue (api/scene.ts #catalogue, #register, unknown-body throw), and the planets need no data package, so there is no existing async step (prepare/installData only runs for data packages) in which to register them first. api/bodies.ts itself only holds light refs and imports nothing heavy. Lazy loading would therefore need either addBody/mount to await a catalogue load (async public call) or a catalogue that fills in later (unknown-body errors before it fills). (3) The one separable piece is shell/MoonFamilyPanel (2,966 chars) plus shell/moonFamilies: rendered only when experience.moonFamilies is set, so React.lazy inside AstraeusShell would change no export; saving about 0.2% of the first-open script, under 1% of the engine share. Options for the owner: A) leave as is (the whole set is 1.4% of the script). B) lazy MoonFamilyPanel only, about 3k chars, no API change, cheap. C) make the outer-planet and comet tables on-demand by letting mount() (already async at the data step) register them from the scene body list before the first frame, with Scene.addBody still sync by keeping lightweight id/label/requires refs; this changes the catalogue from a constant to an instance-owned value across scene.ts, catalogue.ts, catalogueItem and every reader of BUILT_IN_BODIES (about 12 call sites), saves about 17k chars (1.1%), and is a medium refactor with test churn, worth it only if the owner wants it. No code changed, no measurements run.'
  - at: '2026-10-24T06:00:00Z'
    actor: {role: executor, session: i089-repair}
    kind: repair_attempted
    note: 'Owner decision 2026-10-24: "Do the small part only" (option B of the design note; options A and C not pursued: the outer-planet, moon-system, comet and planet-map tables stay in the first-open script because making them on-demand needs a catalogue refactor worth about 1.1%, recorded as not worth it). Changed: shell/AstraeusShell.tsx loads MoonFamilyPanel with React.lazy behind Suspense (fallback null) and PanelLoadBoundary, which gained an optional `message` prop (default text unchanged, so the developer panels read as before); the `./shell/MoonFamilyPanel` package export is unchanged. Measured npm run measure:example, first-open: before 1,589,850 B raw / 454,211 B gzip, after 1,586,382 / 453,280 (-3,468 raw, -931 gzip); new on-demand chunk MoonFamilyPanel 3,859 / 1,479. Apollo 11 page on a public build (ASTRAEUS_PUBLIC_BUILD=1, scratch outDir, load-budget.mjs): 4,339,326 B raw / 2,811,428 B gzip, 12 files, against 4,370,000 / 2,900,000 (was 4,342,461 / 2,811,207, 11 files; gzip +221 B because the bundler now splits the shared licence module into a 6,046 B chunk, one more request). load-budget.mjs page sets now list licence.js (all app pages) and moonFamilies.js (planets pages, which import it statically); both tolerated when absent; limits unchanged. Tests: firstOpenGraph.test.ts asserts MoonFamilyPanel and moonFamilies are not reached from the entry and the shell uses a dynamic import; domMoonPanel.test.ts (planets demo) asserts the moon list appears after the lazy load with moonFamilies set and not without; existing moon panel and planets tests pass. Gates: lint, typecheck, build, npm test (1852 passed, 1 skipped; junit.xml), check:engine-alone, check:pack all pass. Not verified: no browser run (none requested), so the lazy panel timing on a real phone drawer and the failure message are checked only in happy-dom; failure message of the moon boundary has no dedicated test.'
---

# I-089: Outer-planet and moon code is downloaded by apps that never show those bodies

## Summary

T-178's breakdown (docs/evidence/o043-bundle-baseline.md): `outerPlanets`, `moonSystem`, `planetMoons`, `swiftTuttle`, `planetSystemMaps`, `MoonFamilyPanel` (about 20k characters, 1.4% of the first-open script) load on first open in `examples/hello-scene`, which shows only Earth, the Moon and a probe. Left out of O-043 by the owner's "Panels only" choice; offered again as an improvement on 2026-10-24 and accepted for an issue.

## Evidence

docs/evidence/o043-bundle-baseline.md candidate list; `packages/astraeus/src/api/bodies.ts` exports every named body.

## Proof Needed

A design note first (in this Issue's history): which modules can load on demand without changing a public export or making `addBody(io)` asynchronous for the caller. If that is not possible without an API change, stop and report the options for the owner. Otherwise: `npm run measure:example` before and after shows a drop, the first-open graph test (`firstOpenGraph.test.ts`) asserts the split modules are not reached, and every demo still draws its planets and moons (fast suite; one browser run at the end of the batch).