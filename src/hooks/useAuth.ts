import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

interface UseAuthReturn extends AuthState {
  // 认证方法
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  // 辅助方法
  refreshSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // 初始化：检查现有会话
  useEffect(() => {
    checkSession();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setState((prev) => ({
          ...prev,
          user: session?.user ?? null,
          loading: false,
        }));
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      setState({
        user: session?.user ?? null,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        user: null,
        loading: false,
        error: error as Error,
      });
    }
  };

  const refreshSession = useCallback(async () => {
    await checkSession();
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // 创建 Auth 用户，name 放入 user_metadata
      // 数据库触发器会自动创建 public.users 记录
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name, // 触发器会从 NEW.raw_user_meta_data 读取
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('注册失败，未返回用户信息');

      // 注意：不需要手动创建 public.users 记录
      // 数据库触发器 handle_new_user 会自动处理

      setState({
        user: authData.user,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
      throw error;
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setState({
        user: data.user,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setState({
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    refreshSession,
  };
}

export default useAuth;
