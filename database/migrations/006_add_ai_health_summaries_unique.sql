-- ==========================================
-- 为 AI 健康分析总结表增加 user_id + period_type 唯一约束
-- 避免重复记录导致 upsert 失败、查询歧义或数据膨胀
-- ==========================================

ALTER TABLE public.ai_health_summaries
  ADD CONSTRAINT ai_health_summaries_user_period_unique
  UNIQUE (user_id, period_type);

-- 如果已经存在重复（历史），可以在部署时先清理再加约束。
-- ==========================================
SELECT 'ai_health_summaries 唯一索引创建完成' AS status;
