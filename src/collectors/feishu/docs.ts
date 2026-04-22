import type { Collector, CollectorResult, FetchOpts } from '../types.ts';
import { larkCli, checkLarkHealth, getLarkConfig } from './lark-client.ts';
import { loadCollectorState, saveCollectorState, appendHeartbeat } from '../state.ts';
import { loadConfig } from '../../core/config.ts';

interface FeishuDoc {
  doc_token: string;
  title: string;
  content: string;
  updated: string;
}

export function buildDocsSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50)
    .replace(/-$/, '');
  return `docs/feishu/${slug || 'untitled'}`;
}

export function formatDocsPage(doc: FeishuDoc): string {
  const lines: string[] = [
    '---',
    'type: concept',
    `title: "${doc.title}"`,
    'tags: [文档]',
    'source: feishu-docs',
    `feishu_doc_token: "${doc.doc_token}"`,
    `updated: ${doc.updated}`,
    '---',
    '',
    `# ${doc.title}`,
    '',
    doc.content,
    '',
  ];
  return lines.join('\n');
}

export const feishuDocsCollector: Collector = {
  id: 'feishu-docs',
  name: 'Feishu Docs',
  description: 'Sync cloud documents from Feishu/Lark',

  async healthCheck() {
    const config = getLarkConfig(loadConfig());
    return checkLarkHealth(config);
  },

  async fetch(opts: FetchOpts): Promise<CollectorResult[]> {
    const fileConfig = loadConfig();
    const config = getLarkConfig(fileConfig);
    const state = loadCollectorState('feishu-docs');
    const since = opts.since || state?.last_sync;

    const args: string[] = [];
    if (since) args.push('--since', since);
    if (opts.limit) args.push('--limit', String(opts.limit));

    const docFolders = fileConfig?.feishu?.doc_folders;
    if (docFolders && docFolders.length > 0) {
      args.push('--folders', docFolders.join(','));
    }

    const data = await larkCli('docs', ['list', ...args], config) as { docs?: FeishuDoc[] };
    const docs = data.docs || [];

    const results: CollectorResult[] = docs.map(doc => ({
      slug: buildDocsSlug(doc.title),
      title: doc.title,
      type: 'concept' as const,
      content: formatDocsPage(doc),
      tags: ['文档'],
    }));

    if (!opts.dryRun && results.length > 0) {
      saveCollectorState('feishu-docs', { last_sync: new Date().toISOString() });
      appendHeartbeat('feishu-docs', { action: 'sync', count: results.length });
    }

    return results;
  },
};
