# Coolify Automation Package - Validation Instructions

## Prerequisites

You must run these validation commands on the **Hetzner VPS** where Coolify is installed.

## Step 1: Setup Environment

```bash
# SSH into Hetzner VPS
ssh root@your-server-ip

# Navigate to project
cd /path/to/DawaiSaver.pk

# Create environment file
cp .coolify/.env.example .coolify/.env.coolify
vim .coolify/.env.coolify
# Set:
# COOLIFY_URL=https://yh5wt7bbkhqsjycey5df0lbe.178.105.221.236.sslip.io
# COOLIFY_TOKEN=<your-api-token>
```

## Step 2: Run Validation

```bash
# Run validation checklist
bash .coolify/validate.sh

# Expected output:
# 1. Checking API authentication... [PASS] Authentication successful
# 2. Checking server reachability...
#    localhost: reachable=true, usable=true
# 3. Checking applications...
#    Total applications: X
# 4. Application status:
#    API: running:healthy
#    Web: running:healthy
# Validation complete.
```

## Step 3: Discover Resources

```bash
# Create inventory
bash .coolify/discover.sh

# Verify inventory.json
cat .coolify/inventory.json | jq '.'
```

## Step 4: List Applications

```bash
# Get application UUIDs
bash .coolify/list-applications.sh

# Expected output:
# === Applications ===
# <uuid> - API [<server>]
# <uuid> - Web [<server>]
```

## Step 5: Check Status

```bash
# Full status
bash .coolify/status.sh

# Specific application
bash .coolify/status.sh <application_uuid>
```

## Step 6: Verify Git Ignore

```bash
# Check that sensitive files are ignored
git status --ignored | grep -E "env.coolify|inventory.json"

# Expected output:
# .coolify/.env.coolify
# .coolify/inventory.json
```

## Validation Report Template

After running validation, fill in this template:

```
=== VALIDATION REPORT ===
Date: $(date)

PASS:
* Validation script runs successfully
* Authentication passes
* Servers are reachable
* Applications are listed
* inventory.json created with UUIDs
* Git ignores are correct

FAIL:
* [None if all pass]

Notes:
* [Any additional notes]
```