---
id: T-223
title: Leave the host page's address alone unless asked
objective: O-052
status: planned
depends_on: [{task: T-222, requires: clear}]
owner_validation: {required: false}
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

Pending execution: named cases, results, files read/changed, gates, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
