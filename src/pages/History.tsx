import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, ChevronLeft as PrevIcon, ChevronRight as NextIcon, BarChart3, Toilet, User, Inbox, RotateCcw } from 'lucide-react';

// 这些导入实际上都在使用，但可能在文件的后面部分
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card } from '../components/Card';
import { supabaseApi as api, SHAPE_OPTIONS, MOOD_OPTIONS } from '../services/supabaseApi';
import useExtendedStore from '../stores/useStore';
import type { PooRecord } from '../types';

export function History() {
  const navigate = useNavigate();
  const { currentUser, partner } = useExtendedStore();

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weekRecords, setWeekRecords] = useState<PooRecord[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // 周一开始

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    loadWeekRecords();
  }, [currentWeek, currentUser]);

  const loadWeekRecords = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      // 这里使用模拟数据，实际应该从API获取指定日期范围的记录
      // 现在使用今日记录作为示例
      const [myRecords, partnerRecords] = await Promise.all([
        api.record.getTodayRecords(currentUser.id),
        partner ? api.record.getTodayRecords(partner.id) : Promise.resolve({ success: true, data: [] }),
      ]);

      const allRecords = [
        ...(myRecords.success ? myRecords.data : []),
        ...(partnerRecords.success ? partnerRecords.data : []),
      ];

      setWeekRecords(allRecords);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecordsForDay = (day: Date) => {
    return weekRecords.filter((record) =>
      isSameDay(new Date(record.timestamp), day)
    );
  };

  const getShapeInfo = (shapeId: string) => {
    return SHAPE_OPTIONS.find((s) => s.id === shapeId);
  };

  const getMoodInfo = (moodId: string) => {
    return MOOD_OPTIONS.find((m) => m.id === moodId);
  };

  const prevWeek = () => {
    setCurrentWeek((prev) => addDays(prev, -7));
    setSelectedDay(null);
  };

  const nextWeek = () => {
    setCurrentWeek((prev) => addDays(prev, 7));
    setSelectedDay(null);
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
  };

  const handleShowAll = () => {
    setSelectedDay(null);
  };

  const isCurrentWeek = isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }));

  // 获取要显示的记录
  const displayRecords = selectedDay
    ? getRecordsForDay(selectedDay)
    : weekRecords;

  return (
    <div className="min-h-screen bg-cream p-4">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <ChevronLeft size={24} className="text-primary" />
        </button>
        <h1 className="font-serif text-2xl text-primary flex items-center gap-2">历史记录 <BarChart3 size={24} className="text-primary" /></h1>
      </header>

      {/* 周选择器 */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevWeek}
            className="p-2 rounded-full hover:bg-cream-warm transition-colors"
          >
            <PrevIcon size={20} className="text-primary" />
          </button>
          <div className="text-center">
            <p className="font-serif text-lg text-primary">
              {isCurrentWeek ? '本周' : format(weekStart, 'M月d日', { locale: zhCN })}
            </p>
            <p className="text-xs text-primary/50 font-mono">
              {format(weekStart, 'yyyy年')}
            </p>
          </div>
          <button
            onClick={nextWeek}
            className="p-2 rounded-full hover:bg-cream-warm transition-colors"
          >
            <NextIcon size={20} className="text-primary" />
          </button>
        </div>

        {/* 周历视图 */}
        <div className="grid grid-cols-7 gap-1">
          {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
            <div key={day} className="text-center py-2">
              <span className="text-xs text-primary/40 font-mono">{day}</span>
            </div>
          ))}
          {weekDays.map((day) => {
            const dayRecords = getRecordsForDay(day);
            const isToday = isSameDay(day, new Date());
            const hasRecords = dayRecords.length > 0;
            const isSelected = selectedDay && isSameDay(day, selectedDay);

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-pink text-white ring-2 ring-pink ring-offset-2'
                    : isToday
                    ? 'bg-primary text-white'
                    : hasRecords
                    ? 'bg-cream-warm hover:bg-cream'
                    : 'bg-cream-warm/50 hover:bg-cream-warm'
                }`}
              >
                <span
                  className={`text-sm font-mono ${
                    isSelected || isToday ? 'text-white' : 'text-primary'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {hasRecords && (
                  <div className="flex gap-0.5">
                    {dayRecords.slice(0, 3).map((record, idx) => {
                      const mood = getMoodInfo(record.moodId);
                      return (
                        <span key={idx} className="text-xs">
                          {mood?.emoji || '•'}
                        </span>
                      );
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* 详细记录 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg text-primary flex items-center gap-2">
            <Calendar size={18} />
            {selectedDay 
              ? format(selectedDay, 'M月d日', { locale: zhCN }) + '的记录'
              : (isCurrentWeek ? '本周记录' : '该周记录')
            }
          </h2>
          {selectedDay && (
            <button
              onClick={handleShowAll}
              className="flex items-center gap-1 text-sm text-primary/60 hover:text-primary font-mono"
            >
              <RotateCcw size={14} />
              显示全部
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <Toilet size={40} className="text-primary animate-bounce" />
            </div>
            <p className="font-mono text-primary/60">加载中...</p>
          </div>
        ) : displayRecords.length === 0 ? (
          <Card className="py-12 text-center">
            <div className="flex justify-center mb-4">
              <Inbox size={48} className="text-primary/30" />
            </div>
            <p className="font-serif text-primary mb-2">
              {selectedDay ? '这天还没有记录' : '这周还没有记录'}
            </p>
            <p className="text-sm text-primary/50 font-mono">
              {selectedDay ? '点击"显示全部"查看整周' : '记得每天记录哦'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {(selectedDay ? [selectedDay] : weekDays).map((day) => {
              const dayRecords = selectedDay 
                ? displayRecords 
                : getRecordsForDay(day);
              
              if (dayRecords.length === 0) return null;

              return (
                <div key={day.toISOString()}>
                  {!selectedDay && (
                    <p className="text-xs text-primary/40 font-mono mb-2 px-1">
                      {format(day, 'M月d日 EEEE', { locale: zhCN })}
                    </p>
                  )}
                  {dayRecords.map((record) => {
                    const shape = getShapeInfo(record.shapeId);
                    const mood = getMoodInfo(record.moodId);
                    const isPartner = record.userId === partner?.id;
                    const user = isPartner ? partner : currentUser;

                    return (
                      <Card
                        key={record.id}
                        variant={isPartner ? 'partner' : 'default'}
                        className="mb-3"
                      >
                        <div className="flex items-center gap-3">
                          {user?.avatar ? (
                           <span className="text-2xl">{user.avatar}</span>
                         ) : (
                           <User size={24} className="text-primary/60" />
                         )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {shape && (
                                <>
                                  <span>{shape.emoji}</span>
                                  <span className="text-sm font-medium text-primary">
                                    {shape.label}
                                  </span>
                                </>
                              )}
                              {mood && (
                                <span className="text-lg" title={mood.label}>
                                  {mood.emoji}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-primary/50 font-mono">
                              {format(new Date(record.timestamp), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
