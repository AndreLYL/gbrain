import { describe, test, expect } from 'bun:test';
import { formatDocsPage, buildDocsSlug } from '../../../src/collectors/feishu/docs.ts';

describe('buildDocsSlug', () => {
  test('generates slug from title', () => {
    const slug = buildDocsSlug('GBrain 本地部署方案');
    expect(slug).toBe('docs/feishu/gbrain');
  });

  test('handles fully English titles', () => {
    const slug = buildDocsSlug('API Design Guide');
    expect(slug).toBe('docs/feishu/api-design-guide');
  });
});

describe('formatDocsPage', () => {
  test('produces valid concept page', () => {
    const page = formatDocsPage({
      doc_token: 'doccnXXX',
      title: 'GBrain 本地部署方案',
      content: '# 部署步骤\n\n1. 安装依赖\n2. 配置环境变量',
      updated: '2026-04-22',
    });
    expect(page).toContain('type: concept');
    expect(page).toContain('source: feishu-docs');
    expect(page).toContain('feishu_doc_token: "doccnXXX"');
    expect(page).toContain('# GBrain 本地部署方案');
    expect(page).toContain('安装依赖');
  });
});
