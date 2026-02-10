import { useMemo, useEffect } from 'react';
import { createAvatar } from '@dicebear/core';
import { thumbs } from '@dicebear/collection';

interface DicebearAvatarProps {
  seed: string;
  size?: number;
  className?: string;
}

export function DicebearAvatar({ seed, size = 64, className = '' }: DicebearAvatarProps) {
  const avatarSvg = useMemo(() => {
    const avatar = createAvatar(thumbs, {
      seed,
      size,
    });
    return avatar.toString();
  }, [seed, size]);

  return (
    <div
      className={`rounded-full overflow-hidden bg-cream-warm ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: avatarSvg }}
    />
  );
}

interface AvatarSelectorProps {
  selectedSeed: string;
  onSelect: (seed: string) => void;
  seeds?: string[];
}

// 预定义20个头像种子
const AVATAR_SEEDS_POOL = [
  'Felix',
  'Aneka',
  'Zack',
  'Molly',
  'Bella',
  'Leo',
  'Luna',
  'Max',
  'Nala',
  'Oliver',
  'Simba',
  'Charlie',
  'Lucy',
  'Cooper',
  'Rocky',
  'Daisy',
  'Bear',
  'Lily',
  'Milo',
  'Sadie',
];

//  Fisher-Yates 洗牌算法，随机选择4个
export function getRandomSeeds(count: number = 4): string[] {
  const shuffled = [...AVATAR_SEEDS_POOL];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export function AvatarSelector({ selectedSeed, onSelect, seeds }: AvatarSelectorProps) {
  // 使用 useMemo 随机选择4个头像，保持稳定性
  const randomSeeds = useMemo(() => seeds ?? getRandomSeeds(4), [seeds]);
  
  // 如果没有选中任何头像，默认选中第一个
  useEffect(() => {
    if (!selectedSeed || !randomSeeds.includes(selectedSeed)) {
      onSelect(randomSeeds[0]);
    }
  }, [randomSeeds, selectedSeed, onSelect]);

  return (
    <div className="space-y-3">
      <p className="font-serif text-primary/80 text-sm font-medium text-center">
        选择一个头像
      </p>
      <div className="flex justify-center gap-3">
        {randomSeeds.map((seed) => (
          <button
            type="button"
            key={seed}
            onClick={() => onSelect(seed)}
            className={`relative rounded-full p-1 transition-all duration-200 ${
              selectedSeed === seed
                ? 'ring-2 ring-pink ring-offset-2 bg-pink-soft'
                : 'hover:bg-cream-warm'
            }`}
          >
            <DicebearAvatar seed={seed} size={56} />
            {selectedSeed === seed && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-pink rounded-full flex items-center justify-center">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default { DicebearAvatar, AvatarSelector };
