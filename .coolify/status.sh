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

UUID="${1:-}"

if [ -n "$UUID" ]; then
  echo "Checking status for: $UUID"
  curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/applications/$UUID" | jq '.' 2>/dev/null || echo "Error fetching application"
else
  echo "=== Coolify Resources Status ==="
  echo ""
  
  echo "=== Current Team ==="
  curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/teams/current" | jq '.' 2>/dev/null || echo "Error fetching teams"
  echo ""
  
  echo "=== Servers ==="
  curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/servers" | jq '.' 2>/dev/null || echo "Error fetching servers"
  echo ""
  
  echo "=== Projects ==="
  curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/projects" | jq '.' 2>/dev/null || echo "Error fetching projects"
  echo ""
  
  echo "=== Applications ==="
  curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/applications" | jq '.' 2>/dev/null || echo "Error fetching applications"
fi