#!/bin/bash
# Comprehensive validation script for Coolify automation package
# Run this on the Hetzner VPS where Coolify is installed

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

set -e

echo "========================================"
echo "Coolify Automation Package Validation"
echo "========================================"
echo ""

# Check for .env.coolify
if [ ! -f "$SCRIPT_DIR/.env.coolify" ]; then
    echo "ERROR: .env.coolify not found"
    echo "Run: cp $SCRIPT_DIR/.env.example $SCRIPT_DIR/.env.coolify"
    echo "Then edit with your COOLIFY_URL and COOLIFY_TOKEN"
    exit 1
fi

export $(cat "$SCRIPT_DIR/.env.coolify" | grep -v '^#' | xargs)

if [ -z "$COOLIFY_URL" ] || [ -z "$COOLIFY_TOKEN" ]; then
    echo "ERROR: COOLIFY_URL and COOLIFY_TOKEN must be set"
    exit 1
fi

PASS_COUNT=0
FAIL_COUNT=0

echo "1. Authentication Test"
echo "----------------------"
AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/teams/current")
AUTH_CODE=$(echo "$AUTH_RESPONSE" | tail -n1)
if [ "$AUTH_CODE" = "200" ]; then
    echo "   [PASS] Authentication successful"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "   [FAIL] Authentication failed (HTTP $AUTH_CODE)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

echo "2. Server Status Test"
echo "----------------------"
SERVERS=$(curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/servers")
UNREACHABLE=$(echo "$SERVERS" | jq '[.[] | select(.settings.is_reachable == false)] | length')
REACHABLE=$(echo "$SERVERS" | jq '[.[] | select(.settings.is_reachable == true)] | length')
if [ "$REACHABLE" -gt 0 ]; then
    echo "   [PASS] $REACHABLE server(s) reachable"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "   [FAIL] No reachable servers"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

echo "3. Applications Test"
echo "----------------------"
APPLICATIONS=$(curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/applications")
APP_COUNT=$(echo "$APPLICATIONS" | jq 'length')
if [ "$APP_COUNT" -gt 0 ]; then
    echo "   [PASS] Found $APP_COUNT application(s)"
    PASS_COUNT=$((PASS_COUNT + 1))
    echo "   Applications:"
    echo "$APPLICATIONS" | jq -r '.[] | "   - \(.name) [\(.uuid)]"'
else
    echo "   [FAIL] No applications found"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

echo "4. Inventory Generation Test"
echo "----------------------"
bash "$SCRIPT_DIR/discover.sh" > /dev/null 2>&1
if [ -f "$SCRIPT_DIR/inventory.json" ]; then
    INV_APPS=$(cat "$SCRIPT_DIR/inventory.json" | jq '.applications | length')
    if [ "$INV_APPS" -gt 0 ]; then
        echo "   [PASS] inventory.json created with $INV_APPS applications"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo "   [FAIL] inventory.json has no applications"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
else
    echo "   [FAIL] inventory.json not created"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

echo "5. Git Ignore Test"
echo "----------------------"
if git status --ignored 2>/dev/null | grep -q "env.coolify"; then
    echo "   [PASS] .env.coolify is gitignored"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "   [FAIL] .env.coolify not in gitignore"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

if git status --ignored 2>/dev/null | grep -q "inventory.json"; then
    echo "   [PASS] inventory.json is gitignored"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "   [FAIL] inventory.json not in gitignore"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

echo "========================================"
echo "VALIDATION SUMMARY"
echo "========================================"
echo "PASS: $PASS_COUNT"
echo "FAIL: $FAIL_COUNT"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo "All validation checks passed!"
    exit 0
else
    echo "Some validation checks failed!"
    exit 1
fi