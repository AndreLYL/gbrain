import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { getLarkConfig } from '../../../src/collectors/feishu/lark-client.ts';

describe('getLarkConfig', () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ['FEISHU_APP_ID', 'FEISHU_APP_SECRET']) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const [key, val] of Object.entries(saved)) {
      if (val === undefined) delete process.env[key];
      else process.env[key] = val;
    }
  });

  test('reads from env vars', () => {
    process.env.FEISHU_APP_ID = 'test-id';
    process.env.FEISHU_APP_SECRET = 'test-secret';
    const cfg = getLarkConfig(null);
    expect(cfg.app_id).toBe('test-id');
    expect(cfg.app_secret).toBe('test-secret');
  });

  test('reads from config object', () => {
    const cfg = getLarkConfig({ feishu: { app_id: 'cfg-id', app_secret: 'cfg-secret' } });
    expect(cfg.app_id).toBe('cfg-id');
    expect(cfg.app_secret).toBe('cfg-secret');
  });

  test('env vars override config', () => {
    process.env.FEISHU_APP_ID = 'env-id';
    const cfg = getLarkConfig({ feishu: { app_id: 'cfg-id', app_secret: 'cfg-secret' } });
    expect(cfg.app_id).toBe('env-id');
    expect(cfg.app_secret).toBe('cfg-secret');
  });

  test('returns empty strings when nothing configured', () => {
    const cfg = getLarkConfig(null);
    expect(cfg.app_id).toBe('');
    expect(cfg.app_secret).toBe('');
  });
});
