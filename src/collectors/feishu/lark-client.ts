import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const execFileAsync = promisify(execFile);

/** Resolve lark binary path: PATH lookup first, then ~/.local/bin fallback. */
function resolveLarkBin(): string {
  const localBin = join(homedir(), '.local', 'bin', 'lark');
  if (existsSync(localBin)) return localBin;
  return 'lark'; // rely on PATH
}

export interface LarkConfig {
  app_id: string;
  app_secret: string;
}

export interface FeishuBotConfig {
  name: string;
  app_id: string;
  app_secret: string;
}

export interface FeishuFileConfig {
  feishu?: {
    app_id?: string;
    app_secret?: string;
    calendar_ids?: string[];
    doc_folders?: string[];
    message_chats?: string[];
    user_open_id?: string;
    bots?: FeishuBotConfig[];
  };
}

export function getLarkConfig(fileConfig: FeishuFileConfig | null): LarkConfig {
  return {
    app_id: process.env.FEISHU_APP_ID || fileConfig?.feishu?.app_id || '',
    app_secret: process.env.FEISHU_APP_SECRET || fileConfig?.feishu?.app_secret || '',
  };
}

/**
 * Execute a lark CLI command and parse JSON output.
 * Args should be the full command chain, e.g. ['calendar', 'events', 'search', '--params', '...']
 * Injects FEISHU_APP_ID and FEISHU_APP_SECRET from config.
 */
export async function larkCli(
  args: string[],
  config: LarkConfig,
): Promise<unknown> {
  const env = {
    ...process.env,
    FEISHU_APP_ID: config.app_id,
    FEISHU_APP_SECRET: config.app_secret,
  };

  const { stdout } = await execFileAsync(
    resolveLarkBin(),
    [...args, '--format', 'json'],
    { env, timeout: 30000 },
  );

  return JSON.parse(stdout);
}

/** Check if lark-cli is installed and credentials are configured. */
export async function checkLarkHealth(config: LarkConfig): Promise<{ ok: boolean; message: string }> {
  if (!config.app_id || !config.app_secret) {
    return { ok: false, message: 'FEISHU_APP_ID and FEISHU_APP_SECRET not configured' };
  }

  try {
    const bin = resolveLarkBin();
    await execFileAsync(bin, ['--version']);
  } catch {
    return { ok: false, message: 'lark CLI not found. Install lark-cli to ~/.local/bin/lark' };
  }

  return { ok: true, message: 'lark-cli available, credentials configured' };
}
