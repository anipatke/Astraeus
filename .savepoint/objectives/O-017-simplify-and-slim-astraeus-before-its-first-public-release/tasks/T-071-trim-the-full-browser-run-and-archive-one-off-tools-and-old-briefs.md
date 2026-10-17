---
id: T-071
title: Trim the full browser run and archive one-off tools and old briefs
objective: O-017
status: done
depends_on: [{task: T-067, requires: clear}, {task: T-068, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o017-plan-20261017}
---

# Trim the full browser run and archive one-off tools and old briefs

## Outcome

The lite check is proven to catch a broken page, the full browser run is cut to the few scripts that check something neither the lite check, the pictures nor the owner's eyes can, an owner contact sheet makes a 10-second visual look possible, and one-off tools and superseded briefs are archived.

## User Check

One page shows every experience at both sizes for a 10-second look. The full run's summary shows its time well under 20 minutes. A short page lists each removed or moved scenario and where it is now covered.

## Done When

1. Lite check (`tools/validate/browser-lite.mjs`, I-033 step 1): a negative probe shows it fails on a deliberately broken experience (for example a thrown error or a blank canvas), then passes again.
2. Owner direction (2026-10-17): "One 10sec visual inspection beats 40mins of auto browser checks." Keep automated only what eyes cannot judge: crashes and console errors on every page (lite), licence and shipped-data rules (public build, public showers), data correctness and credits that a picture cannot show, and pixel comparison against the before set. Everything else moves to an on-request set or is removed, with each scenario mapped. Target: the trimmed full run under 10 minutes.
3. Contact sheet: the picture tool also writes one HTML or PNG page showing all experiences at desktop and phone side by side with the before set and the differing-pixel figure, so the owner can look in about 10 seconds. `capture-experience-pictures.mjs` and `diff-screenshots.mjs` stay (they are the picture check).
4. Full run trimmed (I-033 step 2): Perseids and Geminids check the phone layout once instead of repeating every scenario; the sky check samples representative experiences; measurement-only scripts (`browser-marker-existing.mjs`, `browser-precision.mjs`) move to an on-request set; quick scripts may run two at a time. Every prior pass/fail scenario is mapped to where it is still asserted (project rule "Browser regression maintenance").
5. A committed full-run script (the checker's `check-run.sh` pattern) runs the trimmed set into a fresh evidence directory and prints a summary; the measured time is recorded.
6. Archive: one-off tools (`tools/validate/capture-apollo-compare.mjs`, `tools/validate/conversion-proof.mjs`, and any other the Task 1 list names) and superseded briefs (`docs/*_BRIEF.md`) move to an archive folder or are removed with a reason; nothing still referenced by a test, script or page is removed.
7. I-033 Proof Needed met; AGENTS.md project rule names the trimmed full set.
8. Gates: typecheck, tests, both builds, the trimmed full run, zero console errors. The `tests/listedOrbitGroup.test.ts` frame-time assertion, which flaked twice under load in O-017, is made robust or moved out of the default test run, with the reason.

## Context Files

`tools/validate/browser-lite.mjs`, `tools/validate/browser-showers.mjs`, `tools/validate/browser-sky.mjs`, `tools/validate/browser-marker-existing.mjs`, `tools/validate/browser-precision.mjs`, `docs/evidence/objective-check-20261016T190443Z/check-run.sh`, `docs/evidence/objective-check-20261016T190443Z/summary.txt`, `.savepoint/issues/I-033-add-a-lite-browser-check-tier-for-everyday-changes.md`, `AGENTS.md`.

## Design References

Design.md tools/validate row.

## Guardrails

TEST-01, TEST-03, STYLE-10.

## Implementation Plan

1. Prove the lite check fails on a broken tree.
2. Trim the two shower scripts and the sky script; map scenarios.
3. Move measurement-only scripts; add the full-run script.
4. Archive tools and briefs.

## Boundaries

No app code changes.

## Technical Verification

Trimmed full run timing and scenario map. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Run 2026-10-17 by the builder (executor) session; no app code changed. Evidence directories under `docs/evidence/`.

**Per criterion**
1. Lite negative probe: with `throw new Error("negative probe...")` appended to `src/experiences/jupiter-io/jupiterIo.ts` (temporary, restored byte-identical from a copy; `git diff` of the file empty), `browser-lite.mjs` exited 1 with FAIL on jupiter-io desktop and phone (canvas missing, shell missing, heading, pageerror). Evidence `o017-t071-lite-probe-broken-20261017T005354Z/run.log`. Restored tree: exit 0, 26/26 loads, `o017-t071-lite-probe-restored-20261017T010041Z/`.
2. Kept automated: crashes and console errors (lite), licence and shipped data (`public-build-assets`, `browser-public-showers`), numbers and credits (spike02, shell, anchor-labels, synthetic, ring, listed, earth-moon, jupiter-io, story-panels, trimmed showers, sky), pixel comparison. Full run measured 509 s (8 min 29 s) with servers and public build included: `o017-t071-full-20261017T020209Z/summary.txt`, all 20 steps exit 0, zero console errors.
3. Contact sheet: new `tools/validate/contact-sheet.mjs`, run by the full run; sheet `o017-t071-contact-sheet-20261017T021053Z/contact-sheet.png` (10 views, before beside after, desktop and phone, differing-pixel figure; 0 flagged; max 0.0231% over 16 levels against tolerance 0.024%; assets page differs in size by design). `capture-experience-pictures.mjs` and `diff-screenshots.mjs` unchanged. Pictures drift past the tolerance when taken under load (0.0455% measured with lanes running; 0.0234% alone), so the runner takes them first and alone.
4. Trim: showers phone run keeps plain load, peak, details, credits, counts, window; Geminids runs `ASTRAEUS_LIGHT=1`; sky samples Apollo at both sizes; `browser-marker-existing`, `browser-precision`, `browser-sun`, `browser-synthetic-belt`, `browser-synthetic-eccentric` moved to `tools/validate/on-request/`; every scenario mapped on `docs/BROWSER_CHECKS.md`. The lane split runs three scripts side by side.
5. `tools/validate/run-full.sh` committed (untracked until the owner commits); measured time above.
6. Archived to `tools/archive/validate/`: `conversion-proof.mjs`, `anchor-consistency.mjs`, `capture-apollo-compare.mjs` (no importer; data strings that name the old path left as data). `docs/*_BRIEF.md` (4) moved to `docs/archive/`, doc links updated. `capture-site-pictures.mjs` and `tools/apollo11/` stay (referenced by Design and `package.json`).
7. I-033 Proof Needed: lite script passes (item 1, run record above); AGENTS.md project rule "Scene-affecting fuller gate" now names the trimmed full set and contact sheet; lite pass recorded in fresh directories. Issue left open for the owner.
8. Gates (`o017-t071-gates-20261017T014414Z/`): `npx tsc --noEmit` exit 0; `npm test` 48 files, 885 passed, 1 skipped (the perf test, on request); `npm run build` exit 0; public build + `public-build-assets.mjs` exit 0. `tests/listedOrbitGroup.test.ts`: frame-time assertions now run only with `ASTRAEUS_PERF=1` (passes when run: 21/21); the default run keeps a finite-positions fill test and the bit-identical test.

**Script races found by the earlier trial runs and fixed (not app defects):** `browser-showers.mjs` phone Pause click intercepted by an auto-opened story panel (now a DOM click); `browser-spike02.mjs` range-continuity bound used the gap between two reads taken at different moments (bound now spans first read to last read); `browser-story-panels.mjs` read open panels before the click's render (now waits for the panel). Trial runs: 602 s (before the sky cut), 530 s, 508 s, 479 s, then the final green 509 s.

**Commands:** `tools/validate/run-full.sh`; `node tools/validate/browser-lite.mjs`; `npx tsc --noEmit`; `npm test`; `npm run build`; `ASTRAEUS_PUBLIC_BUILD=1 npx vite build --outDir <scratch>` + `node tools/validate/public-build-assets.mjs`; `node tools/validate/capture-experience-pictures.mjs`, `diff-screenshots.mjs`, `contact-sheet.mjs`. Servers on 5479 and 5480 stopped (verified no listener).

**Extra reads (logged):** `tools/validate/browser-{spike02,spike03,shell,anchor-labels,view-link,public-showers,synthetic*,sun,earth-moon,jupiter-io,story-panels}.mjs` headers and assertion lines to map scenarios; `docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md` row X5; `.savepoint/Design.md` tools/validate rows; `tests/sunLook.test.ts`, `tests/bodyMarkers.test.ts` headers (to name unit coverage); `package.json`, grep for references to archived tools.

**Limitations:** the full run's time varies 8 to 10 minutes with machine load (other sessions' servers were running). The phone and desktop pixel tolerance needs a quiet machine. Earlier run directories `o017-t071-full-20261017T0102*`, `...011307Z`, `...012411Z`, `...013441Z`, `...014452Z`, `...015346Z` are trial runs kept as history. Not run: the on-request scripts after the move (path comments updated only; no code changed).

## Drift Notes

Design tools/validate row (Task 7): Design.md still lists `browser-lighting.mjs`, `browser-showers-gmn.mjs`, `browser-sky-map.mjs` (no longer present), the archived tools as live, the on-request move, `run-full.sh`, `contact-sheet.mjs` and the trimmed showers/sky; T-072 reconciles these (deferred here, named integration Task T-072).

## Owner Completion — 2026-10-17

Marked done on the owner's standing instruction ("yes, mark each clear step done and keep going") after Quick Task Check C-052 CLEAR.
