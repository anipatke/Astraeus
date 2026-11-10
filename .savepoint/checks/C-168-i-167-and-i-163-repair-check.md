---
id: C-168
scope: {kind: release, id: G-018}
result: CLEAR
checked_by: {role: checker, session: release-0-9-0-issue-check-20261111}
executed_session: release-0-9-0-builder
checked_at: '2026-11-10T21:20:00Z'
reviewed:
  base_commit: 5c46ffe5
  head_commit: 5c46ffe5
  files: [packages/astraeus/src/core/readBytes.ts, packages/astraeus/src/core/bodies/moonSystem.ts, packages/astraeus/src/assets/sky.ts, packages/astraeus/src/api/story.ts, packages/astraeus/tests/timelineRateWarning.test.ts, packages/astraeus/tests/hygStars.test.ts, packages/astraeus/tests/sky.test.ts, packages/astraeus-data-constellations/tests/constellations.test.ts, tools/check-node-consumer.mjs, vitest.config.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, .savepoint/Design.md, .savepoint/issues/I-167-a-node-app-cannot-load-the-star-list-for-star-end-figures.md, .savepoint/issues/I-163-settimeline-takes-a-rate-in-milliseconds-without-a-word.md]
  dependencies: []
issues: []
supersedes: null
---

# C-168: I-167 and I-163 direct repair check

**What this checks.** Two direct Issue repairs, uncommitted in the working tree on `release-0-9-0` over HEAD `5c46ffe5`: I-167 (a Node app cannot load the star list for star-end sky figures) and I-163 (`setTimeline` takes a rate in milliseconds without a word; coordinator rule: warn, never throw). No Objective owns them; scoped to the router's Goal G-018 as C-123 was (the loader accepts only task, objective or release scopes). Quick method, each Issue judged against its own Proof Needed.

**Independence.** This session did not plan, build or repair this work. It wrote only scratch probes and logs (scratchpad), the browser evidence folder below, this record and the two Issue resolutions. It did not repair code, commit, push, edit the router, or read or touch `docs/prds/` or `docs/research/`.

**Verdict: CLEAR.** Both Proof Needed scenarios hold, independently probed; all gates pass. No Issue admitted.

## I-167: star list in Node

Proof Needed: a Node test with no `fetch` stub, a star-end figure passes `scene.load()` from the packed engine, and `unknown-star` is still thrown for an id not in the list.

| Probe | Expected | Actual |
|---|---|---|
| `check:node-consumer` (packed engine + packed constellations, Vitest in Node): `constellations(['Ori'], {outlines:true})`, `check()`, `load()`; unknown HIP 2,000,000 | resolves; `unknown-star` | pass (11/11 tests) |
| Independent, plain Node (no Vitest), packed `dist` linked, `globalThis.fetch` replaced by a function that throws: UMa+Cas+Cyg; all 88 with outlines | resolves without fetch | OK, OK |
| Same: a figure with a known star (27989) and an unknown one (99999999) | `unknown-star` naming the star | `unknown-star addSkyFigures("x"): star 99999999 is not in the star list` |
| Same: position-only ends (no star list needed) | resolves | OK |
| Mutation: copy of packed `sky.js` with the old `fetch(url)` read restored, Orion in plain Node | fails, proving the probe catches the trap | `missing-data ... the engine's star list could not be read` |
| Packed address form | `new URL("./stars/hyg-v42-naked-eye.json", import.meta.url).href` (a `file:` URL in Node, a served URL in a bundler) | as expected in `dist/src/assets/sky.js:5` |
| Browser path (fetch over http) | star list loads in a bundled app | `check:browser` `hello-sky` (packed engine and constellations tarballs, Orion traced) and `look-out` pass |
| Moon chunks (same reader, moved) | unchanged behaviour | `check:node-consumer` cold-start Jupiter case passes; `npm test` passes; `planets-phone` and `smoke` browser steps pass |

Flagged points weighed:
- **vitest plugin** (`vitest.config.ts`): turns only `.json?url` imports into the file's own `file:` address under test; the only such import in engine source is `sky.ts`. It mirrors what `build-packages.mjs` emits for the packed package, so tests now see the Node consumer's shape. The http/fetch branch for the star list is no longer exercised by `npm test`; it is covered by `check:browser` (hello-sky, look-out) and the shared reader's moon-chunk tests. Acceptable.
- **Moon chunk error text** lost its `moon fit chunk` prefix (now `<url>: HTTP <status>` / `<url>: this runtime cannot read a file: address`). `git grep "moon fit chunk"` finds no test, README, CHANGELOG, Design or doc that relies on the old text (only the CHANGELOG prose naming the chunks and an unrelated `moonSystem.ts:83` message). The URL in the message still identifies the file. Not an Issue.

Result: **Proven.**

## I-163: rate unit warning

Proof Needed: a planner-decided general rule; a test plants the T-293 shape (`rate: 86_400_000` over 120 days) and shows the rule catches it, while existing scenes' rates still pass. Rule chosen by the coordinator: warn (`console.warn`), never throw, when `rate` or an offered rate crosses the whole span in under one real second.

| Probe | Expected | Actual |
|---|---|---|
| `tests/timelineRateWarning.test.ts` (T-293 shape, one fast offered rate, right units, 2 h at 7200 s/s, `none:true`, journey scene) | per test | pass (in `npm test`) |
| Independent, packed engine in Node: T-293 shape with ISO-string moments | one warning naming unit and both values, no throw | warns once, `rate 86400000, 604800000 is in simulated seconds per real second ...` |
| Same with `Date` moments; `rates` only; negative `rate: -DAY_MS` | warn | warn (abs value used) |
| Boundary: 7200 s span at 7201 s/s | warn (just under 1 s) | warn; at 7200 (exactly 1 s) no warn (repo test) |
| Sane rates; `{none:true, rate: DAY_MS}` (no span) | no warn | no warn |
| `rate: 0` | still `bad-timeline` | `THROW bad-timeline` |
| Existing scenes | no warning | `npm test` output has no such warning; `check:browser` logs (every public page and demo view, examples) have none |
| Bypass | only one entry point | `timelineOf` is reached only from `PlanTimeline.setTimeline` (`api/planTimeline.ts:23`), which `Scene.setTimeline` calls |

Documented in the README `setTimeline` row, CHANGELOG Unreleased and Design.md (Headless use paragraph). Pacing rates are not warned on: the Proof Needed names `rate` and offered rates only, so this is an observation, not a gap.

Result: **Proven.**

## Gates

All run fresh in this session on the working tree:

| Gate | Result |
|---|---|
| `git diff --check` | pass |
| `npm run lint` | pass |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm test` | pass, 248 files, 3669 passed, 2 skipped, 39.7 s |
| `npm run check:engine-alone` | pass |
| `npm run check:pack` | pass |
| `npm run check:node-consumer` | pass (11 tests) |
| `npm run check:browser` | pass, total 311 s (limit 320 s), all 12 steps exit 0, error-lines 0; evidence `docs/evidence/browser-20261110T210817Z` |

## Materiality

No Issues; no materiality actions required.

## Observations (non-blocking)

- Pacing span and rule rates are not checked against the span; a host could still give a pacing `rate` in milliseconds. A future extension if the owner wants it.
- The `Scene.setTimeline` doc comment (`api/scene.ts:502`, the generated reference) does not mention the warning; the README row does.
- `check:browser` total was 311 s against a 320 s limit, close to the warning line (the owner's preview server on 5490 was running alongside).
- Timestamps: the builder's `repair_attempted` entries are stamped `2026-11-11T08:10:00Z`, which matches local time (UTC+11), not UTC; this session's entries use real UTC (`2026-11-10T21:...Z`) and so sort before them by time though appended after.

## Code Style Review

- [x] STYLE-01 **One job per file** — `core/readBytes.ts` holds only the bundled-file reader.
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches** — warning branches and the `file:` read are tested; the http error branch of `fetchBytesOf` only through existing moon-chunk tests.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** — the duplicate reader is avoided by moving it to one module.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs** — 13 files, +63 / -35, plus two new files.
