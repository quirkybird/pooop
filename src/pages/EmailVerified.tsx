import { Card } from "../components/Card";
import { CheckCircle, Mail } from "lucide-react";

export function EmailVerified() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={48} className="text-green-600" />
            </div>
          </div>
          <h1 className="font-serif text-3xl text-primary mb-2">验证成功！</h1>
          <p className="text-sm text-primary/60 font-mono">
            您的邮箱已验证完成
          </p>
        </div>

        <Card className="text-center">
          <div className="py-6">
            {/* 成功图标 */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                  <Mail size={32} className="text-green-600" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle size={14} className="text-white" />
                </div>
              </div>
            </div>

            <h2 className="font-serif text-xl text-primary mb-3">
              邮箱验证成功
            </h2>

            <p className="text-sm text-primary/60 font-mono mb-6 leading-relaxed">
              恭喜！您的邮箱已成功验证。
              <br />
              现在您可以使用该账号登录了。
            </p>

            {/* 简单的登录提示 */}
            <div className="p-3 bg-cream-warm rounded-xl">
              <p className="text-sm text-primary/70 font-mono">
                请返回应用登录您的账号
              </p>
            </div>
          </div>
        </Card>

        {/* 底部提示 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-primary/40 font-mono">
            如果遇到问题，请尝试刷新页面
          </p>
        </div>
      </div>
    </div>
  );
}

export default EmailVerified;
