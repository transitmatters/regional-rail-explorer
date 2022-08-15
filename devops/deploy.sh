#!/bin/bash
set -e

export AWS_PROFILE=transitmatters
export AWS_REGION=us-east-1
export AWS_DEFAULT_REGION=us-east-1
export AWS_PAGER=""

PRODUCTION=false
CI=false

# Argument parsing
# pass "-p" flag to deploy to production
# pass "-c" flag if deploying with CI

while getopts "pc" opt; do
    case $opt in
        p)
            PRODUCTION=true
            ;;
        c)
            CI=true
            ;;
  esac
done

$PRODUCTION && HOSTNAME="regionalrail.rocks" || HOSTNAME="rre-beta.labs.transitmatters.org"
$PRODUCTION && DOMAIN="regionalrail.rocks" || DOMAIN="labs.transitmatters.org"
$PRODUCTION && CERT_ARN="$TM_RRE_RR_RKS_CERT_ARN" || CERT_ARN="$TM_LABS_WILDCARD_CERT_ARN"

# STACK_NAME="rre-stack-beta-preston"
$PRODUCTION && STACK_NAME="rre" || STACK_NAME="rre-beta"

echo "Deploying Regional Rail Explorer to $HOSTNAME..."
echo "View stack log here: https://$AWS_REGION.console.aws.amazon.com/cloudformation/home?region=$AWS_REGION"

aws cloudformation deploy --stack-name $STACK_NAME \
  --template-file cloudformation.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset \
  --parameter-overrides \
  RREHostname=$HOSTNAME \
  RREDomain=$DOMAIN \
  RRECertArn=$CERT_ARN

EIP=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='InstanceIP'].OutputValue" --output text)
ansible-playbook -i $EIP, -u ubuntu --private-key ~/.ssh/transitmatters-default.pem deploy-on-ec2.yml
