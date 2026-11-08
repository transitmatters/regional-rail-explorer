#!/bin/bash
# Usage: warm-cache.sh <hostname>
# Run after a deploy's CloudFront invalidation has finished. Requests the home page, everything
# it references (scripts, styles, images, and the suggested /explore journeys), and for each
# /explore page its own assets and summary card, so a first visitor after a deploy gets cached
# responses instead of waiting on Lambda cold starts.
#
# CloudFront caches per edge location, so this fills the edge near the machine running the deploy
# and the regional cache behind it. Visitors served by other edges can still miss, but they will
# usually find the response in that regional cache.
set -uo pipefail

HOST="$1"
ORIGIN="https://$HOST"
# CloudFront caches compressed and uncompressed responses separately; ask like a browser does
ACCEPT_ENCODING="gzip, deflate, br, zstd"

# Newline-separated, rather than an associative array, so this runs on macOS's bash 3.2
seen=""
count=0
failures=0

fetch() {
    local path="$1"
    if printf '%s\n' "$seen" | grep -qxF -- "$path"; then
        return 0
    fi
    seen="$seen"$'\n'"$path"
    count=$((count + 1))
    local status
    status=$(curl -s -o /dev/null -w "%{http_code} %{time_total}s %header{x-cache}" \
        -H "Accept-Encoding: $ACCEPT_ENCODING" --max-time 30 "$ORIGIN$path")
    echo "  $status $path"
    [[ "$status" == 200* ]] || failures=$((failures + 1))
}

# Same-origin URLs a page references, with HTML entities in query strings decoded
links_in() {
    curl -s --compressed -H "Accept-Encoding: $ACCEPT_ENCODING" --max-time 30 "$ORIGIN$1" \
        | grep -oE '(src|href|content)="(/[^/"]|\./|https://'"$HOST"'/)[^"]*"' \
        | sed -E 's/^(src|href|content)="//; s/"$//; s/&amp;/\&/g; s#^\./#/#; s#^https://'"$HOST"'##' \
        | sort -u
}

echo "Warming CloudFront for $HOST..."
fetch "/"
for path in $(links_in "/"); do
    fetch "$path"
    if [[ "$path" == /explore\?* ]]; then
        # The page's own chunks, and its og:image summary card, which link previews request
        for sub in $(links_in "$path"); do
            fetch "$sub"
        done
    fi
done

echo "Warmed $count URLs, $failures failed"
# A failed warm-up shouldn't fail the deploy; the health check has already passed
exit 0
