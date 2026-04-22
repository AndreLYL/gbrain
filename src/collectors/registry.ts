import type { Collector } from './types.ts';

const collectors: Map<string, Collector> = new Map();

export function registerCollector(collector: Collector): void {
  collectors.set(collector.id, collector);
}

export function getCollector(id: string): Collector | undefined {
  return collectors.get(id);
}

/**
 * List registered collectors. Optionally filter by ID prefix.
 * `listCollectors('feishu')` returns all collectors whose id starts with 'feishu'.
 */
export function listCollectors(prefix?: string): Collector[] {
  const all = Array.from(collectors.values());
  if (!prefix) return all;
  return all.filter(c => c.id.startsWith(prefix));
}

/** For testing — clear all registered collectors. */
export function clearCollectors(): void {
  collectors.clear();
}
