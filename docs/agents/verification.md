# Verification policy

## Verification Policy

- Every Task records per-criterion evidence and runs its configured gate before handoff.
- Gate commands are project-owned: `quality_gates` in `.savepoint/config.yml` (build, lint, typecheck, test), plus the project gates in `docs/agents/build.md`. When no gate is configured, record that none ran; never invent one.
- Focused test runs are for iteration. Ordinary Task handoff runs the configured build and test gates; migration or platform-sensitive Task handoff runs the project's full gate fresh when it defines one separately.
- A Full Objective Check requires current successful full-gate evidence; the optional Task Check does not replace it.
- Owner acceptances and exceptions carry forward to later Checks while their scope is unchanged; `savepoint-check` Closure Rules define the recorded shape and the `Assess` step. Waived evidence is never `CLEAR`.
- Reuse a successful full result only for metadata-only corrections. Record the original command, time, toolchain, and result, then prove code, tests, fixtures, dependencies, and gate definitions are unchanged since that run. Any change to those inputs requires a fresh full run.
- A Task Check is optional, not an automatic implementation gate. If the
  owner skips the optional independent Task Check, the Task evidence must
  carry an explicit owner waiver naming the Task, reason, actor, and time.
  That waiver is not technical `CLEAR` and does not waive any acceptance
  criterion, guardrail, or Objective Check.
- A recorded owner Task-check waiver does satisfy a `requires: clear` Task
  dependency: the owner's completion decision stands in for clear there. It
  never satisfies `requires: accepted`, since there is no Check to accept.
- Do not decide whether a dependency blocks by reading this prose. The
  Savepoint runtime's dependency gate decides, and
  `savepoint resume` and the board's transition gate report its result as
  `Blocked:` lines. If neither reports a block, the dependency is met.
- The Full Objective Check is mandatory before an Objective can close. It is
  the higher-level integration gate and covers every owned Task, including
  Tasks whose optional Task Check was waived, plus cross-Task integration and
  Design reconciliation.

A Check session must be independent from the executor's conversation: the same model is allowed, the same session is not. Only `savepoint-check` writes Check records. Each run is immutable at `.savepoint/checks/C-###-slug.md`; a recheck writes a new record naming the one it supersedes.

During a Check, load `agent-skills/references/check-method.md` (common rules), then its selected mode reference in full: Quick follows `check-quick.md`; Full follows `check-full.md`, including coverage matrices and the adversarial pass. Apply Guardrails when present; absence is not a finding. A signed `CLEAR` Check is current on its own; optional freshness assessment marks only `stale` or `unknown`.
