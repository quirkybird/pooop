import { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar, Clock, Check } from 'lucide-react';

interface TimelinePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

const PRESET_TIMES = [
  { label: '刚才', minutes: 0 },
  { label: '半小时前', minutes: 30 },
  { label: '1小时前', minutes: 60 },
  { label: '2小时前', minutes: 120 },
  { label: '今晨', minutes: -1 }, // 特殊处理
];

export function TimelinePicker({ value, onChange }: TimelinePickerProps) {
  const [showCustom, setShowCustom] = useState(false);

  const getIsPresetSelected = (minutes: number): boolean => {
    const now = new Date();
    let targetTime: Date;
    
    if (minutes === -1) {
      // 今晨 - 今天早上8点
      targetTime = new Date();
      targetTime.setHours(8, 0, 0, 0);
    } else {
      targetTime = new Date(now.getTime() - minutes * 60 * 1000);
    }
    
    // 比较时间（忽略秒）
    return (
      value.getHours() === targetTime.getHours() &&
      value.getMinutes() === targetTime.getMinutes() &&
      value.getDate() === targetTime.getDate()
    );
  };

  const handlePresetClick = (minutes: number) => {
    const now = new Date();
    if (minutes === -1) {
      // 今晨 - 设置为今天早上8点
      const morning = new Date();
      morning.setHours(8, 0, 0, 0);
      onChange(morning);
    } else {
      const time = new Date(now.getTime() - minutes * 60 * 1000);
      onChange(time);
    }
    setShowCustom(false);
  };

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    const newDate = new Date(value);
    newDate.setHours(hours, minutes);
    onChange(newDate);
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    const current = new Date(value);
    newDate.setHours(current.getHours(), current.getMinutes());
    onChange(newDate);
  };

  return (
    <div className="space-y-4">
      <p className="font-serif text-primary/60 text-sm mb-4">
        选择发生时间
      </p>

      {/* 预设时间按钮 */}
      <div className="grid grid-cols-3 gap-2">
        {PRESET_TIMES.map((preset) => {
          const isSelected = getIsPresetSelected(preset.minutes);
          return (
            <button
              key={preset.label}
              onClick={() => handlePresetClick(preset.minutes)}
              className={`px-3 py-2.5 rounded-xl text-xs font-mono border-2 transition-all duration-200 ${
                isSelected
                  ? 'bg-cream-light border-primary shadow-md'
                  : 'bg-cream-warm border-transparent text-primary hover:bg-cream-light hover:border-primary/20'
              }`}
            >
              {isSelected && <Check size={12} className="inline mr-1" />}
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* 自定义时间 */}
      <button
        onClick={() => setShowCustom(!showCustom)}
        className="w-full py-3 rounded-xl border-2 border-dashed border-primary/20 text-primary/60 text-sm font-mono hover:border-primary/40 hover:text-primary transition-all duration-200 flex items-center justify-center gap-2"
      >
        <Clock size={16} />
        {showCustom ? '收起自定义时间' : '自定义时间'}
      </button>

      {showCustom && (
        <div className="space-y-3 p-4 bg-cream-warm rounded-2xl">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-primary/40" />
            <input
              type="date"
              value={format(value, 'yyyy-MM-dd')}
              onChange={handleCustomDateChange}
              className="flex-1 bg-white rounded-xl px-3 py-2 text-sm font-mono text-primary border-2 border-transparent focus:border-primary-light focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-primary/40" />
            <input
              type="time"
              value={format(value, 'HH:mm')}
              onChange={handleCustomTimeChange}
              className="flex-1 bg-white rounded-xl px-3 py-2 text-sm font-mono text-primary border-2 border-transparent focus:border-primary-light focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* 显示当前选择 */}
      <div className="mt-4 p-4 bg-primary/5 rounded-2xl text-center">
        <p className="text-xs text-primary/50 font-mono mb-1">已选择</p>
        <p className="font-serif text-lg text-primary">
          {format(value, 'M月d日 HH:mm', { locale: zhCN })}
        </p>
      </div>
    </div>
  );
}

export default TimelinePicker;
