-- ==========================================
-- 更新触发器以支持 avatar_emoji
-- 在 SQL Editor 中执行此脚本
-- ==========================================

-- 更新触发器函数，添加 avatar_emoji 字段处理
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

SELECT '触发器已更新，现在支持 avatar_emoji 字段！' AS status;
