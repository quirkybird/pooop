import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
  sessionExpired: boolean;
}

interface SignUpResult {
  user: User;
  emailVerified: boolean;
  isExistingUser: boolean; // 标识是否是已存在的用户
}

interface UseAuthReturn extends AuthState {
  // 认证方法
  signUp: (
    email: string,
    password: string,
    name: string,
    avatarSeed?: string,
  ) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  // 辅助方法
  refreshSession: () => Promise<void>;
  clearSession: () => Promise<void>;
  resetSessionExpired: () => void;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    sessionExpired: false,
  });

  // 初始化：检查现有会话
  useEffect(() => {
    checkSession();

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setState((prev) => ({
          ...prev,
          user: session?.user ?? null,
          loading: false,
        }));
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      setState({
        user: session?.user ?? null,
        loading: false,
        error: null,
        sessionExpired: false,
      });
    } catch (error) {
      setState({
        user: null,
        loading: false,
        error: error as Error,
        sessionExpired: false,
      });
    }
  };

  const refreshSession = useCallback(async () => {
    await checkSession();
  }, []);

  // 清除会话（用于 403 错误处理）
  const clearSession = useCallback(async () => {
    try {
      // 清除 Supabase 会话
      await supabase.auth.signOut({ scope: "local" });

      setState({
        user: null,
        loading: false,
        error: null,
        sessionExpired: true,
      });
    } catch (error) {
      console.error("Failed to clear session:", error);
      // 即使出错也清除本地状态
      setState({
        user: null,
        loading: false,
        error: null,
        sessionExpired: true,
      });
    }
  }, []);

  // 重置 sessionExpired 状态
  const resetSessionExpired = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sessionExpired: false,
    }));
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      avatarSeed?: string,
    ): Promise<SignUpResult> => {
      try {
        setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
          sessionExpired: false,
        }));

        // 创建 Auth 用户，name 和 avatar 放入 user_metadata
        // 数据库触发器会自动创建 public.users 记录
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email,
            password,
            options: {
              data: {
                name: name, // 触发器会从 NEW.raw_user_meta_data 读取
                avatar_emoji: avatarSeed || "👤", // 头像 seed
              },
            },
          },
        );

        if (authError) throw authError;
        if (!authData.user) throw new Error("注册失败，未返回用户信息");

        // 检查邮箱是否已验证
        // Supabase 使用 email_confirmed_at 字段来判断
        const emailVerified = !!authData.user?.user_metadata?.email_verified;

        // 如果邮箱已验证，说明该用户已注册
        const isExistingUser = emailVerified;

        // 注意：不需要手动创建 public.users 记录
        // 数据库触发器 handle_new_user 会自动处理

        setState({
          user: authData.user,
          loading: false,
          error: null,
          sessionExpired: false,
        });

        return {
          user: authData.user,
          emailVerified,
          isExistingUser,
        };
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error as Error,
          sessionExpired: false,
        }));
        throw error;
      }
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        sessionExpired: false,
      }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setState({
        user: data.user,
        loading: false,
        error: null,
        sessionExpired: false,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error as Error,
        sessionExpired: false,
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
        sessionExpired: false,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error as Error,
        sessionExpired: false,
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
    clearSession,
    resetSessionExpired,
  };
}

export default useAuth;
