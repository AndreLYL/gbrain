---
id: feishu-calendar-to-brain
name: Feishu Calendar-to-Brain
version: 0.1.0
description: Sync Feishu calendar events into searchable brain pages with meeting details, attendees, and timeline entries.
category: sense
requires: []
secrets:
  - name: FEISHU_APP_ID
    description: Feishu app ID for API access
    where: https://open.feishu.cn/app — create an enterprise app
  - name: FEISHU_APP_SECRET
    description: Feishu app secret
    where: Same app settings page as FEISHU_APP_ID
health_checks:
  - type: env_exists
    name: FEISHU_APP_ID
    label: "Feishu credentials"
setup_time: 15 min
cost_estimate: "$0 (Feishu API is free for enterprise apps)"
---

# Feishu Calendar-to-Brain

Syncs Feishu calendar events into GBrain as meeting pages.

## Setup

1. Install lark-cli: `brew install lark-cli` (or from source)
2. Create a Feishu enterprise app at https://open.feishu.cn/app
3. Enable Calendar API permissions
4. Set env vars or add to `~/.gbrain/config.json`:
   ```json
   {
     "feishu": {
       "app_id": "cli_xxx",
       "app_secret": "xxx",
       "calendar_ids": ["primary"]
     }
   }
   ```

## Usage

```bash
# Sync all calendar events
gbrain sync --source feishu-calendar

# Sync since a specific date
gbrain sync --source feishu-calendar --since 2026-04-01

# Preview mode
gbrain sync --source feishu-calendar --dry-run
```

## Troubleshooting

- **lark-cli not found**: Install via `brew install lark-cli`
- **401 Unauthorized**: Check FEISHU_APP_ID and FEISHU_APP_SECRET
- **No events returned**: Verify calendar_ids in config or ensure the app has calendar:readonly scope
