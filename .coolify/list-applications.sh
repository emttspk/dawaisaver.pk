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

echo "=== UUID Inventory ==="
echo ""

echo "=== Applications ==="
curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/applications" | jq -r '.[] | "\(.uuid) - \(.name) [\(.destination?.server?.name // "no-server")]"' 2>/dev/null || echo "Error fetching applications"
echo ""

echo "=== Projects ==="
curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/projects" | jq -r '.[] | "\(.uuid) - \(.name)"' 2>/dev/null || echo "Error fetching projects"
echo ""

echo "=== Environments ==="
PROJECTS=$(curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/projects" | jq -r '.[].uuid' 2>/dev/null)
for PROJECT_UUID in $PROJECTS; do
  curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/projects/$PROJECT_UUID/environments" | jq -r --arg pu "$PROJECT_UUID" '.[] | "  \($pu) -> \(.uuid) - \(.name)"' 2>/dev/null
done
echo ""

echo "=== Servers ==="
curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/servers" | jq -r '.[] | "\(.uuid) - \(.name) [\(.ip)]"' 2>/dev/null || echo "Error fetching servers"