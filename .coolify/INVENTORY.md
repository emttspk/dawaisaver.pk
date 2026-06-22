# UUID Inventory - Run discover.sh to populate

This file documents the expected Coolify resource UUIDs.
Run `bash .coolify/discover.sh` to populate with actual values.

## Template

```json
{
  "generated_at": "ISO_TIMESTAMP",
  "coolify_url": "https://your-coolify-instance.com",
  "teams": [...],
  "servers": [
    {
      "uuid": "SERVER_UUID",
      "name": "localhost",
      "ip": "HOST_IP"
    }
  ],
  "projects": [
    {
      "uuid": "PROJECT_UUID",
      "name": "DawaiSaver PK"
    }
  ],
  "applications": [
    {
      "uuid": "API_UUID",
      "name": "API",
      "type": "api"
    },
    {
      "uuid": "WEB_UUID",
      "name": "Web",
      "type": "web"
    }
  ],
  "resources": [...]
}
```

## Expected Values for DawaiSaver.pk

| Resource Type | Name | UUID Placeholder |
|--------------|------|------------------|
| Server | localhost | `SERVER_UUID` |
| Project | DawaiSaver PK | `PROJECT_UUID` |
| Application | API | `API_UUID` |
| Application | Web/Admin | `WEB_UUID` |