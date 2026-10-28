# Verification policy

The single home for gate evidence, Task-check waivers and the mandatory Objective Check; skills point here rather than restating it.

- Every Task records per-criterion evidence and runs its configured gate before handoff. Gate commands are project-owned: `quality_gates` in `.savepoint/config.yml` (build, lint, typecheck, test), plus the [project gates](build.md). When no gate is configured, record that none ran; never invent one.
- Focused test runs are for iteration. Ordinary Task handoff runs the configured build and test gates; migration or platform-sensitive handoff runs the project's full gate fresh when it defines one separately.
- Reuse a successful full result only for metadata-only corrections: record the original command, time, toolchain and result, then prove code, tests, fixtures, dependencies and gate definitions are unchanged since that run. Any change to those inputs requires a fresh full run.
- A Task Check is optional, not an automatic implementation gate. If the owner skips it, the Task evidence must carry an explicit owner waiver naming the Task, reason, actor and time (shape in `savepoint-task`, Evidence And Handoff). The waiver is not technical `CLEAR` and does not waive any acceptance criterion, guardrail or Objective Check.
- A recorded waiver does satisfy a `requires: clear` Task dependency (the owner's completion decision stands in for clear there); it never satisfies `requires: accepted`, since there is no Check to accept.
- Do not decide whether a dependency blocks by reading this prose. The Savepoint runtime's dependency gate decides; `savepoint resume` and the board's transition gate report it as `Blocked:` lines. If neither reports a block, the dependency is met.
- The Full Objective Check is mandatory before an Objective can close and requires current successful full-gate evidence; a Task Check does not replace it. It is the higher-level integration gate: every owned Task, including Tasks whose Task Check was waived, plus cross-Task integration and Design reconciliation.
- Owner acceptances and exceptions carry forward to later Checks while their scope is unchanged; `savepoint-check` Closure Rules define the recorded shape and the `Assess` step. Waived evidence is never `CLEAR`.
- A Check session is independent from the executor's conversation: the same model is allowed, the same session is not. Only `savepoint-check` writes Check records; each run is immutable at `.savepoint/checks/C-###-slug.md`, and a recheck writes a new record naming the one it supersedes.
