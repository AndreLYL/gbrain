import type { Collector, CollectorResult, FetchOpts } from '../types.ts';
import { larkCli, checkLarkHealth, getLarkConfig } from './lark-client.ts';
import { loadCollectorState, saveCollectorState, appendHeartbeat } from '../state.ts';
import { loadConfig } from '../../core/config.ts';

interface ChatMessage {
  time: string;
  sender: string;
  text: string;
}

interface ChatDay {
  chat_id: string;
  chat_name: string;
  date: string;
  messages: ChatMessage[];
}

export function buildMessagesSlug(chatName: string, date: string): string {
  const slug = chatName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 30)
    .replace(/-$/, '') || 'chat';
  return `messages/${slug}/${date}`;
}

export function formatMessagesPage(chat: ChatDay): string {
  const lines: string[] = [
    '---',
    'type: source',
    `title: "群聊摘要：${chat.chat_name} ${chat.date}"`,
    'tags: [消息, 群聊]',
    'source: feishu-messages',
    `feishu_chat_id: "${chat.chat_id}"`,
    `date: ${chat.date}`,
    '---',
    '',
    `# ${chat.chat_name} — ${chat.date}`,
    '',
  ];

  if (chat.messages.length > 0) {
    lines.push('## 重要消息');
    lines.push('');
    for (const msg of chat.messages) {
      lines.push(`- **${msg.time}** ${msg.sender}: ${msg.text}`);
    }
    lines.push('');
  }

  lines.push('## Timeline');
  const summary = chat.messages.length > 0
    ? `群讨论 (${chat.messages.length} 条消息)`
    : '无消息';
  lines.push(`- **${chat.date}** — ${chat.chat_name}: ${summary} [Source: feishu-messages]`);
  lines.push('');

  return lines.join('\n');
}

export const feishuMessagesCollector: Collector = {
  id: 'feishu-messages',
  name: 'Feishu Messages',
  description: 'Sync chat messages from Feishu/Lark groups',

  async healthCheck() {
    const config = getLarkConfig(loadConfig());
    return checkLarkHealth(config);
  },

  async fetch(opts: FetchOpts): Promise<CollectorResult[]> {
    const fileConfig = loadConfig();
    const config = getLarkConfig(fileConfig);
    const state = loadCollectorState('feishu-messages');
    const since = opts.since || state?.last_sync;

    const args: string[] = [];
    if (since) args.push('--since', since);

    const chatIds = fileConfig?.feishu?.message_chats;
    if (chatIds && chatIds.length > 0) {
      args.push('--chats', chatIds.join(','));
    }

    const data = await larkCli('im', ['messages', ...args], config) as { chats?: ChatDay[] };
    const chats = data.chats || [];

    const results: CollectorResult[] = chats.map(chat => ({
      slug: buildMessagesSlug(chat.chat_name, chat.date),
      title: `群聊摘要：${chat.chat_name} ${chat.date}`,
      type: 'source' as const,
      content: formatMessagesPage(chat),
      tags: ['消息', '群聊'],
    }));

    if (!opts.dryRun && results.length > 0) {
      saveCollectorState('feishu-messages', { last_sync: new Date().toISOString() });
      appendHeartbeat('feishu-messages', { action: 'sync', count: results.length });
    }

    return results;
  },
};
