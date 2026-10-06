# O-004 C-005 re-check admission ledger

Check session: o004-recheck-20261006. The prior Full scope lock at
`docs/evidence/o004-scope.md` remains the matrix boundary. This run adds no
axes and does not alter the accepted scientific meaning of the Apollo sample:
the current O-004 and the owner's recorded direction state that its path is a
provider example for Astraeus, not a claim of historical flight accuracy.
The exact post-TLI cells remain in scope so the owner-accepted I-008 condition
is reproduced and its disclosure is verified.

| Re-check item | Prior finding or claim | Exact frozen cell | Allowed result |
|---|---|---|---|
| Source settlement | C-005 S passed; T-014 records a source correction and bounded documentary search | S: A-13 raw E vs former W, normalized value, A-12 forward/A-14 backward; A-05 raw/override/status/search | Current files and evidence agree with the recorded source decisions; otherwise an in-scope Issue |
| Ordinary burn integration | C-005 B passed; T-015 records all twelve physical burns | B: each burn at ignition/interior/cutoff, Earth or Moon reference, full/half integration step, finite acceleration, velocity and position residual, runtime peak | All twelve results remain finite, reproducible, and published; otherwise an in-scope Issue |
| Burn-to-coast joins | C-005 C passed at joins; I-008 was found on A-02>A-03 and later accepted by the owner | C: all twelve modelled endpoints against the next coast start, ±1 ms, ±100 ms, midpoint, terminal anchor; A-02>A-03 physical-speed reproduction | Continuous joins and disclosed, owner-accepted A-02>A-03 sample limitation; a contract break or undisclosed material change is an Issue |
| Whole runtime paths | C-005 R reported full one-second scans and the post-TLI peak | R: Columbia and Eagle every one-second interval, exact endpoints/outside ±1 ms, and the frozen 100 ms post-TLI probes through SampledTrajectory | State contract, bounds, and kinematic scan remain valid; the known physical sample anomaly remains disclosed and accepted |
| Anchors and interpolation | C-005 A passed | A: both vehicles, cutoff/non-cutoff anchors, all 39 sample gaps at quarter/mid/three-quarter points, final anchors | Existing stated anchor and interpolation criteria remain met; otherwise an in-scope Issue |
| Special paths | C-005 P passed | P: descent, surface hold, ascent methods and serialized sample hashes | T-015's baseline hashes and method classifications remain exact |
| Determinism and documentation | C-005 D passed | D: six generated artifacts, repeat reconstruction, input mutation, report/source/spike/Design statements and generic architecture | Outputs are byte-identical and current documentation accurately states the Astraeus contract and Apollo sample limits |
| Failure and bypass behavior | C-005 F passed with a nonblocking unsupported NaN helper observation | F: zero/reversed duration, reference-body mismatch, zero/negative/NaN integration step, retry after failure, direct nonfinite helper state | Supported malformed calls fail cleanly and retry is clean; retain the unsupported NaN observation without broadening scope |
| Browser and regressions | C-005 V passed | V: fresh browser run, six mission epochs on both scales, focus/follow, all events, rates, and Earth/Moon regressions | Browser evidence satisfies the existing scene demonstration; otherwise unverified and NEEDS WORK |
| Full gates | C-005 reported fresh configured gates and no health configuration | Fresh typecheck, build, test, git diff check, then official health check | All configured gates pass; report health as unconfigured if the command confirms no config |

The closure map for C-005/I-008 is fixed before probes: I-008 is closed by
the recorded owner acceptance, while the exact C/R sample evidence is
reproduced. The acceptance is not technical evidence that the post-TLI motion
is physically plausible. No other prior material Issue is carried by C-005.
