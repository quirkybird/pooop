-- ==========================================
-- 修复 RLS 策略循环引用问题
-- 在 SQL Editor 中执行此脚本
-- ==========================================

-- 1. 完全禁用 RLS 进行修复（临时）
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.poo_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.heart_reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_cards DISABLE ROW LEVEL SECURITY;

-- 2. 删除所有现有策略（彻底清理）
DROP POLICY IF EXISTS "Users can read own and partner data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can read own and partner records" ON public.poo_records;
DROP POLICY IF EXISTS "Users can insert own records" ON public.poo_records;
DROP POLICY IF EXISTS "Users can read own heart reactions" ON public.heart_reactions;
DROP POLICY IF EXISTS "Users can send hearts" ON public.heart_reactions;
DROP POLICY IF EXISTS "Users can read reminder cards" ON public.reminder_cards;
DROP POLICY IF EXISTS "Users can create reminder cards" ON public.reminder_cards;

-- 3. 创建安全函数：获取当前用户的 partner_id
-- 使用 SECURITY DEFINER 避免 RLS 递归
CREATE OR REPLACE FUNCTION public.get_current_user_partner_id()
RETURNS UUID AS $$
DECLARE
  partner_uuid UUID;
BEGIN
  SELECT partner_id INTO partner_uuid
  FROM public.users
  WHERE auth_id = auth.uid();
  
  RETURN partner_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 重新启用 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poo_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heart_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_cards ENABLE ROW LEVEL SECURITY;

-- 5. 重新创建 users 表策略（避免递归）
CREATE POLICY "Users can read own and partner data" ON public.users
  FOR SELECT USING (
    auth.uid() = auth_id OR 
    id = public.get_current_user_partner_id()
  );

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id);

CREATE POLICY "Service role can insert users" ON public.users
  FOR INSERT WITH CHECK (true);

-- 6. 重新创建 poo_records 表策略
CREATE POLICY "Users can read own and partner records" ON public.poo_records
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
      UNION
      SELECT public.get_current_user_partner_id()
    )
  );

CREATE POLICY "Users can insert own records" ON public.poo_records
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- 7. 重新创建 heart_reactions 表策略
CREATE POLICY "Users can read own heart reactions" ON public.heart_reactions
  FOR SELECT USING (
    from_user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
      UNION
      SELECT public.get_current_user_partner_id()
    ) OR
    to_user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
      UNION
      SELECT public.get_current_user_partner_id()
    )
  );

CREATE POLICY "Users can send hearts" ON public.heart_reactions
  FOR INSERT WITH CHECK (
    from_user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- 8. 重新创建 reminder_cards 表策略
CREATE POLICY "Users can read reminder cards" ON public.reminder_cards
  FOR SELECT USING (
    to_user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
      UNION
      SELECT public.get_current_user_partner_id()
    )
  );

CREATE POLICY "Users can create reminder cards" ON public.reminder_cards
  FOR INSERT WITH CHECK (
    from_user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- 完成
SELECT 'RLS 策略修复完成！' AS status;
