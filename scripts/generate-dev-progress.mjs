import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const outputPath = resolve(projectRoot, 'src/data/dev-progress.json');

function categoryFromTitle(title) {
  const t = title.toLowerCase();

  if (
    /\b(release|deploy|production|publish|vercel)\b/.test(t) ||
    /本地化|发布|上线|部署/.test(title)
  ) {
    return 'Release';
  }

  if (
    /\b(init|initial|bootstrap|scaffold|setup)\b/.test(t) ||
    /初始化|初始/.test(title)
  ) {
    return 'Setup';
  }

  if (
    /\b(refactor|cleanup|optimi[sz]e|style|copy|wording|ui|ux)\b/.test(t) ||
    /优化|文案|术语|本地化|样式|图标/.test(title)
  ) {
    return 'UX';
  }

  return 'Feature';
}

function milestoneFromTitle(title, category) {
  if (category === 'Release') return true;

  const t = title.toLowerCase();
  return (
    /\b(implement|introduce|add|complete|launch|ship)\b/.test(t) ||
    /实现|新增|完成|上线|发布/.test(title)
  );
}

function parseGitLog(raw) {
  return raw
    .split('\x1e')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [fullHash, shortHash, isoDate, subject] = line.split('\x1f');
      const title = (subject || '').trim() || 'No commit message';
      const category = categoryFromTitle(title);

      return {
        hash: shortHash,
        fullHash,
        date: isoDate,
        title,
        category,
        milestone: milestoneFromTitle(title, category),
      };
    });
}

function main() {
  const cmd = 'git log --date=iso-strict --pretty=format:%H%x1f%h%x1f%ad%x1f%s%x1e';
  const raw = execSync(cmd, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const commits = parseGitLog(raw);
  const payload = {
    generatedAt: new Date().toISOString(),
    total: commits.length,
    commits,
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Generated ${outputPath} with ${commits.length} commits.`);
}

main();
