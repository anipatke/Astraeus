cd /home/user/code/astraeus-labels
export PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js
for s in "browser-anchor-labels.mjs" "browser-earth-moon.mjs" "browser-jupiter-io.mjs" "browser-orbit-motion.mjs" "browser-orbit-look.mjs" "browser-lite.mjs"; do
  while pgrep -f '[c]hrome-headless-shell' >/dev/null || [ "$(awk '{print int($1)}' /proc/loadavg)" -ge 6 ]; do sleep 30; done
  n=${s%.mjs}
  extra=""; [ "$s" = browser-anchor-labels.mjs ] && extra="docs/evidence/o024-labels-lite-20261018T0519Z/anchor-labels"
  ASTRAEUS_URL=http://localhost:5660/app.html ASTRAEUS_EVIDENCE_DIR=docs/evidence/o024-labels-lite-20261018T0519Z/$n node tools/validate/$s $extra > docs/evidence/o024-labels-lite-20261018T0519Z/$n.log 2>&1
  echo "$n exit=$? error-lines=$(grep -i 'console error\|pageerror\|page error' docs/evidence/o024-labels-lite-20261018T0519Z/$n.log | grep -vci 'zero console errors')" >> docs/evidence/o024-labels-lite-20261018T0519Z/summary.txt
done
echo DONE >> docs/evidence/o024-labels-lite-20261018T0519Z/summary.txt
