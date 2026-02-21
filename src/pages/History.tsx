import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Calendar,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  BarChart3,
  Toilet,
  Inbox,
  RotateCcw,
} from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  eachMonthOfInterval,
  differenceInCalendarDays,
} from "date-fns";
import { zhCN } from "date-fns/locale";
import { Card } from "../components/Card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Timeline } from "../components/Timeline";
import ReactMarkdown from "react-markdown";
import {
  supabaseApi as api,
  SHAPE_OPTIONS,
  MOOD_OPTIONS,
} from "../services/supabaseApi";
import useExtendedStore from "../stores/useStore";
import type { PooRecord } from "../types";

type TrendPoint = {
  label: string;
  monthKey: string;
  self: number;
  partner: number;
};

export function History() {
  const navigate = useNavigate();
  const { currentUser, partner } = useExtendedStore();

  const [viewMode, setViewMode] = useState<"history" | "trends">("history");
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendRecords, setTrendRecords] = useState<{
    self: PooRecord[];
    partner: PooRecord[];
  }>({
    self: [],
    partner: [],
  });
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weekRecords, setWeekRecords] = useState<PooRecord[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const didInitSelectRef = useRef(false);

  const weekStart = useMemo(
    () => startOfWeek(currentWeek, { weekStartsOn: 1 }),
    [currentWeek],
  );
  const weekEnd = useMemo(
    () => endOfWeek(currentWeek, { weekStartsOn: 1 }),
    [currentWeek],
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const isCurrentWeek = useMemo(
    () => isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 })),
    [weekStart],
  );

  const trendMonths = useMemo(() => {
    const monthsToShow = 5;
    const now = new Date();
    const centerOffset = Math.floor(monthsToShow / 2);
    const start = startOfMonth(subMonths(now, centerOffset));
    const end = endOfMonth(addMonths(start, monthsToShow - 1));
    return eachMonthOfInterval({ start, end });
  }, []);
  const trendPeriodLabel = useMemo(() => {
    if (!trendMonths.length) return "";
    const first = format(trendMonths[0], "yyyy年M月");
    const last = format(trendMonths[trendMonths.length - 1], "yyyy年M月");
    return `${first} - ${last}`;
  }, [trendMonths]);

  const loadWeekRecords = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [myRecords, partnerRecords] = await Promise.all([
        api.record.getRecordsByDateRange(currentUser.id, weekStart, weekEnd),
        partner
          ? api.record.getRecordsByDateRange(partner.id, weekStart, weekEnd)
          : Promise.resolve({ success: true, data: [] }),
      ]);

      const allRecords = [
        ...(myRecords.success ? myRecords.data : []),
        ...(partnerRecords.success ? partnerRecords.data : []),
      ];

      setWeekRecords(allRecords);
    } catch (error) {
      console.error("Failed to load records:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, partner, weekStart, weekEnd]);

  useEffect(() => {
    if (currentUser) {
      loadWeekRecords();
    } else {
      setIsLoading(false);
    }
  }, [currentUser, loadWeekRecords]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    if (!didInitSelectRef.current && !selectedDay && isCurrentWeek) {
      setSelectedDay(new Date());
      didInitSelectRef.current = true;
    }
  }, [currentUser, selectedDay, isCurrentWeek]);

  const buildMonthlyCounts = (records: PooRecord[]) => {
    const map = new Map<string, number>();
    records.forEach((record) => {
      const monthKey = format(new Date(record.timestamp), "yyyy-MM");
      map.set(monthKey, (map.get(monthKey) ?? 0) + 1);
    });
    return map;
  };

  useEffect(() => {
    if (!currentUser) {
      setTrendData([]);
      setTrendLoading(false);
      return;
    }

    if (!trendMonths.length) {
      setTrendData([]);
      setTrendLoading(false);
      return;
    }

    const fetchTrendData = async () => {
      setTrendLoading(true);
      try {
        const intervalStart = trendMonths[0];
        const intervalEnd = endOfMonth(trendMonths[trendMonths.length - 1]);
        const [selfRes, partnerRes] = await Promise.all([
          api.record.getRecordsByDateRange(
            currentUser.id,
            intervalStart,
            intervalEnd,
          ),
          partner
            ? api.record.getRecordsByDateRange(
                partner.id,
                intervalStart,
                intervalEnd,
              )
            : Promise.resolve({ success: true, data: [] }),
        ]);

        const selfRecords = selfRes.success ? selfRes.data : [];
        const partnerRecords = partnerRes.success ? partnerRes.data : [];

        const selfCounts = buildMonthlyCounts(selfRecords);
        const partnerCounts = buildMonthlyCounts(partnerRecords);
        const points = trendMonths.map((month) => {
          const key = format(month, "yyyy-MM");
          const selfValue = selfCounts.get(key) ?? 0;
          const partnerValue = partnerCounts.get(key) ?? 0;
          return {
            label: format(month, "M月"),
            monthKey: key,
            self: selfValue,
            partner: partnerValue,
          };
        });

        setTrendData(points);
        setTrendRecords({
          self: selfRecords,
          partner: partnerRecords,
        });
      } catch (error) {
        console.error("Failed to load trend data:", error);
        setTrendData([]);
      } finally {
        setTrendLoading(false);
      }
    };

    fetchTrendData();
  }, [currentUser, partner, trendMonths]);

  const getRecordsForDay = useCallback(
    (day: Date) => {
      return weekRecords.filter((record) =>
        isSameDay(new Date(record.timestamp), day),
      );
    },
    [weekRecords],
  );

  const prevWeek = () => {
    setCurrentWeek((prev) => addDays(prev, -7));
    setSelectedDay(null);
  };

  const nextWeek = () => {
    setCurrentWeek((prev) => addDays(prev, 7));
    setSelectedDay(null);
  };

  const handleDayClick = async (day: Date) => {
    if (selectedDay && isSameDay(day, selectedDay)) {
      setSelectedDay(null);
    } else {
      setSelectedDay(day);
    }
  };

  const handleShowAll = () => {
    setSelectedDay(null);
  };

  const displayRecords = selectedDay
    ? getRecordsForDay(selectedDay)
    : weekRecords;

  const trendCenterIndex = Math.floor(trendData.length / 2);
  const latestTrendPoint =
    trendData[trendCenterIndex] ?? trendData[trendData.length - 1];
  const totalSelfRecords = trendData.reduce(
    (sum, point) => sum + point.self,
    0,
  );
  const totalPartnerRecords = trendData.reduce(
    (sum, point) => sum + point.partner,
    0,
  );
  const averageSelf = trendData.length
    ? Math.round((totalSelfRecords / trendData.length) * 10) / 10
    : 0;
  const averagePartner = trendData.length
    ? Math.round((totalPartnerRecords / trendData.length) * 10) / 10
    : 0;

  const formatStatValue = (value: number) =>
    Number.isInteger(value) ? value : value.toFixed(1);

  const latestMonthRange = trendMonths.length
    ? (() => {
        const centerMonth =
          trendMonths[Math.min(trendCenterIndex, trendMonths.length - 1)];
        return {
          start: startOfMonth(centerMonth),
          end: endOfMonth(centerMonth),
        };
      })()
    : null;
  const daysInLatestMonth = latestMonthRange
    ? differenceInCalendarDays(latestMonthRange.end, latestMonthRange.start) + 1
    : 0;

  const getDaysWithRecords = (
    records: PooRecord[],
    range: { start: Date; end: Date } | null,
  ) => {
    if (!range) {
      return 0;
    }

    const uniqueDays = new Set<string>();
    records.forEach((record) => {
      const day = new Date(record.timestamp);
      if (day >= range.start && day <= range.end) {
        uniqueDays.add(day.toISOString().split("T")[0]);
      }
    });

    return uniqueDays.size;
  };

  const getDaysSinceLastRecord = (records: PooRecord[]) => {
    if (records.length === 0) {
      return null;
    }

    const latestTimestamp = records.reduce(
      (latest, record) => {
        const candidate = new Date(record.timestamp);
        return !latest || candidate > latest ? candidate : latest;
      },
      null as Date | null,
    );

    if (!latestTimestamp) return null;
    return differenceInCalendarDays(new Date(), latestTimestamp);
  };

  const buildMoodDistribution = (records: PooRecord[]) => {
    const total = records.length;
    const counts = records.reduce<Map<string, number>>((acc, record) => {
      acc.set(record.moodId, (acc.get(record.moodId) ?? 0) + 1);
      return acc;
    }, new Map());

    return MOOD_OPTIONS.map((option) => ({
      ...option,
      count: counts.get(option.id) ?? 0,
      percentage: total
        ? Math.round(((counts.get(option.id) ?? 0) / total) * 100)
        : 0,
    }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  };

  const buildShapeDistribution = (records: PooRecord[]) => {
    const total = records.length;
    const counts = records.reduce<Map<string, number>>((acc, record) => {
      acc.set(record.shapeId, (acc.get(record.shapeId) ?? 0) + 1);
      return acc;
    }, new Map());

    return SHAPE_OPTIONS.map((shape) => ({
      ...shape,
      count: counts.get(shape.id) ?? 0,
      percentage: total
        ? Math.round(((counts.get(shape.id) ?? 0) / total) * 100)
        : 0,
    }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  };

  const moodStats = {
    self: buildMoodDistribution(trendRecords.self),
    partner: buildMoodDistribution(trendRecords.partner),
  };
  const shapeStats = {
    self: buildShapeDistribution(trendRecords.self),
    partner: buildShapeDistribution(trendRecords.partner),
  };

  const viewTabs: Array<{ id: "history" | "trends"; label: string }> = [
    { id: "history", label: "历史记录" },
    { id: "trends", label: "趋势" },
  ];
  const ViewModeToggle = () => (
    <div className="flex justify-center mb-6">
      <div className="inline-flex rounded-full bg-white/90 p-1 shadow-sm shadow-primary/20">
        {viewTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            className={`px-4 py-1 text-sm font-mono transition-colors rounded-full ${
              viewMode === tab.id
                ? "bg-primary text-white shadow-lg shadow-primary/40"
                : "text-primary/70 hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );

  useEffect(() => {
    if (viewMode !== "trends") {
      return;
    }

    if (!currentUser) {
      setAiSummary("");
      setAiError("请先登录以查看 AI 分析。");
      setAiLoading(false);
      return;
    }

    if (!trendPeriodLabel) {
      setAiSummary("");
      setAiError("缺失自然月区间，稍后再试。");
      setAiLoading(false);
      return;
    }

    let cancelled = false;
    setAiLoading(true);
    setAiError(null);

    const fetchSummary = async () => {
      try {
        const response = await api.aiHealth.getLatestSummary(currentUser.id);
        if (cancelled) return;

        if (!response.success) {
          setAiSummary("");
          setAiError(response.message || "AI 分析加载失败，请稍后重试。");
          return;
        }

        if (!response.data) {
          setAiSummary("");
          setAiError("AI 分析尚未生成，待服务端完成后自动展示。");
          return;
        }

        setAiSummary(response.data);
        setAiError(null);
      } catch (error) {
        if (cancelled) return;
        setAiSummary("");
        setAiError(error?.message || "AI 分析加载失败，请稍后重试。");
      } finally {
        if (!cancelled) {
          setAiLoading(false);
        }
      }
    };

    void fetchSummary();

    return () => {
      cancelled = true;
    };
  }, [viewMode, currentUser, trendPeriodLabel, trendData.length]);

  return (
    <div className="min-h-screen bg-cream p-4">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <ChevronLeft size={24} className="text-primary" />
        </button>
        <h1 className="font-serif text-2xl text-primary flex items-center gap-2">
          历史记录 <BarChart3 size={24} className="text-primary" />
        </h1>
      </header>

      <ViewModeToggle />

      {viewMode === "history" && (
        <>
          {/* 周选择器 */}
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevWeek}
                className="p-2 rounded-full hover:bg-cream-warm transition-colors"
              >
                <PrevIcon size={20} className="text-primary" />
              </button>
              <div className="text-center">
                <p className="font-serif text-lg text-primary">
                  {isCurrentWeek
                    ? "本周"
                    : format(weekStart, "M月", { locale: zhCN })}
                </p>
                <p className="text-xs text-primary/50 font-mono">
                  {format(weekStart, "yyyy年")}
                </p>
              </div>
              <button
                onClick={nextWeek}
                className="p-2 rounded-full hover:bg-cream-warm transition-colors"
              >
                <NextIcon size={20} className="text-primary" />
              </button>
            </div>

            {/* 周历视图 */}
            <div className="grid grid-cols-7 gap-2">
              {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
                <div key={day} className="text-center py-2">
                  <span className="text-xs text-primary/40 font-mono">
                    {day}
                  </span>
                </div>
              ))}
              {weekDays.map((day) => {
                const dayRecords = getRecordsForDay(day);
                const isToday = isSameDay(day, new Date());
                const hasRecords = dayRecords.length > 0;
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const latestMoodByUser = dayRecords.reduce<Map<string, string>>(
                  (acc, record) => {
                    const ts = new Date(record.timestamp).getTime();
                    const prev = acc.get(record.userId);
                    if (!prev || ts > new Date(prev).getTime()) {
                      acc.set(record.userId, record.timestamp);
                    }
                    return acc;
                  },
                  new Map(),
                );

                const latestMoodForUser = (userId?: string) => {
                  if (!userId) return null;
                  const latestTimestamp = latestMoodByUser.get(userId);
                  if (!latestTimestamp) return null;
                  const latestRecord = dayRecords
                    .filter((record) => record.userId === userId)
                    .reduce<PooRecord | null>((latest, record) => {
                      if (!latest) return record;
                      return new Date(record.timestamp) >
                        new Date(latest.timestamp)
                        ? record
                        : latest;
                    }, null);
                  return latestRecord
                    ? MOOD_OPTIONS.find((m) => m.id === latestRecord.moodId)
                        ?.emoji || "•"
                    : null;
                };

                const myMoodEmoji = latestMoodForUser(currentUser?.id);
                const partnerMoodEmoji = latestMoodForUser(partner?.id);
                const moodEmojis = [myMoodEmoji, partnerMoodEmoji].filter(
                  Boolean,
                ) as string[];

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? "bg-pink text-white ring-2 ring-pink ring-offset-2"
                        : isToday
                          ? "bg-primary text-white"
                          : hasRecords
                            ? "bg-cream-warm hover:bg-cream"
                            : "bg-cream-warm/50 hover:bg-cream-warm"
                    }`}
                  >
                    <span
                      className={`text-sm font-mono ${
                        isSelected || isToday ? "text-white" : "text-primary"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    {hasRecords && (
                      <div className="flex gap-0.5">
                        {moodEmojis.map((emoji, idx) => (
                          <span key={idx} className="text-xs">
                            {emoji}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* 详细记录 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg text-primary flex items-center gap-2">
                <Calendar size={18} />
                {selectedDay
                  ? format(selectedDay, "M月d日", { locale: zhCN }) + "的记录"
                  : isCurrentWeek
                    ? "本周记录"
                    : "该周记录"}
              </h2>
              {selectedDay && (
                <button
                  onClick={handleShowAll}
                  className="flex items-center gap-1 text-sm text-primary/60 hover:text-primary font-mono"
                >
                  <RotateCcw size={14} />
                  显示全部
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <Toilet size={40} className="text-primary animate-bounce" />
                </div>
                <p className="font-mono text-primary/60">加载中...</p>
              </div>
            ) : displayRecords.length === 0 ? (
              <Card className="py-12 text-center">
                <div className="flex justify-center mb-4">
                  <Inbox size={48} className="text-primary/30" />
                </div>
                <p className="font-serif text-primary mb-2">
                  {selectedDay ? "这天还没有记录" : "这周还没有记录"}
                </p>
                <p className="text-sm text-primary/50 font-mono">
                  {selectedDay ? '点击"显示全部"查看整周' : "记得每天记录哦"}
                </p>
              </Card>
            ) : selectedDay ? (
              <Timeline
                items={[{ date: selectedDay, records: displayRecords }]}
                currentUser={currentUser}
                partner={partner}
              />
            ) : (
              <Timeline
                items={weekDays
                  .map((day) => ({
                    date: day,
                    records: getRecordsForDay(day),
                  }))
                  .filter((item) => item.records.length > 0)}
                currentUser={currentUser}
                partner={partner}
              />
            )}
          </div>
        </>
      )}

      {viewMode === "trends" && (
        <>
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-serif text-lg text-primary">自然月趋势</p>
                <p className="text-xs text-primary/60">{trendPeriodLabel}</p>
              </div>
              <span className="text-xs uppercase tracking-wide text-primary/50">
                按月计数
              </span>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              {trendLoading ? (
                <div className="flex h-full items-center justify-center rounded-2xl bg-white/70">
                  <p className="text-sm font-mono text-primary/60">
                    加载趋势中...
                  </p>
                </div>
              ) : (
                <div className="w-full h-full px-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0e7ff" />
                      <XAxis
                        dataKey="label"
                        stroke="#a855f7"
                        tick={{ fill: "#7c3aed" }}
                      />
                      <YAxis
                        allowDecimals={false}
                        stroke="#a855f7"
                        tick={{ fill: "#7c3aed" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          borderRadius: 16,
                          border: "1px solid #e5e7eb",
                        }}
                        labelStyle={{ color: "#7c3aed" }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 12, color: "#7c3aed" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="self"
                        name="自己"
                        stroke="#ec4899"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="partner"
                        name="伴侣"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {(["self", "partner"] as const).map((userKey) => {
              const userLabel =
                userKey === "self"
                  ? (currentUser?.name ?? "自己")
                  : (partner?.name ?? "另一半");
              const accentClass =
                userKey === "self" ? "text-pink-500" : "text-sky-500";
              const monthlyCount = latestTrendPoint?.[userKey] ?? 0;
              const averageValue =
                userKey === "self" ? averageSelf : averagePartner;
              const daysWithRecords = getDaysWithRecords(
                trendRecords[userKey],
                latestMonthRange,
              );
              const gapDays = getDaysSinceLastRecord(trendRecords[userKey]);
              const moodList = moodStats[userKey];
              const shapeList = shapeStats[userKey];

              return (
                <Card key={userKey} className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-serif text-xl text-primary">
                      {userLabel}
                    </p>
                    <span
                      className={`text-xs font-mono uppercase tracking-wide text-primary/60 ${accentClass}`}
                    >
                      {userKey === "self" ? "自我" : "伴侣"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-primary/60">最近自然月</p>
                      <p className="font-serif text-3xl text-primary mt-1">
                        {formatStatValue(monthlyCount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-primary/60">月平均</p>
                      <p className="font-serif text-3xl text-primary mt-1">
                        {formatStatValue(averageValue)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-primary/60">
                    <span>
                      {latestMonthRange
                        ? `${daysWithRecords}/${daysInLatestMonth} 天有记录`
                        : "暂无自然月数据"}
                    </span>
                    <span>
                      {gapDays === null
                        ? "暂无记录"
                        : gapDays === 0
                          ? "今天有记录"
                          : `${gapDays} 天前`}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wide text-primary/60">
                      心情分布
                    </p>
                    <div className="mt-2 space-y-2">
                      {moodList.length > 0 ? (
                        moodList.slice(0, 3).map((mood) => (
                          <div
                            key={mood.id}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{mood.emoji}</span>
                              <span>{mood.label}</span>
                            </div>
                            <span className="text-primary/60">
                              {mood.count} 次 · {mood.percentage}%
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-primary/50">暂无心情记录</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wide text-primary/60">
                      便便形态
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {shapeList.length > 0 ? (
                        shapeList.slice(0, 4).map((shape) => (
                          <span
                            key={shape.id}
                            className="flex items-center gap-1 rounded-full border border-primary/10 px-3 py-1 text-xs text-primary"
                          >
                            <span>{shape.emoji}</span>
                            <span>{shape.label}</span>
                            <span className="text-primary/50">
                              {shape.count} 次
                            </span>
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-primary/50">暂无形态记录</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="font-serif text-lg text-primary">AI 分析</p>
              <span className="text-xs font-mono uppercase tracking-wide text-primary/50">
                数据来自最新自然月总结
              </span>
            </div>
            <div className="min-h-[120px] rounded-2xl border border-dashed border-primary/20 bg-white/70 p-4 text-sm text-primary/70">
              {aiLoading ? (
                <p className="text-primary/60">正在加载 AI 总结，请稍候...</p>
              ) : aiSummary ? (
                <div className="prose prose-sm text-primary/80 leading-relaxed">
                  <ReactMarkdown>{aiSummary}</ReactMarkdown>
                </div>
              ) : (
                <p
                  className={`leading-relaxed ${aiError ? "text-rose-500" : "text-primary/60"}`}
                >
                  {aiError ?? "AI 分析尚未生成，服务端生成后刷新即可查看。"}
                </p>
              )}
            </div>
            <p className="mt-3 text-xs text-primary/50">
              AI 分析由 Gemini强力驱动，基于布里斯托大便分类法、心情和频率统计。
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

export default History;
