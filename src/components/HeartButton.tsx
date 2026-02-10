import { useState, useCallback, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabaseApi as api } from '../services/supabaseApi';
import type { PooRecord } from '../types';

interface HeartButtonProps {
  record: PooRecord;
  currentUserId: string;
  partnerId: string;
}

export function HeartButton({
  record,
  currentUserId,
  partnerId,
}: HeartButtonProps) {
  const [hasReacted, setHasReacted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHeartData = async () => {
      try {
        const reactedRes = await api.reaction.hasReacted(currentUserId, record.id);
        if (reactedRes.success) {
          setHasReacted(reactedRes.data);
        }
      } catch (error) {
        console.error('Failed to load heart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHeartData();
  }, [record.id, currentUserId]);

  const handleClick = useCallback(async () => {
    if (isAnimating || isLoading) return;

    setIsAnimating(true);

    if (hasReacted) {
      setHasReacted(false);
      try {
        const res = await api.reaction.remove(currentUserId, partnerId, record.id);
        if (!res.success || !res.data) {
          throw new Error('No heart reaction removed');
        }
      } catch (error) {
        console.error('Failed to remove heart:', error);
        setHasReacted(true);
      } finally {
        setTimeout(() => {
          setIsAnimating(false);
        }, 200);
      }
      return;
    }

    setHasReacted(true);

    const heartId = Date.now();
    setFloatingHearts((prev) => [...prev, heartId]);

    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((id) => id !== heartId));
    }, 1500);

    try {
      await api.reaction.create({
        fromUserId: currentUserId,
        toUserId: partnerId,
        recordId: record.id,
      });
    } catch (error) {
      console.error('Failed to send heart:', error);
      setHasReacted(false);
    } finally {
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
  }, [isAnimating, isLoading, hasReacted, currentUserId, partnerId, record.id]);

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      aria-pressed={hasReacted}
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95 ${
        hasReacted
          ? 'bg-pink text-white'
          : 'bg-pink-soft text-pink hover:bg-pink hover:text-white'
      }`}
    >
      <Heart
        size={16}
        className={`transition-transform duration-300 ${
          isAnimating ? 'scale-125' : ''
        }`}
        fill={hasReacted || isAnimating ? 'currentColor' : 'none'}
      />
      <span className="text-xs font-mono font-medium">
        {hasReacted ? '已送达' : '送爱心'}
      </span>

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
