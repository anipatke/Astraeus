#!/bin/zsh
cd /home/user/code/Astraeus
export PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js
B=docs/evidence/o017-t069-browser-20261016T232625Z
DEV=http://localhost:5474/app.html
run() { name=$1; shift; s=$(date +%H:%M:%S); env "$@" > $B/$name.log 2>&1; rc=$?; e=$(date +%H:%M:%S); errs=$(grep -ci "console error\|pageerror\|page error" $B/$name.log); echo "$name | exit=$rc | $s-$e | error-lines=$errs" >> $B/summary.txt; }
run lite ASTRAEUS_URL=$DEV ASTRAEUS_EVIDENCE_DIR=$B/lite node tools/validate/browser-lite.mjs
run public-showers ASTRAEUS_URL=http://localhost:5475/app.html ASTRAEUS_EVIDENCE_DIR=$B/public-showers node tools/validate/browser-public-showers.mjs
run spike02 ASTRAEUS_URL=$DEV ASTRAEUS_EVIDENCE_DIR=$B/spike02 node tools/validate/browser-spike02.mjs
run spike03 ASTRAEUS_URL=$DEV ASTRAEUS_EVIDENCE_DIR=$B/spike03 node tools/validate/browser-spike03.mjs
run shell ASTRAEUS_URL=$DEV ASTRAEUS_SCREENSHOT=$B/shell/start.png ASTRAEUS_INFO_SCREENSHOTS=$B/shell/info ASTRAEUS_METRIC_SCREENSHOTS=$B/shell/metric node tools/validate/browser-shell.mjs
run anchor-labels ASTRAEUS_URL=$DEV node tools/validate/browser-anchor-labels.mjs $B/anchor-labels
run synthetic ASTRAEUS_URL=$DEV ASTRAEUS_EVIDENCE_DIR=$B/synthetic node tools/validate/browser-synthetic.mjs
run synthetic-ring ASTRAEUS_URL=$DEV ASTRAEUS_EVIDENCE_DIR=$B/synthetic-ring node tools/validate/browser-synthetic-ring.mjs
run synthetic-belt ASTRAEUS_URL=$DEV ASTRAEUS_EVIDENCE_DIR=$B/synthetic-belt node tools/validate/browser-synthetic-belt.mjs
run synthetic-listed ASTRAEUS_URL=$DEV ASTRAEUS_EVIDENCE_DIR=$B/synthetic-listed node tools/validate/browser-synthetic-listed.mjs
run synthetic-eccentric ASTRAEUS_URL=$DEV ASTRAEUS_EVIDENCE_DIR=$B/synthetic-eccentric node tools/validate/browser-synthetic-eccentric.mjs
run marker-existing ASTRAEUS_URL=$DEV ASTRAEUS_EVIDENCE_DIR=$B/marker-existing node tools/validate/browser-marker-existing.mjs
run sky ASTRAEUS_URL=$DEV ASTRAEUS_EVIDENCE_DIR=$B/sky node tools/validate/browser-sky.mjs
run sun ASTRAEUS_URL=$DEV ASTRAEUS_EVIDENCE_DIR=$B/sun node tools/validate/browser-sun.mjs
run earth-moon ASTRAEUS_URL=$DEV ASTRAEUS_EVIDENCE_DIR=$B/earth-moon node tools/validate/browser-earth-moon.mjs
run jupiter-io ASTRAEUS_URL=$DEV ASTRAEUS_EVIDENCE_DIR=$B/jupiter-io node tools/validate/browser-jupiter-io.mjs
run showers-perseids ASTRAEUS_URL=$DEV ASTRAEUS_EVIDENCE_DIR=$B/showers-perseids node tools/validate/browser-showers.mjs perseids
run showers-geminids ASTRAEUS_URL=$DEV ASTRAEUS_EVIDENCE_DIR=$B/showers-geminids node tools/validate/browser-showers.mjs geminids
run view-link ASTRAEUS_URL=$DEV node tools/validate/browser-view-link.mjs
run precision ASTRAEUS_URL=$DEV ASTRAEUS_EVIDENCE_DIR=$B/precision node tools/validate/browser-precision.mjs
run story-panels ASTRAEUS_URL=$DEV ASTRAEUS_OUT=$B/story-panels-out node tools/validate/browser-story-panels.mjs
echo ALLDONE >> $B/summary.txt
