import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file:\n' +
    'VITE_SUPABASE_URL=your-project-url\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key'
  );
}

// 创建自定义 fetch 函数来拦截错误
const customFetch = (...args: Parameters<typeof fetch>): Promise<Response> => {
  return fetch(...args).then(async (response) => {
    // 检测 401 Unauthorized 或 403 Forbidden 错误
    if (response.status === 401 || response.status === 403) {
      console.error(`Supabase 请求返回 ${response.status} 错误`);
      
      // 触发全局认证错误事件
      const event = new CustomEvent('supabase:auth:error', {
        detail: {
          status: response.status,
          message: response.status === 401 
            ? '登录已过期，请重新登录' 
            : '登录信息已失效，请重新登录'
        }
      });
      window.dispatchEvent(event);
    }
    
    return response;
  });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'pooop-auth-token',
    storage: localStorage,
  },
  global: {
    fetch: customFetch,
  },
});

// 类型导出
export type SupabaseClient = typeof supabase;
