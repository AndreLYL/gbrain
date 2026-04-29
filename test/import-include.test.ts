import { describe, test, expect } from 'bun:test';
import { collectMarkdownFiles } from '../src/commands/import.ts';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

function setupTestDir(): string {
  const dir = join(tmpdir(), `gbrain-import-test-${Date.now()}`);
  mkdirSync(join(dir, 'andre_base', 'people'), { recursive: true });
  mkdirSync(join(dir, 'andre_base', 'notes'), { recursive: true });
  mkdirSync(join(dir, 'Sources', 'Articles'), { recursive: true });
  mkdirSync(join(dir, 'Clippings'), { recursive: true });

  writeFileSync(join(dir, 'andre_base', 'people', 'alice.md'), '# Alice');
  writeFileSync(join(dir, 'andre_base', 'notes', 'todo.md'), '# Todo');
  writeFileSync(join(dir, 'Sources', 'Articles', 'article.md'), '# Article');
  writeFileSync(join(dir, 'Clippings', 'clip.md'), '# Clip');
  writeFileSync(join(dir, 'root-note.md'), '# Root');

  return dir;
}

describe('collectMarkdownFiles with includePaths', () => {
  test('without includePaths, collects all files', () => {
    const dir = setupTestDir();
    const files = collectMarkdownFiles(dir);
    expect(files.length).toBe(5);
    rmSync(dir, { recursive: true });
  });

  test('with includePaths, only collects files under included dirs', () => {
    const dir = setupTestDir();
    const files = collectMarkdownFiles(dir, ['andre_base']);
    expect(files.length).toBe(2);
    expect(files.every(f => f.includes('andre_base'))).toBe(true);
    rmSync(dir, { recursive: true });
  });

  test('with multiple includePaths', () => {
    const dir = setupTestDir();
    const files = collectMarkdownFiles(dir, ['andre_base', 'Clippings']);
    expect(files.length).toBe(3);
    rmSync(dir, { recursive: true });
  });

  test('with empty includePaths array, collects all files', () => {
    const dir = setupTestDir();
    const files = collectMarkdownFiles(dir, []);
    expect(files.length).toBe(5);
    rmSync(dir, { recursive: true });
  });

  test('handles trailing slash in includePaths', () => {
    const dir = setupTestDir();
    const files = collectMarkdownFiles(dir, ['andre_base/']);
    expect(files.length).toBe(2);
    expect(files.every(f => f.includes('andre_base'))).toBe(true);
    rmSync(dir, { recursive: true });
  });
});
