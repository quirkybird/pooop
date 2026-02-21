-- ==========================================
-- AI健康分析总结表
-- 用于记录AI对用户粪便健康的分析总结
-- 支持三种周期：weekly（一周）、monthly（自然月）、yearly（年度）
-- ==========================================

-- 1. 创建AI健康分析总结表
CREATE TABLE IF NOT EXISTS public.ai_health_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'yearly')),
  summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 启用RLS
ALTER TABLE public.ai_health_summaries ENABLE ROW LEVEL SECURITY;

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_health_summaries_user_id ON public.ai_health_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_health_summaries_period_type ON public.ai_health_summaries(period_type);
CREATE INDEX IF NOT EXISTS idx_ai_health_summaries_created_at ON public.ai_health_summaries(created_at);

-- 4. RLS策略：用户可以读取自己及伴侣的分析总结
CREATE POLICY "Users can read own and partner summaries" ON public.ai_health_summaries
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
      UNION
      SELECT partner_id FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- 5. RLS策略：系统（service role）可以插入分析总结
CREATE POLICY "Service role can insert summaries" ON public.ai_health_summaries
  FOR INSERT WITH CHECK (true);

-- ==========================================
-- 完成！
-- ==========================================
SELECT 'AI健康分析总结表创建完成！' AS status;
