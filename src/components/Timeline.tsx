import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card } from './Card';
import { DicebearAvatar } from './AvatarSelector';
import { User } from 'lucide-react';
import { SHAPE_OPTIONS, MOOD_OPTIONS } from '../services/supabaseApi';
import type { PooRecord } from '../types';
import type { User as UserType } from '../types';

interface TimelineItem {
  records: PooRecord[];
  date: Date;
}

interface TimelineProps {
  items: TimelineItem[];
  currentUser: UserType | null;
  partner: UserType | null;
}

export function Timeline({ items, currentUser, partner }: TimelineProps) {
  const getShapeInfo = (shapeId: string) => {
    return SHAPE_OPTIONS.find((s) => s.id === shapeId);
  };

  const getMoodInfo = (moodId: string) => {
    return MOOD_OPTIONS.find((m) => m.id === moodId);
  };

  const getUser = (userId: string) => {
    return userId === partner?.id ? partner : currentUser;
  };

  const formatLocalTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return format(date, 'HH:mm:ss');
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <div key={item.date.toISOString()}>
          <p className="text-xs text-primary/40 font-mono mb-3 px-1 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-primary/30" />
            {format(item.date, 'M月d日 EEEE', { locale: zhCN })}
          </p>

          <div className="space-y-3">
            {item.records.map((record) => {
              const shape = getShapeInfo(record.shapeId);
              const mood = getMoodInfo(record.moodId);
              const user = getUser(record.userId);

              return (
                <Card
                  key={record.id}
                  variant={record.userId === partner?.id ? 'partner' : 'default'}
                >
                  <div className="flex items-center gap-3">
                    {user?.avatar ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <DicebearAvatar seed={user.avatar} size={32} />
                      </div>
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
                        {formatLocalTime(record.timestamp)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Timeline;
