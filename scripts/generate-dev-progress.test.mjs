import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadRules,
  translateTitle,
  categoryFromTitle,
  milestoneFromTitle,
  parseGitLog,
  createPayloadFromRawGitLog,
} from './generate-dev-progress.mjs';

const rules = loadRules();

test('translateTitle should translate exact mapping', () => {
  const input = 'Add Dicebear dependencies and enhance UI with new icons';
  const output = translateTitle(input, rules);
  assert.equal(output, '新增 Dicebear 依赖，并使用新图标增强界面表现。');
});

test('translateTitle should translate conventional commit format', () => {
  const input = 'feat(auth): add social login';
  const output = translateTitle(input, rules);
  assert.equal(output, '新功能：add social login');
});

test('categoryFromTitle should classify release-related commits', () => {
  const input = 'Update index.html for localization to Chinese';
  const category = categoryFromTitle(input, rules);
  assert.equal(category, 'Release');
});

test('milestoneFromTitle should mark release category as milestone', () => {
  assert.equal(milestoneFromTitle('anything', 'Release', rules), true);
});

test('parseGitLog should parse raw git output and attach zh title', () => {
  const raw = [
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\x1faaaaaaa\x1f2026-02-12T10:00:00+08:00\x1ffeat: add auto-generated git progress timeline page',
    '',
  ].join('\x1e');
  const commits = parseGitLog(raw, rules);
  assert.equal(commits.length, 1);
  assert.equal(commits[0].hash, 'aaaaaaa');
  assert.equal(commits[0].titleZh, '新增自动生成的 Git 开发进度时间线页面。');
  assert.equal(commits[0].milestone, true);
});

test('createPayloadFromRawGitLog should produce total count', () => {
  const raw = [
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\x1faaaaaaa\x1f2026-02-12T10:00:00+08:00\x1fAdd feature A',
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\x1fbbbbbbb\x1f2026-02-12T11:00:00+08:00\x1fRefactor module B',
    '',
  ].join('\x1e');
  const payload = createPayloadFromRawGitLog(raw, rules);
  assert.equal(payload.total, 2);
  assert.equal(payload.commits.length, 2);
});
