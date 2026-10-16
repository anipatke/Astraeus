---
id: C-017
scope: {kind: task, id: T-046}
result: CLEAR
checked_by: {role: checker, session: o014-orchestrator-check-20261011}
executed_session: o014-t046-sonnet-executor-20261011
checked_at: '2026-10-11T10:30:00Z'
reviewed:
  base_commit: 57db960
  head_commit: 57db960
  files:
    - src/core/scalePolicy.ts
    - src/shell/scaleModel.ts
    - src/shell/ScaleControl.tsx
    - src/shell/AstraeusShell.tsx
    - tests/core.test.ts
    - tests/controls.test.ts
  dependencies: []
issues: []
supersedes: null
---

# C-017: T-046 Task Check (Quick)

Independence: orchestrator checker session; T-046 was built by a separate Sonnet executor sub-session.

## Scope Lock

1. Done When 1–4 of T-046; ARCH-02, PROV-01, TEST-01, TEST-03, STYLE.
2. Changed files in `reviewed.files` (working tree over 57db960).
3. Out of scope: wiring choices and factors into `ExperienceDefinition`, and passing body ids from `BodyView` (T-047).

## Outcome Coverage

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Positions equal True exactly; `mapRadius(r, id)` = True × factor; default without id; factor finite ≥ 1; explanation states factors | Proven | `src/core/scalePolicy.ts:66`; executor tests in `tests/core.test.ts`; checker probe: three vectors including 1 AU and 1e12 km byte-equal to True; earth ×500, unlisted moon ×100, no id ×100, sun ×1; factors 0.999, 0, −1, NaN, ∞ rejected for both default and per-body; negative radius and NaN position still rejected; explanation names both factors; policy frozen |
| 2 | `ScalePolicy.id` is a string; True and Readable unchanged | Proven | Type widened; existing `tests/core.test.ts` scale cases pass; probe: Readable ignores the body id |
| 3 | `scaleChoicesFor` yields today's pair and wording, a third with explanation, throws on unknown; `ScaleControl` renders N choices with keyboard/ARIA kept | Proven | `src/shell/scaleModel.ts`; probe: pair equals `SCALE_CHOICES`, order follows the caller, unknown throws, empty list is empty; `scalePolicyFor` returns a supplied policy and still resolves Readable; `tests/controls.test.ts` existing cases pass; default ARIA label unchanged ("What do True and Readable scale mean?") |
| 4 | Gates; browser scripts in a fresh run directory | Proven, with I-020 unchanged | `docs/evidence/o014-t046-20261011T210310/`: 7 scripts end with `"errors": []`; `synthetic-belt` fails only the pre-existing I-020 assertion |

## Gates (checker, 2026-10-11T10:28Z)

- `npm run typecheck` — exit 0
- `npm run build` — exit 0
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` — 23 files, 426 tests passed
- `git diff --check` — clean
- Checker probe (2 cases) passed and was removed.

## Issues

None. No materiality actions are required.

## Observations (non-blocking, for T-047)

1. `src/app/bodyDraw.ts` `drawnRadii` calls `policy.mapRadius(radius)` without the body id, so under `solar-system` every body would get the default factor. T-047, which wires the policy into experiences, must pass `definition.id`; I will check it there.
2. The explanation uses body ids (`earth ×500`) rather than labels; the info-panel wording is T-047's to settle.
3. `scalePolicyFor` still falls back to True for an unknown id (pre-existing behaviour); `scaleChoicesFor` is the strict gate.

## Owner Validation Still Needed

None (`owner_validation.required: false`).

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
