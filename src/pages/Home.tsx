import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  Plus,
  UserPlus,
  Clock,
  Calendar,
  Toilet,
  Heart,
  User,
  MessageCircle,
  FileText,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { HeartButton } from '../components/HeartButton';
import { ReminderCardComponent } from '../components/ReminderCard';
import { DicebearAvatar } from '../components/AvatarSelector';
import { AvatarEditModal } from '../components/AvatarEditModal';
import { supabaseApi as api, SHAPE_OPTIONS, MOOD_OPTIONS } from '../services/supabaseApi';
import useExtendedStore from '../stores/useStore';
import type { PooRecord } from '../types';

export function Home() {
  const navigate = useNavigate();
  const {
    currentUser,
    partner,
    todayRecords,
    partnerTodayRecords,
    reminderCards,
    setCurrentUser,
    setPartner,
    setTodayRecords,
    setPartnerTodayRecords,
    setReminderCards,
    removeReminderCard,
  } = useExtendedStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 获取当前用户
      const userRes = await api.auth.getCurrentUser();
      if (userRes.success) {
        setCurrentUser(userRes.data);

        // 获取伴侣
        const partnerRes = await api.user.getPartner(userRes.data.id);
        if (partnerRes.success) {
          setPartner(partnerRes.data);

          // 获取我的记录
          const myRecords = await api.record.getTodayRecords(userRes.data.id);
          if (myRecords.success) {
            setTodayRecords(myRecords.data);
          }

          // 如果有伴侣，获取伴侣的记录
          if (partnerRes.data) {
            const partnerRecords = await api.record.getTodayRecords(partnerRes.data.id);
            if (partnerRecords.success) {
              setPartnerTodayRecords(partnerRecords.data);
            }
          }

          // 获取提醒卡片
          const reminderRes = await api.reminder.getCards(userRes.data.id);
          if (reminderRes.success) {
            setReminderCards(reminderRes.data);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getShapeInfo = (shapeId: string) => {
    return SHAPE_OPTIONS.find((s) => s.id === shapeId);
  };

  const getMoodInfo = (moodId: string) => {
    return MOOD_OPTIONS.find((m) => m.id === moodId);
  };

  const handleDismissReminder = (id: string) => {
    removeReminderCard(id);
  };

  const handleAvatarClick = () => {
    if (currentUser) {
      setShowAvatarModal(true);
    }
  };

  const handleAvatarUpdated = (newAvatar: string) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, avatar: newAvatar });
    }
  };

  const renderRecordCard = (
    record: PooRecord,
    isPartner: boolean = false
  ) => {
    const shape = getShapeInfo(record.shapeId);
    const mood = getMoodInfo(record.moodId);
    const user = isPartner ? partner : currentUser;

    return (
      <Card
        key={record.id}
        variant={isPartner ? 'partner' : 'default'}
        className="mb-4"
      >
        <div className="flex items-start gap-4">
          {/* 用户头像 */}
          <div className="w-12 h-12 rounded-full bg-cream-warm flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <DicebearAvatar seed={user.avatar} size={48} />
            ) : (
              <User size={24} className="text-primary/60" />
            )}
          </div>

          <div className="flex-1">
            {/* 头部信息 */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-serif text-primary">
                  {user?.name || (isPartner ? 'TA' : '我')}
                </span>
                <span className="text-xs text-primary/50 font-mono ml-2">
                  {format(new Date(record.timestamp), 'HH:mm')}
                </span>
              </div>
              {mood && (
                <span className="text-xl" title={mood.label}>
                  {mood.emoji}
                </span>
              )}
            </div>

            {/* 形状信息 */}
            {shape && (
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{shape.emoji}</span>
                <div>
                  <p className="font-medium text-primary text-sm">
                    {shape.label}
                  </p>
                  <p className="text-xs text-primary/50 font-mono">
                    {shape.description}
                  </p>
                </div>
              </div>
            )}

            {/* 备注 */}
            {record.note && (
              <p className="text-sm text-primary/70 font-mono mt-2 bg-cream-warm/50 p-2 rounded-xl flex items-center gap-2">
                <MessageCircle size={16} className="text-primary/50" />
                {record.note}
              </p>
            )}

            {/* 互动按钮 */}
            {isPartner && currentUser && (
              <div className="mt-3 flex justify-end">
                <HeartButton
                  record={record}
                  currentUserId={currentUser.id}
                  partnerId={partner?.id || ''}
                  initialCount={0}
                />
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (isLoading) {
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

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-cream/95 backdrop-blur-sm border-b border-primary/5 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-primary/50 mb-1">
              {format(new Date(), 'yyyy年M月d日 EEEE', { locale: zhCN })}
            </p>
            <h1 className="font-serif text-2xl text-primary flex items-center gap-2">今日便便 <Heart size={20} className="text-pink" /></h1>
          </div>
          <div className="flex items-center gap-2">
            {/* 当前用户信息 */}
            {currentUser && (
              <button
                onClick={handleAvatarClick}
                className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-primary/10 hover:shadow-md transition-shadow cursor-pointer"
              >
                {currentUser.avatar ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <DicebearAvatar seed={currentUser.avatar} size={32} />
                  </div>
                ) : (
                  <User size={20} className="text-primary/60" />
                )}
                <span className="font-mono text-sm text-primary font-medium">
                  {currentUser.name}
                </span>
              </button>
            )}
            {/* 绑定伴侣按钮 */}
            {!partner && (
              <button
                onClick={() => navigate('/bind')}
                className="p-2 rounded-full bg-pink-soft text-pink hover:bg-pink hover:text-white transition-colors"
                title="绑定伴侣"
              >
                <UserPlus size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* 温柔提醒卡片 */}
        {reminderCards.length > 0 && (
          <div className="mb-6 space-y-3">
            {reminderCards.map((card) => (
              <ReminderCardComponent
                key={card.id}
                card={card}
                onDismiss={handleDismissReminder}
              />
            ))}
          </div>
        )}

        {/* 伴侣信息 */}
        {partner && (
          <div className="mb-6 p-4 bg-gradient-to-r from-pink-soft to-cream rounded-2xl border border-pink/20">
            <div className="flex items-center gap-3">
              {partner.avatar ? (
               <div className="w-10 h-10 rounded-full overflow-hidden">
                 <DicebearAvatar seed={partner.avatar} size={40} />
               </div>
             ) : (
               <User size={32} className="text-primary/60" />
             )}
              <div>
                <p className="font-serif text-primary">
                  与 <span className="text-pink">{partner.name}</span> 甜蜜绑定中
                </p>
                <p className="text-xs text-primary/50 font-mono">
                  相互关心，记录每一天
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 今日记录 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg text-primary flex items-center gap-2">
              <Calendar size={18} />
              今日记录
            </h2>
            <span className="text-xs font-mono text-primary/50">
              {todayRecords.length + partnerTodayRecords.length} 条
            </span>
          </div>

          {todayRecords.length === 0 && partnerTodayRecords.length === 0 ? (
            <Card className="py-12 text-center">
              <div className="flex justify-center mb-4">
                <FileText size={48} className="text-primary/30" />
              </div>
              <p className="font-serif text-primary mb-2">还没有记录今天</p>
              <p className="text-sm text-primary/50 font-mono">
                点击下方按钮开始记录吧
              </p>
            </Card>
          ) : (
            <>
              {todayRecords.map((record) => renderRecordCard(record, false))}
              {partnerTodayRecords.map((record) =>
                renderRecordCard(record, true)
              )}
            </>
          )}
        </div>

        {/* 历史记录入口 */}
        <button
          onClick={() => navigate('/history')}
          className="w-full py-4 rounded-2xl bg-cream-warm text-primary font-mono text-sm hover:bg-cream-light transition-colors flex items-center justify-center gap-2"
        >
          <Clock size={16} />
          查看历史记录
        </button>
      </main>

      {/* 底部浮动按钮 */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/record')}
          className="shadow-2xl"
        >
          <Plus size={24} />
          <span>记录一下</span>
        </Button>
      </div>

      {/* 头像编辑弹窗 */}
      <AvatarEditModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        currentAvatar={currentUser?.avatar || 'Felix'}
        userId={currentUser?.id || ''}
        onAvatarUpdated={handleAvatarUpdated}
      />
    </div>
  );
}

export default Home;
