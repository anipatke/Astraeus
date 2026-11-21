---
id: I-195
title: The engine does not typecheck against three.js 0.181 or later
type: defect
status: open
source:
  kind: report
  actor: {role: executor, session: orchestrate-g024-20261122}
  at: '2026-11-21T23:48:18Z'
tasks: [T-415]
checks: []
guardrail_ids: [API-07]
severity: low
history:
  - at: '2026-11-21T23:48:18Z'
    actor: {role: executor, session: orchestrate-g024-20261122}
    kind: observed
    note: 'T-415 check:three-newest: three 0.187.0 + @types/three 0.187.0 fail typecheck at packages/astraeus/src/app/useBodyTexture.ts(8,12) TS2416 (SafeTextureLoader.load not assignable to TextureLoader.load); from 0.182 also tests/glowAndHooksDom.test.ts(31,71) TS2739 (CanvasRenderingContext2D vs GPUCanvasContext). Typecheck fails for 0.181.2..0.187.0; 0.176..0.180 pass typecheck, lint and tests; runtime tests and lint pass on 0.187. Peer narrowed to >=0.169.0 <0.181.0 (owner decision "Test newest, narrow if it fails").'
---

# The engine does not typecheck against three.js 0.181 or later

## Problem

Consumers on three.js 0.181+ (with the matching `@types/three`) get type errors from the engine's texture loader subclass; the peer range was narrowed to `<0.181.0` so it states only what is proved (API-07).

## Proof Needed

`npm run check:three-newest` passes against the newest three.js after the type fix, and the peer range is widened again to what it proves.

## Repair Routing

Follow-up after G-024's O-091 (not in its scope): fix the loader typing so it compiles against both 0.169 and the newest `@types/three`, then widen the peer range.
