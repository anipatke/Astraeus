---
id: C-085
scope: {kind: objective, id: O-016}
result: NEEDS WORK
checked_by: {role: checker, session: o016-check-20261020}
executed_session: o016-portfolio-planning-20261020
checked_at: '2026-10-19T21:05:00Z'
health_snapshot: sha256:b55182659e4378c9101ecabb532e3e33a0ffd9e3cd750583a6dd278148d7cfa5
reviewed:
  base_commit: 9e001ba
  head_commit: 92e7068
  files:
    - index.html
    - assets.html
    - app.html
    - README.md
    - vercel.json
    - vite.config.ts
    - src/assets/sky.ts
    - src/assets/stars/hyg-v42-naked-eye.json
    - src/app/App.tsx
    - src/app/viewLink.ts
    - src/main.tsx
    - src/core/bodies/io.ts
    - src/experiences/jupiter-io/jupiterIo.ts
    - tools/validate/public-build-assets.mjs
    - tools/validate/load-budget.mjs
    - tools/validate/public-addresses.mjs
    - tests/hygStars.test.ts
    - tests/publicBuild.test.ts
    - tests/assetsPageCredits.test.ts
    - tests/homePage.test.ts
    - docs/DONOR_PROVENANCE.md
    - .savepoint/Design.md
    - /home/user/code/main-portfolio/components/astraeus/AstraeusBridge.tsx
  dependencies: []
issues: [I-046]
supersedes: null
unmet: [T-064-outcome-pages-match-code, T-064-DW2-assets-page-current, T-064-DW3-readme-current]
---

# C-085: O-016 Full Objective Check

Owned Tasks: T-057 (Task Check C-036 CLEAR), T-058 (C-037 CLEAR), T-060 (C-039 CLEAR), T-063 (C-042 CLEAR), T-064 (C-043 CLEAR), T-106 (Task Check waived by the owner 2026-10-20). All six `status: done`, closed by the owner.

Independence: fresh checker session, launched by the coordinator; it built none of this work and treated every Task's evidence as claims.

**Result: NEEDS WORK.** Every gate and all 24 full-run steps pass, the public build ships HYG stars and nothing local-only, and the portfolio page (T-106) is correct. One Issue: the site's own pages have drifted since T-064. The front page's Jupiter card still describes the January 2000 mean-element demo, and four other page or README claims no longer match the code (I-046).

## Scope lock

1. O-016 Success Conditions 1-3; Planned Decisions 2026-10-20; each owned Task's Done When and Outcome, judged on today's code (HEAD 92e7068), not only at build time; Guardrails PROV-01, PROV-02, ARCH-04, TEST-01..04; STYLE advisory.
2. Public entry points: `index.html`, `assets.html`, `app.html` (Apollo default, `?experience=showers`, `&shower=geminids`, `?experience=jupiter-io`), `README.md`, `vercel.json`, the public build (`ASTRAEUS_PUBLIC_BUILD=1`) and its validator; the portfolio page `main-portfolio` commit 7596b84.
3. Relied-on runtime: Vite multi-page build, `public-build-assets.mjs` + `load-budget.mjs` + `public-addresses.mjs`, the HYG star loader, the shared browser driver.
4. Matrix axes and cells below; not-applicable cells carry reasons.
5. Material: a failing configured gate or full-run step; a reproducible page/README claim that contradicts the code or data (T-064 outcome, PROV-01); a shipped non-shippable asset (PROV-02); a portfolio link that opens the wrong demo. Domain, DNS and deployment are owner actions (Objective Boundaries) and only observations.

## Evidence (fresh, this session)

- Gates at HEAD 92e7068, 2026-10-19T20:19:40Z-20:20:16Z UTC (Node, local toolchain): `npm run typecheck` exit 0; `npm run build` exit 0; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` exit 0, 77 files, 1122 passed, 1 skipped (the opt-in `ASTRAEUS_PERF` wall-clock test); `git diff --check` clean.
- `ASTRAEUS_PUBLIC_BUILD=1 npm run build` exit 0; `node tools/validate/public-build-assets.mjs` exit 0: ok true, matches [], missingPages [], starAsset ok, load budget ok for all six page sets and the whole build.
- Full browser tier `PLAYWRIGHT_CORE=... tools/validate/run-full.sh docs/evidence/o016-check-20261019T202043Z` exit 0, 2079 s, 24 of 24 steps exit 0 with error-lines 0 (lite, phone, controls, spike02, shell, anchor-labels, synthetic, synthetic-ring, synthetic-listed, public-build-assets, public-addresses, public-showers, jupiter-io, moon-panel, embedded, home-curve-fits, orbit-motion, orbit-look, spike03, view-link, sky, story-panels, showers-perseids, showers-geminids). First attempt, no reruns. No PNGs in the run directory; no other browser job ran alongside.
- Independent scenario (not an existing script): scratch `portfolio-links.mjs` through `tools/validate/driver.mjs` (`loadAddress`, `waitForShell`, `clockText`, `experienceSwitchState`) against `vite preview` of the public `dist/` on port 5491, after the full run: `app.html` → "Apollo 11 · Astraeus", clock 1969-07-16; `?experience=showers` → "Perseids", active shower perseids; `&shower=geminids` → "Geminids", active geminids; `?experience=jupiter-io` → "Jupiter and Io", clock 2016-11-04; controls `?experience=earth-moon` and `?experience=shower-perseids` → Apollo 11 (retired, as T-106 found). 0 console/page errors each; no screenshots.
- Portfolio (`/home/user/code/main-portfolio`, HEAD 7596b84, clean tree): `npm run lint` exit 0 (0 errors, 5 warnings, none in Astraeus files); `npm run build` exit 0 (`/astraeus` 7.02 kB). Links answered 200: astraeus.anipatke.com `/`, `/app.html`, `/assets.html`, github.com/anipatke/Astraeus, planetary-explorer, orbit, solar-system-scale and galaxy .anipatke.com.
- Code Health: snapshot above (created), "does not block clearance"; coverage and tests evidence stale (optional instances); complexity, duplication, vulnerabilities no finding.

## Coverage matrix

| Row (requirement) | Normal | Boundary / bypass | Today's code | Result |
|---|---|---|---|---|
| SC1 public build draws HYG, credited | sky step exit 0 (8,920 stars, HYG and CC BY-SA cited in panel); `tests/hygStars.test.ts` 8 cases pass | validator `checkStarAsset` rejects missing/badly licensed star file (`tests/publicBuild.test.ts` "shipped HYG star asset (T-060)") | Yale option removed by owner in O-017 T-067; Yale comparison tests went with it; five named stars still checked against published J2000 | Proven (Yale pairing historical, C-039) |
| SC1 credits on assets page, README, DONOR_PROVENANCE | `assets.html:535`, README 135/156, DONOR_PROVENANCE 105; `tests/assetsPageCredits.test.ts` passes | CC BY-SA scoped to the star file, said in each | unchanged | Proven |
| SC2 site pictures from public build, no Yale, no CAMS | apollo-provenance, perseids-year.gif, share/apollo-moon from T-063 capture (C-042) | apollo-moon, perseids-gmn, jupiter-io replaced by owner screenshots (O-017 T-076, owner-accepted); capture script archived (T-102), no re-shoot allowed | no CAMS path in code (T-067); pictures unchanged since 2026-10-17 | Proven by record + owner decision; not re-shot (no screenshots rule) |
| SC3 validator rejects non-shippable assets | public-build-assets exit 0 on real build | `proveLicenceHandling`/`proveItFails` cases in `tests/publicBuild.test.ts` pass; `public-addresses` fails retired links | adds load budget and synthetic exclusion since | Proven |
| T-057 page split, links, vercel | three pages in dist; `vercel.json` public build, `dist` | retired addresses absent from built pages (public-addresses exit 0); home links = `DEMO_ADDRESSES` (`tests/homePage.test.ts`) | Earth-Moon card gone (O-024) | Proven |
| T-058 Developer panel | generic subtitle `App.tsx:536`; shell, phone, controls steps exit 0 | phone layout steps | moved markup kept by driver | Proven (looks: owner) |
| T-063 pictures | as SC2 | unused `site/apollo-phone.jpg`, `site/geminids-gmn.jpg` not shipped (unreferenced) | — | Proven; observation |
| T-064 pages describe the current product | HYG, NASA Moon/Earth, GMN credits correct | Jupiter card, Io row, panel row, README address and budget table | **stale** | **Issue I-046** |
| T-106 DW1 links | probe above: each opens its demo | retired ids fall back to Apollo (why the fix was needed) | — | Proven |
| T-106 DW2 Earth & Moon removed | 4 presets; grep finds no earth-moon | — | — | Proven |
| T-106 DW3 facts | 25,588 / 51,115 orbits, 8,920 stars, 30 events, panels 7/3/3/3 (`data/stories/*/panels.json`), 115 moons, 2016-11-04 window, peaks 12 Aug / 14 Dec | label "Jupiter & Io" matches the app's own title | — | Proven |
| T-106 DW4 plain words | no step IDs, paths, "Savepoint", J2000 jargon in visible strings | — | — | Proven (reading); owner look recorded by closure |
| T-106 DW5 links | eight external links 200 | portfolio `/`, `/vibe-logs` are its own built routes | — | Proven |
| T-106 DW6 gates | lint 0 errors, build ok | — | — | Proven |

Input-shape, text-class, serialization and state-transition axes: not applicable (static pages, one build switch, URL selection only; the URL bypass/retired cells are covered above).

### External-boundary matrix

| Cell | Classification |
|---|---|
| Configured vs actual target | run-full: own dev 5479 and scratch public preview 5480; probe: preview of public `dist/` 5491 — matched |
| Startup/discovery/reuse | servers started fresh by the run; ports freed after (fuser) |
| Unavailable dependency | n/a for the verdict; `astraeus.curiouscode.ai` does not resolve (observation) |
| Success/non-success responses | external links 200; curiouscode.ai no answer |
| Redirects | `curl -L` followed; all landed 200 |
| Timeout/cancellation | none hit; run in one attempt |
| Malformed response | n/a: static pages |
| Retry/cleanup | no reruns; temp public build removed by script |
| Secret-safe output | no secrets involved |

### Workflow and side-effect lock

Build → validate → serve → browser checks: the public build writes `dist/` (or the run's temp dir), the validator reads it and fails on any local-only byte, missing page, bad star record, over-budget page or retired link (command-fatal, exit non-zero); success is visible only as exit 0 + `ok: true`. Independent oracle: hashes against `data/local` sources and the committed HYG file (validator), driver readouts (browser). Verified by the gate and full-run results above; the negative paths by the `tests/publicBuild.test.ts` "fails" cases. No persistence or transactions.

### Matrix completion lock

Every cell classified. One Issue (I-046). Unverified: none material; SC2 pictures cannot be re-shot under the owner's no-screenshots rule and rest on C-042 plus owner acceptance of T-076.

## Adversarial pass

- Bypass of the public-build gate: synthetic experiences are excluded (`checkNoSyntheticExperiences`); a retired address loads Apollo rather than a removed demo; `dist/` checked by hash and text window, not filename only.
- Can a page claim outlive the code it describes? Yes: no test ties card text, Io model row, panel totals, README addresses or the README budget table to their sources. Five such claims drifted (I-046). `tests/homePage.test.ts` and `tests/assetsPageCredits.test.ts` cover addresses, pictures and credits only.
- Portfolio facts checked against shipped data, not against the T-106 evidence list.

## Issues

- **I-046** (drift, PROV-01, T-064 outcome and Done When 2-3): front page Jupiter card ("January 2000", mean elements, "approximate demonstration"; `index.html:340-342`) contradicts the Horizons-fitted Io (`src/core/bodies/io.ts:136,147`) and the page's own curve-fit section; `assets.html:229-233` Io row says mean orbit; `assets.html:336-338` counts 10 panels for two stories (now 16 across four); `README.md:39` gives the retired `?experience=shower-<name>` form; `README.md:108-120` lists superseded load limits (Jupiter-Io 4,000,000 B vs 6,960,000 B enforced). Minor: README Apollo picture alt mentions a story panel that is not in the picture.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-046 | High: every visitor to the front page reads the Jupiter card; README readers follow the address rule | Medium: wrong facts on a launch page undercut the "explicit about the difference" promise; nothing breaks | Medium | Fix now as one direct text repair under I-046 (no new Task needed), ideally with a test tying panel counts and budget rows to their sources; recheck by a fresh checker |

## Owner validation still needed

- Owner closure of each Task stands as recorded. The owner's look at the HYG sky on the preview is noted as pending in Design.md (G-004/G-005 state); not re-judged here.
- After the I-046 repair, a re-check (new C-###, superseding this one) is needed before the Objective can close.

## Observations (non-blocking)

1. `astraeus.curiouscode.ai` does not resolve; `index.html:7,11,12` (canonical, og:url, og:image) and README "Try it"/assets links use it, while the portfolio and the live deploy use astraeus.anipatke.com. Domain choice and DNS are owner actions (out of scope); link previews will not show an image until settled.
2. `site/apollo-phone.jpg` and `site/geminids-gmn.jpg` are no longer referenced by any page (not shipped, Vite only bundles referenced files); safe to delete.
3. HYG-against-Yale pairing (SC1 "checked against the Yale set") is now historical: Yale and its tests were removed by owner decision in O-017 T-067; the result stands in C-039 and DONOR_PROVENANCE.
4. Portfolio: the Geminids card reuses the Perseids banner; the "NOVEMBER 2016" epoch depends on `JUPITER_WINDOW`, which is marked temporary (O-032).
5. The front-page footer names GMN and HYG; Solar System Scope and ESO credits are one link away on the assets page.
6. Code Health optional instances report stale coverage/tests evidence (collection, not code quality).

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — README copies the load limits from `tools/validate/load-budget.mjs` and has drifted (I-046); page panel counts are hand-typed rather than read from `data/stories/`.
- [x] STYLE-08 **Comments explain why**
- [ ] STYLE-09 **Content lives in data** — demo-card facts in `index.html` and the portfolio `PRESETS` are hand-written copies of data facts (advisory; the root of I-046).
- [x] STYLE-10 **Small diffs** — T-106: one file, +43/-59.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice — advisory manifests ignored; not a finding
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation — not applicable (first run)
- [x] Verify File Reality — every file named in the six Tasks' evidence exists, or is recorded as removed (Yale/CAMS paths T-067, capture script archived T-102 to `tools/archive/validate/`, browser-earth-moon removed T-102)
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style
