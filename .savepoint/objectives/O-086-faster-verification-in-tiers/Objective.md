---
id: O-086
title: Faster verification in tiers
status: planned
depends_on: [O-085]
release: G-024
priority: high
rank: 5
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
