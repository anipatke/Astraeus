---
id: T-057
title: Put the pitch page in front of the app and link the demos
objective: O-016
status: in_progress
stage: audit
depends_on: [{task: T-038, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o011-orchestrator-check-20261013}
planned_reads: [index.html, vite.config.ts, src/main.tsx, tools/validate/public-build-assets.mjs, tests/publicBuild.test.ts]
planned_writes: [index.html, app.html, vite.config.ts, site/, vercel.json, tools/validate/, tests/publicBuild.test.ts, README.md]
---

# Put the pitch page in front of the app and link the demos

## Outcome

The Astraeus address opens on the pitch page (the owner-approved draft at https://claude.ai/artifact/4WWvAe3TEWc6kAHJZW5RXm, version 10, plus its assets sub-page). The app moves to its own page, and each demo card opens the live scene: Apollo 11 and the Perseids. The site builds as one static deploy for Vercel, like the owner's other subdomain demos.

## Astraeus Hypothesis

- **Capability tested:** none in the engine. This is presentation and deployment around it.
- **Owner direction (2026-10-16):** the pitch page is the "Front page of the Astraeus address" (AskUserQuestion), "Start building now", "can we re-wire the front page and demo links whilst we are waiting?"

## User Check

Open the front page locally, click both demo cards and the Assets link, then come back. Desktop and phone.

## Done When

1. Vite multi-page: `index.html` is the static pitch page (no React), `assets.html` is the sub-page, and the app's HTML moves to `app.html` with `src/main.tsx` unchanged. The site files and their images live under `site/` (or public assets) with no third-party fonts beyond Google Fonts.
2. Demo links: Apollo 11 → `app.html` (its default), Perseids → `app.html?experience=shower-perseids`. The "Back" and "Assets" links work. The app gets a small, unobtrusive link back to the front page only if it costs no change to the shell; otherwise it is recorded as a follow-up.
3. Every browser script whose default URL loaded the app at `/` now loads `/app.html`, with each change listed. No assertion changes beyond the URL. The browser scripts still pass.
4. `vercel.json` sets the public build (`ASTRAEUS_PUBLIC_BUILD=1`, output `dist`). The public-build validator still finds no local-only textures or `data/local` content in `dist`, and also confirms that `index.html`, `assets.html` and `app.html` are all present.
5. Images on the pitch page that are drawn from CAMS data are not shipped. The Perseids card uses the GMN screenshot (CC BY 4.0, credited) once T-056 makes GMN the default, and the page credits list matches.
6. Gates pass. Evidence (a fresh directory) holds screenshots of the front page, the assets page and both demos opened from their cards, desktop and phone.

## Boundaries

- No engine or shell behaviour change.
- No deploy: the owner deploys and points the domain.
- Shipping measured meteor data in the public build is a separate owner decision. Without it, the public Perseids demo shows "not fetched", and that is recorded.

## Technical Verification

Gates, browser scripts at their new URLs, public-build validator. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Builder run 2026-10-16 (UTC), evidence in `docs/evidence/o011-t057-20261016T092400Z/`.

**Files changed.** New: `index.html` (engine-first front page, copied from the owner-approved source with a document skeleton, canonical and og tags), `assets.html`, `app.html` (the former `index.html`, unchanged), `site/` (page images and globe thumbnails, plus `site/readme/perseids-year.gif`), `public/share/apollo-moon.jpg` (og:image, served unhashed at /share/), `vercel.json`, `LICENSE` (MIT, owner decision 2026-10-16), `README.md` (rewritten). Edited: `vite.config.ts` (`build.rollupOptions.input` for index, assets, app; alias logic untouched), `tools/validate/public-build-assets.mjs` and `.d.mts` (`REQUIRED_PAGES`: the validator fails when index.html, assets.html or app.html is missing from dist), `package.json` (name `astraeus`, `license: MIT`, `engines.node >=22.12` because vitest 5 needs it, `playwright-core` 1.59.1 exact as devDependency), `package-lock.json`. `src/main.tsx` untouched.

**URL sweep (19 scripts, default URL only, `ASTRAEUS_URL` override kept):** browser-anchor-labels, browser-earth-moon, browser-jupiter-io, browser-lighting, browser-marker-existing, browser-precision, browser-shell, browser-showers, browser-showers-gmn, browser-sky, browser-spike02, browser-spike03, browser-sun, browser-synthetic, browser-synthetic-belt, browser-synthetic-eccentric, browser-synthetic-listed, browser-synthetic-ring, capture-apollo-compare (`http://localhost:5199/` to `http://localhost:5199/app.html`, plus usage comments).

**Gates.** typecheck: pass. `npm run build` and `ASTRAEUS_PUBLIC_BUILD=1 npm run build`: pass; dist holds index.html, assets.html, app.html. Public-build validator: ok, missingPages [], matches [] (`public-build-assets.json`). vitest: one run had a single timeout in tests/compositions.test.ts under load; the file alone passes 31/31 (full-suite rerun by the Check).
Browser scripts, against Vite on port 5303 (5199 was held by someone else's `vite preview`; `ASTRAEUS_URL=http://localhost:5303/app.html`, so the override path is what ran): spike02 pass, spike03 pass, shell pass, earth-moon pass, showers pass for both showers (geminids, perseids; the script pins `source=cams`, GMN default is covered by browser-showers-gmn.mjs, not rerun here). The first three showers runs failed because the dev server hot-reloaded pages while files were being edited by other lanes; their output was deleted and the passing run used a server with file watching off. Scripts with `PLAYWRIGHT_CORE` unset (browser-shell, `shell-default-playwright.log`): pass, using the new devDependency.
Site screenshots, desktop 1440x900 and phone 390x844, in `site/`: front page, assets page, Back link, both demos opened by clicking their cards (URLs recorded in `site.log`), zero console errors, no horizontal overflow on the phone.

**Decisions and notes.**
- perseids card is built from the GMN card (CC BY 4.0), not the CAMS picture; credit "Meteor orbits: Global Meteor Network, CC BY 4.0" is in the footer. Counts use GMN: 25,588 orbits, 23,335 reliable.
- Earth and Moon globe thumbnails (480x240, `site/t-earth-2k.jpg`, `site/t-moon-orig-2k.jpg`) ARE shipped: the public-build alias only replaces the 2k texture modules, not HTML-referenced images, and the validator hashes whole files and base64 windows so low-resolution copies are not caught. This is a launch blocker for I-029 (NASA swap), not a validator pass.
- The README hero GIF and the Perseids card show the real star sky from the local-only Yale catalogue (terms not established as public domain). Owner to confirm that is acceptable to publish.
- The assets page row "Does the stream hit Earth on time" (0.29 deg, 58.8 km/s) still quotes the CAMS check; GMN equivalents were not recomputed.
- Owner decision (2026-10-16): MIT licence for the code only; pictures and data keep their own licences; local-only Earth and Moon pictures are not covered.

**Deploy notes for the owner.** Address `https://astraeus.curiouscode.ai/` (canonical and og tags use it; astraeus.anipatke.com may point at the same deploy). Import the repository in Vercel; `vercel.json` sets `ASTRAEUS_PUBLIC_BUILD=1 npm run build`, output `dist`, framework vite. Add the domain in Vercel and the DNS record at the registrar. Before pointing the domain, settle I-029 (Earth and Moon thumbnails) and the star-sky images. The public Perseids demo reads the shipped GMN copy `data/stories/perseids/gmn-iau-7.json`; the Geminids and CAMS data stay local. Nothing has been committed or deployed.


## Moved — 2026-10-17

Moved from O-011 to O-016 on the owner's direction (structured question: "Move the 2 site tasks, then you close the rest"): this is site work, filed under O-011 before O-016 existed. Its Task Check (C-036 or C-037) stands; the O-016 Full Objective Check covers it. The O-011 lane key was dropped because O-016 has no such lane.

## Drift Notes

For Design: the site/app page split.
