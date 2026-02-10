import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Toilet } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, sessionExpired, clearSession, resetSessionExpired } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 监听 Supabase 认证错误事件（由自定义 fetch 触发）
  useEffect(() => {
    const handleAuthError = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { status, message } = customEvent.detail;
      console.error(`收到认证错误事件: ${status}`);
      
      // 清除会话
      await clearSession();
      
      // 保存当前路径，登录后可以返回
      const currentPath = location.pathname + location.search;
      if (currentPath !== '/login') {
        navigate('/login', { 
          replace: true,
          state: { 
            from: location,
            message: message,
            sessionExpired: true 
          }
        });
      }
    };

    // 监听自定义事件
    window.addEventListener('supabase:auth:error', handleAuthError);

    return () => {
      window.removeEventListener('supabase:auth:error', handleAuthError);
    };
  }, [clearSession, navigate, location]);

  // 监听 Supabase 认证状态变化
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        // 处理登出事件
        if (event === 'SIGNED_OUT') {
          console.log('用户已登出，重定向到登录页');
          if (location.pathname !== '/login') {
            navigate('/login', { 
              replace: true,
              state: { 
                from: location,
                message: '登录信息已失效，请重新登录',
                sessionExpired: true 
              }
            });
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  // 如果 session 过期，重定向到登录页
  useEffect(() => {
    if (sessionExpired && !loading) {
      resetSessionExpired();
      if (location.pathname !== '/login') {
        navigate('/login', { 
          replace: true,
          state: { 
            from: location,
            message: '登录信息已失效，请重新登录',
            sessionExpired: true 
          }
        });
      }
    }
  }, [sessionExpired, loading, navigate, location, resetSessionExpired]);

  // 加载中显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Toilet size={48} className="text-primary animate-bounce" />
          </div>
          <p className="font-mono text-primary/60">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录，重定向到登录页
  if (!user) {
    return (
      <Navigate 
        to="/login" 
        state={{ 
          from: location,
          message: sessionExpired ? '登录信息已失效，请重新登录' : undefined,
          sessionExpired: sessionExpired || undefined
        }} 
        replace 
      />
    );
  }

  // 已登录，显示内容
  return <>{children}</>;
}

export default AuthGuard;