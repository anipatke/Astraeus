---
id: I-165
title: The look-out browser step failed on the phone in the full run and runs far over its time limit
type: verification
status: open
source:
  kind: check
  check: C-163
  actor: {role: checker, session: o065-check-20261110}
  at: '2026-11-10T04:56:00Z'
tasks: [T-298]
checks: [C-163, C-164]
guardrail_ids: [TEST-01]
severity: medium
history:
  - at: '2026-11-10T04:56:00Z'
    actor: {role: checker, session: o065-check-20261110}
    kind: observed
    note: 'The official browser run failed this step at 375x667; one focused rerun of the step alone passed (59 s). Cause not established; treated as an intermittent failure of a step O-065 extended. The re-check browser run must pass it.'
    check: C-163
  - at: '2026-11-10T16:20:00Z'
    actor: {role: executor, session: o065-repair-20261110}
    kind: repair_attempted
    note: 'Repair (executor evidence, not verified): cause from code, not reproduced: expandDeveloperGroups counted closed folds then re-resolved closed.first() for the click, so a panel re-render between the two left the click waiting 30 s. It now finds and presses the fold in one page.evaluate (every caller), with a frame between presses. The step also closes the site trace control after the traces, and opens the scene with skyTraceSeconds=0.5 (new optional address setting of the site trace control, default 2 s) so the traces run quickly. Focused journey-look-out on scratch port 5199 (stopped): three runs in a row exit 0 at both sizes, 41 s each (59 s before). Still over the 30 s limit in gate-limits.json, not changed; 50 s proposed to the owner. docs/BROWSER_CHECKS.md updated. Not run: full check:browser.'
  - at: '2026-11-10T05:30:00Z'
    actor: {role: checker, session: o065-recheck-20261110}
    kind: rechecked
    note: 'C-164 re-check: Proof Needed met. Official check:browser run (docs/evidence/browser-20261110T051452Z) passes look-out at 1280x720 and 375x667 in 43 s (limit 50 s, owner); driver expandDeveloperGroups finds and presses a fold in one page.evaluate; the journey closes the site trace control before the O-064 part; gate-limits.json and docs/BROWSER_CHECKS.md state the limit and measured time. Stays open only because C-164 is NEEDS WORK (on I-164); close as verified at the clearing re-check.'
    check: C-164
---

# I-165: The look-out browser step failed on the phone in the full run and runs far over its time limit

## Summary

O-065 T-298 extended `journey-look-out.mjs` with the sky switches and the trace control (two figures, Stay, Fade and Stay-then-Hide each, at both sizes). In the Full Objective Check's one `npm run check:browser` run the step passed at 1280x720 and failed at 375x667: after the new sky checks, the O-064 part of the journey calls `ui.waitForCameraReading` (line 121), which opens the Developer drawer, and `expandDeveloperGroups` (`driver.mjs:466`) timed out after 30 s waiting for `[data-developer-panel] [data-fold-toggle][aria-expanded="false"]`. That function counts the closed folds and then clicks `closed.first()`; if the closed fold disappears or is re-created between the count and the click, the click waits for 30 s. The step still has the trace control open when it reaches that line (it is opened by `setSkyTraceOpen(page, true)` and never closed), and the Developer drawer's Labels fold gained the new sky colour group in T-296. Which of these, if any, causes the miss is not established.

The step also runs far over its time limit: 90 s in the full run (with the 30 s timeout) and 59 s alone, against `tools/gate-limits.json` `look-out: 30` (the docs/BROWSER_CHECKS.md table says 18 s alone). A limit only warns, but `docs/agents/build.md` says to look at why before raising it; T-298 added the trace waits without updating the limit or the table.

## Evidence

- `npm run check:browser`, 2026-11-10T04:47:26Z to 04:52:44Z on 79ba2307: `look-out | ... | exit=1 | 90s | limit 30s`, `WARNING: step look-out took 90s, over its limit of 30s`. `docs/evidence/browser-20261110T044726Z/look-out/results.json`: desktop result present (`lineSets: ["sky-boundaries"]`, opened at Earth, Mars reading, zoom 29.21), phone failure `locator.evaluate: Timeout 30000ms exceeded ... waiting for locator('[data-developer-panel] [data-fold-toggle][aria-expanded="false"]').first() at expandDeveloperGroups (driver.mjs:468) ... toggleDeveloper (driver.mjs:478) ... openDeveloper (driver.mjs:492) ... waitForCameraReading (driver.mjs:1904) ... journey-look-out.mjs:121`.
- Focused rerun by the checker (dev server on 5199, `ASTRAEUS_URL=http://localhost:5199/app.html node packages/astraeus-site/tools/validate/journey-look-out.mjs`, nothing else running): exit 0 in 59 s, both sizes. Output in the checker's scratchpad only.
- T-298 evidence: "Focused `journey-look-out` on scratch port 5199 (stopped): ok first run at 1280x720 and 375x667"; no full `check:browser` run before this Check.

## Proof Needed

- The re-check's one `npm run check:browser` run passes `look-out` at both sizes.
- The step leaves no open site control behind before the O-064 part of the journey (or the journey shows it does not matter), and `expandDeveloperGroups` clicks a fold it has just found rather than re-resolving a locator that may no longer match (strategic fix: the shared driver, so every script benefits).
- `tools/gate-limits.json` `look-out` and the `docs/agents/build.md` / `docs/BROWSER_CHECKS.md` time rows state a limit and time measured after T-298, with the reason, or the step is made faster.

Owner decision 2026-11-10 (coordinator session o065-run-20261110): the look-out step's warn limit in `tools/gate-limits.json` raised 30 -> 50 s ("Raise to 50 s"); measured 41 s alone after the repair; `docs/BROWSER_CHECKS.md` row updated.
