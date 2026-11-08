#!/bin/bash
set -e

export AWS_PROFILE=transitmatters
export AWS_REGION=us-east-1
export AWS_DEFAULT_REGION=us-east-1
export AWS_PAGER=""

# Ensure required secrets are set
if [[ -z "$DD_API_KEY" ]]; then
    echo "Must provide DD_API_KEY in environment to deploy" 1>&2
    exit 1
fi

PRODUCTION=false
LOCAL=false

# Argument parsing
# pass "-p" flag to deploy to production
# pass "-l" flag to build and package release/ locally before deploying

while getopts "pl" opt; do
    case $opt in
        p)
            PRODUCTION=true
            ;;
        l)
            LOCAL=true
            ;;
  esac
done

if $LOCAL; then
    echo "Building application locally..."
    # Lambda runs arm64, so a build from an x86 machine bundles the wrong sharp binary
    (
        cd "$(dirname "$0")/.."
        npm ci && npm run build
    )
    bash "$(dirname "$0")/package-release.sh"
fi

$PRODUCTION && HOSTNAME="regionalrail.rocks" || HOSTNAME="rre-beta.labs.transitmatters.org"
$PRODUCTION && DOMAIN="regionalrail.rocks" || DOMAIN="labs.transitmatters.org"
$PRODUCTION && CERT_ARN="$TM_RRE_RR_RKS_CERT_ARN" || CERT_ARN="$TM_LABS_WILDCARD_CERT_ARN"

$PRODUCTION && STACK_NAME="rre" || STACK_NAME="rre-beta"
$PRODUCTION && DD_ENV="prod" || DD_ENV="beta"

# Holds the zipped release/ that `aws cloudformation package` uploads. Created once by hand
# (see README); a lifecycle rule expires old packages.
DEPLOY_BUCKET="rre-lambda-deployments"

# Identify the version and commit of the current deploy
export GIT_SHA=`git rev-parse HEAD`
echo "Deploying version $GIT_SHA"

echo "Deploying Regional Rail Explorer to $HOSTNAME..."
echo "View stack log here: https://$AWS_REGION.console.aws.amazon.com/cloudformation/home?region=$AWS_REGION"

# /_next/static (from release-static/, see package-release.sh) is served from S3. Upload it before
# the stack update so the new code's pages never reference chunks that aren't there yet. Nothing
# is deleted: chunk names are content hashes, and cached pages from earlier deploys still need theirs.
upload_static() {
    local bucket
    bucket=$(aws cloudformation describe-stacks --stack-name $STACK_NAME \
        --query "Stacks[0].Outputs[?OutputKey=='StaticBucketName'].OutputValue" --output text 2>/dev/null || true)
    if [[ -z "$bucket" || "$bucket" == "None" ]]; then
        echo "No static bucket yet; it is created by the stack"
        return 0
    fi
    echo "Uploading /_next/static to s3://$bucket..."
    aws s3 sync "$(dirname "$0")/../release-static/" "s3://$bucket/" \
        --cache-control "public, max-age=31536000, immutable" --only-show-errors
}
upload_static

# Zips release/ (CodeUri in the template), uploads it, and points the template at the upload
aws cloudformation package \
    --template-file cloudformation.json \
    --s3-bucket $DEPLOY_BUCKET \
    --s3-prefix $STACK_NAME \
    --output-template-file packaged.json \
    --use-json

aws cloudformation deploy --stack-name $STACK_NAME \
    --template-file packaged.json \
    --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
    --no-fail-on-empty-changeset \
    --tags service=regional-rail-explorer team=tm-labs \
    --parameter-overrides \
    RREHostname=$HOSTNAME \
    RREDomain=$DOMAIN \
    RRECertArn=$CERT_ARN \
    GitSha=$GIT_SHA \
    DDApiKey=$DD_API_KEY \
    DDEnv=$DD_ENV

# A new stack's bucket only exists now; otherwise this finds everything already uploaded
upload_static

# Grab the cloudfront ID and invalidate its cache
CLOUDFRONT_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items!=null] | [?contains(Aliases.Items, '$HOSTNAME')].Id | [0]" --output text)
INVALIDATION_ID=$(aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*" --query Invalidation.Id --output text)

# Fail the deploy if the new code can't answer an API call the explorer makes. It runs
# mapScenarios, so it also catches a missing or broken scenarios.json. The unique query string
# skips CloudFront's cache.
HEALTH_URL="https://$HOSTNAME/api/arrivals?from=place-sstat&to=place-ER-0362&day=weekday&deploy=$GIT_SHA-$(date +%s)"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 --retry 3 --retry-all-errors "$HEALTH_URL")
if [ "$HEALTH_STATUS" != "200" ]; then
    echo "Health check failed: $HEALTH_URL returned $HEALTH_STATUS" 1>&2
    exit 1
fi
echo "Health check passed: $HEALTH_URL"

# Refill the cache for the home page and its suggested journeys, so the first visitors after a
# deploy don't each wait on a Lambda cold start. Warming before the invalidation finishes would
# just have it thrown away. Usually takes 1-3 minutes.
echo "Waiting for CloudFront invalidation $INVALIDATION_ID..."
aws cloudfront wait invalidation-completed --distribution-id $CLOUDFRONT_ID --id $INVALIDATION_ID
bash "$(dirname "$0")/warm-cache.sh" "$HOSTNAME"
