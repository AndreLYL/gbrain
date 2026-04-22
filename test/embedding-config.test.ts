import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { resolveEmbeddingConfig, KNOWN_EMBED_MODELS } from '../src/core/embedding-config.ts';

describe('resolveEmbeddingConfig', () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ['GBRAIN_EMBED_MODEL', 'GBRAIN_EMBED_DIMENSIONS', 'OPENAI_BASE_URL', 'OPENAI_API_KEY']) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const [key, val] of Object.entries(savedEnv)) {
      if (val === undefined) delete process.env[key];
      else process.env[key] = val;
    }
  });

  test('returns OpenAI defaults when no config provided', () => {
    const cfg = resolveEmbeddingConfig(null);
    expect(cfg.model).toBe('text-embedding-3-large');
    expect(cfg.dimensions).toBe(1536);
    expect(cfg.base_url).toBeUndefined();
    expect(cfg.api_key).toBeUndefined();
    expect(cfg.provider).toBe('openai');
  });

  test('reads from config.json embedding section', () => {
    const cfg = resolveEmbeddingConfig({
      embedding: {
        provider: 'ollama',
        model: 'bge-m3',
        dimensions: 1024,
        base_url: 'http://localhost:11434/v1',
        api_key: 'ollama',
      },
    });
    expect(cfg.model).toBe('bge-m3');
    expect(cfg.dimensions).toBe(1024);
    expect(cfg.base_url).toBe('http://localhost:11434/v1');
    expect(cfg.provider).toBe('ollama');
  });

  test('env vars override config.json', () => {
    process.env.GBRAIN_EMBED_MODEL = 'nomic-embed-text';
    process.env.GBRAIN_EMBED_DIMENSIONS = '768';
    const cfg = resolveEmbeddingConfig({
      embedding: { model: 'bge-m3', dimensions: 1024 },
    });
    expect(cfg.model).toBe('nomic-embed-text');
    expect(cfg.dimensions).toBe(768);
  });

  test('OPENAI_BASE_URL and OPENAI_API_KEY override config', () => {
    process.env.OPENAI_BASE_URL = 'http://custom:8080/v1';
    process.env.OPENAI_API_KEY = 'sk-custom';
    const cfg = resolveEmbeddingConfig({
      embedding: { base_url: 'http://localhost:11434/v1', api_key: 'ollama' },
    });
    expect(cfg.base_url).toBe('http://custom:8080/v1');
    expect(cfg.api_key).toBe('sk-custom');
  });
});

describe('KNOWN_EMBED_MODELS', () => {
  test('contains bge-m3 as recommended', () => {
    const bge = KNOWN_EMBED_MODELS.find(m => m.name === 'bge-m3');
    expect(bge).toBeDefined();
    expect(bge!.dimensions).toBe(1024);
    expect(bge!.recommended).toBe(true);
  });

  test('contains openai default model', () => {
    const oai = KNOWN_EMBED_MODELS.find(m => m.name === 'text-embedding-3-large');
    expect(oai).toBeDefined();
    expect(oai!.provider).toBe('openai');
  });
});
