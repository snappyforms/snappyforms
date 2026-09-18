#!/usr/bin/env bash
# Render one storyboard to WebM + MP4.
#
# shot-scraper has no --url override and no templating, so the storyboard keeps
# ${BASE_URL} and ${ACTIVITY_DATE} as placeholders and we substitute them here.
#
# BASE_URL is what lets the same storyboard record against the compose stack or
# a deployed URL:
#
#   BASE_URL=http://webapp:3000            (docker compose, the default)
#   BASE_URL=https://your-app.web.app      (a deployed demo)
#
# ACTIVITY_DATE defaults to yesterday (UTC). It cannot be hardcoded in the
# storyboard: the PA 1895 covers one Sunday-Saturday week, so a fixed date would
# silently fall out of the current form week and break the last beat of the tour.
set -euo pipefail

STORYBOARD="${STORYBOARD:-maya-confirmation.storyboard.yml}"
export BASE_URL="${BASE_URL:-http://webapp:3000}"
export ACTIVITY_DATE="${ACTIVITY_DATE:-$(date -u -d 'yesterday' +%F)}"
RENDERED="/tmp/$(basename "$STORYBOARD")"

mkdir -p output

# python3 rather than envsubst: it is guaranteed present in this image, and it
# leaves any other $-sign in the storyboard alone.
python3 - "$STORYBOARD" "$RENDERED" <<'PY'
import os, sys
src, dst = sys.argv[1], sys.argv[2]
text = open(src).read()
for name in ("BASE_URL", "ACTIVITY_DATE"):
    text = text.replace("${%s}" % name, os.environ[name])
open(dst, "w").write(text)
PY

echo "Recording $STORYBOARD against $BASE_URL (activity date $ACTIVITY_DATE)"
exec shot-scraper video "$RENDERED" --mp4 "$@"
