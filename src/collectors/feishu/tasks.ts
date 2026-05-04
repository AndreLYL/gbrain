import type { Collector, CollectorResult, FetchOpts } from '../types.ts';
import { larkCli, checkLarkHealth, getLarkConfig } from './lark-client.ts';
import { loadCollectorState, saveCollectorState, appendHeartbeat } from '../state.ts';
import { loadConfig } from '../../core/config.ts';

interface FeishuTask {
  task_id: string;
  title: string;
  status: string;
  assignee: string;
  created: string;
  updated: string;
}

interface OkrKeyResult {
  title: string;
  progress: string;
}

interface OkrObjective {
  title: string;
  key_results: OkrKeyResult[];
}

interface FeishuOkr {
  okr_id: string;
  title: string;
  period: string;
  objectives: OkrObjective[];
  updated: string;
}

export function buildTaskSlug(type: 'task' | 'okr' | 'approval', title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40)
    .replace(/-$/, '') || type;
  return `tasks/${type}/${slug}`;
}

export function formatTaskPage(task: FeishuTask): string {
  return [
    '---',
    'type: concept',
    `title: "${task.title}"`,
    'tags: [任务]',
    'source: feishu-tasks',
    `feishu_task_id: "${task.task_id}"`,
    `updated: ${task.updated}`,
    '---',
    '',
    `# ${task.title}`,
    '',
    `- 状态: ${task.status}`,
    `- 负责人: ${task.assignee}`,
    `- 创建时间: ${task.created}`,
    '',
    '## Timeline',
    `- **${task.updated}** — ${task.title} (${task.status}) [Source: feishu-tasks]`,
    '',
  ].join('\n');
}

export function formatOkrPage(okr: FeishuOkr): string {
  const lines: string[] = [
    '---',
    'type: concept',
    `title: "OKR ${okr.period}：${okr.title}"`,
    `tags: [OKR, ${okr.period}]`,
    'source: feishu-tasks',
    `feishu_okr_id: "${okr.okr_id}"`,
    `updated: ${okr.updated}`,
    '---',
    '',
    `# OKR ${okr.period}：${okr.title}`,
    '',
  ];

  okr.objectives.forEach((obj, idx) => {
    lines.push(`## O${idx + 1}: ${obj.title}`);
    obj.key_results.forEach((kr, krIdx) => {
      lines.push(`- KR${krIdx + 1}: ${kr.title} (${kr.progress})`);
    });
    lines.push('');
  });

  lines.push('## Timeline');
  lines.push(`- **${okr.updated}** — ${okr.title} [Source: feishu-tasks]`);
  lines.push('');

  return lines.join('\n');
}

export const feishuTasksCollector: Collector = {
  id: 'feishu-tasks',
  name: 'Feishu Tasks',
  description: 'Sync tasks, approvals, and OKRs from Feishu/Lark',

  async healthCheck() {
    const config = getLarkConfig(loadConfig());
    return checkLarkHealth(config);
  },

  async fetch(opts: FetchOpts): Promise<CollectorResult[]> {
    const fileConfig = loadConfig();
    const config = getLarkConfig(fileConfig);
    const state = loadCollectorState('feishu-tasks');
    const since = opts.since || state?.last_sync;
    const results: CollectorResult[] = [];

    const taskArgs: string[] = [];
    if (since) taskArgs.push('--since', since);
    if (opts.limit) taskArgs.push('--limit', String(opts.limit));

    // Fetch tasks
    try {
      const taskData = await larkCli(['task', '+get-my-tasks', '--page-all', ...taskArgs], config) as { tasks?: FeishuTask[] };
      for (const task of taskData.tasks || []) {
        results.push({
          slug: buildTaskSlug('task', task.title),
          title: task.title,
          type: 'concept',
          content: formatTaskPage(task),
          tags: ['任务'],
        });
      }
    } catch { /* tasks API may not be available */ }

    // OKR: lark-cli doesn't have an okr command yet — skip for now

    if (!opts.dryRun && results.length > 0) {
      saveCollectorState('feishu-tasks', { last_sync: new Date().toISOString() });
      appendHeartbeat('feishu-tasks', { action: 'sync', count: results.length });
    }

    return results;
  },
};
