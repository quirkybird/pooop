import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, Check, Heart, Users, Send, Download } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { supabaseApi as api } from '../services/supabaseApi';
import useExtendedStore from '../stores/useStore';
import { useToast } from '../hooks/useToast';

export function Bind() {
  const navigate = useNavigate();
  const { currentUser, setPartner } = useExtendedStore();
  const { success, error: showError } = useToast();

  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isBinding, setIsBinding] = useState(false);
  const [bindSuccess, setBindSuccess] = useState(false);

  const handleCopyCode = () => {
    if (currentUser?.inviteCode) {
      navigator.clipboard.writeText(currentUser.inviteCode);
      setCopied(true);
      success("邀请码已复制");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBind = async () => {
    if (!inviteCode.trim() || !currentUser) return;

    setIsBinding(true);
    try {
      const response = await api.user.bindPartner({
        userId: currentUser.id,
        inviteCode: inviteCode.trim(),
      });

      if (response.success) {
        setPartner(response.data);
        setBindSuccess(true);
        success("绑定成功！祝你们幸福~");
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        showError(response.message || '绑定失败，请检查邀请码');
      }
    } catch (error) {
      console.error('Bind failed:', error);
      showError('绑定失败，请重试');
    } finally {
      setIsBinding(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream p-4">
      {/* Header */}
      <header className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <ChevronLeft size={24} className="text-primary" />
        </button>
        <h1 className="font-serif text-2xl text-primary flex items-center gap-2">绑定伴侣 <Heart size={20} className="text-pink" /></h1>
      </header>

      {/* 成功状态 */}
      {bindSuccess ? (
        <Card className="py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-pink-soft mx-auto flex items-center justify-center mb-6">
            <Heart size={40} className="text-pink fill-pink" />
          </div>
          <h2 className="font-serif text-2xl text-primary mb-2">
            绑定成功！
          </h2>
          <p className="text-sm text-primary/60 font-mono">
            你们现在可以互相查看记录了
          </p>
        </Card>
      ) : (
        <>
          {/* 说明卡片 */}
          <Card className="mb-6 bg-gradient-to-br from-pink-soft/30 to-white border-pink/20">
            <div className="text-center py-4">
              <div className="flex justify-center mb-3">
                <Users size={48} className="text-pink" />
              </div>
              <h2 className="font-serif text-xl text-primary mb-2">
                与伴侣一起记录
              </h2>
              <p className="text-sm text-primary/60 font-mono leading-relaxed">
                绑定后，你们可以互相查看对方的记录
                <br />
                并通过爱心表达关心
              </p>
            </div>
          </Card>

          {/* 我的邀请码 */}
          <Card className="mb-6">
            <h3 className="font-serif text-lg text-primary mb-4 flex items-center gap-2">
<Send size={20} />
              我的邀请码
            </h3>
            <p className="text-sm text-primary/60 font-mono mb-4">
              将下方邀请码分享给伴侣，让对方输入即可绑定
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-cream-warm rounded-xl px-4 py-3 font-mono text-lg text-primary tracking-wider text-center">
                {currentUser?.inviteCode || '加载中...'}
              </div>
              <button
                onClick={handleCopyCode}
                className="p-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-primary-light font-mono mt-2 text-center">
                已复制到剪贴板
              </p>
            )}
          </Card>

          {/* 分隔线 */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-primary/10" />
            <span className="text-sm text-primary/40 font-mono">或者</span>
            <div className="flex-1 h-px bg-primary/10" />
          </div>

          {/* 输入邀请码 */}
          <Card className="mb-8">
            <h3 className="font-serif text-lg text-primary mb-4 flex items-center gap-2">
<Download size={20} />
              输入伴侣的邀请码
            </h3>
            <p className="text-sm text-primary/60 font-mono mb-4">
              让伴侣分享邀请码给你，输入下方进行绑定
            </p>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="请输入邀请码"
              className="w-full bg-cream-warm rounded-xl px-4 py-3 font-mono text-lg text-primary text-center tracking-wider border-2 border-transparent focus:border-primary-light focus:outline-none mb-4 uppercase"
              maxLength={12}
            />
            <Button
              variant="primary"
              fullWidth
              onClick={handleBind}
              disabled={!inviteCode.trim() || isBinding}
              isLoading={isBinding}
            >
              <Heart size={18} className="fill-current" />
              <span>确认绑定</span>
            </Button>
          </Card>

          {/* 提示 */}
          <div className="text-center">
            <p className="text-xs text-primary/40 font-mono">
              提示：每个用户只能绑定一个伴侣
              <br />
              绑定后如需更换，请联系客服
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default Bind;
