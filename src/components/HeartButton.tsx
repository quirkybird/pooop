import { useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { api } from '../services/api';
import type { PooRecord } from '../types';

interface HeartButtonProps {
  record: PooRecord;
  currentUserId: string;
  partnerId: string;
  initialCount?: number;
}

export function HeartButton({
  record,
  currentUserId,
  partnerId,
  initialCount = 0,
}: HeartButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);

  const handleClick = useCallback(async () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setCount((prev) => prev + 1);

    // 添加浮动爱心动画
    const heartId = Date.now();
    setFloatingHearts((prev) => [...prev, heartId]);

    // 移除动画后的爱心
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((id) => id !== heartId));
    }, 1500);

    try {
      // 调用API记录爱心
      await api.reaction.create({
        fromUserId: currentUserId,
        toUserId: partnerId,
        recordId: record.id,
      });
    } catch (error) {
      console.error('Failed to send heart:', error);
    }

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, currentUserId, partnerId, record.id]);

  return (
    <button
      onClick={handleClick}
      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-soft text-pink hover:bg-pink hover:text-white transition-all duration-200 active:scale-95"
    >
      <Heart
        size={16}
        className={`transition-transform duration-300 ${
          isAnimating ? 'scale-125' : ''
        }`}
        fill={isAnimating ? 'currentColor' : 'none'}
      />
      <span className="text-xs font-mono font-medium">
        {count > 0 ? count : '我看到了'}
      </span>

      {/* 浮动爱心动画 */}
      {floatingHearts.map((id) => (
        <span
          key={id}
          className="absolute left-1/2 top-0 -translate-x-1/2 pointer-events-none animate-heart"
        >
          <Heart size={20} className="text-pink fill-pink" />
        </span>
      ))}
    </button>
  );
}

export default HeartButton;
