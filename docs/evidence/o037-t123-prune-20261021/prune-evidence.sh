#!/bin/sh
# O-037 T-123 evidence prune, run by the owner ("Prune to what records cite").
# Dry run by default; pass --apply to delete.
#   1. the 24 run folders/logs no record cites (del2.txt), tracked or not
#   2. every picture (png/jpg/jpeg/webp) left under docs/evidence, tracked or not
set -eu
S=/tmp/claude-1000/-home-user-code-Astraeus/9d85e5d6-91d4-454a-a0d6-81701c464056/scratchpad
cd /home/user/code/Astraeus
APPLY=${1:-}

echo "Before: $(du -sh docs/evidence | cut -f1)"
echo "Uncited entries: $(wc -l < "$S/del2.txt")"
echo "Pictures: $(find docs/evidence -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' \) | wc -l)"
[ "$APPLY" = "--apply" ] || { echo "Dry run only. Re-run with --apply to delete."; exit 0; }

while IFS= read -r name; do
  [ -n "$name" ] || continue
  p="docs/evidence/$name"
  git ls-files --error-unmatch "$p" >/dev/null 2>&1 && git rm -r -q "$p"
  rm -rf "$p"
done < "$S/del2.txt"

find docs/evidence -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' \) > "$S/pictures.txt"
git ls-files -z docs/evidence | tr '\0' '\n' | grep -iE '\.(png|jpe?g|webp)$' | xargs -r -d '\n' git rm -q
xargs -r -d '\n' rm -f < "$S/pictures.txt"
find docs/evidence -type d -empty -delete

echo "After: $(du -sh docs/evidence | cut -f1), $(ls docs/evidence | wc -l) entries"
