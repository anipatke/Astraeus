---
id: I-066
title: Vite 8.3.2 carries a high-severity advisory
type: defect
status: open
source:
  kind: check
  check: C-094
  actor: {role: checker, session: o037-full-check-20261021}
  at: '2026-10-21T11:10:00Z'
tasks: [T-142]
checks: [C-094, C-096]
history:
  - at: '2026-10-21T11:10:00Z'
    actor: {role: checker, session: o037-full-check-20261021}
    kind: observed
    check: C-094
    note: Found by the O-037 Full Objective Check.
  - at: '2026-10-22T11:19:28Z'
    actor: {role: checker, session: o039-full-check-20261022}
    kind: observed
    check: C-096
    note: 'Still present at the O-039 Full Objective Check: official snapshot sha256:565b2030530450b64e129130e102e3118f71da75e7c4429eb197a5aa982f55d7 (commit 033d64d0, clean tree) reports dependency_vulnerabilities 6 (1 high) against vite 8.3.2 and says it blocks clearance. O-039 did not change package.json or package-lock.json.'
---

# I-066: Vite 8.3.2 carries a high-severity advisory

## Summary

The official health snapshot's osv-scanner instance reports 3 advisories against `vite 8.3.2` in `package-lock.json` (1 high, 2 medium: GHSA-587h-7wmj-h5pm, GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw). The health verdict says this blocks clearance. Vite 8.3.2 is unchanged since `main` (2ad2dc03), so O-037 did not introduce it; it is recorded because the method requires an Issue behind every blocking health result.

## Evidence

C-094 snapshot sha256:ec881d17a43d5e029ae394135845776bd01ab3c9ac4de34087cb226ffd6b0191, dependency_vulnerabilities: 3 (high 1, medium 2), needs_attention.

## Proof Needed

Vite upgraded to a release without the high advisory, gates green, and the next official snapshot shows no high or critical vulnerability; or the owner's recorded acceptance.
