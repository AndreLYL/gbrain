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
    .replace(/-$/, '');
  // For pure-CJK names the slug will be empty; use a hash of the original name
  const label = slug || chatName.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(36).replace('-', '');
  return `messages/${label}/${date}`;
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

    const chatIds = fileConfig?.feishu?.message_chats;
    if (!chatIds || chatIds.length === 0) return [];

    interface LarkMessage {
      content: string;
      create_time: string;
      msg_type: string;
      sender: { name?: string; sender_type: string };
    }

    const results: CollectorResult[] = [];

    for (const chatId of chatIds) {
      // Fetch chat name
      let chatName = chatId;
      try {
        const chatInfo = await larkCli(
          ['im', 'chats', 'get', '--params', JSON.stringify({ chat_id: chatId })],
          config,
        ) as { data?: { name?: string } };
        chatName = chatInfo.data?.name || chatId;
      } catch { /* fallback to chatId */ }

      const baseArgs = ['im', '+chat-messages-list', '--chat-id', chatId, '--sort', 'desc', '--page-size', '50'];
      if (since) baseArgs.push('--start', since);

      // Paginate through all messages
      const allMessages: LarkMessage[] = [];
      let pageToken: string | undefined;
      do {
        const args = [...baseArgs];
        if (pageToken) args.push('--page-token', pageToken);
        const data = await larkCli(args, config) as {
          ok: boolean;
          data?: { messages?: LarkMessage[]; has_more?: boolean; page_token?: string };
        };
        const page = data.data;
        if (page?.messages) allMessages.push(...page.messages);
        pageToken = page?.has_more ? page.page_token : undefined;
      } while (pageToken);

      const messages = allMessages;

      // Filter out system messages, group by date
      const userMessages = messages.filter(m => m.msg_type !== 'system');
      const byDate = new Map<string, ChatMessage[]>();
      for (const m of userMessages) {
        const date = m.create_time.slice(0, 10); // "2026-04-19"
        if (!byDate.has(date)) byDate.set(date, []);
        byDate.get(date)!.push({
          time: m.create_time.slice(11), // "13:34"
          sender: m.sender.name || m.sender.sender_type || 'bot',
          text: m.content,
        });
      }

      // Create one page per date
      for (const [date, msgs] of byDate) {
        const chat: ChatDay = { chat_id: chatId, chat_name: chatName, date, messages: msgs };
        results.push({
          slug: buildMessagesSlug(chatName, date),
          title: `群聊摘要：${chatName} ${date}`,
          type: 'source' as const,
          content: formatMessagesPage(chat),
          tags: ['消息', '群聊'],
        });
      }
    }

    if (!opts.dryRun && results.length > 0) {
      saveCollectorState('feishu-messages', { last_sync: new Date().toISOString() });
      appendHeartbeat('feishu-messages', { action: 'sync', count: results.length });
    }

    return results;
  },
};
