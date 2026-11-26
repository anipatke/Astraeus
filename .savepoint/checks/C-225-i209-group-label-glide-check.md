---
id: C-225
scope: {kind: release, id: G-027}
result: CLEAR
checked_by: {role: checker, session: check-i209-20261126}
executed_session: repair-i209-20261125
checked_at: '2026-11-26T21:10:05Z'
reviewed:
  base_commit: b74ddc79
  files: [packages/astraeus/CHANGELOG.md, packages/astraeus/src/api/labelInput.ts, packages/astraeus/src/app/PointsView.ts, packages/astraeus/src/app/groupLabelPoint.ts, packages/astraeus/src/app/hostLabels.ts, packages/astraeus/tests/groupLabelPoint.test.ts, packages/astraeus/tests/hostLabels.test.ts]
  dependencies: []
issues: []
supersedes: null
---

# C-225: I-209 group-label glide (focused defect Check)

This Check verifies I-209 only. It is filed against G-027 because the defect is in the group-label feature that Goal shipped (O-101 T-459, T-461); the loader takes no Issue scope kind (owner decision 2026-11-27: check the fix on its own, then release 0.12.1). Fresh session; it did not build the repair. Quick mode; no `savepoint health check` and no browser run (the owner judges the look).

**Result: CLEAR.** Every Proof Needed point of I-209 is proven by the new tests, by independent probes written for this Check (deleted after), and by the gates.

## Scope lock

- In: the uncommitted repair on main against HEAD b74ddc79, the seven files above; I-209 Proof Needed (glide bound for a group's own name and host labels over one and two groups; inside the swarm's extent; ring holds direction on the ring; no extra per-member work per frame; existing tests green).
- Out: the modified T-388 file (O-086), untracked `docs/evidence/*` and `docs/research/`, the belt app, browser screen sampling, optional `on: "dot"`/`towardDeg` (not built, not asked).

## Proof Needed

| Point | Status | Evidence |
|---|---|---|
| Glide bound, group's own name | Proven | `groupLabelPoint.test.ts` "a moving swarm's name glides" (2500 dots; day a frame x300 and minute a frame x120; GPU and CPU paths): each step <= 1.5 x centroid step + 10 km. Red on HEAD's src (below). |
| Glide bound, host label over one and two groups | Proven | `hostLabels.test.ts` same bound at a day a frame, one swarm and two side-by-side swarms, both paths. The one-swarm cases are red on HEAD; the two-swarm case passes on HEAD too (weaker discriminator, see Observations). |
| Inside the swarm's extent | Proven | `insideMembers` per frame in the host glide test; pooled case checks distance within 1.5 ring widths and angle within the union's spread. Construction: centre + mean direction x mean member distance, so distance lies between nearest and farthest member. Probe: one-member group lands on its member (2e-8 km). |
| Ring holds direction, on the ring | Proven | Existing ring test green; probe: 2500-dot ring over 100 days at a third of a day a frame drifts 1,950 km at |r| = 3.0000 AU on both paths. |
| No extra per-member work per frame | Proven | `placeLabel` is O(groups) per frame; the distance sum rides the existing `addDirections` pass. Probe with `bestMember` spied: one call over 300 ring frames (only when nothing is held); the per-fill `bestMember` pass was removed. |
| Existing tests green | Proven | Full `npm test` below. |

## Red on HEAD

`git stash push -- packages/astraeus/src`, then `vitest run tests/groupLabelPoint.test.ts tests/hostLabels.test.ts`: 6 failed, 27 passed: the four day-a-frame glide cases (two per file, both paths) and the pooled case (no `PointsView.placeLabel` on HEAD, expected). `git stash pop`; the src diff compared byte-identical to a saved copy and file checksums matched before and after.

## Probes (throwaway `tests/zzProbeI209.test.ts`, deleted)

Ratios are worst (label step - 10 km) / centroid step; both GPU (trueScale) and CPU policy paths gave the same numbers.

- Swarm about a moving body (Earth-centred, 800 members, a = 4e5 km): day, hour and reverse-hour steps, worst ratio 1.006 / 1.002 / 0.999; label within the view's extent of its centroid.
- Reverse time (after forward frames): day and minute steps, worst 1.012 / 1.002.
- Swarm/ring threshold (anomaly spread 130/142/150 deg, members spreading over time): worst step 0.0299 AU per 3-day frame, equal to the orbital motion; no hop at the crossing; 150 deg (a ring) holds still.
- Out of bounds then back (pooled host label over two groups): null outside, back to the same place (0 km).
- Pooled hide/unhide: hiding one group moves the label 0.52 AU to the other group (the set changed, as before the repair); unhiding returns it exactly (0.0 km).

## Changed existing expectations

Only restate the deliberately changed rule: hostLabels "on a dot" (nearest member < 2,000 km) became "inside the members" (twice, including the hide case); the ring-distance assertion and every layer, time and setup are unchanged. The pooled groupLabelPoint case reads `PointsView.placeLabel` instead of the removed `labelCandidate`/`labelPlaceOf`, keeps its union check and adds a distance check. `Resultant` literals gained `distanceKm: 0`. No setup weakened.

## Gates (this session, UTC 2026-11-26)

- `npm run typecheck`: pass. `npm run lint`: pass. `git diff --check -- packages/astraeus`: clean.
- `npm run build`: pass.
- `npm test`: 358 files passed; 5745 passed, 2 skipped.
- `npm run check:pack`: pass; engine budget 1,845,723 B raw (limit 1,846,000; 277 B spare), 529,235 B gzip (limit 530,000).

## Issues

None. No materiality actions are required.

## Owner validation still needed

The look on the belt app and on `localhost:5490` (not run here, by instruction).

## Observations (non-blocking)

- `.savepoint/Design.md` (viewer-interface paragraph, O-101) still says a group's name "sits on one of its dots ... the member nearest the members' mean direction". It is now stale; reconcile it before or with the 0.12.1 release.
- `hostLabels.ts` `PooledState` doc still mentions "the member chosen at the last pair of fills"; `labelDirection` in `groupLabelPoint.ts` is now used only by a test.
- The two-swarm host glide case also passes on HEAD; the one-swarm cases carry the red-first proof for host labels.
- When a ring's members later regain a clear mean direction, the label moves from the held direction to the new mean in one step; members only spread over time in the probed cases, so this was not seen.
- The engine budget has 277 B raw headroom left.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [ ] STYLE-05 **Build only what is needed** — `labelDirection` (`src/app/groupLabelPoint.ts:88`) is kept though no src caller remains.
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** — one `PointsView.placeLabel` for both label kinds.
- [ ] STYLE-08 **Comments explain why** — stale `PooledState` doc in `src/app/hostLabels.ts:99`.
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
