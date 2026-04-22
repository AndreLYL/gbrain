import { readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface CollectorState {
  last_sync: string; // ISO date
  cursor?: string;   // API pagination cursor
}

function stateDir(collectorId: string): string {
  return join(homedir(), '.gbrain', 'collectors', collectorId);
}

function statePath(collectorId: string): string {
  return join(stateDir(collectorId), 'state.json');
}

function heartbeatPath(collectorId: string): string {
  return join(stateDir(collectorId), 'heartbeat.jsonl');
}

export function loadCollectorState(collectorId: string): CollectorState | null {
  try {
    const raw = readFileSync(statePath(collectorId), 'utf-8');
    return JSON.parse(raw) as CollectorState;
  } catch {
    return null;
  }
}

export function saveCollectorState(collectorId: string, state: CollectorState): void {
  const dir = stateDir(collectorId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(statePath(collectorId), JSON.stringify(state, null, 2) + '\n');
}

export function appendHeartbeat(collectorId: string, event: Record<string, unknown>): void {
  const dir = stateDir(collectorId);
  mkdirSync(dir, { recursive: true });
  const entry = { ts: new Date().toISOString(), ...event };
  appendFileSync(heartbeatPath(collectorId), JSON.stringify(entry) + '\n');
}
