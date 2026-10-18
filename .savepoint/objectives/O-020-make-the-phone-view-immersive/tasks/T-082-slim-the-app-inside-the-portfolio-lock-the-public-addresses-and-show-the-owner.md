---
id: T-082
title: Slim the app inside the portfolio, lock the public addresses and show the owner
objective: O-020
status: in_progress
stage: audit
depends_on: [{task: T-081, requires: clear}, {task: T-086, requires: clear}, {task: T-090, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o017-orchestrator-check-20261017}
---

# Slim the app inside the portfolio, lock the public addresses and show the owner

## Outcome

When the app runs inside another page (the owner's portfolio), its bar is as slim as the "Inside the portfolio" mock-up; its controls stay reachable inside the frame.

## User Check

Open the portfolio's Astraeus section: the app's bar sits slim under the story buttons; full screen shows the full layout. Then a look at every experience on a laptop and a phone.

## Done When

Revised 2026-10-18 at start, per the Planning Note (the launch line-up moved the address lock and the new picture baseline to O-024 T-093):

1. Embedded look per the approved mock-up (O-020 Decision 5): detected when the page is framed (or an address flag, decided here and recorded), slimmer bar and timeline; full screen unchanged.
2. A browser check opens each demo inside a test frame (as the portfolio's `components/astraeus/AstraeusBridge.tsx` embeds it, read-only reference) and alone, and asserts the embedded look, the shared controls still reachable, and zero console errors; added to `run-full.sh`.
3. Design.md shell section reconciled with the T-079, T-080, T-081, T-083, T-084, T-085, T-086 and T-090 Drift Notes (each reflected or recorded as non-architectural with a reason); `docs/BROWSER_CHECKS.md` updated.
4. Gates and the full run on the final tree.
5. Owner validation: the owner looks at every demo on a laptop and a phone (preview now, and the live site after merge).

## Context Files

`src/shell/AstraeusShell.tsx`, the shell stylesheets, `tools/validate/run-full.sh`, `docs/BROWSER_CHECKS.md`, `docs/evidence/o017-baseline-20261017/README.md`, `.savepoint/Design.md`, `.savepoint/objectives/O-020-make-the-phone-view-immersive/Objective.md`.

## Design References

Design.md shell; the approved mock-ups https://claude.ai/artifact/Akgz8SgcZBq1jCy15aPqoS.

## Guardrails

ARCH-01, ARCH-02, TEST-01, TEST-03.

## Implementation Plan

1. Embedded detection and slim styles.
2. Address check; pictures; Design reconciliation.
3. Owner look; new baseline.

## Boundaries

No new features; desktop and phone layouts as built by T-079 to T-081.

## Technical Verification

Configured gates, lite, the address check, pictures, full run. Evaluated under `agent-skills/references/check-method.md`.

## Owner Notes — 2026-10-18

On the local preview the owner checked the phone layout on a real phone ("2 good") and will test again on the live site after the merge ("will test in live as well later after merge").

## Planning Note — 2026-10-18

The launch line-up changed (G-005 Launch Definition of Done): three demos (Apollo, Showers, Jupiter), Earth–Moon dropped, and the old shower and Earth–Moon addresses deliberately left to break (owner). Locking the five public addresses and the new picture baseline therefore move to O-024, which sets the final addresses; when T-082 is started, its Done When is revised to the portfolio slim view and the owner's laptop-and-phone look only.

## Evidence — 2026-10-18 (lane o020-t082)

**Decision: framed detection, not an address flag.** `src/shell/embedded.ts` (`window.self !== window.top`, any doubt counts as framed); the shell sets `data-embedded`, `src/shell/embedded.css` slims the bars. The portfolio's embedded addresses are public and fixed, so the app must recognise a frame by itself. Full screen has `data-embedded="false"` and no rule applies.

1. Embedded look: desktop frame controls 30 px (36 alone; 44 kept on touch), top bar 50 to 38 px, timeline 52 to 38 px and closer to the edge; a phone-sized frame keeps pill, drawers and 44 px targets, tighter margins, timeline 126 to 118 px. The approved mock-up file was gone after the reboot; worked from O-020 Decision 5 and the portfolio's real embed (iframe full width, 660/580/460 px high). Owner look decides the exact slimness.
2. `tools/validate/browser-embedded.mjs` (driver: `openInPortfolioFrame`, `embeddedLook`, `FRAMING_BROWSER_ARGS`), in `run-full.sh` lane B: five demos (Apollo, Showers Perseids and Geminids, Earth-Moon, Jupiter-Io) framed and alone at laptop and phone; play/pause, speed, object list, Events (Apollo), Developer cog work in the frame; zero console errors. Result `docs/evidence/o020-t082-20261018/embedded.log`: 10/10 ok, zero console errors.
3. Design.md: shell row updated and a new "Shell layout (O-020)" paragraph accounts for the T-079, T-080, T-081, T-083, T-084, T-085, T-086 and T-090 notes (all reflected; the T-081 Developer-panel exclusion and safe-area limit stated; T-079 browser-script default evidence folders and T-084 showers whole-orbit assertion are test tooling, non-architectural, left to their Issues). `docs/BROWSER_CHECKS.md` updated.
4. Gates: `npx tsc --noEmit` clean; `npx vitest run` 66 files, 1022 passed, 1 skipped (one earlier run had a single transient failure under machine load, passed on rerun, not reproduced); `npm run build` ok; driver guard ok. Handoff tier (lite, per orchestrator process change): `browser-lite` 28/28 loads, `browser-shell`, `browser-phone`, `browser-controls`, `browser-embedded` all exit 0, error-lines 0; `docs/evidence/o020-t082-20261018/summary.txt`. Full run deferred to the orchestrator's batch run on the final tree (Done When 4 met there).
5. Owner look: pending (laptop and phone, preview then live).

**Drift Notes.** (a) Chromium blocks a local app framed by another origin (local-network access); the check launches with `--disable-features=LocalNetworkAccessChecks,...`; the live portfolio is not affected. (b) The stand-in page needs a viewport meta, else a mobile context lays the frame out at 980 px (as the real portfolio does). (c) The portfolio still links `shower-perseids`/`shower-geminids` addresses that differ from `?experience=showers`; those fixed addresses are T-093's concern. (d) Design.md updated here, so no deferred notes remain for T-079 to T-090.

## Owner Look — 2026-10-18

On the preview: full screen on laptop and phone "Looks good", with the phone timeline to slim further ("quite a bit of space above the pause play buttons same below the timeline", phone only); after the slimming (ab1fcb2): "looks good". The embedded look is judged again in the live portfolio after the launch update. Owner validation met; the Task is marked done after its Quick Check on the batch full run.
