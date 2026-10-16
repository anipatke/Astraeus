#!/usr/bin/env bash
# I-022 browser run (vite :5409), repo checkout, sequential.
cd /home/user/code/Astraeus || exit 1
E=docs/evidence/i022-20261016T115528Z; mkdir -p $E
export PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js
export ASTRAEUS_URL=http://localhost:5409/app.html
npx vite --port 5409 --strictPort > $E/vite.log 2>&1 &
VP=$!; sleep 6
S=$E/summary.txt; echo "I-022 run; HEAD $(git rev-parse --short HEAD) + working tree; $ASTRAEUS_URL" > $S
run() { name=$1; shift; mkdir -p $E/$name; st=$(date -u +%T)
  ASTRAEUS_EVIDENCE_DIR=$E/$name "$@" > $E/$name.log 2>&1; rc=$?
  ce=$(grep -ci "console error\|pageerror" $E/$name.log)
  echo "$name | exit=$rc | $st-$(date -u +%T) | console-error-lines=$ce | $*" >> $S; }
run spike02 node tools/validate/browser-spike02.mjs
run spike03 node tools/validate/browser-spike03.mjs
run shell env ASTRAEUS_SCREENSHOT=$E/shell/start.png ASTRAEUS_INFO_SCREENSHOTS=$E/shell/info ASTRAEUS_METRIC_SCREENSHOTS=$E/shell/metric node tools/validate/browser-shell.mjs
run anchor-labels node tools/validate/browser-anchor-labels.mjs $E/anchor-labels
run synthetic node tools/validate/browser-synthetic.mjs
run synthetic-ring node tools/validate/browser-synthetic-ring.mjs
run synthetic-belt node tools/validate/browser-synthetic-belt.mjs
run synthetic-listed node tools/validate/browser-synthetic-listed.mjs
run synthetic-eccentric node tools/validate/browser-synthetic-eccentric.mjs
run marker-existing node tools/validate/browser-marker-existing.mjs
run sky node tools/validate/browser-sky.mjs
run sky-map node tools/validate/browser-sky-map.mjs
run sun node tools/validate/browser-sun.mjs
run earth-moon node tools/validate/browser-earth-moon.mjs
run jupiter-io node tools/validate/browser-jupiter-io.mjs
run showers-perseids node tools/validate/browser-showers.mjs perseids
run showers-geminids node tools/validate/browser-showers.mjs geminids
run showers-gmn node tools/validate/browser-showers-gmn.mjs
run view-link node tools/validate/browser-view-link.mjs
run precision node tools/validate/browser-precision.mjs
run lighting node tools/validate/browser-lighting.mjs
run story-panels env ASTRAEUS_OUT=$E/story-panels-out node tools/validate/browser-story-panels.mjs

kill $VP 2>/dev/null
run public-showers env ASTRAEUS_URL=http://localhost:5410/app.html node tools/validate/browser-public-showers.mjs
echo ALLDONE >> $S
