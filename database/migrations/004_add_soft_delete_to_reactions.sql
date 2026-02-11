-- ==========================================
-- Migration: 添加软删除功能到 heart_reactions 表
-- 日期: 2026-02-11
-- ==========================================

-- 1. 添加 is_liked 字段（软删除标记）
ALTER TABLE public.heart_reactions 
ADD COLUMN IF NOT EXISTS is_liked BOOLEAN DEFAULT TRUE;

-- 2. 为现有记录设置默认值
UPDATE public.heart_reactions 
SET is_liked = TRUE 
WHERE is_liked IS NULL;

-- 3. 添加复合唯一索引（防止重复点赞，只针对 is_liked = true 的记录）
CREATE UNIQUE INDEX IF NOT EXISTS idx_heart_reactions_unique 
ON public.heart_reactions(from_user_id, record_id) 
WHERE is_liked = TRUE;

-- 4. 添加 UPDATE 策略（允许用户取消/恢复点赞）
-- 先删除旧策略（如果存在）
DROP POLICY IF EXISTS "Users can update own reactions" ON public.heart_reactions;

-- 创建新策略
CREATE POLICY "Users can update own reactions" ON public.heart_reactions
FOR UPDATE
USING (
  from_user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
)
WITH CHECK (
  from_user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);

-- 5. 可选：添加用于查询的索引（优化性能）
CREATE INDEX IF NOT EXISTS idx_heart_reactions_is_liked 
ON public.heart_reactions(is_liked) 
WHERE is_liked = TRUE;
