import { registerCollector } from '../registry.ts';
import { feishuCalendarCollector } from './calendar.ts';
import { feishuDocsCollector } from './docs.ts';
import { feishuMessagesCollector } from './messages.ts';
import { feishuTasksCollector } from './tasks.ts';

export function registerFeishuCollectors(): void {
  registerCollector(feishuCalendarCollector);
  registerCollector(feishuDocsCollector);
  registerCollector(feishuMessagesCollector);
  registerCollector(feishuTasksCollector);
}
