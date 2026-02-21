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

const BRISTOL_MAP: Record<number, { label: string; meaning: string }> = {
  1: { label: "1型 - 硬球状", meaning: "严重便秘，提醒补水与膳食纤维" },
  2: { label: "2型 - 凹凸块状", meaning: "轻度便秘，提示推进肠道蠕动" },
  3: { label: "3型 - 裂纹状", meaning: "偏硬但正常，需维持稳定" },
  4: { label: "4型 - 光滑柔软", meaning: "理想型，保持现有水分+节奏" },
  5: { label: "5型 - 软块状", meaning: "偏软次，提示注意纤维" },
  6: { label: "6型 - 蓬松糊状", meaning: "轻度腹泻，提示观察饮食" },
  7: { label: "7型 - 水样", meaning: "严重腹泻，提示就医或控食" },
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
  records: Array<{ shape_type: number; mood: string; happened_at: string }>,
): AggregatedStats => {
  const daySet = new Set<string>();
  const shapeCounts = new Map<number, number>();
  const moodCounts = new Map<string, number>();
  let latestTimestamp: Date | null = null;

  records.forEach((record) => {
    const happened = new Date(record.happened_at);
    daySet.add(happened.toISOString().split("T")[0]);
    shapeCounts.set(
      record.shape_type,
      (shapeCounts.get(record.shape_type) ?? 0) + 1,
    );
    moodCounts.set(record.mood, (moodCounts.get(record.mood) ?? 0) + 1);
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
      label: BRISTOL_MAP[shape]?.label ?? `形态 ${shape}`,
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

  return `
你是一个中文健康顾问助手，正在根据 Supabase poo_records 表提供的自然月数据（布里斯托大便分类法）撰写健康总结反馈。自然月：${periodLabel}。

自我：本月累计 ${selfStats.total} 次记录，分布在 ${selfStats.daysWithRecords} 天。布里斯托主导形态：${formatEntries(selfStats.shapeEntries)}。主观心情：${formatEntries(selfStats.moodEntries)}。最近一次记录距今 ${selfStats.gapDays === null ? "暂无记录" : selfStats.gapDays === 0 ? "今天" : `${selfStats.gapDays} 天前`}。请以温柔专业语气给出 4 句以上分析，最终一条附上建议（如补水、维持规律、关注伴侣信号）。

伴侣：本月累计 ${partnerStats.total} 次记录，分布在 ${partnerStats.daysWithRecords} 天。布里斯托主导形态：${formatEntries(partnerStats.shapeEntries)}。主观心情：${formatEntries(partnerStats.moodEntries)}。最近一次记录距今 ${partnerStats.gapDays === null ? "暂无记录" : partnerStats.gapDays === 0 ? "今天" : `${partnerStats.gapDays} 天前`}。同样输出 4 句以上内容，最后附上建议。

请勿输出英文单词或提示令牌，段落之间空一行，并在结尾提及“布里斯托大便分类法”。
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
  const existing = await supabase
    .from("ai_health_summaries")
    .select("id")
    .eq("user_id", userId)
    .eq("period_type", periodType)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data) {
    const { error } = await supabase
      .from("ai_health_summaries")
      .update({
        summary: text,
        created_at: new Date().toISOString(),
      })
      .eq("id", existing.data.id);

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

  const payload = await req.json().catch(() => null);
  const userId = payload?.user_id;
  const periodType: PeriodType = payload?.period_type ?? "monthly";

  let targetUsers: Array<{ id: string; partner_id: string | null }> = [];

  if (userId) {
    const single = await supabase
      .from("users")
      .select("id, partner_id")
      .eq("id", userId)
      .single();
    if (!single || single.error || !single.data) {
      return new Response(JSON.stringify({ error: "无法找到用户信息" }), {
        status: 404,
      });
    }
    targetUsers = [single.data];
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
      .select("shape_type, mood, happened_at")
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
          error: `Gemini 调用失败：${error.message}`,
        });
        continue;
      }

      await insertSummary(currentUserId, periodType, analysis);
      results.push({ user_id: currentUserId, summary: analysis });
    } catch (error) {
      results.push({
        user_id: currentUserId,
        summary: "",
        error: error.message,
      });
    }
  }

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
