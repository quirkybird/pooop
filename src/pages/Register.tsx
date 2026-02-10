import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAuth } from "../hooks/useAuth";
import { AvatarSelector } from "../components/AvatarSelector";
import { Mail, Lock, User, Moon, Heart, CheckCircle } from "lucide-react";
import { useToast } from "../hooks/useToast";

export function Register() {
  const navigate = useNavigate();
  const { signUp, loading, error } = useAuth();
  const { success, error: showError } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("Felix");
  const [formError, setFormError] = useState("");
  const [showEmailVerifyPrompt, setShowEmailVerifyPrompt] = useState(false);
  const [showEmailExistsPrompt, setShowEmailExistsPrompt] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const verifyPromptRef = useRef<HTMLDivElement>(null);
  const emailExistsRef = useRef<HTMLDivElement>(null);

  // 当显示验证提示或邮箱已存在提示时，自动滚动到该位置
  useEffect(() => {
    if (showEmailVerifyPrompt && verifyPromptRef.current) {
      setTimeout(() => {
        verifyPromptRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
    if (showEmailExistsPrompt && emailExistsRef.current) {
      setTimeout(() => {
        emailExistsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [showEmailVerifyPrompt, showEmailExistsPrompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setShowEmailVerifyPrompt(false);
    setShowEmailExistsPrompt(false);

    // 表单验证
    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError("请填写所有字段");
      return;
    }

    if (password.length < 6) {
      setFormError("密码至少需要6位字符");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("两次输入的密码不一致");
      return;
    }

    try {
      const result = await signUp(
        email.trim(),
        password,
        name.trim(),
        avatarSeed,
      );
      if (result.emailVerified) {
        // 邮箱已验证，直接跳转到首页
        success("注册成功，欢迎加入 Pooop！");
        navigate("/", { replace: true });
      } else if (result.isExistingUser) {
        // 用户已存在（邮箱已验证），显示提示引导去登录
        setRegisteredEmail(email);
        setShowEmailExistsPrompt(true);
      } else {
        // 新用户，邮箱未验证，显示验证提示
        setRegisteredEmail(email);
        setShowEmailVerifyPrompt(true);
        success("验证邮件已发送，请查收！");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "注册失败";
      setFormError(message);
      showError(message);
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
            创建账号，开始记录 <Heart size={16} className="text-pink" />
          </p>
        </div>

        <Card>
          <h2 className="font-serif text-xl text-primary mb-6 text-center">
            注册账号
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 头像选择 */}
            <AvatarSelector
              selectedSeed={avatarSeed}
              onSelect={setAvatarSeed}
            />

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
              {loading ? "注册中..." : "注册"}
            </Button>
          </form>

          {/* 登录链接 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-primary/60 font-mono">
              已有账号？{" "}
              <Link
                to="/login"
                className="text-pink hover:underline font-medium"
              >
                立即登录
              </Link>
            </p>
          </div>
        </Card>

        {/* 邮箱验证提示 */}
        {showEmailVerifyPrompt && (
          <Card
            ref={verifyPromptRef}
            className="mt-6 border-amber-200 bg-amber-50"
          >
            <div className="py-4 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Mail size={24} className="text-amber-600" />
                </div>
              </div>
              <h3 className="font-serif text-lg text-amber-800 mb-2">
                请验证您的邮箱
              </h3>
              <p className="text-sm text-amber-700 font-mono mb-4">
                我们已向 <span className="font-bold">{registeredEmail}</span>{" "}
                发送了验证邮件
                <br />
                请查看邮箱并点击验证链接完成注册
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/login")}
                >
                  <CheckCircle size={16} />
                  <span>去登录</span>
                </Button>
              </div>
              <p className="text-xs text-amber-600/70 font-mono mt-3">
                验证完成后即可登录使用
              </p>
            </div>
          </Card>
        )}

        {/* 邮箱已存在提示 */}
        {showEmailExistsPrompt && (
          <Card ref={emailExistsRef} className="mt-6 border-red-200 bg-red-50">
            <div className="py-4 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <User size={24} className="text-red-600" />
                </div>
              </div>
              <h3 className="font-serif text-lg text-red-800 mb-2">
                该邮箱已被注册
              </h3>
              <p className="text-sm text-red-700 font-mono mb-4">
                <span className="font-bold">{registeredEmail}</span>{" "}
                已经注册过账号
                <br />
                请直接登录或使用其他邮箱注册
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/login")}
                >
                  <CheckCircle size={16} />
                  <span>去登录</span>
                </Button>
              </div>
              <p className="text-xs text-red-600/70 font-mono mt-3">
                如果忘记密码，可在登录页找回
              </p>
            </div>
          </Card>
        )}

        {/* 提示 */}
        {!showEmailVerifyPrompt && !showEmailExistsPrompt && (
          <p className="text-center text-xs text-primary/40 font-mono mt-6">
            注册即表示您同意我们的服务条款
          </p>
        )}
      </div>
    </div>
  );
}

export default Register;
