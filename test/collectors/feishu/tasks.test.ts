import { describe, test, expect } from 'bun:test';
import { formatTaskPage, formatOkrPage, buildTaskSlug } from '../../../src/collectors/feishu/tasks.ts';

describe('buildTaskSlug', () => {
  test('generates slug for task', () => {
    expect(buildTaskSlug('task', 'Fix login bug')).toBe('tasks/task/fix-login-bug');
  });

  test('generates slug for okr', () => {
    expect(buildTaskSlug('okr', 'Q2 技术影响力')).toBe('tasks/okr/q2');
  });

  test('generates slug for approval', () => {
    expect(buildTaskSlug('approval', '采购审批 2026-04')).toBe('tasks/approval/2026-04');
  });
});

describe('formatTaskPage', () => {
  test('produces valid concept page for task', () => {
    const page = formatTaskPage({
      task_id: 't_123',
      title: '修复登录bug',
      status: '进行中',
      assignee: '曹洋',
      created: '2026-04-20',
      updated: '2026-04-22',
    });
    expect(page).toContain('type: concept');
    expect(page).toContain('source: feishu-tasks');
    expect(page).toContain('feishu_task_id: "t_123"');
    expect(page).toContain('状态: 进行中');
  });
});

describe('formatOkrPage', () => {
  test('produces valid OKR page', () => {
    const page = formatOkrPage({
      okr_id: 'okr_123',
      title: 'Q2 个人技术影响力建设',
      period: '2026-Q2',
      objectives: [
        {
          title: '建立个人技术品牌',
          key_results: [
            { title: '完成 3 篇技术博客', progress: '1/3' },
            { title: 'GBrain PR 被合并', progress: '0/1' },
          ],
        },
      ],
      updated: '2026-04-22',
    });
    expect(page).toContain('type: concept');
    expect(page).toContain('feishu_okr_id: "okr_123"');
    expect(page).toContain('## O1: 建立个人技术品牌');
    expect(page).toContain('KR1: 完成 3 篇技术博客 (1/3)');
  });
});
