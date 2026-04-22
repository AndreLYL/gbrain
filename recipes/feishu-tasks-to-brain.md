---
id: feishu-tasks-to-brain
name: Feishu Tasks-to-Brain
version: 0.1.0
description: Sync Feishu tasks, approvals, and OKRs into brain pages.
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

# Feishu Tasks-to-Brain

Syncs Feishu tasks, approval instances, and OKRs into GBrain.

## Setup

1. Install lark-cli
2. Configure Feishu app with Task API permissions (task:task:readonly) and OKR API permissions (okr:okr:readonly)

## Usage

```bash
gbrain sync --source feishu-tasks
gbrain sync --source feishu-tasks --since 2026-04-01
```

## Troubleshooting

- **Empty OKR results**: App needs okr:okr:readonly scope
- **Permission denied**: Check app permissions in Feishu admin console
