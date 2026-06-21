#!/bin/bash
# DRAP Mirror Production Verification Script
# Run this to verify the current state of the mirror system

echo "=== DawaiSaver.pk DRAP Mirror Verification ==="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  echo "Set it with: export DATABASE_URL='postgresql://user:pass@host:port/db'"
  exit 1
fi

echo "1. Checking mirror_runtime_control table..."
npx prisma db pull --schema prisma/schema.prisma 2>/dev/null || true

echo ""
echo "2. Querying mirror state..."
npx prisma query --schema prisma/schema.prisma '
model MirrorRuntimeControl {
  key: String @id
  state: String
  updatedAt: DateTime
  createdAt: DateTime
}
' 2>/dev/null || echo "Direct query not available, using SQL..."

echo ""
echo "Run the following SQL queries against your database:"
echo ""
cat diagnostics/verify-mirror-state.sql