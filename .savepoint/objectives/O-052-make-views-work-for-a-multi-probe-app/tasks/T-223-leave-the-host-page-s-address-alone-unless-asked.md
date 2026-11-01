---
id: T-223
title: Leave the host page's address alone unless asked
objective: O-052
status: done
depends_on: [{task: T-222, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-223, reason: 'Owner said "orchestrate 052" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o052-run-20261101}, recorded_at: '2026-11-01T03:55:01Z'}
planned_by: {role: planner, session: voyagers-feedback-20261101}
---

# Leave the host page's address alone unless asked

## Outcome

An embedded viewer reads and writes the page address only when the host turns it on; every address parameter is documented; with it on, a copied link also carries the showing view (O-052 "Address handling").

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- `App` takes an address option alongside `writeTitle`. Off: no address parameter is read (`view`, `t`, `scale`, `up`, `stars`, `milkyway`, `milkywaybrightness`, `labels`, `loadfade`, sky off, and any other the audit finds), `history.replaceState` is never called, and the copy-link button is hidden. On: today's behaviour.
- `MountOptions.address?: boolean` and `AstraeusScene` prop `address`, default `false`; the site (`astraeus-site/src/main.tsx`) passes it on, so localhost:5490 and the public site behave as before.
- With it on in a scene with views, the link writes `show=<view id>` and opening reads it back; an unknown id falls back to the scene's `start` with no error.
- Tests: a mounted viewer on a page whose address carries `?view=…&t=…` ignores them and leaves the address unchanged; with `address: true` both are read; `show=` round trip and unknown id.
- README section listing every parameter the viewer reads or writes (name, meaning, format, read/write), the `address` option, and the 0.7.0 behaviour change; CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/viewLink.ts`, `packages/astraeus/src/app/viewUp.ts`, `packages/astraeus/src/shell/bootLoader.ts`, `packages/astraeus/src/shell/SwitchControl.tsx`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`, `packages/astraeus-site/src/main.tsx`, `packages/astraeus/README.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-06, TEST-01, TEST-03, TEST-04, CODE-01; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Audit every `window.location` / `URLSearchParams` / `history` use under `packages/astraeus/src` and list them in the evidence.
3. Route all of them through one address source that `App` builds from the option (strategic fix: one place, so a new parameter cannot bypass the switch); add a test that fails if source code outside it reads the address.
4. Wire `mount`/`AstraeusScene`/site; add `show=`; tests, README, CHANGELOG.

## Boundaries

No parameter prefix (owner chose off by default); the demos' own scene switcher (`definition.switcher`) keeps its address navigation on the site.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Stage: build, test, audit reached; no Task Check run (not requested; not waived, no `check_waiver` recorded). Owner marks done.

### Address audit (every `window.location` / `URLSearchParams` / `history` use under `packages/astraeus/src`)

Parameter readers (pure functions of search text; all now fed from `addressSearch(address)` in `src/app/address.ts`): `App.tsx` (`milkyway`, `stars`, `milkywaybrightness`, `sky`, `labels`, `loop`, plus calls below), `SkyView.ts`, `viewLink.ts` (`view`, `t`, `scale`, new `show`), `viewUp.ts` (`up`), `bodyDraw.ts` (`markerpx`, `sunglow`, `sunbrightness`, `sunglowscale`; found beyond the coordinator's list), `FeatureMarkers.ts` (`featurepx`; found), `bootLoader.ts` (`loadfade`, now takes the search text, no default location read; `sceneFrame.ts` hands it `controls.loadFadeSeconds` so the cover fade follows the same rule). Direct location/history users, before: `App.tsx` (7 reads), `viewLink.ts` `shareViewLink` (read + `replaceState`, moved to `address.ts`), `bootLoader.ts`. Left as page navigation, not parameter reading, and allowlisted in `tests/addressRule.test.ts`: `shell/SwitchControl.tsx` (demo switcher; `Boundaries` keeps it) and `app/DeveloperSettings.tsx` (developer "Data" alternates sets a param and `location.assign`s; only shown when a demo supplies `alternates`). Site `main.tsx` reads `experience`/`planet`/`shower` itself (outside the package, unchanged).

### Done When -> test

| Done When claim | Test |
|---|---|
| `App` takes an `address` option alongside `writeTitle` | `addressDom.test.ts` (all App cases pass `address`); typecheck |
| Off: no address parameter read (`view`, `t`, `scale`, `up`, `stars`, `milkyway`, `milkywaybrightness`, `labels`, `loadfade`, sky off, others the audit found: `loop`, `markerpx`, `featurepx`, `show`) | `addressDom.test.ts` "by default ignores every parameter" (startView, up, loop, loadFadeSeconds, markerpx, featurepx, labels, show asserted unchanged; `scale`, `t` and `stars`/`milkyway`/`sky` ride the same one `search` value, shown by the on-case difference for `t` and by `addressRule.test.ts` for the one-door guarantee; no per-parameter assertion for `scale`, `stars`, `milkyway`, `sky`, `sunglow*`: not separately tested off, covered structurally) |
| Off: `history.replaceState` is never called | `addressDom.test.ts` spies `replaceState`, not called; `addressRule.test.ts` (only `address.ts` may call it) |
| Off: copy-link button hidden | `addressDom.test.ts` (developer panel has no "Copy view link"); on-case shows it present |
| On: today's behaviour | `addressDom.test.ts` "with address on reads them"; `appScreenDom.test.ts`, `domMenuAndLink.test.ts`, existing suites now run with `address: true` and pass unchanged |
| `MountOptions.address?: boolean`, default false | `addressDom.test.ts` "mount: off by default, on when asked" |
| `AstraeusScene` prop `address`, default false | `addressDom.test.ts` "AstraeusScene: off by default, on when asked" |
| Site passes it on | `packages/astraeus-site/src/main.tsx` `<App address ...>`; no test (site entry has no DOM test; browser step is the last Task's); typecheck and build pass |
| On with views: link writes `show=<view id>` and opening reads it back | `addressDom.test.ts` "writes show=<view id> ... reads the view back" (press View B, copy, reopen at the written address, B pressed and its paths showing); `viewLinkSearch` unit case for show present/absent |
| Unknown id falls back to `start` with no error | `addressDom.test.ts` "falls back to the scene's start for an unknown show id" (no console.error) |
| Test: mounted viewer on a page with `?view=..&t=..` ignores them and leaves the address unchanged | `addressDom.test.ts` (App-level and `mount`-level off case: `off.view` is `a`, `startView` undefined; address string equal before/after) |
| Test: with `address: true` both are read | `addressDom.test.ts` "with address on reads them" (view) and "time in the address opens the clock there" (t, clock readout shows 00:20 on, not off) |
| Test: `show=` round trip and unknown id | as above |
| README lists every parameter (name, meaning, format, read/write), `address` option, 0.7.0 behaviour change | `packages/astraeus/README.md` new "Page address" section; documentation, reviewed by reading, no test |
| CHANGELOG `Unreleased` line | `packages/astraeus/CHANGELOG.md`; documentation |
| Plan step 3: a test fails if source outside the address source reads the address | `addressRule.test.ts` (scan plus a sample that must trip the pattern) |

### Gates (run at hand-off)

`npm run lint` clean (after extracting `ViewLinkGroup` to keep `App` within complexity 20); `npm run typecheck` clean; `npm run build` ok; `npm test` 175 files, 2152 passed, 1 skipped (run without the junit flags of the configured command; same tests). No browser run.

### Files

Read (all Context Files, plus): `tests/domSetup.ts`, `tests/viewsDom.test.ts`, `tests/appScreenDom.test.ts`, `tests/domMenuAndLink.test.ts`, `tests/bootLoader.test.ts`, `tests/hostPageDom.test.ts` (pattern and existing-test impact); extra source reads for the audit, grep-found: `src/app/SkyView.ts`, `bodyDraw.ts`, `FeatureMarkers.ts`, `sceneFrame.ts` (around the `hideBootLoader` call), `DeveloperSettings.tsx` (near line 211), `AstraeusScene.tsx` (app, `SceneControls`). Changed: `src/app/address.ts` (new), `src/app/App.tsx`, `src/app/viewLink.ts`, `src/app/AstraeusScene.tsx` (`loadFadeSeconds` control), `src/app/sceneFrame.ts`, `src/shell/bootLoader.ts`, `src/api/mount.ts`, `src/api/AstraeusScene.tsx`, `packages/astraeus-site/src/main.tsx`, `README.md`, `CHANGELOG.md`, tests `addressDom.test.ts` and `addressRule.test.ts` (new), `appScreenDom.test.ts` (passes `address: true`), `domMenuAndLink.test.ts` (import path of `shareViewLink`).

### Limitations

Off-case assertions cover `view`, `up`, `loop`, `loadfade`, `markerpx`, `featurepx`, `labels`, `show`; `t`, `scale`, `stars`, `milkyway`, `milkywaybrightness`, `sky`, `sunglow*` rely on the single `search` value plus the one-door scan, not individual off assertions. `hideBootLoader`'s signature gained a second argument and `bootFadeSeconds` lost its location default. The developer data switch and demo switcher still read the live address (navigation). No browser check.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- New `src/app/address.ts`: the one door to the page address (`addressSearch(enabled)`, `shareViewLink`); every parameter reader receives its search text from it. `App` takes `address`; `mount` and `AstraeusScene` expose it (default false). Interfaces and Data Flow should name it. Not yet reflected in Design.md; the last step reconciles.
- `SceneControls.loadFadeSeconds` carries the loading-cover fade to `sceneFrame`; `bootFadeSeconds(search)` no longer reads the location.
- `show=` joins the view-link parameters.
