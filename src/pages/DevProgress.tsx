import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  GitBranch,
  GitCommitHorizontal,
  Rocket,
} from 'lucide-react';
import { SiVite } from 'react-icons/si';
import progressData from '../data/dev-progress.json';

type CommitItem = {
  hash: string;
  fullHash?: string;
  date: string;
  title: string;
  titleZh?: string;
  category: 'Setup' | 'Feature' | 'UX' | 'Release';
  milestone?: boolean;
};

type ProgressPayload = {
  generatedAt: string;
  total: number;
  commits: CommitItem[];
};

const progress = progressData as ProgressPayload;

const categoryStyles: Record<CommitItem['category'], string> = {
  Setup: 'bg-amber-100 text-amber-800 border-amber-200',
  Feature: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  UX: 'bg-sky-100 text-sky-800 border-sky-200',
  Release: 'bg-violet-100 text-violet-800 border-violet-200',
};

export function DevProgress() {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const sorted = [...progress.commits].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    if (sorted.length === 0) {
      return null;
    }

    const days = new Set(sorted.map((item) => item.date.slice(0, 10)));

    return {
      totalCommits: sorted.length,
      activeDays: days.size,
      milestones: sorted.filter((item) => item.milestone).length,
      start: sorted[0],
      latest: sorted[sorted.length - 1],
      timeline: sorted.reverse(),
    };
  }, []);

  const categoryStats = useMemo(() => {
    if (!stats) return [];

    const counts = stats.timeline.reduce<Record<CommitItem['category'], number>>(
      (acc, item) => {
        acc[item.category] += 1;
        return acc;
      },
      { Setup: 0, Feature: 0, UX: 0, Release: 0 }
    );

    const meta: Record<CommitItem['category'], { label: string; barClass: string }> = {
      Setup: { label: '初始化', barClass: 'bg-amber-400' },
      Feature: { label: '功能开发', barClass: 'bg-emerald-500' },
      UX: { label: '体验优化', barClass: 'bg-sky-500' },
      Release: { label: '发布部署', barClass: 'bg-violet-500' },
    };

    return (Object.keys(counts) as CommitItem['category'][]).map((key) => ({
      key,
      label: meta[key].label,
      value: counts[key],
      ratio: stats.totalCommits > 0 ? Math.round((counts[key] / stats.totalCommits) * 100) : 0,
      barClass: meta[key].barClass,
    }));
  }, [stats]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-cream-light to-cream-warm p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-2 text-sm text-primary shadow-sm transition-colors hover:bg-white"
          >
            <ArrowLeft size={16} />
            返回首页
          </button>

          <div className="rounded-3xl border border-primary/10 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <GitBranch size={14} />
              软件开发进度总览
            </p>
            <h1 className="font-serif text-3xl text-primary md:text-4xl">Git 开发时间线</h1>
            <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-3 py-1 text-xs text-primary/70">
              <SiVite className="text-[#646CFF]" />
              Built with Vite
            </p>
            <p className="mt-3 text-sm text-primary/70 md:text-base">
              基于当前仓库提交记录整理，展示本项目从初始化到页面本地化的推进过程。
            </p>
          </div>
        </header>

        {!stats && (
          <section className="rounded-2xl border border-primary/10 bg-white p-6 text-center text-primary/70">
            暂无可展示的提交记录，请先运行生成脚本。
          </section>
        )}

        {stats && (
          <>
        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-primary/10 bg-white p-4">
            <p className="text-xs text-primary/60">提交总数</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-semibold text-primary">
              <GitCommitHorizontal size={20} />
              {stats.totalCommits}
            </p>
          </div>
          <div className="rounded-2xl border border-primary/10 bg-white p-4">
            <p className="text-xs text-primary/60">活跃天数</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-semibold text-primary">
              <CalendarDays size={20} />
              {stats.activeDays}
            </p>
          </div>
          <div className="rounded-2xl border border-primary/10 bg-white p-4">
            <p className="text-xs text-primary/60">关键里程碑</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-semibold text-primary">
              <Rocket size={20} />
              {stats.milestones}
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-primary/10 bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 font-serif text-xl text-primary">
            <CalendarDays size={18} />
            开发区间
          </h2>
          <p className="text-sm text-primary/70">
            起始提交：{format(new Date(stats.start.date), 'yyyy年M月d日 HH:mm', { locale: zhCN })}
            （{stats.start.hash}）<br />
            最新提交：{format(new Date(stats.latest.date), 'yyyy年M月d日 HH:mm', { locale: zhCN })}
            （{stats.latest.hash}）
          </p>
        </section>

        <section className="mb-8 rounded-2xl border border-primary/10 bg-white p-5">
          <h2 className="mb-4 font-serif text-xl text-primary">提交分类图表</h2>
          <div className="space-y-3">
            {categoryStats.map((item) => (
              <div key={item.key}>
                <div className="mb-1 flex items-center justify-between text-sm text-primary/80">
                  <span>{item.label}</span>
                  <span className="font-mono">
                    {item.value} 次 · {item.ratio}%
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-cream-warm">
                  <div
                    className={`h-full rounded-full ${item.barClass}`}
                    style={{ width: `${item.ratio}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative pl-6 md:pl-8">
          <div className="absolute bottom-0 left-2 top-0 w-px bg-primary/20 md:left-3" />
          <div className="space-y-5">
            {stats.timeline.map((item) => (
              <article
                key={item.fullHash || item.hash}
                className="relative rounded-2xl border border-primary/10 bg-white p-4 shadow-sm"
              >
                <div className="absolute -left-[1.38rem] top-5 h-3 w-3 rounded-full border-2 border-primary/40 bg-cream md:-left-[1.63rem]" />
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-semibold ${categoryStyles[item.category]}`}
                  >
                    {item.category}
                  </span>
                  {item.milestone && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-pink-soft px-2 py-1 text-xs font-semibold text-pink">
                      <CheckCircle2 size={12} />
                      Milestone
                    </span>
                  )}
                  <span className="ml-auto text-xs font-mono text-primary/50">#{item.hash}</span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-primary md:text-lg">
                  {item.titleZh || item.title}
                </h3>
                {item.titleZh && item.titleZh !== item.title && (
                  <p className="mt-1 text-xs text-primary/45">{item.title}</p>
                )}
                <p className="mt-2 text-sm text-primary/60">
                  {format(new Date(item.date), 'yyyy年M月d日 HH:mm', { locale: zhCN })}
                </p>
              </article>
            ))}
          </div>
        </section>
          </>
        )}
      </div>
    </div>
  );
}

export default DevProgress;
