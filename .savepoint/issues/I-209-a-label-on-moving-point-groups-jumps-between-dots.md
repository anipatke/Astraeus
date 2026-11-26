---
id: I-209
title: A label on moving point groups jumps between dots instead of moving with them
type: defect
status: resolved
source:
  kind: report
  actor: {role: owner, session: belt-report-20261125}
  at: '2026-11-25T09:00:00Z'
severity: medium
checks: [C-225]
resolution:
  disposition: verified
  check: C-225
  actor: {role: checker, session: check-i209-20261126}
  at: '2026-11-26T21:10:05Z'
  reason: 'C-225 CLEAR: name and host labels (one and two groups) glide within 1.5 x the swarm step on GPU and CPU paths, red on HEAD for the day-a-frame cases; inside the members; a ring holds its direction on the ring; no per-member work per frame (bestMember once for a ring); npm test 5745 passed, check:pack 1,845,723 B raw / 529,235 B gzip.'
history:
  - at: '2026-11-25T09:00:00Z'
    actor: {role: owner, session: belt-report-20261125}
    kind: observed
    note: 'Belt app (astraeus 0.12.0, belt improvement #38, docs/astraeus-smooth-group-labels-prompt.md in the belt repo): the "Trojans ahead of Jupiter (L4)" label (scene.addLabels anchor {groups}) on ~10,000 dots jumps several times a second by tens to hundreds of pixels at 30 days per second; at 1440x900 it went from (539,225) to (455,238) in 4 s while fixed positionKm labels did not move. Owner: "the labels keep jumping around", "trojans are still jumpy"; owner: "treat as bug".'
  - at: '2026-11-25T10:17:27Z'
    actor: {role: executor, session: repair-i209-20261125}
    kind: repair_attempted
    note: 'One rule for both label kinds: `PointsView.placeLabel(views, held, policy)` (static, used by a group''s own name with [this] and by `HostLabelPlacer.#onGroups` for anchor.groups). Per frame it blends each view''s fill resultant (now also summing member distances, `Resultant.distanceKm`) and centre offset between its two fills by the dots'' blend factor, pools them, takes the clear mean direction (`clearDirection`, SWARM_SHARE 0.25) else the held direction else the direction of the member nearest the vernal equinox (bestMember, once, then held), and places at the count-weighted centre plus direction times mean distance (`labelPointKm`). Continuous across refills because a new pair''s earlier fill is the old pair''s later one. Removed per-fill labelDir/labelMember, the per-pair stamp and labelCandidate/labelPlaceOf; no per-member work added (the distance sum rides the existing addDirections pass; bestMember now runs only for a ring with nothing held). Tests: groupLabelPoint.test.ts adds "a moving swarm''s name glides with it" (2500-dot swarm, a day a frame x300 and a minute a frame x120, both policies: each frame''s name step <= 1.5 x the centroid step + 10 km); hostLabels.test.ts adds the same at a day a frame for one swarm and two side-by-side swarms, plus inside-the-members each frame. Red first: with HEAD''s src the day-a-frame cases fail (4 of them); green after. Existing expectations changed only where they stated the old rule: hostLabels "on a dot" (nearest member < 2,000 km) became "inside the members" (within the members'' angular spread of their mean direction when clear; ring width as before); groupLabelPoint pooled case reads PointsView.placeLabel instead of the removed labelCandidate/labelPlaceOf and keeps its union check; Resultant literals gained distanceKm. Gates: typecheck, lint, build pass; npm test 358 files, 5745 passed; check:pack pass, engine 1,845,723 B raw / 529,235 B gzip (limits 1,846,000 / 530,000; a first version with a separate host-label path was 52 B over and was folded into the one static). CHANGELOG 0.12.1 (unreleased) with Breaking changes: none; labelInput.ts outer doc describes the place (the inner member doc is in the API lock, left unchanged). Unverified: browser (no run; the brief''s 1440x900 / 390x844 screen-sampling check is not built) and the belt app itself; the optional on:"dot" and towardDeg were not built. Executor evidence only; the Issue stays open for a Check.'
  - at: '2026-11-26T21:10:05Z'
    actor: {role: checker, session: check-i209-20261126}
    kind: rechecked
    note: 'C-225: Proof Needed met (independent probes: body-centred swarm, reverse time, swarm/ring threshold, one member, out of bounds, pooled hide/unhide, both policy paths); closed as verified.'
    check: C-225
---

# I-209: A label on moving point groups jumps between dots instead of moving with them

## Summary

A label anchored on point groups (a group's own name, or `scene.addLabels` with `anchor: { groups }`) sits on the single member nearest the members' mean direction from the centre (`app/groupLabelPoint.ts` `bestMember`). The member is chosen from the earlier fill of each refill pair and then held for that pair, so each refill can hand the label to a different member; members at different distances move at different speeds and take turns being nearest, and the label steps to the new one.

## Evidence

Belt app report above. Code: `PointsView.labelAnchor` (via `labelMember` per fill) and `hostLabels.#onGroups` (per pair stamp) both re-pick a member when the pair changes; nothing makes the new member's place continuous with the old one.

## Proof Needed

- A synthetic swarm co-moving on a circle, sampled every frame across many refills at a high time rate: no frame-to-frame label step larger than a small bound proportional to the swarm's own motion, for a group's own name and for a host label over one and over two groups.
- The point lies inside the swarm's extent (between the nearest and farthest member distance, and within the swarm's angular spread).
- A ring (no clear mean direction) keeps its held direction and the label sits on the ring (at the members' typical distance).
- No extra per-member work per frame; per refill at most one pass over the members, as today.
- Existing group-label, scene-target and host-label tests stay green.
