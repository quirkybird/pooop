import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, Moon, Heart, AlertCircle } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, loading, error, resetSessionExpired } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  // 检查是否有 session 过期消息
  useEffect(() => {
    const state = location.state as { message?: string; sessionExpired?: boolean } | null;
    if (state?.sessionExpired || state?.message) {
      setSessionExpiredMessage(state.message || '登录信息已失效，请重新登录');
      // 清除 URL 中的 state，避免刷新后还显示
      resetSessionExpired();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, resetSessionExpired]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim() || !password.trim()) {
      setFormError('请填写邮箱和密码');
      return;
    }

    try {
      await signIn(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败';
      setFormError(message);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Moon size={64} className="text-primary" />
          </div>
          <h1 className="font-serif text-3xl text-primary mb-2">Pooop</h1>
          <p className="text-sm text-primary/60 font-mono flex items-center justify-center gap-1">
            情侣便便记录工具 <Heart size={16} className="text-pink" />
          </p>
        </div>

        <Card>
          <h2 className="font-serif text-xl text-primary mb-6 text-center">
            欢迎回来
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 邮箱输入 */}
            <div>
              <label className="block text-sm font-mono text-primary/70 mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-cream-warm rounded-xl pl-12 pr-4 py-3 font-mono text-primary placeholder:text-primary/30 border-2 border-transparent focus:border-primary-light focus:outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div>
              <label className="block text-sm font-mono text-primary/70 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  className="w-full bg-cream-warm rounded-xl pl-12 pr-4 py-3 font-mono text-primary placeholder:text-primary/30 border-2 border-transparent focus:border-primary-light focus:outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Session 过期提示 */}
            {sessionExpiredMessage && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-mono flex items-center gap-2">
                <AlertCircle size={16} />
                {sessionExpiredMessage}
              </div>
            )}

            {/* 错误提示 */}
            {(formError || error) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-mono">
                {formError || error?.message}
              </div>
            )}

            {/* 登录按钮 */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={loading}
              isLoading={loading}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>

          {/* 注册链接 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-primary/60 font-mono">
              还没有账号？{' '}
              <Link
                to="/register"
                className="text-pink hover:underline font-medium"
              >
                立即注册
              </Link>
            </p>
          </div>
        </Card>

        {/* 提示 */}
        <p className="text-center text-xs text-primary/40 font-mono mt-6">
          登录即表示您同意我们的服务条款
        </p>
      </div>
    </div>
  );
}

export default Login;
