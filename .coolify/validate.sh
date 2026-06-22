#!/usr/bin/env bash

if [ -f .env.coolify ]; then
  export $(cat .env.coolify | grep -v '^#' | xargs)
fi

if [ -z "$COOLIFY_URL" ] || [ -z "$COOLIFY_TOKEN" ]; then
  echo "Error: COOLIFY_URL and COOLIFY_TOKEN must be set in .env.coolify"
  echo "Run: cp .coolify/.env.example .coolify/.env.coolify"
  exit 1
fi

echo "=== Coolify Validation Checklist ==="
echo ""

echo "1. Checking API authentication..."
AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/teams/current" 2>/dev/null)
AUTH_CODE=$(echo "$AUTH_RESPONSE" | tail -n1)
if [ "$AUTH_CODE" = "200" ]; then
  echo "   [PASS] Authentication successful"
else
  echo "   [FAIL] Authentication failed (HTTP $AUTH_CODE)"
  exit 1
fi

echo ""
echo "2. Checking server reachability..."
SERVERS=$(curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/servers" 2>/dev/null)
echo "$SERVERS" | jq -r '.[] | "   \(.name): reachable=\(.settings.is_reachable), usable=\(.settings.is_usable)"' 2>/dev/null

echo ""
echo "3. Checking applications..."
APPLICATIONS=$(curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/applications" 2>/dev/null)
APP_COUNT=$(echo "$APPLICATIONS" | jq 'length' 2>/dev/null || echo "0")
echo "   Total applications: $APP_COUNT"

echo ""
echo "4. Application status:"
echo "$APPLICATIONS" | jq -r '.[] | "   \(.name): \(.status)"' 2>/dev/null

echo ""
echo "Validation complete."