import { serve } from "https://deno.land/std@0.205.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";
import { GoogleGenAI } from "npm:@google/genai";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const GENAI_API_KEY = Deno.env.get("GENAI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-3-flash-preview";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const genAI = GENAI_API_KEY ? new GoogleGenAI({ apiKey: GENAI_API_KEY }) : null;

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const MOOD_LABELS: Record<string, string> = {
  great: "超棒",
  happy: "开心",
  normal: "一般",
  tired: "疲惫",
  uncomfortable: "不舒服",
};

type PeriodType = "weekly" | "monthly" | "yearly";

type AggregatedStats = {
  total: number;
  daysWithRecords: number;
  gapDays: number | null;
  shapeEntries: Array<{ label: string; count: number }>;
  moodEntries: Array<{ label: string; count: number }>;
  noteSamples: string[];
};

const computePeriodRange = (type: PeriodType, now: Date) => {
  const start = new Date(now);
  const end = new Date(now);
  switch (type) {
    case "weekly": {
      const day = now.getDay();
      const distance = (day + 6) % 7; // week starting Monday
      start.setDate(now.getDate() - distance);
      end.setDate(start.getDate() + 6);
      break;
    }
    case "monthly": {
      start.setDate(1);
      end.setMonth(start.getMonth() + 1, 0);
      break;
    }
    case "yearly": {
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      break;
    }
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const tallyRecords = (
  records: Array<{
    shape_type: number;
    mood: string;
    happened_at: string;
    note: string | null;
  }>,
): AggregatedStats => {
  const daySet = new Set<string>();
  const shapeCounts = new Map<number, number>();
  const moodCounts = new Map<string, number>();
  const notes: string[] = [];
  let latestTimestamp: Date | null = null;

  records.forEach((record) => {
    const happened = new Date(record.happened_at);
    daySet.add(happened.toISOString().split("T")[0]);
    shapeCounts.set(
      record.shape_type,
      (shapeCounts.get(record.shape_type) ?? 0) + 1,
    );
    moodCounts.set(record.mood, (moodCounts.get(record.mood) ?? 0) + 1);
    const trimmedNote = record.note?.trim();
    if (trimmedNote) {
      notes.push(trimmedNote);
    }
    if (!latestTimestamp || happened > latestTimestamp) {
      latestTimestamp = happened;
    }
  });

  const gapDays =
    latestTimestamp === null
      ? null
      : Math.max(
          0,
          Math.ceil(
            (Date.now() - latestTimestamp.getTime()) / (1000 * 60 * 60 * 24),
          ),
        );

  const sortedShapes = Array.from(shapeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([shape, count]) => ({
      label: `${shape} 型`,
      count,
    }));

  const sortedMoods = Array.from(moodCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([mood, count]) => ({
      label: MOOD_LABELS[mood] ?? mood,
      count,
    }));

  return {
    total: records.length,
    daysWithRecords: daySet.size,
    gapDays,
    shapeEntries: sortedShapes,
    moodEntries: sortedMoods,
    noteSamples: notes.slice(-8),
  };
};

const buildPrompt = (
  periodLabel: string,
  selfStats: AggregatedStats,
  partnerStats: AggregatedStats,
) => {
  const formatEntries = (entries: Array<{ label: string; count: number }>) =>
    entries.length
      ? entries
          .slice(0, 3)
          .map((entry) => `${entry.label} ${entry.count} 次`)
          .join("，")
      : "暂无记录";
  const formatNotes = (notes: string[]) =>
    notes.length
      ? notes.map((note, index) => `${index + 1}. ${note}`).join("\n")
      : "暂无备注";

  return `
你是中文肠道健康分析助手。请基于 poo_records 的结构化统计与备注文本，输出自然、具体、可执行的健康分析。统计周期：${periodLabel}。

要求：
1) 不要套用固定模板，不要按“某型=某提醒”做一一映射。
2) 结合形态分布、心情趋势、记录频率与备注上下文，判断变化趋势与可能诱因。
3) 如果数据不足或矛盾，请明确指出不确定性，并给出保守建议。
4) 语气专业但不生硬，避免空话；只输出中文。
5) 输出结构：先写“自我分析”，再写“伴侣分析”，最后写“共同建议（3条）”。

自我数据：
- 总记录：${selfStats.total}
- 记录天数：${selfStats.daysWithRecords}
- 最近记录距今：${selfStats.gapDays === null ? "暂无记录" : selfStats.gapDays === 0 ? "今天" : `${selfStats.gapDays} 天前`}
- 形态分布（高频优先）：${formatEntries(selfStats.shapeEntries)}
- 心情分布（高频优先）：${formatEntries(selfStats.moodEntries)}
- 备注：
${formatNotes(selfStats.noteSamples)}

伴侣数据：
- 总记录：${partnerStats.total}
- 记录天数：${partnerStats.daysWithRecords}
- 最近记录距今：${partnerStats.gapDays === null ? "暂无记录" : partnerStats.gapDays === 0 ? "今天" : `${partnerStats.gapDays} 天前`}
- 形态分布（高频优先）：${formatEntries(partnerStats.shapeEntries)}
- 心情分布（高频优先）：${formatEntries(partnerStats.moodEntries)}
- 备注：
${formatNotes(partnerStats.noteSamples)}
`;
};

const callGemini = async (prompt: string) => {
  if (!genAI) {
    throw new Error("GENAI_API_KEY 环境变量未配置");
  }

  const response = await genAI.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      temperature: 0.35,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini 未返回有效摘要");
  }

  return text;
};

const insertSummary = async (
  userId: string,
  periodType: PeriodType,
  text: string,
) => {
  const { data: existingSummary, error: existingError } = await supabase
    .from("ai_health_summaries")
    .select("id")
    .eq("user_id", userId)
    .eq("period_type", periodType)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingSummary) {
    const { error } = await supabase
      .from("ai_health_summaries")
      .update({
        summary: text,
        created_at: new Date().toISOString(),
      })
      .eq("id", existingSummary.id);

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase.from("ai_health_summaries").insert({
    user_id: userId,
    period_type: periodType,
    summary: text,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.json().catch(() => ({}));
  const userId = payload?.user_id;
  const periodType: PeriodType = payload?.period_type ?? "monthly";

  let targetUsers: Array<{ id: string; partner_id: string | null }> = [];

  if (userId) {
    const { data: singleUser, error: singleUserError } = await supabase
      .from("users")
      .select("id, partner_id")
      .eq("id", userId)
      .single();
    if (!singleUser || singleUserError) {
      return new Response(JSON.stringify({ error: "无法找到用户信息" }), {
        status: 404,
      });
    }
    targetUsers = [singleUser];
  } else {
    const { data, error } = await supabase
      .from("users")
      .select("id, partner_id")
      .order("created_at", { ascending: true });
    if (error) {
      return new Response(JSON.stringify({ error: "无法加载用户列表" }), {
        status: 500,
      });
    }
    targetUsers = data || [];
  }

  const results: Array<{ user_id: string; summary: string; error?: string }> =
    [];
  const { start, end } = computePeriodRange(periodType, new Date());

  const fetchRecords = async (targetId: string) => {
    const { data, error } = await supabase
      .from("poo_records")
      .select("shape_type, mood, happened_at, note")
      .eq("user_id", targetId)
      .gte("happened_at", start.toISOString())
      .lte("happened_at", end.toISOString())
      .order("happened_at", { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  };

  for (const cursor of targetUsers) {
    const currentUserId = cursor.id;
    const partnerId = cursor.partner_id;

    try {
      const [selfRecords, partnerRecords] = await Promise.all([
        fetchRecords(currentUserId),
        partnerId ? fetchRecords(partnerId) : Promise.resolve([]),
      ]);

      const selfStats = tallyRecords(selfRecords);
      const partnerStats = tallyRecords(partnerRecords);
      const periodLabel = `${start.getFullYear()}年${start.getMonth() + 1}月`;
      const prompt = buildPrompt(periodLabel, selfStats, partnerStats);

      let analysis: string;
      try {
        analysis = await callGemini(prompt);
      } catch (error) {
        results.push({
          user_id: currentUserId,
          summary: "",
          error: `Gemini 调用失败：${getErrorMessage(error)}`,
        });
        continue;
      }

      await insertSummary(currentUserId, periodType, analysis);
      results.push({ user_id: currentUserId, summary: analysis });
    } catch (error) {
      results.push({
        user_id: currentUserId,
        summary: "",
        error: getErrorMessage(error),
      });
    }
  }

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
