# Coolify Automation Scripts

This directory contains scripts for managing Coolify resources via API without manual UI operations.

## Quick Setup

```bash
# 1. Create environment file
cp .coolify/.env.example .coolify/.env.coolify

# 2. Edit with your values
# Open .coolify/.env.coolify and set:
#   COOLIFY_URL=https://your-coolify-instance.com
#   COOLIFY_TOKEN=your_api_token_here

# 3. Validate configuration
bash .coolify/validate.sh
```

## Scripts

| Script | Purpose |
|--------|---------|
| `list-applications.sh/bat` | List all applications with UUIDs |
| `status.sh/bat` | Show status of all resources |
| `deploy-api.sh/bat` | Deploy API application |
| `restart-api.sh/bat` | Restart API application |
| `deploy-web.sh/bat` | Deploy web application |
| `restart-web.sh/bat` | Restart web application |
| `discover.sh` | Create inventory.json |
| `validate.sh` | Run validation checklist |
| `rollback.sh` | Rollback deployments |

## Validation Commands

```bash
# Setup and validate
cp .coolify/.env.example .coolify/.env.coolify
# Edit .env.coolify with your values
bash .coolify/validate.sh

# List all applications
bash .coolify/list-applications.sh

# Check specific application
bash .coolify/status.sh <uuid>

# Deploy
bash .coolify/deploy-api.sh <api_uuid>
bash .coolify/restart-api.sh <api_uuid>
```

## Rollback Commands

```bash
# Rollback to last successful deployment
bash .coolify/rollback.sh <application_uuid>

# Rollback to specific deployment
bash .coolify/rollback.sh <application_uuid> <deployment_uuid>
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `COOLIFY_URL` | Your Coolify instance URL |
| `COOLIFY_TOKEN` | API token with read/write/deploy permissions |

## File Structure

```
.coolify/
├── .env.example       # Template for environment variables
├── .env.coolify       # Your actual config (gitignored)
├── list-applications.sh/bat
├── status.sh/bat
├── deploy-api.sh/bat
├── restart-api.sh/bat
├── deploy-web.sh/bat
├── restart-web.sh/bat
├── discover.sh
├── validate.sh
├── rollback.sh
└── README.md
```