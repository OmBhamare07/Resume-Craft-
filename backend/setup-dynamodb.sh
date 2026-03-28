#!/bin/bash
# Run this ONCE on your EC2 to create the DynamoDB tables
# Requires AWS CLI installed and IAM role with DynamoDB permissions

REGION="us-east-1"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Creating DynamoDB Tables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "▶ Creating resumecraft-users table..."
aws dynamodb create-table \
  --table-name resumecraft-users \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --global-secondary-indexes '[{
    "IndexName": "EmailIndex",
    "KeySchema": [{"AttributeName":"email","KeyType":"HASH"}],
    "Projection": {"ProjectionType":"ALL"},
    "BillingMode": "PAY_PER_REQUEST"
  }]' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION && echo "  ✅ resumecraft-users created"

echo ""
echo "▶ Creating resumecraft-resumes table..."
aws dynamodb create-table \
  --table-name resumecraft-resumes \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=resumeId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=resumeId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION && echo "  ✅ resumecraft-resumes created"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Done! Both tables are ready."
echo "  Billing mode: Pay-per-request (free tier eligible)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "▶ Creating resumecraft-cover-letters table..."
aws dynamodb create-table \
  --table-name resumecraft-cover-letters \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=letterId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=letterId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION && echo "  ✅ resumecraft-cover-letters created"

echo ""
echo "▶ Note: To set yourself as super admin, run this command after setup:"
echo "  aws dynamodb scan --table-name resumecraft-users --filter-expression 'email = :e' --expression-attribute-values '{\":e\":{\"S\":\"ombhamare178@gmail.com\"}}' --query 'Items[0].userId.S' --output text"
echo "  Then: aws dynamodb update-item --table-name resumecraft-users --key '{\"userId\":{\"S\":\"YOUR_USER_ID\"}}' --update-expression 'SET #r = :r' --expression-attribute-names '{\"#r\":\"role\"}' --expression-attribute-values '{\":r\":{\"S\":\"admin\"}}'"
