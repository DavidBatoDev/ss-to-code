#!/usr/bin/env bash
# Destroys everything this project created in AWS.
# Usage: ./scripts/teardown.sh   (run from the repo root; needs aws cli + terraform)
set -euo pipefail
cd "$(dirname "$0")/../terraform"

REGION=$(terraform output -raw ssm 2>/dev/null | sed -n 's/.*--region //p')
REGION=${REGION:-ap-southeast-1}
BUCKET=$(terraform output -raw bucket_name 2>/dev/null || true)

if [ -n "$BUCKET" ] && aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "Emptying s3://$BUCKET (all versions)..."
  while :; do
    OBJS=$(aws s3api list-object-versions --bucket "$BUCKET" --max-items 500 --output json \
      --query '{Objects: [Versions[].{Key:Key,VersionId:VersionId}, DeleteMarkers[].{Key:Key,VersionId:VersionId}][]}')
    [ "$(echo "$OBJS" | grep -c '"Key"')" -eq 0 ] && break
    aws s3api delete-objects --bucket "$BUCKET" --delete "$OBJS" >/dev/null
  done
fi

echo "Running terraform destroy..."
terraform destroy -auto-approve

echo "Checking for leftovers tagged Project=ss-to-code in $REGION..."
LEFT=$(aws resourcegroupstaggingapi get-resources --region "$REGION" \
  --tag-filters Key=Project,Values=ss-to-code --query 'ResourceTagMappingList[].ResourceARN' --output text)
LEFT_CF=$(aws resourcegroupstaggingapi get-resources --region us-east-1 \
  --tag-filters Key=Project,Values=ss-to-code --query 'ResourceTagMappingList[].ResourceARN' --output text)
if [ -z "$LEFT$LEFT_CF" ]; then
  echo "All clean. (The tagging API can lag a few minutes behind deletions.)"
else
  echo "Still listed (may be eventual consistency; re-run in a few minutes):"
  echo "$LEFT $LEFT_CF" | tr ' \t' '\n\n' | sed '/^$/d'
fi
