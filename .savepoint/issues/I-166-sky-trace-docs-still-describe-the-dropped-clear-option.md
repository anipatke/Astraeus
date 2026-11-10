---
id: I-166
title: Sky trace docs still describe the dropped "clear" option
type: drift
status: open
source:
  kind: check
  check: C-163
  actor: {role: checker, session: o065-check-20261110}
  at: '2026-11-10T04:56:00Z'
tasks: [T-297, T-298]
checks: [C-163]
guardrail_ids: [API-07, API-01]
severity: low
history:
  - at: '2026-11-10T04:56:00Z'
    actor: {role: checker, session: o065-check-20261110}
    kind: observed
    note: 'Low materiality; recommended to combine with the I-164/I-165 repair (a few lines of text).'
    check: C-163
  - at: '2026-11-10T16:20:00Z'
    actor: {role: executor, session: o065-repair-20261110}
    kind: repair_attempted
    note: 'Repair (executor evidence, not verified): removed every offer of after clear: the SkyFigureInput.shown doc comment, the CHANGELOG bad-sky-trace line (now after other than stay or fade, and names SkyTraceOptions and SkyClearOptions), run-browser.mjs step description, docs/BROWSER_CHECKS.md (Stay, Fade and Stay-then-Hide; the trace is read back through the sky-trace:<id> line set), Design.md Sky figures (8). api:lock unchanged. npm test, typecheck, lint, build and check:pack pass.'
---

# I-166: Sky trace docs still describe the dropped "clear" option

## Summary

The owner's "Add a hide request" decision (Objective Decisions, T-298 third build) dropped `after: "clear"` and added `handle.clearSkyTrace`. The code and the README are right (`after` is `"stay" | "fade"`; `"clear"` throws `bad-sky-trace`), but several published texts still describe the old option:

- `packages/astraeus/src/api/skyFigureInput.ts:23`, the public doc comment of `SkyFigureInput.shown` (shown on the generated API reference page): "`after` decides whether they stay, fade or clear".
- `packages/astraeus/CHANGELOG.md:27`: `bad-sky-trace` covers "an `after` other than the three"; and the same entry names only `SkyTraceOptions` as the exported type, while `SkyClearOptions` is also new on the front door (`src/api/index.ts`). API-01 asks for the CHANGELOG to follow a public-surface change.
- `packages/astraeus-site/tools/validate/run-browser.mjs:12` step description "the site trace control (stay, fade, clear)" and `docs/BROWSER_CHECKS.md:18` "(Stay, Fade, Clear)"; the browser-policy map should name the Stay, Fade, Hide scenarios the script now runs. The same map line and Design.md "Sky figures" (8) say the drawn trace is not read back, but the journey now waits for the `sky-trace:<id>` line set in `data-sky-lines` to appear and go.

A host reading the API page or the CHANGELOG would try `after: "clear"` and get `bad-sky-trace`.

## Evidence

- `grep -n "stay, fade or clear" packages/astraeus/src/api/skyFigureInput.ts` → line 23.
- `grep -n "the three" packages/astraeus/CHANGELOG.md` → line 27; `git diff main...o065-sky-figures -- packages/astraeus/src/api/index.ts` adds `export type { SkyClearOptions, SkyTraceOptions }`; `grep -n SkyClearOptions packages/astraeus/CHANGELOG.md` → no match.
- `src/core/skyTrace.ts`: `SKY_TRACE_AFTER = ["stay", "fade"]`; the checker's probe `checkedTrace("a", { after: "clear" }, ["a"])` → `bad-sky-trace`.
- `journey-look-out.mjs` `checkSkyTrace`: `for (const after of ["stay", "fade", "hide"])` with `waitForSkyLines(page, { present: [lines] })` / `{ absent: [lines] }` on `sky-trace:<id>`.

## Proof Needed

- No published text (doc comments, README, CHANGELOG, browser map, step description, Design) offers `after: "clear"`; the CHANGELOG names `SkyClearOptions`; the browser map lists Stay, Fade and Hide and says what the journey reads back.
