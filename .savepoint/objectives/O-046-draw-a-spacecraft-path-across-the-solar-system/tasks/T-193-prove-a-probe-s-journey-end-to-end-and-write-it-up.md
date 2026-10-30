---
id: T-193
title: Prove a probe's journey end to end and write it up
objective: O-046
status: done
depends_on: [{task: T-192, requires: clear}]
owner_validation: {required: true}
check_waiver:
  task: T-193
  reason: 'Owner said "orchestrate O-46"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.'
  actor: {role: owner, session: o046-run-20261030}
  recorded_at: '2026-10-30T21:02:30Z'
planned_by: {role: planner, session: o046-planning-20261030}
---

# Prove a probe's journey end to end and write it up

## Outcome

A Sun-centred scene with a made-up probe path, enlarged planets and the "Solar system" opening scale is shown working in the packed package, in the browser check and on the local preview for the owner's one look; docs and Design match the code.

## User Check

On `localhost:5490`, open the made-up probe scene: the probe's line stays still against the Sun while time plays, the probe reaches its target planet at the flyby moment, the planets are enlarged, the probe's name shows next to it, and the labels switch hides it. Phone and desktop layouts have no overlaps (375x667, 1280x720).

## Done When

- `npm run check:node-consumer` builds a Sun-centred scene with a path (`lineFixedTo`, `plane: "ecliptic-j2000"`, `solarSystemScale`) from the packed package and checks `stateOf`.
- `npm run check:browser` gains one case (in an existing script where it fits, per `docs/BROWSER_CHECKS.md`): a Sun-centred path draws, its line does not move between two times, and its label is visible; run once, total still about a minute.
- The example: `examples/hello-scene` or a README example shows a Sun-centred path (made-up probe, no mission data), whichever keeps the example smallest; say which.
- API reference page lists the new options; README and CHANGELOG `Unreleased` complete for the whole Objective.
- Design reconciled: `.savepoint/Design.md` and `docs/architecture/` describe paths in Sun-centred scenes, the line rule, the path frame and the scale; each earlier step's drift note is accounted for as reflected or non-architectural with a reason.
- Owner look recorded (owner_validation), then hand off for the Full Objective Check.

## Context Files

`tools/check-node-consumer.mjs`, `docs/BROWSER_CHECKS.md`, `packages/astraeus-site/tools/validate/harness.mjs`, `examples/hello-scene/src/main.js`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `.savepoint/Design.md`, `docs/agents/browser-policy.md`, each earlier O-046 step's Drift Notes.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` and `Current Technical State`; `docs/architecture/state-and-assets.md`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Node consumer case, then the browser case (follow the browser policy; one browser job at a time).
3. Example and docs.
4. Design reconciliation.
5. Prepare the preview on `localhost:5490` and ask the owner for the look.

## Boundaries

No probe data from any real mission. No new browser scripts beyond the one case. No screenshots.

## Technical Verification

Configured gates, `npm run check:node-consumer`, one `npm run check:browser`; Full Objective Check afterwards under `agent-skills/references/check-method.md`.

## Technical Evidence

Per criterion:
- Node consumer: `tools/check-node-consumer.mjs` gains a test building a Sun-centred scene with `addTrajectory` (`lineFixedTo: "sun"`, `plane: "ecliptic-j2000"`), `setScale(solarSystemScale)`, `solarSystemScale` imported from the packed package, and `stateOf` (centre sun, z non-zero after rotation). `npm run check:node-consumer`: 3 tests passed, "node consumer: pass" (run after the last source edit).
- Browser case: `browser-smoke.mjs` gains one view, `?experience=synthetic-probe` (dev server only), checked by `sunPathChecks` through driver readouts only: path drawn in view (`scenePath`), its line box identical at 20 percent and 80 percent of the timeline (paused, tolerance 0.002), label shown (`shownSceneLabelIds` has "probe"). Needed a readout, so tracked paths now report to `data-paths` (`TrackedBodyView.screenReadout`, `publishPathData` takes the structural type). One `npm run check:browser`: all 8 steps exit 0, 0 error lines, total 122 s (the smoke step is 51 s; the run was about a minute before the public builds were counted), run folder `docs/evidence/browser-20261030T211150Z`. Before it, the smoke script alone was run against a dev server on port 5601 three times while building the case (first two failures: Mars series not loaded at import, and no tracked-path readout); that server is stopped. `public-build-assets.mjs` SYNTHETIC_KEYS gained "synthetic-probe" (public build leaves it out; step passed).
- Example: README section "A probe across the solar system" (the smallest place; `examples/hello-scene` untouched). A unit test mirrors it. Dev-site fixture `packages/astraeus/src/synthetic/syntheticProbeDefinition.ts`, built only through the public Scene API, wired in `packages/astraeus-site/src/main.tsx`.
- API reference: the README tables already list `plane`, `lineFixedTo`, `labelReach`, `solarSystemScale` (earlier steps); README adds the provider-orientation limit; CHANGELOG Unreleased complete with the example line.
- Design: `.savepoint/Design.md` (new paragraph "Paths across the solar system"; the "Sun-centred tracked trajectories are rejected" sentence removed), `docs/architecture/state-and-assets.md` (new "Tracked paths in Sun-centred scenes" paragraph and the solarSystemScale note), `docs/architecture/reconciliation-history.md` (O-046 entry; marks the T-174 clause superseded), `docs/BROWSER_CHECKS.md`.
- Drift notes accounted: T-189 (TrackedBody.lineFixedTo, relativeTrailKm `against`) reflected in Design.md and state-and-assets.md; T-190 (EQJ default, ecliptic rotation at entry) reflected; T-191 (solarSystemScale export) reflected; T-192 (shared label reach, labelReach, Apollo 4) reflected; T-193 additions (data-paths for tracked paths, probe fixture) reflected.
- T-190 leftover: provider paths' `orientation` passes through unrotated with `plane: "ecliptic-j2000"`. Decision: documented as a known limit, not rotated (tracked paths carry no orientation and nothing reads it); stated in README, Design.md, state-and-assets.md, CHANGELOG, reconciliation history.
- Owner look: pending (owner_validation required). Preview path: `/app.html?experience=synthetic-probe` on localhost:5490 (the probe starts inside Earth's orbit, meets Earth on day 200; Venus, Earth and Mars enlarged; opens on the Solar system scale). Not recorded as accepted.

Gates after last edit: `npm run lint` clean; `npm run typecheck` clean; `npm run build` ok (chunk warning only); `npm test`: 146 files passed, 1907 passed, 1 skipped; `npm run check:node-consumer` pass. Source edits after the gates: none besides docs/BROWSER_CHECKS.md and this Task.

Files changed: packages/astraeus/src/app/TrackedBodyView.ts, sceneDebug.ts, sceneFrame.ts; src/synthetic/syntheticProbeDefinition.ts (new); tests/publicApiSunPaths.test.ts; README.md; CHANGELOG.md; packages/astraeus-site/src/main.tsx; tools/validate/browser-smoke.mjs, public-build-assets.mjs; tools/check-node-consumer.mjs; docs/BROWSER_CHECKS.md; Design and architecture docs above. Extra reads: scene.ts, PathView.ts, sceneDebug.ts, sceneFrame.ts, driver.mjs (to find the readouts and the missing tracked-path readout).
Unverified: looks, phone/desktop overlaps (owner); labels-switch hiding the probe's label in the browser (unit test only); Full Objective Check pending.


Owner-look follow-up (2026-10-30):
- Finding: the owner saw the probe miss Earth "by quite a bit". Cause (coordinator diagnosis, confirmed by the new test): the synthetic probe and the README example gave Sun-measured samples without `center`, and `addTrajectory` defaulted `center` to "earth", so the samples were read about Earth. With `center: "sun"` the probe passes 28 km from Earth at the flyby. The coordinator added `center: "sun"` and orbit lines (Venus, Earth, Mars `orbit: true`) to `syntheticProbeDefinition.ts`; kept.
- Owner decision (AskUserQuestion, 2026-10-30), "Default to the scene's middle (Recommended)": `addTrajectory`'s `center` defaults to the scene's centre (its first body) instead of always "earth".
- Change (`packages/astraeus/src/api/scene.ts`): `addTrajectory` builds through `#buildTracked(input, input.center ?? #sceneCentre())`; a path added without `center` is remembered in `#defaulted`, and `#register` rebuilds those when the first body arrives, so a path added before any body also follows the first body. A first body that is not built-in, or no body, leaves Earth. Earth-first scenes are unchanged (comparison tests pass unedited). Docs: README row and example text, doc comment, CHANGELOG (behaviour change called out), Design.md, state-and-assets.md.
- Tests (publicApiSunPaths.test.ts, 3 new): Sun-first with no `center` meets Mars at the flyby (gap under 1e-6; this fails with the old "earth" default, so it would have caught the miss, TEST-02) and `stateOf(...).center` is "sun"; path added before bodies follows the first body; Earth-first and no-body scenes still read Earth, explicit `center` wins.
- Gates after the last edit: lint ok, typecheck ok, build ok, `npm test` 146 files, 1910 passed, 1 skipped; `npm run check:node-consumer` pass. Browser scripts unchanged since run `docs/evidence/browser-20261030T211150Z` (no rerun; the final check reuses it).

**Owner validation (2026-10-30, session o046-run-20261030):** after the centre-default fix and orbit lines, the owner looked at `localhost:5490/app.html?experience=synthetic-probe` and said "OK". Recorded by the coordinator from the owner's words; the Full Objective Check C-### still to come gives the accepted Check reference.

## Drift Notes

Reconciliation step for O-046.
