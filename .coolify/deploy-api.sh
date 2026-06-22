#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$SCRIPT_DIR/.env.coolify" ]; then
  export $(cat "$SCRIPT_DIR/.env.coolify" | grep -v '^#' | xargs)
fi

if [ -z "$COOLIFY_URL" ] || [ -z "$COOLIFY_TOKEN" ]; then
  echo "Error: COOLIFY_URL and COOLIFY_TOKEN must be set in .env.coolify"
  echo "Run: cp $SCRIPT_DIR/.env.example $SCRIPT_DIR/.env.coolify"
  exit 1
fi

API_UUID="${1:-}"
if [ -z "$API_UUID" ]; then
  echo "Usage: $0 <application_uuid>"
  echo "Run 'bash $SCRIPT_DIR/list-applications.sh' to see available applications"
  exit 1
fi

echo "Deploying API application: $API_UUID"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  "$COOLIFY_URL/api/v1/applications/$API_UUID/start")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "202" ]; then
  echo "Deploy started successfully"
  echo "$BODY" | jq -r '.message // .uuid // .' 2>/dev/null || echo "$BODY"
else
  echo "Deploy failed with HTTP $HTTP_CODE"
  echo "$BODY"
  exit 1
fi