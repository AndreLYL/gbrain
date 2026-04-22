import { describe, test, expect, beforeEach } from 'bun:test';
import { registerCollector, getCollector, listCollectors, clearCollectors } from '../../src/collectors/registry.ts';
import type { Collector, CollectorResult, FetchOpts } from '../../src/collectors/types.ts';

function makeStubCollector(id: string): Collector {
  return {
    id,
    name: `Test ${id}`,
    description: `Stub collector for ${id}`,
    async healthCheck() { return { ok: true, message: 'stub' }; },
    async fetch(_opts: FetchOpts): Promise<CollectorResult[]> { return []; },
  };
}

describe('collector registry', () => {
  beforeEach(() => clearCollectors());

  test('registers and retrieves a collector', () => {
    const c = makeStubCollector('test-1');
    registerCollector(c);
    expect(getCollector('test-1')).toBe(c);
  });

  test('returns undefined for unknown collector', () => {
    expect(getCollector('nonexistent')).toBeUndefined();
  });

  test('lists all registered collectors', () => {
    registerCollector(makeStubCollector('a'));
    registerCollector(makeStubCollector('b'));
    const list = listCollectors();
    expect(list.map(c => c.id).sort()).toEqual(['a', 'b']);
  });

  test('listCollectors with prefix filter', () => {
    registerCollector(makeStubCollector('feishu-calendar'));
    registerCollector(makeStubCollector('feishu-docs'));
    registerCollector(makeStubCollector('google-calendar'));
    const feishu = listCollectors('feishu');
    expect(feishu.map(c => c.id).sort()).toEqual(['feishu-calendar', 'feishu-docs']);
  });
});
