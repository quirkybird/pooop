import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
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
import { ReminderCardComponent } from '../components/ReminderCard';
import { DicebearAvatar } from '../components/AvatarSelector';
import { AvatarEditModal } from '../components/AvatarEditModal';
import { supabaseApi as api, SHAPE_OPTIONS, MOOD_OPTIONS } from '../services/supabaseApi';
import useExtendedStore from '../stores/useStore';
import type { PooRecord, HeartReaction } from '../types';

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
  
  // 爱心数据状态
  const [userHeartedRecords, setUserHeartedRecords] = useState<Set<string>>(new Set());
  const userHeartedRecordsRef = useRef(userHeartedRecords);
  
  // 保持 ref 同步
  useEffect(() => {
    userHeartedRecordsRef.current = userHeartedRecords;
  }, [userHeartedRecords]);
  
  // 浮动爱心动画状态
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: string; recordId: string; x: number; y: number }>>([]);
  
  // 正在处理中的记录（防止重复点击）
  const [processingHearts, setProcessingHearts] = useState<Set<string>>(new Set());
  
  // 今天收到的爱心
  const [receivedHearts, setReceivedHearts] = useState<HeartReaction[]>([]);
  
  const sortedTodayRecords = useMemo(() => {
    const combined = [
      ...todayRecords.map((record) => ({ record, isPartner: false })),
      ...partnerTodayRecords.map((record) => ({ record, isPartner: true })),
    ];

    return combined.sort(
      (a, b) => new Date(b.record.timestamp).getTime() - new Date(a.record.timestamp).getTime()
    );
  }, [todayRecords, partnerTodayRecords]);

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
          
          // 获取今天收到的爱心（来自伴侣的）
          const receivedHeartsRes = await api.reaction.getTodayReceivedHearts(userRes.data.id);
          if (receivedHeartsRes.success) {
            setReceivedHearts(receivedHeartsRes.data);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 加载爱心数据
  const loadHeartData = useCallback(async () => {
    if (!currentUser || sortedTodayRecords.length === 0) return;

    const recordIds = sortedTodayRecords.map(({ record }) => record.id);
    
    // 获取所有爱心反应，只检查当前用户是否点赞
    const reactionsRes = await api.reaction.getReactionsForRecords(recordIds);
    if (reactionsRes.success) {
      const userHearted = new Set<string>();
      
      reactionsRes.data.forEach((reaction) => {
        if (reaction.fromUserId === currentUser.id) {
          userHearted.add(reaction.recordId);
        }
      });
      
      setUserHeartedRecords(userHearted);
    }
  }, [currentUser, sortedTodayRecords]);

  // 处理爱心点击（乐观更新）
  const handleHeartClick = useCallback(async (recordId: string, toUserId: string, buttonElement: HTMLButtonElement | null) => {
    if (!currentUser) return;
    
    // 如果正在处理中，直接返回（防止重复点击）
    if (processingHearts.has(recordId)) return;
    
    // 标记为处理中
    setProcessingHearts((prev) => new Set(prev).add(recordId));

    const hasHearted = userHeartedRecordsRef.current.has(recordId);
    
    // 1. 乐观更新：立即改变前端状态
    if (hasHearted) {
      // 乐观取消点赞
      setUserHeartedRecords((prev) => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
    } else {
      // 乐观添加点赞
      setUserHeartedRecords((prev) => {
        const newSet = new Set(prev);
        newSet.add(recordId);
        return newSet;
      });
      
      // 触发浮动爱心动画
      if (buttonElement) {
        const rect = buttonElement.getBoundingClientRect();
        const heartId = `${recordId}-${Date.now()}`;
        setFloatingHearts((prev) => [...prev, { 
          id: heartId, 
          recordId, 
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        }]);
        
        // 动画结束后移除
        setTimeout(() => {
          setFloatingHearts((prev) => prev.filter((h) => h.id !== heartId));
        }, 1000);
      }
    }
    
    try {
      if (hasHearted) {
        // 2. 发送取消点赞请求
        const res = await api.reaction.remove(currentUser.id, toUserId, recordId);
        if (!res.success) {
          // 3. 失败回滚：恢复点赞状态
          setUserHeartedRecords((prev) => {
            const newSet = new Set(prev);
            newSet.add(recordId);
            return newSet;
          });
        }
      } else {
        // 2. 发送添加点赞请求
        const res = await api.reaction.create({
          fromUserId: currentUser.id,
          toUserId: toUserId,
          recordId: recordId,
        });
        if (!res.success || !res.data) {
          // 3. 失败回滚：取消点赞状态
          setUserHeartedRecords((prev) => {
            const newSet = new Set(prev);
            newSet.delete(recordId);
            return newSet;
          });
        }
      }
    } catch (error) {
      // 网络错误等异常情况，也回滚
      if (hasHearted) {
        setUserHeartedRecords((prev) => {
          const newSet = new Set(prev);
          newSet.add(recordId);
          return newSet;
        });
      } else {
        setUserHeartedRecords((prev) => {
          const newSet = new Set(prev);
          newSet.delete(recordId);
          return newSet;
        });
      }
    } finally {
      // 无论成功失败，都移除处理中标记
      setProcessingHearts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
    }
  }, [currentUser, processingHearts]);

  useEffect(() => {
    loadData();
  }, []);

  // 当记录数据加载完成后，加载爱心数据
  useEffect(() => {
    if (!isLoading && sortedTodayRecords.length > 0) {
      loadHeartData();
    }
  }, [isLoading, sortedTodayRecords, loadHeartData]);

  const getShapeInfo = (shapeId: string) => {
    return SHAPE_OPTIONS.find((s) => s.id === shapeId);
  };

  const getMoodInfo = (moodId: string) => {
    return MOOD_OPTIONS.find((m) => m.id === moodId);
  };

  // 生成宽慰话语 - 根据点赞数量和便便次数给出不同描述
  const getComfortMessage = (heartCount: number, partnerRecordCount: number): string => {
    // 结合爱心次数和便便次数来调侃
    
    // 高频率互动 + 高频率便便 = 调侃模式
    if (heartCount >= 5 && partnerRecordCount >= 3) {
      return "对方今天不仅跑厕所很勤快，给你点赞也很勤快呢，是怕你担心吗？😂";
    }
    
    if (heartCount >= 3 && partnerRecordCount >= 3) {
      return "今天便便次数和点赞次数都很多，对方是住在厕所里给你点赞吗？🚽💕";
    }
    
    // 便便多但爱心少
    if (partnerRecordCount >= 4 && heartCount <= 2) {
      return "对方今天跑了好几趟厕所，但只给你点了一两次赞，是不是忘了？😅";
    }
    
    // 爱心多但便便少（关心对方）
    if (heartCount >= 4 && partnerRecordCount === 0) {
      return "对方今天没记录 but 给你点了好多赞，是在默默关心你哦 🥺💗";
    }
    
    // 根据具体爱心数量
    switch (heartCount) {
      case 1:
        return partnerRecordCount > 0 
          ? "对方今天默默给你点了个赞，看来即使在忙碌中也在关注你哦 👀"
          : "对方今天默默给你点了个赞，看来有在关注你哦 👀";
      case 2:
        return "今天收到了两次爱心，对方好像对你挺上心的 💝";
      case 3:
        return "三次点赞，看来对方今天特别关注你的动态呢 ✨";
      case 4:
        return "四次爱心！对方今天很在意你的每一条记录 🥰";
      case 5:
        return "五次点赞，这份关心已经藏不住啦 💕";
      case 6:
        return "六次爱心！你们今天互动很频繁呢 💗";
      case 7:
        return "七次点赞，对方今天一直惦记着你呢 💘";
      case 8:
        return "八次爱心！这是什么神仙关注频率 🌟";
      case 9:
        return "九次点赞，对方今天眼里只有你了吧 👀💕";
      default:
        // 10次及以上
        if (heartCount >= 15) {
          return `今天收到了 ${heartCount} 次点赞！被无限宠爱的感觉真好 🥺💗`;
        } else if (heartCount >= 10) {
          return `今天收到了 ${heartCount} 次点赞！你们今天互动超频繁的 💑✨`;
        }
        return `今天收到了 ${heartCount} 次点赞！对方今天特别在意你呢 💖`;
    }
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
    const hasHearted = userHeartedRecords.has(record.id);
    const isProcessing = processingHearts.has(record.id);

    return (
      <Card
        key={record.id}
        variant={isPartner ? 'partner' : 'default'}
        className="mb-4 relative"
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
              <div className="flex items-center gap-2">
                {mood && (
                  <span className="text-xl" title={mood.label}>
                    {mood.emoji}
                  </span>
                )}
                {/* 只在伴侣记录上显示爱心按钮 */}
                {isPartner && (
                  <button
                    onClick={(e) => handleHeartClick(record.id, record.userId, e.currentTarget)}
                    disabled={isProcessing}
                    className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                      hasHearted
                        ? 'text-pink bg-pink/10'
                        : 'text-primary/30 hover:text-pink hover:bg-pink/10'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Heart
                      size={16}
                      className={`transition-transform duration-200 ${hasHearted ? 'fill-current' : ''}`}
                    />
                  </button>
                )}
              </div>
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
            <h1 className="font-serif text-2xl text-primary flex items-center gap-2">便便实况播报 <Heart size={20} className="text-pink" /></h1>
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
              <div className="flex items-center -space-x-2">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-cream-warm bg-cream-warm">
                  {currentUser?.avatar ? (
                    <DicebearAvatar seed={currentUser.avatar} size={40} />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center">
                      <User size={24} className="text-primary/60" />
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-cream-warm bg-cream-warm">
                  {partner.avatar ? (
                    <DicebearAvatar seed={partner.avatar} size={40} />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center">
                      <User size={24} className="text-primary/60" />
                    </div>
                  )}
                </div>
              </div>
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

        {/* 收到的爱心卡片 */}
        {receivedHearts.length > 0 && partner && (
          <div className="mb-6 p-5 bg-gradient-to-br from-pink/20 via-pink-soft/30 to-cream rounded-2xl border border-pink/30 shadow-lg shadow-pink/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md">
                {partner.avatar ? (
                  <DicebearAvatar seed={partner.avatar} size={44} />
                ) : (
                  <User size={24} className="text-pink" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-serif text-primary text-base mb-1">
                  {getComfortMessage(receivedHearts.length, partnerTodayRecords.length)}
                </p>
                <p className="text-sm text-primary/60 font-mono">
                  {partner.name} 今天给你点了 <span className="text-pink font-bold">{receivedHearts.length}</span> 个爱心
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
              {sortedTodayRecords.map(({ record, isPartner }) =>
                renderRecordCard(record, isPartner)
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

      {/* 浮动爱心动画 */}
      {floatingHearts.map((heart) => (
        <div
          key={heart.id}
          className="fixed pointer-events-none z-50"
          style={{
            left: `${heart.x}px`,
            top: `${heart.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Heart
            size={20}
            className="text-pink fill-pink animate-float-up"
          />
        </div>
      ))}

      {/* 浮动动画样式 */}
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translate(-50%, -50%) translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translateY(-80px) scale(1.3);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: floatUp 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default Home;
