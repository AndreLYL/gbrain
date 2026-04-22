import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface LarkConfig {
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
  };
}

export function getLarkConfig(fileConfig: FeishuFileConfig | null): LarkConfig {
  return {
    app_id: process.env.FEISHU_APP_ID || fileConfig?.feishu?.app_id || '',
    app_secret: process.env.FEISHU_APP_SECRET || fileConfig?.feishu?.app_secret || '',
  };
}

/**
 * Execute a lark-cli command and parse JSON output.
 * Injects FEISHU_APP_ID and FEISHU_APP_SECRET from config.
 */
export async function larkCli(
  command: string,
  args: string[],
  config: LarkConfig,
): Promise<unknown> {
  const env = {
    ...process.env,
    FEISHU_APP_ID: config.app_id,
    FEISHU_APP_SECRET: config.app_secret,
  };

  const { stdout } = await execFileAsync(
    'lark-cli',
    [command, ...args, '--output', 'json'],
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
    await execFileAsync('which', ['lark-cli']);
  } catch {
    return { ok: false, message: 'lark-cli not found. Install: brew install lark-cli' };
  }

  return { ok: true, message: 'lark-cli available, credentials configured' };
}
