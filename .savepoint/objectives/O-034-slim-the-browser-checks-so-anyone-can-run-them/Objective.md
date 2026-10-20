---
id: O-034
title: Slim the browser checks so anyone can run them
status: in_progress
depends_on: []
release: G-007
---

# O-034: Slim the browser checks so anyone can run them

## Outcome

Someone who clones Astraeus runs one command, with the project's own browser tool, and in under five minutes it checks the engine on the made-up test scenes. The checks for the three demos (Apollo 11, Showers, Jupiter-Io) are a separate, optional set, each demo's checks running in minutes. Today's three tiers (lite, touched areas, full) and their rules are replaced by one short rule.

## Why

Owner, 2026-10-20, after O-022: "I want to review the browser checks, feels heavy for this package and could be frustrating to someone picking this up", and "consider someone looking this up and wanting to re-use it, the demos should be optional maybe? I know we built them for our site". On that date the full run took about 32 minutes (23 of them `browser-jupiter-io.mjs`), 17 of the 23 main scripts opened a demo even to check generic engine behaviour, and the rules pointed `PLAYWRIGHT_CORE` at the donor repo although `playwright-core` is already a devDependency.

## Success Conditions

1. One command (an npm script) runs the engine set in under 300 s on this machine, measured on an idle machine, with the project's own `playwright-core` and no path outside the repository.
2. The engine set opens no demo: controls, phone layout and sheets, labels, tap and drag, scale, view links and orbit motion are asserted on the made-up scenes (`src/synthetic/`), which gain the objects they need (ARCH-01, ARCH-03).
3. Each demo has its own optional set run with one command per demo. Jupiter's tagged places are sampled (from about 23 minutes to about 1); the Perseids step is trimmed (former O-027); the Apollo speed check reads at a known simulation time so machine load cannot change it, with a negative probe (former O-028).
4. Every kept or moved scenario is mapped in one short `docs/BROWSER_CHECKS.md`; every dropped scenario is named there with the reason (TEST-03, Browser regression maintenance).
5. AGENTS.md project rules on browser checks become one short rule (below), and a short "Running the checks" note for reusers is added. Every script in both sets exits 0 with zero console errors.

## Confirmed Decisions (owner, 2026-10-20)

1. **Checks now, demos next** ("Checks now, demos next"): this Objective changes checks only; making the demos an optional part of the package is O-035.
2. **Engine checks move to made-up scenes** ("Move them to made-up scenes").
3. **Demo checks become an optional, trimmed set** ("Optional demo set, trimmed"), folding in the former O-027 (full run under ten minutes) and O-028 (steady the Apollo speed check), which are removed.
4. **When each set runs** ("Engine set at checks, demos when touched"): the engine set runs at the Full Objective Check whenever scene, camera, controls or UI code changed; a demo's set runs only when that demo changed, or before a release. No per-Task browser runs.
5. **Goal** ("Yes, under post-launch clean-up"): G-007.

## Planned Technical Decisions (planner, 2026-10-20)

- Two runner commands replace `run-full.sh`'s lanes: `npm run check:engine` and `npm run check:demo -- <apollo|showers|jupiter>` (or one script per demo), each starting and stopping its own dev server, writing to a fresh evidence directory, and running scripts one after another (one browser job at a time). The public-build licence gate (`public-build-assets.mjs`, `public-addresses.mjs`, no browser) stays in the engine command or its own quick command.
- Scripts import `playwright-core` from the project; `PLAYWRIGHT_CORE` becomes an optional override.
- The shared driver (`tools/validate/driver.mjs`) and its guard stay: scripts still touch the interface only through it.
- Engine scripts are merged where that shortens the run; the made-up scenes gain only what a check needs (for example a second named body to tap, a story panel, a sheet), never a real mission or dataset (ARCH-01).
- Scripts under `tools/validate/on-request/` that only measure looks or precision are kept or deleted per the map; none runs in either set.

## Architectural Considerations

Checks and tooling only. The made-up scenes are test experiences already left out of the public build (T-068); additions to them stay out of it. No app behaviour change; a defect found becomes an Issue.

## Boundaries

**In scope:** `tools/validate/`, `src/synthetic/` test scenes, `package.json` scripts, `docs/BROWSER_CHECKS.md`, the AGENTS.md project rules on browser checks, a reuser note, Design reconciliation.

**Out of scope:** making the demos optional in the package or the public build (O-035); app or engine behaviour; screenshots (still banned); unit-test rewrites beyond what a moved assertion needs.

## Amendments

- 2026-10-20T10:36:35Z, owner (structured question, "Accept it as is"): Success Condition 3 per-demo time targets: Apollo 227 s, Jupiter 248 s and Showers 390 s are accepted, since demo sets run only when that demo changes or before a release. The Full Objective Check reuses the T-112 handoff demo runs rather than rerunning them (owner: "Didnt we say we WOULDNT run these checks").
