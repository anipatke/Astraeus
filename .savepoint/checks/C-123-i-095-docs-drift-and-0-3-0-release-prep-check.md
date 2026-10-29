---
id: C-123
scope: {kind: release, id: G-012}
result: CLEAR
checked_by: {role: checker, session: i095-check-20261029}
executed_session: i095-release-prep
checked_at: '2026-10-29T12:00:00Z'
reviewed:
  base_commit: c70b62e0
  head_commit: 1410c0b7
  files: [.savepoint/Design.md, docs/architecture/demo-contracts.md, docs/release-notes-0.3.0.md, packages/astraeus/src/app/SkyView.ts, packages/astraeus/src/assets/pictures.ts, packages/astraeus/CHANGELOG.md, packages/astraeus-data/CHANGELOG.md, packages/astraeus/package.json, packages/astraeus-data/package.json, packages/astraeus-data-jupiter/package.json, packages/astraeus-data-saturn/package.json, packages/astraeus-data-uranus/package.json, packages/astraeus-data-neptune/package.json, packages/astraeus-data-mars/package.json, packages/astraeus-data-pluto/package.json, .savepoint/issues/I-095-docs-and-comments-still-describe-the-old-eso-milky-way-picture.md]
  dependencies: []
issues: []
supersedes: C-122
---

# C-123: I-095 repair and 0.3.0 release-prep check

**What this checks.** The direct repair of Issue I-095 (selected alone in the router) in commit 1410c0b7, and the release preparation in the same commit. Scoped to the router's Goal G-012 as in C-122 (no Objective; the loader accepts only task, objective or release scopes). Quick method. No browser run: since C-122's browser run only comments, docs, changelogs and versions changed (the `SkyView.ts` and `pictures.ts` edits are comment-only, confirmed in the diff).

**Independence.** This session did not plan, build or repair this work. It wrote only gate outputs, scratch logs, this record and the I-095 resolution. It did not touch the router, commit, tag, publish (dry run only), or read `docs/prds/` or `docs/research/`.

**Baseline.** HEAD `1410c0b7`, `i026-milky-way`, not a lane. Diff base `c70b62e0`.

**Verdict: CLEAR.**

## I-095 lines

| Line | Result | Evidence |
|---|---|---|
| `demo-contracts.md:28` | Fixed | Now "the softness against the stars was I-026, resolved and verified in C-122". The picture description matches the shipped Kevinmloch Gaia EDR3 render (CC BY-SA 4.0). |
| `pictures.ts:5` | Fixed | Example name is `milky-way`. Comment-only diff. |
| `SkyView.ts` `PICTURE_DIM` comment | Fixed and correct | Shader unchanged: `pow(pow(rgb, 2.2) * uDim, 1/2.2) * uGain`. `(c^2.2 * 0.04)^(1/2.2) = c * 0.04^(1/2.2)`; ln 0.04 = -3.2189, times 0.45455 = -1.4631, exp = 0.2315. The comment says flat scale of the stored value by about 0.2315, same for faint and bright. Correct. Diff touches only the comment. |
| `Design.md:23` | Fixed | "about 35.5 MB packed", matching `check:pack` astraeus-data 35.46 MB (C-122, and the fresh run here passes within limits). Done by the planner path, not this run. |
| Grep | Clean | `git grep -E "eso0932|milky-way-left|milky-way-right"` outside `.savepoint/` and `docs/evidence/` finds only: dated spike notes (`ASTRAEUS_SPIKE_04*`), dated `DONOR_PROVENANCE.md` entries, `ASTRAEUS_SIMPLIFY_CANDIDATES.md` (history), and the 0.3.0 astraeus-data CHANGELOG and release-notes lines saying the names are gone. No current-state mention. |

## Release prep

- Versions: `astraeus`, `astraeus-data` and the six `astraeus-data-<planet>` packages are all `0.3.0` (eight). Demo and site packages stay private at 0.1.0 and depend on `*`.
- Peers: all seven data packages peer `astraeus >=0.1.0 <1.0.0`, which resolves for 0.3.0.
- `node tools/publish-packages.mjs --dry-run`: exit 0; lists `astraeus`, `astraeus-data`, jupiter, saturn, uranus, neptune, mars, pluto, all `@0.3.0`, "(dry-run)". Never run without `--dry-run`.
- CHANGELOG against HEAD: the I-026 entry matches (starless Gaia EDR3, 3840x1920, 0.53 MB, off by default, `milkyWayBrightness` scales it, names `milky-way-left/right` gone, `milky-way` is the picture). O-044 and O-045 entries match code seen in C-120/C-121 and commit history (`stateOf` all bodies, `fitOrbit`, modelled provenance, no `document.title`, node condition, phone sheet zoom). Release notes repeat the changelogs, consistent.
- `setTimeline({ none: true })` wording: at `v0.2.0` `spanOf` had no "now" fallback (`windowOf(tracked, setTime)`); commit `ce4aeb40` (T-183, O-044) added the `Date.now()` default for a scene with nothing setting a span or a moment, and `none: true` without `at` takes that path at HEAD (`scene.ts` `spanOf`). So "new in O-044; it was not changed in O-045" is accurate, and the removed "Fix (O-045 follow-up to O-044)" line was wrong.
- First download: fresh `npm run measure:example` gives first-open 1,592,336 B raw, 453,513 B gzip, identical to the changelog and release notes.

## Gates (fresh, this session, HEAD 1410c0b7)

| Command | Result |
|---|---|
| `npm run lint` | pass |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm test` | pass: 144 files, 1886 passed, 1 skipped |
| `npm run check:pack` | pass (15.3 s) |
| `npm run measure:example` | 1,592,336 raw / 453,513 gzip first-open |
| `node tools/publish-packages.mjs --dry-run` | pass, eight packages at 0.3.0 |

## Observations (non-blocking)

- `SKY_SOURCES` says "Resized." without "re-encoded" (carried from C-122; not a PROV-02 gap).
- The decode/encode pair in the shader could be one constant (carried from C-122; STYLE-05 advisory).
- The PICTURE_DIM comment line is long (over 130 characters); style only.

## Owner Validation

None needed.

## Code Style Review

- [x] STYLE-01 through STYLE-10: no code changed beyond two comments; the C-122 STYLE-05 note (single-constant dim) remains advisory and the STYLE-08 comment faults it raised are now fixed.
