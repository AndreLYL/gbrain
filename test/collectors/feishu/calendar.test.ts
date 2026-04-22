import { describe, test, expect } from 'bun:test';
import { formatCalendarPage, buildCalendarSlug } from '../../../src/collectors/feishu/calendar.ts';

describe('buildCalendarSlug', () => {
  test('generates slug from date and title', () => {
    const slug = buildCalendarSlug('2026-04-22', '周会：AI提效项目进展');
    expect(slug).toBe('daily/calendar/2026/2026-04-22-ai');
  });

  test('handles English titles', () => {
    const slug = buildCalendarSlug('2026-04-22', 'Team Standup');
    expect(slug).toBe('daily/calendar/2026/2026-04-22-team-standup');
  });

  test('truncates long titles', () => {
    const slug = buildCalendarSlug('2026-04-22', 'A Very Long Meeting Title That Goes On And On');
    expect(slug.length).toBeLessThanOrEqual(80);
  });
});

describe('formatCalendarPage', () => {
  test('produces valid markdown with frontmatter', () => {
    const page = formatCalendarPage({
      event_id: 'e_123',
      title: '周会：AI提效项目进展',
      date: '2026-04-22',
      start_time: '14:00',
      end_time: '15:00',
      location: '飞书会议室 3F-A',
      attendees: ['曹洋', '徐巍'],
    });
    expect(page).toContain('type: meeting');
    expect(page).toContain('source: feishu-calendar');
    expect(page).toContain('feishu_event_id: "e_123"');
    expect(page).toContain('# 周会：AI提效项目进展');
    expect(page).toContain('14:00-15:00');
    expect(page).toContain('曹洋');
  });

  test('handles missing optional fields', () => {
    const page = formatCalendarPage({
      event_id: 'e_456',
      title: 'Quick Sync',
      date: '2026-04-22',
      start_time: '10:00',
      end_time: '10:30',
      attendees: [],
    });
    expect(page).toContain('type: meeting');
    expect(page).not.toContain('location:');
    expect(page).not.toContain('## 参会人');
  });
});
