---
id: T-072
title: Compare before and after, update the design notes and show the owner
objective: O-017
status: done
depends_on: [{task: T-067, requires: clear}, {task: T-068, requires: clear}, {task: T-069, requires: clear}, {task: T-070, requires: clear}, {task: T-071, requires: clear}, {task: T-073, requires: clear}, {task: T-074, requires: clear}, {task: T-075, requires: clear}]
owner_validation: {required: true, accepted_check: C-056, scope: [final contact sheet, numbers table, Design reconciliation], accepted_by: {role: owner, session: o017-orchestrator-check-20261017}}
planned_by: {role: planner, session: o017-plan-20261017}
---

# Compare before and after, update the design notes and show the owner

## Outcome

Proof that nothing visible changed, the before-and-after numbers, Design.md reconciled with O-017's deltas, and the owner's short look.

## User Check

Open the comparison page: each real experience and site page at both sizes, before beside after, with any difference flagged and explained. The numbers table shows lines of code, switches, first-load sizes and test times before and after. Then a short look at the public preview.

## Done When

1. After pictures captured with Task 1's tool at the same views and times; an automatic comparison flags any pixel difference above a stated threshold; each flagged difference is explained (for example animated elements) or fixed.
2. Numbers table (O-017 Success Condition 8) completed against Task 1's baseline.
3. Design.md reconciled: every Drift Note from Tasks 2 to 6 reflected or stated as non-architectural with a reason.
4. The full trimmed browser run, configured gates and the public build pass on the final tree, fresh evidence directory.
5. Owner look recorded.

## Context Files

`docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md`, `.savepoint/Design.md`, `tools/validate/capture-site-pictures.mjs`.

## Design References

All of Design.md (reconciliation).

## Guardrails

TEST-01, PROV-01, PROV-02.

## Implementation Plan

1. Capture after pictures; compare.
2. Fill the numbers.
3. Reconcile Design.
4. Owner look.

## Boundaries

No code changes except fixes for flagged differences.

## Technical Verification

Full gate fresh. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

### Executor evidence (build session, 2026-10-17; not a Check)

Evidence directories: full run `docs/evidence/o017-t072-full-20261017T034453Z/`, gates `docs/evidence/o017-t072-gates-20261017T035747Z/`, comparison with the original set `docs/evidence/o017-t072-vs-original-20261017T034637Z/`. Numbers table: `docs/O017_RESULTS.md` (also linked from `docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md` section 3).

#### Per-criterion outcome

1. Pictures. `tools/validate/run-full.sh` captured the pictures first and alone on the final tree and compared them with the approved baseline `docs/evidence/o017-baseline-20261017/`: 20 pictures, 7 identical, `maxOver16Pct` 0.0231 against the 0.024 tolerance; nothing flagged. Against the original T-066 set (`o017-before-20261016T205125Z`, same tool): 5 identical; the four site pictures differ in size on purpose (home page: five demo cards, T-074/T-076; assets page text, T-067/T-068; heading and layout, T-068/T-070); the four shower pictures are over tolerance as expected (Geminids desktop 0.2108%, phone 0.0319%; Perseids desktop 0.2522%, phone 0.0972%) because the dots now sit on their true orbits near the Sun (T-075, owner accepted; baseline README); the other pictures are within tolerance (apollo11-overview-desktop 0.0177%, jupiter-io-wide 0.0178% and 0.0231%, jupiter-io-close-desktop 0.0006%: small animated-edge noise). Contact sheet: `docs/evidence/o017-t072-full-20261017T034453Z/contact-sheet.html` (and `contact-sheet.png`).
2. Numbers table: `docs/O017_RESULTS.md` (code lines and files, switches 21 to 16, first-load bytes per page raw and gzip, unit test time 30 s to 36 s, full browser run 37 min 56 s to 9 min 26 s, shower frame figures from C-053 and C-055). Honest reading: `src/` grew 680 lines (splits and the graphics-chip path); tools shrank 577; the Perseids and Geminids first loads shrank 2.4% and 4.0% raw.
3. Design.md reconciled (sections below). Each Drift Note disposition:
   - T-067 (sources, switches, sky text, local-data convention): reflected in Design.md "Measured orbits: GMN only", "Shower builder" (GMN list, loader), "The sky" (HYG only, no `?stars=`, one picture, local-data convention), Components map row `data/local/`.
   - T-068 (lighting, sky, `__PUBLIC_BUILD__`): reflected in "Lighting choice", "The sky", Components map row `src/main.tsx`, "Public site and launch" (b). `docs/DONOR_PROVENANCE.md` and `docs/ASTRONOMY_VALIDATION.md` marked historical (below).
   - T-069 (map, `rotateInto`, test merge): map reflected in three new Components rows (`src/app/scene*.ts`..., `src/core/fieldReaders.ts`..., `shower*.ts`); `rotateInto` and `memberStatesOf`/`propagatedPositionOf` stated in the `fieldReaders` row; test merge stated in the shower row. Non-architectural in themselves (internal helpers, test layout) but recorded there anyway.
   - T-070 (budget, column layout, textures, `label`): reflected in "Public site and launch" (c), (d) and "Measured orbits: GMN only" (column layout). Textures recompressed then reverted by owner decision: non-architectural (nothing changed; stated in (d)).
   - T-071 (tools/validate row, trimmed run): reflected in the rewritten `tools/validate/` Components row (run-full, on-request, contact sheet, picture baseline, removed scripts).
   - T-073 (`fillPositionsRangeKm`, look-ahead, `refillSliceMs`, GPU blend): reflected in Design.md "Groups and the `points` layer", O-017 paragraph (1) and (2). C-053 Obs 3 (GPU-blend note) included.
   - T-074: None for Design in the Task; home page five demos stated in "Public site and launch" (a) (non-architectural content note).
   - T-075 (shader path, `linearUnitsPerKm`, epoch, Halley, 7-day fills): reflected in the same paragraph, (3).
   - T-076: no Drift Notes section; nothing architectural (home page screenshots); covered by (a).
   - Check observations C-048 to C-055: C-048 1 and 3 and C-049 3 done (perseids.json wording; historical lines); C-049 2 (page title) is repaired by T-070 (`label`), stated in (c); C-050 1 done (purpose comments added to 8 `scene*.ts` and 8 `shower*.ts` files that lacked one), C-050 3, C-051 2, C-052 4, C-053 3, C-055 2 reflected as above; C-051 1 (listedOrbitGroup timing flake) did not recur in this run (passed in the gate run and the full run) and is left alone; C-052 1 kept (run-full still takes pictures first and alone); C-049 1, C-052 3, C-053 1, 2 and 4, C-054 are not Design items.
   - Also updated: Components row `data/local/`, Current Technical State (stale "CAMS orbits and the Yale star file stay local-only" sentence; new O-017 paragraph).
4. Gates on the final tree: `npx tsc --noEmit` exit 0; `npx vitest run` exit 0, 55 files, 919 passed 1 skipped, 36 s; `npm run build` exit 0; public build (`ASTRAEUS_PUBLIC_BUILD=1`) exit 0 and `node tools/validate/public-build-assets.mjs <dir>` exit 0 with the load budget held on every page (`load-budget.log`); `tools/validate/run-full.sh` every step exit 0, zero error lines, total 566 s (`summary.txt`). The source edits were comments only (one purpose line at the top of 17 files), tsc re-run before the full run.
5. Owner look: NOT recorded here. The owner should look at the contact sheet `docs/evidence/o017-t072-full-20261017T034453Z/contact-sheet.html` (before beside after, differences flagged) and the numbers table `docs/O017_RESULTS.md`, then a short look at the public preview.

#### Files read and changed

Read (all inside the Context Files' intent or task-record reads): the Task files T-067 to T-076 (Drift Notes), Checks C-048 to C-055 (Observations), `.savepoint/Design.md`, `docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md`, `tools/validate/run-full.sh` header, baseline README; extra reads for facts to state in Design: `src/main.tsx`, `vite.config.ts`, `src/experiences/showers/measuredOrbits.ts`, `showerDefinition.ts`, `tools/validate/load-budget.mjs`, `index.html`, `docs/DONOR_PROVENANCE.md` and `docs/ASTRONOMY_VALIDATION.md` (to mark historical), the heads of the new `scene*.ts` / `shower*.ts` files (for the comments). Changed: `.savepoint/Design.md`, `docs/O017_RESULTS.md` (new), `docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md` (one link line), `docs/DONOR_PROVENANCE.md` and `docs/ASTRONOMY_VALIDATION.md` (dated historical lines, no rewrite), `data/showers/perseids.json` (source wording only), one comment line at the top of 9 `src/app/scene*.ts` and 8 `src/experiences/showers/shower*.ts` files, this Task.

#### Limitations

The home page first-load figure from the picture tool (750,590 B raw) differs from the budget tool's (530,611 B) because they count different things; both are stated in `docs/O017_RESULTS.md`. Frame figures are from earlier Checks (software GL), not re-run. Real-phone frame rates and the owner look are not verified. Nothing staged or committed.


## Drift Notes

None expected.

## Owner Completion — 2026-10-17

Owner looked at the final contact sheet and `docs/O017_RESULTS.md` (sent to the owner) and said "Done". Quick Task Check C-056 CLEAR.
