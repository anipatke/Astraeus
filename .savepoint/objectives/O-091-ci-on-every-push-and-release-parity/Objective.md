---
id: O-091
title: CI on every push, and release parity
status: planned
depends_on: [O-085, O-086]
release: G-024
priority: medium
rank: 10
---

# O-091: CI on every push, and release parity

## Outcome

Every push and pull request runs the Task gates in CI, the release workflow runs the packed Node consumer and the browser example steps before publishing, and an upgrade check proves the engine against the newest three.js in its peer range (or the range is narrowed).

## Why

AH-36 (all three): the only workflow is the release; it skips the Node consumer and every browser step. AH-37: peer `three >=0.169.0 <1` while shader chunks are patched by string and only 0.169 is tested.

## Success Conditions

- A push/PR workflow with the Task gates; a planted failure turns it red.
- The release workflow adds the Node consumer and the packed-example browser steps.
- A documented, runnable check against the newest three.js; the peer range matches what is proven.
- Actions pinned per the project's choice (Gemini SEC-05 noted).

## Architectural Considerations

Never `npm publish` or run the publish script without `--dry-run`; GitHub releases publish.

## Boundaries

**In scope:**
- Workflows, peer range, the compatibility check.

**Out of scope:**
- Data-package versioning (AH-40).
