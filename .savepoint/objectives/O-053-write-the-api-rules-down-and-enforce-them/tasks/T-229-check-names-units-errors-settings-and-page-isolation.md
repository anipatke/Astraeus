---
id: T-229
title: Check names, units, errors, settings and page isolation
objective: O-053
status: planned
depends_on: [{task: T-228, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: api-review-20261101}
---

# Check names, units, errors, settings and page isolation

## Outcome

The API rules on shape, errors, settings and isolation have checks in the normal test run, each with a shrinking allowlist of today's breaks (Guardrails API-03, API-04, API-05, API-06; O-053 "Public-type lint", "Errors", "Settings mapping", "Viewer isolation scans").

## User Check

Not owner-facing; the owner sees the result at the end of the Objective.

## Done When

- **Public-type lint (API-04)** over the built public declarations: a numeric field carries a unit suffix (Km, KmS, Deg, Px, Ms, Seconds, EarthRadii, …) unless on the unitless allowlist; `centre` is banned; time-like fields are typed `TimeInput`; spans use `{ start, end }`; frame fields are named `plane`; no `unknown` or `any` reachable from the root. Today's breaks (review principle 5/6 list: `MoonPositions.centre`, pacing `from`/`to`, bare-second `within`/`ramp`, Earth-radii fields, panel `at.utc`, `frame` in the elements record, `StoryPanelsInput.panels: unknown[]`, and any others the lint finds) on an allowlist, each naming its finding and Objective.
- **Errors (API-05):** a scan fails on a `throw` in `packages/astraeus/src/api/` that does not throw a `SceneError` (allowlist: `api/data.ts` RangeError, O-054) and on code recognising an error by its message text (allowlist: `scene.ts` `message.startsWith`, O-056). The README gains an error table generated from `SceneErrorCode` (code and one-line meaning from the code's doc comment) and a test keeps it in sync.
- **Settings mapping (API-06):** a test lists every setting read through `packages/astraeus/src/app/address.ts` and fails when one has no public setting key; today's address-only settings allowlisted for O-056.
- **Isolation scans (API-03):** an id-literal scan over `src/shell/` and `src/app/` and a CSS selector scan over `src/app/style.css` (every selector under the viewer's root class; no `:root`, `html`, `body`, `#app`); today's cases allowlisted for O-055.
- Each check shown failing on a planted break and passing on the tree; allowlists are data next to their checks, one entry per break with reason, finding and Objective; a test fails if an allowlist entry no longer matches a real break (so fixed entries must be removed).

## Context Files

`.savepoint/Guardrails.md` under `Public API`, `docs/architecture/api-review-2026-11-01.md`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/api/errors.ts`, `packages/astraeus/src/api/data.ts`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/app/address.ts`, `packages/astraeus/src/app/style.css`, `packages/astraeus/tests/addressRule.test.ts`, `packages/astraeus/README.md`.

## Design References

`.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)`.

## Guardrails

API-03, API-04, API-05, API-06, TEST-01, TEST-02, TEST-03, STYLE-07; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Type lint over built declarations (reuse the T-228 surface collection where it fits).
3. Throw and message-match scan; generated README error table and sync test.
4. Settings mapping test (reuse the `addressRule.test.ts` scan approach).
5. Id and CSS scans; stale-allowlist test; planted-break proofs.

## Boundaries

No behaviour change; do not fix allowlisted breaks.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`), plus `check:pack` where the check needs packed output. No browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: per check, the planted break that made it fail and the clean pass; allowlist entries with reasons; files read/changed; gates.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
