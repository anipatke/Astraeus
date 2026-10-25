---
type: check-method-reference
triggerable: false
---

# Quick Task Check

Optional: only when the owner requests or selects a Task Check. Never add an automatic Check to every handoff. Read [common rules](check-method.md) and apply this procedure; section names below refer to the common rules. A re-check also applies their Re-check After Remediation section.

### Quick Check Procedure

1. Establish Scope in the common rules.
2. Write a short scope lock: the acceptance criteria and guardrails being
   tested, the changed files, and what is out of scope. It is frozen for any
   re-check the same way as a Full lock.
3. Turn Acceptance Into Invariants in the common rules, for each acceptance criterion.
4. Probe the changed code paths directly: boundary values, malformed or
   missing input, failure behavior, and one bypass path where one exists.
5. Verify File Reality and Verify Evidence And Gates in the common rules.
6. Complete The Issues Pass, Summarize Materiality, and Review Code Style in the common rules.

Quick mode does not build the coverage matrix, the external-boundary matrix,
the workflow and side-effect lock, or the adversarial pass. If a probe shows
risk that reaches past the one Task, record it as an observation for the
mandatory Objective Check rather than widening the Quick Check.
