import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Bell,
  Palette,
  Plus,
  Trash2,
  Clock,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ReminderCardComponent } from '../components/ReminderCard';
import { api, CARD_COLORS } from '../services/api';
import useExtendedStore from '../stores/useStore';
import type { ReminderSettings } from '../types';

export function Settings() {
  const navigate = useNavigate();
  const { currentUser, reminderCards, setReminderCards, addReminderCard } =
    useExtendedStore();

  const [settings, setSettings] = useState<ReminderSettings>({
    morningReminder: true,
    morningTime: '08:00',
    eveningReminder: true,
    eveningTime: '20:00',
    customReminder: false,
  });

  const [newCardText, setNewCardText] = useState('');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadSettings();
    }
  }, [currentUser]);

  const loadSettings = async () => {
    if (!currentUser) return;
    try {
      const response = await api.reminder.getSettings(currentUser.id);
      if (response.success) {
        setSettings(response.data);
      }

      const cardsRes = await api.reminder.getCards(currentUser.id);
      if (cardsRes.success) {
        setReminderCards(cardsRes.data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!currentUser) return;

    setIsSaving(true);
    try {
      await api.reminder.updateSettings(currentUser.id, settings);
      alert('设置已保存');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddReminderCard = async () => {
    if (!newCardText.trim() || !currentUser) return;

    try {
      const response = await api.reminder.createCard({
        userId: currentUser.id,
        message: newCardText.trim(),
        backgroundColor: selectedColor.bg,
        textColor: selectedColor.text,
        isActive: true,
      });

      if (response.success) {
        addReminderCard(response.data);
        setNewCardText('');
      }
    } catch (error) {
      console.error('Failed to create reminder card:', error);
      alert('创建失败，请重试');
    }
  };

  const handleDeleteCard = async (id: string) => {
    try {
      await api.reminder.deleteCard(id);
      setReminderCards(reminderCards.filter((card) => card.id !== id));
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  return (
    <div className="min-h-screen bg-cream p-4 pb-24">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <ChevronLeft size={24} className="text-primary" />
        </button>
        <h1 className="font-serif text-2xl text-primary">设置 ⚙️</h1>
      </header>

      {/* 提醒设置 */}
      <Card className="mb-6">
        <h2 className="font-serif text-lg text-primary mb-4 flex items-center gap-2">
          <Bell size={20} className="text-pink" />
          提醒设置
        </h2>

        {/* 早晨提醒 */}
        <div className="flex items-center justify-between py-3 border-b border-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cream-warm flex items-center justify-center">
              <span className="text-lg">🌅</span>
            </div>
            <div>
              <p className="font-medium text-primary text-sm">早晨提醒</p>
              <p className="text-xs text-primary/50 font-mono">
                开启新的一天
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={settings.morningTime}
              onChange={(e) =>
                setSettings({ ...settings, morningTime: e.target.value })
              }
              className="bg-cream-warm rounded-lg px-2 py-1 text-sm font-mono text-primary border-2 border-transparent focus:border-primary-light focus:outline-none"
            />
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  morningReminder: !settings.morningReminder,
                })
              }
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.morningReminder ? 'bg-primary' : 'bg-primary/20'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.morningReminder
                    ? 'translate-x-7'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 晚间提醒 */}
        <div className="flex items-center justify-between py-3 border-b border-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cream-warm flex items-center justify-center">
              <span className="text-lg">🌙</span>
            </div>
            <div>
              <p className="font-medium text-primary text-sm">晚间提醒</p>
              <p className="text-xs text-primary/50 font-mono">
                记录今天的状态
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={settings.eveningTime}
              onChange={(e) =>
                setSettings({ ...settings, eveningTime: e.target.value })
              }
              className="bg-cream-warm rounded-lg px-2 py-1 text-sm font-mono text-primary border-2 border-transparent focus:border-primary-light focus:outline-none"
            />
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  eveningReminder: !settings.eveningReminder,
                })
              }
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.eveningReminder ? 'bg-primary' : 'bg-primary/20'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.eveningReminder
                    ? 'translate-x-7'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 保存按钮 */}
        <Button
          variant="secondary"
          fullWidth
          onClick={handleSaveSettings}
          isLoading={isSaving}
          className="mt-4"
        >
          <Clock size={16} />
          <span>保存提醒设置</span>
        </Button>
      </Card>

      {/* 温柔提醒卡片管理 */}
      <Card className="mb-6">
        <h2 className="font-serif text-lg text-primary mb-4 flex items-center gap-2">
          <Palette size={20} className="text-pink" />
          温柔提醒卡片
        </h2>
        <p className="text-sm text-primary/60 font-mono mb-4">
          创建自定义的温柔提醒，会在首页显示给伴侣 💕
        </p>

        {/* 现有卡片列表 */}
        {reminderCards.length > 0 && (
          <div className="space-y-3 mb-6">
            {reminderCards.map((card) => (
              <div key={card.id} className="relative group">
                <ReminderCardComponent
                  card={card}
                  showDismiss={false}
                />
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white/50 text-primary/50 hover:text-red-500 hover:bg-white opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 创建新卡片 */}
        <div className="p-4 bg-cream-warm rounded-2xl">
          <p className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
            <Plus size={16} />
            创建新卡片
          </p>
          <input
            type="text"
            value={newCardText}
            onChange={(e) => setNewCardText(e.target.value)}
            placeholder="输入温柔的提醒内容..."
            className="w-full bg-white rounded-xl px-4 py-3 font-mono text-sm text-primary placeholder:text-primary/30 border-2 border-transparent focus:border-primary-light focus:outline-none mb-3"
          />

          {/* 颜色选择 */}
          <p className="text-xs text-primary/50 font-mono mb-2">选择颜色</p>
          <div className="flex gap-2 mb-4 flex-wrap">
            {CARD_COLORS.map((color, index) => (
              <button
                key={index}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedColor === color
                    ? 'border-primary scale-110'
                    : 'border-transparent'
                }`}
                style={{ backgroundColor: color.bg }}
              />
            ))}
          </div>

          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={handleAddReminderCard}
            disabled={!newCardText.trim()}
          >
            <Plus size={16} />
            <span>添加卡片</span>
          </Button>
        </div>
      </Card>

      {/* 关于 */}
      <div className="text-center py-6">
        <p className="text-3xl mb-2">💩</p>
        <p className="font-serif text-primary mb-1">Pooop</p>
        <p className="text-xs text-primary/40 font-mono">
          情侣便便记录工具 v1.0
        </p>
        <p className="text-xs text-primary/30 font-mono mt-2">
          用温柔的方式记录每一天 💕
        </p>
      </div>
    </div>
  );
}

export default Settings;
