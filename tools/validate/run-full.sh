#!/usr/bin/env bash
# The trimmed full browser run (O-017 T-071): every automated browser script worth running for Full Objective Checks and before a release or merge. The pictures run first and alone, then three lanes side by side.
#   PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js tools/validate/run-full.sh [evidence-dir]
# It starts its own dev server (port DEV_PORT, default 5479) and a preview of a scratch PUBLIC build (PUBLIC_PORT, default 5480), writes every log to a fresh evidence
# directory (default docs/evidence/o017-t071-full-<UTC stamp>; never reused), prints and writes summary.txt, then stops both servers. Exit code is non-zero if any step failed or logged an error.
# What it runs and what it leaves out is mapped on docs/BROWSER_CHECKS.md. The on-request scripts are in tools/validate/on-request/.
set -u
cd "$(dirname "$0")/../.."
: "${PLAYWRIGHT_CORE:?set PLAYWRIGHT_CORE to the playwright-core index.js}"
export PLAYWRIGHT_CORE
DEV_PORT=${DEV_PORT:-5479}; PUBLIC_PORT=${PUBLIC_PORT:-5480}
B=${1:-docs/evidence/o017-t071-full-$(date -u +%Y%m%dT%H%M%SZ)}
BEFORE=${BEFORE:-docs/evidence/o017-baseline-20261017}
if [ -e "$B" ] && [ -n "$(ls -A "$B" 2>/dev/null)" ]; then echo "$B is not empty; use a fresh directory" >&2; exit 2; fi
mkdir -p "$B"
DEV=http://localhost:$DEV_PORT/app.html
PUB=http://localhost:$PUBLIC_PORT/app.html
SCRATCH=$(mktemp -d)
PIDS=()
# npx starts the server as a grandchild, so stop whatever listens on the two ports as well as the processes started here.
cleanup() { for p in "${PIDS[@]}"; do kill "$p" 2>/dev/null; done; fuser -k "$DEV_PORT/tcp" "$PUBLIC_PORT/tcp" >/dev/null 2>&1; rm -rf "$SCRATCH"; }
trap cleanup EXIT
wait_for() { for _ in $(seq 1 120); do curl -sf "$1" >/dev/null && return 0; sleep 0.5; done; echo "no answer from $1" >&2; return 1; }

START=$(date +%s)
npx vite --port "$DEV_PORT" --strictPort > "$B/dev-server.log" 2>&1 & PIDS+=($!)
ASTRAEUS_PUBLIC_BUILD=1 npx vite build --outDir "$SCRATCH/public" --emptyOutDir > "$B/public-build.log" 2>&1 || { echo "public build failed" >&2; exit 1; }
npx vite preview --outDir "$SCRATCH/public" --port "$PUBLIC_PORT" --strictPort --host localhost > "$B/preview-server.log" 2>&1 & PIDS+=($!)
wait_for "$DEV" && wait_for "$PUB" || exit 1

# run <name> <command...>: log to $B/<name>.log, append "name | exit | start-end | seconds | error-lines" to summary.txt
run() {
  local name=$1; shift
  local s; s=$(date +%s)
  "$@" > "$B/$name.log" 2>&1; local rc=$?
  local e; e=$(date +%s)
  printf '%s | exit=%s | %s-%s | %ss | error-lines=%s\n' "$name" "$rc" "$(date -d @"$s" +%H:%M:%S)" "$(date -d @"$e" +%H:%M:%S)" "$((e - s))" "$(grep -i 'console error\|pageerror\|page error' "$B/$name.log" | grep -vci 'zero console errors')" >> "$B/summary.txt"
}
dev() { local name=$1 script=$2; shift 2; run "$name" env ASTRAEUS_URL=$DEV ASTRAEUS_EVIDENCE_DIR="$B/$name" node "tools/validate/$script" "$@"; }

pictures() {
  run pictures-capture node tools/validate/capture-experience-pictures.mjs --out "$B/pictures" --url "http://localhost:$PUBLIC_PORT"
  run pictures-diff node tools/validate/diff-screenshots.mjs "$BEFORE" "$B/pictures" "$B/diff.json"
  run contact-sheet node tools/validate/contact-sheet.mjs "$BEFORE" "$B/pictures" "$B/diff.json" "$B"
}
laneA() {
  dev lite browser-lite.mjs
  dev spike02 browser-spike02.mjs
  dev shell browser-shell.mjs
  dev anchor-labels browser-anchor-labels.mjs "$B/anchor-labels"
  dev synthetic browser-synthetic.mjs
  dev synthetic-ring browser-synthetic-ring.mjs
  dev synthetic-listed browser-synthetic-listed.mjs
}
laneB() {
  run public-build-assets node tools/validate/public-build-assets.mjs "$SCRATCH/public"
  run public-showers env ASTRAEUS_URL=$PUB ASTRAEUS_EVIDENCE_DIR="$B/public-showers" node tools/validate/browser-public-showers.mjs
  dev earth-moon browser-earth-moon.mjs
  dev jupiter-io browser-jupiter-io.mjs
  dev spike03 browser-spike03.mjs
  dev view-link browser-view-link.mjs
  dev sky browser-sky.mjs
  run story-panels env ASTRAEUS_URL=$DEV ASTRAEUS_OUT="$B/story-panels" node tools/validate/browser-story-panels.mjs
}
laneC() {
  dev showers-perseids browser-showers.mjs perseids
  run showers-geminids env ASTRAEUS_LIGHT=1 ASTRAEUS_URL=$DEV ASTRAEUS_EVIDENCE_DIR="$B/showers-geminids" node tools/validate/browser-showers.mjs geminids
}
# The pictures run first and alone: under load the scene settles differently and the comparison drifts past its tolerance (measured in T-071).
pictures
laneA & A=$!
laneB & Bp=$!
laneC & C=$!
wait "$A" "$Bp" "$C"
echo "total $(( $(date +%s) - START ))s (servers and public build included)" >> "$B/summary.txt"
cat "$B/summary.txt"
grep -q 'exit=[1-9]' "$B/summary.txt" && { echo "FAILED steps above" >&2; exit 1; }
grep -q 'error-lines=[1-9]' "$B/summary.txt" && { echo "error lines in logs (see summary)" >&2; exit 1; }
exit 0
