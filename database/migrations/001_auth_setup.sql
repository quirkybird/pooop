-- ==========================================
-- Supabase Auth 初始化脚本
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ==========================================

-- ==========================================
-- 1. 创建用户资料表
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '👤',
  partner_id UUID REFERENCES public.users(id),
  invite_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. 创建便便记录表
-- ==========================================
CREATE TABLE IF NOT EXISTS public.poo_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  happened_at TIMESTAMP WITH TIME ZONE NOT NULL,
  shape_type INTEGER NOT NULL CHECK (shape_type BETWEEN 1 AND 7),
  mood TEXT CHECK (mood IN ('great', 'happy', 'normal', 'tired', 'uncomfortable')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. 创建爱心互动表
-- ==========================================
CREATE TABLE IF NOT EXISTS public.heart_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  record_id UUID REFERENCES public.poo_records(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. 创建提醒卡片表
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reminder_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  bg_color TEXT DEFAULT '#FFE5EC',
  text_color TEXT DEFAULT '#FF6B9D',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. 启用 RLS (行级安全)
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poo_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heart_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_cards ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 6. 创建 RLS 策略
-- ==========================================

-- 创建辅助函数：获取当前用户的 partner_id（避免递归）
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

-- users 表策略：用户可以读取自己和伴侣的数据
CREATE POLICY "Users can read own and partner data" ON public.users
  FOR SELECT USING (
    auth.uid() = auth_id OR 
    id = public.get_current_user_partner_id()
  );

-- users 表策略：用户可以更新自己的数据
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id);

-- users 表策略：认证用户可以插入（在 handle_new_user 函数中使用）
CREATE POLICY "Service role can insert users" ON public.users
  FOR INSERT WITH CHECK (true);

-- poo_records 表策略：用户可以读取自己和伴侣的记录
CREATE POLICY "Users can read own and partner records" ON public.poo_records
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
      UNION
      SELECT public.get_current_user_partner_id()
    )
  );

-- poo_records 表策略：用户可以插入自己的记录
CREATE POLICY "Users can insert own records" ON public.poo_records
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- heart_reactions 表策略：用户可以读取涉及自己的互动
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

-- heart_reactions 表策略：用户可以发送爱心
CREATE POLICY "Users can send hearts" ON public.heart_reactions
  FOR INSERT WITH CHECK (
    from_user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- reminder_cards 表策略：用户可以读取发送给自己和伴侣的卡片
CREATE POLICY "Users can read reminder cards" ON public.reminder_cards
  FOR SELECT USING (
    to_user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
      UNION
      SELECT public.get_current_user_partner_id()
    )
  );

-- reminder_cards 表策略：用户可以创建给伴侣的卡片
CREATE POLICY "Users can create reminder cards" ON public.reminder_cards
  FOR INSERT WITH CHECK (
    from_user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- ==========================================
-- 7. 创建触发器：新用户注册时自动创建资料
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invite_code TEXT;
BEGIN
  -- 生成邀请码
  invite_code := upper(substring(md5(random()::text) from 1 for 8));
  
  INSERT INTO public.users (auth_id, email, name, avatar_emoji, invite_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_emoji', '👤'),
    invite_code
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 8. 创建函数：生成新的邀请码
-- ==========================================
CREATE OR REPLACE FUNCTION public.regenerate_invite_code(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
BEGIN
  new_code := upper(substring(md5(random()::text) from 1 for 8));
  
  UPDATE public.users 
  SET invite_code = new_code
  WHERE id = user_uuid;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 9. 创建函数：绑定伴侣
-- ==========================================
CREATE OR REPLACE FUNCTION public.bind_partner(current_user_id UUID, target_invite_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  partner_record public.users%ROWTYPE;
BEGIN
  -- 查找拥有该邀请码的用户
  SELECT * INTO partner_record 
  FROM public.users 
  WHERE invite_code = target_invite_code AND id != current_user_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- 检查对方是否已有伴侣
  IF partner_record.partner_id IS NOT NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 双向绑定
  UPDATE public.users SET partner_id = partner_record.id WHERE id = current_user_id;
  UPDATE public.users SET partner_id = current_user_id WHERE id = partner_record.id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 10. 创建索引（优化查询性能）
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON public.users(partner_id);
CREATE INDEX IF NOT EXISTS idx_users_invite_code ON public.users(invite_code);
CREATE INDEX IF NOT EXISTS idx_poo_records_user_id ON public.poo_records(user_id);
CREATE INDEX IF NOT EXISTS idx_poo_records_happened_at ON public.poo_records(happened_at);
CREATE INDEX IF NOT EXISTS idx_heart_reactions_record_id ON public.heart_reactions(record_id);
CREATE INDEX IF NOT EXISTS idx_reminder_cards_to_user_id ON public.reminder_cards(to_user_id);

-- ==========================================
-- 完成！
-- ==========================================
SELECT 'Supabase Auth 数据库初始化完成！' AS status;
