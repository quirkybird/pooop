import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, User, Moon, Heart } from 'lucide-react';

export function Register() {
  const navigate = useNavigate();
  const { signUp, loading, error } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // 表单验证
    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError('请填写所有字段');
      return;
    }

    if (password.length < 6) {
      setFormError('密码至少需要6位字符');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('两次输入的密码不一致');
      return;
    }

    try {
      await signUp(email.trim(), password, name.trim());
      navigate('/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : '注册失败';
      setFormError(message);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💩</div>
          <h1 className="font-serif text-3xl text-primary mb-2">Pooop</h1>
          <p className="text-sm text-primary/60 font-mono">
            创建账号，开始记录 💕
          </p>
        </div>

        <Card>
          <h2 className="font-serif text-xl text-primary mb-6 text-center">
            注册账号
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 昵称输入 */}
            <div>
              <label className="block text-sm font-mono text-primary/70 mb-2">
                昵称
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40"
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="怎么称呼你？"
                  className="w-full bg-cream-warm rounded-xl pl-12 pr-4 py-3 font-mono text-primary placeholder:text-primary/30 border-2 border-transparent focus:border-primary-light focus:outline-none"
                  disabled={loading}
                />
              </div>
            </div>

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
                  placeholder="至少6位字符"
                  className="w-full bg-cream-warm rounded-xl pl-12 pr-4 py-3 font-mono text-primary placeholder:text-primary/30 border-2 border-transparent focus:border-primary-light focus:outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            {/* 确认密码 */}
            <div>
              <label className="block text-sm font-mono text-primary/70 mb-2">
                确认密码
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  className="w-full bg-cream-warm rounded-xl pl-12 pr-4 py-3 font-mono text-primary placeholder:text-primary/30 border-2 border-transparent focus:border-primary-light focus:outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            {/* 错误提示 */}
            {(formError || error) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-mono">
                {formError || error?.message}
              </div>
            )}

            {/* 注册按钮 */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={loading}
              isLoading={loading}
            >
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>

          {/* 登录链接 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-primary/60 font-mono">
              已有账号？{' '}
              <Link
                to="/login"
                className="text-pink hover:underline font-medium"
              >
                立即登录
              </Link>
            </p>
          </div>
        </Card>

        {/* 提示 */}
        <p className="text-center text-xs text-primary/40 font-mono mt-6">
          注册即表示您同意我们的服务条款
        </p>
      </div>
    </div>
  );
}

export default Register;
