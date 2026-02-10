import { useState } from 'react';
import { X, Check, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { DicebearAvatar, AvatarSelector, getRandomSeeds } from './AvatarSelector';
import { supabaseApi as api } from '../services/supabaseApi';
import { useToast } from '../hooks/useToast';

interface AvatarEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  userId: string;
  onAvatarUpdated: (newAvatar: string) => void;
}

export function AvatarEditModal({
  isOpen,
  onClose,
  currentAvatar,
  userId,
  onAvatarUpdated,
}: AvatarEditModalProps) {
  const [selectedSeed, setSelectedSeed] = useState(currentAvatar);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarSeeds, setAvatarSeeds] = useState(() => getRandomSeeds(4));
  const { success, error: showError } = useToast();

  const handleSave = async () => {
    if (selectedSeed === currentAvatar) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.user.updateAvatar(userId, selectedSeed);
      if (response.success) {
        success('头像已更新');
        onAvatarUpdated(selectedSeed);
        onClose();
      } else {
        showError(response.message || '更新失败');
      }
    } catch {
      showError('更新失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-serif text-xl text-primary">修改头像</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 当前头像预览 */}
        <div className="px-6 py-6">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-cream-warm overflow-hidden shadow-lg">
              <DicebearAvatar seed={selectedSeed} size={96} />
            </div>
          </div>

          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={() => setAvatarSeeds(getRandomSeeds(4))}
              className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-3 py-1.5 text-xs font-mono text-primary/70 shadow-sm transition-colors hover:bg-cream-warm"
            >
              <RotateCcw size={14} />
              刷新
            </button>
          </div>

          {/* 头像选择器 */}
          <AvatarSelector
            selectedSeed={selectedSeed}
            onSelect={setSelectedSeed}
            seeds={avatarSeeds}
          />
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 bg-gray-50 flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            取消
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSave}
            isLoading={isSaving}
            disabled={selectedSeed === currentAvatar}
          >
            <Check size={18} />
            <span>保存</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AvatarEditModal;
