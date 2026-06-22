#!/usr/bin/env bash

if [ -f .env.coolify ]; then
  export $(cat .env.coolify | grep -v '^#' | xargs)
fi

if [ -z "$COOLIFY_URL" ] || [ -z "$COOLIFY_TOKEN" ]; then
  echo "Error: COOLIFY_URL and COOLIFY_TOKEN must be set in .env.coolify"
  echo "Run: cp .coolify/.env.example .coolify/.env.coolify"
  exit 1
fi

WEB_UUID="${1:-}"
if [ -z "$WEB_UUID" ]; then
  echo "Usage: $0 <application_uuid>"
  echo "Run 'bash .coolify/list-applications.sh' to see available applications"
  exit 1
fi

echo "Restarting Web application: $WEB_UUID"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  "$COOLIFY_URL/api/v1/applications/$WEB_UUID/restart")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "202" ]; then
  echo "Restart initiated successfully"
  echo "$BODY" | jq -r '.message // .uuid // .' 2>/dev/null || echo "$BODY"
else
  echo "Restart failed with HTTP $HTTP_CODE"
  echo "$BODY"
  exit 1
fi