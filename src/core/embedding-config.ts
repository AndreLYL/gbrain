/**
 * Embedding configuration resolution.
 *
 * Resolves embedding provider settings from:
 *   env vars > config.json > built-in defaults (OpenAI text-embedding-3-large)
 *
 * Upstream users who never touch embedding config get unchanged behavior.
 */

export interface EmbeddingConfig {
  provider: 'openai' | 'ollama' | 'custom';
  model: string;
  dimensions: number;
  base_url?: string;
  api_key?: string;
}

export const KNOWN_EMBED_MODELS = [
  { name: 'bge-m3', dimensions: 1024, langs: ['zh', 'en'], recommended: true },
  { name: 'nomic-embed-text', dimensions: 768, langs: ['en'], recommended: false },
  { name: 'mxbai-embed-large', dimensions: 1024, langs: ['en'], recommended: false },
  { name: 'text-embedding-3-large', dimensions: 1536, provider: 'openai' as const },
  { name: 'text-embedding-3-small', dimensions: 1536, provider: 'openai' as const },
] as const;

/**
 * Resolve embedding config from: env vars > config.json > defaults.
 * Pass the raw parsed config (or null if no config file exists).
 */
export function resolveEmbeddingConfig(
  fileConfig: { embedding?: Partial<EmbeddingConfig> } | null,
): EmbeddingConfig {
  const embCfg = fileConfig?.embedding;

  const model = process.env.GBRAIN_EMBED_MODEL
    || embCfg?.model
    || 'text-embedding-3-large';

  const dimensions = parseInt(
    process.env.GBRAIN_EMBED_DIMENSIONS
    || String(embCfg?.dimensions || 1536),
    10,
  );

  const base_url = process.env.OPENAI_BASE_URL
    || embCfg?.base_url
    || undefined;

  const api_key = process.env.OPENAI_API_KEY
    || embCfg?.api_key
    || undefined;

  // Infer provider from base_url
  let provider: EmbeddingConfig['provider'] = embCfg?.provider || 'openai';
  if (!embCfg?.provider && base_url?.includes('11434')) {
    provider = 'ollama';
  }

  return { provider, model, dimensions, base_url, api_key };
}
