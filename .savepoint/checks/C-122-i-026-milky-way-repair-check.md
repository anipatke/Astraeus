---
id: C-122
scope: {kind: release, id: G-012}
result: CLEAR
checked_by: {role: checker, session: i026-check-20261029}
executed_session: i026-repair-2026-10-29
checked_at: '2026-10-29T11:10:00Z'
reviewed:
  base_commit: 67ff9779
  head_commit: 44210be5
  files: [README.md, docs/DONOR_PROVENANCE.md, packages/astraeus-data/NOTICE, packages/astraeus-data/README.md, packages/astraeus-data/src/pictures.ts, packages/astraeus-data/src/textures/milky-way.jpg, packages/astraeus-data/src/textures/milky-way-left.jpg, packages/astraeus-data/src/textures/milky-way-right.jpg, packages/astraeus-site/assets.html, packages/astraeus-site/index.html, packages/astraeus-site/site/t-milky-way.jpg, packages/astraeus-site/tests/assetsPageCredits.test.ts, packages/astraeus-site/tests/packagePacks.test.ts, packages/astraeus/src/app/SkyView.ts, packages/astraeus/src/app/skyModel.ts, packages/astraeus/src/assets/sky.ts, packages/astraeus/tests/publicApi.test.ts, packages/astraeus/tests/sky.test.ts, packages/astraeus/tests/skyPicture.test.ts, .savepoint/issues/I-026-the-milky-way-picture-is-too-soft-beside-the-catalogue-stars.md]
  dependencies: []
issues: [I-095]
supersedes: null
---

# C-122: I-026 Milky Way repair check

**What this checks.** The direct repair of Issue I-026 (selected alone in the router), against the Issue's 2026-10-27 "owner's choice" list and the owner decisions in its history (starless Kevinmloch render, CC BY-SA 4.0; 3840 px picture, 2026-10-29; "Keep it off by default (Recommended)" after a look on the preview). There is no Objective; the loader accepts only task, objective or release scopes, so, as in C-117, the record is scoped to the router's Goal G-012 and makes no claim about G-012's Objectives. Quick method (one bounded repair).

**Independence.** This session did not plan, build, coordinate or repair any of this work. It wrote only gate outputs (`dist/` folders, `coverage/`, `junit.xml`), the browser run folder `docs/evidence/browser-20261029T110050Z/`, scratch files in its own scratchpad (the downloaded Commons thumbnail and a registration probe), this record, Issue I-095 and the I-026 resolution. It did not edit the router, commit, run `savepoint health check` (no Objective), or read or touch `docs/prds/` or `docs/research/`. No screenshots.

**Baseline.** HEAD `44210be5` on `i026-milky-way`, not a worktree lane (`git-dir` = `git-common-dir`). The diff base is `67ff9779`, not the repair commit's parent: the parent `2dc54ae5` ("O-045 closed by the owner on the board") is where the two ESO halves were deleted (`milky-way-left.jpg` 1,751,810 B, `milky-way-right.jpg` 1,951,626 B), while `pictures.ts` still imported them until `44210be5`. Times UTC.

**Verdict: CLEAR.** Every item on the owner's list is proven. One non-blocking drift Issue (I-095) was captured for stale descriptive lines.

## Scope Lock

1. The shipped picture is the named Commons source at 3840x1920, undimmed in the file.
2. PROV-02 licence and credit, saying it was resized/re-encoded (and dimmed when drawn), wherever credits are listed: `astraeus-data` NOTICE and README, `pictures.ts`, `sky.ts` `MILKY_WAY_PICTURE`/`SKY_SOURCES`, the site assets page, root README, `docs/DONOR_PROVENANCE.md`.
3. The ESO halves are gone with no dangling code or build references.
4. Dimming is in the shader; `milkyWayBrightness` still scales it; the default level equals the trial (linear x 0.04 at brightness 1).
5. `trialPictureFromSearch` and the git-ignored trial files are gone.
6. Registration: LMC and SMC within 0.5 deg.
7. Download size against the old 3.7 MB.
8. The picture stays off by default.

Out of scope: the look itself (the owner judged it on `localhost:5490`), other sky code, Design reconciliation (no Objective).

## Criteria

| # | Result | Evidence |
|---|---|---|
| 1 | Proven | Fetched the Commons 3840 px thumbnail of `File:Milky_Way_360_equirectangular_rendering_with_foreground_stars_removed.png` fresh (API: original 8000x4000, Artist Kevinmloch, LicenseShortName CC BY-SA 4.0, description "rendered by bsrender ... Gaia EDR3"; thumbnail 10,084,345 B PNG 3840x1920). Shipped `milky-way.jpg`: 3840x1920 sRGB JPEG q70, 4:2:0, 530,833 B. At 960x480, NCC 0.99956 and RMSE 0.43% against the alpha-flattened source; horizontally mirrored source NCC 0.902 (control). Mean value 0.0880 shipped vs 0.0872 source: not dimmed in the file (the trial file was about 0.022). The site thumbnail `site/t-milky-way.jpg` (480x240) matches the source at NCC 0.997 (old one 0.832). |
| 2 | Proven | NOTICE: Kevinmloch (bsrender), Gaia EDR3, ESA/Gaia/DPAC, CC BY-SA 4.0, Commons URL, "resized to 3840x1920 ... re-encoded as JPEG", share-alike scoped to the picture. `pictures.ts` `MILKY_WAY_LICENCE`: same credit and URL, accessed 2026-10-29, "resized ... re-encoded ... dimmed when drawn, not in the file"; one entry `milky-way` 3840x1920. `sky.ts`: `MILKY_WAY_PICTURE` credit/licence/source and `SKY_SOURCES` line (CC BY-SA 4.0, "Resized."). `assets.html` card, caption and credit row; root README table and credit line ("resized to 3840x1920 and re-encoded as JPEG; dimmed when drawn"); `DONOR_PROVENANCE.md` owner-decision entry. `astraeus-data/README.md` names Kevinmloch, Gaia EDR3, CC BY-SA 4.0 (its contents list; the credit text is in NOTICE). `textureRightsProblem` passes on the tile (sky.test.ts), and `assetsPageCredits.test.ts` ties the assets row to the licence record. |
| 3 | Proven | `git ls-tree 44210be5` has no `milky-way-left/right` or ESO file; `dist/assets/` holds only `milky-way-afB88TpF.jpg` (530,833 B) and the thumbnail. `git grep eso0932|milky-way-left|milky-way-right|ESO_PICTURE` finds no code or build reference; remaining hits are historical records (spike notes, dated DONOR_PROVENANCE entries, simplify candidates, `.savepoint` history) plus two stale descriptive lines captured in I-095 (`docs/architecture/demo-contracts.md:28`, a doc-comment example in `packages/astraeus/src/assets/pictures.ts:5`). |
| 4 | Proven | `SkyView.ts` fragment: `pow(pow(rgb, 2.2) * uDim, 1/2.2) * uGain`, `uDim` = `PICTURE_DIM` 0.04, `uGain` = `PICTURE_GAIN` (now 1) x brightness; `setMilkyWayBrightness` writes `uGain` on every picture material in place (line 182; sky.test.ts asserts the uniform change). Trial: file baked to `encode(decode(c) x 0.04)`, drawn x 2 x old gain 0.5 = x 1. New default at brightness 1: `encode(decode(c) x 0.04)` x 1. Same level (the trial's file encoding and JPEG rounding aside). Note: with a pure 2.2 power this equals `c x 0.2315`, a uniform scale (see I-095 on the comment). |
| 5 | Proven | No `trialPictureFromSearch` or `skymap` in code (`git grep`; it was never committed, last seen as an uncommitted trial noted in C-121). `packages/astraeus-site/data/local/sky/` is empty. |
| 6 | Proven | Own probe (`convert` grey, crop +-110 px around the expected point, Gaussian blur sigma 12 px, peak; expected from `milkyWayUv` u = 0.5 - l/360 wrapped, row = (0.5 - b/180) x H; LMC l 280.465 b -32.888, SMC l 302.797 b -44.299). LMC peak (2768, 1313) vs expected (2768.4, 1310.8): 0.21 deg. SMC peak (2531, 1430) vs (2530.2, 1432.5): 0.24 deg. Both under 0.5 deg. Mirrored-longitude windows peak at 12% and 14% of the true ones (control). The builder's 0.09/0.23 deg used a different blur; both agree within the limit. |
| 7 | Proven | 3,703,436 B (two halves at `67ff9779`) to 530,833 B: 0.53 MB, 14% of before. `check:pack`: astraeus-data 35.46 MB packed, 25 files, within limits. |
| 8 | Proven | `SkyView` `options.milkyWay ?? false`; `resolveSkySettings` `settings?.milkyWay ?? false`; sky.test.ts "with no setting the picture starts off"; browser `hello-scene` asserts the picture starts off. Owner decision 2026-10-29 recorded in I-026 history. |

Negative and boundary probes: mirrored-source and mirrored-longitude controls (above) fail as expected, so the match and registration are not chance. The tile is 3840 px, under `MAX_TILE_PX` 4096. GLSL `pow(0, 1/2.2)` is defined (y > 0) and texture values are never negative.

## Gates (fresh, this session)

| Command | Result |
|---|---|
| `npm run lint` | pass |
| `npm run typecheck` | pass |
| `npm run build` | pass (usual chunk-size warning) |
| `npm test` | pass: 144 files, 1886 passed, 1 skipped |
| `npm run check:pack` | pass (15.3 s) |
| `npm run check:engine-alone` | pass (14.9 s) |
| `npm run check:browser` (once) | pass, 8 steps, 0 error lines, 109 s; `docs/evidence/browser-20261029T110050Z/` |
| `git diff --check 67ff9779 44210be5` | clean |

The browser run never switches the picture on, so it does not compile the new picture shader; the shader is a two-line change reviewed above, and the owner viewed it rendering on the preview (`app.html?milkyway=on`, I-026 history 2026-10-29T10:58).

## Issues

None blocking; no materiality actions are required. I-095 (low, drift) records the stale descriptive lines for follow-up.

## Observations (non-blocking)

- The ESO deletion landed in the owner's board commit `2dc54ae5`, so that commit's tree does not build (`pictures.ts` imports missing files). History only; HEAD is sound.
- `PICTURE_DIM`'s comment says faint values fall more than bright ones; mathematically it is a uniform x 0.2315 (I-095). The two `pow` calls could be one constant; harmless.
- `SKY_SOURCES` says "Resized." but not "re-encoded"; other credit places say both. Not a PROV-02 gap.
- `.savepoint/Design.md:23` gives astraeus-data as about 38.6 MB packed; now 35.46 MB (in I-095; Design edits go through `savepoint-design`).

## Owner Validation

The owner has already judged the look and chose off by default. Nothing further is needed for this Check.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [ ] STYLE-05 **Build only what is needed** — `SkyView.ts:33-34` decodes and re-encodes to apply what is a single constant scale.
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [ ] STYLE-08 **Comments explain why** — `SkyView.ts:11-15` explains a non-linear effect the code does not have; `pictures.ts:5` names a removed picture.
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
