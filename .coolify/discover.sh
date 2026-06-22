#!/usr/bin/env bash

if [ -f .env.coolify ]; then
  export $(cat .env.coolify | grep -v '^#' | xargs)
fi

if [ -z "$COOLIFY_URL" ] || [ -z "$COOLIFY_TOKEN" ]; then
  echo "Error: COOLIFY_URL and COOLIFY_TOKEN must be set in .env.coolify"
  echo "Creating template .env.coolify..."
  cat > .env.coolify << 'ENVEOF'
# Coolify API Configuration
# Your Coolify instance URL (no trailing slash)
COOLIFY_URL=https://your-coolify-instance.com

# Your API token with read, write, and deploy permissions
COOLIFY_TOKEN=your_api_token_here
ENVEOF
  echo "Created .env.coolify - please edit with your values"
  exit 1
fi

OUTPUT_FILE="${1:-.coolify/inventory.json}"

echo "=== Discovering Coolify Resources ==="
echo ""

echo "Fetching teams..."
TEAMS=$(curl -s -f -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/teams" 2>/dev/null || echo "[]")

echo "Fetching servers..."
SERVERS=$(curl -s -f -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/servers" 2>/dev/null || echo "[]")

echo "Fetching projects..."
PROJECTS=$(curl -s -f -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/projects" 2>/dev/null || echo "[]")

echo "Fetching applications..."
APPLICATIONS=$(curl -s -f -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/applications" 2>/dev/null || echo "[]")

echo "Fetching resources..."
RESOURCES=$(curl -s -f -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/resources" 2>/dev/null || echo "[]")

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat > "$OUTPUT_FILE" << EOF
{
  "generated_at": "$TIMESTAMP",
  "coolify_url": "$COOLIFY_URL",
  "teams": $TEAMS,
  "servers": $SERVERS,
  "projects": $PROJECTS,
  "applications": $APPLICATIONS,
  "resources": $RESOURCES
}
EOF

echo ""
echo "Inventory saved to: $OUTPUT_FILE"
echo ""
echo "=== Summary ==="
echo "Teams: $(echo "$TEAMS" | jq 'length' 2>/dev/null || echo "0")"
echo "Servers: $(echo "$SERVERS" | jq 'length' 2>/dev/null || echo "0")"
echo "Projects: $(echo "$PROJECTS" | jq 'length' 2>/dev/null || echo "0")"
echo "Applications: $(echo "$APPLICATIONS" | jq 'length' 2>/dev/null || echo "0")"
echo "Resources: $(echo "$RESOURCES" | jq 'length' 2>/dev/null || echo "0")"