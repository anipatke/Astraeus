---
id: I-042
title: Design.md still describes Earth–Moon, two shower addresses and the picture steps
type: drift
status: resolved
source:
  kind: check
  check: C-081
  actor: {role: checker, session: o024-full-check-20261019}
  at: '2026-10-19T10:40:00Z'
tasks: [T-091, T-093, T-094, T-102]
checks: [C-081, C-082]
guardrail_ids: []
history:
  - at: '2026-10-19T10:40:00Z'
    actor: {role: checker, session: o024-full-check-20261019}
    kind: observed
    note: 'Design.md was not updated by O-024. Stale: Components row for src/experiences/ (lists earth-moon/ and Perseids/Geminids as shipped), tools/validate row (pictures, diff-screenshots, contact-sheet, browser-earth-moon), src/main.tsx row (?experience=earth-moon, shower such as perseids), shower builder paragraph (?experience=shower-<name>). Not mentioned: the boot loader (T-094 drift note), the Showers switcher and reload (T-091 drift note), yearStartUtc (T-092), public-addresses.mjs, the vercel.json caching rule.'
    check: C-081
  - at: '2026-10-19T10:50:00Z'
    actor: {role: checker, session: o024-recheck-20261019}
    kind: observed
    note: 'Mostly repaired (map rows, Shower builder, Story panels, new O-024 paragraph with drift-note accounting). Still stale: Design.md line 167, Public site and launch, says site pictures are made by tools/validate/capture-site-pictures.mjs (archived by T-102) and item (e) says run-full.sh compares pages against docs/evidence/o017-baseline-20261017/ (it compares nothing since T-102). Rewrite those two sentences.'
    check: C-082
  - at: '2026-10-19T11:00:00Z'
    actor: {role: executor, session: o024-recheck-20261019}
    kind: repair_attempted
    note: 'Owner instruction ("jsut fix it"): the C-082 checker session rewrote the two sentences in the Design.md Public site and launch paragraph (pictures were made by capture-site-pictures.mjs, archived by T-102; the o017 baseline is history only, run-full.sh compares nothing). Executor evidence only; this session is not independent of the repair, so a fresh session verifies it.'
  - at: '2026-10-19T11:10:00Z'
    actor: {role: owner, session: owner-chat-20261019}
    kind: owner_decision
    note: 'Owner accepted the repair in chat without a further re-check ("no mark it checked, it was two lines, we arent doing the whole thing over again"). Recorded by the agent on direct instruction; not a technical CLEAR.'
resolution:
  disposition: accepted
  actor: {role: owner, session: owner-chat-20261019}
  at: '2026-10-19T11:10:00Z'
  reason: Accepted by the owner in chat on 2026-10-19, recorded by the agent on direct instruction.
---

# I-042: Design.md not reconciled for O-024

## Summary

O-024 removed Earth–Moon, merged the showers into one `showers` experience, dropped the picture machinery and added a boot loader, a switcher and an addresses list. Design.md still says the old things (see history). Drift notes from T-091 and T-094 were left for reconciliation and no integration Task accounted for them.

## Evidence

`grep -n -i 'earth-moon\|shower-<name>\|contact-sheet' .savepoint/Design.md` on 2026-10-19.

## Proof Needed

Design.md reflects the three-demo line-up, the single Showers experience and switch, the loader, the addresses module and the trimmed `run-full.sh`; each deferred drift note is either reflected or marked non-architectural with a reason. Done through `savepoint-design`.
