---
id: I-071
title: Retired public-showers and stream-dot scenarios are mapped to a smoke check that does not run them
type: verification
status: resolved
source:
  kind: check
  check: C-098
  actor: {role: checker, session: o038-full-check-20261022}
  at: '2026-10-22T20:46:00Z'
tasks: [T-145, T-146, T-147]
checks: [C-098, C-099]
guardrail_ids: [TEST-01]
severity: medium
resolution:
  disposition: verified
  check: C-099
  actor: {role: checker, session: o038-full-recheck-20261022}
  at: '2026-10-22T21:02:00Z'
  reason: 'smoke-public-showers runs browser-smoke.mjs on the scratch public build (preview on 5480) and drew the shipped stream in 6/6 loads; smoke and the meteor journey require stream dots (stream-check.mjs, tests/streamCheck.test.ts); negative probe with both shipped gmn-iau files removed from a scratch public build failed 6/6 on 0 dots in view while bodies and paths were drawn; BROWSER_CHECKS.md rows updated. Run docs/evidence/browser-20261022T205738Z.'
history:
  - at: '2026-10-22T20:46:00Z'
    actor: {role: checker, session: o038-full-check-20261022}
    kind: observed
    check: C-098
    note: Found by the O-038 Full Objective Check while spot-checking Success Condition 4 mappings against what browser-smoke.mjs and the runner actually do.
  - at: '2026-10-22T21:02:00Z'
    actor: {role: checker, session: o038-full-recheck-20261022}
    kind: rechecked
    check: C-099
    note: 'smoke-public-showers runs browser-smoke.mjs on the scratch public build (preview on 5480) and drew the shipped stream in 6/6 loads; smoke and the meteor journey require stream dots (stream-check.mjs, tests/streamCheck.test.ts); negative probe with both shipped gmn-iau files removed from a scratch public build failed 6/6 on 0 dots in view while bodies and paths were drawn; BROWSER_CHECKS.md rows updated. Run docs/evidence/browser-20261022T205738Z.'
---

# I-071: Retired public-showers and stream-dot scenarios are mapped to a smoke check that does not run them

## Summary

O-038 Success Condition 4 says every scenario of a retired script is mapped to the node test that proves it, "the smoke or journey check that covers it", or the owner's look. Some rows mapped to **S** (smoke) are not covered by the smoke check:

1. **The public build is never opened in a browser.** `browser-public-showers.mjs` was the only browser step that ran against the scratch public build (`run-demo.mjs` at 21085122, step `public-showers`, `public: true`). It asserted, in the built site, that the stream loads from the shipped copy (`data/stories/<shower>/gmn-iau-*.json`, HTTP 200), that no `data/local/` or CAMS file is served, that one stream group is drawn, and the panel credits. T-146 maps the runtime parts (PS1 "the request log", PS3 "zero console errors") to S. But `run-browser.mjs` has no browser step with `public: true` (only the two `noBrowser` file checks), so `runner.mjs` `startServers` never starts the preview server and the smoke check loads only the dev server (`ctx.devUrl`, port 5479). On this machine the dev server reads the fetched `data/local/gmn-iau-4.json` and `gmn-iau-7.json`, not the shipped copy, so the public site's own load path is now unchecked by anything.
2. **No browser check requires the stream to be drawn.** W18 ("plain load shows the stream, over 50 dots"), W22 ("stream visible at start, peak, end and zoomed out") and W10/W12's "dots drawn" are mapped to S ("dots in view"). `browser-smoke.mjs` `drawsSomething` passes when `bodies + dots + paths > 0`, and `journey-meteor-shower.mjs` asserts the same sum. A showers view whose stream fails to load still mounts the Sun, Earth, planets and six path lines, so both pass with `dots: 0` (the absent-orbits case keeps the bodies: `demoShowers` "when the orbits are absent, still lists the stream ... mountedBodiesOf(...) equal").

`docs/BROWSER_CHECKS.md` repeats these rows ("`browser-showers`, `browser-public-showers` ... the swap and the dots S, J").

## Evidence

- `tools/validate/run-browser.mjs` lines 7-13: the public steps are `public-build-assets` and `public-addresses`, both `noBrowser: true`.
- `tools/validate/runner.mjs` lines 54 and 61: `needsPreview = steps.some((s) => s.public && !s.noBrowser)` is false, so no preview server.
- `tools/validate/browser-smoke.mjs` lines 35-45: `content = d.bodies + d.dots + d.paths`.
- `tools/validate/journey-meteor-shower.mjs` line 28: the same sum.
- Fresh run `docs/evidence/browser-20261022T204336Z` (C-098): smoke 14 loads on the dev server only, no preview log.
- `git show 21085122:tools/validate/browser-public-showers.mjs` lines 51-80 (the retired public-build assertions).
- `.savepoint/objectives/O-038-*/tasks/T-146-*.md`, rows PS1, PS3, W10, W12, W18, W22.

## Proof Needed

Either (a) the browser command proves these in the browser: the smoke check (or one public step) opens the showers views on the scratch public build and fails when the stream's dots are not in view for a view that declares a point group, with a negative probe (for example the shipped orbit file removed from the scratch build) showing it fails; or (b) the rows in T-146 evidence and `docs/BROWSER_CHECKS.md` are re-mapped honestly (for example "owner's look on the public preview") and the owner accepts the lost public-build browser coverage. Then a recheck of O-038.
