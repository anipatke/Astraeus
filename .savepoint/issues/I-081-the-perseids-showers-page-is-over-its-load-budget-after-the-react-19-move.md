---
id: I-081
title: The Perseids showers page is over its load budget after the React 19 move
type: defect
status: open
source:
  kind: check
  check: C-110
  actor: {role: checker, session: o040-full-check-20261023}
  at: '2026-10-23T11:32:30Z'
tasks: [T-163, T-164]
checks: [C-110]
severity: low
history:
  - at: '2026-10-23T11:32:30Z'
    actor: {role: checker, session: o040-full-check-20261023}
    kind: observed
    note: 'Found by the O-040 Full Objective Check (C-110) in its one npm run check:browser (docs/evidence/browser-20261023T112923Z/): the public-build-assets step exited 1. The T-165 builder had reported the same byte count. The same step passed on main in browser-20261023T084202Z (C-108).'
    check: C-110
  - at: '2026-10-23T12:10:00Z'
    actor: {role: executor, session: o040-repair-builder-20261023}
    kind: repair_attempted
    note: 'Repair: no behaviour-neutral trim found; the extra bytes are the React 19 / Fiber 9 chunks (T-163). Raw limit for app.html?experience=showers raised 10,070,000 -> 10,080,000 in packages/astraeus-site/tools/validate/load-budget.mjs with a comment (measured 10,073,636 B raw / 7,025,217 B gzip, 19 files; gzip limit 7,040,000 unchanged; other limits untouched). Coordinator provisional choice under the owner overnight run, pending the owner morning review. Proof: fresh ASTRAEUS_PUBLIC_BUILD=1 vite build into a scratch folder, then node packages/astraeus-site/tools/validate/public-build-assets.mjs on it: ok true, 94 files checked, showers page problems []. check:browser not run. Not closed: awaiting a Check.'
---

# I-081: The Perseids showers page is over its load budget after the React 19 move

## Summary

The public build's first-load page set `app.html?experience=showers` is 10,073,636 bytes raw against its limit of 10,070,000 (3,636 B, 0.04 % over; gzip 7,025,217 is under its 7,040,000). Because `public-build-assets` fails, `npm run check:browser` exits 1, so a gate the Full Objective Check requires is red. The step passed before O-040 (main, `docs/evidence/browser-20261023T084202Z/summary.txt`, C-108). In O-040 only the React 19 / Fiber 9 move (T-163) and the component (T-164, not loaded by the site) change what that page fetches, so the growth comes from the new React and Fiber builds. Every other page set and the whole-build limit pass, including the new `api/index.html` (24,544 B raw / 6,647 B gzip).

## Evidence

- `npm run check:browser`, 2026-10-23 11:29:23Z to 11:31:08Z, exit 1; steps smoke, smoke-public-showers, planets-phone, meteor-shower, hello-scene, hello-react, public-addresses exit 0; `public-build-assets` exit 1. Evidence `docs/evidence/browser-20261023T112923Z/`; step log `/tmp/astraeus-check-logs-jA6erF/public-build-assets.log` (copy kept in the checker's scratch): `"id": "app.html?experience=showers", "raw": 10073636, "rawLimit": 10070000, "problems": ["10073636 bytes raw is over the limit of 10070000"]`.
- Limit: `packages/astraeus-site/tools/validate/load-budget.mjs:63`. Its header rule (line 37): "A change that makes a page heavier must raise its limit here on purpose, in the same change, with the new measurement." T-163 made the page heavier without doing so.
- T-163's evidence does not run the public-build checks; T-165 found the failure and left the limit to the owner or coordinator.

Violated: the release gate `npm run check:browser` (AGENTS.md Build and Astraeus Project Rules) and the load-budget rule in `load-budget.mjs`.

## Proof Needed

A deliberate, measured disposition recorded in `load-budget.mjs` beside the limit: either the page brought back under 10,070,000 B raw, or the limit re-measured on the React 19 build and raised on purpose with the measurement and date, as the earlier T-098/T-120/T-152 entries do. Then `public-build-assets` passes on a fresh public build. The full `check:browser` is not rerun for this alone (owner rule: never twice for one change); the next Check runs the public build and `public-build-assets.mjs` directly, or reuses one later full run.
