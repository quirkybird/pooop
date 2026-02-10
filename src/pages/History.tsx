import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, ChevronLeft as PrevIcon, ChevronRight as NextIcon, BarChart3, Toilet, Inbox, RotateCcw } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card } from '../components/Card';
import { Timeline } from '../components/Timeline';
import { supabaseApi as api, MOOD_OPTIONS } from '../services/supabaseApi';
import useExtendedStore from '../stores/useStore';
import type { PooRecord } from '../types';

export function History() {
  const navigate = useNavigate();
  const { currentUser, partner } = useExtendedStore();

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weekRecords, setWeekRecords] = useState<PooRecord[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const didInitSelectRef = useRef(false);

  const weekStart = useMemo(() => startOfWeek(currentWeek, { weekStartsOn: 1 }), [currentWeek]);
  const weekEnd = useMemo(() => endOfWeek(currentWeek, { weekStartsOn: 1 }), [currentWeek]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const isCurrentWeek = useMemo(
    () => isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 })),
    [weekStart]
  );

  const loadWeekRecords = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [myRecords, partnerRecords] = await Promise.all([
        api.record.getRecordsByDateRange(currentUser.id, weekStart, weekEnd),
        partner ? api.record.getRecordsByDateRange(partner.id, weekStart, weekEnd) : Promise.resolve({ success: true, data: [] }),
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
  }, [currentUser, partner, weekStart, weekEnd]);

  useEffect(() => {
    if (currentUser) {
      loadWeekRecords();
    } else {
      setIsLoading(false);
    }
  }, [currentUser, loadWeekRecords]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    if (!didInitSelectRef.current && !selectedDay && isCurrentWeek) {
      setSelectedDay(new Date());
      didInitSelectRef.current = true;
    }
  }, [currentUser, selectedDay, isCurrentWeek]);

  const getRecordsForDay = useCallback((day: Date) => {
    return weekRecords.filter((record) => isSameDay(new Date(record.timestamp), day));
  }, [weekRecords]);

  const prevWeek = () => {
    setCurrentWeek((prev) => addDays(prev, -7));
    setSelectedDay(null);
  };

  const nextWeek = () => {
    setCurrentWeek((prev) => addDays(prev, 7));
    setSelectedDay(null);
  };

  const handleDayClick = async (day: Date) => {
    if (selectedDay && isSameDay(day, selectedDay)) {
      setSelectedDay(null);
    } else {
      setSelectedDay(day);
    }
  };

  const handleShowAll = () => {
    setSelectedDay(null);
  };

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
              {isCurrentWeek ? '本周' : format(weekStart, 'M月', { locale: zhCN })}
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
        <div className="grid grid-cols-7 gap-2">
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
            const latestMoodByUser = dayRecords.reduce<Map<string, string>>((acc, record) => {
              const ts = new Date(record.timestamp).getTime();
              const prev = acc.get(record.userId);
              if (!prev || ts > new Date(prev).getTime()) {
                acc.set(record.userId, record.timestamp);
              }
              return acc;
            }, new Map());

            const latestMoodForUser = (userId?: string) => {
              if (!userId) return null;
              const latestTimestamp = latestMoodByUser.get(userId);
              if (!latestTimestamp) return null;
              const latestRecord = dayRecords
                .filter((record) => record.userId === userId)
                .reduce<PooRecord | null>((latest, record) => {
                  if (!latest) return record;
                  return new Date(record.timestamp) > new Date(latest.timestamp) ? record : latest;
                }, null);
              return latestRecord ? MOOD_OPTIONS.find((m) => m.id === latestRecord.moodId)?.emoji || '•' : null;
            };

            const myMoodEmoji = latestMoodForUser(currentUser?.id);
            const partnerMoodEmoji = latestMoodForUser(partner?.id);
            const moodEmojis = [myMoodEmoji, partnerMoodEmoji].filter(Boolean) as string[];

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
                    {moodEmojis.map((emoji, idx) => (
                      <span key={idx} className="text-xs">
                        {emoji}
                      </span>
                    ))}
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
        ) : selectedDay ? (
          <Timeline
            items={[{ date: selectedDay, records: displayRecords }]}
            currentUser={currentUser}
            partner={partner}
          />
        ) : (
          <Timeline
            items={weekDays
              .map((day) => ({
                date: day,
                records: getRecordsForDay(day),
              }))
              .filter((item) => item.records.length > 0)}
            currentUser={currentUser}
            partner={partner}
          />
        )}
      </div>
    </div>
  );
}

export default History;
