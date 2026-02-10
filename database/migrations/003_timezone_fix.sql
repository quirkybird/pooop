-- ==========================================
-- 确保时区设置和本地时间正确处理
-- ==========================================

-- 设置会话时区为 UTC（Supabase 默认）
SET timezone = 'UTC';

-- 验证当前时区设置
SELECT current_setting('TIMEZONE') as current_timezone;

-- 如果需要，可以更改为本地时区，例如：
-- ALTER SYSTEM SET timezone = 'Asia/Shanghai';
-- SELECT pg_reload_conf();

-- 确保 poo_records 表的 happened_at 字段正确处理时区
-- TIMESTAMP WITH TIME ZONE 会自动存储和返回 UTC 时间
-- 前端使用 new Date() 会自动转换为本地时区

-- 创建函数：安全地将 UTC 时间戳转换为本地时间字符串
CREATE OR REPLACE FUNCTION format_local_time(utc_timestamp TIMESTAMP WITH TIME ZONE)
RETURNS TEXT AS $$
BEGIN
    -- 返回格式化的本地时间
    RETURN TO_CHAR(utc_timestamp AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI:SS');
END;
$$ LANGUAGE plpgsql;

-- 测试函数
-- SELECT format_local_time(happened_at) FROM poo_records LIMIT 1;

-- 注意：上面的函数在某些 Supabase 配置中可能需要超级用户权限
-- 如果无法创建函数，前端使用 new Date(timestamp) 可以正确转换本地时间
