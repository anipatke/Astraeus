#!/usr/bin/env bash
# Checker's full gate over the uncommitted spike-04 tree (frozen snapshot), 2026-10-17.
R=/home/user/code/Astraeus; SNAP=/tmp/claude-1000/-home-user-code-Astraeus/9f41da67-d196-4cdd-b989-572f65eae286/scratchpad/check-snap
TS=$(date -u +%Y%m%dT%H%M%SZ); E=$R/docs/evidence/night-check-$TS; mkdir -p $E
rm -rf $SNAP; mkdir -p $SNAP
rsync -a --exclude node_modules --exclude dist --exclude docs/evidence --exclude .git $R/ $SNAP/
ln -s $R/node_modules $SNAP/node_modules
cp "$0" $E/check-run.sh
cd $SNAP || exit 1
S=$E/summary.txt; echo "checker run $TS; HEAD $(git -C $R rev-parse --short HEAD) + uncommitted tree snapshot at $SNAP" > $S
(cd $R && git status --porcelain) > $E/tree-status.txt
gate() { name=$1; shift; st=$(date -u +%T); "$@" > $E/$name.log 2>&1; echo "$name | exit=$? | $st-$(date -u +%T) | $*" >> $S; }
gate typecheck npm run typecheck
gate vitest npx vitest run
gate build npm run build
gate public-build env ASTRAEUS_PUBLIC_BUILD=1 npm run build
gate public-build-assets node tools/validate/public-build-assets.mjs dist $E/public-build-assets.json
export PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js
npx vite preview --port 5452 --strictPort > $E/preview.log 2>&1 & PP=$!
sleep 5; mkdir -p $E/public-showers
gate public-showers env ASTRAEUS_URL=http://localhost:5452/app.html ASTRAEUS_EVIDENCE_DIR=$E/public-showers node tools/validate/browser-public-showers.mjs
kill $PP; pkill -f "vite preview --port 5452"
export ASTRAEUS_URL=http://localhost:5451/app.html
npx vite --port 5451 --strictPort > $E/vite.log 2>&1 & VP=$!
sleep 6
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
kill $VP 2>/dev/null; pkill -f "vite --port 5451"
echo ALLDONE >> $S; echo $E
