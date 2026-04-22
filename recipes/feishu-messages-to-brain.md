---
id: feishu-messages-to-brain
name: Feishu Messages-to-Brain
version: 0.1.0
description: Sync Feishu group chat messages into daily summary brain pages.
category: sense
requires: []
secrets:
  - name: FEISHU_APP_ID
    description: Feishu app ID
    where: https://open.feishu.cn/app
  - name: FEISHU_APP_SECRET
    description: Feishu app secret
    where: Same app settings page
health_checks:
  - type: env_exists
    name: FEISHU_APP_ID
    label: "Feishu credentials"
setup_time: 15 min
cost_estimate: "$0"
---

# Feishu Messages-to-Brain

Syncs Feishu group chat messages into GBrain as daily summary pages.

## Setup

1. Install lark-cli
2. Configure Feishu app with IM API permissions (im:message:readonly)
3. Add chat IDs to whitelist:
   ```json
   {
     "feishu": {
       "message_chats": ["oc_xxxxx"]
     }
   }
   ```

## Usage

```bash
gbrain sync --source feishu-messages
gbrain sync --source feishu-messages --since 2026-04-20
```

## Troubleshooting

- **No messages**: Ensure message_chats contains valid chat IDs
- **Permission denied**: App needs im:message:readonly scope
