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
checks: [C-094]
history:
  - at: '2026-10-21T11:10:00Z'
    actor: {role: checker, session: o037-full-check-20261021}
    kind: observed
    check: C-094
    note: Found by the O-037 Full Objective Check.
---

# I-066: Vite 8.3.2 carries a high-severity advisory

## Summary

The official health snapshot's osv-scanner instance reports 3 advisories against `vite 8.3.2` in `package-lock.json` (1 high, 2 medium: GHSA-587h-7wmj-h5pm, GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw). The health verdict says this blocks clearance. Vite 8.3.2 is unchanged since `main` (2ad2dc03), so O-037 did not introduce it; it is recorded because the method requires an Issue behind every blocking health result.

## Evidence

C-094 snapshot sha256:ec881d17a43d5e029ae394135845776bd01ab3c9ac4de34087cb226ffd6b0191, dependency_vulnerabilities: 3 (high 1, medium 2), needs_attention.

## Proof Needed

Vite upgraded to a release without the high advisory, gates green, and the next official snapshot shows no high or critical vulnerability; or the owner's recorded acceptance.
