import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const outputPath = resolve(projectRoot, 'src/data/dev-progress.json');
const rulesPath = resolve(projectRoot, 'scripts/dev-progress-rules.json');

export function loadRules(path = rulesPath) {
  const text = readFileSync(path, 'utf8');
  return JSON.parse(text);
}

function containsAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function translateTitle(title, rules) {
  const exact = rules.exactTranslations?.[title];
  if (exact) return exact;

  if (/[\u4e00-\u9fff]/.test(title)) return title;

  const conventionalMatch = title.match(
    /^(feat|fix|chore|docs|refactor|style|perf|test)(\([^)]+\))?:\s*(.+)$/i
  );
  if (conventionalMatch) {
    const type = conventionalMatch[1].toLowerCase();
    const detail = conventionalMatch[3];
    const typeLabel = rules.conventionalTypeLabels?.[type];
    if (typeLabel) return `${typeLabel}：${detail}`;
  }

  let translated = title;
  for (const [enVerb, zhVerb] of Object.entries(rules.verbTranslations || {})) {
    const pattern = new RegExp(`^${enVerb}\\b`, 'i');
    translated = translated.replace(pattern, zhVerb);
  }
  return translated;
}

export function categoryFromTitle(title, rules) {
  const lowerTitle = title.toLowerCase();
  const categoryRules = rules.categoryRules || [];

  for (const rule of categoryRules) {
    const enKeywords = (rule.keywordsEn || []).map((k) => k.toLowerCase());
    const zhKeywords = rule.keywordsZh || [];
    if (containsAny(lowerTitle, enKeywords) || containsAny(title, zhKeywords)) {
      return rule.category;
    }
  }
  return 'Feature';
}

export function milestoneFromTitle(title, category, rules) {
  const milestoneRules = rules.milestoneRules || {};
  const always = milestoneRules.alwaysMilestoneCategory || [];
  if (always.includes(category)) return true;

  const lowerTitle = title.toLowerCase();
  const keywordsEn = (milestoneRules.keywordsEn || []).map((k) => k.toLowerCase());
  const keywordsZh = milestoneRules.keywordsZh || [];
  return containsAny(lowerTitle, keywordsEn) || containsAny(title, keywordsZh);
}

export function parseGitLog(raw, rules) {
  return raw
    .split('\x1e')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [fullHash, shortHash, isoDate, subject] = line.split('\x1f');
      const title = (subject || '').trim() || 'No commit message';
      const titleZh = translateTitle(title, rules);
      const category = categoryFromTitle(title, rules);

      return {
        hash: shortHash,
        fullHash,
        date: isoDate,
        title,
        titleZh,
        category,
        milestone: milestoneFromTitle(title, category, rules),
      };
    });
}

export function createPayloadFromRawGitLog(raw, rules) {
  const commits = parseGitLog(raw, rules);
  return {
    generatedAt: new Date().toISOString(),
    total: commits.length,
    commits,
  };
}

export function generateDevProgressData({ cwd = projectRoot, out = outputPath, rules = loadRules() } = {}) {
  const cmd = 'git log --date=iso-strict --pretty=format:%H%x1f%h%x1f%ad%x1f%s%x1e';
  const raw = execSync(cmd, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const payload = createPayloadFromRawGitLog(raw, rules);

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Generated ${out} with ${payload.commits.length} commits.`);
  return payload;
}

export function main() {
  generateDevProgressData();
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main();
}
