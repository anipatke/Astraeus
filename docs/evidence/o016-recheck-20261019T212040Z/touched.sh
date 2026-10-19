#!/usr/bin/env bash
# Sequential touched-areas browser run for the O-016 re-check; one browser job at a time.
set -u
cd /home/user/code/Astraeus
B=$1
export PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js
PORT=5479
DEV=http://localhost:$PORT/app.html
npx vite --port $PORT --strictPort > "$B/dev-server.log" 2>&1 &
cleanup() { fuser -k "$PORT/tcp" >/dev/null 2>&1; }
trap cleanup EXIT
for _ in $(seq 1 120); do curl -sf "$DEV" >/dev/null && break; sleep 0.5; done
run() {
  local name=$1 script=$2; shift 2
  local s; s=$(date +%s)
  env ASTRAEUS_URL=$DEV ASTRAEUS_EVIDENCE_DIR="$B/$name" node "tools/validate/$script" "$@" > "$B/$name.log" 2>&1; local rc=$?
  local e; e=$(date +%s)
  printf '%s | exit=%s | %s-%s UTC | %ss | error-lines=%s\n' "$name" "$rc" "$(date -u -d @"$s" +%H:%M:%S)" "$(date -u -d @"$e" +%H:%M:%S)" "$((e - s))" "$(grep -i 'console error\|pageerror\|page error' "$B/$name.log" | grep -vci 'zero console errors')" >> "$B/summary.txt"
}
run lite browser-lite.mjs
run shell browser-shell.mjs
run phone browser-phone.mjs
run sky browser-sky.mjs
run home-curve-fits browser-home-curve-fits.mjs
run embedded browser-embedded.mjs
cat "$B/summary.txt"
