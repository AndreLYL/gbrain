export type PageType = 'meeting' | 'concept' | 'source' | 'person' | 'project';

export interface CollectorResult {
  /** Brain page slug, e.g. "daily/calendar/2026-04-22" */
  slug: string;
  title: string;
  type: PageType;
  /** Complete markdown content including frontmatter */
  content: string;
  tags: string[];
}

export interface FetchOpts {
  /** Incremental sync start point (ISO date string) */
  since?: string;
  /** Maximum items to fetch */
  limit?: number;
  /** Preview mode — fetch but don't write */
  dryRun?: boolean;
}

export interface Collector {
  /** Unique ID, e.g. "feishu-calendar" */
  id: string;
  name: string;
  description: string;

  /** Check whether external dependencies (lark-cli, credentials) are ready */
  healthCheck(): Promise<{ ok: boolean; message: string }>;

  /** Fetch data and return brain pages */
  fetch(opts: FetchOpts): Promise<CollectorResult[]>;
}
