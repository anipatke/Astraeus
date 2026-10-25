# Browser validation policy

Owner decisions; read before browser validation or changes to its scripts. The scenario and driver map is [BROWSER_CHECKS.md](../BROWSER_CHECKS.md).

- **Browser checks (owner decisions 2026-10-17 to 2026-10-23; map in `docs/BROWSER_CHECKS.md`).**
  - The one browser command, `npm run check:browser` (smoke, two journeys, two public-build file checks), runs once per Full Objective Check. There are no demo sets.
  - Never run it twice for one change; a later check reuses the earlier run (owner, 2026-10-20: "Didnt we say we WOULDNT run these checks isnt that the point of this objective").
  - No per-Task browser runs unless the Task changes the browser scripts or runner. Screen parts, scene sums and demo rules are proved in the fast suite (`npm test`).
  - Headless runs never replace the owner's visual judgement where an Objective requires it.
- **Browser checks never take or save screenshots** (owner, 2026-10-18, T-102). A check that must prove something is drawn reads the scene's own readouts through `packages/astraeus-site/tools/validate/driver.mjs`; the driver guard fails any `.screenshot(` call. The owner judges looks on the preview (`localhost:5490`).
- **Browser regression maintenance.** When a UI change breaks a browser script, update it or name a runnable replacement and map each prior scenario in `docs/BROWSER_CHECKS.md`.
- **Browser scripts use the shared interface driver.** Scripts under `tools/validate/` touch the interface only through `packages/astraeus-site/tools/validate/driver.mjs`; an interface change is repaired there, never in the scripts. `driver-guard.mjs`, run by `tests/browserDriverGuard.test.ts`, fails the tests on direct selectors or clicks (O-020 T-083).
- **Historical evidence preservation.** Fresh browser validation writes to a distinct run directory rather than overwriting earlier results. Record the output path, command, time and result; any deliberate replacement of a cited run folder needs an explicit owner decision.
- **Evidence retention (O-037 T-123, owner 2026-10-21).** A browser run keeps only `summary.txt` and each step's `results.json` under `docs/evidence/browser-<stamp>/`; step logs and server logs go to a scratch folder whose path the summary prints. A run folder no Check, Task, Issue or Design note cites may be removed at the next clean-up; a cited folder is kept whole.
