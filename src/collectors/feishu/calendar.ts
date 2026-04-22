import type { Collector, CollectorResult, FetchOpts } from '../types.ts';
import { larkCli, checkLarkHealth, getLarkConfig } from './lark-client.ts';
import { loadCollectorState, saveCollectorState, appendHeartbeat } from '../state.ts';
import { loadConfig } from '../../core/config.ts';

interface CalendarEvent {
  event_id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees: string[];
}

export function buildCalendarSlug(date: string, title: string): string {
  const year = date.slice(0, 4);
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40)
    .replace(/-$/, '');

  const base = `daily/calendar/${year}/${date}`;
  return titleSlug ? `${base}-${titleSlug}` : base;
}

export function formatCalendarPage(event: CalendarEvent): string {
  const lines: string[] = [
    '---',
    'type: meeting',
    `title: "${event.title}"`,
    'tags: [会议]',
    `date: ${event.date}`,
  ];

  if (event.attendees.length > 0) {
    lines.push(`attendees: [${event.attendees.join(', ')}]`);
  }
  if (event.location) {
    lines.push(`location: "${event.location}"`);
  }

  lines.push('source: feishu-calendar');
  lines.push(`feishu_event_id: "${event.event_id}"`);
  lines.push('---');
  lines.push('');
  lines.push(`# ${event.title}`);
  lines.push('');

  const locationPart = event.location ? ` | ${event.location}` : '';
  lines.push(`> ${event.date} ${event.start_time}-${event.end_time}${locationPart}`);

  if (event.attendees.length > 0) {
    lines.push('');
    lines.push('## 参会人');
    for (const a of event.attendees) {
      lines.push(`- ${a}`);
    }
  }

  lines.push('');
  lines.push('## Timeline');
  lines.push(`- **${event.date}** — ${event.title} [Source: feishu-calendar]`);
  lines.push('');

  return lines.join('\n');
}

export const feishuCalendarCollector: Collector = {
  id: 'feishu-calendar',
  name: 'Feishu Calendar',
  description: 'Sync calendar events from Feishu/Lark',

  async healthCheck() {
    const config = getLarkConfig(loadConfig());
    return checkLarkHealth(config);
  },

  async fetch(opts: FetchOpts): Promise<CollectorResult[]> {
    const fileConfig = loadConfig();
    const config = getLarkConfig(fileConfig);
    const state = loadCollectorState('feishu-calendar');
    const since = opts.since || state?.last_sync;

    const args: string[] = [];
    if (since) args.push('--since', since);
    if (opts.limit) args.push('--limit', String(opts.limit));

    const calendarIds = fileConfig?.feishu?.calendar_ids;
    if (calendarIds && calendarIds.length > 0) {
      args.push('--calendars', calendarIds.join(','));
    }

    const data = await larkCli('calendar', ['events', ...args], config) as { events?: CalendarEvent[] };
    const events = data.events || [];

    const results: CollectorResult[] = events.map(event => ({
      slug: buildCalendarSlug(event.date, event.title),
      title: event.title,
      type: 'meeting' as const,
      content: formatCalendarPage(event),
      tags: ['会议'],
    }));

    if (!opts.dryRun && results.length > 0) {
      saveCollectorState('feishu-calendar', { last_sync: new Date().toISOString() });
      appendHeartbeat('feishu-calendar', { action: 'sync', count: results.length });
    }

    return results;
  },
};
