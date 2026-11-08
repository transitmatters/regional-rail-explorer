#!/bin/bash
# Packages a finished `npm run build` into release/, the directory Lambda runs as /var/task,
# and release-static/, the /_next/static files that deploy.sh uploads to S3.
# Used by the deploy workflow and by `deploy.sh -l`. Build on arm64 (like CI does) so the
# bundled sharp binary matches the arm64 function.
set -euo pipefail

cd "$(dirname "$0")/.."

rm -rf release && mkdir release
cp -r .next/standalone/. release/
cp -r public release/public
cp scenarios.json release/

# Build-hashed JS and CSS go to S3 rather than Lambda (CloudFront routes /_next/static/* there),
# laid out as their URL paths. deploy.sh uploads this.
rm -rf release-static && mkdir -p release-static/_next
cp -r .next/static release-static/_next/static

# The Web Adapter's entry point, and fonts for the summary card (see devops/lambda/)
cp devops/lambda/run.sh release/run.sh
chmod +x release/run.sh
cp -r devops/lambda/fonts release/fonts

# Next traces the sharp binary for the machine that built it. Packaging on anything but
# Linux arm64 (e.g. a Mac for a beta deploy) swaps in the linux-arm64 binaries Lambda needs,
# at the versions this sharp expects.
if [ "$(uname -s)-$(uname -m)" != "Linux-aarch64" ]; then
    echo "Not on Linux arm64; bundling sharp's linux-arm64 binaries for Lambda"
    SHARP_PKG=node_modules/sharp/package.json
    PACK_DIR=$(mktemp -d)
    rm -rf release/node_modules/@img
    for name in sharp-linux-arm64 sharp-libvips-linux-arm64; do
        version=$(node -p "require('./$SHARP_PKG').optionalDependencies['@img/$name']")
        tarball=$(npm pack "@img/$name@$version" --pack-destination "$PACK_DIR" --silent)
        mkdir -p "release/node_modules/@img/$name"
        tar xzf "$PACK_DIR/$tarball" -C "release/node_modules/@img/$name" --strip-components 1
    done
    rm -rf "$PACK_DIR"
fi

du -sh release

# Lambda rejects a function whose unzipped code plus layers is over 250 MB. The Web Adapter and
# Datadog extension layers take ~20 MB of that, so fail here rather than halfway through a deploy.
LIMIT_MB=225
SIZE_MB=$(du -sm release | cut -f1)
if [ "$SIZE_MB" -gt "$LIMIT_MB" ]; then
    echo "release/ is ${SIZE_MB} MB unzipped, over the ${LIMIT_MB} MB budget for Lambda" 1>&2
    exit 1
fi
