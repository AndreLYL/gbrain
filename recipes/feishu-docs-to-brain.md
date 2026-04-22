---
id: feishu-docs-to-brain
name: Feishu Docs-to-Brain
version: 0.1.0
description: Sync Feishu cloud documents into brain pages, converting to Markdown.
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

# Feishu Docs-to-Brain

Syncs Feishu cloud documents into GBrain as concept pages.

## Setup

1. Install lark-cli
2. Configure Feishu app with Docs API permissions (docx:readonly)
3. Add doc folder tokens to config:
   ```json
   {
     "feishu": {
       "doc_folders": ["fldcnXXXX"]
     }
   }
   ```

## Usage

```bash
gbrain sync --source feishu-docs
gbrain sync --source feishu-docs --since 2026-04-01
gbrain sync --source feishu-docs --dry-run
```

## Troubleshooting

- **Empty results**: Ensure doc_folders contains valid folder tokens
- **Permission denied**: App needs docx:readonly scope
