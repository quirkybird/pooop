import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const outputPath = resolve(projectRoot, 'src/data/dev-progress.json');

const exactTranslations = new Map([
  [
    'Update index.html for localization to Chinese, add meta description and theme color, and replace favicon with a new icon file.',
    '将 index.html 本地化为中文，新增 meta 描述与主题色，并替换 favicon 图标文件。',
  ],
  [
    'Update Toaster duration and refine heart reaction terminology in Home page for improved clarity and consistency.',
    '调整 Toaster 展示时长，并统一首页爱心交互术语，提升表达清晰度与一致性。',
  ],
  [
    'Update README with project description and features, implement soft delete functionality for heart reactions in the database, and enhance Home page with optimistic UI updates for heart interactions. Add new API methods for managing heart reactions and retrieving received hearts.',
    '更新 README 项目说明与功能文档；在数据库实现爱心软删除；首页爱心交互接入乐观更新；新增爱心管理与已收爱心查询 API。',
  ],
  [
    'Refactor History and Home pages by removing unused imports to streamline code and improve performance.',
    '重构 History 与 Home 页面，移除未使用导入以精简代码并优化性能。',
  ],
  [
    'Add timezone handling in database migration, enhance AvatarEditModal with random seed refresh functionality, and implement Timeline component for displaying user records. Update HeartButton to manage reactions more effectively and improve History page with date range filtering for records.',
    '在数据库迁移中补充时区处理；增强 AvatarEditModal 随机种子刷新；实现用于展示用户记录的 Timeline 组件；优化 HeartButton 反应逻辑并改进 History 日期范围筛选。',
  ],
  [
    'Add avatar editing modal, integrate Sonner for toast notifications, and update package dependencies. Enhance user feedback in various components and improve avatar selection functionality.',
    '新增头像编辑弹窗，集成 Sonner Toast 通知并更新依赖；增强多处组件用户反馈并优化头像选择功能。',
  ],
  [
    'Implement Vercel deployment guide, add avatar selection feature, and enhance authentication flow with session management. Update user registration to include avatar emoji and improve error handling in authentication. Introduce toast notifications for user feedback.',
    '补充 Vercel 部署指南，新增头像选择并完善含会话管理的认证流程；注册流程支持头像 Emoji；改进认证错误处理并引入 Toast 用户反馈。',
  ],
  [
    'Add Dicebear dependencies and enhance UI with new icons',
    '新增 Dicebear 依赖，并使用新图标增强界面表现。',
  ],
  [
    'feat: add auto-generated git progress timeline page',
    '新增自动生成的 Git 开发进度时间线页面。',
  ],
  ['pooooooooop', '项目初始化首个提交。'],
]);

function translateTitle(title) {
  if (exactTranslations.has(title)) {
    return exactTranslations.get(title);
  }

  if (/[\u4e00-\u9fff]/.test(title)) {
    return title;
  }

  const conventionalMatch = title.match(
    /^(feat|fix|chore|docs|refactor|style|perf|test)(\([^)]+\))?:\s*(.+)$/i
  );
  if (conventionalMatch) {
    const type = conventionalMatch[1].toLowerCase();
    const detail = conventionalMatch[3];
    const typeLabel = {
      feat: '新功能',
      fix: '修复',
      chore: '工程维护',
      docs: '文档',
      refactor: '重构',
      style: '样式',
      perf: '性能优化',
      test: '测试',
    }[type];

    return `${typeLabel}：${detail}`;
  }

  return title
    .replace(/^Add\b/i, '新增')
    .replace(/^Update\b/i, '更新')
    .replace(/^Implement\b/i, '实现')
    .replace(/^Refactor\b/i, '重构')
    .replace(/^Fix\b/i, '修复')
    .replace(/^Remove\b/i, '移除');
}

function categoryFromTitle(title) {
  const t = title.toLowerCase();

  if (
    /\b(release|deploy|production|publish|vercel|localization)\b/.test(t) ||
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
      const titleZh = translateTitle(title);
      const category = categoryFromTitle(title);

      return {
        hash: shortHash,
        fullHash,
        date: isoDate,
        title,
        titleZh,
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
