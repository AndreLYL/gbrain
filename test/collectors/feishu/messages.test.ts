import { describe, test, expect } from 'bun:test';
import { formatMessagesPage, buildMessagesSlug } from '../../../src/collectors/feishu/messages.ts';

describe('buildMessagesSlug', () => {
  test('generates slug from chat name and date', () => {
    const slug = buildMessagesSlug('AI产品技术群', '2026-04-22');
    expect(slug).toBe('messages/ai/2026-04-22');
  });
});

describe('formatMessagesPage', () => {
  test('produces valid source page', () => {
    const page = formatMessagesPage({
      chat_id: 'oc_123',
      chat_name: 'AI产品技术群',
      date: '2026-04-22',
      messages: [
        { time: '14:32', sender: '曹洋', text: 'GBrain部署完成，可以开始测试' },
        { time: '15:10', sender: '徐巍', text: 'embedding 用 bge-m3 效果不错' },
      ],
    });
    expect(page).toContain('type: source');
    expect(page).toContain('source: feishu-messages');
    expect(page).toContain('feishu_chat_id: "oc_123"');
    expect(page).toContain('14:32');
    expect(page).toContain('曹洋');
    expect(page).toContain('GBrain部署完成');
  });

  test('skips message section for empty list', () => {
    const page = formatMessagesPage({
      chat_id: 'oc_456',
      chat_name: 'Empty Chat',
      date: '2026-04-22',
      messages: [],
    });
    expect(page).toContain('type: source');
    expect(page).not.toContain('## 重要消息');
  });
});
