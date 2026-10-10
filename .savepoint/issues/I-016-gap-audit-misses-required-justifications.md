---
id: I-016
title: Gap audit omits required justification for deferred and rate gaps
type: verification
status: resolved
source:
  kind: check
  check: C-010
  actor: {role: checker, session: o008-check-20261011}
  at: '2026-10-10T20:52:00Z'
tasks: [T-024]
checks: [C-010, C-011]
resolution:
  disposition: verified
  check: C-011
  actor: {role: checker, session: o008-recheck-20261011}
  at: '2026-10-10T21:04:40Z'
  reason: Every classified GAP now answers all five brief questions and the ownership challenge.
history:
  - at: '2026-10-10T20:52:00Z'
    actor: {role: checker, session: o008-check-20261011}
    kind: observed
    check: C-010
    note: SC1 requires every GAP to answer the five brief questions and why Astraeus rather than the adapter; deferred GAP-5 does not, and GAP-4 omits the capability and reused contract.
  - at: '2026-10-10T21:00:13Z'
    actor: {role: executor, session: o008-repair-20261011}
    kind: repair_attempted
    note: 'docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md now gives GAP-3b its own section stating that GAP-3 answers are shared and adding its specific five answers, and completes GAP-4 (capability, reused contract) and GAP-5 (capability, reused contract, independent evidence, why Astraeus rather than the adapter) while keeping GAP-5 deferred. Proof Needed rerun by reading every GAP row (GAP-0 to GAP-5, GAP-3b) against the six required answers by hand; there is no automated audit test. No implementation changed. Awaiting checker verification.'
  - at: '2026-10-10T21:04:40Z'
    actor: {role: checker, session: o008-recheck-20261011}
    kind: rechecked
    check: C-011
    note: 'Read GAP-1, GAP-2, GAP-3, GAP-3b, GAP-4 and GAP-5 against SC1; all six answers present with independent evidence. GAP-3b remains conditional and GAP-5 deferred. Verified by CLEAR C-011.'
---

# I-016: Gap audit omits required justification for deferred and rate gaps

## Summary

O-008 SC1 and T-024 Done When 2 apply the five-question requirement to every GAP. Deferring an abstraction does not remove that documentation requirement.

## Evidence

Read `docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md:51`–55:

- GAP-4 gives the missing metric, change, alternative evidence and engine ownership, but never identifies its tested Astraeus capability and existing contract reused as required by SC1.
- GAP-5 rejects a fabricated physical State and names a possible direction-marker layer, but omits the tested capability, reused contract, independent evidence and why the change belongs in Astraeus rather than adapter configuration. Its deferred status is not a recorded owner exception.
- GAP-3b has no separate section; its optional provenance span is grouped into GAP-3. The next revision should make explicit whether the five answers there cover both gaps, including independent time-ranged provenance evidence.

Reproduction is document inspection of each classified GAP against the six required answers. Expected: every GAP has an explicit answer or a clear shared answer, including deferred gaps. Actual: incomplete answers. The missing challenge could let later work introduce an abstraction before justifying it. There is no automated audit test; executor prose incorrectly claims all GAP rows meet the requirement.

## Proof Needed

Complete the missing answers or justify a different classification under the existing criteria; keep deferred work deferred. Clarify the shared GAP-3b answers. No new provider, fixture data or marker implementation is needed. Recheck every GAP row against SC1.
