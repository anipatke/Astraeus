---
id: O-086
title: Faster verification in tiers
status: planned
depends_on: [O-085]
release: G-024
priority: high
rank: 5
lanes: [{key: packing, title: Pack rules on small inputs}, {key: apollo, title: Apollo rerun on change}, {key: preload, title: Scoped moon preload}, {key: finder, title: Finder bands}, {key: guidance, title: Gate guidance}, {key: vitest-moves, title: Checks moved to Vitest}, {key: browser, title: Browser tiers and steps}]
---

# O-086: Faster verification in tiers

## Outcome

The same work runs once per gate pass, and browser checks come in two tiers: a quick tier for every Full Objective Check (every page loads, phone layout, packed examples) and a full tier at release and for Objectives touching camera, layout, shaders, sky or packaging. Each browser step is trimmed per the review's value matrix, keeping every browser-unique assertion.

## Why

AH-31 (all three): `npm test` builds and packs real packages that `check:pack` builds again, `test` and `test:full` run the same 4,629 cases, the Apollo reconstruction runs twice, moon data preloads for every test file. AH-29/AH-30: the browser suite takes 406–449 s against a 320 s limit; smoke and look-out take 246–277 s; look-out reads the camera through the developer drawer. AH-49: the constellation finder scans every edge. Owner decision 1 approves the tier policy.

## Success Conditions

- Packaging rules tested on small constructed inputs in `npm test`; real build and pack only in `check:pack` (which still catches a planted stray file and extensionless import); the second reconstruction runs only when the Apollo tools change; test preload scoped.
- Gate guidance runs `test:full` instead of (not as well as) `npm test` where both were scheduled.
- `check:browser` offers a quick tier and a full tier; `docs/agents/browser-policy.md`, `docs/agents/build.md`, `docs/agents/verification.md` and gate limits updated to decision 1.
- Steps changed per the matrix: smoke split (journey becomes its own full-tier step), duplicate loads dropped, file-only steps moved to a build gate, look-out reads the camera from the handle, views/catalogue state and text checks moved to Vitest before removal, fixed sleeps replaced by polls, hello-sky glide tolerance. The I-185 phone sequence and the four packed examples stay.
- Before/after timings recorded on the same machine for `npm test`, `test:full` and both browser tiers.

## Architectural Considerations

Browser work follows `docs/agents/browser-policy.md`; one browser job at a time. The site driver migrates in the same Task as any step change.

## Boundaries

**In scope:**
- Test and gate tooling, browser scripts and runner, verification and browser policy docs, gate limits.

**Out of scope:**
- Retiring the assertion-text baseline and dead driver code (O-088); CI workflows (O-091).

## Decisions

- Owner 2026-11-21 (G-024 decisions 1 and 7): design confirmed ("work through this list of objectives one by one. Orchestrate each objective to completion"); tier policy "Quick set, full when relevant"; owner 2026-11-22 "carry on" and "this is going a bit slow". Step checks waived on every Task.
- Planner (orchestrate-g024-20261121), settled from evidence (details in each Task; defaults taken, flagged to the owner):
  1. Before/after timings back to back at the end (T-393), from a scratch worktree at the base commit.
  2. The second Apollo reconstruction runs only when a content hash of its tools and raw inputs changes.
  3. Tiers: quick = smoke (all pages and views, both sizes, journey removed), public showers, planets phone, the four packed examples; full adds the journey, meteor shower, views, look-out, catalogue. `npm run check:browser` with no flag stays the full tier.
  4. The journey split keeps one script (`ASTRAEUS_VIEWS=synthetic-journey`).
  5. The engine size limit moves from `npm test` to `check:pack` (this Objective's own condition "real build and pack only in check:pack"; it replaces the I-164 placement, flagged to the owner); `check:pack` runs at every Full Check and release.
  6. `time-gates.mjs` keeps timing both suites; only the guidance changes.
  7. No automatic tier choice; the policy lists the paths that need the full tier and says "when unsure, run full".
  8. Sky readings rounded in the driver to the view-link precision.
  9. Moon preload scoped by a third Vitest project with an explicit file list (no test file edits).
  10. Removed browser assertions are named in a `RETIRED` list that requires the Vitest replacement to exist.
  11. AH-49 (finder) included: cited in the Objective's Why.
  12. Limits that rise are named with their cause; nothing is raised to hide a slow step.
  13. Catalogue in the full tier only; public showers at desktop size only.
